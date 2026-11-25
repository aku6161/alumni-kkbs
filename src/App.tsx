import React, { useState, useEffect } from 'react';
import { AlumniMember, Transaction, SystemConfig, ViewType, UserRole, Program, ProgramReceipt, HomecomingRegistration as HomecomingRegistrationType } from './types';
import { INITIAL_MEMBERS, INITIAL_TRANSACTIONS, INITIAL_CONFIG, INITIAL_RECEIPTS } from './data/initialData';
import { Navbar } from './components/Navbar';
import { MainDashboard } from './components/MainDashboard';
import { MembershipPortal } from './components/MembershipPortal';
import { ProgramsManager } from './components/ProgramsManager';
import { HomecomingRegistration } from './components/HomecomingRegistration';
import { AlumniAuthCard } from './components/AlumniAuthCard';
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
  subscribeToReceipts,
  addOrUpdateReceipt,
  deleteReceiptFromFirestore,
  subscribeToHomecomingRegistrations,
  addOrUpdateHomecomingRegistration,
  deleteHomecomingRegistrationFromFirestore,
  bulkAddMembersToFirestore,
  standardizeAllMemberNumbersInFirestore,
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
  const [receipts, setReceipts] = useState<ProgramReceipt[]>(INITIAL_RECEIPTS);
  const [homecomingRegistrations, setHomecomingRegistrations] = useState<HomecomingRegistrationType[]>([]);
  const [selectedHomecomingProgram, setSelectedHomecomingProgram] = useState<Program | null>(null);
  const [isPublicHomecomingMode] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('daftar') === 'homecoming' || params.get('page') === 'homecoming';
    } catch {
      return false;
    }
  });
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

    // 5. Subscribe to Program Receipts (Real-time sync from Firestore)
    const unsubReceipts = subscribeToReceipts((freshReceipts) => {
      if (freshReceipts) setReceipts(freshReceipts);
    });

    // 6. Subscribe to Homecoming Registrations (Real-time sync from Firestore)
    const unsubHomecoming = subscribeToHomecomingRegistrations((freshRegs) => {
      if (freshRegs) setHomecomingRegistrations(freshRegs);
    });

    return () => {
      unsubMembers();
      unsubTransactions();
      unsubPrograms();
      unsubConfig();
      unsubReceipts();
      unsubHomecoming();
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

  const handleAddReceipt = async (receiptData: Omit<ProgramReceipt, 'id' | 'createdAt'>): Promise<boolean> => {
    const fullReceipt: ProgramReceipt = {
      ...receiptData,
      id: `REC-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    // Pastikan tiada nilai undefined
    const cleanReceipt = Object.fromEntries(
      Object.entries(fullReceipt).filter(([_, v]) => v !== undefined)
    ) as unknown as ProgramReceipt;

    // Simpan serta-merta ke dalam state tempatan
    setReceipts(prev => [cleanReceipt, ...prev.filter(r => r.id !== cleanReceipt.id)]);

    try {
      await addOrUpdateReceipt(cleanReceipt);
      return true;
    } catch (err) {
      console.warn('Sync to Firestore receipt warning:', err);
      return true;
    }
  };

  const handleDeleteReceipt = async (id: string): Promise<boolean> => {
    setReceipts(prev => prev.filter(r => r.id !== id));
    const success = await deleteReceiptFromFirestore(id);
    return success;
  };

  const handleAddHomecomingRegistration = async (reg: HomecomingRegistrationType): Promise<boolean> => {
    setHomecomingRegistrations(prev => [reg, ...prev.filter(r => r.id !== reg.id)]);
    return addOrUpdateHomecomingRegistration(reg);
  };

  const handleDeleteHomecomingRegistration = async (id: string): Promise<boolean> => {
    setHomecomingRegistrations(prev => prev.filter(r => r.id !== id));
    return deleteHomecomingRegistrationFromFirestore(id);
  };

  const handleUpdateConfig = async (newConfig: SystemConfig) => {
    const success = await updateSystemConfig(newConfig);
    if (success) {
      setConfig(newConfig);
    }
    return success;
  };

  const handleBulkAddMembers = async (
    newMembers: AlumniMember[]
  ): Promise<{ success: boolean; count: number; error?: string }> => {
    const result = await bulkAddMembersToFirestore(newMembers);
    if (result.success) {
      setMembers((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const filteredNew = newMembers.filter((m) => !existingIds.has(m.id));
        return [...filteredNew, ...prev];
      });
    }
    return result;
  };

  const handleLogout = () => {
    setCurrentMember(null);
    setUserRole('landing');
    setCurrentView('dashboard');
  };

  const handleActivateMemberAccount = async (
    memberId: string,
    updateData: Partial<AlumniMember>
  ): Promise<boolean> => {
    const success = await updateMemberPartial(memberId, updateData);
    if (success) {
      setMembers(prev => prev.map(m => (m.id === memberId ? { ...m, ...updateData } : m)));
    }
    return success;
  };

  const handleLoginAdminDirect = () => {
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
  };

  const resolvedHomecomingProgram: Program =
    selectedHomecomingProgram ||
    programs.find(p => String(p.namaProgram || '').toLowerCase().includes('homecoming')) || {
      id: 'PROG-homecoming-night',
      namaProgram: 'Alumni Homecoming Night',
      tarikhProgram: 'Akan Ditetapkan',
      masaProgram: '7.30 Malam - 11.00 Malam',
      tempatProgram: 'Kolej Komuniti Beaufort / Dewan Makan',
      kerjasama: 'Kolej Komuniti Beaufort',
      implikasiKewangan: 'Yuran Penyertaan Peserta',
      sasaranPeserta: 'Alumni & Pensyarah KKBS',
      bilanganPeserta: 100
    };

  return (
    <div className="min-h-screen relative flex flex-col font-sans text-slate-800 selection:bg-cyan-500 selection:text-white print:bg-white overflow-x-hidden">
      {/* Dynamic Network Security Background */}
      <NetworkSecurityBackground showCentralLock={!isPublicHomecomingMode && userRole === 'landing'} />

      {/* 0. PUBLIC HOMECOMING REGISTRATION MODE (?daftar=homecoming) - Registration Only, No Admin Functions */}
      {isPublicHomecomingMode ? (
        <div className="relative z-10 flex flex-col flex-1 min-h-screen">
          <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs print:hidden">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src="/logo-alumni.png" alt="Logo Persatuan Alumni" className="w-10 h-10 object-contain" />
                <div>
                  <h1 className="font-extrabold text-sm tracking-tight text-blue-900 leading-none">
                    PERSATUAN ALUMNI KKBS
                  </h1>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    Kolej Komuniti Beaufort, Sabah • Pendaftaran Program
                  </p>
                </div>
              </div>
              <span className="bg-cyan-50 text-cyan-800 border border-cyan-200 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                Pendaftaran Awam
              </span>
            </div>
          </header>

          <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 print:p-0 print:max-w-none">
            <HomecomingRegistration
              program={resolvedHomecomingProgram}
              members={members}
              config={config}
              receipts={receipts}
              registrations={homecomingRegistrations}
              isPublicMode={true}
              initialLoggedInAlumni={userRole === 'member' ? currentMember : null}
              onActivateMemberAccount={handleActivateMemberAccount}
              onAlumniAuthenticated={(member) => {
                setCurrentMember(member);
                setUserRole('member');
              }}
              onAddRegistration={handleAddHomecomingRegistration}
              onDeleteRegistration={handleDeleteHomecomingRegistration}
              onAddReceipt={handleAddReceipt}
              onAddTransaction={handleAddTransaction}
              onUpdateConfig={handleUpdateConfig}
            />
          </main>

          <footer className="bg-white/90 backdrop-blur-md border-t border-slate-200/80 py-4 print:hidden relative z-10">
            <div className="max-w-6xl mx-auto px-4 text-center text-[10px] text-slate-500 font-semibold">
              © {new Date().getFullYear()} Persatuan Alumni Kolej Komuniti Beaufort Sabah. Hak Cipta Terpelihara.
            </div>
          </footer>
        </div>
      ) : userRole === 'landing' ? (
        /* 1. AUTH LANDING PAGE VIEW */
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
          <AlumniAuthCard
            members={members}
            showAdminOption={true}
            onAlumniLoginSuccess={(member) => {
              setCurrentMember(member);
              setUserRole('member');
            }}
            onActivateMemberAccount={handleActivateMemberAccount}
            onAdminLoginSuccess={handleLoginAdminDirect}
          />
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
                onOpenHomecomingRegistration={(program) => {
                  setSelectedHomecomingProgram(program);
                  setCurrentView('homecoming_registration');
                }}
              />
            )}

            {currentView === 'homecoming_registration' && userRole === 'admin' && (
              <HomecomingRegistration
                program={resolvedHomecomingProgram}
                members={members}
                config={config}
                receipts={receipts}
                registrations={homecomingRegistrations}
                isPublicMode={false}
                onBack={() => setCurrentView('programs')}
                onActivateMemberAccount={handleActivateMemberAccount}
                onAddRegistration={handleAddHomecomingRegistration}
                onDeleteRegistration={handleDeleteHomecomingRegistration}
                onAddReceipt={handleAddReceipt}
                onAddTransaction={handleAddTransaction}
                onUpdateConfig={handleUpdateConfig}
              />
            )}
            
            {currentView === 'statistics' && (
              <StatisticsPanel members={members} />
            )}
            
            {(currentView === 'finance' || currentView === 'receipts') && userRole === 'admin' && (
              <FinanceLedger
                transactions={transactions}
                programs={programs}
                config={config}
                members={members}
                receipts={receipts}
                initialTab={currentView === 'receipts' ? 'receipts' : undefined}
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onAddReceipt={handleAddReceipt}
                onDeleteReceipt={handleDeleteReceipt}
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
                members={members}
                onBulkAddMembers={handleBulkAddMembers}
                onStandardizeMemberNumbers={standardizeAllMemberNumbersInFirestore}
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
