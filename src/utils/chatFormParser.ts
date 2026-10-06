import { ApplicantData, LetterTemplateType } from '../types';
import { toTitleCase } from './letterFormatter';

export interface ChatFormField {
  key: keyof ApplicantData | 'kantorImigrasiDanAlamat';
  label: string;
  placeholder: string;
  isOptional?: boolean;
  hint?: string;
}

export const CHAT_FORM_FIELDS: ChatFormField[] = [
  {
    key: 'namaLengkap',
    label: 'Nama Lengkap Sesuai KTP',
    placeholder: 'Contoh: Euis Cholishoh',
    hint: 'Sesuai ejaan di KTP',
  },
  {
    key: 'tempatTanggalLahir',
    label: 'Tempat Tanggal Lahir',
    placeholder: 'Contoh: Serang, 13 April 1995',
    hint: 'Format: Kota, Tanggal Bulan Tahun',
  },
  {
    key: 'nik',
    label: 'NIK KTP (16 Digit)',
    placeholder: 'Contoh: 3604075304950002',
    hint: '16 digit angka',
  },
  {
    key: 'alamatKtp',
    label: 'Alamat Lengkap Sesuai KTP',
    placeholder: 'Contoh: Kp. Kubang Laban Rt.005, Rw.003, Kel. Lambangsari, Kec. Bojonegara, Kab. Serang, Banten',
    hint: 'RT/RW, Kelurahan, Kecamatan, Kab/Kota, Provinsi',
  },
  {
    key: 'estimasiKeberangkatan',
    label: 'Tanggal Keberangkatan',
    placeholder: 'Contoh: 16 - 24 November 2026',
    hint: 'Jadwal estimasi keberangkatan & kepulangan',
  },
  {
    key: 'namaAyah',
    label: 'Nama Ayah Lengkap',
    placeholder: 'Contoh: H. Ahmad Subandi',
    hint: 'Untuk syarat paspor 3 suku kata / jaminan',
  },
  {
    key: 'kantorImigrasiDanAlamat',
    label: 'Kantor Imigrasi & Alamat Lengkap',
    placeholder: 'Contoh: Kepala Kantor Imigrasi Kelas II Cilegon, Jl. KH. Yasin Beji No.8 Kotabumi Cilegon',
    hint: 'Tujuan pengajuan paspor',
  },
  {
    key: 'nomorPasporLama',
    label: 'No Paspor Lama (Hanya Pilihan)',
    placeholder: 'Contoh: Y0195142 / C8527774',
    isOptional: true,
    hint: 'Untuk 1 kata pada nama / masih berlaku / tambahan nama / perpanjangan',
  },
  {
    key: 'expiredDatePaspor',
    label: 'Expired Date Paspor (Hanya Pilihan)',
    placeholder: 'Contoh: 11/3/2027 atau 15 Mei 2027',
    isOptional: true,
    hint: 'Untuk permohonan perpanjangan paspor',
  },
  {
    key: 'nomorWhatsapp',
    label: 'No WhatsApp yang Bisa Dihubungi',
    placeholder: 'Contoh: 081298765432',
    hint: 'Dihubungi ketika surat sudah jadi',
  },
];

// Blank WhatsApp Chat Template string that can be copied directly
export const BLANK_CHAT_TEMPLATE = `FORMAT DATA SURAT PASPOR UMRAH & REKOMENDASI (PT. ALZAM MANDIRI WISATA)
1. Nama Lengkap Sesuai KTP: 
2. Tempat Tanggal Lahir: 
3. NIK KTP: 
4. Alamat Lengkap Sesuai KTP: 
5. Tanggal Keberangkatan: 
6. Nama Ayah Lengkap: 
7. Kantor Imigrasi dan Alamat Lengkap: 
8. No Paspor Lama (Hanya Pilihan jika ada): 
9. Expired Date Paspor (Hanya Pilihan untuk perpanjangan): 
10. No WhatsApp yang Bisa Dihubungi: `;

// Sample filled chat texts for 1-click test fill
export const SAMPLE_CHAT_PRESETS = [
  {
    id: 'euis-alzam',
    title: 'Euis Cholishoh (Paket Lengkap Rekomendasi & Jaminan)',
    templateType: 'paket_lengkap_alzam' as LetterTemplateType,
    text: `FORMAT DATA SURAT PASPOR UMRAH
Nama Lengkap Sesuai KTP: Euis Cholishoh
Tempat Tanggal Lahir: Serang, 13 April 1995
NIK KTP: 3604075304950002
Alamat Lengkap Sesuai KTP: Kp. Kubang Laban Rt.005, Rw.003, Kelurahan Lambangsari, Kec. Bojonegara, Kabupaten Serang, Provinsi Banten
Tanggal Keberangkatan: 16 - 24 November 2026
Nama Ayah Lengkap: H. Ahmad Subandi
Kantor Imigrasi dan Alamat Lengkap: Kepala Kantor Imigrasi Kelas II Cilegon, Jl. KH. Yasin Beji No.8, Kotabumi, Kec. Purwakarta, Kota Cilegon, Banten 42434
No Paspor Lama: -
Expired Date Paspor: -
No WhatsApp yang Bisa Dihubungi: 081298765432`,
  },
  {
    id: 'suratman-penambahan-nama',
    title: 'Suratman (Surat Penambahan Nama Paspor 3 Suku Kata)',
    templateType: 'penambahan_nama' as LetterTemplateType,
    text: `FORMAT DATA SURAT PASPOR UMRAH
Nama Lengkap Sesuai KTP: Suratman
Tempat Tanggal Lahir: Cimahi, 10 November 1973
NIK KTP: 3277011011730005
Alamat Lengkap Sesuai KTP: Jl. Aruman Kel. Pasirkaliki RT.003 / RW.007 Kec. Cimahi Utara, Kota Cimahi, Jawa Barat
Tanggal Keberangkatan: 5 - 14 November 2026
Nama Ayah Lengkap: Emu
Kantor Imigrasi dan Alamat Lengkap: Mal Pelayanan Publik Kota Cimahi Jl. Aruman, Kelurahan Pasirkaliki, Kecamatan Cimahi Utara, Kota Cimahi, Jawa Barat 40514
No Paspor Lama Untuk Satu Kata Pada Nama dan Masih Berlaku: Y0195142
Expired Date Paspor: -
No WhatsApp yang Bisa Dihubungi: 081321456789`,
  },
  {
    id: 'safudin-perpanjangan',
    title: 'Safudin Dasman (Surat Perpanjangan Paspor Habis Berlaku)',
    templateType: 'perpanjangan_paspor' as LetterTemplateType,
    text: `FORMAT DATA SURAT PASPOR UMRAH
Nama Lengkap Sesuai KTP: Safudin Dasman
Tempat Tanggal Lahir: Cimahi, 15 April 1978
NIK KTP: 3277011504780002
Alamat Lengkap Sesuai KTP: Jl. Aruman No. 45 RT.002 / RW.006 Kel. Pasirkaliki, Kec. Cimahi Utara, Kota Cimahi, Jawa Barat
Tanggal Keberangkatan: 20 - 28 Februari 2027
Nama Ayah Lengkap: Dasman
Kantor Imigrasi dan Alamat Lengkap: Mal Pelayanan Publik Kota Cimahi Jl. Aruman, Kelurahan Pasirkaliki, Kecamatan Cimahi Utara, Kota Cimahi, Jawa Barat 40514
No Paspor Lama: C8527774
Expired Date Paspor untuk perpanjangan paspor: 11/3/2027
No WhatsApp yang Bisa Dihubungi: 081809876543`,
  },
  {
    id: 'shofiyullah-tanjungpandan',
    title: 'Shofiyullah Achmad Maksun (Permohonan Paspor Baru)',
    templateType: 'permohonan_paspor' as LetterTemplateType,
    text: `FORMAT DATA SURAT PASPOR UMRAH
Nama Lengkap Sesuai KTP: Shofiyullah Achmad Maksun
Tempat Tanggal Lahir: Jepara, 30 November 1999
NIK KTP: 1902013011990002
Alamat Lengkap Sesuai KTP: Jl. Air Ketekok Gg. Pinang RT/RW: 02/004 Kel/Desa: Air Ketekok, Kec. Tanjung Pandan, Kab. Belitung
Tanggal Keberangkatan: 12 - 23 Januari 2026
Nama Ayah Lengkap: Achmad Maksun
Kantor Imigrasi dan Alamat Lengkap: Kepala Kantor Imigrasi Kelas II TPI Tanjung Pandan, Jl. Jendral Sudirman Km. 6,5, Desa Perawas, Kec. Tanjung Pandan, Kabupaten Belitung, Kepulauan Bangka Belitung 33413
No Paspor Lama: -
Expired Date Paspor: -
No WhatsApp yang Bisa Dihubungi: 08159888154`,
  },
];

/**
 * Intelligent parser that extracts all 10 fields from raw WhatsApp chat text
 */
export function parseChatFormText(
  rawText: string,
  baseData?: Partial<ApplicantData>,
  preferredTemplate?: LetterTemplateType
): { applicant: ApplicantData; extractedFieldsCount: number } {
  const result: ApplicantData = {
    templateType: preferredTemplate || baseData?.templateType || 'paket_lengkap_alzam',
    idJamaah: baseData?.idJamaah || '3495',
    nik: baseData?.nik || '',
    namaLengkap: baseData?.namaLengkap || '',
    namaMenjadi: baseData?.namaMenjadi || '',
    tempatLahir: baseData?.tempatLahir || '',
    tanggalLahir: baseData?.tanggalLahir || '',
    tempatTanggalLahir: baseData?.tempatTanggalLahir || '',
    jenisKelamin: baseData?.jenisKelamin || 'PEREMPUAN',
    alamatKtp: baseData?.alamatKtp || '',
    nomorKk: baseData?.nomorKk || '',
    namaKepalaKeluarga: baseData?.namaKepalaKeluarga || '',
    namaAyah: baseData?.namaAyah || '',
    nomorPasporLama: baseData?.nomorPasporLama || '',
    dateOfExpiry: baseData?.dateOfExpiry || '',
    expiredDatePaspor: baseData?.expiredDatePaspor || '',
    nomorWhatsapp: baseData?.nomorWhatsapp || '',
    negaraTujuan: baseData?.negaraTujuan || 'Arab Saudi',
    estimasiKeberangkatan: baseData?.estimasiKeberangkatan || '16 - 24 November 2026',
    jadwalKeberangkatanDanKepulangan: baseData?.jadwalKeberangkatanDanKepulangan || '16 - 24 November 2026',
    keperluan: baseData?.keperluan || 'Permohonan Pembuatan Paspor Umrah',
    nomorSurat: baseData?.nomorSurat || '7379/SR/AMW/X/2026',
    nomorSuratPernyataan: baseData?.nomorSuratPernyataan || '7380/SR/AMW/X/2026',
    perihal: baseData?.perihal || 'Permohonan Pembuatan Paspor',
    tanggalSurat: baseData?.tanggalSurat || '5 Oktober 2026',
    kotaPenerbitan: baseData?.kotaPenerbitan || 'Jakarta',
    pejabatNama: baseData?.pejabatNama || 'Khairul Umam, ST, BA, MBA',
    pejabatJabatan: baseData?.pejabatJabatan || 'Direktur Utama',
    namaPerusahaan: baseData?.namaPerusahaan || 'PT. Alzam Mandiri Wisata',
    taglinePerusahaan: baseData?.taglinePerusahaan || 'Tour & Travel',
    izinPpiu: baseData?.izinPpiu || '29042200007580004',
    tanggalIzinPpiu: baseData?.tanggalIzinPpiu || '02 Agustus 2022',
    alamatPerusahaan: baseData?.alamatPerusahaan || 'Ciledug Mas, Jl. HOS Cokroaminoto Blok C9 dan C10, RT.003/RW.004, Sudimara Timur, Kecamatan Karang Tengah, Kota Tangerang, Banten 15151',
    teleponPerusahaan: baseData?.teleponPerusahaan || '0815-9888-154',
    emailPerusahaan: baseData?.emailPerusahaan || 'alzam@bisa.id',
    websitePerusahaan: baseData?.websitePerusahaan || 'www.umrahbisa.com',
    tujuanKantorImigrasi: baseData?.tujuanKantorImigrasi || 'Kepala Kantor Imigrasi Kelas II Cilegon',
    alamatKantorImigrasi: baseData?.alamatKantorImigrasi || 'Jl. KH. Yasin Beji No.8, Kotabumi, Kec. Purwakarta, Kota Cilegon, Banten 42434',
    crossCheckStatus: {
      nikValid: true,
      kkValid: true,
      nameMatched: true,
      notes: 'Data berhasil diurai dari format chat jamaah',
    },
  };

  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return { applicant: result, extractedFieldsCount: 0 };
  }

  let extractedCount = 0;
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Helper function to extract value after labels
  const extractWithPatterns = (patterns: RegExp[]): string | null => {
    for (const pattern of patterns) {
      for (const line of lines) {
        const match = line.match(pattern);
        if (match && match[1] && match[1].trim() && match[1].trim() !== '-' && match[1].trim() !== 'null') {
          return match[1].trim();
        }
      }
    }
    return null;
  };

  // 1. Nama Lengkap Sesuai KTP
  const namaVal = extractWithPatterns([
    /(?:(?:1[\.\)]\s*)?Nama\s*(?:Lengkap)?(?:\s*Sesuai\s*KTP)?)\s*[:=]\s*(.+)/i,
    /^(?:Nama|Nama Lengkap)\s*[:=]\s*(.+)/i,
  ]);
  if (namaVal) {
    result.namaLengkap = toTitleCase(namaVal);
    extractedCount++;
  }

  // 2. Tempat Tanggal Lahir
  const ttlVal = extractWithPatterns([
    /(?:(?:2[\.\)]\s*)?Tempat\s*(?:[\/,]\s*)?Tanggal\s*Lahir|TTL)\s*[:=]\s*(.+)/i,
    /^(?:Tempat[\/,]\s*Tgl\s*Lahir|Tanggal Lahir)\s*[:=]\s*(.+)/i,
  ]);
  if (ttlVal) {
    result.tempatTanggalLahir = toTitleCase(ttlVal);
    if (ttlVal.includes(',')) {
      const parts = ttlVal.split(',');
      result.tempatLahir = toTitleCase(parts[0].trim());
      result.tanggalLahir = parts.slice(1).join(',').trim();
    } else {
      result.tempatLahir = toTitleCase(ttlVal);
      result.tanggalLahir = ttlVal;
    }
    extractedCount++;
  }

  // 3. NIK KTP
  const nikVal = extractWithPatterns([
    /(?:(?:3[\.\)]\s*)?NIK(?:\s*KTP)?|No\.?\s*KTP|Nomor\s*KTP)\s*[:=]\s*([0-9\s]+)/i,
    /^(?:NIK)\s*[:=]\s*([0-9\s]+)/i,
  ]);
  if (nikVal) {
    const cleanNik = nikVal.replace(/[^0-9]/g, '');
    if (cleanNik.length >= 10) {
      result.nik = cleanNik;
      extractedCount++;
    }
  }

  // 4. Alamat Lengkap Sesuai KTP
  const alamatVal = extractWithPatterns([
    /(?:(?:4[\.\)]\s*)?Alamat(?:\s*Lengkap)?(?:\s*Sesuai\s*KTP)?)\s*[:=]\s*(.+)/i,
    /^(?:Alamat KTP|Alamat)\s*[:=]\s*(.+)/i,
  ]);
  if (alamatVal) {
    result.alamatKtp = toTitleCase(alamatVal);
    extractedCount++;
  }

  // 5. Tanggal Keberangkatan
  const keberangkatanVal = extractWithPatterns([
    /(?:(?:5[\.\)]\s*)?Tanggal\s*Keberangkatan|Tgl\s*Berangkat|Jadwal\s*Keberangkatan|Estimasi\s*Keberangkatan)\s*[:=]\s*(.+)/i,
    /^(?:Jadwal|Keberangkatan)\s*[:=]\s*(.+)/i,
  ]);
  if (keberangkatanVal) {
    result.estimasiKeberangkatan = keberangkatanVal;
    result.jadwalKeberangkatanDanKepulangan = keberangkatanVal;
    extractedCount++;
  }

  // 6. Nama Ayah Lengkap
  const ayahVal = extractWithPatterns([
    /(?:(?:6[\.\)]\s*)?Nama\s*Ayah(?:\s*Lengkap|\s*Kandung)?|Ayah\s*Kandung)\s*[:=]\s*(.+)/i,
    /^(?:Nama Ayah|Ayah)\s*[:=]\s*(.+)/i,
  ]);
  if (ayahVal) {
    result.namaAyah = toTitleCase(ayahVal);
    result.namaKepalaKeluarga = toTitleCase(ayahVal);
    extractedCount++;
  }

  // 7. Kantor Imigrasi dan Alamat Lengkap
  const imigrasiVal = extractWithPatterns([
    /(?:(?:7[\.\)]\s*)?Kantor\s*Imigrasi(?:\s*(?:dan|&)\s*Alamat(?:\s*Lengkap)?)?|Tujuan\s*Imigrasi)\s*[:=]\s*(.+)/i,
    /^(?:Kantor Imigrasi|Tujuan Kantor Imigrasi|Imigrasi)\s*[:=]\s*(.+)/i,
  ]);
  if (imigrasiVal) {
    if (imigrasiVal.includes(',')) {
      const parts = imigrasiVal.split(',');
      result.tujuanKantorImigrasi = toTitleCase(parts[0].trim());
      result.alamatKantorImigrasi = toTitleCase(parts.slice(1).join(',').trim());
    } else {
      result.tujuanKantorImigrasi = toTitleCase(imigrasiVal);
      result.alamatKantorImigrasi = toTitleCase(imigrasiVal);
    }
    extractedCount++;
  }

  // 8. No Paspor Lama
  const pasporLamaVal = extractWithPatterns([
    /(?:(?:8[\.\)]\s*)?No\.?\s*Paspor\s*Lama(?:\s*Untuk\s*Satu\s*Kata.*)?|Paspor\s*Lama|Nomor\s*Paspor\s*Lama)\s*[:=]\s*(.+)/i,
    /^(?:No Paspor Lama|Paspor Lama)\s*[:=]\s*(.+)/i,
  ]);
  if (pasporLamaVal && pasporLamaVal !== '-' && pasporLamaVal !== 'tidak ada' && pasporLamaVal !== 'belum ada') {
    result.nomorPasporLama = pasporLamaVal.toUpperCase();
    extractedCount++;
  }

  // 9. Expired Date Paspor
  const expiredVal = extractWithPatterns([
    /(?:(?:9[\.\)]\s*)?Expired\s*Date\s*Paspor(?:\s*untuk\s*perpanjangan.*)?|Masa\s*Berlaku\s*Paspor|Tgl\s*Expired\s*Paspor|Date\s*Of\s*Expiry)\s*[:=]\s*(.+)/i,
    /^(?:Expired Date|Date Of Expiry|Masa Berlaku)\s*[:=]\s*(.+)/i,
  ]);
  if (expiredVal && expiredVal !== '-' && expiredVal !== 'tidak ada' && expiredVal !== 'belum ada') {
    result.expiredDatePaspor = expiredVal;
    result.dateOfExpiry = expiredVal;
    extractedCount++;
  }

  // 10. No WhatsApp
  const waVal = extractWithPatterns([
    /(?:(?:10[\.\)]\s*)?No\.?\s*(?:Whatsa?ap|WA)(?:\s*yang\s*bisa\s*dihubungi.*)?|Nomor\s*WhatsApp|Kontak\s*WA|Telepon|No\s*HP)\s*[:=]\s*([0-9\+\-\s]+)/i,
    /^(?:No WA|WhatsApp|No HP|Telepon)\s*[:=]\s*([0-9\+\-\s]+)/i,
  ]);
  if (waVal) {
    const cleanWa = waVal.replace(/[^0-9]/g, '');
    if (cleanWa.length >= 8) {
      result.nomorWhatsapp = cleanWa;
      extractedCount++;
    }
  }

  // Auto-detect template type if not explicitly set
  if (!preferredTemplate) {
    if (result.expiredDatePaspor && result.nomorPasporLama) {
      result.templateType = 'perpanjangan_paspor';
    } else if (result.nomorPasporLama && (result.namaLengkap.split(' ').length === 1 || rawText.toLowerCase().includes('tambah nama') || rawText.toLowerCase().includes('penambahan nama'))) {
      result.templateType = 'penambahan_nama';
    }
  }

  // Auto set Nama Menjadi if template is penambahan_nama
  if (result.templateType === 'penambahan_nama' && result.namaLengkap && result.namaAyah) {
    if (!result.namaMenjadi) {
      result.namaMenjadi = `${result.namaLengkap} ${result.namaAyah}`.trim();
    }
  }

  return { applicant: result, extractedFieldsCount: extractedCount };
}
