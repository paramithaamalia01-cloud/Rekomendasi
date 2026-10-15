import { createWorker } from 'tesseract.js';
import { parseKtpOcrText } from './ktpOcrParser';
import { toTitleCase, cleanApplicantName, extractBirthInfoFromNik } from './letterFormatter';

export interface ExtractedDocumentResult {
  nik?: string;
  namaLengkap?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  tempatTanggalLahir?: string;
  jenisKelamin?: 'LAKI-LAKI' | 'PEREMPUAN';
  alamatKtp?: string;
  nomorKk?: string;
  namaKepalaKeluarga?: string;
  namaAyah?: string;
  nomorPasporLama?: string;
  dateOfExpiry?: string;
  expiredDatePaspor?: string;
  agama?: string;
  pekerjaan?: string;
  statusPerkawinan?: string;
  kewarganegaraan?: string;
}

let clientWorker: any = null;

async function getBrowserOcrWorker() {
  if (clientWorker) return clientWorker;
  try {
    clientWorker = await createWorker('eng');
    return clientWorker;
  } catch (err) {
    console.warn('[Client OCR] Failed to initialize Tesseract web worker:', err);
    return null;
  }
}

// Extract passport info from text
export function extractPassportDataFromText(text: string) {
  const result: { nomorPasporLama?: string; dateOfExpiry?: string; namaLengkap?: string } = {};
  if (!text) return result;

  // Passport number pattern (e.g. Y0195142, C8527774, B1234567)
  const numMatch = text.match(/(?:Paspor|Passport|Doc(?:ument)?)\s*(?:No\.?|Nomor)?\s*[:;\-]?\s*([A-Z][0-9]{7,8}|[A-Z]{2}[0-9]{7})/i);
  if (numMatch) {
    result.nomorPasporLama = numMatch[1].toUpperCase();
  }

  // MRZ Line 2 extraction
  const mrzLine2 = text.match(/\b([A-Z][0-9]{7,8})[<0-9]IDN/i) || text.match(/([A-Z][0-9]{7,8})<\dIDN/i);
  if (mrzLine2 && !result.nomorPasporLama) {
    result.nomorPasporLama = mrzLine2[1].toUpperCase();
  }

  if (!result.nomorPasporLama) {
    const standalone = text.match(/\b([A-Z][0-9]{7,8})\b/);
    if (standalone) {
      result.nomorPasporLama = standalone[1].toUpperCase();
    }
  }

  // Expiry Date
  const expMatch = text.match(/(?:Date\s+of\s+expiry|Habis\s+berlaku|Masa\s+berlaku|Expiry|Exp|Valid\s+until|EXPIRATION)\s*[:;\-]?\s*(\d{1,2}[\s\/\.-]+[A-Za-z0-9]+[\s\/\.-]+\d{2,4})/i);
  if (expMatch) {
    result.dateOfExpiry = expMatch[1].trim();
  }

  // MRZ Expiry
  const mrzExp = text.match(/IDN\d{7}[MF<](\d{2})(\d{2})(\d{2})/i) || text.match(/[MF<](\d{2})(\d{2})(\d{2})\d<+/i);
  if (mrzExp && !result.dateOfExpiry) {
    const yy = mrzExp[1];
    const mm = mrzExp[2];
    const dd = mrzExp[3];
    const year = parseInt(yy, 10) < 50 ? `20${yy}` : `19${yy}`;
    result.dateOfExpiry = `${dd}/${mm}/${year}`;
  }

  // MRZ Line 1 Name
  const mrzLine1Match = text.match(/P<IDN([A-Z<]+)/i);
  if (mrzLine1Match) {
    const rawNames = mrzLine1Match[1].split('<<').map(s => s.replace(/</g, ' ').trim()).filter(Boolean);
    if (rawNames.length > 0) {
      result.namaLengkap = toTitleCase(rawNames.join(' '));
    }
  }

  return result;
}

// Perform client-side document extraction directly in the browser
export async function processDocumentsInBrowser(
  ktpBase64?: string,
  kkBase64?: string,
  passportBase64?: string
): Promise<ExtractedDocumentResult> {
  const result: ExtractedDocumentResult = {
    agama: 'Islam',
    pekerjaan: 'Wiraswasta',
    statusPerkawinan: 'Belum Kawin',
    kewarganegaraan: 'WNI',
  };

  const worker = await getBrowserOcrWorker();
  if (!worker) return result;

  // 1. Process Passport
  if (passportBase64) {
    try {
      const passOcr = await worker.recognize(passportBase64);
      const text = passOcr?.data?.text || '';
      const passData = extractPassportDataFromText(text);
      if (passData.nomorPasporLama) result.nomorPasporLama = passData.nomorPasporLama;
      if (passData.dateOfExpiry) {
        result.dateOfExpiry = passData.dateOfExpiry;
        result.expiredDatePaspor = passData.dateOfExpiry;
      }
      if (passData.namaLengkap && !result.namaLengkap) {
        result.namaLengkap = passData.namaLengkap;
      }
    } catch (err) {
      console.warn('[Client OCR] Passport extraction notice:', err);
    }
  }

  // 2. Process KTP with specialized ktpOcrParser
  if (ktpBase64) {
    try {
      const ktpOcr = await worker.recognize(ktpBase64);
      const text = ktpOcr?.data?.text || '';
      const parsedKtp = parseKtpOcrText(text);

      if (parsedKtp.nik) result.nik = parsedKtp.nik;
      if (parsedKtp.namaLengkap) result.namaLengkap = parsedKtp.namaLengkap;
      if (parsedKtp.tempatLahir) result.tempatLahir = parsedKtp.tempatLahir;
      if (parsedKtp.tanggalLahir) result.tanggalLahir = parsedKtp.tanggalLahir;
      if (parsedKtp.tempatTanggalLahir) result.tempatTanggalLahir = parsedKtp.tempatTanggalLahir;
      if (parsedKtp.jenisKelamin === 'LAKI-LAKI' || parsedKtp.jenisKelamin === 'PEREMPUAN') {
        result.jenisKelamin = parsedKtp.jenisKelamin;
      }
      if (parsedKtp.alamatKtp) result.alamatKtp = parsedKtp.alamatKtp;
      if (parsedKtp.agama) result.agama = parsedKtp.agama;
      if (parsedKtp.statusPerkawinan) result.statusPerkawinan = parsedKtp.statusPerkawinan;
      if (parsedKtp.pekerjaan) result.pekerjaan = parsedKtp.pekerjaan;
    } catch (err) {
      console.warn('[Client OCR] KTP extraction notice:', err);
    }
  }

  // 3. Process KK
  if (kkBase64) {
    try {
      const kkOcr = await worker.recognize(kkBase64);
      const text = kkOcr?.data?.text || '';
      const parsedKk = parseKtpOcrText(text);

      if (parsedKk.nomorKk) {
        result.nomorKk = parsedKk.nomorKk;
      } else {
        const kkM = text.match(/\b\d{16}\b/g);
        if (kkM) {
          result.nomorKk = kkM.find((m: string) => m !== result.nik) || kkM[0];
        }
      }

      if (parsedKk.namaAyah) {
        result.namaAyah = parsedKk.namaAyah;
      } else {
        const ayahM = text.match(/(?:Nama\s*Ayah|Ayah\s*Kandung)\s*[:;\-]?\s*([A-Za-z\s'.]{3,40})/i);
        if (ayahM) {
          result.namaAyah = toTitleCase(cleanApplicantName(ayahM[1]));
        }
      }

      const kepalaM = text.match(/(?:Kepala\s*Keluarga)\s*[:;\-]?\s*([A-Za-z\s'.]{3,40})/i);
      if (kepalaM) {
        result.namaKepalaKeluarga = toTitleCase(cleanApplicantName(kepalaM[1]));
      }
    } catch (err) {
      console.warn('[Client OCR] KK extraction notice:', err);
    }
  }

  // 4. Mathematical derivation from NIK if birth date or gender was not captured by text OCR
  if (result.nik && result.nik.length === 16) {
    const nikInfo = extractBirthInfoFromNik(result.nik);
    if (nikInfo) {
      if (!result.tanggalLahir || result.tanggalLahir.length < 5) {
        result.tanggalLahir = nikInfo.tanggalLahir;
      }
      if (!result.jenisKelamin) {
        result.jenisKelamin = nikInfo.jenisKelamin;
      }
      if (!result.tempatTanggalLahir) {
        result.tempatTanggalLahir = result.tempatLahir
          ? `${result.tempatLahir}, ${result.tanggalLahir}`
          : result.tanggalLahir;
      }
    }
  }

  return result;
}
