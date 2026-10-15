import { createWorker } from 'tesseract.js';
import { toTitleCase, parsePlaceAndBirthDate, cleanApplicantName } from './letterFormatter';

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

  // Process Passport
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
    } catch (err) {
      console.warn('[Client OCR] Passport extraction notice:', err);
    }
  }

  // Process KTP
  if (ktpBase64) {
    try {
      const ktpOcr = await worker.recognize(ktpBase64);
      const text = ktpOcr?.data?.text || '';

      // NIK
      const nikMatch = text.match(/\b\d{16}\b/);
      if (nikMatch) {
        result.nik = nikMatch[0];
      }

      // Name
      const nameMatch = text.match(/(?:Nama|NAMA)\s*[:;\-.]*\s*([A-Za-z\s'.]{3,45})/i);
      if (nameMatch) {
        const candidate = cleanApplicantName(nameMatch[1]);
        if (candidate.length > 2 && !/PROVINSI|KABUPATEN|KOTA|AGAMA|NIK/i.test(candidate)) {
          result.namaLengkap = toTitleCase(candidate);
        }
      }

      // TTL
      const ttlMatch = text.match(/(?:Tempat\/Tgl\s*Lahir|TTL|Lahir)\s*[:;\-]?\s*([A-Za-z\s,0-9\-\/\.]+)/i);
      if (ttlMatch) {
        const parsed = parsePlaceAndBirthDate(undefined, undefined, ttlMatch[1], result.nik);
        if (parsed.tempatLahir) result.tempatLahir = parsed.tempatLahir;
        if (parsed.tanggalLahir) result.tanggalLahir = parsed.tanggalLahir;
        if (parsed.tempatTanggalLahir) result.tempatTanggalLahir = parsed.tempatTanggalLahir;
        if (parsed.jenisKelamin) result.jenisKelamin = parsed.jenisKelamin;
      }

      if (!result.jenisKelamin) {
        if (/PEREMPUAN|WANITA/i.test(text)) result.jenisKelamin = 'PEREMPUAN';
        else if (/LAKI-LAKI|PRIA/i.test(text)) result.jenisKelamin = 'LAKI-LAKI';
      }

      const almM = text.match(/(?:Alamat|ALAMAT)\s*[:;\-]?\s*([A-Za-z0-9\s/.,\-'"]{10,100})/i);
      if (almM) {
        result.alamatKtp = toTitleCase(almM[1].trim());
      }
    } catch (err) {
      console.warn('[Client OCR] KTP extraction notice:', err);
    }
  }

  // Process KK
  if (kkBase64) {
    try {
      const kkOcr = await worker.recognize(kkBase64);
      const text = kkOcr?.data?.text || '';

      const kkM = text.match(/\b\d{16}\b/g);
      if (kkM) {
        result.nomorKk = kkM.find((m: string) => m !== result.nik) || kkM[0];
      }

      const ayahM = text.match(/(?:Nama\s*Ayah|Ayah\s*Kandung)\s*[:;\-]?\s*([A-Za-z\s'.]{3,40})/i);
      if (ayahM) {
        result.namaAyah = toTitleCase(cleanApplicantName(ayahM[1]));
      }

      const kepalaM = text.match(/(?:Kepala\s*Keluarga)\s*[:;\-]?\s*([A-Za-z\s'.]{3,40})/i);
      if (kepalaM) {
        result.namaKepalaKeluarga = toTitleCase(cleanApplicantName(kepalaM[1]));
      }
    } catch (err) {
      console.warn('[Client OCR] KK extraction notice:', err);
    }
  }

  return result;
}
