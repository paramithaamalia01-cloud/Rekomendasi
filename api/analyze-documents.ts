import { GoogleGenAI, Type } from '@google/genai';

function parseBase64(dataUri: string): { mimeType: string; data: string } {
  const matches = dataUri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return { mimeType: matches[1], data: matches[2] };
  }
  return { mimeType: 'image/jpeg', data: dataUri };
}

function cleanApplicantName(raw?: string): string {
  if (!raw) return '';
  return raw
    .replace(/^(?:Nama|NAMA|Nama\s*Lengkap|Nama\s*Pemohon|Name|Full\s*Name)\s*[:;\-.]*\s*/i, '')
    .replace(/^[:;\-.\s]+|[:;\-.\s]+$/g, '')
    .trim();
}

function toTitleCase(str: string): string {
  if (!str) return '';
  const cleaned = str.replace(/\.{2,}/g, '.');
  const preserveUpper = new Set([
    'NIK', 'KK', 'KTP', 'RT', 'RW', 'DKI', 'WNI', 'WNA', 'RI', 'TPI', 'PPIU',
    'ST', 'S.T', 'S.T.', 'BA', 'B.A', 'B.A.', 'MBA', 'M.B.A', 'M.B.A.', 'SE', 'S.E', 'S.E.',
    'SH', 'S.H', 'S.H.', 'PT', 'PT.', 'CV', 'CV.', 'AMW', 'SR', 'KH'
  ]);
  const particles = new Set(['dan', 'di', 'ke', 'dari', 'yang', 'untuk', 'pada', 'atau', 'bin', 'binti', 'al']);

  return cleaned
    .split(/(\s+|[-/.,:;()])/g)
    .map((word, index) => {
      if (!word || /^\s+$/.test(word) || /^[-/.,:;()]$/.test(word)) return word;
      if (/^\d+$/.test(word)) return word;
      const lower = word.toLowerCase();
      const upper = word.toUpperCase();
      if (preserveUpper.has(upper)) return upper;
      if (index > 0 && particles.has(lower)) return lower;
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

let globalSequence = 7431;
function generateLetterNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const romanMonth = romanMonths[now.getMonth()];
  const seq = globalSequence++;
  return `${seq}/SR/AMW/${romanMonth}/${year}`;
}

function formatIndonesianDate(date = new Date()): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

export default async function handler(req: any, res: any) {
  // Support CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      ktpImage,
      kkImage,
      passportImage,
      departureMonth,
      purpose,
      templateType,
      tujuanKantorImigrasi,
      alamatKantorImigrasi,
      kantorImigrasiDanAlamat,
      namaAyah,
      clientOcrData,
    } = req.body || {};

    const selectedTemplate = templateType || 'paket_lengkap_alzam';
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

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    // Company and official letter metadata
    const officialBase = {
      templateType: selectedTemplate,
      negaraTujuan: 'Arab Saudi',
      estimasiKeberangkatan: departureMonth || '16 - 24 November 2026',
      jadwalKeberangkatanDanKepulangan: departureMonth || '16 - 24 November 2026',
      keperluan: purpose || 'Surat Pernyataan dan Jaminan Paspor Umrah',
      nomorSurat: generateLetterNumber(),
      nomorSuratPernyataan: generateLetterNumber(),
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
    };

    let extracted: any = {};

    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const parts: any[] = [];

      if (ktpImage) {
        const parsed = parseBase64(ktpImage);
        parts.push({ inlineData: { mimeType: parsed.mimeType, data: parsed.data } });
        parts.push({ text: 'DOKUMEN DI ATAS ADALAH KARTU TANDA PENDUDUK (KTP) REPUBLIK INDONESIA.' });
      }
      if (kkImage) {
        const parsed = parseBase64(kkImage);
        parts.push({ inlineData: { mimeType: parsed.mimeType, data: parsed.data } });
        parts.push({ text: 'DOKUMEN DI ATAS ADALAH KARTU KELUARGA (KK) REPUBLIK INDONESIA.' });
      }
      if (passportImage) {
        const parsed = parseBase64(passportImage);
        parts.push({ inlineData: { mimeType: parsed.mimeType, data: parsed.data } });
        parts.push({ text: 'DOKUMEN DI ATAS ADALAH PASPOR REPUBLIK INDONESIA PEMOHON.' });
      }

      parts.push({
        text: `Anda adalah asisten legal imigrasi ahli untuk biro perjalanan umroh PT. ALZAM MANDIRI WISATA.
Tugas Anda adalah membaca dan mengekstrak data dari foto/scan KTP, Kartu Keluarga (KK), dan Paspor yang diunggah.

ATURAN EKSTRAKSI DOKUMEN INDONESIA:
1. KTP:
   - nik: Tepat 16 digit angka NIK.
   - namaLengkap: HANYA nama lengkap pemohon sesuai dokumen tanpa awalan "Nama:".
   - tempatLahir: HANYA nama kota atau kabupaten (contoh: "Serang", "Jepara", "Tangerang", "Bandung"). JANGAN masukkan tanggal di kolom ini!
   - tanggalLahir: Tanggal lahir resmi bahasa Indonesia: "DD Bulan YYYY" (contoh: "13 April 1995").
   - tempatTanggalLahir: "Kota, DD Bulan YYYY".
   - jenisKelamin: "LAKI-LAKI" atau "PEREMPUAN".
   - alamatKtp: Gabungan lengkap Jalan, RT/RW, Kelurahan/Desa, Kecamatan, Kota/Kabupaten, Provinsi.
   - agama: "Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu".
   - statusPerkawinan: "Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati".
   - pekerjaan: Pekerjaan pemohon (contoh: "Wiraswasta", "Karyawan Swasta").
   - kewarganegaraan: "WNI".

2. Kartu Keluarga (KK):
   - nomorKk: 16 digit angka yang tertera di bagian atas KK.
   - namaKepalaKeluarga: Nama kepala keluarga yang tertera di KK.
   - namaAyah: Nama ayah kandung dari tabel Kartu Keluarga pada baris pemohon (kolom "Nama Orang Tua -> Ayah").

3. Paspor:
   - nomorPasporLama: Nomor paspor pemohon (contoh: Y0195142, C8527774).
   - dateOfExpiry: Tanggal habis berlaku paspor (contoh: 11/03/2027 atau 15 Mei 2027).
   - namaMenjadi: Jika pemohon memiliki nama 1 atau 2 suku kata dan mengajukan penambahan nama 3 kata untuk umrah (contoh: ditambah nama ayah / kakek).

Keluarkan hasil berupa JSON terstruktur murni.`
      });

      const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

      for (const modelCandidate of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelCandidate,
            contents: { parts },
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  nik: { type: Type.STRING },
                  namaLengkap: { type: Type.STRING },
                  tempatLahir: { type: Type.STRING },
                  tanggalLahir: { type: Type.STRING },
                  tempatTanggalLahir: { type: Type.STRING },
                  jenisKelamin: { type: Type.STRING },
                  alamatKtp: { type: Type.STRING },
                  nomorKk: { type: Type.STRING },
                  namaKepalaKeluarga: { type: Type.STRING },
                  namaAyah: { type: Type.STRING },
                  nomorPasporLama: { type: Type.STRING },
                  dateOfExpiry: { type: Type.STRING },
                  namaMenjadi: { type: Type.STRING },
                  agama: { type: Type.STRING },
                  statusPerkawinan: { type: Type.STRING },
                  pekerjaan: { type: Type.STRING },
                  kewarganegaraan: { type: Type.STRING },
                }
              }
            }
          });

          if (response && response.text) {
            extracted = JSON.parse(response.text.trim());
            console.log(`[Vercel Serverless] Successfully extracted via model: ${modelCandidate}`);
            break;
          }
        } catch (err: any) {
          console.warn(`[Vercel Serverless] Model ${modelCandidate} notice:`, err?.message || err);
        }
      }
    }

    // Merge extracted data with client OCR hints if server AI had gaps
    const clientData = clientOcrData || {};
    const rawNik = (extracted.nik || clientData.nik || '').replace(/\D/g, '');
    const cleanNik = rawNik.length === 16 ? rawNik : (extracted.nik || clientData.nik || '');

    // Mathematical NIK derivation for missing birth date or gender
    let derivedBirthInfo: { tanggalLahir: string; jenisKelamin: 'LAKI-LAKI' | 'PEREMPUAN' } | null = null;
    if (cleanNik && cleanNik.length === 16) {
      derivedBirthInfo = extractBirthInfoFromNik(cleanNik);
    }

    const cleanNama = cleanApplicantName(extracted.namaLengkap || clientData.namaLengkap || '');
    let finalTanggalLahir = formatIndonesianBirthDate(extracted.tanggalLahir || clientData.tanggalLahir || '');
    let finalJenisKelamin = (extracted.jenisKelamin || clientData.jenisKelamin || '').toUpperCase();

    if ((!finalTanggalLahir || finalTanggalLahir.length < 5) && derivedBirthInfo) {
      finalTanggalLahir = derivedBirthInfo.tanggalLahir;
    }
    if (!finalJenisKelamin && derivedBirthInfo) {
      finalJenisKelamin = derivedBirthInfo.jenisKelamin;
    }

    const finalTempatLahir = toTitleCase(extracted.tempatLahir || clientData.tempatLahir || '');
    const finalTtl = finalTempatLahir && finalTanggalLahir
      ? `${finalTempatLahir}, ${finalTanggalLahir}`
      : (extracted.tempatTanggalLahir || clientData.tempatTanggalLahir || finalTanggalLahir || finalTempatLahir || '');

    const finalPaspor = (extracted.nomorPasporLama || clientData.nomorPasporLama || '').toUpperCase();
    const finalExp = extracted.dateOfExpiry || clientData.dateOfExpiry || clientData.expiredDatePaspor || '';

    const finalData = {
      ...officialBase,
      nik: cleanNik,
      namaLengkap: toTitleCase(cleanNama),
      tempatLahir: finalTempatLahir,
      tanggalLahir: finalTanggalLahir,
      tempatTanggalLahir: finalTtl,
      jenisKelamin: finalJenisKelamin || 'PEREMPUAN',
      alamatKtp: toTitleCase(extracted.alamatKtp || clientData.alamatKtp || ''),
      nomorKk: (extracted.nomorKk || clientData.nomorKk || '').replace(/\D/g, ''),
      namaKepalaKeluarga: toTitleCase(cleanApplicantName(extracted.namaKepalaKeluarga || clientData.namaKepalaKeluarga || cleanNama)),
      namaAyah: namaAyah
        ? toTitleCase(cleanApplicantName(namaAyah))
        : toTitleCase(cleanApplicantName(extracted.namaAyah || clientData.namaAyah || '')),
      namaMenjadi: extracted.namaMenjadi ? toTitleCase(cleanApplicantName(extracted.namaMenjadi)) : '',
      nomorPasporLama: finalPaspor,
      dateOfExpiry: finalExp,
      expiredDatePaspor: finalExp,
      agama: extracted.agama || clientData.agama || 'Islam',
      statusPerkawinan: toTitleCase(extracted.statusPerkawinan || clientData.statusPerkawinan || 'Belum Kawin'),
      pekerjaan: toTitleCase(extracted.pekerjaan || clientData.pekerjaan || 'Wiraswasta'),
      kewarganegaraan: extracted.kewarganegaraan || clientData.kewarganegaraan || 'WNI',
      crossCheckStatus: {
        nikValid: cleanNik.length === 16,
        kkValid: Boolean(extracted.nomorKk && extracted.nomorKk.length === 16),
        nameMatched: Boolean(cleanNama),
        notes: cleanNama ? 'Ekstraksi dokumen identitas berhasil diproses.' : 'Dokumen berhasil dipindai. Silakan lengkapi formulir verifikasi.'
      }
    };

    return res.status(200).json({ success: true, data: finalData });
  } catch (error: any) {
    console.error('[Vercel Serverless] Error in analyze-documents:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Terjadi kesalahan pada server saat mengekstrak dokumen.'
    });
  }
}
