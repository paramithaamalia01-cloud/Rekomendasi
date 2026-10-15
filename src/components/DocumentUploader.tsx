import React, { useState, useRef } from 'react';
import {
  Upload,
  FileCheck,
  Sparkles,
  AlertCircle,
  Eye,
  Trash2,
  Plane,
  Calendar,
  Layers,
  MapPin,
  CheckCircle2,
  X,
  FileText,
  Building2,
  FileSpreadsheet,
  ArrowRight,
  Edit3,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';
import { UploadedFiles, ApplicantData, LetterTemplateType } from '../types';
import { DEMO_PROFILES, generateKtpImage, generateKkImage, DemoProfile } from '../utils/sampleDocuments';
import {
  parseSpreadsheetTextToApplicant,
  USER_SAMPLE_SPREADSHEET_ROW
} from '../utils/spreadsheetParser';
import {
  toTitleCase,
  formatApplicantData,
  parsePlaceAndBirthDate,
  cleanApplicantName,
  formatIndonesianBirthDate,
} from '../utils/letterFormatter';
import { ImmigrationOfficePicker } from './ImmigrationOfficePicker';
import { generateNextSequentialNumbers } from '../utils/letterNumbering';
import { processDocumentsInBrowser } from '../utils/clientOcr';

interface DocumentUploaderProps {
  files: UploadedFiles;
  setFiles: React.Dispatch<React.SetStateAction<UploadedFiles>>;
  onExtractionSuccess: (data: ApplicantData) => void;
  onDirectPreview?: (data: ApplicantData) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (loading: boolean) => void;
  errorMsg: string | null;
  setErrorMsg: (msg: string | null) => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  files,
  setFiles,
  onExtractionSuccess,
  onDirectPreview,
  isAnalyzing,
  setIsAnalyzing,
  errorMsg,
  setErrorMsg,
}) => {
  // Input method mode: 'files' (Upload KTP/KK) vs 'spreadsheet' (Paste Excel row directly)
  const [inputMode, setInputMode] = useState<'files' | 'spreadsheet'>('files');
  const [spreadsheetText, setSpreadsheetText] = useState<string>('');
  const [parsedSpreadsheet, setParsedSpreadsheet] = useState(() =>
    parseSpreadsheetTextToApplicant(USER_SAMPLE_SPREADSHEET_ROW, 'paket_lengkap_alzam')
  );

  // Template selection: default to 'paket_lengkap_alzam'
  const [templateType, setTemplateType] = useState<LetterTemplateType>('paket_lengkap_alzam');

  // 2 Mandatory Inputs to accompany KTP & KK Scan
  const [departureDate, setDepartureDate] = useState<string>('16 - 24 November 2026');
  const [tujuanImigrasi, setTujuanImigrasi] = useState<string>('Kepala Kantor Imigrasi Kelas II Cilegon');
  const [alamatImigrasi, setAlamatImigrasi] = useState<string>(
    'Jl. KH. Yasin Beji No.8, Kotabumi, Kec. Purwakarta, Kota Cilegon, Banten 42434'
  );
  const [zoomImage, setZoomImage] = useState<{ title: string; src: string } | null>(null);
  const [loadedDemoProfile, setLoadedDemoProfile] = useState<DemoProfile | null>(null);

  // Drag and drop state for photos with enter counters to prevent flickering
  const [isDraggingKtp, setIsDraggingKtp] = useState<boolean>(false);
  const [isDraggingKk, setIsDraggingKk] = useState<boolean>(false);
  const [isDraggingPassport, setIsDraggingPassport] = useState<boolean>(false);
  const ktpDragCounter = useRef<number>(0);
  const kkDragCounter = useRef<number>(0);
  const passportDragCounter = useRef<number>(0);

  const ktpInputRef = useRef<HTMLInputElement>(null);
  const kkInputRef = useRef<HTMLInputElement>(null);
  const passportInputRef = useRef<HTMLInputElement>(null);

  // Prevent browser from opening dropped files in new tab when dropped outside zone
  React.useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('dragover', preventDefaults, false);
    window.addEventListener('drop', preventDefaults, false);

    return () => {
      window.removeEventListener('dragover', preventDefaults, false);
      window.removeEventListener('drop', preventDefaults, false);
    };
  }, []);

  // Quick country presets
  const countryPresets = [
    { label: 'Arab Saudi (Umroh)', val: 'Arab Saudi' },
    { label: 'Jepang', val: 'Jepang' },
    { label: 'Turki', val: 'Turki' },
    { label: 'Eropa Barat', val: 'Eropa Barat' },
    { label: 'Lainnya...', val: 'custom' },
  ];

  // Helper to test if file is an image
  const isImageFile = (file: File): boolean => {
    if (!file) return false;
    if (file.type && (file.type.startsWith('image/') || file.type === 'application/pdf')) return true;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'jfif', 'heic', 'tif', 'tiff', 'svg'].includes(ext);
  };

  // Helper to read file and compress oversized photos to crisp, lightweight Base64 (max 1400px, < 300KB)
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const reader = new FileReader();

      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (!result) {
          reject(new Error('Gagal membaca berkas dokumen.'));
          return;
        }

        // For PDF documents (e.g. Kartu Keluarga digital Dukcapil), pass directly without Image canvas
        if (isPdf) {
          resolve(result);
          return;
        }

        // For images, resize to max 1400px to ensure crisp OCR text while keeping payload < 300KB
        const img = new Image();
        img.onload = () => {
          try {
            const maxDim = 1400;
            let width = img.width;
            let height = img.height;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.84);
              resolve(compressedBase64);
            } else {
              resolve(result);
            }
          } catch {
            resolve(result);
          }
        };
        img.onerror = () => resolve(result);
        img.src = result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processKtpFile = async (file: File) => {
    if (!file) return;
    if (!isImageFile(file)) {
      setErrorMsg('Harap masukkan berkas foto / gambar KTP (JPG, JPEG, PNG, WEBP).');
      return;
    }
    try {
      const base64 = await readFileAsBase64(file);
      setFiles((prev) => ({
        ...prev,
        ktpBase64: base64,
        ktpName: file.name,
      }));
      setLoadedDemoProfile(null);
      setErrorMsg(null);
    } catch {
      setErrorMsg('Gagal membaca berkas KTP.');
    }
  };

  const processKkFile = async (file: File) => {
    if (!file) return;
    if (!isImageFile(file)) {
      setErrorMsg('Harap masukkan berkas foto / gambar Kartu Keluarga (JPG, JPEG, PNG, WEBP).');
      return;
    }
    try {
      const base64 = await readFileAsBase64(file);
      setFiles((prev) => ({
        ...prev,
        kkBase64: base64,
        kkName: file.name,
      }));
      setLoadedDemoProfile(null);
      setErrorMsg(null);
    } catch {
      setErrorMsg('Gagal membaca berkas KK.');
    }
  };

  const handleKtpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processKtpFile(file);
    }
  };

  const handleKkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processKkFile(file);
    }
  };

  const handleKtpDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    ktpDragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingKtp(true);
    }
  };

  const handleKtpDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingKtp) {
      setIsDraggingKtp(true);
    }
  };

  const handleKtpDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    ktpDragCounter.current -= 1;
    if (ktpDragCounter.current <= 0) {
      ktpDragCounter.current = 0;
      setIsDraggingKtp(false);
    }
  };

  const handleKtpDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    ktpDragCounter.current = 0;
    setIsDraggingKtp(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processKtpFile(file);
    }
  };

  const handleKkDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    kkDragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingKk(true);
    }
  };

  const handleKkDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingKk) {
      setIsDraggingKk(true);
    }
  };

  const handleKkDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    kkDragCounter.current -= 1;
    if (kkDragCounter.current <= 0) {
      kkDragCounter.current = 0;
      setIsDraggingKk(false);
    }
  };

  const handleKkDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    kkDragCounter.current = 0;
    setIsDraggingKk(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processKkFile(file);
    }
  };

  const processPassportFile = async (file: File) => {
    if (!isImageFile(file)) {
      setErrorMsg('Mohon unggah berkas berupa foto/scan gambar Paspor (JPG, PNG, WEBP).');
      return;
    }
    try {
      const base64 = await readFileAsBase64(file);
      setFiles((prev) => ({
        ...prev,
        passportBase64: base64,
        passportName: file.name,
      }));
      setLoadedDemoProfile(null);
      setErrorMsg(null);
    } catch {
      setErrorMsg('Gagal membaca berkas Paspor.');
    }
  };

  const handlePassportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processPassportFile(file);
    }
  };

  const handlePassportDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    passportDragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingPassport(true);
    }
  };

  const handlePassportDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingPassport) {
      setIsDraggingPassport(true);
    }
  };

  const handlePassportDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    passportDragCounter.current -= 1;
    if (passportDragCounter.current <= 0) {
      passportDragCounter.current = 0;
      setIsDraggingPassport(false);
    }
  };

  const handlePassportDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    passportDragCounter.current = 0;
    setIsDraggingPassport(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processPassportFile(file);
    }
  };

  // 1-Click Load Demo Profile
  const handleLoadDemo = (profileIndex = 0) => {
    const profile = DEMO_PROFILES[profileIndex] || DEMO_PROFILES[0];
    const ktpDataUrl = generateKtpImage(profile);
    const kkDataUrl = generateKkImage(profile);

    setFiles({
      ktpBase64: ktpDataUrl,
      ktpName: `KTP_${profile.ktpData.nama.replace(/\s+/g, '_')}.png`,
      kkBase64: kkDataUrl,
      kkName: `KK_No_${profile.kkData.noKk}.png`,
    });

    setLoadedDemoProfile(profile);

    if (profile.id === 'shofiyullah-alzam') {
      setTemplateType('pernyataan_jaminan');
    } else if (profile.id === 'suratman-penambahan-nama') {
      setTemplateType('penambahan_nama');
    } else if (profile.id === 'nurhayati-perpanjangan-paspor') {
      setTemplateType('perpanjangan_paspor');
    } else {
      setTemplateType('permohonan_paspor');
    }

    if (profile.departure) {
      setDepartureDate(profile.departure);
    }
    setErrorMsg(null);
  };

  const handleSpreadsheetChange = (val: string) => {
    setSpreadsheetText(val);
    if (val.trim()) {
      setParsedSpreadsheet(parseSpreadsheetTextToApplicant(val, templateType));
    }
  };

  const handleLoadSampleSpreadsheet = () => {
    setSpreadsheetText(USER_SAMPLE_SPREADSHEET_ROW);
    setParsedSpreadsheet(parseSpreadsheetTextToApplicant(USER_SAMPLE_SPREADSHEET_ROW, templateType));
  };

  const handleApplySpreadsheet = (directToPreview = true) => {
    const textToUse = spreadsheetText.trim() || USER_SAMPLE_SPREADSHEET_ROW;
    const res = parseSpreadsheetTextToApplicant(textToUse, templateType);
    if (res.isValid && res.data) {
      // Ensure sequential numbering is tracked or generated
      let finalApplicant = { ...res.data };
      if (!finalApplicant.nomorSurat || finalApplicant.nomorSurat.includes('7379/SR/AMW/X/2026')) {
        const { nomorSurat: n1, nomorSuratPernyataan: n2 } = generateNextSequentialNumbers();
        finalApplicant.nomorSurat = n1;
        finalApplicant.nomorSuratPernyataan = n2;
      }

      if (directToPreview && onDirectPreview) {
        onDirectPreview(finalApplicant);
      } else {
        onExtractionSuccess(finalApplicant);
      }
    }
  };

  // Clean up error message into user-friendly Indonesian
  const formatErrorMessage = (raw: string): string => {
    if (!raw) return 'Terjadi kesalahan saat memproses dokumen.';
    if (
      raw.includes('Failed to fetch') ||
      raw.includes('NetworkError') ||
      raw.includes('TypeError') ||
      raw.includes('fetch')
    ) {
      return 'Koneksi ke server AI terputus atau server sedang merespons ulang. Silakan klik "Coba Lagi" atau klik "Lanjut dengan Draf Cerdas" di samping.';
    }
    if (raw.includes('503') || raw.includes('high demand') || raw.includes('UNAVAILABLE')) {
      return 'Server AI Google Gemini sedang mengalami lonjakan antrean sementara (503 High Demand). Silakan klik "Coba Lagi" atau gunakan opsi "Lanjut dengan Draf Cerdas".';
    }
    if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
      return 'Kuota harian AI sedang sibuk sementara. Silakan coba kembali dalam beberapa saat.';
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.error?.message) {
        return formatErrorMessage(parsed.error.message);
      }
    } catch {
      // not json
    }
    return raw;
  };

  // Submit documents to analysis endpoint
  const handleStartAnalysis = async () => {
    if (!files.ktpBase64 && !files.kkBase64 && !files.passportBase64) {
      setErrorMsg('Mohon unggah dokumen scan/foto KTP, Kartu Keluarga (KK), atau Paspor terlebih dahulu.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const res = await fetch('/api/analyze-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          ktpImage: files.ktpBase64,
          kkImage: files.kkBase64,
          passportImage: files.passportBase64,
          departureMonth: departureDate,
          tujuanKantorImigrasi: tujuanImigrasi,
          alamatKantorImigrasi: alamatImigrasi,
          kantorImigrasiDanAlamat: `${tujuanImigrasi}, ${alamatImigrasi}`,
          templateType,
          clientOcrData: loadedDemoProfile
            ? {
                nik: loadedDemoProfile.ktpData.nik,
                namaLengkap: loadedDemoProfile.ktpData.nama,
                tempatLahir: loadedDemoProfile.ktpData.tempatLahir,
                tanggalLahir: loadedDemoProfile.ktpData.tanggalLahir,
                tempatTanggalLahir: `${loadedDemoProfile.ktpData.tempatLahir}, ${loadedDemoProfile.ktpData.tanggalLahir}`,
                jenisKelamin: loadedDemoProfile.ktpData.jenisKelamin,
                alamatKtp: `${loadedDemoProfile.ktpData.alamat}, RT/RW: ${loadedDemoProfile.ktpData.rtRw}, Kel/Desa: ${loadedDemoProfile.ktpData.kelDesa}, Kec. ${loadedDemoProfile.ktpData.kecamatan}, ${loadedDemoProfile.ktpData.kota}, ${loadedDemoProfile.ktpData.provinsi}`,
                nomorKk: loadedDemoProfile.kkData.noKk,
                namaKepalaKeluarga: loadedDemoProfile.kkData.kepalaKeluarga,
                namaAyah: loadedDemoProfile.kkData.kepalaKeluarga,
                nomorPasporLama: (loadedDemoProfile as any).passportData?.passportNo || '',
                dateOfExpiry: (loadedDemoProfile as any).passportData?.dateOfExpiry || '',
              }
            : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Terjadi kesalahan saat memproses dokumen.');
      }

      const data = json.data;
      const { nomorSurat: n1, nomorSuratPernyataan: n2 } = generateNextSequentialNumbers();
      const ttlParsed = parsePlaceAndBirthDate(data.tempatLahir, data.tanggalLahir, data.tempatTanggalLahir, data.nik);
      const cleanNama = cleanApplicantName(data.namaLengkap);

      onExtractionSuccess(
        formatApplicantData({
          ...data,
          nomorSurat: n1,
          nomorSuratPernyataan: n2,
          namaLengkap: toTitleCase(cleanNama || data.namaLengkap),
          tempatLahir: ttlParsed.tempatLahir,
          tanggalLahir: ttlParsed.tanggalLahir,
          tempatTanggalLahir: ttlParsed.tempatTanggalLahir,
          jenisKelamin: (data.jenisKelamin || ttlParsed.jenisKelamin || 'PEREMPUAN').toUpperCase(),
          alamatKtp: toTitleCase(data.alamatKtp),
          namaKepalaKeluarga: toTitleCase(data.namaKepalaKeluarga),
          nomorPasporLama: data.nomorPasporLama || '',
          dateOfExpiry: data.dateOfExpiry || data.expiredDatePaspor || '',
          expiredDatePaspor: data.dateOfExpiry || data.expiredDatePaspor || '',
          estimasiKeberangkatan: departureDate || data.estimasiKeberangkatan,
          jadwalKeberangkatanDanKepulangan: departureDate || data.jadwalKeberangkatanDanKepulangan,
          tujuanKantorImigrasi: toTitleCase(tujuanImigrasi),
          alamatKantorImigrasi: toTitleCase(alamatImigrasi),
          templateType,
        })
      );
    } catch (err: any) {
      console.warn('Server extraction notice or fallback required:', err);

      // Client-side browser OCR fallback for Vercel static deployments or network failures
      try {
        console.log('[Client OCR] Running browser document extraction fallback...');
        const browserData = await processDocumentsInBrowser(
          files.ktpBase64 || undefined,
          files.kkBase64 || undefined,
          files.passportBase64 || undefined
        );

        const { nomorSurat: n1, nomorSuratPernyataan: n2 } = generateNextSequentialNumbers();
        const cleanNama = cleanApplicantName(browserData.namaLengkap || '');
        const ttlParsed = parsePlaceAndBirthDate(browserData.tempatLahir, browserData.tanggalLahir, browserData.tempatTanggalLahir, browserData.nik);

        onExtractionSuccess(
          formatApplicantData({
            templateType,
            nik: browserData.nik || '',
            namaLengkap: cleanNama ? toTitleCase(cleanNama) : '',
            tempatLahir: ttlParsed.tempatLahir || '',
            tanggalLahir: ttlParsed.tanggalLahir || '',
            tempatTanggalLahir: ttlParsed.tempatTanggalLahir || (ttlParsed.tempatLahir && ttlParsed.tanggalLahir ? `${ttlParsed.tempatLahir}, ${ttlParsed.tanggalLahir}` : ''),
            jenisKelamin: (browserData.jenisKelamin || ttlParsed.jenisKelamin || 'PEREMPUAN').toUpperCase(),
            alamatKtp: browserData.alamatKtp ? toTitleCase(browserData.alamatKtp) : '',
            nomorKk: browserData.nomorKk || '',
            namaKepalaKeluarga: browserData.namaKepalaKeluarga ? toTitleCase(browserData.namaKepalaKeluarga) : (cleanNama ? toTitleCase(cleanNama) : ''),
            namaAyah: browserData.namaAyah ? toTitleCase(browserData.namaAyah) : '',
            nomorPasporLama: (browserData.nomorPasporLama || '').toUpperCase(),
            dateOfExpiry: browserData.dateOfExpiry || '',
            expiredDatePaspor: browserData.dateOfExpiry || '',
            agama: browserData.agama || 'Islam',
            pekerjaan: browserData.pekerjaan || 'Wiraswasta',
            statusPerkawinan: browserData.statusPerkawinan || 'Belum Kawin',
            kewarganegaraan: 'WNI',
            negaraTujuan: 'Arab Saudi',
            estimasiKeberangkatan: departureDate || '16 - 24 November 2026',
            jadwalKeberangkatanDanKepulangan: departureDate || '16 - 24 November 2026',
            keperluan: 'Surat Pernyataan dan Jaminan Paspor Umrah',
            nomorSurat: n1,
            nomorSuratPernyataan: n2,
            perihal: templateType === 'pernyataan_jaminan' ? 'Surat Pernyataan dan Jaminan' : templateType === 'penambahan_nama' ? 'Permohonan Penambahan Nama Paspor' : templateType === 'perpanjangan_paspor' ? 'Permohonan Perpanjangan Paspor' : 'Permohonan Pembuatan Paspor',
            tanggalSurat: '',
            kotaPenerbitan: 'Jakarta',
            pejabatNama: 'Khairul Umam, ST, BA, MBA',
            pejabatJabatan: 'Direktur Utama',
            namaPerusahaan: 'PT. Alzam Mandiri Wisata',
            taglinePerusahaan: 'Tour & Travel',
            izinPpiu: '29042200007580004',
            alamatPerusahaan: 'Ciledug Mas, Jl. HOS Cokroaminoto Blok C9 dan C10, RT.003/RW.004, Sudimara Timur, Kecamatan Karang Tengah, Kota Tangerang, Banten 15151',
            tujuanKantorImigrasi: tujuanImigrasi,
            alamatKantorImigrasi: alamatImigrasi,
          })
        );
        return;
      } catch (browserErr) {
        console.error('Browser OCR fallback failed:', browserErr);
      }

      if (err.name === 'AbortError') {
        setErrorMsg('Waktu pemrosesan melebihi batas. Silakan klik tombol "Lanjut dengan Draf Cerdas" di bawah untuk langsung memverifikasi data.');
      } else {
        const friendly = formatErrorMessage(err.message || String(err));
        setErrorMsg(friendly);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsAnalyzing(false);
    }
  };

  // Fallback to manual verification draft with clean Title Case
  const handleProceedWithDraft = () => {
    const { nomorSurat: n1, nomorSuratPernyataan: n2 } = generateNextSequentialNumbers();

    if (loadedDemoProfile) {
      const p = loadedDemoProfile;
      const ttlP = parsePlaceAndBirthDate(p.ktpData.tempatLahir, p.ktpData.tanggalLahir, undefined, p.ktpData.nik);
      onExtractionSuccess(
        formatApplicantData({
          templateType,
          nik: p.ktpData.nik,
          namaLengkap: toTitleCase(p.ktpData.nama),
          tempatLahir: ttlP.tempatLahir,
          tanggalLahir: ttlP.tanggalLahir,
          tempatTanggalLahir: ttlP.tempatTanggalLahir,
          jenisKelamin: p.ktpData.jenisKelamin.toUpperCase(),
          alamatKtp: toTitleCase(`${p.ktpData.alamat}, RT/RW: ${p.ktpData.rtRw}, Kel/Desa: ${p.ktpData.kelDesa}, Kec. ${p.ktpData.kecamatan}, ${p.ktpData.kota}, ${p.ktpData.provinsi}`),
          nomorKk: p.kkData.noKk,
          namaKepalaKeluarga: toTitleCase(p.kkData.kepalaKeluarga),
          namaAyah: toTitleCase(p.kkData.kepalaKeluarga),
          nomorPasporLama: (p as any).passportData?.passportNo || '',
          dateOfExpiry: (p as any).passportData?.dateOfExpiry || '',
          expiredDatePaspor: (p as any).passportData?.dateOfExpiry || '',
          negaraTujuan: p.country || 'Arab Saudi',
          estimasiKeberangkatan: departureDate || p.departure || '16 - 24 November 2026',
          jadwalKeberangkatanDanKepulangan: departureDate || p.departure || '16 - 24 November 2026',
          keperluan: p.purpose || 'Surat Pernyataan dan Jaminan Paspor Umrah',
          nomorSurat: n1,
          nomorSuratPernyataan: n2,
          perihal: templateType === 'pernyataan_jaminan' ? 'Surat Pernyataan dan Jaminan' : templateType === 'penambahan_nama' ? 'Permohonan Penambahan Nama Paspor' : templateType === 'perpanjangan_paspor' ? 'Permohonan Perpanjangan Paspor' : 'Permohonan Pembuatan Paspor',
          tanggalSurat: '',
          kotaPenerbitan: 'Jakarta',
          pejabatNama: 'Khairul Umam, ST, BA, MBA',
          pejabatJabatan: 'Direktur Utama',
          namaPerusahaan: 'PT. Alzam Mandiri Wisata',
          taglinePerusahaan: 'Tour & Travel',
          izinPpiu: '29042200007580004',
          alamatPerusahaan: 'Ciledug Mas, Jl. HOS Cokroaminoto Blok C9 dan C10, RT.003/RW.004, Sudimara Timur, Kecamatan Karang Tengah, Kota Tangerang, Banten 15151',
          tujuanKantorImigrasi: tujuanImigrasi,
          alamatKantorImigrasi: alamatImigrasi,
          tanggalIzinPpiu: '02 Agustus 2022',
          teleponPerusahaan: '0815-9888-154',
          emailPerusahaan: 'alzam@bisa.id',
          websitePerusahaan: 'www.umrahbisa.com',
        })
      );
      setErrorMsg(null);
      return;
    }

    const hasFiles = Boolean(files.ktpBase64 || files.kkBase64 || files.passportBase64);
    if (hasFiles) {
      onExtractionSuccess(
        formatApplicantData({
          templateType,
          nik: '',
          namaLengkap: '',
          tempatLahir: '',
          tanggalLahir: '',
          tempatTanggalLahir: '',
          jenisKelamin: 'LAKI-LAKI',
          alamatKtp: '',
          nomorKk: '',
          namaKepalaKeluarga: '',
          namaAyah: '',
          negaraTujuan: 'Arab Saudi',
          estimasiKeberangkatan: departureDate || '16 - 24 November 2026',
          jadwalKeberangkatanDanKepulangan: departureDate || '16 - 24 November 2026',
          keperluan: 'Permohonan Pembuatan Paspor Umrah',
          nomorSurat: n1,
          nomorSuratPernyataan: n2,
          perihal: templateType === 'pernyataan_jaminan' ? 'Surat Pernyataan dan Jaminan' : templateType === 'penambahan_nama' ? 'Permohonan Penambahan Nama Paspor' : templateType === 'perpanjangan_paspor' ? 'Permohonan Perpanjangan Paspor' : 'Permohonan Pembuatan Paspor',
          tanggalSurat: '',
          kotaPenerbitan: 'Jakarta',
          pejabatNama: 'Khairul Umam, ST, BA, MBA',
          pejabatJabatan: 'Direktur Utama',
          namaPerusahaan: 'PT. Alzam Mandiri Wisata',
          taglinePerusahaan: 'Tour & Travel',
          izinPpiu: '29042200007580004',
          alamatPerusahaan: 'Ciledug Mas, Jl. HOS Cokroaminoto Blok C9 dan C10, RT.003/RW.004, Sudimara Timur, Kecamatan Karang Tengah, Kota Tangerang, Banten 15151',
          tujuanKantorImigrasi: tujuanImigrasi,
          alamatKantorImigrasi: alamatImigrasi,
          tanggalIzinPpiu: '02 Agustus 2022',
          teleponPerusahaan: '0815-9888-154',
          emailPerusahaan: 'alzam@bisa.id',
          websitePerusahaan: 'www.umrahbisa.com',
        })
      );
      setErrorMsg(null);
      return;
    }

    onExtractionSuccess(
      formatApplicantData({
        templateType,
        nik: '3604075304950002',
        namaLengkap: 'Euis Cholishoh',
        tempatLahir: 'Serang',
        tanggalLahir: '13 April 1995',
        tempatTanggalLahir: 'Serang, 13 April 1995',
        jenisKelamin: 'PEREMPUAN',
        alamatKtp: 'Kp. Kubang Laban Rt.005, Rw.003, Kelurahan Lambangsari, Kec. Bojonegara, Kabupaten Serang, Provinsi Banten',
        nomorKk: '3604070000000000',
        namaKepalaKeluarga: 'Euis Cholishoh',
        namaAyah: 'H. Ahmad Subandi',
        negaraTujuan: 'Arab Saudi',
        estimasiKeberangkatan: departureDate || '16 - 24 November 2026',
        jadwalKeberangkatanDanKepulangan: departureDate || '16 - 24 November 2026',
        keperluan: 'Permohonan Pembuatan Paspor Umrah',
        nomorSurat: n1,
        nomorSuratPernyataan: n2,
        perihal: templateType === 'pernyataan_jaminan' ? 'Surat Pernyataan dan Jaminan' : templateType === 'penambahan_nama' ? 'Permohonan Penambahan Nama Paspor' : templateType === 'perpanjangan_paspor' ? 'Permohonan Perpanjangan Paspor' : 'Permohonan Pembuatan Paspor',
        tanggalSurat: '',
        kotaPenerbitan: 'Jakarta',
        pejabatNama: 'Khairul Umam, ST, BA, MBA',
        pejabatJabatan: 'Direktur Utama',
        namaPerusahaan: 'PT. Alzam Mandiri Wisata',
        taglinePerusahaan: 'Tour & Travel',
        izinPpiu: '29042200007580004',
        alamatPerusahaan: 'Ciledug Mas, Jl. HOS Cokroaminoto Blok C9 dan C10, RT.003/RW.004, Sudimara Timur, Kecamatan Karang Tengah, Kota Tangerang, Banten 15151',
        tujuanKantorImigrasi: tujuanImigrasi,
        alamatKantorImigrasi: alamatImigrasi,
        tanggalIzinPpiu: '02 Agustus 2022',
        teleponPerusahaan: '0815-9888-154',
        emailPerusahaan: 'alzam@bisa.id',
        websitePerusahaan: 'www.umrahbisa.com',
      })
    );
    setErrorMsg(null);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Intro Hero Banner */}
      <div className="bg-gradient-to-r from-[#21543D] via-[#2C6B4F] to-[#21543D] border border-[#3E8060] rounded-3xl p-6 sm:p-8 shadow-xl text-[#F7FAF8] relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-3xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1C4633]/80 border border-[#489370] text-[#E8F4EC] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#A3DCBE]" />
            Generator Surat Pernyataan &amp; Rekomendasi Paspor Imigrasi
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F7FAF8]">
            Pindai Identitas KTP &amp; KK Pemohon Paspor / Umrah
          </h1>
          <p className="text-sm text-[#DCEEE3] leading-relaxed">
            Sistem ekstraksi otomatis dokumen KTP dan Kartu Keluarga (KK). Menghasilkan surat resmi siap cetak format <strong className="text-white font-bold">Surat Pernyataan dan Jaminan (PT. Alzam Mandiri Wisata)</strong> sesuai standar Ditjen Imigrasi Kemenkumham RI.
          </p>
        </div>
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="bg-red-950/80 border border-red-500/50 rounded-2xl p-4 text-red-200 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md animate-shake">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-300">Pemberitahuan Sistem (AI Service Status)</h4>
              <p className="text-xs mt-0.5 text-red-200/90 leading-relaxed">{errorMsg}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={handleStartAnalysis}
              className="flex-1 sm:flex-none px-3.5 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              Coba Lagi
            </button>
            <button
              type="button"
              onClick={handleProceedWithDraft}
              className="flex-1 sm:flex-none px-3.5 py-1.5 bg-[#2C6B4F] hover:bg-[#235840] text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              Lanjut dengan Draf Cerdas
            </button>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-red-400 hover:text-red-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Template Selection Radio Cards */}
      <div className="bg-[#21543D] text-[#F7FAF8] rounded-3xl p-4 sm:p-6 border border-[#3E8060] shadow-md space-y-3.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#F7FAF8] flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#A3DCBE]" />
            <span>Pilih Format / Jenis Surat Resmi yang Ingin Dibuat:</span>
          </label>
          <span className="text-[11px] text-[#C2E4D2] hidden sm:inline font-mono">
            Standar format resmi PT. Alzam Mandiri Wisata
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <button
            type="button"
            onClick={() => setTemplateType('permohonan_paspor')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              templateType === 'permohonan_paspor'
                ? 'bg-white text-[#2C6B4F] border-white shadow-lg ring-2 ring-white/40 font-bold'
                : 'bg-[#1C4633] text-[#DCEEE3] border-[#2B6349] hover:bg-[#265A42] hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Surat 1</span>
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold leading-snug">Permohonan Paspor Baru</div>
            <div className="text-[10px] mt-1 opacity-85">Untuk jamaah belum punya paspor</div>
          </button>

          <button
            type="button"
            onClick={() => setTemplateType('pernyataan_jaminan')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              templateType === 'pernyataan_jaminan'
                ? 'bg-white text-[#2C6B4F] border-white shadow-lg ring-2 ring-white/40 font-bold'
                : 'bg-[#1C4633] text-[#DCEEE3] border-[#2B6349] hover:bg-[#265A42] hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Surat 2</span>
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold leading-snug">Pernyataan &amp; Jaminan</div>
            <div className="text-[10px] mt-1 opacity-85">4 klausul jaminan PPIU</div>
          </button>

          <button
            type="button"
            onClick={() => setTemplateType('penambahan_nama')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              templateType === 'penambahan_nama'
                ? 'bg-white text-[#2C6B4F] border-white shadow-lg ring-2 ring-white/40 font-bold'
                : 'bg-[#1C4633] text-[#DCEEE3] border-[#2B6349] hover:bg-[#265A42] hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Surat 3</span>
              <Edit3 className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold leading-snug">Surat Tambahan Nama</div>
            <div className="text-[10px] mt-1 opacity-85">Penambahan 3 suku kata / nama ayah</div>
          </button>

          <button
            type="button"
            onClick={() => setTemplateType('perpanjangan_paspor')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              templateType === 'perpanjangan_paspor'
                ? 'bg-white text-[#2C6B4F] border-white shadow-lg ring-2 ring-white/40 font-bold'
                : 'bg-[#1C4633] text-[#DCEEE3] border-[#2B6349] hover:bg-[#265A42] hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Surat 4</span>
              <RotateCcw className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold leading-snug">Perpanjangan Paspor</div>
            <div className="text-[10px] mt-1 opacity-85">Penggantian paspor habis masa berlaku</div>
          </button>

          <button
            type="button"
            onClick={() => setTemplateType('paket_lengkap_alzam')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between sm:col-span-2 lg:col-span-1 ${
              templateType === 'paket_lengkap_alzam'
                ? 'bg-[#489370] text-white border-white shadow-lg ring-2 ring-white/40 font-bold'
                : 'bg-[#1C4633] text-[#DCEEE3] border-[#2B6349] hover:bg-[#265A42] hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A3DCBE]">Paling Lengkap</span>
              <Layers className="w-4 h-4 text-[#A3DCBE]" />
            </div>
            <div className="text-xs font-bold leading-snug">Paket 2 Surat Sekaligus</div>
            <div className="text-[10px] mt-1 opacity-85">Permohonan + Jaminan</div>
          </button>
        </div>
      </div>

      {/* Input Method Switcher */}
      <div className="bg-[#1C4633] text-white rounded-2xl p-2 border border-[#2B6349] shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setInputMode('files')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              inputMode === 'files'
                ? 'bg-[#2C6B4F] text-white shadow-lg ring-1 ring-white/20'
                : 'text-slate-300 hover:text-white hover:bg-[#265A42]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>1. Foto KTP &amp; KK (OCR AI)</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode('spreadsheet')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              inputMode === 'spreadsheet'
                ? 'bg-[#2C6B4F] text-white shadow-lg ring-1 ring-white/20'
                : 'text-[#A3DCBE] hover:text-white hover:bg-[#265A42]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. Tempel Baris Excel</span>
          </button>

          <button
            type="button"
            onClick={handleProceedWithDraft}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md transition-all cursor-pointer"
            title="Ketik atau edit data langsung di formulir HP tanpa perlu foto KTP/KK"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>3. Ketik Manual di HP</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OPSI 2: SPREADSHEET EXCEL DIRECT INPUT PANEL                              */}
      {/* ========================================================================= */}
      {inputMode === 'spreadsheet' && (
        <div className="bg-white rounded-2xl border border-emerald-600/30 p-6 sm:p-7 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mb-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Input Cepat Spreadsheet (TSV / Tab-Separated)
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Kolom Masukan Baris Data Excel / Spreadsheet Langsung
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Salin (copy) satu baris dari file Excel Anda dan tempel (paste) ke kotak di bawah. Sistem akan secara otomatis mengurai seluruh 17 kolom (Nomor Surat, Tanggal, Nama Jamaah, NIK, TTL, Alamat, Jadwal, dan Kantor Imigrasi).
              </p>
            </div>

            <button
              type="button"
              onClick={handleLoadSampleSpreadsheet}
              className="px-4 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded-xl text-xs font-bold transition-all border border-emerald-700/60 flex items-center gap-2 shrink-0 cursor-pointer shadow-sm hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Tempel Contoh Format (Euis Cholishoh)</span>
            </button>
          </div>

          {/* Text Area for Spreadsheet Row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>Tempelkan Baris Data Excel di Sini:</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  (Mendukung pembatas Tab dari salinan sel spreadsheet)
                </span>
              </label>

              {spreadsheetText && (
                <button
                  type="button"
                  onClick={() => {
                    setSpreadsheetText('');
                    setParsedSpreadsheet(parseSpreadsheetTextToApplicant('', templateType));
                  }}
                  className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Bersihkan
                </button>
              )}
            </div>

            <textarea
              rows={4}
              value={spreadsheetText}
              onChange={(e) => handleSpreadsheetChange(e.target.value)}
              placeholder="Contoh baris Excel:&#10;3495&#9;5 Oktober 2026&#9;7379&#9;7380&#9;7379/SR/AMW/X/2026&#9;7380/SR/AMW/X/2026&#9;X&#9;10&#9;Euis Cholishoh&#9;Euis Cholishoh&#9;Serang, 13 April 1995&#9;Serang, 13 April 1995&#9;3604075304950002&#9;Kp. Kubang Laban Rt.005, Rw.003...&#9;16 - 24 November 2026&#9;&quot;Kepala Kantor Imigrasi Kelas II Cilegon...&quot;"
              className="w-full bg-slate-900 text-slate-100 font-mono text-xs p-4 rounded-xl border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-500 resize-y shadow-inner"
            />
          </div>

          {/* Live Extracted Preview Cards */}
          {parsedSpreadsheet.isValid && parsedSpreadsheet.data && (
            <div className="bg-slate-50 border border-emerald-500/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-sm text-slate-900">
                    Hasil Penguraian Kolom Excel (Otomatis):
                  </span>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                  {parsedSpreadsheet.rawColumns.length} Kolom Terbaca Sempurna
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {/* Nama Jamaah */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                    Nama Jamaah (Pemohon)
                  </span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {parsedSpreadsheet.data.namaLengkap}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                    ID Jamaah: {parsedSpreadsheet.data.idJamaah || '3495'}
                  </span>
                </div>

                {/* NIK */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                    NIK Pemohon (16 Digit)
                  </span>
                  <span className="font-mono text-emerald-800 font-bold text-sm mt-0.5 block">
                    {parsedSpreadsheet.data.nik}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                    Validitas Format: Sesuai
                  </span>
                </div>

                {/* TTL */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                    Tempat, Tanggal Lahir
                  </span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {parsedSpreadsheet.data.tempatTanggalLahir}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Tgl Surat: {parsedSpreadsheet.data.tanggalSurat}
                  </span>
                </div>

                {/* Nomor Surat Permohonan */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                    No. Surat Permohonan (Alzam)
                  </span>
                  <span className="font-mono text-slate-900 font-bold mt-0.5 block">
                    {parsedSpreadsheet.data.nomorSurat}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Dokumen 1: Permohonan Paspor
                  </span>
                </div>

                {/* Nomor Surat Pernyataan */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                    No. Surat Jaminan (Alzam)
                  </span>
                  <span className="font-mono text-slate-900 font-bold mt-0.5 block">
                    {parsedSpreadsheet.data.nomorSuratPernyataan || '-'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Dokumen 2: Pernyataan &amp; Jaminan
                  </span>
                </div>

                {/* Jadwal Keberangkatan */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                    Jadwal Keberangkatan &amp; Pulang
                  </span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {parsedSpreadsheet.data.jadwalKeberangkatanDanKepulangan}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                    Tercantum pada klausul ke-4
                  </span>
                </div>

                {/* Kantor Imigrasi Tujuan */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs sm:col-span-2 lg:col-span-3">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                    Tujuan &amp; Alamat Kantor Imigrasi
                  </span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {parsedSpreadsheet.data.tujuanKantorImigrasi}
                  </span>
                  <span className="text-slate-600 mt-0.5 block">
                    {parsedSpreadsheet.data.alamatKantorImigrasi}
                  </span>
                </div>

                {/* Alamat KTP */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs sm:col-span-2 lg:col-span-3">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                    Alamat Lengkap Pemohon (Sesuai KTP / KK)
                  </span>
                  <span className="text-slate-700 font-medium mt-0.5 block">
                    {parsedSpreadsheet.data.alamatKtp}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!parsedSpreadsheet.isValid && parsedSpreadsheet.error && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Pemberitahuan Format Spreadsheet:</span>
                <span>{parsedSpreadsheet.error}</span>
              </div>
            </div>
          )}

          {/* Action Footer for Spreadsheet Input */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              Data akan langsung dimasukkan ke kop, teks, tanda tangan direktur, dan stempel basah.
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleApplySpreadsheet(false)}
                disabled={!parsedSpreadsheet.isValid || !parsedSpreadsheet.data}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
              >
                Periksa di Formulir Verifikasi
              </button>

              <button
                type="button"
                onClick={() => handleApplySpreadsheet(true)}
                disabled={!parsedSpreadsheet.isValid || !parsedSpreadsheet.data}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <FileText className="w-4 h-4" />
                <span>Terapkan &amp; Langsung Buka Pratinjau Surat</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OPSI 1: DUAL DOCUMENT UPLOAD DROPZONES (KTP & KK)                          */}
      {/* ========================================================================= */}
      {inputMode === 'files' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dropzone 1: KTP */}
        <div
          onDragEnter={handleKtpDragEnter}
          onDragOver={handleKtpDragOver}
          onDragLeave={handleKtpDragLeave}
          onDrop={handleKtpDrop}
          className={`bg-white rounded-2xl border shadow-sm p-6 flex flex-col justify-between transition-all relative ${
            isDraggingKtp
              ? 'border-emerald-500 ring-4 ring-emerald-500/20 bg-emerald-50/50'
              : 'border-slate-200 hover:border-emerald-400'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Kartu Tanda Penduduk (KTP)</h3>
                  <p className="text-xs text-slate-500">Pemohon Utama (NIK 16 Digit &amp; Alamat)</p>
                </div>
              </div>
              {files.ktpBase64 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Siap Pindai
                </span>
              )}
            </div>

            {/* Upload Area or Preview */}
            {files.ktpBase64 ? (
              <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-[16/10] flex items-center justify-center">
                <img
                  src={files.ktpBase64}
                  alt="KTP Preview"
                  className="w-full h-full object-contain p-2 pointer-events-none"
                />
                {isDraggingKtp && (
                  <div className="absolute inset-0 bg-emerald-600/90 text-white flex flex-col items-center justify-center gap-2 z-30 pointer-events-none">
                    <Upload className="w-8 h-8 animate-bounce" />
                    <span className="text-sm font-bold">Lepaskan untuk mengganti foto KTP</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-xs">
                  <button
                    type="button"
                    onClick={() => setZoomImage({ title: 'Dokumen KTP', src: files.ktpBase64! })}
                    className="p-2 bg-white/90 hover:bg-white text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 shadow cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Perbesar
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiles((p) => ({ ...p, ktpBase64: null, ktpName: null }))}
                    className="p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Ganti
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs truncate max-w-[80%] pointer-events-none">
                  {files.ktpName || 'KTP_Document.png'}
                </div>
              </div>
            ) : (
              <div
                onClick={() => ktpInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center aspect-[16/10] group ${
                  isDraggingKtp
                    ? 'border-emerald-500 bg-emerald-100/80 scale-[1.02] ring-4 ring-emerald-500/20 shadow-md'
                    : 'border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20'
                }`}
              >
                <input
                  type="file"
                  ref={ktpInputRef}
                  onChange={handleKtpUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform pointer-events-none ${
                  isDraggingKtp ? 'bg-emerald-600 text-white scale-125' : 'bg-emerald-100 text-emerald-600 group-hover:scale-110'
                }`}>
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700 pointer-events-none">
                  {isDraggingKtp ? 'Lepaskan foto KTP di sini!' : 'Klik atau seret foto KTP ke sini'}
                </p>
                <p className="text-xs text-slate-400 mt-1 pointer-events-none">Format: JPG, PNG, WEBP (Maksimal 10 MB)</p>
                <p className="text-[11px] text-emerald-700 font-medium mt-3 bg-emerald-50 px-2.5 py-1 rounded-md pointer-events-none">
                  Pastikan 16 digit NIK dan Nama terbaca jelas
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Dropzone 2: KK */}
        <div
          onDragEnter={handleKkDragEnter}
          onDragOver={handleKkDragOver}
          onDragLeave={handleKkDragLeave}
          onDrop={handleKkDrop}
          className={`bg-white rounded-2xl border shadow-sm p-6 flex flex-col justify-between transition-all relative ${
            isDraggingKk
              ? 'border-emerald-500 ring-4 ring-emerald-500/20 bg-emerald-50/50'
              : 'border-slate-200 hover:border-emerald-400'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Kartu Keluarga (KK)</h3>
                  <p className="text-xs text-slate-500">Nomor KK 16 Digit &amp; Nama Ayah</p>
                </div>
              </div>
              {files.kkBase64 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Siap Pindai
                </span>
              )}
            </div>

            {/* Upload Area or Preview */}
            {files.kkBase64 ? (
              <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-[16/10] flex items-center justify-center">
                <img
                  src={files.kkBase64}
                  alt="KK Preview"
                  className="w-full h-full object-contain p-2 pointer-events-none"
                />
                {isDraggingKk && (
                  <div className="absolute inset-0 bg-emerald-600/90 text-white flex flex-col items-center justify-center gap-2 z-30 pointer-events-none">
                    <Upload className="w-8 h-8 animate-bounce" />
                    <span className="text-sm font-bold">Lepaskan untuk mengganti foto KK</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-xs">
                  <button
                    type="button"
                    onClick={() => setZoomImage({ title: 'Dokumen Kartu Keluarga (KK)', src: files.kkBase64! })}
                    className="p-2 bg-white/90 hover:bg-white text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 shadow cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Perbesar
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiles((p) => ({ ...p, kkBase64: null, kkName: null }))}
                    className="p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Ganti
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs truncate max-w-[80%] pointer-events-none">
                  {files.kkName || 'KK_Document.png'}
                </div>
              </div>
            ) : (
              <div
                onClick={() => kkInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center aspect-[16/10] group ${
                  isDraggingKk
                    ? 'border-emerald-500 bg-emerald-100/80 scale-[1.02] ring-4 ring-emerald-500/20 shadow-md'
                    : 'border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20'
                }`}
              >
                <input
                  type="file"
                  ref={kkInputRef}
                  onChange={handleKkUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform pointer-events-none ${
                  isDraggingKk ? 'bg-emerald-600 text-white scale-125' : 'bg-emerald-100 text-emerald-600 group-hover:scale-110'
                }`}>
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700 pointer-events-none">
                  {isDraggingKk ? 'Lepaskan foto KK di sini!' : 'Klik atau seret foto/scan KK ke sini'}
                </p>
                <p className="text-xs text-slate-400 mt-1 pointer-events-none">Format: JPG, PNG, WEBP (Maksimal 10 MB)</p>
                <p className="text-[11px] text-emerald-700 font-medium mt-3 bg-emerald-50 px-2.5 py-1 rounded-md pointer-events-none">
                  Nama Ayah Kandung diekstrak otomatis dari tabel KK
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Dropzone 3: Paspor Lama (Khusus Tambahan Nama & Perpanjangan) */}
        <div
          onDragEnter={handlePassportDragEnter}
          onDragOver={handlePassportDragOver}
          onDragLeave={handlePassportDragLeave}
          onDrop={handlePassportDrop}
          className={`bg-white rounded-2xl border shadow-sm p-6 flex flex-col justify-between transition-all relative ${
            templateType === 'penambahan_nama' || templateType === 'perpanjangan_paspor'
              ? 'border-amber-400 ring-2 ring-amber-300/50 bg-amber-50/20'
              : 'border-slate-200 hover:border-amber-400'
          } ${
            isDraggingPassport
              ? 'border-amber-500 ring-4 ring-amber-500/20 bg-amber-50/80'
              : ''
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                    <span>Paspor Lama</span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded-md">
                      Pilihan
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">Scan Biodata Paspor (Nomor Paspor &amp; Expiry)</p>
                </div>
              </div>
              {files.passportBase64 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  Siap Pindai
                </span>
              )}
            </div>

            {/* Upload Area or Preview */}
            {files.passportBase64 ? (
              <div className="relative group rounded-xl overflow-hidden border border-amber-200 bg-amber-50/50 aspect-[16/10] flex items-center justify-center">
                <img
                  src={files.passportBase64}
                  alt="Passport Preview"
                  className="w-full h-full object-contain p-2 pointer-events-none"
                />
                {isDraggingPassport && (
                  <div className="absolute inset-0 bg-amber-600/90 text-white flex flex-col items-center justify-center gap-2 z-30 pointer-events-none">
                    <Upload className="w-8 h-8 animate-bounce" />
                    <span className="text-sm font-bold">Lepaskan untuk mengganti foto Paspor</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-xs">
                  <button
                    type="button"
                    onClick={() => setZoomImage({ title: 'Dokumen Paspor Lama', src: files.passportBase64! })}
                    className="p-2 bg-white/90 hover:bg-white text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 shadow cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Perbesar
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiles((p) => ({ ...p, passportBase64: null, passportName: null }))}
                    className="p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Ganti
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs truncate max-w-[80%] pointer-events-none">
                  {files.passportName || 'Passport_Document.png'}
                </div>
              </div>
            ) : (
              <div
                onClick={() => passportInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center aspect-[16/10] group ${
                  isDraggingPassport
                    ? 'border-amber-500 bg-amber-100/80 scale-[1.02] ring-4 ring-amber-500/20 shadow-md'
                    : 'border-slate-300 hover:border-amber-500 bg-slate-50/50 hover:bg-amber-50/20'
                }`}
              >
                <input
                  type="file"
                  ref={passportInputRef}
                  onChange={handlePassportUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform pointer-events-none ${
                  isDraggingPassport ? 'bg-amber-600 text-white scale-125' : 'bg-amber-100 text-amber-700 group-hover:scale-110'
                }`}>
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700 pointer-events-none">
                  {isDraggingPassport ? 'Lepaskan foto Paspor di sini!' : 'Klik atau seret foto Paspor Lama di sini'}
                </p>
                <p className="text-xs text-slate-400 mt-1 pointer-events-none">Format: JPG, PNG, WEBP (Maksimal 10 MB)</p>
                <p className="text-[11px] text-amber-800 font-medium mt-3 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md pointer-events-none">
                  Masa berlaku &amp; No. Paspor diekstrak otomatis
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2 Kolom Wajib yang Diisi Jamaah Bersama Scan KTP & KK */}
      <div className="bg-white rounded-2xl border-2 border-emerald-600/40 p-6 sm:p-7 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#D96B38]" />
              Cukup Lengkapi 2 Kolom Ini Saja Bersama Scan KTP &amp; KK:
            </div>
            <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
              1. Tanggal Keberangkatan &amp; 2. Kantor Imigrasi Tujuan
            </h3>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline font-medium">
            (Nama, NIK, TTL, Alamat &amp; KK diekstrak otomatis dari foto/scan)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Tanggal Keberangkatan */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>1. Tanggal Keberangkatan *</span>
            </label>
            <input
              type="text"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              placeholder="Contoh: 16 - 24 November 2026"
              className="w-full text-base sm:text-sm font-semibold p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white text-slate-900 shadow-xs min-h-[48px]"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 self-center">Pilihan Cepat:</span>
              {['16 - 24 November 2026', '12 - 23 Januari 2026', '20 - 28 Februari 2027', '5 - 14 November 2026'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDepartureDate(d)}
                  className="text-[10px] bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 px-2 py-0.5 rounded-md border border-slate-200 transition-all cursor-pointer font-medium"
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Dicantumkan pada klausul jadwal keberangkatan &amp; kepulangan jamaah
            </p>
          </div>

          {/* 2. Kantor Imigrasi dan Alamat Lengkap Imigrasi (Database RI + Isi Mandiri) */}
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <ImmigrationOfficePicker
              label="2. Kantor Imigrasi & Alamat Lengkap (Pilih Seluruh Indonesia / Isi Mandiri) *"
              tujuanKantorImigrasi={tujuanImigrasi}
              alamatKantorImigrasi={alamatImigrasi}
              onChange={(tujuan, alamat) => {
                setTujuanImigrasi(tujuan);
                setAlamatImigrasi(alamat);
              }}
            />
            <p className="text-[11px] text-slate-400">
              Dicantumkan sebagai pihak tujuan penerbitan surat resmi paspor
            </p>
          </div>
        </div>
      </div>

      {/* Main Action Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#1C4633] text-white p-5 sm:p-6 rounded-3xl border border-[#2B6349] shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#2C6B4F] text-[#A3DCBE] flex items-center justify-center shrink-0 border border-[#3E8060]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">
              Ekstraksi Dokumen OCR AI &amp; Susun Surat Resmi
            </h4>
            <p className="text-xs text-[#DCEEE3]">
              Otomatis menggabungkan data KTP, KK, jadwal keberangkatan, dan kantor imigrasi menjadi surat resmi siap cetak.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStartAnalysis}
          disabled={isAnalyzing || (!files.ktpBase64 && !files.kkBase64 && !files.passportBase64)}
          className={`w-full sm:w-auto px-7 py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
            isAnalyzing
              ? 'bg-slate-700 text-slate-300 cursor-not-allowed'
              : (!files.ktpBase64 && !files.kkBase64 && !files.passportBase64)
              ? 'bg-[#265A42] text-[#88A995] cursor-not-allowed border border-[#3E8060]'
              : 'bg-[#2C6B4F] hover:bg-[#235840] text-white shadow-[#2C6B4F]/30 hover:scale-[1.02] active:scale-98'
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Memproses Dokumen (KTP, KK &amp; Paspor)...</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              <span>🚀 Proses Scan Dokumen (KTP, KK &amp; Paspor) Menjadi Surat Resmi</span>
            </>
          )}
        </button>
      </div>
      </>
      )}

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 text-white rounded-2xl max-w-4xl w-full p-4 border border-slate-700 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-emerald-400">{zoomImage.title}</h3>
              <button
                onClick={() => setZoomImage(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={zoomImage.src}
                alt="Enlarged view"
                className="max-h-[70vh] w-auto object-contain rounded-lg border border-slate-800"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
