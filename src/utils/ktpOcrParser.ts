import { ApplicantData } from '../types';
import {
  toTitleCase,
  getTodayIndonesianDate,
  formatIndonesianBirthDate,
  parsePlaceAndBirthDate,
  cleanApplicantName,
  extractBirthInfoFromNik,
} from './letterFormatter';

export interface OcrResult {
  rawText: string;
  extractedData: Partial<ApplicantData>;
  confidence: number;
}

export function fixOcrDigits(str: string): string {
  if (!str) return '';
  return str
    .replace(/[IolL]/g, '1')
    .replace(/[Oo]/g, '0')
    .replace(/[Ss]/g, '5')
    .replace(/[Bb]/g, '8')
    .replace(/[Zz]/g, '2')
    .replace(/[Gg]/g, '6')
    .replace(/[qQ]/g, '9')
    .replace(/[^0-9]/g, '');
}

/**
 * Parses raw OCR text extracted from Indonesian KTP / KK / Paspor
 */
export function parseKtpOcrText(rawText: string): Partial<ApplicantData> {
  const result: Partial<ApplicantData> = {};
  if (!rawText) return result;

  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. NIK Extraction (16 digit number)
  const nikMatch = rawText.match(/\b\d{16}\b/);
  if (nikMatch) {
    result.nik = nikMatch[0];
  } else {
    // Search line with NIK keyword or 16 digits after fixOcrDigits
    for (const line of lines) {
      if (/NIK|N\.I\.K/i.test(line) || fixOcrDigits(line).length >= 14) {
        const cleaned = fixOcrDigits(line);
        if (cleaned.length >= 16) {
          result.nik = cleaned.substring(0, 16);
          break;
        }
      }
    }
  }

  // Auto derive birth date and gender from 16-digit NIK
  if (result.nik && result.nik.length === 16) {
    const nikInfo = extractBirthInfoFromNik(result.nik);
    if (nikInfo) {
      result.tanggalLahir = nikInfo.tanggalLahir;
      result.jenisKelamin = nikInfo.jenisKelamin;
    }
  }

  // 2. No. KK Extraction (16 digit number)
  const kkMatches = rawText.match(/\b\d{16}\b/g);
  if (kkMatches) {
    const otherKk = kkMatches.find((m) => m !== result.nik);
    if (otherKk) result.nomorKk = otherKk;
  }
  if (!result.nomorKk) {
    for (const line of lines) {
      if (/KARTU|KELUARGA|KK|NO\./i.test(line)) {
        const cleaned = fixOcrDigits(line);
        if (cleaned.length >= 16 && cleaned !== result.nik) {
          result.nomorKk = cleaned.substring(0, 16);
          break;
        }
      }
    }
  }

  // 3. Nama Ayah Kandung Extraction
  const ayahRegex = /(?:Nama\s*Ayah|Ayah\s*Kandung|Nama\s*Ayah\s*Kandung|Ayah|Nama\s*Orang\s*Tua)\s*[:;\-]?\s*([A-Za-z\s'.]{3,40})/i;
  for (const line of lines) {
    const match = line.match(ayahRegex);
    if (match) {
      let candidate = match[1].trim().replace(/^(Kandung|Kandung:\s*)/i, '').trim();
      if (candidate.length > 2 && !candidate.toUpperCase().includes('KEPALA')) {
        result.namaAyah = toTitleCase(cleanApplicantName(candidate));
        break;
      }
    }
  }

  // 4. Nama Lengkap
  const namaRegex = /(?:Nama|NAMA|Nama\s*Lengkap)\s*[:;\-]?\s*([A-Za-z\s'.]{3,40})/i;
  for (const line of lines) {
    const match = line.match(namaRegex);
    if (match) {
      const candidate = cleanApplicantName(match[1]);
      if (
        candidate.length > 2 &&
        !candidate.toUpperCase().includes('PROVINSI') &&
        !candidate.toUpperCase().includes('KABUPATEN') &&
        !candidate.toUpperCase().includes('KOTA') &&
        !candidate.toUpperCase().includes('AGAMA')
      ) {
        result.namaLengkap = toTitleCase(candidate);
        break;
      }
    }
  }

  // Fallback for Name: Line between NIK and Tempat/Tgl Lahir
  if (!result.namaLengkap) {
    const nikLineIndex = lines.findIndex((l) => /\b\d{16}\b/.test(l) || /NIK/i.test(l));
    if (nikLineIndex !== -1 && lines[nikLineIndex + 1]) {
      const candidateLine = cleanApplicantName(lines[nikLineIndex + 1]);
      if (
        candidateLine.length > 2 &&
        !/PROVINSI|KABUPATEN|KOTA|NIK|TEMPAT|LAHIR|GOL/i.test(candidateLine) &&
        !/\d{5}/.test(candidateLine)
      ) {
        result.namaLengkap = toTitleCase(candidateLine);
      }
    }
  }

  // 5. Tempat / Tanggal Lahir
  const ttlMatch =
    rawText.match(/(?:Tempat\/Tgl\s*Lahir|Tempat\/Tg[li!]\s*Lahir|Tempat\s*[\/,]\s*Tgl\s*Lahir|TTL|Lahir)\s*[:;\-]?\s*([A-Za-z\s]+)[,\s]+(\d{1,2}[-\s/.]+[A-Za-z0-9]+[-\s/.]+\d{2,4})/i) ||
    rawText.match(/(?:Tempat\/Tgl\s*Lahir|Tempat\/Tg[li!]\s*Lahir|TTL)\s*[:;\-]?\s*([A-Za-z\s,0-9\-\/\.]+)/i);

  if (ttlMatch) {
    const rawTtlVal = ttlMatch[0].replace(/^(?:Tempat\/Tgl\s*Lahir|Tempat\/Tg[li!]\s*Lahir|TTL|Lahir)\s*[:;\-]?\s*/i, '').trim();
    const parsedTtl = parsePlaceAndBirthDate(ttlMatch[1], ttlMatch[2], rawTtlVal, result.nik);
    result.tempatLahir = parsedTtl.tempatLahir;
    result.tanggalLahir = parsedTtl.tanggalLahir;
    result.tempatTanggalLahir = parsedTtl.tempatTanggalLahir;
    if (!result.jenisKelamin && parsedTtl.jenisKelamin) {
      result.jenisKelamin = parsedTtl.jenisKelamin;
    }
  } else if (result.nik && result.tanggalLahir) {
    // If place was not matched but date was derived from NIK
    result.tempatTanggalLahir = result.tanggalLahir;
  }

  // 6. Jenis Kelamin
  if (/PEREMPUAN|FEMALE|WANITA/i.test(rawText)) {
    result.jenisKelamin = 'PEREMPUAN';
  } else if (/LAKI-LAKI|MALE|PRIA/i.test(rawText)) {
    result.jenisKelamin = 'LAKI-LAKI';
  }

  // 6. Alamat Lengkap Aggregation
  let street = '';
  let rtrw = '';
  let kelDesa = '';
  let kecamatan = '';
  let kotaKab = '';
  let provinsi = '';

  for (const line of lines) {
    const upper = line.toUpperCase();

    if (upper.includes('PROVINSI') && !provinsi) {
      provinsi = line.replace(/.*PROVINSI\s*/i, '').trim();
    } else if ((upper.includes('KOTA') || upper.includes('KABUPATEN')) && !kotaKab) {
      kotaKab = line.replace(/.*(?:KOTA|KABUPATEN)\s*/i, '').trim();
    } else if (upper.includes('ALAMAT') && !street) {
      street = line.replace(/.*ALAMAT\s*[:;\-]?\s*/i, '').trim();
    } else if ((upper.includes('RT') || upper.includes('RW')) && !rtrw) {
      const match = line.match(/(?:RT\/?RW|RT|RW)\s*[:;\-]?\s*([\d\s\/]+)/i);
      if (match) rtrw = `RT/RW: ${match[1].trim()}`;
    } else if ((upper.includes('KEL') || upper.includes('DESA')) && !kelDesa) {
      kelDesa = line.replace(/.*(?:KEL|DESA|KELURAHAN)\s*[:;\-]?\s*/i, 'Kel/Desa: ').trim();
    } else if ((upper.includes('KEC') || upper.includes('KECAMATAN')) && !kecamatan) {
      kecamatan = line.replace(/.*(?:KEC|KECAMATAN)\s*[:;\-]?\s*/i, 'Kec. ').trim();
    }
  }

  const addressParts = [street, rtrw, kelDesa, kecamatan, kotaKab, provinsi].filter(Boolean);
  if (addressParts.length > 0) {
    result.alamatKtp = toTitleCase(addressParts.join(', '));
  } else {
    const fallbackAlamat = rawText.match(/(?:Alamat|ALAMAT)\s*[:;\-]?\s*([A-Za-z0-9\s/.,\-'"]+)/i);
    if (fallbackAlamat) {
      result.alamatKtp = toTitleCase(fallbackAlamat[1].trim());
    }
  }

  // 7. Agama
  const agamaMatch = rawText.match(/(?:Agama|AGAMA)\s*[:;\-]?\s*(ISLAM|KRISTEN|KATHOLIK|HINDU|BUDDHA|KHONGHUCU)/i);
  if (agamaMatch) {
    result.agama = toTitleCase(agamaMatch[1]);
  }

  // 8. Status Perkawinan
  const statusMatch = rawText.match(/(?:Status|STATUS)\s*(?:Perkawinan)?\s*[:;\-]?\s*(BELUM KAWIN|KAWIN|CERAI HIDUP|CERAI MATI)/i);
  if (statusMatch) {
    result.statusPerkawinan = toTitleCase(statusMatch[1]);
  }

  // 9. Pekerjaan
  const kerjaMatch = rawText.match(/(?:Pekerjaan|PEKERJAAN)\s*[:;\-]?\s*([A-Za-z0-9\s/]+)/i);
  if (kerjaMatch) {
    result.pekerjaan = toTitleCase(kerjaMatch[1].trim());
  }

  // 10. Paspor No (Indonesian & International Passports)
  const pasporMatch =
    rawText.match(/(?:Paspor|Passport|No\.?\s*Paspor|Passport\s*No\.?|Doc(?:ument)?\s*No\.?)\s*[:;\-]?\s*([A-Z][0-9]{7,8})/i) ||
    rawText.match(/\b([A-Z][0-9]{7,8})\b/i);

  if (pasporMatch) {
    result.nomorPasporLama = pasporMatch[1].toUpperCase();
  } else {
    // Check MRZ line at bottom of passport (e.g. P<IDN... or Y0195142<8IDN...)
    const mrzMatch = rawText.match(/([A-Z][0-9]{7,8})[<0-9]IDN/i) ||
      rawText.match(/P<IDN[A-Z0-9<]*?([A-Z][0-9]{7,8})/i) ||
      rawText.match(/\b([A-Z0-9]{7,9})\b/i);
    if (mrzMatch) {
      result.nomorPasporLama = mrzMatch[1].replace(/</g, '').toUpperCase();
    }
  }

  // 11. Date of Expiry / Habis Berlaku
  const expiryRegex = /(?:Date\s+of\s+expiry|Habis\s+berlaku|Masa\s+berlaku|Expiry|Exp|Valid\s+until|TGL\.?\s*HABIS\s*BERLAKU|EXPIRATION|BERLAKU\s*S\/?D)\s*[:;\-]?\s*(\d{1,2}[\s\/\.-]+[A-Za-z0-9]+[\s\/\.-]+\d{2,4})/i;
  const expiryMatch = rawText.match(expiryRegex);
  if (expiryMatch) {
    result.dateOfExpiry = expiryMatch[1].trim();
    result.expiredDatePaspor = expiryMatch[1].trim();
  } else {
    // Check MRZ line 2 expiry (YYMMDD)
    const mrzExpMatch = rawText.match(/IDN\d{7}[MF](\d{2})(\d{2})(\d{2})/i) || rawText.match(/[MF<](\d{2})(\d{2})(\d{2})\d<+/i);
    if (mrzExpMatch) {
      const yy = mrzExpMatch[1];
      const mm = mrzExpMatch[2];
      const dd = mrzExpMatch[3];
      const year = parseInt(yy, 10) < 50 ? `20${yy}` : `19${yy}`;
      const formattedDate = `${dd}/${mm}/${year}`;
      result.dateOfExpiry = formattedDate;
      result.expiredDatePaspor = formattedDate;
    } else {
      const futureDateMatch = rawText.match(/\b(\d{1,2}[\s\/\.-]+(?:Jan|Feb|Mar|Apr|Mei|May|Jun|Jul|Agu|Aug|Sep|Okt|Oct|Nov|Des|Dec|0[1-9]|1[0-2])[\s\/\.-]+(?:202[4-9]|203[0-9]))\b/i);
      if (futureDateMatch) {
        result.dateOfExpiry = futureDateMatch[1].trim();
        result.expiredDatePaspor = futureDateMatch[1].trim();
      }
    }
  }

  return result;
}

/**
 * Parser wrapper for OCR text
 */
export async function scanDocumentWithTesseract(_base64Image: string): Promise<OcrResult> {
  return {
    rawText: '',
    extractedData: {},
    confidence: 0,
  };
}
