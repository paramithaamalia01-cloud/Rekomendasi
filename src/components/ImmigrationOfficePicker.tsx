import React, { useState, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Search,
  Check,
  ChevronDown,
  Edit3,
  ListFilter,
  Sparkles,
  X,
  Globe2,
} from 'lucide-react';
import {
  INDONESIA_IMMIGRATION_OFFICES,
  ImmigrationOffice,
  getImmigrationOfficesByProvince,
} from '../utils/indonesiaImmigrationOffices';

interface ImmigrationOfficePickerProps {
  tujuanKantorImigrasi: string;
  alamatKantorImigrasi: string;
  onChange: (tujuan: string, alamat: string) => void;
  label?: string;
  className?: string;
}

export const ImmigrationOfficePicker: React.FC<ImmigrationOfficePickerProps> = ({
  tujuanKantorImigrasi,
  alamatKantorImigrasi,
  onChange,
  label = '7. Kantor Imigrasi & Alamat Lengkap',
  className = '',
}) => {
  const [mode, setMode] = useState<'list' | 'manual'>('list');
  const [isOpenDropdown, setIsOpenDropdown] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState<string>('all');

  const groupedByProvince = useMemo(() => getImmigrationOfficesByProvince(), []);
  const allProvinces = useMemo(() => Object.keys(groupedByProvince).sort(), [groupedByProvince]);

  // Filtered offices list
  const filteredOffices = useMemo(() => {
    return INDONESIA_IMMIGRATION_OFFICES.filter((office) => {
      const matchSearch =
        !searchQuery ||
        office.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        office.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        office.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        office.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
        office.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchProvince =
        selectedProvinceFilter === 'all' || office.province === selectedProvinceFilter;

      return matchSearch && matchProvince;
    });
  }, [searchQuery, selectedProvinceFilter]);

  // Popular offices for quick chips
  const popularOffices = useMemo(() => {
    return INDONESIA_IMMIGRATION_OFFICES.filter((o) => o.popular);
  }, []);

  const handleSelectOffice = (office: ImmigrationOffice) => {
    onChange(office.name, office.address);
    setIsOpenDropdown(false);
    setSearchQuery('');
  };

  const isMatchedOffice = INDONESIA_IMMIGRATION_OFFICES.find(
    (o) => o.name === tujuanKantorImigrasi || (tujuanKantorImigrasi && o.name.toLowerCase().includes(tujuanKantorImigrasi.toLowerCase()))
  );

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Header Label and Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>{label}</span>
        </label>

        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setMode('list')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              mode === 'list'
                ? 'bg-[#2C6B4F] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-3 h-3" />
            <span>Pilih dari Daftar Kanim RI</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              mode === 'manual'
                ? 'bg-[#2C6B4F] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>Isi Mandiri</span>
          </button>
        </div>
      </div>

      {/* MODE 1: SELECT FROM INDONESIA DATABASE */}
      {mode === 'list' && (
        <div className="space-y-2">
          {/* Main Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpenDropdown(!isOpenDropdown)}
              className="w-full text-left p-3.5 bg-white border border-slate-300 hover:border-[#2C6B4F] rounded-2xl flex items-center justify-between transition-all shadow-xs focus:ring-2 focus:ring-[#2C6B4F]/20 cursor-pointer min-h-[52px]"
            >
              <div className="flex items-start gap-2.5 overflow-hidden pr-2">
                <Building2 className="w-4 h-4 text-[#2C6B4F] shrink-0 mt-0.5" />
                <div className="truncate">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {tujuanKantorImigrasi || 'Pilih Kantor Imigrasi di Seluruh Indonesia...'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{alamatKantorImigrasi || 'Alamat kantor imigrasi akan terisi otomatis'}</span>
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                  isOpenDropdown ? 'rotate-180 text-[#2C6B4F]' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu Overlay */}
            {isOpenDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsOpenDropdown(false)}
                />
                <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 space-y-2.5 animate-in fade-in slide-in-from-top-2 max-h-[380px] flex flex-col">
                  {/* Search Bar inside Dropdown */}
                  <div className="relative shrink-0">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama kota, provinsi, atau kelas kanim (contoh: Cilegon, Jakarta, Banten)..."
                      className="w-full text-xs pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2C6B4F] focus:outline-hidden"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Province Filter Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-thin">
                    <button
                      type="button"
                      onClick={() => setSelectedProvinceFilter('all')}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedProvinceFilter === 'all'
                          ? 'bg-[#2C6B4F] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua Provinsi ({INDONESIA_IMMIGRATION_OFFICES.length})
                    </button>
                    {allProvinces.map((prov) => (
                      <button
                        key={prov}
                        type="button"
                        onClick={() => setSelectedProvinceFilter(prov)}
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                          selectedProvinceFilter === prov
                            ? 'bg-[#2C6B4F] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {prov}
                      </button>
                    ))}
                  </div>

                  {/* Offices List */}
                  <div className="overflow-y-auto space-y-1.5 pr-1 flex-1">
                    {filteredOffices.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        Tidak ditemukan kantor imigrasi yang cocok dengan &quot;{searchQuery}&quot;.
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setMode('manual');
                              setIsOpenDropdown(false);
                            }}
                            className="text-[#2C6B4F] font-bold underline cursor-pointer"
                          >
                            Klik di sini untuk Isi Mandiri
                          </button>
                        </div>
                      </div>
                    ) : (
                      filteredOffices.map((office) => {
                        const isSelected = tujuanKantorImigrasi === office.name;
                        return (
                          <button
                            key={office.id}
                            type="button"
                            onClick={() => handleSelectOffice(office)}
                            className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-[#E8F4EC] border-[#C2E4D2] text-[#182C23] font-bold'
                                : 'bg-white hover:bg-[#F7FAF8] border-slate-100 text-slate-800'
                            }`}
                          >
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold truncate">
                                  {office.name}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-md font-semibold shrink-0">
                                  {office.province}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{office.address}</span>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-[#2C6B4F] shrink-0 mt-0.5" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Popular Kanim Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mr-0.5">
              <Sparkles className="w-3 h-3 text-[#2C6B4F]" />
              Kanim Populer:
            </span>
            {popularOffices.slice(0, 7).map((office) => {
              const isSelected = tujuanKantorImigrasi === office.name;
              return (
                <button
                  key={office.id}
                  type="button"
                  onClick={() => handleSelectOffice(office)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#2C6B4F] text-white border-[#2C6B4F] font-bold shadow-xs'
                      : 'bg-white hover:bg-[#E8F4EC] text-[#2C6B4F] border-[#C2E4D2] hover:border-[#2C6B4F]'
                  }`}
                >
                  {office.city} ({office.shortName.replace('Kepala Kantor Imigrasi', 'Kanim')})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 2: MANUAL INPUT */}
      {mode === 'manual' && (
        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Edit3 className="w-3 h-3 text-[#2C6B4F]" />
              Mode Pengisian Mandiri (Ketik Bebas):
            </span>
            <button
              type="button"
              onClick={() => setMode('list')}
              className="text-[11px] text-[#2C6B4F] hover:underline font-bold cursor-pointer"
            >
              ← Kembali ke Daftar Kanim RI
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                Tujuan Kantor Imigrasi (Nama Pejabat / Kanim)
              </label>
              <div className="relative flex items-center">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={tujuanKantorImigrasi}
                  onChange={(e) => onChange(e.target.value, alamatKantorImigrasi)}
                  placeholder="Contoh: Kepala Kantor Imigrasi Kelas II Cilegon"
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#2C6B4F] focus:outline-hidden font-medium text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                Alamat Lengkap Kantor Imigrasi
              </label>
              <div className="relative flex items-center">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={alamatKantorImigrasi}
                  onChange={(e) => onChange(tujuanKantorImigrasi, e.target.value)}
                  placeholder="Contoh: Jl. KH. Yasin Beji No.8, Kotabumi, Kec. Purwakarta, Kota Cilegon, Banten 42434"
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#2C6B4F] focus:outline-hidden text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Immigration Office Summary Badge */}
      {tujuanKantorImigrasi && (
        <div className="bg-[#E8F4EC] border border-[#C2E4D2] rounded-xl p-2.5 flex items-start gap-2 text-xs text-[#182C23]">
          <Globe2 className="w-4 h-4 text-[#2C6B4F] shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="font-bold block truncate">
              {tujuanKantorImigrasi}
            </span>
            <span className="text-[11px] text-[#2C6B4F] line-clamp-1">
              {alamatKantorImigrasi || 'Belum ada detail alamat'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
