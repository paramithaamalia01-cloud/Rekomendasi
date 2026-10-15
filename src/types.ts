export type LetterTemplateType = 
  | 'permohonan_paspor' 
  | 'pernyataan_jaminan' 
  | 'penambahan_nama' 
  | 'perpanjangan_paspor' 
  | 'paket_lengkap_alzam' 
  | 'rekomendasi';

export interface ApplicantData {
  templateType?: LetterTemplateType;
  nik: string;
  namaLengkap: string;
  namaMenjadi?: string; // Untuk Surat Penambahan Nama Paspor (contoh: Suratman Menjadi Suratman Emu)
  tempatLahir: string;
  tanggalLahir: string;
  tempatTanggalLahir: string;
  jenisKelamin: 'LAKI-LAKI' | 'PEREMPUAN' | string;
  alamatKtp: string;
  nomorKk: string;
  namaKepalaKeluarga: string;
  namaAyah?: string;
  nomorPasporLama?: string; // Untuk Penambahan Nama / Perpanjangan Paspor (contoh: Y0195142 / C8527774)
  dateOfExpiry?: string; // Date Of Expiry untuk Surat Perpanjangan Paspor (contoh: 11/3/2027)
  expiredDatePaspor?: string;
  nomorWhatsapp?: string;
  agama?: string;
  pekerjaan?: string;
  statusPerkawinan?: string;
  kewarganegaraan?: string;
  negaraTujuan: string;
  estimasiKeberangkatan: string;
  keperluan: string;
  kantorImigrasiTujuan?: string;
  nomorSurat: string;
  nomorSuratPernyataan?: string;
  idJamaah?: string;
  tanggalSurat: string;
  kotaPenerbitan?: string;
  pejabatNama: string;
  pejabatJabatan: string;
  namaPerusahaan: string;
  alamatPerusahaan: string;
  perihal?: string;
  izinPpiu?: string;
  tanggalIzinPpiu?: string;
  tujuanKantorImigrasi?: string;
  alamatKantorImigrasi?: string;
  teleponPerusahaan?: string;
  emailPerusahaan?: string;
  websitePerusahaan?: string;
  taglinePerusahaan?: string;
  jadwalKeberangkatanDanKepulangan?: string;
  customAssets?: {
    logoAlzam?: string;
    logoUmrahBisa?: string;
    stempel?: string;
    ttd?: string;
  };
  crossCheckStatus?: {
    nikValid: boolean;
    kkValid: boolean;
    nameMatched: boolean;
    notes: string;
  };
}

export interface UploadedFiles {
  ktpBase64: string | null;
  ktpName: string | null;
  kkBase64: string | null;
  kkName: string | null;
  passportBase64?: string | null;
  passportName?: string | null;
}

export interface LetterRecord extends ApplicantData {
  id: string;
  createdAt: string;
  withMaterai: boolean;
  withStamp: boolean;
  withSignature: boolean;
}
