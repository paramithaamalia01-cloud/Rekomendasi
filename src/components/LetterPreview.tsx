import React, { useState, useRef, useEffect } from 'react';
import {
  Printer,
  Download,
  Check,
  FileCheck,
  BookmarkCheck,
  ArrowLeft,
  Layers,
  Sparkles,
  FileText,
  ImageIcon,
  Upload,
  RotateCcw,
  X,
  CheckCircle2,
  Edit3,
  CheckCheck,
  SlidersHorizontal,
  Share2,
} from 'lucide-react';
import { ApplicantData, LetterTemplateType } from '../types';
import { generateOfficialLetterPdf } from '../utils/pdfGenerator';
import { toTitleCase, createWhatsAppNotificationUrl } from '../utils/letterFormatter';
import { ImmigrationOfficePicker } from './ImmigrationOfficePicker';
import { extractSequenceNumber, updateSequenceNumber } from '../utils/letterNumbering';
import {
  LogoAlzam,
  LogoUmrahBisa,
  LogoCapAlzam,
  TtdDirekturAlzam,
} from '../assets/letterAssets';

interface LetterPreviewProps {
  data: ApplicantData;
  onEditData: () => void;
  onSaveToArchive: (recordData: { withMaterai: boolean; withStamp: boolean; withSignature: boolean }) => void;
  isSavedInArchive?: boolean;
  onUpdateTemplateType?: (template: LetterTemplateType) => void;
  onUpdateApplicantData?: (newData: ApplicantData) => void;
}

export const LetterPreview: React.FC<LetterPreviewProps> = ({
  data,
  onEditData,
  onSaveToArchive,
  isSavedInArchive = false,
  onUpdateTemplateType,
  onUpdateApplicantData,
}) => {
  const currentTemplate = data.templateType || 'permohonan_paspor';
  const [withStamp, setWithStamp] = useState<boolean>(true);
  const [withSignature, setWithSignature] = useState<boolean>(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);
  const [localSaveSuccess, setLocalSaveSuccess] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Mode Edit Langsung di Layar
  const [isInlineEditMode, setIsInlineEditMode] = useState<boolean>(false);
  
  // Modal Ubah Data Cepat with local isolated draft state
  const [showQuickEditModal, setShowQuickEditModal] = useState<boolean>(false);
  const [modalDraft, setModalDraft] = useState<ApplicantData>({ ...data });

  // Whenever modal opens, initialize draft fresh from current data
  useEffect(() => {
    if (showQuickEditModal) {
      setModalDraft({ ...data });
    }
  }, [showQuickEditModal]);

  // Manage custom or official loaded assets with localStorage persistence
  const [customAssets, setCustomAssets] = useState<{
    logoAlzam?: string;
    logoUmrahBisa?: string;
    stempel?: string;
    ttd?: string;
  }>(() => {
    try {
      const saved = localStorage.getItem('alzam_official_assets');
      if (saved) {
        return { ...JSON.parse(saved), ...(data.customAssets || {}) };
      }
    } catch {
      // fallback
    }
    return data.customAssets || {};
  });

  const [showAssetModal, setShowAssetModal] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeAssetUploadKey, setActiveAssetUploadKey] = useState<'logoAlzam' | 'logoUmrahBisa' | 'stempel' | 'ttd' | null>(null);

  const showNotification = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Update a single field in parent state
  const updateField = (field: keyof ApplicantData, value: string) => {
    if (onUpdateApplicantData) {
      const updated = { ...data, [field]: value };
      if (field === 'tempatLahir' || field === 'tanggalLahir') {
        const tLahir = field === 'tempatLahir' ? value : (data.tempatLahir || '');
        const tgLahir = field === 'tanggalLahir' ? value : (data.tanggalLahir || '');
        updated.tempatTanggalLahir = `${tLahir}, ${tgLahir}`.trim().replace(/^,\s*/, '').replace(/,\s*$/, '');
      }
      onUpdateApplicantData(updated);
    }
  };

  // Update multiple fields at once in parent state safely
  const updateMultipleFields = (fields: Partial<ApplicantData>) => {
    if (onUpdateApplicantData) {
      onUpdateApplicantData({ ...data, ...fields });
    }
  };

  // Click on any text when inline mode is off automatically activates it and focuses the input
  const activateInlineEdit = (fieldId?: string) => {
    setIsInlineEditMode(true);
    showNotification('Mode edit langsung aktif! Silakan ketik langsung pada teks surat.');
    if (fieldId) {
      setTimeout(() => {
        const el = document.getElementById(fieldId) || document.querySelector(`[data-field="${fieldId}"]`);
        if (el instanceof HTMLElement) {
          el.focus();
        }
      }, 60);
    }
  };

  // Save changes from Quick Edit Modal immediately and cleanly
  const handleSaveQuickEdit = (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    // Update global sequence tracker if number was edited
    const num1 = extractSequenceNumber(modalDraft.nomorSurat);
    if (num1) updateSequenceNumber(num1);
    const num2 = extractSequenceNumber(modalDraft.nomorSuratPernyataan);
    if (num2) updateSequenceNumber(num2);

    if (onUpdateApplicantData) {
      const finalData: ApplicantData = {
        ...data,
        ...modalDraft,
        namaLengkap: toTitleCase(modalDraft.namaLengkap || ''),
        alamatKtp: toTitleCase(modalDraft.alamatKtp || ''),
        tempatTanggalLahir: toTitleCase(modalDraft.tempatTanggalLahir || ''),
        tujuanKantorImigrasi: toTitleCase(modalDraft.tujuanKantorImigrasi || ''),
        alamatKantorImigrasi: toTitleCase(modalDraft.alamatKantorImigrasi || ''),
        jadwalKeberangkatanDanKepulangan: modalDraft.jadwalKeberangkatanDanKepulangan || modalDraft.estimasiKeberangkatan || '',
        estimasiKeberangkatan: modalDraft.jadwalKeberangkatanDanKepulangan || modalDraft.estimasiKeberangkatan || '',
      };
      onUpdateApplicantData(finalData);
    }
    setShowQuickEditModal(false);
    showNotification('✓ Berhasil! Data surat resmi telah diperbarui.');
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      if (onSaveToArchive) {
        onSaveToArchive({ withMaterai: false, withStamp, withSignature });
      }

      await generateOfficialLetterPdf('official-letter-to-print', data);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      console.error('PDF generation error, falling back to window.print():', err);
      try {
        window.print();
      } catch (printErr) {
        console.error('Print also failed:', printErr);
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('Direct print blocked by browser/iframe, downloading PDF file:', e);
      handleDownloadPdf();
    }
  };

  const switchTemplate = (tpl: LetterTemplateType) => {
    if (onUpdateTemplateType) {
      onUpdateTemplateType(tpl);
    }
  };

  const triggerUploadAsset = (key: 'logoAlzam' | 'logoUmrahBisa' | 'stempel' | 'ttd') => {
    setActiveAssetUploadKey(key);
    fileInputRef.current?.click();
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeAssetUploadKey) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setCustomAssets((prev) => {
          const updated = {
            ...prev,
            [activeAssetUploadKey]: base64,
          };
          try {
            localStorage.setItem('alzam_official_assets', JSON.stringify(updated));
          } catch (err) {
            console.warn('Could not save to localStorage:', err);
          }
          return updated;
        });
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const removeCustomAsset = (key: 'logoAlzam' | 'logoUmrahBisa' | 'stempel' | 'ttd') => {
    setCustomAssets((prev) => {
      const updated = { ...prev };
      delete updated[key];
      try {
        localStorage.setItem('alzam_official_assets', JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not update localStorage:', err);
      }
      return updated;
    });
  };

  // Reusable KOP Surat Alzam Mandiri Wisata with Official Logos
  const renderKopAlzam = () => (
    <div className="relative pb-2 mb-3.5 border-b-[2.5px] border-slate-900">
      <div className="flex items-center justify-between gap-3">
        {/* Left Logo: Logo Alzam */}
        <div className="w-20 sm:w-24 md:w-26 flex flex-col items-center justify-center shrink-0">
          {customAssets.logoAlzam ? (
            <img
              src={customAssets.logoAlzam}
              alt="Logo Alzam Mandiri Wisata"
              className="w-16 sm:w-20 md:w-22 h-auto max-h-20 object-contain"
            />
          ) : (
            <LogoAlzam className="w-16 sm:w-20 md:w-22 h-auto max-h-20" />
          )}
        </div>

        {/* Center Travel Info in Formal Times New Roman */}
        <div className="text-center flex-1 px-1 font-formal leading-tight" style={{ fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' }}>
          <h1 className="text-base sm:text-[15pt] md:text-[16pt] font-black tracking-wide text-slate-900 uppercase">
            {data.namaPerusahaan || 'PT. ALZAM MANDIRI WISATA'}
          </h1>
          <p
            className="text-[11pt] sm:text-[13pt] font-extrabold italic tracking-wide mt-0.5 text-kop-tagline"
            style={{ color: '#0d5526', fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' }}
          >
            {data.taglinePerusahaan || 'Tour & Travel'}
          </p>
          <p className="text-[8.5pt] sm:text-[10pt] font-bold text-slate-900 tracking-wider mt-0.5">
            IZIN PPIU : {data.izinPpiu || '29042200007580004'}
          </p>
          <p className="text-[7.5pt] sm:text-[8.5pt] text-slate-700 leading-snug mt-0.5">
            {data.alamatPerusahaan || 'Ciledug Mas, Jl. HOS Cokroaminoto Blok C9 dan C10, RT.003/RW.004, Sudimara Timur, Kecamatan Karang Tengah, Kota Tangerang, Banten 15151'}
          </p>
          <p className="text-[7pt] sm:text-[8pt] text-slate-700 mt-0.5">
            Telp/hp : {data.teleponPerusahaan || '0815-9888-154'}, email : {data.emailPerusahaan || 'alzam@bisa.id'},{' '}
            <span
              className="text-kop-link font-normal underline"
              style={{
                color: '#1d4ed8',
                textDecoration: 'underline',
              }}
            >
              {data.websitePerusahaan || 'www.umrahbisa.com'}
            </span>
          </p>
        </div>

        {/* Right Logo: UmrahBISA */}
        <div className="w-20 sm:w-24 md:w-26 flex flex-col items-center justify-center shrink-0">
          {customAssets.logoUmrahBisa ? (
            <img
              src={customAssets.logoUmrahBisa}
              alt="Logo UmrahBISA"
              className="w-16 sm:w-20 md:w-24 h-auto max-h-16 object-contain"
            />
          ) : (
            <LogoUmrahBisa className="w-16 sm:w-20 md:w-24 h-auto max-h-16" />
          )}
        </div>
      </div>
    </div>
  );

  // Controls whether inputs are shown inside document
  const isEditing = isInlineEditMode && !isGeneratingPdf;

  // Reusable Signature & Stamp Alzam with Single Line Spacing
  const renderSignatureAlzam = (docPrefix = 'doc1') => (
    <div className="mt-3 sm:mt-4 flex justify-between items-end">
      <div className="w-4 sm:w-8" />

      {/* Signature Block */}
      <div className="w-64 sm:w-72 ml-auto pl-4 sm:pl-10 text-left relative font-formal" style={{ fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' }}>
        <p className="text-[11pt] leading-tight">
          {isEditing ? (
            <span className="flex items-center gap-1">
              <input
                type="text"
                id={`${docPrefix}-kotaPenerbitan`}
                data-field={`${docPrefix}-kotaPenerbitan`}
                value={data.kotaPenerbitan || 'Jakarta'}
                onChange={(e) => updateField('kotaPenerbitan', e.target.value)}
                className="doc-inline-input w-20 text-[11pt]"
                placeholder="Kota"
              />
              ,
              <input
                type="text"
                id={`${docPrefix}-tanggalSurat`}
                data-field={`${docPrefix}-tanggalSurat`}
                value={data.tanggalSurat || '5 Oktober 2026'}
                onChange={(e) => updateField('tanggalSurat', e.target.value)}
                className="doc-inline-input flex-1 text-[11pt]"
                placeholder="Tanggal Surat"
              />
            </span>
          ) : (
            <span
              onClick={() => activateInlineEdit(`${docPrefix}-tanggalSurat`)}
              className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
              title="Klik untuk mengedit tanggal surat"
            >
              {data.kotaPenerbitan || 'Jakarta'}, {data.tanggalSurat}
            </span>
          )}
        </p>
        <p className="text-[11pt] font-normal leading-tight mt-0.5">Hormat Kami,</p>
        <p className="text-[11pt] font-bold text-slate-950 leading-tight">
          {data.namaPerusahaan || 'PT. Alzam Mandiri Wisata'}
        </p>

        {/* Area TTD dan Stempel */}
        <div className="relative h-18 sm:h-20 flex items-center my-1 overflow-visible">
          {withStamp && (
            <div className="absolute -left-3 sm:-left-5 -top-1 pointer-events-none select-none z-10">
              {customAssets.stempel ? (
                <img
                  src={customAssets.stempel}
                  alt="Stempel Resmi PT Alzam Mandiri Wisata"
                  className="w-24 sm:w-26 h-24 sm:h-26 object-contain mix-blend-multiply opacity-95 -rotate-8"
                />
              ) : (
                <LogoCapAlzam className="w-24 sm:w-26 h-24 sm:h-26" rotation={-8} />
              )}
            </div>
          )}

          {withSignature && (
            <div className="absolute left-1 sm:left-3 top-1 pointer-events-none select-none z-20 overflow-visible">
              {customAssets.ttd ? (
                <img
                  src={customAssets.ttd}
                  alt="Tanda Tangan Khairul Umam"
                  className="w-44 sm:w-48 h-16 sm:h-18 object-contain"
                />
              ) : (
                <TtdDirekturAlzam className="w-44 sm:w-48 h-16 sm:h-18" />
              )}
            </div>
          )}
        </div>

        {/* Nama dan Jabatan Direktur */}
        <div className="pt-1.5">
          <p className="font-bold text-[11pt] text-slate-950 leading-tight">
            {isEditing ? (
              <input
                type="text"
                id={`${docPrefix}-pejabatNama`}
                data-field={`${docPrefix}-pejabatNama`}
                value={data.pejabatNama || 'Khairul Umam, ST, BA, MBA'}
                onChange={(e) => updateField('pejabatNama', e.target.value)}
                className="doc-inline-input font-bold text-[11pt]"
                placeholder="Nama Direktur"
              />
            ) : (
              <span
                onClick={() => activateInlineEdit(`${docPrefix}-pejabatNama`)}
                className="inline-block font-bold cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                style={{
                  borderBottom: '1.5px solid #020617',
                  paddingBottom: '3.5px',
                  lineHeight: '1.2',
                }}
                title="Klik untuk mengedit nama direktur"
              >
                {data.pejabatNama || 'Khairul Umam, ST, BA, MBA'}
              </span>
            )}
          </p>
          <p className="text-[10pt] text-slate-800 font-medium leading-tight mt-1">
            {isEditing ? (
              <input
                type="text"
                id={`${docPrefix}-pejabatJabatan`}
                data-field={`${docPrefix}-pejabatJabatan`}
                value={data.pejabatJabatan || 'Direktur Utama'}
                onChange={(e) => updateField('pejabatJabatan', e.target.value)}
                className="doc-inline-input text-[10pt]"
                placeholder="Jabatan"
              />
            ) : (
              <span
                onClick={() => activateInlineEdit(`${docPrefix}-pejabatJabatan`)}
                className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                title="Klik untuk mengedit jabatan"
              >
                {data.pejabatJabatan || 'Direktur Utama'}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-28">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-800 text-white border border-emerald-500 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top text-xs font-bold print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Top Controls Toolbar */}
      <div className="bg-[#244030] text-[#FAF7F2] rounded-2xl p-4 sm:p-5 border border-[#3D604C] shadow-md print:hidden space-y-4">
        {/* Template Switcher Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#3D604C] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E68F65] bg-[#1B3024] px-2.5 py-0.5 rounded-full border border-[#D96B38]/40 mb-1">
              <Layers className="w-3.5 h-3.5" />
              Pilih Format Surat Resmi PT. Alzam Mandiri Wisata
            </div>
            <h2 className="text-lg font-bold text-[#FAF7F2]">
              Pratinjau Surat Resmi Siap Cetak
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-[#1B3024] p-1.5 rounded-xl border border-[#3D604C]">
            <button
              type="button"
              onClick={() => switchTemplate('permohonan_paspor')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTemplate === 'permohonan_paspor'
                  ? 'bg-[#D96B38] text-white shadow-md'
                  : 'text-[#D4E2D7] hover:text-white hover:bg-[#2F4E3C]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              1. Permohonan Paspor
            </button>

            <button
              type="button"
              onClick={() => switchTemplate('pernyataan_jaminan')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTemplate === 'pernyataan_jaminan'
                  ? 'bg-[#D96B38] text-white shadow-md'
                  : 'text-[#D4E2D7] hover:text-white hover:bg-[#2F4E3C]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E4ECE6]" />
              2. Pernyataan &amp; Jaminan
            </button>

            <button
              type="button"
              onClick={() => switchTemplate('penambahan_nama')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTemplate === 'penambahan_nama'
                  ? 'bg-[#D96B38] text-white shadow-md'
                  : 'text-[#D4E2D7] hover:text-white hover:bg-[#2F4E3C]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-[#E4ECE6]" />
              3. Tambahan Nama Paspor
            </button>

            <button
              type="button"
              onClick={() => switchTemplate('perpanjangan_paspor')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTemplate === 'perpanjangan_paspor'
                  ? 'bg-[#D96B38] text-white shadow-md'
                  : 'text-[#D4E2D7] hover:text-white hover:bg-[#2F4E3C]'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#E4ECE6]" />
              4. Perpanjangan Paspor
            </button>

            <button
              type="button"
              onClick={() => switchTemplate('paket_lengkap_alzam')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTemplate === 'paket_lengkap_alzam'
                  ? 'bg-[#3D604C] text-white border border-[#88A995] shadow-md'
                  : 'text-[#C5D8CC] hover:text-white hover:bg-[#2F4E3C]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#D96B38]" />
              Paket 2 Surat Sekaligus
            </button>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onEditData}
              className="px-3.5 py-2 bg-[#1B3024] hover:bg-[#2F4E3C] text-[#FAF7F2] rounded-xl text-xs font-semibold transition-all border border-[#3D604C] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Formulir Data
            </button>

            {/* Toggle Mode Edit Langsung di Layar */}
            <button
              type="button"
              onClick={() => {
                const next = !isInlineEditMode;
                setIsInlineEditMode(next);
                if (next) {
                  showNotification('Mode edit langsung aktif! Kolom bergaris siap diketik.');
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isInlineEditMode
                  ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-300'
                  : 'bg-[#1B3024] text-[#E68F65] border-[#D96B38]/60 hover:bg-[#2F4E3C]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isInlineEditMode ? 'Tutup Edit di Surat' : 'Edit Langsung di Surat'}</span>
            </button>

            {/* Tombol Modal Ubah Data Cepat */}
            <button
              type="button"
              onClick={() => setShowQuickEditModal(true)}
              className="px-3.5 py-2 bg-[#3D604C] hover:bg-[#4D735C] text-white rounded-xl text-xs font-bold transition-all border border-[#557A64] flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#E68F65]" />
              <span>Ubah Data Cepat</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onSaveToArchive({ withMaterai: false, withStamp, withSignature });
                setLocalSaveSuccess(true);
                setTimeout(() => setLocalSaveSuccess(false), 2500);
              }}
              className="px-3.5 py-2 bg-[#3D604C] hover:bg-[#4D735C] active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-sm border border-[#557A64] flex items-center gap-1.5 cursor-pointer"
            >
              {localSaveSuccess || isSavedInArchive ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5 text-[#E4ECE6]" />
                  <span>{localSaveSuccess ? 'Tersimpan ke Arsip!' : 'Perbarui di Arsip'}</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Simpan ke Arsip</span>
                </>
              )}
            </button>

            {/* Tombol Simpan / Unduh PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-[#D96B38] hover:bg-[#C25B2A] disabled:bg-[#7D4020] text-white font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {isGeneratingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Membuat PDF A4...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <Check className="w-4 h-4 text-[#E4ECE6]" />
                  <span className="text-[#FAF7F2]">PDF Tersimpan!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh PDF (A4)</span>
                </>
              )}
            </button>

            {/* Tombol Cetak / Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-[#1B3024] hover:bg-[#2F4E3C] text-[#FAF7F2] rounded-xl text-xs font-semibold transition-all border border-[#3D604C] flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#C5D8CC]" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            {/* Tombol Kirim WhatsApp Jamaah */}
            {data.nomorWhatsapp && (
              <a
                href={createWhatsAppNotificationUrl(data)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                title={`Kirim notifikasi surat jadi ke WhatsApp ${data.nomorWhatsapp}`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Kirim ke WA Jamaah</span>
              </a>
            )}
          </div>
        </div>

        {/* Consular Seal Toggles */}
        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
          <span className="text-[#C5D8CC] font-medium">Atribut Dokumen Resmi:</span>
          
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[#D4E2D7] hover:text-white">
            <input
              type="checkbox"
              checked={withStamp}
              onChange={(e) => setWithStamp(e.target.checked)}
              className="rounded-sm text-[#D96B38] focus:ring-[#D96B38] w-3.5 h-3.5 accent-[#D96B38]"
            />
            <span>Stempel Resmi Basah (Logo CAP)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[#D4E2D7] hover:text-white">
            <input
              type="checkbox"
              checked={withSignature}
              onChange={(e) => setWithSignature(e.target.checked)}
              className="rounded-sm text-[#D96B38] focus:ring-[#D96B38] w-3.5 h-3.5 accent-[#D96B38]"
            />
            <span>Tanda Tangan Direktur Utama (ttd)</span>
          </label>
        </div>

        {/* 4 Official Assets Status Bar */}
        <div className="pt-3 border-t border-[#3D604C] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#E68F65] font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#D96B38]" />
              4 Aset Resmi Terpasang:
            </span>
            <span className="text-[#FAF7F2] bg-[#1B3024] px-2 py-0.5 rounded-md border border-[#3D604C] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#88A995]" />
              1. Logo Alzam (Kiri)
            </span>
            <span className="text-[#FAF7F2] bg-[#1B3024] px-2 py-0.5 rounded-md border border-[#3D604C] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#88A995]" />
              2. Logo UmrahBISA (Kanan)
            </span>
            <span className="text-[#FAF7F2] bg-[#1B3024] px-2 py-0.5 rounded-md border border-[#3D604C] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#88A995]" />
              3. Logo CAP (Stempel)
            </span>
            <span className="text-[#FAF7F2] bg-[#1B3024] px-2 py-0.5 rounded-md border border-[#3D604C] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#88A995]" />
              4. ttd.png (Tanda Tangan)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAssetModal(true)}
            className="px-3 py-1.5 bg-[#1B3024] hover:bg-[#2F4E3C] text-[#E68F65] rounded-lg text-xs font-semibold transition-all border border-[#D96B38]/40 flex items-center gap-1.5 shadow-xs"
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#D96B38]" />
            <span>Kelola / Ganti File Aset</span>
          </button>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={onFileSelected}
        />
      </div>

      {/* Mode Edit Notice Banner */}
      {isInlineEditMode && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-3.5 sm:p-4 text-emerald-950 text-xs flex flex-wrap items-center justify-between gap-3 shadow-md print:hidden animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-emerald-950 text-sm">
                Mode Edit Langsung di Surat Sedang Aktif!
              </p>
              <p className="text-[11px] text-emerald-800">
                Silakan ketik atau ubah tulisan langsung pada kolom bergaris di lembaran surat di bawah. Perubahan otomatis tersimpan.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQuickEditModal(true)}
              className="px-3 py-1.5 bg-[#3D604C] hover:bg-[#4D735C] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#E68F65]" />
              <span>Buka Ubah Data Cepat</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsInlineEditMode(false);
                showNotification('✓ Selesai edit. Tampilan surat resmi telah dikunci.');
              }}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shrink-0 cursor-pointer shadow-xs active:scale-95"
            >
              ✓ Selesai &amp; Kunci Tampilan
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL UBAH DATA CEPAT (Lengkap, Cepat & Tanpa Glitch)                      */}
      {/* ========================================================================= */}
      {showQuickEditModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 text-slate-900 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Ubah Cepat Data Surat Resmi
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Edit data pemohon, nomor surat, dan tujuan imigrasi dalam satu formulir
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickEditModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickEdit} className="space-y-4 text-xs">
              {/* Section 1: Data Pemohon */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 text-emerald-800">
                  <FileText className="w-3.5 h-3.5" />
                  1. Data Identitas Pemohon (Jamaah)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nama Lengkap Jamaah</label>
                    <input
                      type="text"
                      value={modalDraft.namaLengkap || ''}
                      onChange={(e) => setModalDraft((p) => ({ ...p, namaLengkap: e.target.value }))}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                      placeholder="Contoh: Euis Cholishoh"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">NIK KTP (16 Digit)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={modalDraft.nik || ''}
                      onChange={(e) => setModalDraft((p) => ({ ...p, nik: e.target.value }))}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                      placeholder="3604075304950002"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tempat &amp; Tanggal Lahir</label>
                    <input
                      type="text"
                      value={modalDraft.tempatTanggalLahir || ''}
                      onChange={(e) => setModalDraft((p) => ({ ...p, tempatTanggalLahir: e.target.value }))}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      placeholder="Contoh: Serang, 13 April 1995"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Jadwal Keberangkatan &amp; Pulang</label>
                    <input
                      type="text"
                      value={modalDraft.jadwalKeberangkatanDanKepulangan || modalDraft.estimasiKeberangkatan || ''}
                      onChange={(e) => setModalDraft((p) => ({
                        ...p,
                        jadwalKeberangkatanDanKepulangan: e.target.value,
                        estimasiKeberangkatan: e.target.value,
                      }))}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      placeholder="Contoh: 16 - 24 November 2026"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Alamat Lengkap KTP</label>
                  <textarea
                    rows={2}
                    value={modalDraft.alamatKtp || ''}
                    onChange={(e) => setModalDraft((p) => ({ ...p, alamatKtp: e.target.value }))}
                    className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 leading-snug"
                    placeholder="Alamat RT/RW, Kelurahan, Kecamatan, Kota, Provinsi"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nama Ayah Lengkap</label>
                    <input
                      type="text"
                      value={modalDraft.namaAyah || ''}
                      onChange={(e) => setModalDraft((p) => ({ ...p, namaAyah: e.target.value }))}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                      placeholder="Contoh: H. Ahmad Subandi"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">No WhatsApp Jamaah</label>
                    <input
                      type="text"
                      value={modalDraft.nomorWhatsapp || ''}
                      onChange={(e) => setModalDraft((p) => ({ ...p, nomorWhatsapp: e.target.value }))}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                      placeholder="Contoh: 081234567890"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nama Menjadi (Khusus Penambahan Nama Paspor)</label>
                    <input
                      type="text"
                      value={modalDraft.namaMenjadi || ''}
                      onChange={(e) => setModalDraft((p) => ({ ...p, namaMenjadi: e.target.value }))}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold text-emerald-800"
                      placeholder="Contoh: Suratman Emu"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nomor Paspor Lama</label>
                    <input
                      type="text"
                      value={modalDraft.nomorPasporLama || ''}
                      onChange={(e) => setModalDraft((p) => ({ ...p, nomorPasporLama: e.target.value }))}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                      placeholder="Contoh: Y0195142 / C8527774"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Date Of Expiry (Khusus Perpanjangan Paspor)</label>
                    <input
                      type="text"
                      value={modalDraft.dateOfExpiry || modalDraft.expiredDatePaspor || ''}
                      onChange={(e) => setModalDraft((p) => ({ ...p, dateOfExpiry: e.target.value, expiredDatePaspor: e.target.value }))}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                      placeholder="Contoh: 11/3/2027"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Perihal Dokumen</label>
                    <input
                      type="text"
                      value={modalDraft.perihal || ''}
                      onChange={(e) => setModalDraft((p) => ({ ...p, perihal: e.target.value }))}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                      placeholder="Contoh: Permohonan Penambahan Nama Paspor"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Kantor Imigrasi & Nomor Surat */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 text-emerald-800">
                  <FileText className="w-3.5 h-3.5" />
                  2. Tujuan Kantor Imigrasi &amp; Penomoran Surat
                </h4>

                <ImmigrationOfficePicker
                  label="Tujuan Kantor Imigrasi & Alamat Lengkap"
                  tujuanKantorImigrasi={modalDraft.tujuanKantorImigrasi || ''}
                  alamatKantorImigrasi={modalDraft.alamatKantorImigrasi || ''}
                  onChange={(tujuan, alamat) => {
                    setModalDraft((p) => ({
                      ...p,
                      tujuanKantorImigrasi: tujuan,
                      alamatKantorImigrasi: alamat,
                    }));
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nomor Surat Permohonan</label>
                    <input
                      type="text"
                      value={modalDraft.nomorSurat || ''}
                      onChange={(e) => setModalDraft((p) => ({ ...p, nomorSurat: e.target.value }))}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nomor Surat Pernyataan (Jaminan)</label>
                    <input
                      type="text"
                      value={modalDraft.nomorSuratPernyataan || ''}
                      onChange={(e) => setModalDraft((p) => ({ ...p, nomorSuratPernyataan: e.target.value }))}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Perihal Surat</label>
                    <input
                      type="text"
                      value={modalDraft.perihal || 'Permohonan Pembuatan Paspor'}
                      onChange={(e) => setModalDraft((p) => ({ ...p, perihal: e.target.value }))}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Kota Penerbitan</label>
                    <input
                      type="text"
                      value={modalDraft.kotaPenerbitan || 'Jakarta'}
                      onChange={(e) => setModalDraft((p) => ({ ...p, kotaPenerbitan: e.target.value }))}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tanggal Surat</label>
                    <input
                      type="text"
                      value={modalDraft.tanggalSurat || ''}
                      onChange={(e) => setModalDraft((p) => ({ ...p, tanggalSurat: e.target.value }))}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nama Direktur Utama</label>
                    <input
                      type="text"
                      value={modalDraft.pejabatNama || 'Khairul Umam, ST, BA, MBA'}
                      onChange={(e) => setModalDraft((p) => ({ ...p, pejabatNama: e.target.value }))}
                      className="w-full text-sm p-2.5 bg-white border border-slate-300 rounded-xl font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowQuickEditModal(false)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveQuickEdit()}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md active:scale-95 cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Simpan Perubahan ke Surat</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Management Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1B3024] border border-[#3D604C] rounded-2xl max-w-3xl w-full p-6 text-[#FAF7F2] shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#3D604C] pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#D96B38]" />
                <h3 className="text-base font-bold text-[#FAF7F2]">
                  Kelola 4 Aset Gambar Resmi (Logo, Cap &amp; Tanda Tangan)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAssetModal(false)}
                className="text-[#C5D8CC] hover:text-white p-1 rounded-lg hover:bg-[#2F4E3C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#D4E2D7]">
              Keempat aset ini telah otomatis dimasukkan ke dalam KOP surat, stempel, dan tanda tangan dokumen resmi PT. Alzam Mandiri Wisata.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Asset 1: Logo Alzam */}
              <div className="bg-[#244030] border border-[#3D604C] rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#E68F65]">1. Logo Alzam (KOP Kiri)</span>
                  {customAssets.logoAlzam ? (
                    <span className="text-[10px] bg-[#D96B38]/20 text-[#E68F65] px-2 py-0.5 rounded-full border border-[#D96B38]/40">Kustom</span>
                  ) : (
                    <span className="text-[10px] bg-[#3D604C] text-[#E4ECE6] px-2 py-0.5 rounded-full border border-[#557A64]">Resmi Terpasang</span>
                  )}
                </div>

                <div className="h-28 bg-white/95 rounded-lg flex items-center justify-center p-2 border border-[#3D604C]">
                  {customAssets.logoAlzam ? (
                    <img src={customAssets.logoAlzam} alt="Logo Alzam" className="max-h-24 max-w-full object-contain" />
                  ) : (
                    <LogoAlzam className="w-20 h-auto" />
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => triggerUploadAsset('logoAlzam')}
                    className="flex-1 py-1.5 bg-[#3D604C] hover:bg-[#4D735C] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" /> Ganti Gambar
                  </button>
                  {customAssets.logoAlzam && (
                    <button
                      type="button"
                      onClick={() => removeCustomAsset('logoAlzam')}
                      className="p-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-lg text-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Asset 2: Logo UmrahBISA */}
              <div className="bg-[#244030] border border-[#3D604C] rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#E68F65]">2. Logo UmrahBISA (KOP Kanan)</span>
                  {customAssets.logoUmrahBisa ? (
                    <span className="text-[10px] bg-[#D96B38]/20 text-[#E68F65] px-2 py-0.5 rounded-full border border-[#D96B38]/40">Kustom</span>
                  ) : (
                    <span className="text-[10px] bg-[#3D604C] text-[#E4ECE6] px-2 py-0.5 rounded-full border border-[#557A64]">Resmi Terpasang</span>
                  )}
                </div>

                <div className="h-28 bg-white/95 rounded-lg flex items-center justify-center p-2 border border-[#3D604C]">
                  {customAssets.logoUmrahBisa ? (
                    <img src={customAssets.logoUmrahBisa} alt="Logo UmrahBISA" className="max-h-24 max-w-full object-contain" />
                  ) : (
                    <LogoUmrahBisa className="w-24 h-auto" />
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => triggerUploadAsset('logoUmrahBisa')}
                    className="flex-1 py-1.5 bg-[#3D604C] hover:bg-[#4D735C] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" /> Ganti Gambar
                  </button>
                  {customAssets.logoUmrahBisa && (
                    <button
                      type="button"
                      onClick={() => removeCustomAsset('logoUmrahBisa')}
                      className="p-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-lg text-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Asset 3: Logo CAP (Stempel) */}
              <div className="bg-[#244030] border border-[#3D604C] rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#E68F65]">3. Logo CAP (Stempel Basah)</span>
                  {customAssets.stempel ? (
                    <span className="text-[10px] bg-[#D96B38]/20 text-[#E68F65] px-2 py-0.5 rounded-full border border-[#D96B38]/40">Kustom</span>
                  ) : (
                    <span className="text-[10px] bg-[#3D604C] text-[#E4ECE6] px-2 py-0.5 rounded-full border border-[#557A64]">Resmi Terpasang</span>
                  )}
                </div>

                <div className="h-28 bg-white/95 rounded-lg flex items-center justify-center p-2 border border-[#3D604C]">
                  {customAssets.stempel ? (
                    <img src={customAssets.stempel} alt="Stempel CAP" className="max-h-24 max-w-full object-contain" />
                  ) : (
                    <LogoCapAlzam className="w-24 h-24" rotation={0} />
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => triggerUploadAsset('stempel')}
                    className="flex-1 py-1.5 bg-[#3D604C] hover:bg-[#4D735C] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" /> Ganti Gambar
                  </button>
                  {customAssets.stempel && (
                    <button
                      type="button"
                      onClick={() => removeCustomAsset('stempel')}
                      className="p-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-lg text-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Asset 4: ttd.png (Tanda Tangan) */}
              <div className="bg-[#244030] border border-[#3D604C] rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#E68F65]">4. ttd.png (Tanda Tangan Direktur)</span>
                  {customAssets.ttd ? (
                    <span className="text-[10px] bg-[#D96B38]/20 text-[#E68F65] px-2 py-0.5 rounded-full border border-[#D96B38]/40">Kustom</span>
                  ) : (
                    <span className="text-[10px] bg-[#3D604C] text-[#E4ECE6] px-2 py-0.5 rounded-full border border-[#557A64]">Resmi Terpasang</span>
                  )}
                </div>

                <div className="h-28 bg-white/95 rounded-lg flex items-center justify-center p-2 border border-[#3D604C]">
                  {customAssets.ttd ? (
                    <img src={customAssets.ttd} alt="Tanda Tangan Direktur" className="max-h-24 max-w-full object-contain" />
                  ) : (
                    <TtdDirekturAlzam className="w-40 h-20" />
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => triggerUploadAsset('ttd')}
                    className="flex-1 py-1.5 bg-[#3D604C] hover:bg-[#4D735C] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" /> Ganti Gambar
                  </button>
                  {customAssets.ttd && (
                    <button
                      type="button"
                      onClick={() => removeCustomAsset('ttd')}
                      className="p-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-lg text-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#3D604C]">
              <button
                type="button"
                onClick={() => setShowAssetModal(false)}
                className="px-5 py-2 bg-[#D96B38] hover:bg-[#C25B2A] text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95"
              >
                Selesai &amp; Terapkan ke Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Letter Printable Container for html2pdf and print */}
      <div className="overflow-x-auto w-full pb-4">
        <div id="official-letter-to-print" className="space-y-8 print:space-y-0 min-w-[320px]">
          {/* ========================================================================= */}
          {/* 1. DOKUMEN: SURAT PERMOHONAN PEMBUATAN PASPOR (PT. ALZAM MANDIRI WISATA)  */}
          {/* ========================================================================= */}
          {(currentTemplate === 'permohonan_paspor' || currentTemplate === 'paket_lengkap_alzam' || currentTemplate === 'rekomendasi') && (
            <div
              className="official-letter-page bg-white border border-slate-300 text-slate-900 mx-auto print:p-0 print:border-none print:shadow-none print:m-0 font-formal text-[11pt] leading-spasi-1-5 print:break-after-page shadow-sm rounded-lg sm:rounded-none"
              style={{
                fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
                lineHeight: '1.5',
              }}
            >
              {renderKopAlzam()}

              {/* Nomor & Perihal */}
              <div className="my-2.5 text-[11pt] leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                <table className="w-full leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                  <tbody>
                    <tr>
                      <td className="w-20 align-top py-0.5 font-normal">Nomor</td>
                      <td className="w-4 align-top py-0.5">:</td>
                      <td className="py-0.5 font-normal">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc1-nomorSurat"
                            data-field="nomorSurat"
                            value={data.nomorSurat ?? ''}
                            onChange={(e) => updateField('nomorSurat', e.target.value)}
                            className="doc-inline-input font-mono"
                            placeholder="Nomor Surat"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc1-nomorSurat')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                            title="Klik untuk mengedit nomor surat"
                          >
                            {data.nomorSurat}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="align-top py-0.5 font-normal">Perihal</td>
                      <td className="align-top py-0.5">:</td>
                      <td className="py-0.5 font-bold">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc1-perihal"
                            data-field="perihal"
                            value={data.perihal || 'Permohonan Pembuatan Paspor'}
                            onChange={(e) => updateField('perihal', e.target.value)}
                            className="doc-inline-input font-bold"
                            placeholder="Perihal Surat"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc1-perihal')}
                            className="inline-block font-bold cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                            style={{
                              borderBottom: '1.5px solid #020617',
                              paddingBottom: '2px',
                            }}
                            title="Klik untuk mengedit perihal"
                          >
                            {data.perihal || 'Permohonan Pembuatan Paspor'}
                          </span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Kepada Yth. Tujuan Kantor Imigrasi */}
              <div className="mb-2.5 text-[11pt] leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                <p>Kepada Yth,</p>
                <p className="font-normal">
                  {isEditing ? (
                    <input
                      type="text"
                      id="doc1-tujuanKantorImigrasi"
                      data-field="tujuanKantorImigrasi"
                      value={data.tujuanKantorImigrasi ?? ''}
                      onChange={(e) => updateField('tujuanKantorImigrasi', e.target.value)}
                      className="doc-inline-input font-normal"
                      placeholder="Contoh: Kepala Kantor Imigrasi Kelas II Cilegon"
                    />
                  ) : (
                    <span
                      onClick={() => activateInlineEdit('doc1-tujuanKantorImigrasi')}
                      className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                      title="Klik untuk mengedit kantor imigrasi"
                    >
                      {toTitleCase(data.tujuanKantorImigrasi || 'Kepala Kantor Imigrasi Kelas II TPI Tanjung Pandan')}
                    </span>
                  )}
                </p>
                <p className="leading-snug">
                  {isEditing ? (
                    <textarea
                      rows={2}
                      id="doc1-alamatKantorImigrasi"
                      data-field="alamatKantorImigrasi"
                      value={data.alamatKantorImigrasi ?? ''}
                      onChange={(e) => updateField('alamatKantorImigrasi', e.target.value)}
                      className="doc-inline-input text-[10.5pt]"
                      placeholder="Alamat kantor imigrasi..."
                    />
                  ) : (
                    <span
                      onClick={() => activateInlineEdit('doc1-alamatKantorImigrasi')}
                      className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                      title="Klik untuk mengedit alamat kantor imigrasi"
                    >
                      {toTitleCase(data.alamatKantorImigrasi || 'Jl. Jendral Sudirman Km. 6,5, Desa Perawas, Kec. Tanjung Pandan, Kabupaten Belitung, Kepulauan Bangka Belitung 33413.')}
                    </span>
                  )}
                </p>
              </div>

              {/* Salam & Alasan Permohonan */}
              <div className="space-y-1.5 text-justify text-justify-formal text-[11pt] leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                <p style={{ lineHeight: '1.5' }}>Assalamu’alaikum warahmatullahi wabarakatuh</p>
                <p style={{ lineHeight: '1.5' }}>
                  Sehubungan dengan akan adanya keberangkatan jamaah umrah {data.namaPerusahaan || 'PT. Alzam Mandiri Wisata'} dengan izin Penyelenggara Perjalanan Ibadah Umrah yang diterbitkan {data.tanggalIzinPpiu || '02 Agustus 2022'} oleh Pemerintah Republik Indonesia, maka dengan ini kami mengajukan permohonan guna pembuatan paspor atas nama :
                </p>

                {/* Tabel Data Pemohon / Jamaah */}
                <table className="w-full my-1.5 text-[11pt] ml-1 sm:ml-4 leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                  <tbody>
                    <tr>
                      <td className="w-28 sm:w-36 md:w-44 align-top py-0.5">Nama</td>
                      <td className="w-3 sm:w-4 align-top py-0.5">:</td>
                      <td className="py-0.5 font-bold">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc1-namaLengkap"
                            data-field="namaLengkap"
                            value={data.namaLengkap ?? ''}
                            onChange={(e) => updateField('namaLengkap', e.target.value)}
                            className="doc-inline-input font-bold"
                            placeholder="Ketik nama jamaah..."
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc1-namaLengkap')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                            title="Klik untuk mengedit nama"
                          >
                            {toTitleCase(data.namaLengkap)}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="align-top py-0.5">Tempat/Tanggal Lahir</td>
                      <td className="align-top py-0.5">:</td>
                      <td className="py-0.5">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc1-tempatTanggalLahir"
                            data-field="tempatTanggalLahir"
                            value={data.tempatTanggalLahir ?? ''}
                            onChange={(e) => updateField('tempatTanggalLahir', e.target.value)}
                            className="doc-inline-input"
                            placeholder="Contoh: Serang, 13 April 1995"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc1-tempatTanggalLahir')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                            title="Klik untuk mengedit TTL"
                          >
                            {toTitleCase(data.tempatTanggalLahir)}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="align-top py-0.5">NIK</td>
                      <td className="align-top py-0.5">:</td>
                      <td className="py-0.5 font-mono">
                        {isEditing ? (
                          <input
                            type="text"
                            inputMode="numeric"
                            id="doc1-nik"
                            data-field="nik"
                            value={data.nik ?? ''}
                            onChange={(e) => updateField('nik', e.target.value)}
                            className="doc-inline-input font-mono font-bold"
                            placeholder="Ketik 16 digit NIK..."
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc1-nik')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1 font-mono"
                            title="Klik untuk mengedit NIK"
                          >
                            {data.nik}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="align-top py-0.5">Alamat</td>
                      <td className="align-top py-0.5">:</td>
                      <td className="py-0.5 leading-snug">
                        {isEditing ? (
                          <textarea
                            rows={2}
                            id="doc1-alamatKtp"
                            data-field="alamatKtp"
                            value={data.alamatKtp ?? ''}
                            onChange={(e) => updateField('alamatKtp', e.target.value)}
                            className="doc-inline-input leading-snug"
                            placeholder="Ketik alamat KTP lengkap..."
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc1-alamatKtp')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                            title="Klik untuk mengedit alamat"
                          >
                            {toTitleCase(data.alamatKtp)}
                          </span>
                        )}
                      </td>
                    </tr>
                    {(data.namaAyah || isEditing) && (
                      <tr>
                        <td className="align-top py-0.5">Nama Ayah Kandung</td>
                        <td className="align-top py-0.5">:</td>
                        <td className="py-0.5 font-bold">
                          {isEditing ? (
                            <input
                              type="text"
                              id="doc1-namaAyah"
                              data-field="namaAyah"
                              value={data.namaAyah ?? ''}
                              onChange={(e) => updateField('namaAyah', e.target.value)}
                              className="doc-inline-input font-bold"
                              placeholder="Nama Ayah Lengkap..."
                            />
                          ) : (
                            <span
                              onClick={() => activateInlineEdit('doc1-namaAyah')}
                              className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                              title="Klik untuk mengedit nama ayah"
                            >
                              {toTitleCase(data.namaAyah || '-')}
                            </span>
                          )}
                        </td>
                      </tr>
                    )}
                    {(data.nomorPasporLama || isEditing) && (
                      <tr>
                        <td className="align-top py-0.5">No. Paspor Lama</td>
                        <td className="align-top py-0.5">:</td>
                        <td className="py-0.5">
                          {isEditing ? (
                            <input
                              type="text"
                              id="doc1-nomorPasporLama"
                              data-field="nomorPasporLama"
                              value={data.nomorPasporLama ?? ''}
                              onChange={(e) => updateField('nomorPasporLama', e.target.value)}
                              className="doc-inline-input font-mono"
                              placeholder="No paspor lama jika ada..."
                            />
                          ) : (
                            <span
                              onClick={() => activateInlineEdit('doc1-nomorPasporLama')}
                              className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1 font-mono font-bold"
                              title="Klik untuk mengedit no paspor lama"
                            >
                              {data.nomorPasporLama} <span className="text-[10pt] font-normal text-slate-600">(Satu Kata Pada Nama / Paspor Berlaku)</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    )}
                    {(data.expiredDatePaspor || isEditing) && (
                      <tr>
                        <td className="align-top py-0.5">Masa Berlaku Paspor</td>
                        <td className="align-top py-0.5">:</td>
                        <td className="py-0.5">
                          {isEditing ? (
                            <input
                              type="text"
                              id="doc1-expiredDatePaspor"
                              data-field="expiredDatePaspor"
                              value={data.expiredDatePaspor ?? ''}
                              onChange={(e) => updateField('expiredDatePaspor', e.target.value)}
                              className="doc-inline-input"
                              placeholder="Expired date paspor lama..."
                            />
                          ) : (
                            <span
                              onClick={() => activateInlineEdit('doc1-expiredDatePaspor')}
                              className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                              title="Klik untuk mengedit expired date paspor"
                            >
                              {data.expiredDatePaspor}
                            </span>
                          )}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="align-top py-0.5">Tanggal Keberangkatan</td>
                      <td className="align-top py-0.5">:</td>
                      <td className="py-0.5 font-normal">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc1-jadwalKeberangkatan"
                            data-field="jadwalKeberangkatan"
                            value={data.jadwalKeberangkatanDanKepulangan || data.estimasiKeberangkatan || '20 - 28 Februari 2027'}
                            onChange={(e) => {
                              updateMultipleFields({
                                jadwalKeberangkatanDanKepulangan: e.target.value,
                                estimasiKeberangkatan: e.target.value,
                              });
                            }}
                            className="doc-inline-input font-normal"
                            placeholder="Jadwal keberangkatan..."
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc1-jadwalKeberangkatan')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                            title="Klik untuk mengedit jadwal"
                          >
                            {data.jadwalKeberangkatanDanKepulangan || data.estimasiKeberangkatan || '20 - 28 Februari 2027'}
                          </span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <p className="mt-2" style={{ lineHeight: '1.5' }}>
                  Demikian permohonan ini kami buat, atas bantuan dan perhatian Bapak/Ibu kami ucapkan terima kasih. Wassalamu'alaikum warahmatullahi wabarakatuh
                </p>
              </div>

              {renderSignatureAlzam('doc1')}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. DOKUMEN: SURAT PERNYATAAN DAN JAMINAN (PT. ALZAM MANDIRI WISATA)       */}
          {/* ========================================================================= */}
          {(currentTemplate === 'pernyataan_jaminan' || currentTemplate === 'paket_lengkap_alzam') && (
            <div
              className="official-letter-page bg-white border border-slate-300 text-slate-900 mx-auto print:p-0 print:border-none print:shadow-none print:m-0 font-formal text-[11pt] leading-spasi-1-5 print:break-after-page shadow-sm rounded-lg sm:rounded-none"
              style={{
                fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
                lineHeight: '1.5',
              }}
            >
              {renderKopAlzam()}

              {/* Nomor & Perihal */}
              <div className="my-2.5 text-[11pt] leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                <table className="w-full leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                  <tbody>
                    <tr>
                      <td className="w-20 align-top py-0.5 font-normal">Nomor</td>
                      <td className="w-4 align-top py-0.5">:</td>
                      <td className="py-0.5 font-normal">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc2-nomorSuratPernyataan"
                            data-field="nomorSuratPernyataan"
                            value={data.nomorSuratPernyataan || (currentTemplate === 'paket_lengkap_alzam' ? '7380/SR/AMW/X/2026' : data.nomorSurat)}
                            onChange={(e) => updateField('nomorSuratPernyataan', e.target.value)}
                            className="doc-inline-input font-mono"
                            placeholder="Nomor Surat Jaminan"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc2-nomorSuratPernyataan')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1 font-mono"
                            title="Klik untuk mengedit nomor surat"
                          >
                            {data.nomorSuratPernyataan || (currentTemplate === 'paket_lengkap_alzam' ? '7380/SR/AMW/X/2026' : data.nomorSurat)}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="align-top py-0.5 font-normal">Perihal</td>
                      <td className="align-top py-0.5">:</td>
                      <td className="py-0.5 font-bold">
                        <span
                          className="inline-block font-bold"
                          style={{
                            borderBottom: '1.5px solid #020617',
                            paddingBottom: '2px',
                          }}
                        >
                          Surat Pernyataan dan Jaminan
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Salam & Pihak Pertama */}
              <div className="space-y-1 text-justify text-justify-formal text-[11pt] leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                <p style={{ lineHeight: '1.5' }}>Assalamu’alaikum warahmatullahi wabarakatuh</p>
                <p style={{ lineHeight: '1.5' }}>Saya yang bertanda tangan dibawah ini:</p>

                {/* Tabel Pihak Pertama */}
                <table className="w-full my-1 text-[11pt] ml-1 sm:ml-4 leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                  <tbody>
                    <tr>
                      <td className="w-28 sm:w-32 align-top py-0.5">Nama</td>
                      <td className="w-3 sm:w-4 align-top py-0.5">:</td>
                      <td className="py-0.5 font-bold">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc2-pejabatNama"
                            data-field="pejabatNama"
                            value={data.pejabatNama || 'Khairul Umam, ST, BA, MBA'}
                            onChange={(e) => updateField('pejabatNama', e.target.value)}
                            className="doc-inline-input font-bold"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc2-pejabatNama')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                          >
                            {data.pejabatNama || 'Khairul Umam, ST, BA, MBA'}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="align-top py-0.5">Jabatan</td>
                      <td className="align-top py-0.5">:</td>
                      <td className="py-0.5">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc2-pejabatJabatan"
                            data-field="pejabatJabatan"
                            value={data.pejabatJabatan || 'Direktur Utama'}
                            onChange={(e) => updateField('pejabatJabatan', e.target.value)}
                            className="doc-inline-input"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc2-pejabatJabatan')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                          >
                            {data.pejabatJabatan || 'Direktur Utama'}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="align-top py-0.5">Perusahaan</td>
                      <td className="align-top py-0.5">:</td>
                      <td className="py-0.5 font-bold">
                        {data.namaPerusahaan || 'PT. Alzam Mandiri Wisata'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Pihak Kedua (Calon Jamaah) */}
              <div className="space-y-1 mt-1 text-justify text-justify-formal text-[11pt] leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                <p style={{ lineHeight: '1.5' }}>Bersama ini kami menyatakan:</p>

                {/* Tabel Data Jamaah */}
                <table className="w-full my-1 text-[11pt] ml-1 sm:ml-4 leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                  <tbody>
                    <tr>
                      <td className="w-28 sm:w-36 md:w-44 align-top py-0.5">Nama</td>
                      <td className="w-3 sm:w-4 align-top py-0.5">:</td>
                      <td className="py-0.5 font-bold">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc2-namaLengkap"
                            data-field="namaLengkap"
                            value={data.namaLengkap ?? ''}
                            onChange={(e) => updateField('namaLengkap', e.target.value)}
                            className="doc-inline-input font-bold"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc2-namaLengkap')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                            title="Klik untuk mengedit nama"
                          >
                            {toTitleCase(data.namaLengkap)}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="align-top py-0.5">Tempat/Tanggal Lahir</td>
                      <td className="align-top py-0.5">:</td>
                      <td className="py-0.5">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc2-tempatTanggalLahir"
                            data-field="tempatTanggalLahir"
                            value={data.tempatTanggalLahir ?? ''}
                            onChange={(e) => updateField('tempatTanggalLahir', e.target.value)}
                            className="doc-inline-input"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc2-tempatTanggalLahir')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                            title="Klik untuk mengedit TTL"
                          >
                            {toTitleCase(data.tempatTanggalLahir)}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="align-top py-0.5">NIK</td>
                      <td className="align-top py-0.5">:</td>
                      <td className="py-0.5 font-mono">
                        {isEditing ? (
                          <input
                            type="text"
                            inputMode="numeric"
                            id="doc2-nik"
                            data-field="nik"
                            value={data.nik ?? ''}
                            onChange={(e) => updateField('nik', e.target.value)}
                            className="doc-inline-input font-mono font-bold"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc2-nik')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1 font-mono"
                            title="Klik untuk mengedit NIK"
                          >
                            {data.nik}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="align-top py-0.5">Alamat</td>
                      <td className="align-top py-0.5">:</td>
                      <td className="py-0.5 leading-snug">
                        {isEditing ? (
                          <textarea
                            rows={2}
                            id="doc2-alamatKtp"
                            data-field="alamatKtp"
                            value={data.alamatKtp ?? ''}
                            onChange={(e) => updateField('alamatKtp', e.target.value)}
                            className="doc-inline-input leading-snug"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc2-alamatKtp')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                            title="Klik untuk mengedit alamat"
                          >
                            {toTitleCase(data.alamatKtp)}
                          </span>
                        )}
                      </td>
                    </tr>
                    {(data.namaAyah || isEditing) && (
                      <tr>
                        <td className="align-top py-0.5">Nama Ayah Kandung</td>
                        <td className="align-top py-0.5">:</td>
                        <td className="py-0.5 font-bold">
                          {isEditing ? (
                            <input
                              type="text"
                              id="doc2-namaAyah"
                              data-field="namaAyah"
                              value={data.namaAyah ?? ''}
                              onChange={(e) => updateField('namaAyah', e.target.value)}
                              className="doc-inline-input font-bold"
                              placeholder="Nama Ayah Lengkap..."
                            />
                          ) : (
                            <span
                              onClick={() => activateInlineEdit('doc2-namaAyah')}
                              className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                            >
                              {toTitleCase(data.namaAyah || '-')}
                            </span>
                          )}
                        </td>
                      </tr>
                    )}
                    {data.nomorPasporLama && (
                      <tr>
                        <td className="align-top py-0.5">No. Paspor Lama</td>
                        <td className="align-top py-0.5">:</td>
                        <td className="py-0.5 font-mono">
                          {data.nomorPasporLama}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pernyataan Pengantar Jaminan */}
              <div className="mt-2 space-y-1 text-justify text-justify-formal text-[11pt] leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                <p style={{ lineHeight: '1.5' }}>
                  adalah benar calon jamaah umrah {data.namaPerusahaan || 'PT. Alzam Mandiri Wisata'} sebagai penyelenggara resmi perjalanan umrah dan kami bertanggungjawab dan menjamin sepenuhnya terhadap calon jamaah umrah kami dengan memperhatikan hal-hal sebagai berikut :
                </p>

                {/* 4 POIN JAMINAN */}
                <div className="space-y-1 ml-1 mt-1.5">
                  <div className="flex items-start gap-2 text-justify text-justify-formal">
                    <span className="w-4 shrink-0 font-normal">1.</span>
                    <p className="flex-1 leading-spasi-1-15" style={{ lineHeight: '1.20' }}>
                      Pemohon paspor yang kami urus adalah WNI (Warga Negara Indonesia) yang sebenarnya akan melakukan perjalanan ke Arab Saudi dalam rangka menunaikan ibadah umrah.
                    </p>
                  </div>

                  <div className="flex items-start gap-2 text-justify text-justify-formal">
                    <span className="w-4 shrink-0 font-normal">2.</span>
                    <p className="flex-1 leading-spasi-1-15" style={{ lineHeight: '1.20' }}>
                      Rombongan calon jamaah umrah yang kami urus tidak akan melakukan pelanggaran peraturan keimigrasian berupa penyalahgunaan izin tinggal, tidak melebihi izin tinggalnya (Overstay) memalsukan atau membuat palsu paspor yang diberikan kepadanya maupun bekerja secara ilegal.
                    </p>
                  </div>

                  <div className="flex items-start gap-2 text-justify text-justify-formal">
                    <span className="w-4 shrink-0 font-normal">3.</span>
                    <p className="flex-1 leading-spasi-1-15" style={{ lineHeight: '1.20' }}>
                      Apabila terjadi pelanggaran sebagaimana dimaksud, maka izin usaha kami sebagai penyelenggara perjalanan ibadah umrah bersedia dicabut.
                    </p>
                  </div>

                  <div className="flex items-start gap-2 text-justify text-justify-formal">
                    <span className="w-4 shrink-0 font-normal">4.</span>
                    <p className="flex-1 leading-spasi-1-15" style={{ lineHeight: '1.20' }}>
                      Jadwal keberangkatan dan kepulangan ke Indonesia dari Tanggal{' '}
                      <span className="font-bold text-slate-950">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc2-jadwalKeberangkatan"
                            data-field="jadwalKeberangkatan"
                            value={data.jadwalKeberangkatanDanKepulangan || data.estimasiKeberangkatan || '20 - 28 Februari 2027'}
                            onChange={(e) => {
                              updateMultipleFields({
                                jadwalKeberangkatanDanKepulangan: e.target.value,
                                estimasiKeberangkatan: e.target.value,
                              });
                            }}
                            className="doc-inline-input font-bold"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc2-jadwalKeberangkatan')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                          >
                            {data.jadwalKeberangkatanDanKepulangan || data.estimasiKeberangkatan || '20 - 28 Februari 2027'}
                          </span>
                        )}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Penutup */}
              <div className="mt-2 text-justify text-justify-formal space-y-1 text-[11pt] leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                <p style={{ lineHeight: '1.5' }}>
                  Demikian surat Pernyataan dan Jaminan ini kami buat dengan sebenarnya untuk dipergunakan sebagaimana mestinya. Atas perhatian dan kerjasamanya kami ucapkan terima kasih. Wassalamu'alaikum warahmatullahi wabarakatuh
                </p>
              </div>

              {renderSignatureAlzam('doc2')}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. DOKUMEN: SURAT PERMOHONAN PENAMBAHAN NAMA PASPOR (PT. ALZAM MANDIRI)    */}
          {/* ========================================================================= */}
          {currentTemplate === 'penambahan_nama' && (
            <div
              className="official-letter-page bg-white border border-slate-300 text-slate-900 mx-auto print:p-0 print:border-none print:shadow-none print:m-0 font-formal text-[11pt] leading-spasi-1-5 print:break-after-page shadow-sm rounded-lg sm:rounded-none"
              style={{
                fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
                lineHeight: '1.5',
              }}
            >
              {renderKopAlzam()}

              {/* Nomor & Perihal */}
              <div className="my-2.5 text-[11pt] leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                <table className="w-full leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                  <tbody>
                    <tr>
                      <td className="w-20 align-top py-0.5 font-normal">Nomor</td>
                      <td className="w-4 align-top py-0.5">:</td>
                      <td className="py-0.5 font-normal">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc3-nomorSurat"
                            data-field="nomorSurat"
                            value={data.nomorSurat ?? '7368/SR/AMW/X/2026'}
                            onChange={(e) => updateField('nomorSurat', e.target.value)}
                            className="doc-inline-input font-mono"
                            placeholder="Nomor Surat"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc3-nomorSurat')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                          >
                            {data.nomorSurat || '7368/SR/AMW/X/2026'}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="align-top py-0.5 font-normal">Perihal</td>
                      <td className="align-top py-0.5">:</td>
                      <td className="py-0.5 font-bold">
                        <span
                          className="inline-block font-bold"
                          style={{
                            borderBottom: '1.5px solid #020617',
                            paddingBottom: '2px',
                          }}
                        >
                          {data.perihal || 'Permohonan Penambahan Nama Paspor'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Kepada Yth. Tujuan Kantor Imigrasi */}
              <div className="mb-2.5 text-[11pt] leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                <p>Kepada Yth.</p>
                <p className="font-normal">
                  {isEditing ? (
                    <input
                      type="text"
                      id="doc3-tujuanKantorImigrasi"
                      data-field="tujuanKantorImigrasi"
                      value={data.tujuanKantorImigrasi ?? 'Mal Pelayanan Publik Kota Cimahi Jl. Aruman,'}
                      onChange={(e) => updateField('tujuanKantorImigrasi', e.target.value)}
                      className="doc-inline-input font-normal"
                    />
                  ) : (
                    <span
                      onClick={() => activateInlineEdit('doc3-tujuanKantorImigrasi')}
                      className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                    >
                      {toTitleCase(data.tujuanKantorImigrasi || 'Mal Pelayanan Publik Kota Cimahi Jl. Aruman,')}
                    </span>
                  )}
                </p>
                <p className="leading-snug">
                  {isEditing ? (
                    <textarea
                      rows={2}
                      id="doc3-alamatKantorImigrasi"
                      data-field="alamatKantorImigrasi"
                      value={data.alamatKantorImigrasi ?? 'Kelurahan Pasirkaliki, Kecamatan Cimahi Utara, Kota Cimahi, Jawa Barat 40514'}
                      onChange={(e) => updateField('alamatKantorImigrasi', e.target.value)}
                      className="doc-inline-input text-[10.5pt]"
                    />
                  ) : (
                    <span
                      onClick={() => activateInlineEdit('doc3-alamatKantorImigrasi')}
                      className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                    >
                      {toTitleCase(data.alamatKantorImigrasi || 'Kelurahan Pasirkaliki, Kecamatan Cimahi Utara, Kota Cimahi, Jawa Barat 40514')}
                    </span>
                  )}
                </p>
              </div>

              {/* Pembuka Permohonan Izin Penambahan Nama */}
              <div className="space-y-1.5 text-justify text-justify-formal text-[11pt] leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                <p style={{ lineHeight: '1.5' }}>Assalamu’alaikum warahmatullahi wabarakatuh</p>
                <p style={{ lineHeight: '1.5' }}>
                  Bersama ini dengan hormat kami pengurus {data.namaPerusahaan || 'PT. Alzam Mandiri Wisata'} sebagai penyelenggara resmi perjalanan umrah dengan izin Penyelenggara Perjalanan Ibadah Umrah yang diterbitkan {data.tanggalIzinPpiu || '02 Agustus 2022'} oleh Pemerintah Republik Indonesia No. Izin {data.izinPpiu || '29042200007580001'}, dengan ini kami mengajukan permohonan izin penambahan nama paspor atas nama :
                </p>

                {/* Tabel Data Penambahan Nama */}
                <table className="w-full my-1.5 text-[11pt] ml-1 sm:ml-4 leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                  <tbody>
                    <tr>
                      <td className="w-36 sm:w-44 align-top py-0.5">Nama</td>
                      <td className="w-3 sm:w-4 align-top py-0.5">:</td>
                      <td className="py-0.5 font-bold">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc3-namaLengkap"
                            data-field="namaLengkap"
                            value={data.namaLengkap ?? ''}
                            onChange={(e) => updateField('namaLengkap', e.target.value)}
                            className="doc-inline-input font-bold"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc3-namaLengkap')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                          >
                            {toTitleCase(data.namaLengkap || 'Suratman')}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="align-top py-0.5">Tempat/Tanggal Lahir</td>
                      <td className="align-top py-0.5">:</td>
                      <td className="py-0.5">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc3-tempatTanggalLahir"
                            data-field="tempatTanggalLahir"
                            value={data.tempatTanggalLahir ?? ''}
                            onChange={(e) => updateField('tempatTanggalLahir', e.target.value)}
                            className="doc-inline-input"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc3-tempatTanggalLahir')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                          >
                            {toTitleCase(data.tempatTanggalLahir || 'Cimahi, 10 November 1973')}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="align-top py-0.5 font-bold text-slate-950">Menjadi</td>
                      <td className="align-top py-0.5">:</td>
                      <td className="py-0.5 font-bold">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc3-namaMenjadi"
                            data-field="namaMenjadi"
                            value={data.namaMenjadi || `${data.namaLengkap} ${data.namaAyah || 'Emu'}`.trim()}
                            onChange={(e) => updateField('namaMenjadi', e.target.value)}
                            className="doc-inline-input font-bold"
                            placeholder="Contoh: Suratman Emu"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc3-namaMenjadi')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1 font-bold"
                            title="Klik untuk mengedit nama menjadi"
                          >
                            {toTitleCase(data.namaMenjadi || `${data.namaLengkap} ${data.namaAyah || 'Emu'}`.trim())}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="align-top py-0.5">Nomor Paspor Lama</td>
                      <td className="align-top py-0.5">:</td>
                      <td className="py-0.5 font-mono">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc3-nomorPasporLama"
                            data-field="nomorPasporLama"
                            value={data.nomorPasporLama || 'Y0195142'}
                            onChange={(e) => updateField('nomorPasporLama', e.target.value)}
                            className="doc-inline-input font-mono"
                            placeholder="Contoh: Y0195142"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc3-nomorPasporLama')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1 font-mono"
                          >
                            {data.nomorPasporLama || 'Y0195142'}
                          </span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Paragraf Jaminan & 4 Poin Jaminan */}
                <p style={{ lineHeight: '1.5' }}>
                  adalah benar calon jamaah umrah {data.namaPerusahaan || 'PT. Alzam Mandiri Wisata'} sebagai penyelenggara resmi perjalanan umrah dan kami bertanggung jawab dan menjamin sepenuhnya terhadap calon jamaah umrah kami dengan memperhatikan hal-hal sebagai berikut :
                </p>

                <div className="space-y-1 ml-1 mt-1.5">
                  <div className="flex items-start gap-2 text-justify text-justify-formal">
                    <span className="w-4 shrink-0 font-normal">1.</span>
                    <p className="flex-1 leading-spasi-1-15" style={{ lineHeight: '1.20' }}>
                      Pemohon paspor yang kami urus adalah WNI (Warga Negara Indonesia) yang sebenarnya akan melakukan perjalanan ke Arab Saudi dalam rangka menunaikan ibadah umrah.
                    </p>
                  </div>

                  <div className="flex items-start gap-2 text-justify text-justify-formal">
                    <span className="w-4 shrink-0 font-normal">2.</span>
                    <p className="flex-1 leading-spasi-1-15" style={{ lineHeight: '1.20' }}>
                      Rombongan calon jamaah umrah yang kami urus tidak akan melakukan pelanggaran peraturan keimigrasian berupa penyalahgunaan izin tinggal, tidak melebihi izin tinggalnya (Overstay) memalsukan atau membuat palsu paspor yang diberikan kepadanya maupun bekerja secara ilegal.
                    </p>
                  </div>

                  <div className="flex items-start gap-2 text-justify text-justify-formal">
                    <span className="w-4 shrink-0 font-normal">3.</span>
                    <p className="flex-1 leading-spasi-1-15" style={{ lineHeight: '1.20' }}>
                      Apabila terjadi pelanggaran sebagaimana dimaksud, maka izin usaha kami sebagai penyelenggara perjalanan ibadah umrah bersedia dicabut.
                    </p>
                  </div>

                  <div className="flex items-start gap-2 text-justify text-justify-formal">
                    <span className="w-4 shrink-0 font-normal">4.</span>
                    <p className="flex-1 leading-spasi-1-15" style={{ lineHeight: '1.20' }}>
                      Jadwal keberangkatan dan kepulangan ke Indonesia dari Tanggal
                      <span className="font-bold text-slate-950 block mt-0.5">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc3-jadwalKeberangkatan"
                            data-field="jadwalKeberangkatan"
                            value={data.jadwalKeberangkatanDanKepulangan || data.estimasiKeberangkatan || '5 - 14 November 2026'}
                            onChange={(e) => {
                              updateMultipleFields({
                                jadwalKeberangkatanDanKepulangan: e.target.value,
                                estimasiKeberangkatan: e.target.value,
                              });
                            }}
                            className="doc-inline-input font-bold"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc3-jadwalKeberangkatan')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                          >
                            {data.jadwalKeberangkatanDanKepulangan || data.estimasiKeberangkatan || '5 - 14 November 2026'}
                          </span>
                        )}
                      </span>
                    </p>
                  </div>
                </div>

                <p className="mt-2" style={{ lineHeight: '1.5' }}>
                  Demikian permohonan ini kami buat, atas bantuan dan perhatian Bapak/Ibu kami ucapkan terima kasih. Wassalamu'alaikum warahmatullahi wabarakatuh
                </p>
              </div>

              {renderSignatureAlzam('doc3')}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. DOKUMEN: SURAT PERMOHONAN PERPANJANGAN PASPOR (PT. ALZAM MANDIRI)       */}
          {/* ========================================================================= */}
          {currentTemplate === 'perpanjangan_paspor' && (
            <div
              className="official-letter-page bg-white border border-slate-300 text-slate-900 mx-auto print:p-0 print:border-none print:shadow-none print:m-0 font-formal text-[11pt] leading-spasi-1-5 print:break-after-page shadow-sm rounded-lg sm:rounded-none"
              style={{
                fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
                lineHeight: '1.5',
              }}
            >
              {renderKopAlzam()}

              {/* Nomor & Perihal */}
              <div className="my-2.5 text-[11pt] leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                <table className="w-full leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                  <tbody>
                    <tr>
                      <td className="w-20 align-top py-0.5 font-normal">Nomor</td>
                      <td className="w-4 align-top py-0.5">:</td>
                      <td className="py-0.5 font-normal">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc4-nomorSurat"
                            data-field="nomorSurat"
                            value={data.nomorSurat ?? '7368/SR/AMW/X/2026'}
                            onChange={(e) => updateField('nomorSurat', e.target.value)}
                            className="doc-inline-input font-mono"
                            placeholder="Nomor Surat"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc4-nomorSurat')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                          >
                            {data.nomorSurat || '7368/SR/AMW/X/2026'}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="align-top py-0.5 font-normal">Perihal</td>
                      <td className="align-top py-0.5">:</td>
                      <td className="py-0.5 font-bold">
                        <span
                          className="inline-block font-bold"
                          style={{
                            borderBottom: '1.5px solid #020617',
                            paddingBottom: '2px',
                          }}
                        >
                          {data.perihal || 'Permohonan Perpanjangan Paspor'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Kepada Yth. Tujuan Kantor Imigrasi */}
              <div className="mb-2.5 text-[11pt] leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                <p>Kepada Yth.</p>
                <p className="font-normal">
                  {isEditing ? (
                    <input
                      type="text"
                      id="doc4-tujuanKantorImigrasi"
                      data-field="tujuanKantorImigrasi"
                      value={data.tujuanKantorImigrasi ?? 'Mal Pelayanan Publik Kota Cimahi Jl. Aruman,'}
                      onChange={(e) => updateField('tujuanKantorImigrasi', e.target.value)}
                      className="doc-inline-input font-normal"
                    />
                  ) : (
                    <span
                      onClick={() => activateInlineEdit('doc4-tujuanKantorImigrasi')}
                      className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                    >
                      {toTitleCase(data.tujuanKantorImigrasi || 'Mal Pelayanan Publik Kota Cimahi Jl. Aruman,')}
                    </span>
                  )}
                </p>
                <p className="leading-snug">
                  {isEditing ? (
                    <textarea
                      rows={2}
                      id="doc4-alamatKantorImigrasi"
                      data-field="alamatKantorImigrasi"
                      value={data.alamatKantorImigrasi ?? 'Kelurahan Pasirkaliki, Kecamatan Cimahi Utara, Kota Cimahi, Jawa Barat 40514'}
                      onChange={(e) => updateField('alamatKantorImigrasi', e.target.value)}
                      className="doc-inline-input text-[10.5pt]"
                    />
                  ) : (
                    <span
                      onClick={() => activateInlineEdit('doc4-alamatKantorImigrasi')}
                      className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                    >
                      {toTitleCase(data.alamatKantorImigrasi || 'Kelurahan Pasirkaliki, Kecamatan Cimahi Utara, Kota Cimahi, Jawa Barat 40514')}
                    </span>
                  )}
                </p>
              </div>

              {/* Pembuka Permohonan Perpanjangan Paspor */}
              <div className="space-y-1.5 text-justify text-justify-formal text-[11pt] leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                <p style={{ lineHeight: '1.5' }}>Assalamu’alaikum warahmatullahi wabarakatuh</p>
                <p style={{ lineHeight: '1.5' }}>
                  Sehubungan dengan akan adanya keberangkatan jamaah umrah {data.namaPerusahaan || 'PT. Alzam Mandiri Wisata'} dengan izin Penyelenggara Perjalanan Ibadah Umrah yang diterbitkan ${data.tanggalIzinPpiu || '02 Agustus 2022'} oleh Pemerintah Republik Indonesia, maka dengan ini kami mengajukan permohonan guna pembuatan paspor atas nama :
                </p>

                {/* Tabel Data Perpanjangan Paspor */}
                <table className="w-full my-1.5 text-[11pt] ml-1 sm:ml-4 leading-spasi-1-5" style={{ lineHeight: '1.5' }}>
                  <tbody>
                    <tr>
                      <td className="w-36 sm:w-44 align-top py-0.5">Nama</td>
                      <td className="w-3 sm:w-4 align-top py-0.5">:</td>
                      <td className="py-0.5 font-bold">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc4-namaLengkap"
                            data-field="namaLengkap"
                            value={data.namaLengkap ?? ''}
                            onChange={(e) => updateField('namaLengkap', e.target.value)}
                            className="doc-inline-input font-bold"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc4-namaLengkap')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                          >
                            {toTitleCase(data.namaLengkap || 'Safudin Dasman')}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="align-top py-0.5">Tempat/Tanggal Lahir</td>
                      <td className="align-top py-0.5">:</td>
                      <td className="py-0.5">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc4-tempatTanggalLahir"
                            data-field="tempatTanggalLahir"
                            value={data.tempatTanggalLahir ?? ''}
                            onChange={(e) => updateField('tempatTanggalLahir', e.target.value)}
                            className="doc-inline-input"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc4-tempatTanggalLahir')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                          >
                            {toTitleCase(data.tempatTanggalLahir || 'Cimahi, 10 November 1973')}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="align-top py-0.5">Nomor Paspor Lama</td>
                      <td className="align-top py-0.5">:</td>
                      <td className="py-0.5 font-mono">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc4-nomorPasporLama"
                            data-field="nomorPasporLama"
                            value={data.nomorPasporLama || 'C8527774'}
                            onChange={(e) => updateField('nomorPasporLama', e.target.value)}
                            className="doc-inline-input font-mono"
                            placeholder="Contoh: C8527774"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc4-nomorPasporLama')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1 font-mono"
                          >
                            {data.nomorPasporLama || 'C8527774'}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="align-top py-0.5">Date Of Expiry</td>
                      <td className="align-top py-0.5">:</td>
                      <td className="py-0.5">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc4-dateOfExpiry"
                            data-field="dateOfExpiry"
                            value={data.dateOfExpiry || data.expiredDatePaspor || '11/3/2027'}
                            onChange={(e) => {
                              updateField('dateOfExpiry', e.target.value);
                              updateField('expiredDatePaspor', e.target.value);
                            }}
                            className="doc-inline-input"
                            placeholder="Contoh: 11/3/2027"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc4-dateOfExpiry')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                          >
                            {data.dateOfExpiry || data.expiredDatePaspor || '11/3/2027'}
                          </span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 4 Poin Jaminan */}
                <div className="space-y-1 ml-1 mt-1.5">
                  <div className="flex items-start gap-2 text-justify text-justify-formal">
                    <span className="w-4 shrink-0 font-normal">1.</span>
                    <p className="flex-1 leading-spasi-1-15" style={{ lineHeight: '1.20' }}>
                      Pemohon paspor yang kami urus adalah WNI (Warga Negara Indonesia) yang sebenarnya akan melakukan perjalanan ke Arab Saudi dalam rangka menunaikan ibadah umrah.
                    </p>
                  </div>

                  <div className="flex items-start gap-2 text-justify text-justify-formal">
                    <span className="w-4 shrink-0 font-normal">2.</span>
                    <p className="flex-1 leading-spasi-1-15" style={{ lineHeight: '1.20' }}>
                      Rombongan calon jamaah umrah yang kami urus tidak akan melakukan pelanggaran peraturan keimigrasian berupa penyalahgunaan izin tinggal, tidak melebihi izin tinggalnya (Overstay) memalsukan atau membuat palsu paspor yang diberikan kepadanya maupun bekerja secara ilegal.
                    </p>
                  </div>

                  <div className="flex items-start gap-2 text-justify text-justify-formal">
                    <span className="w-4 shrink-0 font-normal">3.</span>
                    <p className="flex-1 leading-spasi-1-15" style={{ lineHeight: '1.20' }}>
                      Apabila terjadi pelanggaran sebagaimana dimaksud, maka izin usaha kami sebagai penyelenggara perjalanan ibadah umrah bersedia dicabut.
                    </p>
                  </div>

                  <div className="flex items-start gap-2 text-justify text-justify-formal">
                    <span className="w-4 shrink-0 font-normal">4.</span>
                    <p className="flex-1 leading-spasi-1-15" style={{ lineHeight: '1.20' }}>
                      Jadwal keberangkatan dan kepulangan ke Indonesia dari Tanggal
                      <span className="font-bold text-slate-950 block mt-0.5">
                        {isEditing ? (
                          <input
                            type="text"
                            id="doc4-jadwalKeberangkatan"
                            data-field="jadwalKeberangkatan"
                            value={data.jadwalKeberangkatanDanKepulangan || data.estimasiKeberangkatan || '5 - 14 November 2026'}
                            onChange={(e) => {
                              updateMultipleFields({
                                jadwalKeberangkatanDanKepulangan: e.target.value,
                                estimasiKeberangkatan: e.target.value,
                              });
                            }}
                            className="doc-inline-input font-bold"
                          />
                        ) : (
                          <span
                            onClick={() => activateInlineEdit('doc4-jadwalKeberangkatan')}
                            className="cursor-pointer hover:bg-emerald-50 rounded px-1 -mx-1"
                          >
                            {data.jadwalKeberangkatanDanKepulangan || data.estimasiKeberangkatan || '5 - 14 November 2026'}
                          </span>
                        )}
                      </span>
                    </p>
                  </div>
                </div>

                <p className="mt-2" style={{ lineHeight: '1.5' }}>
                  Demikian permohonan ini kami buat, atas bantuan dan perhatian Bapak/Ibu kami ucapkan terima kasih. Wassalamu'alaikum warahmatullahi wabarakatuh
                </p>
              </div>

              {renderSignatureAlzam('doc4')}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Mobile Floating Navigation & Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1B3024]/95 backdrop-blur-md border-t border-[#3D604C] p-2.5 px-3 shadow-2xl z-30 flex items-center justify-between gap-2 sm:hidden">
        <button
          type="button"
          onClick={() => {
            const next = !isInlineEditMode;
            setIsInlineEditMode(next);
            if (next) showNotification('Mode edit di surat aktif!');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 ${
            isInlineEditMode
              ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
              : 'bg-[#244030] text-[#FAF7F2] border-[#3D604C]'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5 text-[#E68F65]" />
          <span>{isInlineEditMode ? 'Tutup Edit' : 'Edit di Surat'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowQuickEditModal(true)}
          className="flex-1 py-2.5 bg-[#3D604C] text-white rounded-xl text-xs font-bold border border-[#557A64] flex items-center justify-center gap-1 shadow-sm"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#E68F65]" />
          <span>Ubah Cepat</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="flex-1 py-2.5 bg-[#D96B38] active:bg-[#C25B2A] text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1"
        >
          {isGeneratingPdf ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>Unduh PDF</span>
        </button>
      </div>
    </div>
  );
};
