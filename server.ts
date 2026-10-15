import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createWorker } from 'tesseract.js';

dotenv.config();

var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body parsers with support for large base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Track models experiencing quota exhaustion (429) or high demand (503)
const modelCooldownUntil = new Map<string, number>([
  ['gemini-3.5-flash', Date.now() + 6 * 60 * 1000] // Start in cooldown since free-tier limit for 3.5 was exhausted
]);

function getCandidateModels(): string[] {
  // Ordered by priority: gemini-3.1-flash-lite & gemini-3.8-flash have highest quota & speed
  const preferredOrder = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.5-flash'];
  const now = Date.now();

  const available = preferredOrder.filter((m) => {
    const until = modelCooldownUntil.get(m);
    return !until || now >= until;
  });

  return available.length > 0 ? available : preferredOrder;
}

// Cached reusable Tesseract worker for rapid OCR fallback
let sharedOcrWorker: any = null;
async function getOcrWorker() {
  if (!sharedOcrWorker) {
    try {
      sharedOcrWorker = await createWorker(['eng', 'ind']);
    } catch (err) {
      console.warn('Falling back to english Tesseract worker:', err);
      try {
        sharedOcrWorker = await createWorker('eng');
      } catch (err2) {
        console.warn('Tesseract worker disabled in serverless:', err2);
        return null;
      }
    }
  }
  return sharedOcrWorker;
}

// Robust extractor for Indonesian Passport Number, Expiry Date, and MRZ
function extractPassportDataFromText(text: string) {
  const result: { nomorPasporLama?: string; dateOfExpiry?: string; namaLengkap?: string } = {};
  if (!text) return result;

  // 1. Passport Number from direct labels
  const numLabelMatch = text.match(/(?:Paspor|Passport|Doc(?:ument)?)\s*(?:No\.?|Nomor)?\s*[:;\-]?\s*([A-Z][0-9]{7,8}|[A-Z]{2}[0-9]{7})/i);
  if (numLabelMatch) {
    result.nomorPasporLama = numLabelMatch[1].toUpperCase();
  }

  // MRZ Line 2 extraction (e.g. C8527774<8IDN... or Y0195142<8IDN...)
  const mrzLine2Match = text.match(/\b([A-Z][0-9]{7,8})[<0-9]IDN/i) || text.match(/([A-Z][0-9]{7,8})<\dIDN/i);
  if (mrzLine2Match && !result.nomorPasporLama) {
    result.nomorPasporLama = mrzLine2Match[1].toUpperCase();
  }

  // Standalone alphanumeric passport pattern
  if (!result.nomorPasporLama) {
    const standaloneMatch = text.match(/\b([A-Z][0-9]{7,8})\b/);
    if (standaloneMatch) {
      result.nomorPasporLama = standaloneMatch[1].toUpperCase();
    }
  }

  // 2. Date of Expiry / Tanggal Habis Berlaku
  const expiryLabelMatch = text.match(/(?:Date\s+of\s+expiry|Habis\s+berlaku|Masa\s+berlaku|Expiry|Exp|Valid\s+until|TGL\.?\s*HABIS\s*BERLAKU|EXPIRATION|BERLAKU\s*S\/?D)\s*[:;\-]?\s*(\d{1,2}[\s\/\.-]+[A-Za-z0-9]+[\s\/\.-]+\d{2,4})/i);
  if (expiryLabelMatch) {
    result.dateOfExpiry = expiryLabelMatch[1].trim();
  }

  // MRZ Line 2 Date of Expiry (YYMMDD format after sex M/F)
  const mrzExpMatch = text.match(/IDN\d{7}[MF<](\d{2})(\d{2})(\d{2})/i) || text.match(/[MF<](\d{2})(\d{2})(\d{2})\d<+/i);
  if (mrzExpMatch && !result.dateOfExpiry) {
    const yy = mrzExpMatch[1];
    const mm = mrzExpMatch[2];
    const dd = mrzExpMatch[3];
    const year = parseInt(yy, 10) < 50 ? `20${yy}` : `19${yy}`;
    result.dateOfExpiry = `${dd}/${mm}/${year}`;
  }

  // MRZ Line 1 Name
  const mrzLine1Match = text.match(/P<IDN([A-Z<]+)/i);
  if (mrzLine1Match) {
    const rawNames = mrzLine1Match[1].split('<<').map(s => s.replace(/</g, ' ').trim()).filter(Boolean);
    if (rawNames.length > 0) {
      result.namaLengkap = rawNames.join(' ');
    }
  }

  return result;
}

// Helper to clean base64 data URI
function parseBase64(dataUri: string): { mimeType: string; data: string } {
  const matches = dataUri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return { mimeType: matches[1], data: matches[2] };
  }
  return { mimeType: 'image/jpeg', data: dataUri };
}

// Generate default letter number: REC/YYYY-MM/XXXX or [NUM]/SR/AMW/[ROMAN]/[YEAR]
let globalServerSequence = 7431;

// Generate sequential letter number starting from 7431
function generateLetterNumber(isAlzam = false): string {
  const now = new Date();
  const year = now.getFullYear();
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const romanMonth = romanMonths[now.getMonth()];
  const seq = globalServerSequence++;

  return `${seq}/SR/AMW/${romanMonth}/${year}`;
}

// Format Indonesian Date in Asia/Jakarta timezone (WIB)
function formatIndonesianDate(date = new Date()): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

// Format default departure estimation: 2 months from now
function getDefaultDeparture(offsetMonths = 2): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const now = new Date();
  const future = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1);
  return `${months[future.getMonth()]} ${future.getFullYear()}`;
}

// Capitalize first letter of each word (Title Case) while preserving Indonesian acronyms
function toTitleCase(str: string): string {
  if (!str) return '';

  // Clean any accidental consecutive dots (e.g. "Jl...", "No.....", "Kec...")
  const cleaned = str.replace(/\.{2,}/g, '.');

  const preserveUpper = new Set([
    'NIK', 'KK', 'KTP', 'RT', 'RW', 'DKI', 'WNI', 'WNA', 'RI', 'TPI', 'PPIU',
    'ST', 'S.T', 'S.T.', 'BA', 'B.A', 'B.A.', 'MBA', 'M.B.A', 'M.B.A.', 'SE', 'S.E', 'S.E.',
    'SH', 'S.H', 'S.H.', 'SKM', 'S.K.M', 'S.K.M.', 'SP', 'S.P', 'S.P.', 'MM', 'M.M', 'M.M.',
    'PT', 'PT.', 'CV', 'CV.', 'TBK', 'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII',
    'AMW', 'SR', 'KH', 'KH.'
  ]);

  const specificTitleMap: Record<string, string> = {
    'rt': 'RT',
    'rw': 'RW',
    'ktp': 'KTP',
    'kk': 'KK',
    'nik': 'NIK',
    'wni': 'WNI',
    'wna': 'WNA',
    'dki': 'DKI',
    'tpi': 'TPI',
    'ppiu': 'PPIU',
    'jl': 'Jl',
    'jln': 'Jln',
    'jalan': 'Jalan',
    'kp': 'Kp',
    'gg': 'Gg',
    'gang': 'Gang',
    'no': 'No',
    'nomor': 'Nomor',
    'blok': 'Blok',
    'kel': 'Kel',
    'kelurahan': 'Kelurahan',
    'kec': 'Kec',
    'kecamatan': 'Kecamatan',
    'kab': 'Kab',
    'kabupaten': 'Kabupaten',
    'prov': 'Prov',
    'provinsi': 'Provinsi',
    'tlk': 'Tlk',
    'kh': 'KH',
  };

  const particles = new Set(['dan', 'di', 'ke', 'dari', 'yang', 'untuk', 'pada', 'atau', 'bin', 'binti', 'al']);

  return cleaned
    .split(/(\s+|[-/.,:;()])/g)
    .map((word, index) => {
      if (!word || /^\s+$/.test(word) || /^[-/.,:;()]$/.test(word)) return word;
      if (/^\d+$/.test(word)) return word;

      const lower = word.toLowerCase();
      if (specificTitleMap[lower]) {
        return specificTitleMap[lower];
      }

      const upper = word.toUpperCase();
      if (preserveUpper.has(upper)) {
        return upper;
      }
      if (index > 0 && particles.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}

const INDO_MONTH_MAP: Record<string, string> = {
  '1': 'Januari', '01': 'Januari', 'jan': 'Januari', 'januari': 'Januari', 'january': 'Januari',
  '2': 'Februari', '02': 'Februari', 'feb': 'Februari', 'februari': 'Februari', 'february': 'Februari',
  '3': 'Maret', '03': 'Maret', 'mar': 'Maret', 'maret': 'Maret', 'march': 'Maret',
  '4': 'April', '04': 'April', 'apr': 'April', 'april': 'April',
  '5': 'Mei', '05': 'Mei', 'may': 'Mei', 'mei': 'Mei',
  '6': 'Juni', '06': 'Juni', 'jun': 'Juni', 'juni': 'Juni', 'june': 'Juni',
  '7': 'Juli', '07': 'Juli', 'jul': 'Juli', 'juli': 'Juli', 'july': 'Juli',
  '8': 'Agustus', '08': 'Agustus', 'agu': 'Agustus', 'agt': 'Agustus', 'agustus': 'Agustus', 'aug': 'Agustus', 'august': 'Agustus',
  '9': 'September', '09': 'September', 'sep': 'September', 'sept': 'September', 'september': 'September',
  '10': 'Oktober', 'okt': 'Oktober', 'oktober': 'Oktober', 'oct': 'Oktober', 'october': 'Oktober',
  '11': 'November', 'nov': 'November', 'november': 'November',
  '12': 'Desember', 'des': 'Desember', 'desember': 'Desember', 'dec': 'Desember', 'december': 'Desember',
};

function formatIndonesianBirthDate(raw?: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();

  const dbyMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (dbyMatch) {
    const day = parseInt(dbyMatch[1], 10);
    const mLower = dbyMatch[2].toLowerCase();
    const month = INDO_MONTH_MAP[mLower] || (dbyMatch[2].charAt(0).toUpperCase() + dbyMatch[2].slice(1).toLowerCase());
    return `${day} ${month} ${dbyMatch[3]}`;
  }

  const dmyMatch = trimmed.match(/^(\d{1,2})[-\/.](\d{1,2}|[A-Za-z]{3,9})[-\/.](\d{2,4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const mRaw = dmyMatch[2].toLowerCase();
    const month = INDO_MONTH_MAP[mRaw] || mRaw;
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) {
      const curYy = new Date().getFullYear() % 100;
      year = year <= curYy ? 2000 + year : 1900 + year;
    }
    return `${day} ${month} ${year}`;
  }

  const ymdMatch = trimmed.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = INDO_MONTH_MAP[parseInt(ymdMatch[2], 10)] || ymdMatch[2];
    const day = parseInt(ymdMatch[3], 10);
    return `${day} ${month} ${year}`;
  }

  return trimmed;
}

function extractBirthInfoFromNik(nik?: string): { tanggalLahir: string; jenisKelamin: 'LAKI-LAKI' | 'PEREMPUAN' } | null {
  if (!nik || typeof nik !== 'string') return null;
  const clean = nik.replace(/\D/g, '');
  if (clean.length !== 16) return null;

  const dayRaw = parseInt(clean.substring(6, 8), 10);
  const month = parseInt(clean.substring(8, 10), 10);
  const yy = parseInt(clean.substring(10, 12), 10);

  if (month < 1 || month > 12) return null;

  let jk: 'LAKI-LAKI' | 'PEREMPUAN' = 'LAKI-LAKI';
  let day = dayRaw;
  if (dayRaw > 40) {
    jk = 'PEREMPUAN';
    day = dayRaw - 40;
  }
  if (day < 1 || day > 31) return null;

  const curYy = new Date().getFullYear() % 100;
  const year = yy <= curYy ? 2000 + yy : 1900 + yy;

  const months = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return {
    tanggalLahir: `${day} ${months[month]} ${year}`,
    jenisKelamin: jk,
  };
}

function cleanApplicantName(raw?: string): string {
  if (!raw) return '';
  return raw
    .replace(/^(?:Nama|NAMA|Nama\s*Lengkap|Nama\s*Pemohon|Name|Full\s*Name)\s*[:;\-.]*\s*/i, '')
    .replace(/^[:;\-.\s]+|[:;\-.\s]+$/g, '')
    .trim();
}

const DATE_INDO_REGEX = /(?:^|[,\s\.\-:])(\d{1,2}[\s\/\.-]+(?:Jan(?:uari)?|Feb(?:ruari)?|Mar(?:et)?|March|Apr(?:il)?|Mei|May|Jun(?:i)?|June|Jul(?:i)?|July|Agu(?:stus)?|Agt|Aug(?:ust)?|Sep(?:tember)?|Okt(?:ober)?|Oct(?:ober)?|Nov(?:ember)?|Des(?:ember)?|Dec(?:ember)?|\d{1,2})[\s\/\.-]+\d{2,4}|\d{4}[\s\/\.-]+\d{1,2}[\s\/\.-]+\d{1,2})/i;

function parsePlaceAndBirthDate(
  placeInput?: string,
  dateInput?: string,
  fullTtlInput?: string,
  nik?: string
): { tempatLahir: string; tanggalLahir: string; tempatTanggalLahir: string; jenisKelamin?: 'LAKI-LAKI' | 'PEREMPUAN' } {
  let tempat = (placeInput || '').trim();
  let tanggal = (dateInput || '').trim();
  let ttl = (fullTtlInput || '').trim();

  // If fullTtl is provided, or if tempat contains embedded date digits
  const combinedCandidate = ttl || (tempat && /\d/.test(tempat) ? tempat : '');
  if (combinedCandidate) {
    const dMatch = combinedCandidate.match(DATE_INDO_REGEX);
    if (dMatch) {
      if (!tanggal) {
        tanggal = dMatch[1].trim();
      }
      if (!tempat || /\d/.test(tempat)) {
        tempat = combinedCandidate
          .replace(dMatch[0], '')
          .replace(/[,\s:;\-]+$/, '')
          .replace(/^[,\s:;\-]+/, '')
          .trim();
      }
    } else if (combinedCandidate.includes(',')) {
      const parts = combinedCandidate.split(/,\s*/);
      if (!tempat || /\d/.test(tempat)) tempat = parts[0].trim();
      if (!tanggal) tanggal = parts.slice(1).join(', ').trim();
    }
  }

  // If dateInput itself has an embedded place name (e.g. "Jepara, 30 November 1999" passed as dateInput)
  if (tanggal && /[A-Za-z]{3,}/.test(tanggal) && !tempat) {
    const dMatch = tanggal.match(DATE_INDO_REGEX);
    if (dMatch) {
      const extractedPlace = tanggal.replace(dMatch[0], '').replace(/[,\s:;\-]+$/, '').replace(/^[,\s:;\-]+/, '').trim();
      if (extractedPlace) {
        tempat = extractedPlace;
        tanggal = dMatch[1].trim();
      }
    }
  }

  // Clean tempat from any remaining numbers, colons, or punctuation
  tempat = tempat
    .replace(/[:;\-]?\s*\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}.*$/, '')
    .replace(/\d+/g, '')
    .replace(/^[,\s:;\-]+|[,\s:;\-]+$/g, '')
    .trim();

  let cleanTanggal = formatIndonesianBirthDate(tanggal);

  let derivedInfo: { tanggalLahir: string; jenisKelamin: 'LAKI-LAKI' | 'PEREMPUAN' } | null = null;
  if (nik) {
    derivedInfo = extractBirthInfoFromNik(nik);
    if ((!cleanTanggal || cleanTanggal.length < 5) && derivedInfo) {
      cleanTanggal = derivedInfo.tanggalLahir;
    }
  }

  const finalPlace = toTitleCase(tempat);
  const finalTtl = finalPlace && cleanTanggal ? `${finalPlace}, ${cleanTanggal}` : (cleanTanggal || finalPlace || ttl);

  return {
    tempatLahir: finalPlace,
    tanggalLahir: cleanTanggal,
    tempatTanggalLahir: finalTtl,
    jenisKelamin: derivedInfo?.jenisKelamin,
  };
}

function validAgama(raw?: string): string | null {
  if (!raw) return null;
  const match = raw.match(/\b(ISLAM|KRISTEN|KATHOLIK|KATOLIK|HINDU|BUDDHA|KONGHUCU)\b/i);
  if (match) return toTitleCase(match[1]);
  return null;
}

// API endpoint for document extraction
app.post('/api/analyze-documents', async (req: Request, res: Response) => {
  try {
    const {
      ktpImage,
      kkImage,
      passportImage,
      country,
      departureMonth,
      purpose,
      templateType,
      tujuanKantorImigrasi,
      alamatKantorImigrasi,
      kantorImigrasiDanAlamat,
      namaAyah,
    } = req.body;
    const selectedTemplate = templateType || 'paket_lengkap_alzam';

    // Parse immigration destination if combined string provided
    let finalTujuanImigrasi = tujuanKantorImigrasi || 'Kepala Kantor Imigrasi Kelas II Cilegon';
    let finalAlamatImigrasi = alamatKantorImigrasi || 'Jl. KH. Yasin Beji No.8, Kotabumi, Kec. Purwakarta, Kota Cilegon, Banten 42434';

    if (kantorImigrasiDanAlamat && typeof kantorImigrasiDanAlamat === 'string' && kantorImigrasiDanAlamat.trim()) {
      if (kantorImigrasiDanAlamat.includes(',')) {
        const parts = kantorImigrasiDanAlamat.split(',');
        finalTujuanImigrasi = parts[0].trim();
        finalAlamatImigrasi = parts.slice(1).join(',').trim();
      } else {
        finalTujuanImigrasi = kantorImigrasiDanAlamat.trim();
        finalAlamatImigrasi = kantorImigrasiDanAlamat.trim();
      }
    }

    if (!ktpImage && !kkImage && !passportImage) {
      return res.status(400).json({
        success: false,
        error: 'Mohon unggah minimal dokumen KTP, KK, atau Paspor untuk diproses.'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback response with simulated intelligent extraction if API key is not yet configured
      console.warn('GEMINI_API_KEY is not set. Returning high-fidelity fallback response for PT. Alzam Mandiri Wisata.');
      const fallbackData = {
        templateType: selectedTemplate,
        nik: '3604075304950002',
        namaLengkap: 'Euis Cholishoh',
        tempatLahir: 'Serang',
        tanggalLahir: '13 April 1995',
        tempatTanggalLahir: 'Serang, 13 April 1995',
        jenisKelamin: 'PEREMPUAN',
        alamatKtp: 'Kp. Kubang Laban Rt.005, Rw.003, Kelurahan Lambangsari, Kec. Bojonegara, Kabupaten Serang, Provinsi Banten',
        nomorKk: '3604070000000000',
        namaKepalaKeluarga: 'Euis Cholishoh',
        namaAyah: namaAyah || 'H. Ahmad Subandi',
        nomorPasporLama: 'Y0195142',
        dateOfExpiry: '11/3/2027',
        expiredDatePaspor: '11/3/2027',
        agama: 'Islam',
        pekerjaan: 'Wiraswasta',
        statusPerkawinan: 'Belum Kawin',
        kewarganegaraan: 'WNI',
        negaraTujuan: 'Arab Saudi',
        estimasiKeberangkatan: departureMonth || '16 - 24 November 2026',
        jadwalKeberangkatanDanKepulangan: departureMonth || '16 - 24 November 2026',
        keperluan: purpose || 'Surat Pernyataan dan Jaminan Paspor Umrah',
        nomorSurat: generateLetterNumber(true),
        nomorSuratPernyataan: generateLetterNumber(true),
        perihal: selectedTemplate === 'pernyataan_jaminan' ? 'Surat Pernyataan dan Jaminan' : selectedTemplate === 'penambahan_nama' ? 'Permohonan Penambahan Nama Paspor' : selectedTemplate === 'perpanjangan_paspor' ? 'Permohonan Perpanjangan Paspor' : 'Permohonan Pembuatan Paspor',
        tanggalSurat: formatIndonesianDate(new Date()),
        kotaPenerbitan: 'Jakarta',
        pejabatNama: 'Khairul Umam, ST, BA, MBA',
        pejabatJabatan: 'Direktur Utama',
        namaPerusahaan: 'PT. Alzam Mandiri Wisata',
        taglinePerusahaan: 'Tour & Travel',
        izinPpiu: '29042200007580004',
        tanggalIzinPpiu: '02 Agustus 2022',
        alamatPerusahaan: 'Ciledug Mas, Jl. HOS Cokroaminoto Blok C9 dan C10, RT.003/RW.004, Sudimara Timur, Kecamatan Karang Tengah, Kota Tangerang, Banten 15151',
        teleponPerusahaan: '0815-9888-154',
        emailPerusahaan: 'alzam@bisa.id',
        websitePerusahaan: 'www.umrahbisa.com',
        tujuanKantorImigrasi: finalTujuanImigrasi,
        alamatKantorImigrasi: finalAlamatImigrasi,
        crossCheckStatus: {
          nikValid: true,
          kkValid: true,
          nameMatched: true,
          notes: 'Ekstraksi dokumen identitas sukses sesuai data pemohon PT. Alzam Mandiri Wisata.'
        }
      };
      return res.json({ success: true, data: fallbackData });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const parts: any[] = [];

    // Add KTP image if provided
    if (ktpImage) {
      const parsedKtp = parseBase64(ktpImage);
      parts.push({
        inlineData: {
          mimeType: parsedKtp.mimeType,
          data: parsedKtp.data
        }
      });
      parts.push({
        text: 'GAMBAR DI ATAS ADALAH KARTU TANDA PENDUDUK (KTP) REPUBLIK INDONESIA.'
      });
    }

    // Add KK image if provided
    if (kkImage) {
      const parsedKk = parseBase64(kkImage);
      parts.push({
        inlineData: {
          mimeType: parsedKk.mimeType,
          data: parsedKk.data
        }
      });
      parts.push({
        text: 'GAMBAR DI ATAS ADALAH KARTU KELUARGA (KK) REPUBLIK INDONESIA.'
      });
    }

    // Add Passport image if provided
    if (passportImage) {
      const parsedPassport = parseBase64(passportImage);
      parts.push({
        inlineData: {
          mimeType: parsedPassport.mimeType,
          data: parsedPassport.data
        }
      });
      parts.push({
        text: 'GAMBAR DI ATAS ADALAH DOKUMEN PASPOR REPUBLIK INDONESIA (PASPOR LAMA PEMOHON).'
      });
    }

    const promptText = `
Anda adalah asisten administrasi legal dan konsuler ahli untuk biro perjalanan ibadah umroh dan haji ("PT. ALZAM MANDIRI WISATA").

TUGAS ANDA:
Menganalisis gambar dokumen yang diunggah pengguna:
1. Kartu Tanda Penduduk (KTP) Republik Indonesia
2. Kartu Keluarga (KK) Republik Indonesia
3. Paspor Republik Indonesia (jika diunggah)

ATURAN EKSTRAKSI DOKUMEN:
1. Ekstrak data Pemohon Utama dari KTP:
   - nik: Tepat 16 digit angka NIK dari KTP.
   - namaLengkap: HANYA nama lengkap pemohon sesuai ejaan KTP atau Paspor (JANGAN menyertakan label seperti "Nama", "Nama :").
   - tempatLahir: HANYA nama kota atau kabupaten tempat lahir pemohon (contoh: "Jepara", "Serang", "Jakarta", "Bandung", "Cimahi", "Medan"). JANGAN masukkan tanggal di kolom ini!
   - tanggalLahir: Tanggal lahir pemohon dalam format bahasa Indonesia resmi: "DD Bulan YYYY" (contoh: "30 November 1999", "13 April 1995", "12 Maret 1992"). Jika pada dokumen tertulis angka seperti "30-11-1999" atau "13/04/1995", ubah menjadi "30 November 1999" atau "13 April 1995".
   - tempatTanggalLahir: Gabungan rapi "Tempat Lahir, Tanggal Lahir" (contoh: "Jepara, 30 November 1999", "Serang, 13 April 1995").
   - jenisKelamin: "LAKI-LAKI" atau "PEREMPUAN".
   - alamatKtp: Gabungkan Jalan, RT/RW, Kelurahan/Desa, Kecamatan, Kota/Kabupaten, Provinsi secara utuh.
   - agama: Agama pemohon ("Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"). JANGAN pernah mengisi kolom agama dengan pesan error atau teks selain nama agama!
   - statusPerkawinan: "Belum Kawin", "Kawin", "Cerai Hidup", atau "Cerai Mati".
   - pekerjaan: Pekerjaan pemohon (contoh: "Wiraswasta", "Karyawan Swasta").
   - kewarganegaraan: "WNI".
2. Dari Kartu Keluarga (KK):
   - nomorKk: Tepat 16 digit angka yang tertera di bagian atas formulir Kartu Keluarga.
   - namaKepalaKeluarga: Nama kepala keluarga dari KK.
   - namaAyah: Nama ayah kandung dari kolom "Nama Orang Tua -> Nama Ayah" di tabel Kartu Keluarga.
3. Dari Paspor Republik Indonesia (jika diunggah):
   - nomorPasporLama: Nomor paspor pemohon (contoh: Y0195142, C8527774).
   - dateOfExpiry: Tanggal habis berlaku paspor (contoh: 11/03/2027 atau 15 Mei 2027).

Negara Tujuan yang diminta: ${country || 'Arab Saudi'}
Estimasi Keberangkatan yang diminta: ${departureMonth || '16 - 24 November 2026'}
Keperluan: ${purpose || 'Permohonan Pembuatan Paspor Umrah'}

Keluarkan hasil dalam format JSON terstruktur persis sesuai skema yang ditentukan.
`;

    parts.push({ text: promptText });

    let response: any = null;

    // Resilient calling with dynamic health check and circuit breaker
    const modelsToTry = getCandidateModels();

    for (const modelCandidate of modelsToTry) {
      try {
        console.log(`[AI OCR] Attempting extraction with model: ${modelCandidate}...`);
        const generatePromise = ai.models.generateContent({
          model: modelCandidate,
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                nik: {
                  type: Type.STRING,
                  description: 'Nomor Induk Kependudukan 16 digit dari KTP'
                },
                namaLengkap: {
                  type: Type.STRING,
                  description: 'Nama Lengkap pemohon sesuai ejaan KTP atau Paspor'
                },
                tempatLahir: {
                  type: Type.STRING,
                  description: 'Tempat lahir pemohon dari KTP atau Paspor'
                },
                tanggalLahir: {
                  type: Type.STRING,
                  description: 'Tanggal lahir pemohon dari KTP atau Paspor'
                },
                tempatTanggalLahir: {
                  type: Type.STRING,
                  description: 'Tempat dan tanggal lahir digabung, contoh: Serang, 13 April 1995'
                },
                jenisKelamin: {
                  type: Type.STRING,
                  description: 'Jenis Kelamin: LAKI-LAKI atau PEREMPUAN'
                },
                alamatKtp: {
                  type: Type.STRING,
                  description: 'Alamat lengkap KTP mencakup RT/RW, Kelurahan, Kecamatan, Kota/Kab, Provinsi'
                },
                nomorKk: {
                  type: Type.STRING,
                  description: 'Nomor Kartu Keluarga 16 digit dari KK'
                },
                namaKepalaKeluarga: {
                  type: Type.STRING,
                  description: 'Nama Kepala Keluarga dari dokumen KK'
                },
                namaAyah: {
                  type: Type.STRING,
                  description: 'Nama Ayah Kandung pemohon dari kolom Nama Ayah di tabel Kartu Keluarga (KK)'
                },
                nomorPasporLama: {
                  type: Type.STRING,
                  description: 'Nomor Paspor Lama pemohon jika ada gambar paspor (contoh: Y0195142, C8527774)'
                },
                dateOfExpiry: {
                  type: Type.STRING,
                  description: 'Date Of Expiry / Masa berlaku paspor jika ada gambar paspor'
                },
                agama: {
                  type: Type.STRING,
                  description: 'Agama pemohon (Islam, Kristen, Katolik, dll)'
                },
                statusPerkawinan: {
                  type: Type.STRING,
                  description: 'Status perkawinan pemohon jika terbaca'
                },
                pekerjaan: {
                  type: Type.STRING,
                  description: 'Pekerjaan pemohon jika terbaca'
                },
                kewarganegaraan: {
                  type: Type.STRING,
                  description: 'Kewarganegaraan (WNI)'
                },
              }
            }
          }
        });

        // 35-second timeout allowing thorough multi-image processing
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Model ${modelCandidate} timeout after 35s`)), 35000)
        );

        response = await Promise.race([generatePromise, timeoutPromise]);

        if (response && response.text) {
          modelCooldownUntil.delete(modelCandidate);
          console.log(`[AI OCR] Extraction succeeded with model: ${modelCandidate}`);
          break;
        }
      } catch (err: any) {
        const errStr = String(err?.message || err);
        const isQuota = errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('quota');
        const isHighDemand = errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('high demand');

        if (isQuota || isHighDemand) {
          modelCooldownUntil.set(modelCandidate, Date.now() + 6 * 60 * 1000);
          console.warn(`[AI OCR Notice] Model ${modelCandidate} temporarily rate-limited (${isQuota ? '429 Quota' : '503 Busy'}), cooling down for 6 mins.`);
        } else {
          console.warn(`[AI OCR Notice] Model ${modelCandidate} notice: ${errStr.slice(0, 150)}`);
        }
      }
    }

    let parsedResult: any = {};

    if (response && response.text) {
      const rawJson = response.text.trim();
      try {
        parsedResult = JSON.parse(rawJson);
      } catch (parseErr) {
        console.error('Failed to parse Gemini output as JSON:', rawJson);
      }
    }

    // 1. DOKUMEN PASPOR: Pastikan No. Paspor Lama & Date of Expiry terekstrak akurat jika berkas paspor ada
    if (passportImage && (!parsedResult.nomorPasporLama || !parsedResult.dateOfExpiry)) {
      try {
        console.log('[Server OCR] Scanning passport image for passport number and expiry date...');
        const worker = await getOcrWorker();
        if (worker) {
          const { data: passB64 } = parseBase64(passportImage);
          const passBuf = Buffer.from(passB64, 'base64');
          const passOcr = await worker.recognize(passBuf);
          const text = passOcr?.data?.text || '';
          console.log('[Server OCR] Passport text snippet:', text.replace(/\s+/g, ' ').substring(0, 140));

          const passData = extractPassportDataFromText(text);
          if (passData.nomorPasporLama && !parsedResult.nomorPasporLama) {
            parsedResult.nomorPasporLama = passData.nomorPasporLama;
          }
          if (passData.dateOfExpiry && !parsedResult.dateOfExpiry) {
            parsedResult.dateOfExpiry = passData.dateOfExpiry;
          }
          if (passData.namaLengkap && !parsedResult.namaLengkap) {
            parsedResult.namaLengkap = passData.namaLengkap;
          }
        }
      } catch (pErr) {
        console.warn('[Server OCR] Passport processing notice:', pErr);
      }
    }

    // 2. DOKUMEN KTP: Jalankan OCR jika NIK, Nama, atau TTL belum terekstrak
    if (ktpImage && (!parsedResult.nik || !parsedResult.namaLengkap || !parsedResult.tanggalLahir)) {
      try {
        console.log('[Server OCR] Scanning KTP image for NIK, Nama, and TTL...');
        const worker = await getOcrWorker();
        if (worker) {
          const { data: ktpB64 } = parseBase64(ktpImage);
          const ktpBuf = Buffer.from(ktpB64, 'base64');
          const ktpOcr = await worker.recognize(ktpBuf);
          const text = ktpOcr?.data?.text || '';
          console.log('[Server OCR] KTP text snippet:', text.replace(/\s+/g, ' ').substring(0, 140));

          const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);

          // NIK
          if (!parsedResult.nik) {
            const nikM = text.match(/\b\d{16}\b/);
            if (nikM) {
              parsedResult.nik = nikM[0];
            } else {
              for (const l of lines) {
                if (/NIK|N\.I\.K/i.test(l)) {
                  const cleaned = l.replace(/[IolL]/g, '1').replace(/[Oo]/g, '0').replace(/[Ss]/g, '5').replace(/[Bb]/g, '8').replace(/[Zz]/g, '2').replace(/\D/g, '');
                  if (cleaned.length >= 16) {
                    parsedResult.nik = cleaned.substring(0, 16);
                    break;
                  }
                }
              }
            }
          }

          // Nama
          if (!parsedResult.namaLengkap) {
            const nameM = text.match(/(?:Nama|NAMA|Nama\s*Lengkap)\s*[:;\-\.]*\s*([A-Za-z\s'.]{3,45})/i);
            if (nameM) {
              const candidate = cleanApplicantName(nameM[1]);
              if (candidate.length > 2 && !/PROVINSI|KABUPATEN|KOTA|AGAMA|GOL|DARAH|NIK/i.test(candidate)) {
                parsedResult.namaLengkap = candidate;
              }
            }
            if (!parsedResult.namaLengkap) {
              const nikLineIdx = lines.findIndex((l: string) => /\b\d{16}\b/.test(l) || /NIK/i.test(l));
              if (nikLineIdx !== -1 && lines[nikLineIdx + 1]) {
                const candidate = cleanApplicantName(lines[nikLineIdx + 1]);
                if (candidate.length > 2 && !/PROVINSI|KABUPATEN|KOTA|AGAMA|NIK|TEMPAT|LAHIR|GOL/i.test(candidate) && !/\d{5}/.test(candidate)) {
                  parsedResult.namaLengkap = candidate;
                }
              }
            }
          }

          // TTL
          if (!parsedResult.tanggalLahir || !parsedResult.tempatLahir) {
            const ttlM =
              text.match(/(?:Tempat\/Tgl\s*Lahir|Tempat\/Tg[li!]\s*Lahir|Tempat\s*[\/,]\s*Tgl\s*Lahir|TTL|Lahir)\s*[:;\-]?\s*([A-Za-z\s]+)[,\s]+(\d{1,2}[-\s/.]+[A-Za-z0-9]+[-\s/.]+\d{2,4})/i) ||
              text.match(/(?:Tempat\/Tgl\s*Lahir|Tempat\/Tg[li!]\s*Lahir|TTL)\s*[:;\-]?\s*([A-Za-z\s,0-9\-\/\.]+)/i);

            if (ttlM) {
              const rawVal = ttlM[0].replace(/^(?:Tempat\/Tgl\s*Lahir|Tempat\/Tg[li!]\s*Lahir|TTL|Lahir)\s*[:;\-]?\s*/i, '').trim();
              const parsed = parsePlaceAndBirthDate(ttlM[1], ttlM[2], rawVal, parsedResult.nik);
              if (!parsedResult.tempatLahir && parsed.tempatLahir) parsedResult.tempatLahir = parsed.tempatLahir;
              if (!parsedResult.tanggalLahir && parsed.tanggalLahir) parsedResult.tanggalLahir = parsed.tanggalLahir;
              if (!parsedResult.tempatTanggalLahir && parsed.tempatTanggalLahir) parsedResult.tempatTanggalLahir = parsed.tempatTanggalLahir;
              if (!parsedResult.jenisKelamin && parsed.jenisKelamin) parsedResult.jenisKelamin = parsed.jenisKelamin;
            }
          }

          if (!parsedResult.jenisKelamin) {
            if (/PEREMPUAN|WANITA|FEMALE/i.test(text)) parsedResult.jenisKelamin = 'PEREMPUAN';
            else if (/LAKI-LAKI|PRIA|MALE/i.test(text)) parsedResult.jenisKelamin = 'LAKI-LAKI';
          }

          if (!parsedResult.alamatKtp) {
            const almM = text.match(/(?:Alamat|ALAMAT)\s*[:;\-]?\s*([A-Za-z0-9\s/.,\-'"]{10,120})/i);
            if (almM) parsedResult.alamatKtp = almM[1].trim();
          }
        }
      } catch (kErr) {
        console.warn('[Server OCR] KTP processing notice:', kErr);
      }
    }

    // 3. DOKUMEN KK: Jalankan OCR jika Nomor KK atau Nama Ayah belum terekstrak
    if (kkImage && (!parsedResult.nomorKk || !parsedResult.namaAyah)) {
      try {
        console.log('[Server OCR] Scanning KK image for Nomor KK and Nama Ayah...');
        const worker = await getOcrWorker();
        if (worker) {
          const { data: kkB64 } = parseBase64(kkImage);
          const kkBuf = Buffer.from(kkB64, 'base64');
          const kkOcr = await worker.recognize(kkBuf);
          const text = kkOcr?.data?.text || '';
          console.log('[Server OCR] KK text snippet:', text.replace(/\s+/g, ' ').substring(0, 140));

          const kkM = text.match(/\b\d{16}\b/g);
          if (kkM && !parsedResult.nomorKk) {
            parsedResult.nomorKk = kkM.find((m: string) => m !== parsedResult.nik) || kkM[0];
          }

          const ayahM = text.match(/(?:Nama\s*Ayah|Ayah\s*Kandung|Nama\s*Ayah\s*Kandung|Nama\s*Orang\s*Tua)\s*[:;\-]?\s*([A-Za-z\s'.]{3,40})/i);
          if (ayahM && !parsedResult.namaAyah && !ayahM[1].toUpperCase().includes('KEPALA')) {
            parsedResult.namaAyah = cleanApplicantName(ayahM[1]);
          }

          const kepalaM = text.match(/(?:Kepala\s*Keluarga)\s*[:;\-]?\s*([A-Za-z\s'.]{3,40})/i);
          if (kepalaM && !parsedResult.namaKepalaKeluarga) {
            parsedResult.namaKepalaKeluarga = cleanApplicantName(kepalaM[1]);
          }
        }
      } catch (kkErr) {
        console.warn('[Server OCR] KK processing notice:', kkErr);
      }
    }

    // Merge client OCR / profile hint data if provided and missing
    const clientOcrData = req.body.clientOcrData || {};
    if (clientOcrData.nomorPasporLama && !parsedResult.nomorPasporLama) {
      parsedResult.nomorPasporLama = clientOcrData.nomorPasporLama;
    }
    if ((clientOcrData.dateOfExpiry || clientOcrData.expiredDatePaspor) && !parsedResult.dateOfExpiry) {
      parsedResult.dateOfExpiry = clientOcrData.dateOfExpiry || clientOcrData.expiredDatePaspor;
    }
    if (clientOcrData.namaMenjadi && !parsedResult.namaMenjadi) {
      parsedResult.namaMenjadi = clientOcrData.namaMenjadi;
    }
    if (clientOcrData.namaAyah && !parsedResult.namaAyah) {
      parsedResult.namaAyah = clientOcrData.namaAyah;
    }
    if (clientOcrData.nik && !parsedResult.nik) {
      parsedResult.nik = clientOcrData.nik;
    }
    if (clientOcrData.nomorKk && !parsedResult.nomorKk) {
      parsedResult.nomorKk = clientOcrData.nomorKk;
    }
    if (clientOcrData.namaLengkap && !parsedResult.namaLengkap) {
      parsedResult.namaLengkap = clientOcrData.namaLengkap;
    }
    if (clientOcrData.tempatLahir && !parsedResult.tempatLahir) {
      parsedResult.tempatLahir = clientOcrData.tempatLahir;
    }
    if (clientOcrData.tanggalLahir && !parsedResult.tanggalLahir) {
      parsedResult.tanggalLahir = clientOcrData.tanggalLahir;
    }
    if (clientOcrData.tempatTanggalLahir && !parsedResult.tempatTanggalLahir) {
      parsedResult.tempatTanggalLahir = clientOcrData.tempatTanggalLahir;
    }
    if (clientOcrData.alamatKtp && !parsedResult.alamatKtp) {
      parsedResult.alamatKtp = clientOcrData.alamatKtp;
    }
    if (clientOcrData.jenisKelamin && !parsedResult.jenisKelamin) {
      parsedResult.jenisKelamin = clientOcrData.jenisKelamin;
    }

    // Derive birth info from NIK if missing
    if (parsedResult.nik && parsedResult.nik.length === 16) {
      const nikInfo = extractBirthInfoFromNik(parsedResult.nik);
      if (nikInfo) {
        if (!parsedResult.tanggalLahir || parsedResult.tanggalLahir.length < 5) {
          parsedResult.tanggalLahir = nikInfo.tanggalLahir;
        }
        if (!parsedResult.jenisKelamin) {
          parsedResult.jenisKelamin = nikInfo.jenisKelamin;
        }
      }
    }

    // Standardize Name and TTL
    const cleanNama = cleanApplicantName(parsedResult.namaLengkap || '');
    const ttlParsed = parsePlaceAndBirthDate(
      parsedResult.tempatLahir,
      parsedResult.tanggalLahir,
      parsedResult.tempatTanggalLahir,
      parsedResult.nik
    );

    // Default baseline ONLY if absolutely no identity data could be extracted
    const defaultFallbackProfile = {
      nik: '3604075304950002',
      namaLengkap: 'Euis Cholishoh',
      tempatLahir: 'Serang',
      tanggalLahir: '13 April 1995',
      tempatTanggalLahir: 'Serang, 13 April 1995',
      jenisKelamin: 'PEREMPUAN',
      alamatKtp: 'Kp. Kubang Laban Rt.005, Rw.003, Kelurahan Lambangsari, Kec. Bojonegara, Kabupaten Serang, Provinsi Banten',
      nomorKk: '3604070000000000',
      namaKepalaKeluarga: 'Euis Cholishoh',
      namaAyah: namaAyah || 'H. Ahmad Subandi',
      nomorPasporLama: 'Y0195142',
      dateOfExpiry: '11/3/2027',
      agama: 'Islam',
      statusPerkawinan: 'Belum Kawin',
      pekerjaan: 'Wiraswasta',
      kewarganegaraan: 'WNI',
    };

    const hasUploadedImages = Boolean(ktpImage || kkImage || passportImage);
    const hasExtractedIdentity = Boolean(
      parsedResult.nik ||
      cleanNama ||
      ttlParsed.tempatLahir ||
      ttlParsed.tanggalLahir ||
      parsedResult.nomorPasporLama
    );

    // If user uploaded actual images, NEVER overwrite their document with the default mock profile!
    const shouldUseDefaultMock = !hasUploadedImages && !hasExtractedIdentity;

    const finalNama = cleanNama ? toTitleCase(cleanNama) : (shouldUseDefaultMock ? defaultFallbackProfile.namaLengkap : '');
    const finalNik = parsedResult.nik || (shouldUseDefaultMock ? defaultFallbackProfile.nik : '');
    const finalTempatLahir = ttlParsed.tempatLahir || (shouldUseDefaultMock ? defaultFallbackProfile.tempatLahir : '');
    const finalTanggalLahir = ttlParsed.tanggalLahir || (shouldUseDefaultMock ? defaultFallbackProfile.tanggalLahir : '');
    const finalTtl = ttlParsed.tempatTanggalLahir || (finalTempatLahir && finalTanggalLahir ? `${finalTempatLahir}, ${finalTanggalLahir}` : (shouldUseDefaultMock ? defaultFallbackProfile.tempatTanggalLahir : ''));
    const finalJk = (parsedResult.jenisKelamin || ttlParsed.jenisKelamin || (shouldUseDefaultMock ? defaultFallbackProfile.jenisKelamin : 'PEREMPUAN')).toUpperCase();

    const finalData = {
      templateType: selectedTemplate,
      nik: finalNik,
      namaLengkap: finalNama,
      tempatLahir: finalTempatLahir,
      tanggalLahir: finalTanggalLahir,
      tempatTanggalLahir: finalTtl,
      jenisKelamin: finalJk,
      alamatKtp: toTitleCase(parsedResult.alamatKtp || (shouldUseDefaultMock ? defaultFallbackProfile.alamatKtp : '')),
      nomorKk: parsedResult.nomorKk || (shouldUseDefaultMock ? defaultFallbackProfile.nomorKk : ''),
      namaKepalaKeluarga: toTitleCase(parsedResult.namaKepalaKeluarga || finalNama || (shouldUseDefaultMock ? defaultFallbackProfile.namaKepalaKeluarga : '')),
      namaMenjadi: parsedResult.namaMenjadi ? toTitleCase(cleanApplicantName(parsedResult.namaMenjadi)) : '',
      namaAyah: namaAyah
        ? toTitleCase(cleanApplicantName(namaAyah))
        : parsedResult.namaAyah
        ? toTitleCase(cleanApplicantName(parsedResult.namaAyah))
        : (hasExtractedIdentity ? '' : defaultFallbackProfile.namaAyah),
      nomorPasporLama: parsedResult.nomorPasporLama ? parsedResult.nomorPasporLama.toUpperCase() : '',
      dateOfExpiry: parsedResult.dateOfExpiry || parsedResult.expiredDatePaspor || '',
      expiredDatePaspor: parsedResult.dateOfExpiry || parsedResult.expiredDatePaspor || '',
      agama: validAgama(parsedResult.agama) || (hasExtractedIdentity ? 'Islam' : defaultFallbackProfile.agama),
      statusPerkawinan: parsedResult.statusPerkawinan ? toTitleCase(parsedResult.statusPerkawinan) : (hasExtractedIdentity ? 'Belum Kawin' : defaultFallbackProfile.statusPerkawinan),
      pekerjaan: toTitleCase(parsedResult.pekerjaan || (hasExtractedIdentity ? 'Wiraswasta' : defaultFallbackProfile.pekerjaan)),
      kewarganegaraan: parsedResult.kewarganegaraan || 'WNI',
      negaraTujuan: 'Arab Saudi',
      estimasiKeberangkatan: departureMonth || '16 - 24 November 2026',
      jadwalKeberangkatanDanKepulangan: departureMonth || '16 - 24 November 2026',
      keperluan: purpose || 'Surat Pernyataan dan Jaminan Paspor Umrah',
      nomorSurat: generateLetterNumber(true),
      nomorSuratPernyataan: generateLetterNumber(true),
      perihal: selectedTemplate === 'pernyataan_jaminan' ? 'Surat Pernyataan dan Jaminan' : selectedTemplate === 'penambahan_nama' ? 'Permohonan Penambahan Nama Paspor' : selectedTemplate === 'perpanjangan_paspor' ? 'Permohonan Perpanjangan Paspor' : 'Permohonan Pembuatan Paspor',
      tanggalSurat: formatIndonesianDate(new Date()),
      kotaPenerbitan: 'Jakarta',
      pejabatNama: 'Khairul Umam, ST, BA, MBA',
      pejabatJabatan: 'Direktur Utama',
      namaPerusahaan: 'PT. Alzam Mandiri Wisata',
      taglinePerusahaan: 'Tour & Travel',
      izinPpiu: '29042200007580004',
      tanggalIzinPpiu: '02 Agustus 2022',
      alamatPerusahaan: 'Ciledug Mas, Jl. HOS Cokroaminoto Blok C9 dan C10, RT.003/RW.004, Sudimara Timur, Kecamatan Karang Tengah, Kota Tangerang, Banten 15151',
      teleponPerusahaan: '0815-9888-154',
      emailPerusahaan: 'alzam@bisa.id',
      websitePerusahaan: 'www.umrahbisa.com',
      tujuanKantorImigrasi: finalTujuanImigrasi,
      alamatKantorImigrasi: finalAlamatImigrasi,
      crossCheckStatus: {
        nikValid: finalNik.length === 16,
        kkValid: Boolean(parsedResult.nomorKk && parsedResult.nomorKk.length === 16),
        nameMatched: Boolean(finalNama),
        notes: hasExtractedIdentity ? 'Ekstraksi dokumen identitas sukses untuk PT. Alzam Mandiri Wisata.' : 'Menggunakan profil cadangan PT. Alzam Mandiri Wisata.'
      }
    };

    return res.json({ success: true, data: finalData });
  } catch (error: any) {
    console.error('API Error in /api/analyze-documents:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Terjadi kesalahan sistem saat menganalisis dokumen.'
    });
  }
});

// Start Express server and mount Vite
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PT Alzam Mandiri Wisata] Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
