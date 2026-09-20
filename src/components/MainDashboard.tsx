import React from 'react';
import { AlumniMember, ViewType } from '../types';
import { Users, UserCheck, UserMinus, ShieldAlert, ArrowRight, CreditCard, BarChart2, DollarSign, Settings, Mail, Briefcase, ExternalLink, GraduationCap, Search } from 'lucide-react';

interface MainDashboardProps {
  members: AlumniMember[];
  userRole: 'admin' | 'member';
  currentMember: AlumniMember | null;
  setCurrentView: (view: ViewType) => void;
  onOpenQrScanner: () => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  members,
  userRole,
  currentMember,
  setCurrentView,
  onOpenQrScanner,
}) => {
  // Counters
  const totalCount = members.length;
  const activeCount = members.filter(m => m.status === 'Active').length;
  const inactiveCount = members.filter(m => m.status === 'Inactive').length;

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Selamat Pagi';
    if (hrs < 18) return 'Selamat Petang';
    return 'Selamat Malam';
  };

  return (
    <div className="space-y-6">
      {/* Welcoming Card */}
      <div className="bg-linear-to-br from-blue-700 to-blue-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4">
          <Users className="w-80 h-80" />
        </div>
        <div className="relative z-10 max-w-xl">
          <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            {userRole === 'admin' ? 'Akses Pentadbir' : 'Akses Portal Ahli'}
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {getGreeting()}, {userRole === 'admin' ? 'ADMIN' : (currentMember?.nama || 'Alumni')}!
          </h2>
          <p className="text-sm text-blue-100/90 mt-2 font-medium">
            {userRole === 'admin' 
              ? 'Selamat mengurus maklumat alumni KKBS. Gunakan menu pantas di bawah untuk mengurus maklumat ahli atau laporan.'
              : 'Terima kasih kerana menyertai Persatuan Alumni Kolej Komuniti Beaufort Sabah. Lihat kad digital anda dalam portal.'}
          </p>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Members */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="bg-blue-50 p-3.5 rounded-xl text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Jumlah Alumni</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{totalCount}</h3>
          </div>
        </div>

        {/* Active Members */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="bg-emerald-50 p-3.5 rounded-xl text-emerald-600">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Ahli Aktif</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{activeCount}</h3>
          </div>
        </div>

        {/* Inactive Members */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="bg-rose-50 p-3.5 rounded-xl text-rose-600">
            <UserMinus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tidak Aktif</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{inactiveCount}</h3>
          </div>
        </div>
      </div>

      {/* Quick Action / Peluang Kerjaya Grid */}
      <div>
        <h3 className="text-xs font-black text-cyan-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>{userRole === 'admin' ? 'Menu Tindakan Pantas' : 'Peluang Kerjaya'}</span>
        </h3>
        
        {userRole === 'admin' ? (
          /* Admin View (5 Actions) */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Card 1: Membership View */}
            <div 
              onClick={() => setCurrentView('membership')}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="bg-indigo-50 w-fit p-3 rounded-xl text-indigo-600 mb-4">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-800">Urus Keahlian</h4>
                <p className="text-xs text-slate-500 mt-1">Sahkan permohonan keahlian baharu.</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-extrabold mt-6 group-hover:gap-2.5 transition-all">
                <span>Buka Menu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 2: Statistics */}
            <div 
              onClick={() => setCurrentView('statistics')}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="bg-teal-50 w-fit p-3 rounded-xl text-teal-600 mb-4">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-800">Statistik Alumni</h4>
                <p className="text-xs text-slate-500 mt-1">Graf pecahan lulusan program dan geografi.</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-teal-600 font-extrabold mt-6 group-hover:gap-2.5 transition-all">
                <span>Buka Menu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 3: Finance Ledger */}
            <div 
              onClick={() => setCurrentView('finance')}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="bg-emerald-50 w-fit p-3 rounded-xl text-emerald-600 mb-4">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-800">Lejar Kewangan</h4>
                <p className="text-xs text-slate-500 mt-1">Pantau yuran pendaftaran, baki tunai & aliran belanja.</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-extrabold mt-6 group-hover:gap-2.5 transition-all">
                <span>Buka Menu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 4: QR Scanner Overlay Trigger */}
            <div 
              onClick={onOpenQrScanner}
              className="bg-blue-600 p-5 rounded-2xl hover:bg-blue-700 shadow-xs cursor-pointer transition-all flex flex-col justify-between group text-white"
            >
              <div>
                <div className="bg-white/20 w-fit p-3 rounded-xl text-white mb-4">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm">Scan QR Kad Ahli</h4>
                <p className="text-xs text-blue-100 mt-1">Gunakan kamera peranti untuk pengesahan status keahlian alumni.</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-extrabold mt-6 group-hover:gap-2.5 transition-all">
                <span>Aktifkan Kamera</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 5: Settings & Info */}
            <div 
              onClick={() => setCurrentView('settings')}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="bg-slate-100 w-fit p-3 rounded-xl text-slate-600 mb-4">
                  <Settings className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-800">Tetapan & Info</h4>
                <p className="text-xs text-slate-500 mt-1">Konfigurasi database, maklumat yuran & pautan media sosial.</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-extrabold mt-6 group-hover:gap-2.5 transition-all">
                <span>Ubah Tetapan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ) : (
          /* Member View (4 Career Portals) */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-200">
            {/* Card 1: MyFutureJobs */}
            <a 
              href="https://myfuturejobs.gov.my/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="bg-blue-50 w-fit p-3 rounded-xl text-blue-600 mb-4 group-hover:scale-110 transition-all">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">MyFutureJobs</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Portal Pekerjaan Negara di bawah PERKESO untuk mencari kerja.</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-blue-600 font-extrabold mt-6 group-hover:gap-2.5 transition-all">
                <span>Buka Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>

            {/* Card 2: MySPP */}
            <a 
              href="https://myspp.spp.gov.my/myspp/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="bg-teal-50 w-fit p-3 rounded-xl text-teal-600 mb-4 group-hover:scale-110 transition-all">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-800 group-hover:text-teal-600 transition-colors">MySPP</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Suruhanjaya Perkhidmatan Pendidikan (Sektor Guru & Pendidikan).</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-teal-600 font-extrabold mt-6 group-hover:gap-2.5 transition-all">
                <span>Buka Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>

            {/* Card 3: SPA9 */}
            <a 
              href="https://spa9.spa.gov.my/login"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="bg-indigo-50 w-fit p-3 rounded-xl text-indigo-600 mb-4 group-hover:scale-110 transition-all">
                  <ShieldAlert className="w-5 h-5 text-indigo-600" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">SPA9</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Sistem Permohonan Pekerjaan Suruhanjaya Perkhidmatan Awam.</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-extrabold mt-6 group-hover:gap-2.5 transition-all">
                <span>Buka Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>

            {/* Card 4: JobStreet */}
            <a 
              href="https://my.jobstreet.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="bg-slate-100 w-fit p-3 rounded-xl text-slate-600 mb-4 group-hover:scale-110 transition-all">
                  <Search className="w-5 h-5 text-slate-700" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-800 group-hover:text-slate-900 transition-colors">JobStreet</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Portal Carian Kerja Swasta Terbesar di Malaysia dengan pelbagai pilihan industri.</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-extrabold mt-6 group-hover:gap-2.5 transition-all">
                <span>Buka Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
