import React, { useState, useEffect } from 'react';
import { AlumniMember, Transaction, SystemConfig, ViewType, UserRole, Program } from './types';
import { INITIAL_MEMBERS, INITIAL_TRANSACTIONS, INITIAL_CONFIG } from './data/initialData';
import { Navbar } from './components/Navbar';
import { MainDashboard } from './components/MainDashboard';
import { MembershipPortal } from './components/MembershipPortal';
import { ProgramsManager } from './components/ProgramsManager';
import { StatisticsPanel } from './components/StatisticsPanel';
import { FinanceLedger } from './components/FinanceLedger';
import { ReportsManager } from './components/ReportsManager';
import { SettingsPanel } from './components/SettingsPanel';
import { QrScannerModal } from './components/QrScannerModal';
import { NetworkSecurityBackground } from './components/NetworkSecurityBackground';
import { GraduationCap, Lock, ShieldCheck, Mail, Key, User, PlusCircle, LayoutGrid, CheckCircle } from 'lucide-react';
import {
  seedInitialFirestoreData,
  subscribeToMembers,
  subscribeToTransactions,
  subscribeToPrograms,
  subscribeToConfig,
  addOrUpdateMember,
  updateMemberPartial,
  deleteMemberFromFirestore,
  addOrUpdateTransaction,
  deleteTransactionFromFirestore,
  addOrUpdateProgram,
  deleteProgramFromFirestore,
  updateSystemConfig,
  getMemberStatus,
  INITIAL_PROGRAMS_LIST
} from './firebase';

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

export default function App() {
  const [userRole, setUserRole] = useState<UserRole>('landing');
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  
  // Data State — apply getMemberStatus to derive correct Active/Inactive from phone number
  const [members, setMembers] = useState<AlumniMember[]>(() =>
    INITIAL_MEMBERS.map(m => ({ ...m, status: m.status === 'Active' ? getMemberStatus(m.noTelefon) : m.status }))
  );
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [programs, setPrograms] = useState<Program[]>(INITIAL_PROGRAMS_LIST);
  const [config, setConfig] = useState<SystemConfig>(INITIAL_CONFIG);
  
  const [currentMember, setCurrentMember] = useState<AlumniMember | null>(null);
  const [isFirestoreLoaded, setIsFirestoreLoaded] = useState(false);

  // Modals
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  
  // Auth Form Inputs
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'admin'>('login');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Register State
  const [regStep, setRegStep] = useState<'ic_lookup' | 'complete_info'>('ic_lookup');
  const [matchedAlumni, setMatchedAlumni] = useState<AlumniMember | null>(null);
  const [regKp, setRegKp] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regOccupation, setRegOccupation] = useState('');
  const [regEmployer, setRegEmployer] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Real-time Firestore Subscriptions & Initial Seeding
  useEffect(() => {
    // Seed Firestore with initial records if collections are empty
    seedInitialFirestoreData();

    // 1. Subscribe to Members
    const unsubMembers = subscribeToMembers(
      (freshMembers) => {
        if (freshMembers && freshMembers.length > 0) {
          setMembers(freshMembers);
          // Refresh local currentMember reference if logged in
          if (currentMember && userRole !== 'admin') {
            const fresh = freshMembers.find((m) => m.id === currentMember.id);
            if (fresh) setCurrentMember(fresh);
          }
        }
        setIsFirestoreLoaded(true);
      },
      (err) => {
        console.warn('Firestore members sync warning, using local initial state:', err);
        setIsFirestoreLoaded(true);
      }
    );

    // 2. Subscribe to Transactions (Real-time sync from Firestore)
    const unsubTransactions = subscribeToTransactions((freshTx) => {
      setTransactions(freshTx || []);
    });

    // 3. Subscribe to Programs (Real-time sync from Firestore)
    const unsubPrograms = subscribeToPrograms((freshPrograms) => {
      if (freshPrograms) setPrograms(freshPrograms);
    });

    // 4. Subscribe to Config (Real-time sync from Firestore)
    const unsubConfig = subscribeToConfig((freshConfig) => {
      if (freshConfig) setConfig(freshConfig);
    });

    return () => {
      unsubMembers();
      unsubTransactions();
      unsubPrograms();
      unsubConfig();
    };
  }, [currentMember?.id, userRole]);

  // Logins Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    // Look up email & password
    const emailMatch = members.find(
      m => String(m.emel || '').toLowerCase().trim() === loginEmail.toLowerCase().trim() && 
      String(m.password || '').trim() === loginPassword.trim()
    );

    if (emailMatch) {
      setCurrentMember(emailMatch);
      setUserRole('member'); // Regular login is always member role
      setLoginEmail('');
      setLoginPassword('');
    } else {
      setAuthError('Kredensil salah atau kata laluan tidak sepadan. Sila cuba lagi.');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (adminPasswordInput === 'Alumni@89807.' || adminPasswordInput === 'Alumni@89807') {
      // Create a mock admin currentMember
      const mockAdmin: AlumniMember = {
        id: 'ADMIN-MOCK',
        noAhli: 'ADMIN-001',
        nama: 'ADMIN',
        noKp: '000000000000',
        noPendaftaran: 'ADMIN',
        tahunLulusan: '2026',
        program: 'Pentadbiran',
        jantina: 'Lelaki',
        agama: 'Islam',
        kaumUtama: 'Melayu',
        tarikhGraduasi: '12/08/2026',
        noTelefon: '087-223000',
        emel: 'admin@kkbs.edu.my',
        pekerjaanJawatan: 'Pentadbir',
        namaMajikan: 'KKBS',
        negeri: 'Sabah',
        status: 'Active',
        role: 'Admin'
      };
      setCurrentMember(mockAdmin);
      setUserRole('admin');
      setAdminPasswordInput('');
    } else {
      setAuthError('Kata laluan pentadbir tidak sah.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (regStep === 'ic_lookup') {
      const cleanKp = regKp.replace(/\D/g, '').trim();
      if (!cleanKp) {
        setAuthError('Sila masukkan Nombor Kad Pengenalan.');
        return;
      }

      const match = members.find(m => String(m.noKp || '').replace(/\D/g, '').padStart(12, '0') === cleanKp.padStart(12, '0'));
      if (match) {
        setMatchedAlumni(match);
        setRegEmail(match.emel || '');
        setRegPhone(match.noTelefon === '012-0000000' || !match.noTelefon ? '' : match.noTelefon);
        setRegOccupation(match.pekerjaanJawatan === '-' ? '' : match.pekerjaanJawatan);
        setRegEmployer(match.namaMajikan === '-' ? '' : match.namaMajikan);
        setRegPassword(match.password || '');
        setRegStep('complete_info');
      } else {
        setAuthError('Nombor Kad Pengenalan tidak dijumpai dalam pangkalan data lulusan. Sila hubungi pentadbiran (Admin) untuk pendaftaran.');
      }
    } else {
      if (!regEmail || !regPassword || !regPhone) {
        setAuthError('Sila isi emel, no telefon dan cipta kata laluan.');
        return;
      }
      // Format validation for phone: 3 digits, hyphen, 7 to 8 digits
      const phoneRegex = /^\d{3}-\d{7,8}$/;
      if (!phoneRegex.test(regPhone)) {
        setAuthError('Format No. Telefon mestilah cth: 012-3456789 atau 011-12345678 (000-00000000).');
        return;
      }
      if (!matchedAlumni) return;

      const updateData: Partial<AlumniMember> = {
        emel: regEmail,
        noTelefon: regPhone || '-',
        pekerjaanJawatan: regOccupation || '-',
        namaMajikan: regEmployer || '-',
        password: regPassword,
        status: 'Active' // Instantly activate!
      };

      const success = await updateMemberPartial(matchedAlumni.id, updateData);

      if (success) {
        // Also update local state for immediate feedback
        setMembers(prev => prev.map(m => m.id === matchedAlumni.id ? { ...m, ...updateData } : m));
        alert(`Pendaftaran selesai! Selamat Pagi/Petang ${matchedAlumni.nama}. Akaun anda telah aktif dalam pangkalan data Firestore. Sila log masuk.`);
        setAuthMode('login');
        setRegStep('ic_lookup');
        setMatchedAlumni(null);
      } else {
        setAuthError('Pendaftaran ralat ke Firestore. Sila periksa sambungan internet dan cuba lagi.');
      }
    }
  };

  // Firestore Callbacks
  const handleUpdateProfile = async (data: any) => {
    if (!currentMember) return false;
    const payload = {
      ...data,
      status: getMemberStatus(data.noTelefon)
    };
    const success = await updateMemberPartial(currentMember.id, payload);
    if (success) {
      setMembers(prev => prev.map(m => m.id === currentMember.id ? { ...m, ...payload } : m));
      setCurrentMember(prev => prev ? { ...prev, ...payload } : null);
    }
    return success;
  };

  const handleApproveMember = async (id: string, noAhli: string) => {
    const updated = { status: 'Active' as const, noAhli };
    const success = await updateMemberPartial(id, updated);
    if (success) {
      setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
    }
    return success;
  };

  const handleRejectMember = async (id: string) => {
    const updated = { status: 'Rejected' as const };
    const success = await updateMemberPartial(id, updated);
    if (success) {
      setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
    }
    return success;
  };

  const handleActivateMember = async (id: string) => {
    const updated = { status: 'Active' as const };
    const success = await updateMemberPartial(id, updated);
    if (success) {
      setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
    }
    return success;
  };

  const handleDeactivateMember = async (id: string) => {
    const updated = { status: 'Inactive' as const };
    const success = await updateMemberPartial(id, updated);
    if (success) {
      setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
    }
    return success;
  };

  const handleDeleteMember = async (id: string) => {
    const success = await deleteMemberFromFirestore(id);
    if (success) {
      setMembers(prev => prev.filter(m => m.id !== id));
    }
    return success;
  };

  const handleAddTransaction = async (tx: any) => {
    const fullTx: Transaction = {
      ...tx,
      id: tx.id || `TX-${Date.now()}`
    };
    const success = await addOrUpdateTransaction(fullTx);
    if (success) {
      setTransactions(prev => [fullTx, ...prev]);
    }
    return success;
  };

  const handleDeleteTransaction = async (id: string) => {
    const success = await deleteTransactionFromFirestore(id);
    if (success) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
    return success;
  };

  const handleAddProgram = async (newProg: Omit<Program, 'id'>) => {
    const p: Program = {
      ...newProg,
      id: `PROG-${Date.now()}`
    };
    const success = await addOrUpdateProgram(p);
    if (success) {
      setPrograms(prev => [p, ...prev]);
    }
    return success;
  };

  const handleUpdateProgram = async (updatedProg: Program) => {
    const success = await addOrUpdateProgram(updatedProg);
    if (success) {
      setPrograms(prev => prev.map(p => p.id === updatedProg.id ? updatedProg : p));
    }
    return success;
  };

  const handleDeleteProgram = async (id: string) => {
    const success = await deleteProgramFromFirestore(id);
    if (success) {
      setPrograms(prev => prev.filter(p => p.id !== id));
    }
    return success;
  };

  const handleUpdateConfig = async (newConfig: SystemConfig) => {
    const success = await updateSystemConfig(newConfig);
    if (success) {
      setConfig(newConfig);
    }
    return success;
  };

  const handleLogout = () => {
    setCurrentMember(null);
    setUserRole('landing');
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans text-slate-800 selection:bg-cyan-500 selection:text-white print:bg-white overflow-x-hidden">
      {/* Dynamic Network Security Background */}
      <NetworkSecurityBackground showCentralLock={userRole === 'landing'} />
      
      {/* 1. AUTH LANDING PAGE VIEW */}
      {userRole === 'landing' ? (
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
          <div className="w-full max-w-md bg-slate-900/85 backdrop-blur-xl border border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(0,242,254,0.18)] p-6 sm:p-8 space-y-6 text-white animate-in fade-in zoom-in-95 duration-300">
            
            {/* Brand Title */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur-md opacity-40 animate-pulse"></div>
                <img src="/logo-alumni.png" alt="Logo Persatuan Alumni" className="w-20 h-20 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(0,242,254,0.35)]" />
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
            </div>

            {authError && (
              <div className="p-3 bg-rose-950/80 rounded-xl text-rose-200 text-xs font-semibold text-center border border-rose-500/40 shadow-inner">
                {authError}
              </div>
            )}

            {/* A. Login Mode Form */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-cyan-200/80 uppercase mb-1">E-mel Pendaftaran</label>
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
                    onClick={() => { setAuthMode('register'); setAuthError(''); }}
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
                <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2">Maklumat Pendaftaran Ahli</h3>
                
                {regStep === 'ic_lookup' ? (
                  /* Step 1: IC Lookup */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-black text-cyan-200/80 uppercase mb-1">Nombor Kad Pengenalan (12 Digit)</label>
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
                  /* Step 2: Info update and activation */
                  <div className="space-y-4">
                    {/* Pre-populated Readonly Alumni Details */}
                    {matchedAlumni && (
                      <div className="bg-slate-950/80 p-3.5 rounded-xl border border-cyan-500/30 space-y-1 animate-in fade-in">
                        <p className="text-[10px] text-cyan-400 font-black uppercase tracking-wider">REKOD DIJUMPAI</p>
                        <p className="text-xs font-extrabold text-white uppercase">{matchedAlumni.nama}</p>
                        <p className="text-[10px] text-slate-300 font-semibold">{matchedAlumni.program} ({matchedAlumni.tahunLulusan})</p>
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
                      <label className="block text-[9px] font-black text-cyan-200/80 uppercase mb-1">Nombor Telefon Bimbit</label>
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
                        <label className="block text-[9px] font-black text-cyan-200/80 uppercase mb-1">Pekerjaan Semasa</label>
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
                        <label className="block text-[9px] font-black text-cyan-200/80 uppercase mb-1">Nama Majikan / Syarikat</label>
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
                      <label className="block text-[9px] font-black text-cyan-200/80 uppercase mb-1">Cipta Kata Laluan</label>
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
                        className="flex-1 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-cyan-500/25 cursor-pointer transition-all text-xs"
                      >
                        Selesaikan Pendaftaran
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
            {authMode === 'admin' && (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-cyan-200/80 uppercase mb-1">Kata Laluan Pentadbir</label>
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
                    onClick={() => { setAuthMode('login'); setAuthError(''); }}
                    className="text-cyan-400 font-extrabold hover:text-cyan-300 hover:underline"
                  >
                    Kembali ke Log Masuk Alumni
                  </button>
                </div>
              </form>
            )}

            {/* Footer Admin toggle */}
            {authMode !== 'admin' && (
              <div className="text-center border-t border-slate-800/80 pt-4">
                <button
                  type="button"
                  onClick={() => { setAuthMode('admin'); setAuthError(''); }}
                  className="text-[10px] font-bold text-slate-400 hover:text-cyan-300 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Lock className="w-3 h-3 text-cyan-500" />
                  <span>Log Masuk sebagai Pentadbir (Admin)</span>
                </button>
              </div>
            )}

          </div>
        </div>
      ) : (
        
        /* 2. LOGGED IN DASHBOARD / NAVIGATION SHELL VIEW */
        <div className="relative z-10 flex flex-col flex-1 min-h-screen">
          <Navbar
            currentView={currentView}
            setCurrentView={setCurrentView}
            userRole={userRole}
            userName={userRole === 'admin' ? 'ADMIN' : (currentMember?.nama || 'Alumni')}
            onLogout={handleLogout}
          />
          
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 print:p-0 print:max-w-none">
            {currentView === 'dashboard' && (
              <MainDashboard
                members={members}
                userRole={userRole}
                currentMember={currentMember}
                setCurrentView={setCurrentView}
                onOpenQrScanner={() => setIsQrScannerOpen(true)}
              />
            )}
            
            {currentView === 'membership' && (
              <MembershipPortal
                currentMember={currentMember}
                members={members}
                config={config}
                userRole={userRole}
                onUpdateProfile={handleUpdateProfile}
                onApproveMember={handleApproveMember}
                onRejectMember={handleRejectMember}
                onActivateMember={handleActivateMember}
                onDeactivateMember={handleDeactivateMember}
                onDeleteMember={handleDeleteMember}
              />
            )}
            
            {currentView === 'programs' && userRole === 'admin' && (
              <ProgramsManager
                programs={programs}
                config={config}
                onAddProgram={handleAddProgram}
                onUpdateProgram={handleUpdateProgram}
                onDeleteProgram={handleDeleteProgram}
              />
            )}
            
            {currentView === 'statistics' && (
              <StatisticsPanel members={members} />
            )}
            
            {currentView === 'finance' && userRole === 'admin' && (
              <FinanceLedger
                transactions={transactions}
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
              />
            )}
            
            {currentView === 'reports' && userRole === 'admin' && (
              <ReportsManager
                members={members}
                transactions={transactions}
              />
            )}
            
            {currentView === 'settings' && (
              <SettingsPanel
                config={config}
                userRole={userRole}
                onUpdateConfig={handleUpdateConfig}
                onOpenAdminModal={() => setAuthMode('admin')}
                onReseedFirestore={seedInitialFirestoreData}
                membersCount={members.length}
              />
            )}
          </main>

          {/* QR Code Scanner simulation Modal */}
          <QrScannerModal
            isOpen={isQrScannerOpen}
            onClose={() => setIsQrScannerOpen(false)}
            members={members}
          />
          
          {/* Footer branding */}
          <footer className="bg-white/90 backdrop-blur-md border-t border-slate-200/80 py-4 print:hidden relative z-10">
            <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 font-semibold gap-2">
              <p>© {new Date().getFullYear()} Persatuan Alumni Kolej Komuniti Beaufort Sabah. Hak Cipta Terpelihara.</p>
              <div className="flex items-center gap-2 text-[9px] font-mono text-cyan-700 bg-cyan-50/80 px-2 py-0.5 rounded-full border border-cyan-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
                <span>SECURE FIRESTORE SYNC ACTIVE (icamp-aa9e4)</span>
              </div>
            </div>
          </footer>
        </div>
      )}

    </div>
  );
}
