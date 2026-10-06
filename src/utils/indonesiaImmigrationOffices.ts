export interface ImmigrationOffice {
  id: string;
  name: string; // e.g. "Kepala Kantor Imigrasi Kelas II Cilegon"
  shortName: string; // e.g. "Kanim Kelas II Cilegon"
  city: string; // e.g. "Cilegon"
  province: string; // e.g. "Banten"
  address: string; // e.g. "Jl. KH. Yasin Beji No.8, Kotabumi, Kec. Purwakarta, Kota Cilegon, Banten 42434"
  popular?: boolean;
}

export const INDONESIA_IMMIGRATION_OFFICES: ImmigrationOffice[] = [
  // --- BANTEN ---
  {
    id: 'kanim-cilegon',
    name: 'Kepala Kantor Imigrasi Kelas II Cilegon',
    shortName: 'Kanim Kelas II Cilegon',
    city: 'Cilegon',
    province: 'Banten',
    address: 'Jl. KH. Yasin Beji No.8, Kotabumi, Kec. Purwakarta, Kota Cilegon, Banten 42434',
    popular: true,
  },
  {
    id: 'kanim-serang',
    name: 'Kepala Kantor Imigrasi Kelas I Non TPI Serang',
    shortName: 'Kanim Kelas I Serang',
    city: 'Serang',
    province: 'Banten',
    address: 'Jl. Letnan Jidun No.7, Lontarbaru, Kec. Serang, Kota Serang, Banten 42115',
    popular: true,
  },
  {
    id: 'kanim-tangerang',
    name: 'Kepala Kantor Imigrasi Kelas I Non TPI Tangerang',
    shortName: 'Kanim Kelas I Tangerang',
    city: 'Tangerang',
    province: 'Banten',
    address: 'Jl. Taman Makam Pahlawan Taruna No.10, RT.001/RW.005, Sukasari, Kec. Tangerang, Kota Tangerang, Banten 15118',
    popular: true,
  },
  {
    id: 'kanim-soetta',
    name: 'Kepala Kantor Imigrasi Kelas I Khusus TPI Soekarno-Hatta',
    shortName: 'Kanim Khusus TPI Soekarno Hatta',
    city: 'Tangerang',
    province: 'Banten',
    address: 'Gedung Perkantoran Bandara Internasional Soekarno-Hatta, Pajang, Kec. Benda, Kota Tangerang, Banten 15126',
    popular: true,
  },

  // --- DKI JAKARTA ---
  {
    id: 'kanim-jaksel',
    name: 'Kepala Kantor Imigrasi Kelas I Khusus Non TPI Jakarta Selatan',
    shortName: 'Kanim Kelas I Khusus Jaksel',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    address: 'Jl. Warung Buncit Raya No.207, RT.1/RW.1, Duren Tiga, Kec. Pancoran, Kota Jakarta Selatan, DKI Jakarta 12760',
    popular: true,
  },
  {
    id: 'kanim-jakbar',
    name: 'Kepala Kantor Imigrasi Kelas I Khusus TPI Jakarta Barat',
    shortName: 'Kanim Kelas I Khusus Jakbar',
    city: 'Jakarta Barat',
    province: 'DKI Jakarta',
    address: 'Jl. Pos Kota No.4, RT.4/RW.6, Pinangsia, Kec. Taman Sari, Kota Jakarta Barat, DKI Jakarta 11110',
    popular: true,
  },
  {
    id: 'kanim-jakpus',
    name: 'Kepala Kantor Imigrasi Kelas I Non TPI Jakarta Pusat',
    shortName: 'Kanim Kelas I Jakpus',
    city: 'Jakarta Pusat',
    province: 'DKI Jakarta',
    address: 'Jl. Merpati Blok B 12 No.3, RT.13/RW.6, Gn. Sahari Sel., Kec. Kemayoran, Kota Jakarta Pusat, DKI Jakarta 10610',
    popular: true,
  },
  {
    id: 'kanim-jaktim',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Jakarta Timur',
    shortName: 'Kanim Kelas I Jaktim',
    city: 'Jakarta Timur',
    province: 'DKI Jakarta',
    address: 'Jl. Bekasi Timur Raya No.169, RT.8/RW.14, Cipinang Besar Utara, Kec. Jatinegara, Kota Jakarta Timur, DKI Jakarta 13410',
    popular: true,
  },
  {
    id: 'kanim-jakut',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Jakarta Utara',
    shortName: 'Kanim Kelas I Jakut',
    city: 'Jakarta Utara',
    province: 'DKI Jakarta',
    address: 'Jl. Melati No.124, RT.11/RW.12, Rawabadak Utara, Kec. Koja, Kota Jakarta Utara, DKI Jakarta 14230',
    popular: true,
  },
  {
    id: 'kanim-tanjung-priok',
    name: 'Kepala Kantor Imigrasi Kelas II TPI Tanjung Priok',
    shortName: 'Kanim Kelas II Tanjung Priok',
    city: 'Jakarta Utara',
    province: 'DKI Jakarta',
    address: 'Jl. Enggano No.1, RT.5/RW.16, Tj. Priok, Kec. Tanjung Priok, Kota Jakarta Utara, DKI Jakarta 14310',
  },

  // --- JAWA BARAT ---
  {
    id: 'kanim-bandung',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Bandung',
    shortName: 'Kanim Kelas I Bandung',
    city: 'Bandung',
    province: 'Jawa Barat',
    address: 'Jl. Surapati No.82, Cihaur Geulis, Kec. Cibeunying Kaler, Kota Bandung, Jawa Barat 40122',
    popular: true,
  },
  {
    id: 'kanim-bekasi',
    name: 'Kepala Kantor Imigrasi Kelas I Non TPI Bekasi',
    shortName: 'Kanim Kelas I Bekasi',
    city: 'Bekasi',
    province: 'Jawa Barat',
    address: 'Jl. Perjuangan No.100, Teluk Pucung, Kec. Bekasi Utara, Kota Bekasi, Jawa Barat 17121',
    popular: true,
  },
  {
    id: 'kanim-depok',
    name: 'Kepala Kantor Imigrasi Kelas I Non TPI Depok',
    shortName: 'Kanim Kelas I Depok',
    city: 'Depok',
    province: 'Jawa Barat',
    address: 'Komplek Perkantoran Kota Depok, Jl. Boulevard Grand Depok City, Kalimulya, Kec. Cilodong, Kota Depok, Jawa Barat 16413',
    popular: true,
  },
  {
    id: 'kanim-bogor',
    name: 'Kepala Kantor Imigrasi Kelas I Non TPI Bogor',
    shortName: 'Kanim Kelas I Bogor',
    city: 'Bogor',
    province: 'Jawa Barat',
    address: 'Jl. A. Yani No.65, RT.04/RW.02, Tanah Sareal, Kec. Tanah Sereal, Kota Bogor, Jawa Barat 16161',
    popular: true,
  },
  {
    id: 'kanim-karawang',
    name: 'Kepala Kantor Imigrasi Kelas II Non TPI Karawang',
    shortName: 'Kanim Kelas II Karawang',
    city: 'Karawang',
    province: 'Jawa Barat',
    address: 'Jl. Jenderal Ahmad Yani No.17, Nagasari, Kec. Karawang Barat, Karawang, Jawa Barat 41314',
  },
  {
    id: 'kanim-cirebon',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Cirebon',
    shortName: 'Kanim Kelas I Cirebon',
    city: 'Cirebon',
    province: 'Jawa Barat',
    address: 'Jl. Sultan Ageng Tirtayasa No.51, Kedungdawa, Kec. Kedawung, Kabupaten Cirebon, Jawa Barat 45153',
  },
  {
    id: 'kanim-tasikmalaya',
    name: 'Kepala Kantor Imigrasi Kelas I Non TPI Tasikmalaya',
    shortName: 'Kanim Kelas I Tasikmalaya',
    city: 'Tasikmalaya',
    province: 'Jawa Barat',
    address: 'Jl. Letnan Harun No.1, Sukamulya, Kec. Bungursari, Kota Tasikmalaya, Jawa Barat 46151',
  },
  {
    id: 'kanim-sukabumi',
    name: 'Kepala Kantor Imigrasi Kelas II Non TPI Sukabumi',
    shortName: 'Kanim Kelas II Sukabumi',
    city: 'Sukabumi',
    province: 'Jawa Barat',
    address: 'Jl. Lingkar Selatan No.7, Sudajaya Hilir, Kec. Baros, Kota Sukabumi, Jawa Barat 43161',
  },

  // --- JAWA TENGAH ---
  {
    id: 'kanim-semarang',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Semarang',
    shortName: 'Kanim Kelas I Semarang',
    city: 'Semarang',
    province: 'Jawa Tengah',
    address: 'Jl. Siliwangi No.514, Kembangarum, Kec. Semarang Barat, Kota Semarang, Jawa Tengah 50183',
    popular: true,
  },
  {
    id: 'kanim-surakarta',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Surakarta',
    shortName: 'Kanim Kelas I Solo / Surakarta',
    city: 'Surakarta',
    province: 'Jawa Tengah',
    address: 'Jl. Adi Sucipto No.8, Paulan Kulon, Malangjiwan, Kec. Colomadu, Kabupaten Karanganyar, Jawa Tengah 57177',
    popular: true,
  },
  {
    id: 'kanim-pati',
    name: 'Kepala Kantor Imigrasi Kelas I Non TPI Pati',
    shortName: 'Kanim Kelas I Pati',
    city: 'Pati',
    province: 'Jawa Tengah',
    address: 'Jl. Raya Pati - Kudus KM.4, Plangitan, Kec. Pati, Kabupaten Pati, Jawa Tengah 59112',
  },
  {
    id: 'kanim-pemalang',
    name: 'Kepala Kantor Imigrasi Kelas I Non TPI Pemalang',
    shortName: 'Kanim Kelas I Pemalang',
    city: 'Pemalang',
    province: 'Jawa Tengah',
    address: 'Jl. Jenderal Sudirman Timur No.80, Wanarejan Sel., Kec. Taman, Kabupaten Pemalang, Jawa Tengah 52361',
  },
  {
    id: 'kanim-cilacap',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Cilacap',
    shortName: 'Kanim Kelas I Cilacap',
    city: 'Cilacap',
    province: 'Jawa Tengah',
    address: 'Jl. Urip Sumoharjo No.249, Gumilir, Kec. Cilacap Utara, Kabupaten Cilacap, Jawa Tengah 53231',
  },
  {
    id: 'kanim-wonosobo',
    name: 'Kepala Kantor Imigrasi Kelas II Non TPI Wonosobo',
    shortName: 'Kanim Kelas II Wonosobo',
    city: 'Wonosobo',
    province: 'Jawa Tengah',
    address: 'Jl. Dieng No.38, Mendolo, Bumireso, Kec. Wonosobo, Kabupaten Wonosobo, Jawa Tengah 56317',
  },

  // --- DI YOGYAKARTA ---
  {
    id: 'kanim-yogyakarta',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Yogyakarta',
    shortName: 'Kanim Kelas I Yogyakarta',
    city: 'Yogyakarta',
    province: 'DI Yogyakarta',
    address: 'Jl. Raya Solo - Yogyakarta KM.10, Sambisari, Maguwoharjo, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55282',
    popular: true,
  },

  // --- JAWA TIMUR ---
  {
    id: 'kanim-surabaya',
    name: 'Kepala Kantor Imigrasi Kelas I Khusus TPI Surabaya',
    shortName: 'Kanim Kelas I Khusus Surabaya',
    city: 'Surabaya',
    province: 'Jawa Timur',
    address: 'Jl. Raya Juanda KM 3-4, Sedati, Kabupaten Sidoarjo, Jawa Timur 61253',
    popular: true,
  },
  {
    id: 'kanim-tanjung-perak',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Tanjung Perak',
    shortName: 'Kanim Kelas I Tanjung Perak',
    city: 'Surabaya',
    province: 'Jawa Timur',
    address: 'Jl. Darmo Indah No.21, Tandes, Kec. Tandes, Surabaya, Jawa Timur 60187',
  },
  {
    id: 'kanim-malang',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Malang',
    shortName: 'Kanim Kelas I Malang',
    city: 'Malang',
    province: 'Jawa Timur',
    address: 'Jl. Raden Panji Suroso No.4, Polowijen, Kec. Blimbing, Kota Malang, Jawa Timur 65126',
    popular: true,
  },
  {
    id: 'kanim-kediri',
    name: 'Kepala Kantor Imigrasi Kelas II Non TPI Kediri',
    shortName: 'Kanim Kelas II Kediri',
    city: 'Kediri',
    province: 'Jawa Timur',
    address: 'Jl. Jawa No.135, Dusun Bedrek, Grogol, Kec. Grogol, Kabupaten Kediri, Jawa Timur 64151',
  },
  {
    id: 'kanim-madiun',
    name: 'Kepala Kantor Imigrasi Kelas II Non TPI Madiun',
    shortName: 'Kanim Kelas II Madiun',
    city: 'Madiun',
    province: 'Jawa Timur',
    address: 'Jl. Raya Surabaya - Madiun KM. 154, Balerejo, Kabupaten Madiun, Jawa Timur 63152',
  },
  {
    id: 'kanim-jember',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Jember',
    shortName: 'Kanim Kelas I Jember',
    city: 'Jember',
    province: 'Jawa Timur',
    address: 'Jl. Letjen Panjaitan No.47, Lingkungan Sadengan, Kebonsari, Kec. Sumbersari, Kabupaten Jember, Jawa Timur 68122',
  },
  {
    id: 'kanim-blitar',
    name: 'Kepala Kantor Imigrasi Kelas II Non TPI Blitar',
    shortName: 'Kanim Kelas II Blitar',
    city: 'Blitar',
    province: 'Jawa Timur',
    address: 'Jl. Raya Mastrip No.45, Srengat, Kec. Srengat, Kabupaten Blitar, Jawa Timur 66152',
  },
  {
    id: 'kanim-pamekasan',
    name: 'Kepala Kantor Imigrasi Kelas II Non TPI Pamekasan',
    shortName: 'Kanim Kelas II Pamekasan Madura',
    city: 'Pamekasan',
    province: 'Jawa Timur',
    address: 'Jl. Raya Panglegur No.KM 3.5, Buddagan, Kec. Pademawu, Kabupaten Pamekasan, Jawa Timur 69323',
  },

  // --- SUMATERA UTARA & ACEH ---
  {
    id: 'kanim-medan',
    name: 'Kepala Kantor Imigrasi Kelas I Khusus TPI Medan',
    shortName: 'Kanim Khusus TPI Medan',
    city: 'Medan',
    province: 'Sumatera Utara',
    address: 'Jl. Gatot Subroto No.268 A, Sei Sikambing D, Kec. Medan Petisah, Kota Medan, Sumatera Utara 20119',
    popular: true,
  },
  {
    id: 'kanim-polonia',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Polonia',
    shortName: 'Kanim Kelas I Polonia Medan',
    city: 'Medan',
    province: 'Sumatera Utara',
    address: 'Jl. Mangkubumi No.2, A U R, Kec. Medan Maimun, Kota Medan, Sumatera Utara 20151',
  },
  {
    id: 'kanim-belawan',
    name: 'Kepala Kantor Imigrasi Kelas II TPI Belawan',
    shortName: 'Kanim Kelas II Belawan',
    city: 'Medan',
    province: 'Sumatera Utara',
    address: 'Jl. Serma Hanafiah No.1, Belawan I, Medan Kota Belawan, Kota Medan, Sumatera Utara 20411',
  },
  {
    id: 'kanim-pematangsiantar',
    name: 'Kepala Kantor Imigrasi Kelas II TPI Pematang Siantar',
    shortName: 'Kanim Kelas II Pematang Siantar',
    city: 'Pematangsiantar',
    province: 'Sumatera Utara',
    address: 'Jl. Medan KM 11.5, Sinaksak, Kec. Tapian Dolok, Kabupaten Simalungun, Sumatera Utara 21154',
  },
  {
    id: 'kanim-banda-aceh',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Banda Aceh',
    shortName: 'Kanim Kelas I Banda Aceh',
    city: 'Banda Aceh',
    province: 'Aceh',
    address: 'Jl. Tgk M. Daud Beureueh No.82, Bandar Baru, Kec. Kuta Alam, Kota Banda Aceh, Aceh 23126',
  },

  // --- SUMATERA BARAT, RIAU, KEPRI ---
  {
    id: 'kanim-padang',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Padang',
    shortName: 'Kanim Kelas I Padang',
    city: 'Padang',
    province: 'Sumatera Barat',
    address: 'Jl. Khatib Sulaiman No.50, Lolong Belanti, Kec. Padang Utara, Kota Padang, Sumatera Barat 25173',
    popular: true,
  },
  {
    id: 'kanim-pekanbaru',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Pekanbaru',
    shortName: 'Kanim Kelas I Pekanbaru',
    city: 'Pekanbaru',
    province: 'Riau',
    address: 'Jl. Teratai No.87, Pulau Karomah, Kec. Sukajadi, Kota Pekanbaru, Riau 28127',
    popular: true,
  },
  {
    id: 'kanim-batam',
    name: 'Kepala Kantor Imigrasi Kelas I Khusus TPI Batam',
    shortName: 'Kanim Kelas I Khusus Batam',
    city: 'Batam',
    province: 'Kepulauan Riau',
    address: 'Jl. Engku Putri No.3, Teluk Tering, Batam Kota, Kota Batam, Kepulauan Riau 29461',
    popular: true,
  },
  {
    id: 'kanim-tanjungpinang',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Tanjung Pinang',
    shortName: 'Kanim Kelas I Tanjungpinang',
    city: 'Tanjungpinang',
    province: 'Kepulauan Riau',
    address: 'Jl. Ahmad Yani No.31, Sei Jang, Kec. Bukit Bestari, Kota Tanjung Pinang, Kepulauan Riau 29124',
  },

  // --- SUMATERA SELATAN, JAMBI, LAMPUNG, BANGKA BELITUNG ---
  {
    id: 'kanim-palembang',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Palembang',
    shortName: 'Kanim Kelas I Palembang',
    city: 'Palembang',
    province: 'Sumatera Selatan',
    address: 'Jl. Pangeran Ratu No.1, 8 Ulu, Kecamatan Seberang Ulu I, Kota Palembang, Sumatera Selatan 30252',
    popular: true,
  },
  {
    id: 'kanim-bandar-lampung',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Bandar Lampung',
    shortName: 'Kanim Kelas I Bandar Lampung',
    city: 'Bandar Lampung',
    province: 'Lampung',
    address: 'Jl. Hj. Cut Mutia No.38, Gulak Galik, Kec. Telukbetung Utara, Kota Bandar Lampung, Lampung 35214',
    popular: true,
  },
  {
    id: 'kanim-jambi',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Jambi',
    shortName: 'Kanim Kelas I Jambi',
    city: 'Jambi',
    province: 'Jambi',
    address: 'Jl. Arif Rahman Hakim No.63, Telanaipura, Kec. Telanaipura, Kota Jambi, Jambi 36122',
  },
  {
    id: 'kanim-pangkalpinang',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Pangkal Pinang',
    shortName: 'Kanim Kelas I Pangkal Pinang',
    city: 'Pangkalpinang',
    province: 'Kepulauan Bangka Belitung',
    address: 'Jl. Taman Bunga No.2, Gerunggang, Kota Pangkal Pinang, Kepulauan Bangka Belitung 33123',
  },
  {
    id: 'kanim-tanjung-pandan',
    name: 'Kepala Kantor Imigrasi Kelas II TPI Tanjung Pandan',
    shortName: 'Kanim Kelas II Tanjung Pandan Belitung',
    city: 'Tanjung Pandan',
    province: 'Kepulauan Bangka Belitung',
    address: 'Jl. Jendral Sudirman Km. 6,5, Desa Perawas, Kec. Tanjung Pandan, Kabupaten Belitung, Kepulauan Bangka Belitung 33413',
    popular: true,
  },

  // --- BALI & NUSA TENGGARA ---
  {
    id: 'kanim-ngurah-rai',
    name: 'Kepala Kantor Imigrasi Kelas I Khusus TPI Ngurah Rai',
    shortName: 'Kanim Khusus Ngurah Rai Bali',
    city: 'Badung',
    province: 'Bali',
    address: 'Jl. Raya Taman Jimbaran No.1, Jimbaran, Kec. Kuta Sel., Kabupaten Badung, Bali 80361',
    popular: true,
  },
  {
    id: 'kanim-denpasar',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Denpasar',
    shortName: 'Kanim Kelas I Denpasar',
    city: 'Denpasar',
    province: 'Bali',
    address: 'Jl. D.I. Panjaitan No.3, Dangin Puri Klod, Kec. Denpasar Tim., Kota Denpasar, Bali 80234',
  },
  {
    id: 'kanim-mataram',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Mataram',
    shortName: 'Kanim Kelas I Mataram Lombok',
    city: 'Mataram',
    province: 'Nusa Tenggara Barat',
    address: 'Jl. Udayana No.2, Monjok Bar., Kec. Selaparang, Kota Mataram, Nusa Tenggara Barat 83122',
    popular: true,
  },
  {
    id: 'kanim-kupang',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Kupang',
    shortName: 'Kanim Kelas I Kupang',
    city: 'Kupang',
    province: 'Nusa Tenggara Timur',
    address: 'Jl. Adi Sucipto No.10, Penfui, Kec. Maulafa, Kota Kupang, Nusa Tenggara Timur 85361',
  },

  // --- KALIMANTAN ---
  {
    id: 'kanim-balikpapan',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Balikpapan',
    shortName: 'Kanim Kelas I Balikpapan',
    city: 'Balikpapan',
    province: 'Kalimantan Timur',
    address: 'Jl. Jenderal Sudirman No.99, Klandasan Ulu, Balikpapan Kota, Kota Balikpapan, Kalimantan Timur 76112',
    popular: true,
  },
  {
    id: 'kanim-samarinda',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Samarinda',
    shortName: 'Kanim Kelas I Samarinda',
    city: 'Samarinda',
    province: 'Kalimantan Timur',
    address: 'Jl. Juanda No.45, Air Putih, Kec. Samarinda Ulu, Kota Samarinda, Kalimantan Timur 75124',
  },
  {
    id: 'kanim-pontianak',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Pontianak',
    shortName: 'Kanim Kelas I Pontianak',
    city: 'Pontianak',
    province: 'Kalimantan Barat',
    address: 'Jl. Letjen Sutoyo No.1, Parit Tokaya, Kec. Pontianak Sel., Kota Pontianak, Kalimantan Barat 78113',
    popular: true,
  },
  {
    id: 'kanim-banjarmasin',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Banjarmasin',
    shortName: 'Kanim Kelas I Banjarmasin',
    city: 'Banjarmasin',
    province: 'Kalimantan Selatan',
    address: 'Jl. A. Yani KM. 21,5 Landasan Ulin Barat, Liang Anggang, Kota Banjarbaru, Kalimantan Selatan 70722',
    popular: true,
  },
  {
    id: 'kanim-palangkaraya',
    name: 'Kepala Kantor Imigrasi Kelas I Non TPI Palangka Raya',
    shortName: 'Kanim Kelas I Palangkaraya',
    city: 'Palangkaraya',
    province: 'Kalimantan Tengah',
    address: 'Jl. G. Obos No.10, Menteng, Kec. Jekan Raya, Kota Palangka Raya, Kalimantan Tengah 74874',
  },

  // --- SULAWESI ---
  {
    id: 'kanim-makassar',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Makassar',
    shortName: 'Kanim Kelas I Makassar',
    city: 'Makassar',
    province: 'Sulawesi Selatan',
    address: 'Jl. Perintis Kemerdekaan KM.13 No.26, Daya, Kec. Biringkanaya, Kota Makassar, Sulawesi Selatan 90243',
    popular: true,
  },
  {
    id: 'kanim-manado',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Manado',
    shortName: 'Kanim Kelas I Manado',
    city: 'Manado',
    province: 'Sulawesi Utara',
    address: 'Jl. 17 Agustus No.4, Teling Atas, Kec. Wanea, Kota Manado, Sulawesi Utara 95119',
    popular: true,
  },
  {
    id: 'kanim-palu',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Palu',
    shortName: 'Kanim Kelas I Palu',
    city: 'Palu',
    province: 'Sulawesi Tengah',
    address: 'Jl. Banteng No.45, Tatura Sel., Kec. Palu Sel., Kota Palu, Sulawesi Tengah 94111',
  },
  {
    id: 'kanim-kendari',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Kendari',
    shortName: 'Kanim Kelas I Kendari',
    city: 'Kendari',
    province: 'Sulawesi Tenggara',
    address: 'Jl. DI Panjaitan No.163, Lepo-Lepo, Kec. Baruga, Kota Kendari, Sulawesi Tenggara 93116',
  },

  // --- MALUKU & PAPUA ---
  {
    id: 'kanim-ambon',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Ambon',
    shortName: 'Kanim Kelas I Ambon',
    city: 'Ambon',
    province: 'Maluku',
    address: 'Jl. Dr. Kayadoe No.60, Kudamati, Kec. Nusaniwe, Kota Ambon, Maluku 97116',
  },
  {
    id: 'kanim-jayapura',
    name: 'Kepala Kantor Imigrasi Kelas I TPI Jayapura',
    shortName: 'Kanim Kelas I Jayapura',
    city: 'Jayapura',
    province: 'Papua',
    address: 'Jl. Percetakan Negara No.15, Gurabesi, Kec. Jayapura Utara, Kota Jayapura, Papua 99111',
  },
  {
    id: 'kanim-sorong',
    name: 'Kepala Kantor Imigrasi Kelas II TPI Sorong',
    shortName: 'Kanim Kelas II Sorong',
    city: 'Sorong',
    province: 'Papua Barat Daya',
    address: 'Jl. Jenderal Sudirman No.87, Malawei, Distrik Sorong Manoi, Kota Sorong, Papua Barat Daya 98412',
  },
];

// Helper to find office by name, address, or query
export function findImmigrationOffice(query: string): ImmigrationOffice | undefined {
  if (!query) return undefined;
  const q = query.toLowerCase().trim();
  return INDONESIA_IMMIGRATION_OFFICES.find(
    (o) =>
      o.name.toLowerCase().includes(q) ||
      o.shortName.toLowerCase().includes(q) ||
      o.city.toLowerCase() === q ||
      o.address.toLowerCase().includes(q)
  );
}

// Group offices by province
export function getImmigrationOfficesByProvince(): Record<string, ImmigrationOffice[]> {
  const grouped: Record<string, ImmigrationOffice[]> = {};
  INDONESIA_IMMIGRATION_OFFICES.forEach((office) => {
    if (!grouped[office.province]) {
      grouped[office.province] = [];
    }
    grouped[office.province].push(office);
  });
  return grouped;
}
