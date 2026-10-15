import { ApplicantData } from '../types';

// Format letter according to selected template
export function formatOfficialLetterText(data: ApplicantData): string {
  const effectiveDisplayName = getEffectiveApplicantDisplayName(data);

  if (data.templateType === 'permohonan_paspor') {
    return `${data.namaPerusahaan || 'PT. ALZAM MANDIRI WISATA'}
${data.taglinePerusahaan || 'Tour & Travel'}
IZIN PPIU : ${data.izinPpiu || '29042200007580004'}
${data.alamatPerusahaan || 'Ciledug Mas, Jl. HOS Cokroaminoto Blok C9 dan C10, RT.003/RW.004, Sudimara Timur, Kecamatan Karang Tengah, Kota Tangerang, Banten 15151'}
Telp/hp : ${data.teleponPerusahaan || '0815-9888-154'}, email : ${data.emailPerusahaan || 'alzam@bisa.id'}, ${data.websitePerusahaan || 'www.umrahbisa.com'}
------------------------------------------------------------------------

Nomor   : ${data.nomorSurat}
Perihal : ${data.perihal || 'Permohonan Pembuatan Paspor'}

Kepada Yth.
${data.tujuanKantorImigrasi || 'Kepala Kantor Imigrasi Kelas II TPI Tanjung Pandan'}
${data.alamatKantorImigrasi || 'Jl. Jendral Sudirman Km. 6,5, Desa Perawas, Kec. Tanjung Pandan, Kabupaten Belitung, Kepulauan Bangka Belitung 33413.'}

Assalamu’alaikum warahmatullahi wabarakatuh
Sehubungan dengan akan adanya keberangkatan jamaah umrah ${data.namaPerusahaan || 'PT. Alzam Mandiri Wisata'} dengan izin Penyelenggara Perjalanan Ibadah Umrah yang diterbitkan ${data.tanggalIzinPpiu || '02 Agustus 2022'} oleh Pemerintah Republik Indonesia, maka dengan ini kami mengajukan permohonan guna pembuatan paspor atas nama :

Nama                 : ${effectiveDisplayName}
Tempat/Tanggal Lahir : ${data.tempatTanggalLahir}
NIK                  : ${data.nik}
Alamat               : ${data.alamatKtp}${data.namaAyah ? `\nNama Ayah Kandung    : ${data.namaAyah}` : ''}${data.nomorPasporLama ? `\nNo. Paspor Lama      : ${data.nomorPasporLama} (Satu Kata Pada Nama / Paspor Berlaku)` : ''}${data.expiredDatePaspor ? `\nMasa Berlaku Paspor  : ${data.expiredDatePaspor}` : ''}

Tanggal Keberangkatan : ${data.jadwalKeberangkatanDanKepulangan || data.estimasiKeberangkatan || '12 - 23 Januari 2026'}

Demikian permohonan ini kami buat, atas bantuan dan perhatian Bapak/Ibu kami ucapkan terima kasih. Wassalamu'alaikum warahmatullahi wabarakatuh

${data.kotaPenerbitan || 'Jakarta'}, ${data.tanggalSurat}
Hormat Kami,
${data.namaPerusahaan || 'PT. Alzam Mandiri Wisata'}

[TTD / Stempel Resmi]

${data.pejabatNama || 'Khairul Umam, ST, BA, MBA'}
${data.pejabatJabatan || 'Direktur Utama'}`;
  }

  if (data.templateType === 'pernyataan_jaminan') {
    return `${data.namaPerusahaan || 'PT. ALZAM MANDIRI WISATA'}
${data.taglinePerusahaan || 'Tour & Travel'}
IZIN PPIU : ${data.izinPpiu || '29042200007580004'}
${data.alamatPerusahaan || 'Ciledug Mas, Jl. HOS Cokroaminoto Blok C9 dan C10, RT.003/RW.004, Sudimara Timur, Kecamatan Karang Tengah, Kota Tangerang, Banten 15151'}
Telp/hp : ${data.teleponPerusahaan || '0815-9888-154'}, email : ${data.emailPerusahaan || 'alzam@bisa.id'}, ${data.websitePerusahaan || 'www.umrahbisa.com'}
------------------------------------------------------------------------

Nomor   : ${data.nomorSurat}
Perihal : ${data.perihal || 'Surat Pernyataan dan Jaminan'}

Assalamu’alaikum warahmatullahi wabarakatuh
Saya yang bertanda tangan dibawah ini:
Nama       : ${data.pejabatNama || 'Khairul Umam, S.T, B.A, MBA'}
Jabatan    : ${data.pejabatJabatan || 'Direktur Utama'}
Perusahaan : ${data.namaPerusahaan || 'PT. Alzam Mandiri Wisata'}

Bersama ini kami menyatakan:
Nama                 : ${effectiveDisplayName}
Tempat/Tanggal Lahir : ${data.tempatTanggalLahir}
NIK                  : ${data.nik}
Alamat               : ${data.alamatKtp}

adalah benar calon jamaah umrah ${data.namaPerusahaan || 'PT. Alzam Mandiri Wisata'} sebagai penyelenggara resmi perjalanan umrah dan kami bertanggungjawab dan menjamin sepenuhnya terhadap calon jamaah umrah kami dengan memperhatikan hal-hal sebagai berikut :
1 Pemohon paspor yang kami urus adalah WNI (Warga Negara Indonesia) yang sebenarnya akan melakukan perjalanan ke Arab Saudi dalam rangka menunaikan ibadah umrah.
2 Rombongan calon jamaah umrah yang kami urus tidak akan melakukan pelanggaran peraturan keimigrasian berupa penyalahgunaan izin tinggal, tidak melebihi izin tinggalnya (Overstay) memalsukan atau membuat palsu paspor yang diberikan kepadanya maupun bekerja secara ilegal.
3 Apabila terjadi pelanggaran sebagaimana dimaksud, maka izin usaha kami sebagai penyelenggara perjalanan ibadah umrah bersedia dicabut.
4 Jadwal keberangkatan dan kepulangan ke Indonesia dari Tanggal
${data.jadwalKeberangkatanDanKepulangan || data.estimasiKeberangkatan || '12 - 23 Januari 2026'}

Demikian surat Pernyataan dan Jaminan ini kami buat dengan sebenarnya untuk dipergunakan sebagaimana mestinya. Atas perhatian dan kerjasamanya kami ucapkan terima kasih. Wassalamu'alaikum warahmatullahi wabarakatuh

${data.kotaPenerbitan || 'Jakarta'}, ${data.tanggalSurat}
Hormat Kami,
${data.namaPerusahaan || 'PT. Alzam Mandiri Wisata'}

[TTD / Stempel Resmi]

${data.pejabatNama || 'Khairul Umam, ST, BA, MBA'}
${data.pejabatJabatan || 'Direktur Utama'}`;
  }

  if (data.templateType === 'penambahan_nama') {
    return `${data.namaPerusahaan || 'PT. ALZAM MANDIRI WISATA'}
${data.taglinePerusahaan || 'Tour & Travel'}
IZIN PPIU : ${data.izinPpiu || '29042200007580001'}
${data.alamatPerusahaan || 'Ciledug Mas, Jl. HOS Cokroaminoto Blok C9 dan C10, RT.003/RW.004, Sudimara Timur, Kecamatan Karang Tengah, Kota Tangerang, Banten 15151'}
Telp/hp : ${data.teleponPerusahaan || '0815-9888-154'}, email : ${data.emailPerusahaan || 'alzam@bisa.id'}, ${data.websitePerusahaan || 'www.umrahbisa.com'}
------------------------------------------------------------------------

Nomor   : ${data.nomorSurat}
Perihal : ${data.perihal || 'Permohonan Penambahan Nama Paspor'}

Kepada Yth.
${data.tujuanKantorImigrasi || 'Mal Pelayanan Publik Kota Cimahi Jl. Aruman,'}
${data.alamatKantorImigrasi || 'Kelurahan Pasirkaliki, Kecamatan Cimahi Utara, Kota Cimahi, Jawa Barat 40514'}

Assalamu’alaikum warahmatullahi wabarakatuh
Bersama ini dengan hormat kami pengurus ${data.namaPerusahaan || 'PT. Alzam Mandiri Wisata'} sebagai penyelenggara resmi perjalanan umrah dengan izin Penyelenggara Perjalanan Ibadah Umrah yang diterbitkan ${data.tanggalIzinPpiu || '02 Agustus 2022'} oleh Pemerintah Republik Indonesia No. Izin ${data.izinPpiu || '29042200007580001'}, dengan ini kami mengajukan permohonan izin penambahan nama paspor atas nama :

Nama                 : ${toTitleCase(data.namaLengkap)}
Tempat/Tanggal Lahir : ${toTitleCase(data.tempatTanggalLahir)}
Menjadi              : ${effectiveDisplayName}
Nomor Paspor Lama    : ${data.nomorPasporLama || '-'}

adalah benar calon jamaah umrah ${data.namaPerusahaan || 'PT. Alzam Mandiri Wisata'} sebagai penyelenggara resmi perjalanan umrah dan kami bertanggung jawab dan menjamin sepenuhnya terhadap calon jamaah umrah kami dengan memperhatikan hal-hal sebagai berikut :
1. Pemohon paspor yang kami urus adalah WNI (Warga Negara Indonesia) yang sebenarnya akan melakukan perjalanan ke Arab Saudi dalam rangka menunaikan ibadah umrah.
2. Rombongan calon jamaah umrah yang kami urus tidak akan melakukan pelanggaran peraturan keimigrasian berupa penyalahgunaan izin tinggal, tidak melebihi izin tinggalnya (Overstay) memalsukan atau membuat palsu paspor yang diberikan kepadanya maupun bekerja secara ilegal.
3. Apabila terjadi pelanggaran sebagaimana dimaksud, maka izin usaha kami sebagai penyelenggara perjalanan ibadah umrah bersedia dicabut.
4. Jadwal keberangkatan dan kepulangan ke Indonesia dari Tanggal 
${data.jadwalKeberangkatanDanKepulangan || data.estimasiKeberangkatan || '5 - 14 November 2026'}

Demikian permohonan ini kami buat, atas bantuan dan perhatian Bapak/Ibu kami ucapkan terima kasih. Wassalamu'alaikum warahmatullahi wabarakatuh

${data.kotaPenerbitan || 'Jakarta'}, ${data.tanggalSurat}
Hormat Kami,
${data.namaPerusahaan || 'PT. Alzam Mandiri Wisata'}

[TTD / Stempel Resmi]

${data.pejabatNama || 'Khairul Umam, S.T, B.A, MBA'}
${data.pejabatJabatan || 'Direktur Utama'}`;
  }

  if (data.templateType === 'perpanjangan_paspor') {
    return `${data.namaPerusahaan || 'PT. ALZAM MANDIRI WISATA'}
${data.taglinePerusahaan || 'Tour & Travel'}
IZIN PPIU : ${data.izinPpiu || '29042200007580001'}
${data.alamatPerusahaan || 'Ciledug Mas, Jl. HOS Cokroaminoto Blok C9 dan C10, RT.003/RW.004, Sudimara Timur, Kecamatan Karang Tengah, Kota Tangerang, Banten 15151'}
Telp/hp : ${data.teleponPerusahaan || '0815-9888-154'}, email : ${data.emailPerusahaan || 'alzam@bisa.id'}, ${data.websitePerusahaan || 'www.umrahbisa.com'}
------------------------------------------------------------------------

Nomor   : ${data.nomorSurat}
Perihal : ${data.perihal || 'Permohonan Perpanjangan Paspor'}

Kepada Yth.
${data.tujuanKantorImigrasi || 'Mal Pelayanan Publik Kota Cimahi Jl. Aruman,'}
${data.alamatKantorImigrasi || 'Kelurahan Pasirkaliki, Kecamatan Cimahi Utara, Kota Cimahi, Jawa Barat 40514'}

Assalamu’alaikum warahmatullahi wabarakatuh
Sehubungan dengan akan adanya keberangkatan jamaah umrah ${data.namaPerusahaan || 'PT. Alzam Mandiri Wisata'} dengan izin Penyelenggara Perjalanan Ibadah Umrah yang diterbitkan ${data.tanggalIzinPpiu || '02 Agustus 2022'} oleh Pemerintah Republik Indonesia, maka dengan ini kami mengajukan permohonan guna pembuatan paspor atas nama :

Nama                 : ${toTitleCase(data.namaLengkap)}
Tempat/Tanggal Lahir : ${toTitleCase(data.tempatTanggalLahir)}
Nomor Paspor Lama    : ${data.nomorPasporLama || '-'}
Date Of Expiry       : ${data.dateOfExpiry || data.expiredDatePaspor || '-'}

1. Pemohon paspor yang kami urus adalah WNI (Warga Negara Indonesia) yang sebenarnya akan melakukan perjalanan ke Arab Saudi dalam rangka menunaikan ibadah umrah.
2. Rombongan calon jamaah umrah yang kami urus tidak akan melakukan pelanggaran peraturan keimigrasian berupa penyalahgunaan izin tinggal, tidak melebihi izin tinggalnya (Overstay) memalsukan atau membuat palsu paspor yang diberikan kepadanya maupun bekerja secara ilegal.
3. Apabila terjadi pelanggaran sebagaimana dimaksud, maka izin usaha kami sebagai penyelenggara perjalanan ibadah umrah bersedia dicabut.
4. Jadwal keberangkatan dan kepulangan ke Indonesia dari Tanggal 
${data.jadwalKeberangkatanDanKepulangan || data.estimasiKeberangkatan || '5 - 14 November 2026'}

Demikian permohonan ini kami buat, atas bantuan dan perhatian Bapak/Ibu kami ucapkan terima kasih. Wassalamu'alaikum warahmatullahi wabarakatuh

${data.kotaPenerbitan || 'Jakarta'}, ${data.tanggalSurat}
Hormat Kami,
${data.namaPerusahaan || 'PT. Alzam Mandiri Wisata'}

[TTD / Stempel Resmi]

${data.pejabatNama || 'Khairul Umam, S.T, B.A, MBA'}
${data.pejabatJabatan || 'Direktur Utama'}`;
  }

  if (data.templateType === 'paket_lengkap_alzam') {
    return `=== DOKUMEN 1: SURAT PERMOHONAN PEMBUATAN PASPOR ===\n\n` +
      formatOfficialLetterText({ ...data, templateType: 'permohonan_paspor', perihal: 'Permohonan Pembuatan Paspor' }) +
      `\n\n\n=======================================================\n` +
      `=== DOKUMEN 2: SURAT PERNYATAAN DAN JAMINAN ===\n\n` +
      formatOfficialLetterText({ ...data, templateType: 'pernyataan_jaminan', perihal: 'Surat Pernyataan dan Jaminan' });
  }

  // Default: PT. Alzam Mandiri Wisata (Permohonan Paspor)
  return `${data.namaPerusahaan || 'PT. ALZAM MANDIRI WISATA'}
${data.taglinePerusahaan || 'Tour & Travel'}
IZIN PPIU : ${data.izinPpiu || '29042200007580004'}
${data.alamatPerusahaan || 'Ciledug Mas, Jl. HOS Cokroaminoto Blok C9 dan C10, RT.003/RW.004, Sudimara Timur, Kecamatan Karang Tengah, Kota Tangerang, Banten 15151'}
Telp/hp : ${data.teleponPerusahaan || '0815-9888-154'}, email : ${data.emailPerusahaan || 'alzam@bisa.id'}, ${data.websitePerusahaan || 'www.umrahbisa.com'}
------------------------------------------------------------------------

Nomor   : ${data.nomorSurat}
Perihal : ${data.perihal || 'Permohonan Pembuatan Paspor'}

Kepada Yth.
${data.tujuanKantorImigrasi || 'Kepala Kantor Imigrasi Kelas II TPI Tanjung Pandan'}
${data.alamatKantorImigrasi || 'Jl. Jendral Sudirman Km. 6,5, Desa Perawas, Kec. Tanjung Pandan, Kabupaten Belitung, Kepulauan Bangka Belitung 33413.'}

Assalamu’alaikum warahmatullahi wabarakatuh
Sehubungan dengan akan adanya keberangkatan jamaah umrah ${data.namaPerusahaan || 'PT. Alzam Mandiri Wisata'} dengan izin Penyelenggara Perjalanan Ibadah Umrah yang diterbitkan ${data.tanggalIzinPpiu || '02 Agustus 2022'} oleh Pemerintah Republik Indonesia, maka dengan ini kami mengajukan permohonan guna pembuatan paspor atas nama :

Nama                 : ${toTitleCase(data.namaLengkap)}
Tempat/Tanggal Lahir : ${toTitleCase(data.tempatTanggalLahir)}
NIK                  : ${data.nik}
Alamat               : ${toTitleCase(data.alamatKtp)}

Tanggal Keberangkatan : ${data.jadwalKeberangkatanDanKepulangan || data.estimasiKeberangkatan || '12 - 23 Januari 2026'}

Demikian permohonan ini kami buat, atas bantuan dan perhatian Bapak/Ibu kami ucapkan terima kasih. Wassalamu'alaikum warahmatullahi wabarakatuh

${data.kotaPenerbitan || 'Jakarta'}, ${data.tanggalSurat}
Hormat Kami,
${data.namaPerusahaan || 'PT. Alzam Mandiri Wisata'}

[TTD / Stempel Resmi]

${data.pejabatNama || 'Khairul Umam, ST, BA, MBA'}
${data.pejabatJabatan || 'Direktur Utama'}`;
}

// Download formatted letter as a Word Document (.doc file compatible with Microsoft Word & Google Docs)
export function exportToWordDocument(data: ApplicantData): void {
  const isPermohonan = data.templateType === 'permohonan_paspor';
  const isPernyataan = data.templateType === 'pernyataan_jaminan';
  const isPaket = data.templateType === 'paket_lengkap_alzam';

  const kopAlzam = `
    <div style="text-align: center; margin-bottom: 8px;">
      <div style="font-size: 15pt; font-weight: bold; color: #1e3a5f;">${data.namaPerusahaan || 'PT. ALZAM MANDIRI WISATA'}</div>
      <div style="font-size: 12.5pt; font-weight: 800; color: #065f46; font-style: italic;">${data.taglinePerusahaan || 'Tour & Travel'}</div>
      <div style="font-size: 10pt; font-weight: bold; margin-top: 2px;">IZIN PPIU : ${data.izinPpiu || '29042200007580004'}</div>
      <div style="font-size: 8pt; margin-top: 2px;">${data.alamatPerusahaan || 'Ciledug Mas, Jl. HOS Cokroaminoto Blok C9 dan C10, RT.003/RW.004, Sudimara Timur, Kecamatan Karang Tengah, Kota Tangerang, Banten 15151'}</div>
      <div style="font-size: 7.5pt;">Telp/hp : ${data.teleponPerusahaan || '0815-9888-154'}, email : ${data.emailPerusahaan || 'alzam@bisa.id'}, ${data.websitePerusahaan || 'www.umrahbisa.com'}</div>
    </div>
    <div style="border-top: 2px solid #000; margin: 8px 0 16px 0;"></div>
  `;

  const permohonanHtml = `
    ${kopAlzam}
    <table style="width: 100%; margin-bottom: 12px; font-size: 11pt;">
      <tr><td style="width: 80px;">Nomor</td><td style="width: 15px;">:</td><td>${data.nomorSurat}</td></tr>
      <tr><td>Perihal</td><td>:</td><td><u><b>${data.perihal || 'Permohonan Pembuatan Paspor'}</b></u></td></tr>
    </table>

    <div style="margin-bottom: 12px; font-size: 11pt;">
      Kepada Yth.<br/>
      <b>${data.tujuanKantorImigrasi || 'Kepala Kantor Imigrasi Kelas II TPI Tanjung Pandan'}</b><br/>
      ${data.alamatKantorImigrasi || 'Jl. Jendral Sudirman Km. 6,5, Desa Perawas, Kec. Tanjung Pandan, Kabupaten Belitung, Kepulauan Bangka Belitung 33413.'}
    </div>

    <p style="margin-bottom: 6px;">Assalamu’alaikum warahmatullahi wabarakatuh</p>
    <p style="text-align: justify; margin-bottom: 8px;">
      Sehubungan dengan akan adanya keberangkatan jamaah umrah ${data.namaPerusahaan || 'PT. Alzam Mandiri Wisata'} dengan izin Penyelenggara Perjalanan Ibadah Umrah yang diterbitkan ${data.tanggalIzinPpiu || '02 Agustus 2022'} oleh Pemerintah Republik Indonesia, maka dengan ini kami mengajukan permohonan guna pembuatan paspor atas nama :
    </p>

    <table style="width: 100%; margin-left: 20px; font-size: 11pt; margin-bottom: 12px;">
      <tr><td style="width: 180px;">Nama</td><td style="width: 15px;">:</td><td><b>${data.namaLengkap}</b></td></tr>
      <tr><td>Tempat/Tanggal Lahir</td><td>:</td><td>${data.tempatTanggalLahir}</td></tr>
      <tr><td>NIK</td><td>:</td><td><b>${data.nik}</b></td></tr>
      <tr><td style="vertical-align: top;">Alamat</td><td style="vertical-align: top;">:</td><td>${data.alamatKtp}</td></tr>
      <tr><td>Tanggal Keberangkatan</td><td>:</td><td><b>${data.jadwalKeberangkatanDanKepulangan || data.estimasiKeberangkatan || '12 - 23 Januari 2026'}</b></td></tr>
    </table>

    <p style="text-align: justify; margin-top: 10px;">
      Demikian permohonan ini kami buat, atas bantuan dan perhatian Bapak/Ibu kami ucapkan terima kasih. Wassalamu'alaikum warahmatullahi wabarakatuh
    </p>

    <div style="width: 100%; margin-top: 25px; text-align: right;">
      <div style="display: inline-block; text-align: left; width: 290px; line-height: 1.5;">
        <div>${data.kotaPenerbitan || 'Jakarta'}, ${data.tanggalSurat}</div>
        <div>Hormat Kami,</div>
        <div><b>${data.namaPerusahaan || 'PT. Alzam Mandiri Wisata'}</b></div>
        <div style="height: 60px;"></div>
        <div><b><u>${data.pejabatNama || 'Khairul Umam, ST, BA, MBA'}</u></b></div>
        <div>${data.pejabatJabatan || 'Direktur Utama'}</div>
      </div>
    </div>
  `;

  const pernyataanHtml = `
    ${kopAlzam}
    <table style="width: 100%; margin-bottom: 12px; font-size: 11pt;">
      <tr><td style="width: 80px;">Nomor</td><td style="width: 15px;">:</td><td>${data.nomorSurat}</td></tr>
      <tr><td>Perihal</td><td>:</td><td><u><b>Surat Pernyataan dan Jaminan</b></u></td></tr>
    </table>

    <p style="margin-bottom: 6px;">Assalamu’alaikum warahmatullahi wabarakatuh</p>
    <p style="margin-bottom: 4px;">Saya yang bertanda tangan dibawah ini:</p>
    <table style="width: 100%; margin-left: 20px; font-size: 11pt; margin-bottom: 8px;">
      <tr><td style="width: 120px;">Nama</td><td style="width: 15px;">:</td><td>${data.pejabatNama}</td></tr>
      <tr><td>Jabatan</td><td>:</td><td>${data.pejabatJabatan}</td></tr>
      <tr><td>Perusahaan</td><td>:</td><td>${data.namaPerusahaan}</td></tr>
    </table>

    <p style="margin-bottom: 4px;">Bersama ini kami menyatakan:</p>
    <table style="width: 100%; margin-left: 20px; font-size: 11pt; margin-bottom: 12px;">
      <tr><td style="width: 180px;">Nama</td><td style="width: 15px;">:</td><td><b>${data.namaLengkap}</b></td></tr>
      <tr><td>Tempat/Tanggal Lahir</td><td>:</td><td>${data.tempatTanggalLahir}</td></tr>
      <tr><td>NIK</td><td>:</td><td><b>${data.nik}</b></td></tr>
      <tr><td style="vertical-align: top;">Alamat</td><td style="vertical-align: top;">:</td><td>${data.alamatKtp}</td></tr>
    </table>

    <p style="text-align: justify; margin-bottom: 8px;">
      adalah benar calon jamaah umrah ${data.namaPerusahaan} sebagai penyelenggara resmi perjalanan umrah dan kami bertanggungjawab dan menjamin sepenuhnya terhadap calon jamaah umrah kami dengan memperhatikan hal-hal sebagai berikut :
    </p>

    <ol style="margin-left: 20px; padding-left: 10px; line-height: 1.4;">
      <li style="margin-bottom: 6px;">Pemohon paspor yang kami urus adalah WNI (Warga Negara Indonesia) yang sebenarnya akan melakukan perjalanan ke Arab Saudi dalam rangka menunaikan ibadah umrah.</li>
      <li style="margin-bottom: 6px;">Rombongan calon jamaah umrah yang kami urus tidak akan melakukan pelanggaran peraturan keimigrasian berupa penyalahgunaan izin tinggal, tidak melebihi izin tinggalnya (Overstay) memalsukan atau membuat palsu paspor yang diberikan kepadanya maupun bekerja secara ilegal.</li>
      <li style="margin-bottom: 6px;">Apabila terjadi pelanggaran sebagaimana dimaksud, maka izin usaha kami sebagai penyelenggara perjalanan ibadah umrah bersedia dicabut.</li>
      <li style="margin-bottom: 6px;">Jadwal keberangkatan dan kepulangan ke Indonesia dari Tanggal<br/><b>${data.jadwalKeberangkatanDanKepulangan || data.estimasiKeberangkatan || '12 - 23 Januari 2026'}</b></li>
    </ol>

    <p style="text-align: justify; margin-top: 10px;">
      Demikian surat Pernyataan dan Jaminan ini kami buat dengan sebenarnya untuk dipergunakan sebagaimana mestinya. Atas perhatian dan kerjasamanya kami ucapkan terima kasih. Wassalamu'alaikum warahmatullahi wabarakatuh
    </p>

    <div style="width: 100%; margin-top: 25px; text-align: right;">
      <div style="display: inline-block; text-align: left; width: 290px; line-height: 1.5;">
        <div>${data.kotaPenerbitan || 'Jakarta'}, ${data.tanggalSurat}</div>
        <div>Hormat Kami,</div>
        <div><b>${data.namaPerusahaan}</b></div>
        <div style="height: 60px;"></div>
        <div><b><u>${data.pejabatNama}</u></b></div>
        <div>${data.pejabatJabatan}</div>
      </div>
    </div>
  `;

  let bodyContent = '';
  if (isPermohonan) {
    bodyContent = permohonanHtml;
  } else if (isPernyataan) {
    bodyContent = pernyataanHtml;
  } else if (isPaket) {
    bodyContent = permohonanHtml + `<br clear="all" style="page-break-before:always" />` + pernyataanHtml;
  } else {
    bodyContent = permohonanHtml;
  }

  const content = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${data.perihal || 'Surat Imigrasi'} - ${data.namaLengkap}</title>
      <style>
        @page { size: A4 portrait; margin: 2.0cm 2.5cm 2.0cm 2.5cm; }
        body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.35; color: #000; margin: 2.0cm 2.5cm 2.0cm 2.5cm; }
        p { text-align: justify; text-justify: inter-word; }
      </style>
    </head>
    <body>
      ${bodyContent}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = isPermohonan
    ? 'Surat_Permohonan_Paspor'
    : isPernyataan
    ? 'Surat_Pernyataan_Jaminan'
    : isPaket
    ? 'Paket_Lengkap_Imigrasi_Alzam'
    : 'Surat_Rekomendasi';
  a.download = `${fileName}_${data.namaLengkap.replace(/\s+/g, '_')}_${data.nik}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download as pure text
export function exportToPlainText(data: ApplicantData): void {
  const text = formatOfficialLetterText(data);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = data.templateType === 'permohonan_paspor'
    ? 'Surat_Permohonan_Paspor'
    : data.templateType === 'pernyataan_jaminan'
    ? 'Surat_Pernyataan_Jaminan'
    : 'Surat_Rekomendasi';
  a.download = `${fileName}_${data.namaLengkap.replace(/\s+/g, '_')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Indonesian Date Formatter
export function getIndonesianCurrentDate(): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const now = new Date();
  return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

/**
 * Capitalize first letter of each word (Title Case)
 * Handles Indonesian names, addresses, places, and prevents CAPSLOCK output.
 * Preserves standard Indonesian abbreviations (NIK, KK, RT, RW, DKI, WNI, gelar S.T., MBA, dll.)
 */
export function toTitleCase(str: string): string {
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

  // Words mapped to clean title casing (without trailing dot because delimiters are preserved)
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
      
      // If purely numbers, leave as-is (e.g. 005, 3604075304950002, 100, 7)
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

export function getTodayIndonesianDate(date = new Date()): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

/**
 * Gets effective applicant name for letter display.
 * Automatically appends father's name for single-word applicant names (e.g. "SUHARDI" + "AHMAD" -> "Suhardi Ahmad")
 */
export function getEffectiveApplicantDisplayName(data: ApplicantData): string {
  const cleanNama = toTitleCase(data.namaLengkap || '').trim();
  const cleanAyah = data.namaAyah ? toTitleCase(data.namaAyah).trim() : '';
  const cleanMenjadi = data.namaMenjadi ? toTitleCase(data.namaMenjadi).trim() : '';

  if (data.templateType === 'penambahan_nama' && cleanMenjadi && cleanMenjadi !== cleanNama) {
    return cleanMenjadi;
  }

  const words = cleanNama.split(/\s+/).filter(Boolean);
  if (words.length === 1 && cleanAyah) {
    return `${cleanNama} ${cleanAyah}`;
  }

  return cleanNama;
}

export const INDO_MONTH_MAP: Record<string, string> = {
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

/**
 * Standardize any Indonesian date of birth into official "DD Bulan YYYY" format
 * (e.g. "30-11-1999" -> "30 November 1999", "13-04-1995" -> "13 April 1995")
 */
export function formatIndonesianBirthDate(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();

  // Check DD Bulan YYYY (e.g. "13 April 1995", "30 November 1999")
  const dbyMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (dbyMatch) {
    const day = parseInt(dbyMatch[1], 10);
    const mLower = dbyMatch[2].toLowerCase();
    const month = INDO_MONTH_MAP[mLower] || (dbyMatch[2].charAt(0).toUpperCase() + dbyMatch[2].slice(1).toLowerCase());
    return `${day} ${month} ${dbyMatch[3]}`;
  }

  // Check DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
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

  // Check YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = INDO_MONTH_MAP[parseInt(ymdMatch[2], 10)] || ymdMatch[2];
    const day = parseInt(ymdMatch[3], 10);
    return `${day} ${month} ${year}`;
  }

  return trimmed;
}

/**
 * Mathematically derives birth date and gender from 16-digit Indonesian NIK
 * Digits 7-8: Tanggal Lahir (>40 for female, <=40 for male)
 * Digits 9-10: Bulan Lahir
 * Digits 11-12: 2 digit tahun
 */
export function extractBirthInfoFromNik(nik: string): { tanggalLahir: string; jenisKelamin: 'LAKI-LAKI' | 'PEREMPUAN' } | null {
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

/**
 * Strips common OCR / form prefixes like "Nama :", "Nama Pemohon :", "Full Name :"
 */
export function cleanApplicantName(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/^(?:Nama|NAMA|Nama\s*Lengkap|Nama\s*Pemohon|Name|Full\s*Name)\s*[:;\-.]*\s*/i, '')
    .replace(/^[:;\-.\s]+|[:;\-.\s]+$/g, '')
    .trim();
}

export const DATE_INDO_REGEX = /(?:^|[,\s\.\-:])(\d{1,2}[\s\/\.-]+(?:Jan(?:uari)?|Feb(?:ruari)?|Mar(?:et)?|March|Apr(?:il)?|Mei|May|Jun(?:i)?|June|Jul(?:i)?|July|Agu(?:stus)?|Agt|Aug(?:ust)?|Sep(?:tember)?|Okt(?:ober)?|Oct(?:ober)?|Nov(?:ember)?|Des(?:ember)?|Dec(?:ember)?|\d{1,2})[\s\/\.-]+\d{2,4}|\d{4}[\s\/\.-]+\d{1,2}[\s\/\.-]+\d{1,2})/i;

/**
 * Intelligently separates and standardizes Place of Birth and Date of Birth
 * Handles with/without comma, multi-word city names, and NIK derivations
 */
export function parsePlaceAndBirthDate(
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

  // Clean and standardize tanggal into official Indonesian DD Bulan YYYY format
  let cleanTanggal = formatIndonesianBirthDate(tanggal);

  // Derive from NIK if date is missing or incomplete
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

/**
 * Automatically appends father's name for single-word applicant names into namaMenjadi (without corrupting namaLengkap)
 */
export function computeAutoNamaMenjadi(namaLengkap: string, namaAyah?: string, currentNamaMenjadi?: string): string {
  const cleanNama = cleanApplicantName(namaLengkap || '').trim();
  const cleanAyah = (namaAyah || '').trim();
  const words = cleanNama.split(/\s+/).filter(Boolean);

  if (words.length === 1 && cleanAyah) {
    return `${toTitleCase(cleanNama)} ${toTitleCase(cleanAyah)}`;
  }

  if (currentNamaMenjadi && currentNamaMenjadi.trim() && currentNamaMenjadi.trim() !== cleanNama) {
    return toTitleCase(currentNamaMenjadi);
  }

  return toTitleCase(cleanNama);
}

/**
 * Ensures entire ApplicantData object has clean Title Case casing
 * for all human-readable text fields (Name, TTL, Address, etc.)
 * CRITICAL: NEVER automatically mutates namaLengkap into father's name!
 */
export function formatApplicantData(data: ApplicantData): ApplicantData {
  const formattedNama = toTitleCase(cleanApplicantName(data.namaLengkap || ''));
  const formattedAyah = data.namaAyah ? toTitleCase(data.namaAyah) : undefined;

  // Harmonize place and date of birth
  const ttlParsed = parsePlaceAndBirthDate(data.tempatLahir, data.tanggalLahir, data.tempatTanggalLahir, data.nik);

  // Compute 3-word expanded name for namaMenjadi
  const autoNamaMenjadi = computeAutoNamaMenjadi(formattedNama, formattedAyah, data.namaMenjadi);
  const todayStr = getTodayIndonesianDate();

  // Determine gender (prioritize data.jenisKelamin, fallback to NIK derivation)
  const finalJk = (data.jenisKelamin || ttlParsed.jenisKelamin || 'PEREMPUAN').toUpperCase();

  return {
    ...data,
    tanggalSurat: (!data.tanggalSurat || data.tanggalSurat.trim() === '') ? todayStr : data.tanggalSurat,
    namaLengkap: formattedNama,
    namaMenjadi: autoNamaMenjadi,
    tempatLahir: ttlParsed.tempatLahir,
    tanggalLahir: ttlParsed.tanggalLahir,
    tempatTanggalLahir: ttlParsed.tempatTanggalLahir,
    jenisKelamin: finalJk,
    alamatKtp: toTitleCase(data.alamatKtp),
    namaKepalaKeluarga: toTitleCase(data.namaKepalaKeluarga),
    namaAyah: formattedAyah,
    pekerjaan: data.pekerjaan ? toTitleCase(data.pekerjaan) : undefined,
    agama: data.agama ? toTitleCase(data.agama) : undefined,
    statusPerkawinan: data.statusPerkawinan ? toTitleCase(data.statusPerkawinan) : undefined,
    tujuanKantorImigrasi: data.tujuanKantorImigrasi ? toTitleCase(data.tujuanKantorImigrasi) : undefined,
    alamatKantorImigrasi: data.alamatKantorImigrasi ? toTitleCase(data.alamatKantorImigrasi) : undefined,
  };
}

// Validate NIK
export function validateNik(nik: string): { isValid: boolean; message: string } {
  const clean = nik.replace(/[^0-9]/g, '');
  if (clean.length !== 16) {
    return {
      isValid: false,
      message: `NIK harus terdiri dari tepat 16 digit angka (saat ini ${clean.length} digit).`
    };
  }
  return { isValid: true, message: 'Format NIK 16 digit valid.' };
}

// Validate KK
export function validateNoKk(kk: string): { isValid: boolean; message: string } {
  const clean = kk.replace(/[^0-9]/g, '');
  if (clean.length !== 16) {
    return {
      isValid: false,
      message: `Nomor KK harus terdiri dari tepat 16 digit angka (saat ini ${clean.length} digit).`
    };
  }
  return { isValid: true, message: 'Format Nomor KK 16 digit valid.' };
}

// Generate WhatsApp notification URL
export function createWhatsAppNotificationUrl(data: ApplicantData): string {
  let cleanPhone = (data.nomorWhatsapp || '').replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  }
  if (!cleanPhone.startsWith('62')) {
    cleanPhone = '62' + cleanPhone;
  }

  const msg = `*PT. ALZAM MANDIRI WISATA*
_Tour & Travel (Izin PPIU: 29042200007580004)_

Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu *${data.namaLengkap}*,

Surat Rekomendasi & Pernyataan Jaminan Paspor Umrah Anda telah selesai diproses:
• *Nama Jamaah*: ${data.namaLengkap}
• *NIK*: ${data.nik}
• *Tujuan Kantor Imigrasi*: ${data.tujuanKantorImigrasi || 'Kantor Imigrasi'}
• *Nomor Surat*: ${data.nomorSurat}

Dokumen siap dicetak dan ditunjukkan ke petugas Imigrasi.
Terima kasih telah mempercayakan perjalanan ibadah Anda bersama PT. Alzam Mandiri Wisata.

Wassalamu'alaikum Wr. Wb.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}
