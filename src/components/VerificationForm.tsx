import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  ArrowRight,
  ShieldCheck,
  User,
  CreditCard,
  Users,
  Compass,
  RefreshCw,
  Eye,
  Info,
  Sparkles,
  X,
  Building,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Edit3,
  Layers,
  FileText,
} from 'lucide-react';
import { ApplicantData, UploadedFiles, LetterTemplateType } from '../types';
import {
  validateNik,
  validateNoKk,
  toTitleCase,
  formatApplicantData,
  computeAutoNamaMenjadi,
  getTodayIndonesianDate,
  parsePlaceAndBirthDate,
  cleanApplicantName,
  extractBirthInfoFromNik,
} from '../utils/letterFormatter';
import { ImmigrationOfficePicker } from './ImmigrationOfficePicker';
import {
  generateNextSequentialNumbers,
  extractSequenceNumber,
  updateSequenceNumber,
} from '../utils/letterNumbering';

interface VerificationFormProps {
  data: ApplicantData;
  setData: React.Dispatch<React.SetStateAction<ApplicantData>>;
  files: UploadedFiles;
  onProceedToLetter: () => void;
  onBackToUpload: () => void;
  onRefreshNumberAndDate?: () => void;
}

export const VerificationForm: React.FC<VerificationFormProps> = ({
  data,
  setData,
  files,
  onProceedToLetter,
  onBackToUpload,
  onRefreshNumberAndDate,
}) => {
  const [activePreview, setActivePreview] = useState<'ktp' | 'kk'>('ktp');
  const [showAdvancedCompany, setShowAdvancedCompany] = useState<boolean>(false);

  const nikValidation = validateNik(data.nik || '');
  const kkValidation = validateNoKk(data.nomorKk || '');

  // Auto-format all fields to clean Title Case on initial mount
  useEffect(() => {
    setData((prev) => formatApplicantData(prev));
  }, []);

  const handleFieldChange = (field: keyof ApplicantData, value: string) => {
    if (field === 'nomorSurat' || field === 'nomorSuratPernyataan') {
      const extracted = extractSequenceNumber(value);
      if (extracted) {
        updateSequenceNumber(extracted);
      }
    }
    setData((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === 'tempatTanggalLahir') {
        const parsed = parsePlaceAndBirthDate('', '', value, prev.nik);
        updated.tempatLahir = parsed.tempatLahir;
        updated.tanggalLahir = parsed.tanggalLahir;
        updated.tempatTanggalLahir = value;
      } else if (field === 'tempatLahir' || field === 'tanggalLahir') {
        const tLahir = field === 'tempatLahir' ? value : (prev.tempatLahir || '');
        const tgLahir = field === 'tanggalLahir' ? value : (prev.tanggalLahir || '');
        const parsed = parsePlaceAndBirthDate(tLahir, tgLahir, undefined, prev.nik);
        updated.tempatLahir = parsed.tempatLahir;
        updated.tanggalLahir = parsed.tanggalLahir;
        updated.tempatTanggalLahir = parsed.tempatTanggalLahir;
      }

      if (field === 'nik') {
        const cleanNik = value.replace(/\D/g, '');
        if (cleanNik.length === 16) {
          const info = extractBirthInfoFromNik(cleanNik);
          if (info) {
            if (!prev.tanggalLahir || prev.tanggalLahir.length < 5) {
              updated.tanggalLahir = info.tanggalLahir;
              updated.tempatTanggalLahir = prev.tempatLahir ? `${prev.tempatLahir}, ${info.tanggalLahir}` : info.tanggalLahir;
            }
            if (!prev.jenisKelamin) {
              updated.jenisKelamin = info.jenisKelamin;
            }
          }
        }
      }

      if (field === 'namaLengkap' || field === 'namaAyah') {
        const nLengkap = field === 'namaLengkap' ? cleanApplicantName(value) : (prev.namaLengkap || '');
        const nAyah = field === 'namaAyah' ? value : (prev.namaAyah || '');
        // Keep namaLengkap true to KTP, compute namaMenjadi separately
        updated.namaMenjadi = computeAutoNamaMenjadi(nLengkap, nAyah, prev.namaMenjadi);
      }

      return updated;
    });
  };

  const handleFormatAllToTitleCase = () => {
    setData((prev) => formatApplicantData(prev));
  };

  const handleTemplateSwitch = (newTemplate: LetterTemplateType) => {
    const todayStr = getTodayIndonesianDate();
    const { nomorSurat: n1, nomorSuratPernyataan: n2 } = generateNextSequentialNumbers();

    let newPerihal = 'Permohonan Pembuatan Paspor';
    if (newTemplate === 'pernyataan_jaminan') {
      newPerihal = 'Surat Pernyataan dan Jaminan';
    } else if (newTemplate === 'perpanjangan_paspor') {
      newPerihal = 'Permohonan Perpanjangan Paspor';
    } else if (newTemplate === 'penambahan_nama') {
      newPerihal = 'Permohonan Penambahan Nama Paspor';
    }

    setData((prev) => ({
      ...prev,
      templateType: newTemplate,
      tanggalSurat: todayStr,
      nomorSurat: n1,
      nomorSuratPernyataan: n2,
      perihal: newPerihal,
    }));
  };

  const handleGenerateNextSequentialNumber = () => {
    const todayStr = getTodayIndonesianDate();
    const { nomorSurat: n1, nomorSuratPernyataan: n2 } = generateNextSequentialNumbers();
    setData((prev) => ({
      ...prev,
      nomorSurat: n1,
      nomorSuratPernyataan: n2,
      tanggalSurat: todayStr,
    }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full w-fit mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Langkah 2: Verifikasi &amp; Edit Data Identitas
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            Formulir Data Pemohon Surat Resmi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Anda dapat menambah, menghapus, atau mengubah ketikan data langsung di bawah ini.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={onBackToUpload}
            className="flex-1 md:flex-none px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-all text-center"
          >
            Pindai Ulang
          </button>
          <button
            type="button"
            onClick={onProceedToLetter}
            className="flex-1 md:flex-none px-6 py-2.5 bg-[#2C6B4F] hover:bg-[#235840] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#2C6B4F]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Buka Pratinjau Surat</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Template Selection Tabs */}
      <div className="bg-[#21543D] text-[#F7FAF8] rounded-3xl p-4 sm:p-5 border border-[#3E8060] shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#F7FAF8] flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#A3DCBE]" />
            <span>Format Surat Resmi yang Digunakan:</span>
          </label>
          <span className="text-[11px] text-[#C2E4D2] hidden sm:inline font-mono">
            {data.templateType === 'penambahan_nama' ? 'Surat Permohonan Penambahan Nama' : data.templateType === 'perpanjangan_paspor' ? 'Surat Permohonan Perpanjangan Paspor' : data.templateType === 'pernyataan_jaminan' ? 'Surat Pernyataan & Jaminan' : data.templateType === 'permohonan_paspor' ? 'Surat Permohonan Paspor Baru' : 'Paket 2 Surat Sekaligus'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => handleFieldChange('templateType', 'permohonan_paspor')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              data.templateType === 'permohonan_paspor'
                ? 'bg-white text-[#2C6B4F] border-white shadow-md ring-2 ring-white/40 font-bold'
                : 'bg-[#1C4633] text-[#DCEEE3] border-[#2B6349] hover:bg-[#265A42] hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span>Surat 1</span>
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-bold leading-tight">Permohonan Paspor</div>
          </button>

          <button
            type="button"
            onClick={() => handleFieldChange('templateType', 'pernyataan_jaminan')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              data.templateType === 'pernyataan_jaminan'
                ? 'bg-white text-[#2C6B4F] border-white shadow-md ring-2 ring-white/40 font-bold'
                : 'bg-[#1C4633] text-[#DCEEE3] border-[#2B6349] hover:bg-[#265A42] hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span>Surat 2</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-bold leading-tight">Pernyataan &amp; Jaminan</div>
          </button>

          <button
            type="button"
            onClick={() => handleFieldChange('templateType', 'penambahan_nama')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              data.templateType === 'penambahan_nama'
                ? 'bg-white text-[#2C6B4F] border-white shadow-md ring-2 ring-white/40 font-bold'
                : 'bg-[#1C4633] text-[#DCEEE3] border-[#2B6349] hover:bg-[#265A42] hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span>Surat 3</span>
              <Edit3 className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-bold leading-tight">Tambahan Nama</div>
          </button>

          <button
            type="button"
            onClick={() => handleFieldChange('templateType', 'perpanjangan_paspor')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              data.templateType === 'perpanjangan_paspor'
                ? 'bg-white text-[#2C6B4F] border-white shadow-md ring-2 ring-white/40 font-bold'
                : 'bg-[#1C4633] text-[#DCEEE3] border-[#2B6349] hover:bg-[#265A42] hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span>Surat 4</span>
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-bold leading-tight">Perpanjangan Paspor</div>
          </button>

          <button
            type="button"
            onClick={() => handleFieldChange('templateType', 'paket_lengkap_alzam')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between col-span-2 sm:col-span-1 ${
              data.templateType === 'paket_lengkap_alzam' || !data.templateType
                ? 'bg-[#489370] text-white border-white shadow-md ring-2 ring-white/40 font-bold'
                : 'bg-[#1C4633] text-[#DCEEE3] border-[#2B6349] hover:bg-[#265A42] hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-[#A3DCBE]">Paket Lengkap</span>
              <Layers className="w-3.5 h-3.5 text-[#A3DCBE]" />
            </div>
            <div className="text-xs font-bold leading-tight">Paket 2 Surat</div>
          </button>
        </div>
      </div>

      {/* Validation Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* NIK Card */}
        <div className={`p-4 rounded-xl border transition-colors ${nikValidation.isValid ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-amber-50/80 border-amber-300 text-amber-900'}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold">Validasi NIK KTP (16 Digit)</span>
            {nikValidation.isValid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            )}
          </div>
          <div className="font-mono text-base font-bold tracking-wider">
            {data.nik || '[Belum Terisi]'}
          </div>
          <p className="text-[11px] mt-1 opacity-80">{nikValidation.message}</p>
        </div>

        {/* KK Card */}
        <div className={`p-4 rounded-xl border transition-colors ${kkValidation.isValid ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-amber-50/80 border-amber-300 text-amber-900'}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold">Validasi Nomor KK (16 Digit)</span>
            {kkValidation.isValid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            )}
          </div>
          <div className="font-mono text-base font-bold tracking-wider">
            {data.nomorKk || '[Belum Terisi]'}
          </div>
          <p className="text-[11px] mt-1 opacity-80">{kkValidation.message}</p>
        </div>
      </div>

      {/* Main Split Layout: Left Form Fields, Right Original Document Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Fields Editor (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                Data Pemohon Utama (Untuk Dicantumkan di Surat)
              </h3>
              <span className="text-[11px] text-slate-400">Sentuh / ketik kolom di bawah untuk mengedit</span>
            </div>

            <button
              type="button"
              onClick={handleFormatAllToTitleCase}
              className="text-[11px] text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all w-fit cursor-pointer shadow-xs"
              title="Rapikan semua tulisan menjadi huruf kapital di awal kata (bukan CAPSLOCK)"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Rapikan Huruf Awal Kata</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Nama Lengkap & Nama Ayah Lengkap in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap (Sesuai Ejaan KTP) *
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={data.namaLengkap ?? ''}
                    onChange={(e) => handleFieldChange('namaLengkap', e.target.value)}
                    onBlur={(e) => handleFieldChange('namaLengkap', toTitleCase(e.target.value))}
                    autoCapitalize="words"
                    autoCorrect="off"
                    spellCheck="false"
                    className="w-full text-base sm:text-sm px-3.5 py-3 sm:py-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-semibold tracking-wide min-h-[48px] bg-white text-slate-900"
                    placeholder="Contoh: Euis Cholishoh"
                  />
                  {Boolean(data.namaLengkap) && (
                    <button
                      type="button"
                      onClick={() => handleFieldChange('namaLengkap', '')}
                      className="absolute right-2.5 p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors"
                      title="Hapus nama"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-800 mb-1">
                  Nama Ayah Lengkap * (Persyaratan Paspor 3 Suku Kata)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={data.namaAyah ?? ''}
                    onChange={(e) => handleFieldChange('namaAyah', e.target.value)}
                    onBlur={(e) => handleFieldChange('namaAyah', toTitleCase(e.target.value))}
                    autoCapitalize="words"
                    autoCorrect="off"
                    spellCheck="false"
                    className="w-full text-base sm:text-sm px-3.5 py-3 sm:py-2.5 pr-10 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold min-h-[48px] bg-emerald-50/30 text-slate-900"
                    placeholder="Contoh: H. Ahmad Subandi"
                  />
                  {Boolean(data.namaAyah) && (
                    <button
                      type="button"
                      onClick={() => handleFieldChange('namaAyah', '')}
                      className="absolute right-2.5 p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors"
                      title="Hapus nama ayah"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* NIK & KK in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Induk Kependudukan (NIK) *
                </label>
                <div className="relative flex items-center">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    value={data.nik ?? ''}
                    onChange={(e) => handleFieldChange('nik', e.target.value)}
                    className={`w-full text-base sm:text-sm pl-9 pr-10 py-3 sm:py-2.5 border rounded-xl font-mono font-bold tracking-wider focus:ring-2 focus:outline-hidden min-h-[48px] bg-white text-slate-900 ${
                      nikValidation.isValid ? 'border-slate-300 focus:ring-emerald-500' : 'border-amber-400 bg-amber-50/30 focus:ring-amber-500'
                    }`}
                    placeholder="3604xxxxxxxxxxxx"
                  />
                  {Boolean(data.nik) && (
                    <button
                      type="button"
                      onClick={() => handleFieldChange('nik', '')}
                      className="absolute right-2.5 p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors"
                      title="Hapus NIK"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400">
                  <span>Standar 16 digit</span>
                  <span>{(data.nik || '').replace(/[^0-9]/g, '').length} / 16 digit</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Kartu Keluarga (KK) *
                </label>
                <div className="relative flex items-center">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    value={data.nomorKk ?? ''}
                    onChange={(e) => handleFieldChange('nomorKk', e.target.value)}
                    className={`w-full text-base sm:text-sm pl-9 pr-10 py-3 sm:py-2.5 border rounded-xl font-mono font-bold tracking-wider focus:ring-2 focus:outline-hidden min-h-[48px] bg-white text-slate-900 ${
                      kkValidation.isValid ? 'border-slate-300 focus:ring-emerald-500' : 'border-amber-400 bg-amber-50/30 focus:ring-amber-500'
                    }`}
                    placeholder="3604xxxxxxxxxxxx"
                  />
                  {Boolean(data.nomorKk) && (
                    <button
                      type="button"
                      onClick={() => handleFieldChange('nomorKk', '')}
                      className="absolute right-2.5 p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors"
                      title="Hapus KK"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400">
                  <span>Standar 16 digit</span>
                  <span>{(data.nomorKk || '').replace(/[^0-9]/g, '').length} / 16 digit</span>
                </div>
              </div>
            </div>

            {/* Tempat / Tgl Lahir & Jenis Kelamin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tempat / Tgl Lahir (TTL) *
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={data.tempatTanggalLahir ?? ''}
                    onChange={(e) => handleFieldChange('tempatTanggalLahir', e.target.value)}
                    onBlur={(e) => handleFieldChange('tempatTanggalLahir', toTitleCase(e.target.value))}
                    autoCapitalize="words"
                    autoCorrect="off"
                    spellCheck="false"
                    className="w-full text-base sm:text-sm px-3.5 py-3 sm:py-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden min-h-[48px] bg-white text-slate-900"
                    placeholder="Contoh: Serang, 13 April 1995"
                  />
                  {Boolean(data.tempatTanggalLahir) && (
                    <button
                      type="button"
                      onClick={() => handleFieldChange('tempatTanggalLahir', '')}
                      className="absolute right-2.5 p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors"
                      title="Hapus tempat tanggal lahir"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jenis Kelamin *
                </label>
                <select
                  value={data.jenisKelamin || 'PEREMPUAN'}
                  onChange={(e) => handleFieldChange('jenisKelamin', e.target.value)}
                  className="w-full text-base sm:text-sm px-3.5 py-3 sm:py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white font-medium min-h-[48px] text-slate-900"
                >
                  <option value="LAKI-LAKI">LAKI-LAKI</option>
                  <option value="PEREMPUAN">PEREMPUAN</option>
                </select>
              </div>
            </div>

            {/* Alamat KTP Lengkap */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Alamat KTP Lengkap (RT/RW, Desa, Kec, Kab/Kota, Provinsi) *
                </label>
                {Boolean(data.alamatKtp) && (
                  <button
                    type="button"
                    onClick={() => handleFieldChange('alamatKtp', '')}
                    className="text-[11px] text-slate-400 hover:text-red-500 flex items-center gap-1 cursor-pointer py-0.5"
                  >
                    <X className="w-3.5 h-3.5" /> Hapus Alamat
                  </button>
                )}
              </div>
              <textarea
                rows={3}
                value={data.alamatKtp ?? ''}
                onChange={(e) => handleFieldChange('alamatKtp', e.target.value)}
                onBlur={(e) => handleFieldChange('alamatKtp', toTitleCase(e.target.value))}
                autoCapitalize="sentences"
                autoCorrect="off"
                spellCheck="false"
                className="w-full text-base sm:text-sm px-3.5 py-3 sm:py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden leading-relaxed bg-white text-slate-900"
                placeholder="Contoh: Kp. Kubang Laban Rt.005, Rw.003, Kelurahan Lambangsari, Kec. Bojonegara, Kabupaten Serang, Provinsi Banten"
              />
            </div>

            {/* No WhatsApp Jamaah */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                No WhatsApp yang Bisa Dihubungi (Ketika Surat Jadi)
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={data.nomorWhatsapp ?? ''}
                  onChange={(e) => handleFieldChange('nomorWhatsapp', e.target.value)}
                  className="w-full text-base sm:text-sm px-3.5 py-3 sm:py-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono font-bold min-h-[48px] bg-white text-slate-900"
                  placeholder="Contoh: 081234567890"
                />
                {Boolean(data.nomorWhatsapp) && (
                  <button
                    type="button"
                    onClick={() => handleFieldChange('nomorWhatsapp', '')}
                    className="absolute right-2.5 p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors"
                    title="Hapus no WhatsApp"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Penambahan Nama Paspor Section (Khusus Tambahan Nama) */}
            {data.templateType === 'penambahan_nama' && (
              <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-300 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Edit3 className="w-4 h-4 text-[#D96B38]" />
                  <span>Pengaturan Penambahan Nama Paspor (3 Suku Kata):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Asli Sesuai KTP
                    </label>
                    <input
                      type="text"
                      value={data.namaLengkap ?? ''}
                      onChange={(e) => handleFieldChange('namaLengkap', e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white font-semibold"
                      placeholder="Contoh: Suratman"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Menjadi (Ditambahkan Nama Ayah/Kakek) *
                    </label>
                    <input
                      type="text"
                      value={data.namaMenjadi || (data.namaLengkap && data.namaAyah ? `${data.namaLengkap} ${data.namaAyah}` : '')}
                      onChange={(e) => handleFieldChange('namaMenjadi', e.target.value)}
                      onBlur={(e) => handleFieldChange('namaMenjadi', toTitleCase(e.target.value))}
                      className="w-full text-sm px-3.5 py-2.5 border border-amber-400 bg-white rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                      placeholder="Contoh: Suratman Emu"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* No Paspor Lama & Expired Date Paspor */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-2xl border ${data.templateType === 'perpanjangan_paspor' ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>No. Paspor Lama {data.templateType === 'perpanjangan_paspor' || data.templateType === 'penambahan_nama' ? '*' : '(Pilihan)'}</span>
                  {data.templateType === 'penambahan_nama' && (
                    <span className="text-[10px] text-amber-700 font-normal">Wajib diisi</span>
                  )}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={data.nomorPasporLama ?? ''}
                    onChange={(e) => handleFieldChange('nomorPasporLama', e.target.value)}
                    className="w-full text-base sm:text-sm px-3.5 py-3 sm:py-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono min-h-[48px] bg-white text-slate-900 uppercase"
                    placeholder="Contoh: Y0195142 / C8527774"
                  />
                  {Boolean(data.nomorPasporLama) && (
                    <button
                      type="button"
                      onClick={() => handleFieldChange('nomorPasporLama', '')}
                      className="absolute right-2.5 p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors"
                      title="Hapus no paspor lama"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Date of Expiry / Habis Berlaku {data.templateType === 'perpanjangan_paspor' ? '*' : '(Pilihan)'}</span>
                  {data.templateType === 'perpanjangan_paspor' && (
                    <span className="text-[10px] text-amber-700 font-normal">Perpanjangan Paspor</span>
                  )}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={data.expiredDatePaspor || data.dateOfExpiry || ''}
                    onChange={(e) => {
                      handleFieldChange('expiredDatePaspor', e.target.value);
                      handleFieldChange('dateOfExpiry', e.target.value);
                    }}
                    className="w-full text-base sm:text-sm px-3.5 py-3 sm:py-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden min-h-[48px] bg-white text-slate-900"
                    placeholder="Contoh: 11/3/2027 atau 15 Mei 2027"
                  />
                  {Boolean(data.expiredDatePaspor || data.dateOfExpiry) && (
                    <button
                      type="button"
                      onClick={() => {
                        handleFieldChange('expiredDatePaspor', '');
                        handleFieldChange('dateOfExpiry', '');
                      }}
                      className="absolute right-2.5 p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors"
                      title="Hapus expired date"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Kantor Imigrasi Tujuan & Tanggal Keberangkatan */}
            <div className="pt-3 border-t border-slate-100 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jadwal Keberangkatan &amp; Kepulangan
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={data.jadwalKeberangkatanDanKepulangan || data.estimasiKeberangkatan || '16 - 24 November 2026'}
                    onChange={(e) => {
                      handleFieldChange('jadwalKeberangkatanDanKepulangan', e.target.value);
                      handleFieldChange('estimasiKeberangkatan', e.target.value);
                    }}
                    className="w-full text-base sm:text-sm px-3.5 py-3 sm:py-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium min-h-[48px] bg-white text-slate-900"
                    placeholder="16 - 24 November 2026"
                  />
                  {Boolean(data.jadwalKeberangkatanDanKepulangan || data.estimasiKeberangkatan) && (
                    <button
                      type="button"
                      onClick={() => {
                        handleFieldChange('jadwalKeberangkatanDanKepulangan', '');
                        handleFieldChange('estimasiKeberangkatan', '');
                      }}
                      className="absolute right-2.5 p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors"
                      title="Hapus jadwal"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Immigration Office Selector (All Indonesia + Manual) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <ImmigrationOfficePicker
                  label="Tujuan Kantor Imigrasi & Alamat Lengkap"
                  tujuanKantorImigrasi={data.tujuanKantorImigrasi || ''}
                  alamatKantorImigrasi={data.alamatKantorImigrasi || ''}
                  onChange={(tujuan, alamat) => {
                    handleFieldChange('tujuanKantorImigrasi', tujuan);
                    handleFieldChange('alamatKantorImigrasi', alamat);
                  }}
                />
              </div>
            </div>

            {/* Letter Number and Date */}
            <div className="pt-3 border-t border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Pembaruan Otomatis Nomor &amp; Tanggal Surat Resmi
                </span>
                <button
                  type="button"
                  onClick={handleGenerateNextSequentialNumber}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Update Otomatis Nomor &amp; Tanggal Hari Ini</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Surat Permohonan
                  </label>
                  <input
                    type="text"
                    value={data.nomorSurat ?? ''}
                    onChange={(e) => handleFieldChange('nomorSurat', e.target.value)}
                    className="w-full text-base sm:text-sm px-3.5 py-3 sm:py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono font-bold min-h-[48px] bg-white text-slate-900"
                    placeholder="Contoh: 7431/SR/AMW/X/2026"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Surat Pernyataan &amp; Jaminan (Alzam)
                  </label>
                  <input
                    type="text"
                    value={data.nomorSuratPernyataan ?? ''}
                    onChange={(e) => handleFieldChange('nomorSuratPernyataan', e.target.value)}
                    className="w-full text-base sm:text-sm px-3.5 py-3 sm:py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono font-bold min-h-[48px] bg-white text-slate-900"
                    placeholder="Contoh: 7432/SR/AMW/X/2026"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Tanggal Surat Diterbitkan</span>
                    <button
                      type="button"
                      onClick={() => handleFieldChange('tanggalSurat', getTodayIndonesianDate())}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                    >
                      Set Tanggal Hari Ini ({getTodayIndonesianDate()})
                    </button>
                  </label>
                  <input
                    type="text"
                    value={data.tanggalSurat ?? ''}
                    onChange={(e) => handleFieldChange('tanggalSurat', e.target.value)}
                    className="w-full text-base sm:text-sm px-3.5 py-3 sm:py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-semibold min-h-[48px] bg-white text-slate-900"
                    placeholder="Contoh: 8 Oktober 2026"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Accordion: Data Kop Surat & Pejabat Penandatangan PT Alzam */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAdvancedCompany(!showAdvancedCompany)}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-600" />
                  Kop Surat &amp; Data Legalitas PT. Alzam Mandiri Wisata
                </span>
                {showAdvancedCompany ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvancedCompany && (
                <div className="mt-3 p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Direktur Utama</label>
                      <input
                        type="text"
                        value={data.pejabatNama ?? 'Khairul Umam, ST, BA, MBA'}
                        onChange={(e) => handleFieldChange('pejabatNama', e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Jabatan Direktur</label>
                      <input
                        type="text"
                        value={data.pejabatJabatan ?? 'Direktur Utama'}
                        onChange={(e) => handleFieldChange('pejabatJabatan', e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Kota Penerbitan Surat</label>
                      <input
                        type="text"
                        value={data.kotaPenerbitan ?? 'Jakarta'}
                        onChange={(e) => handleFieldChange('kotaPenerbitan', e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nomor Surat Pernyataan</label>
                      <input
                        type="text"
                        value={data.nomorSuratPernyataan ?? '7380/SR/AMW/X/2026'}
                        onChange={(e) => handleFieldChange('nomorSuratPernyataan', e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Document Reference Viewer (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                Peninjau Dokumen Asli
              </span>
              <div className="flex bg-slate-800 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setActivePreview('ktp')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                    activePreview === 'ktp' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  KTP
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreview('kk')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                    activePreview === 'kk' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  KK
                </button>
              </div>
            </div>

            {/* Document Image Preview */}
            <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-[16/11] flex items-center justify-center p-2">
              {activePreview === 'ktp' && files.ktpBase64 ? (
                <img
                  src={files.ktpBase64}
                  alt="KTP Reference"
                  className="max-h-full max-w-full object-contain"
                />
              ) : activePreview === 'kk' && files.kkBase64 ? (
                <img
                  src={files.kkBase64}
                  alt="KK Reference"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-center text-slate-500 text-xs p-4">
                  Dokumen {activePreview.toUpperCase()} belum dimuat.
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Bandingkan langsung digit NIK dan ejaan nama dengan berkas asli.
            </p>
          </div>

          {/* Quick Notice Card */}
          <div className="bg-emerald-950/50 border border-emerald-800/40 rounded-2xl p-5 text-emerald-100 text-xs space-y-2">
            <h4 className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-400" />
              Ketentuan Surat Resmi Imigrasi
            </h4>
            <p className="text-emerald-200/80 leading-relaxed text-[11.5px]">
              Dokumen ini secara resmi diterbitkan oleh <strong>PT. Alzam Mandiri Wisata</strong> (Izin PPIU No. 29042200007580004) sebagai penyelenggara resmi ibadah umrah untuk permohonan dan penjaminan paspor jamaah.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Floating Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3.5 px-4 shadow-2xl z-30 flex items-center justify-between gap-3 sm:hidden">
        <button
          type="button"
          onClick={onBackToUpload}
          className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold"
        >
          Pindai Ulang
        </button>
        <button
          type="button"
          onClick={onProceedToLetter}
          className="flex-1 py-2.5 bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2"
        >
          <span>Buka Surat Resmi</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
