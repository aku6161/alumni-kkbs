import React, { useState } from 'react';
import { AlumniMember } from '../types';
import { ShieldCheck, Mail, Key, Lock } from 'lucide-react';

export const formatIcNumber = (val: any): string => {
  const str = String(val || '');
  const digits = str.replace(/\D/g, '').substring(0, 12);
  if (digits.length <= 6) return digits;
  if (digits.length <= 8) return `${digits.substring(0, 6)}-${digits.substring(6)}`;
  return `${digits.substring(0, 6)}-${digits.substring(6, 8)}-${digits.substring(8)}`;
};

export const formatPhone = (val: any): string => {
  const str = String(val || '');
  const digits = str.replace(/\D/g, '').substring(0, 11);
  if (digits.length <= 3) return digits;
  return `${digits.substring(0, 3)}-${digits.substring(3)}`;
};

interface AlumniAuthCardProps {
  members: AlumniMember[];
  onAlumniLoginSuccess: (member: AlumniMember) => void;
  onActivateMemberAccount: (memberId: string, updateData: Partial<AlumniMember>) => Promise<boolean>;
  onAdminLoginSuccess?: () => void;
  showAdminOption?: boolean;
  onCancel?: () => void;
  subtitleNote?: string;
}

export const AlumniAuthCard: React.FC<AlumniAuthCardProps> = ({
  members,
  onAlumniLoginSuccess,
  onActivateMemberAccount,
  onAdminLoginSuccess,
  showAdminOption = false,
  onCancel,
  subtitleNote
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'admin'>('login');

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Register State
  const [regStep, setRegStep] = useState<'ic_lookup' | 'complete_info'>('ic_lookup');
  const [matchedAlumni, setMatchedAlumni] = useState<AlumniMember | null>(null);
  const [regKp, setRegKp] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regOccupation, setRegOccupation] = useState('');
  const [regEmployer, setRegEmployer] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const emailMatch = members.find(
      m =>
        String(m.emel || '').toLowerCase().trim() === loginEmail.toLowerCase().trim() &&
        String(m.password || '').trim() === loginPassword.trim()
    );

    if (emailMatch) {
      setLoginEmail('');
      setLoginPassword('');
      onAlumniLoginSuccess(emailMatch);
    } else {
      setAuthError('Kredensil salah atau kata laluan tidak sepadan. Sila cuba lagi.');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (adminPasswordInput === 'Alumni@89807.' || adminPasswordInput === 'Alumni@89807') {
      setAdminPasswordInput('');
      if (onAdminLoginSuccess) onAdminLoginSuccess();
    } else {
      setAuthError('Kata laluan pentadbir tidak sah.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (regStep === 'ic_lookup') {
      const cleanKp = regKp.replace(/\D/g, '').trim();
      if (!cleanKp) {
        setAuthError('Sila masukkan Nombor Kad Pengenalan.');
        return;
      }

      const match = members.find(
        m => String(m.noKp || '').replace(/\D/g, '').padStart(12, '0') === cleanKp.padStart(12, '0')
      );
      if (match) {
        setMatchedAlumni(match);
        setRegEmail(match.emel || '');
        setRegPhone(match.noTelefon === '012-0000000' || !match.noTelefon ? '' : match.noTelefon);
        setRegOccupation(match.pekerjaanJawatan === '-' ? '' : match.pekerjaanJawatan);
        setRegEmployer(match.namaMajikan === '-' ? '' : match.namaMajikan);
        setRegPassword(match.password || '');
        setRegStep('complete_info');
      } else {
        setAuthError(
          'Nombor Kad Pengenalan tidak dijumpai dalam pangkalan data lulusan. Sila hubungi pentadbiran (Admin) untuk pendaftaran.'
        );
      }
    } else {
      if (!regEmail || !regPassword || !regPhone) {
        setAuthError('Sila isi emel, no telefon dan cipta kata laluan.');
        return;
      }
      const phoneRegex = /^\d{3}-\d{7,8}$/;
      if (!phoneRegex.test(regPhone)) {
        setAuthError('Format No. Telefon mestilah cth: 012-3456789 atau 011-12345678 (000-00000000).');
        return;
      }
      if (!matchedAlumni) return;

      setIsSubmittingReg(true);
      const updateData: Partial<AlumniMember> = {
        emel: regEmail,
        noTelefon: regPhone || '-',
        pekerjaanJawatan: regOccupation || '-',
        namaMajikan: regEmployer || '-',
        password: regPassword,
        status: 'Active'
      };

      const success = await onActivateMemberAccount(matchedAlumni.id, updateData);
      setIsSubmittingReg(false);

      if (success) {
        setAuthSuccess(
          `Pendaftaran selesai! Akaun ${matchedAlumni.nama} telah aktif. Sila log masuk untuk meneruskan.`
        );
        setLoginEmail(regEmail);
        setAuthMode('login');
        setRegStep('ic_lookup');
        setMatchedAlumni(null);
      } else {
        setAuthError('Pendaftaran ralat ke Firestore. Sila periksa sambungan internet dan cuba lagi.');
      }
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(0,242,254,0.18)] p-6 sm:p-8 space-y-6 text-white animate-in fade-in zoom-in-95 duration-300 mx-auto">
      {/* Brand Title */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur-md opacity-40 animate-pulse"></div>
          <img
            src="/logo-alumni.png"
            alt="Logo Persatuan Alumni"
            className="w-20 h-20 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(0,242,254,0.35)]"
          />
        </div>
        <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-white tracking-tight leading-none uppercase text-center">
          PERSATUAN ALUMNI
        </h2>
        <p className="text-[10px] text-cyan-200/80 font-bold uppercase tracking-wider text-center">
          Kolej Komuniti Beaufort, Sabah
        </p>
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[9px] font-mono font-bold tracking-wider uppercase">
          <ShieldCheck className="w-3 h-3 text-cyan-400" /> PORTAL RASMI ALUMNI
        </span>
        {subtitleNote && (
          <p className="text-[11px] text-cyan-100/85 text-center leading-relaxed bg-cyan-950/50 border border-cyan-500/20 px-3 py-2 rounded-xl">
            {subtitleNote}
          </p>
        )}
      </div>

      {authError && (
        <div className="p-3 bg-rose-950/80 rounded-xl text-rose-200 text-xs font-semibold text-center border border-rose-500/40 shadow-inner">
          {authError}
        </div>
      )}

      {authSuccess && (
        <div className="p-3 bg-emerald-950/80 rounded-xl text-emerald-200 text-xs font-semibold text-center border border-emerald-500/40 shadow-inner">
          {authSuccess}
        </div>
      )}

      {/* A. Login Mode Form */}
      {authMode === 'login' && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-cyan-200/80 uppercase mb-1">
              E-mel Pendaftaran
            </label>
            <div className="flex items-center bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-cyan-500/30 focus-within:border-cyan-400 transition-all">
              <Mail className="w-4 h-4 text-cyan-400 mr-2 shrink-0" />
              <input
                type="email"
                required
                placeholder="contoh@gmail.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="bg-transparent text-sm w-full outline-none font-medium text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-cyan-200/80 uppercase mb-1">Kata Laluan</label>
            <div className="flex items-center bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-cyan-500/30 focus-within:border-cyan-400 transition-all">
              <Key className="w-4 h-4 text-cyan-400 mr-2 shrink-0" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="bg-transparent text-sm w-full outline-none font-medium text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-cyan-500/25 cursor-pointer transition-all active:scale-[0.99] text-sm"
            >
              Log Masuk
            </button>
          </div>

          <div className="text-center pt-2 text-xs border-t border-slate-800/80">
            <span className="text-slate-400">Belum berdaftar? </span>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setAuthError('');
                setAuthSuccess('');
              }}
              className="text-cyan-400 font-extrabold hover:text-cyan-300 hover:underline cursor-pointer ml-1"
            >
              Daftar Baharu
            </button>
          </div>
        </form>
      )}

      {/* B. Register Mode Form */}
      {authMode === 'register' && (
        <form onSubmit={handleRegister} className="space-y-4 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
          <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2">
            Maklumat Pendaftaran Ahli
          </h3>

          {regStep === 'ic_lookup' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-black text-cyan-200/80 uppercase mb-1">
                  Nombor Kad Pengenalan (12 Digit)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 950505125678"
                  value={regKp}
                  onChange={(e) => setRegKp(formatIcNumber(e.target.value))}
                  className="w-full bg-slate-950/70 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400 font-mono font-bold"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-cyan-500/25 cursor-pointer transition-all text-xs"
                >
                  Semak Kad Pengenalan
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {matchedAlumni && (
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-cyan-500/30 space-y-1 animate-in fade-in">
                  <p className="text-[10px] text-cyan-400 font-black uppercase tracking-wider">REKOD DIJUMPAI</p>
                  <p className="text-xs font-extrabold text-white uppercase">{matchedAlumni.nama}</p>
                  <p className="text-[10px] text-slate-300 font-semibold">
                    {matchedAlumni.program} ({matchedAlumni.tahunLulusan})
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[9px] font-black text-cyan-200/80 uppercase mb-1">E-mel Utama</label>
                <input
                  type="email"
                  required
                  placeholder="contoh@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-cyan-200/80 uppercase mb-1">
                  Nombor Telefon Bimbit
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 012-3456789"
                  value={regPhone}
                  onChange={(e) => setRegPhone(formatPhone(e.target.value))}
                  className="w-full bg-slate-950/70 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-cyan-200/80 uppercase mb-1">
                    Pekerjaan Semasa
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Chef / Kerani"
                    value={regOccupation}
                    onChange={(e) => setRegOccupation(e.target.value)}
                    className="w-full bg-slate-950/70 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-cyan-200/80 uppercase mb-1">
                    Nama Majikan / Syarikat
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Syarikat SDN BHD"
                    value={regEmployer}
                    onChange={(e) => setRegEmployer(e.target.value)}
                    className="w-full bg-slate-950/70 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-cyan-200/80 uppercase mb-1">
                  Cipta Kata Laluan
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 aksara"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRegStep('ic_lookup');
                    setMatchedAlumni(null);
                    setAuthError('');
                  }}
                  className="flex-1 py-2.5 border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReg}
                  className="flex-1 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-cyan-500/25 cursor-pointer transition-all text-xs disabled:opacity-50"
                >
                  {isSubmittingReg ? 'Menyimpan...' : 'Selesaikan Pendaftaran'}
                </button>
              </div>
            </div>
          )}

          <div className="text-center pt-2 text-xs border-t border-slate-800/80">
            <span className="text-slate-400">Sudah berdaftar? </span>
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setRegStep('ic_lookup');
                setMatchedAlumni(null);
                setAuthError('');
              }}
              className="text-cyan-400 font-extrabold hover:text-cyan-300 hover:underline cursor-pointer ml-1"
            >
              Log Masuk Sini
            </button>
          </div>
        </form>
      )}

      {/* C. Admin Mode Login Form */}
      {showAdminOption && authMode === 'admin' && (
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-cyan-200/80 uppercase mb-1">
              Kata Laluan Pentadbir
            </label>
            <div className="flex items-center bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-cyan-500/30 focus-within:border-cyan-400 transition-all">
              <Lock className="w-4 h-4 text-cyan-400 mr-2 shrink-0" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                className="bg-transparent text-sm w-full outline-none font-medium text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-700 via-blue-700 to-cyan-700 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-blue-500/25 cursor-pointer transition-all text-sm"
            >
              Log Masuk Portal Admin
            </button>
          </div>

          <div className="text-center pt-2 text-xs border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthError('');
              }}
              className="text-cyan-400 font-extrabold hover:text-cyan-300 hover:underline cursor-pointer"
            >
              Kembali ke Log Masuk Alumni
            </button>
          </div>
        </form>
      )}

      {/* Footer Admin toggle */}
      {showAdminOption && authMode !== 'admin' && (
        <div className="text-center border-t border-slate-800/80 pt-4">
          <button
            type="button"
            onClick={() => {
              setAuthMode('admin');
              setAuthError('');
            }}
            className="text-[10px] font-bold text-slate-400 hover:text-cyan-300 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Lock className="w-3 h-3 text-cyan-500" />
            <span>Log Masuk sebagai Pentadbir (Admin)</span>
          </button>
        </div>
      )}

      {/* Optional Cancel / Back link */}
      {onCancel && (
        <div className="text-center border-t border-slate-800/80 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="text-[11px] font-bold text-slate-400 hover:text-cyan-300 cursor-pointer transition-colors"
          >
            &larr; Kembali ke Pilihan Kategori Pendaftaran
          </button>
        </div>
      )}
    </div>
  );
};
