import React from 'react';
import {
  Compass,
  FileText,
  CheckCircle2,
  History,
  ShieldCheck,
  Sparkles,
  LogOut,
  LogIn,
  Database,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activeTab: 'upload' | 'verify' | 'preview' | 'archive';
  setActiveTab: (tab: 'upload' | 'verify' | 'preview' | 'archive') => void;
  hasData: boolean;
  archiveCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  hasData,
  archiveCount,
}) => {
  const { user, signIn, signOut } = useAuth();

  return (
    <header className="bg-[#2C6B4F] text-[#F7FAF8] border-b border-[#235840] print:hidden sticky top-0 z-30 shadow-md">
      {/* Top Consular Bar */}
      <div className="bg-[#21543D] px-4 py-1.5 border-b border-[#1C4633] text-xs flex flex-wrap items-center justify-between text-[#DCEEE3] font-medium">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[#EBF5EE] font-bold">
            <ShieldCheck className="w-4 h-4 text-[#A3DCBE]" />
            SISTEM ADMINISTRASI LEGAL &amp; KONSULER PASPOR UMRAH
          </span>
          <span className="hidden sm:inline text-[#3E8060]">|</span>
          <span className="hidden sm:inline text-[#DCEEE3]">PT. Alzam Mandiri Wisata</span>
        </div>
        
        {/* Cloud Sync Status */}
        <div className="flex items-center gap-4 text-[#C2E4D2] text-[11px]">
          <span className="flex items-center gap-1.5 text-[#E8F4EC]">
            <Database className="w-3.5 h-3.5 text-[#A3DCBE]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#A3DCBE] animate-pulse" />
            Firebase Firestore Connected
          </span>
          <span className="hidden md:inline font-mono text-[#DCEEE3]">Izin PPIU: 29042200007580004</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => setActiveTab('upload')}>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#3D7D5E] to-[#1C4633] p-0.5 shadow-lg flex items-center justify-center ring-2 ring-white/20">
            <div className="w-full h-full rounded-[14px] bg-[#21543D] flex items-center justify-center">
              <Compass className="w-6 h-6 text-[#A3DCBE] animate-[spin_12s_linear_infinite]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-wider text-[#F7FAF8]">
                SISTEM REKOMENDASI &amp; PERNYATAAN PASPOR
              </span>
              <span className="bg-[#21543D] text-[#E8F4EC] border border-[#3E8060] text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                Kak Amel
              </span>
            </div>
            <p className="text-xs text-[#DCEEE3]">
              Surat Pernyataan, Jaminan &amp; Permohonan Paspor Resmi Standar Imigrasi
            </p>
          </div>
        </div>

        {/* Tab Navigation and Auth Actions */}
        <div className="flex items-center gap-3 flex-wrap w-full md:w-auto justify-between md:justify-end">
          <nav className="flex items-center bg-[#1C4633] p-1 rounded-2xl border border-[#2B6349] shadow-inner overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'upload'
                  ? 'bg-[#3D7D5E] text-white shadow-md ring-1 ring-white/30'
                  : 'text-[#DCEEE3] hover:text-white hover:bg-[#265A42]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              1. Scan KTP &amp; Excel
            </button>

            <button
              onClick={() => setActiveTab('verify')}
              className={`flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'verify'
                  ? 'bg-[#3D7D5E] text-white shadow-md ring-1 ring-white/30'
                  : 'text-[#DCEEE3] hover:text-white hover:bg-[#265A42]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              2. Edit &amp; Verifikasi
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'preview'
                  ? 'bg-[#3D7D5E] text-white shadow-md ring-1 ring-white/30'
                  : 'text-[#DCEEE3] hover:text-white hover:bg-[#265A42]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              3. Surat Resmi
            </button>

            <button
              onClick={() => setActiveTab('archive')}
              className={`flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'archive'
                  ? 'bg-[#3D7D5E] text-white shadow-md ring-1 ring-white/30'
                  : 'text-[#DCEEE3] hover:text-white hover:bg-[#265A42]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Arsip
              {archiveCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-[#21543D] border border-[#68AF8D] text-[#F7FAF8] text-[10px] rounded-full">
                  {archiveCount}
                </span>
              )}
            </button>
          </nav>

          {/* User Auth Section */}
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center gap-2 bg-[#1C4633] border border-[#2B6349] rounded-2xl px-2.5 py-1">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-6 h-6 rounded-full border border-[#68AF8D]"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#3D7D5E] text-white text-xs flex items-center justify-center font-bold">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="text-left hidden sm:block max-w-[120px]">
                  <div className="text-xs font-bold truncate text-[#F7FAF8] leading-tight">
                    {user.displayName || 'Staff Travel'}
                  </div>
                  <div className="text-[10px] text-[#A3DCBE] truncate leading-tight">
                    Terhubung
                  </div>
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  title="Keluar"
                  className="p-1 hover:bg-[#265A42] rounded-lg text-[#C2E4D2] hover:text-red-300 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={signIn}
                className="flex items-center gap-1.5 bg-white hover:bg-[#E8F4EC] text-[#2C6B4F] px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk Google</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
