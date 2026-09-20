import React from 'react';
import { ViewType, UserRole } from '../types';
import { GraduationCap, LogOut, LayoutDashboard, Search, CreditCard, BarChart2, DollarSign, FileSpreadsheet, Settings, Mail, FileText } from 'lucide-react';

interface NavbarProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  userRole: UserRole;
  userName: string;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  userRole,
  userName,
  onLogout,
}) => {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs print:hidden">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo and Title */}
        <div className="flex items-center gap-2">
          <img src="/logo-alumni.png" alt="Logo Persatuan Alumni" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-blue-900 leading-none">PERSATUAN ALUMNI</h1>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Kolej Komuniti Beaufort, Sabah</p>
          </div>
          <div className="hidden sm:block h-6 w-px bg-slate-200 mx-2"></div>
          <span className="hidden sm:inline-block bg-blue-50 text-blue-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
            {userRole === 'admin' ? 'PENTADBIR (ADMIN)' : 'PORTAL AHLI'}
          </span>
        </div>

        {/* User Greeting and Logout */}
        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-xs font-semibold text-slate-600">
            Hai, {userName.split(' ')[0]}
          </span>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-rose-100"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Keluar</span>
          </button>
        </div>
      </div>

      {/* Main Tabbed Navigation bar */}
      <div className="border-t border-slate-100 bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`py-3 px-4 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              currentView === 'dashboard'
                ? 'border-blue-700 text-blue-700 bg-white shadow-2xs font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Utama</span>
          </button>

          <button
            onClick={() => setCurrentView('membership')}
            className={`py-3 px-4 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              currentView === 'membership'
                ? 'border-blue-700 text-blue-700 bg-white shadow-2xs font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Keahlian</span>
          </button>

          <button
            onClick={() => setCurrentView('statistics')}
            className={`py-3 px-4 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              currentView === 'statistics'
                ? 'border-blue-700 text-blue-700 bg-white shadow-2xs font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Statistik</span>
          </button>

          {/* Admin specific tabs */}
          {userRole === 'admin' && (
            <>
              <button
                onClick={() => setCurrentView('finance')}
                className={`py-3 px-4 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  currentView === 'finance'
                    ? 'border-blue-700 text-blue-700 bg-white shadow-2xs font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Kewangan</span>
              </button>

              <button
                onClick={() => setCurrentView('reports')}
                className={`py-3 px-4 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  currentView === 'reports'
                    ? 'border-blue-700 text-blue-700 bg-white shadow-2xs font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Laporan</span>
              </button>

              <button
                onClick={() => setCurrentView('programs')}
                className={`py-3 px-4 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  currentView === 'programs'
                    ? 'border-blue-700 text-blue-700 bg-white shadow-2xs font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Program</span>
              </button>
            </>
          )}

          <button
            onClick={() => setCurrentView('settings')}
            className={`py-3 px-4 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              currentView === 'settings'
                ? 'border-blue-700 text-blue-700 bg-white shadow-2xs font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {userRole === 'admin' ? <Settings className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
            <span>{userRole === 'admin' ? 'Tetapan' : 'Hubungi Kami'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
