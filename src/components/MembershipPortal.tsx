import React, { useState } from 'react';
import { AlumniMember, SystemConfig } from '../types';
import { CreditCard, Edit, Users, ShieldCheck, Check, X, AlertTriangle, UserX, UserCheck, Trash2, Lock, User, Download, Filter, Search, FileSpreadsheet } from 'lucide-react';
import { formatDateString } from '../utils/date';

interface MembershipPortalProps {
  currentMember: AlumniMember | null;
  members: AlumniMember[];
  config: SystemConfig;
  userRole: 'admin' | 'member';
  onUpdateProfile: (data: { noTelefon: string; emel: string; pekerjaanJawatan: string; namaMajikan: string }) => Promise<boolean>;
  onApproveMember: (id: string, noAhli: string) => Promise<boolean>;
  onRejectMember: (id: string) => Promise<boolean>;
  onActivateMember: (id: string) => Promise<boolean>;
  onDeactivateMember: (id: string) => Promise<boolean>;
  onDeleteMember: (id: string) => Promise<boolean>;
}

export const formatPhone = (val: any): string => {
  const str = String(val || '');
  const digits = str.replace(/\D/g, '').substring(0, 11);
  if (digits.length <= 3) return digits;
  return `${digits.substring(0, 3)}-${digits.substring(3)}`;
};


export const MembershipPortal: React.FC<MembershipPortalProps> = ({
  currentMember,
  members,
  config,
  userRole,
  onUpdateProfile,
  onApproveMember,
  onRejectMember,
  onActivateMember,
  onDeactivateMember,
  onDeleteMember,
}) => {
  const [activeTab, setActiveTab] = useState<'card' | 'edit'>('card');
  const [adminTab, setAdminTab] = useState<'roster' | 'approvals'>('roster');

  // Member Form state
  const [phone, setPhone] = useState(() => formatPhone(currentMember?.noTelefon || ''));
  const [email, setEmail] = useState(() => String(currentMember?.emel || ''));
  const [occupation, setOccupation] = useState(() => String(currentMember?.pekerjaanJawatan || ''));
  const [employer, setEmployer] = useState(() => String(currentMember?.namaMajikan || ''));
  const [formMsg, setFormMsg] = useState<{ status: 'success' | 'error'; text: string } | null>(null);

  // Admin Approval Dialog state
  const [selectedPendingMember, setSelectedPendingMember] = useState<AlumniMember | null>(null);
  const [newNoAhli, setNewNoAhli] = useState('');
  const [approvalMsg, setApprovalMsg] = useState<string | null>(null);

  // Search & Filter in Admin Roster
  const [rosterSearch, setRosterSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);
    if (!phone || !email || !occupation || !employer) {
      setFormMsg({ status: 'error', text: 'Sila lengkapkan semua ruangan mandatori.' });
      return;
    }
    
    // Format validation for phone: 3 digits, hyphen, 7 to 8 digits
    const phoneRegex = /^\d{3}-\d{7,8}$/;
    if (!phoneRegex.test(phone)) {
      setFormMsg({ status: 'error', text: 'Format No. Telefon mestilah cth: 012-3456789 atau 011-12345678 (000-00000000).' });
      return;
    }

    const ok = await onUpdateProfile({
      noTelefon: phone,
      emel: email,
      pekerjaanJawatan: occupation,
      namaMajikan: employer
    });
    if (ok) {
      setFormMsg({ status: 'success', text: 'Profil anda berjaya dikemas kini!' });
    } else {
      setFormMsg({ status: 'error', text: 'Gagal mengemas kini profil. Sila cuba lagi.' });
    }
  };

  const triggerApproval = async () => {
    if (!selectedPendingMember || !newNoAhli.trim()) return;
    setApprovalMsg(null);
    const ok = await onApproveMember(selectedPendingMember.id, newNoAhli.trim());
    if (ok) {
      setSelectedPendingMember(null);
      setNewNoAhli('');
    } else {
      setApprovalMsg('Ralat meluluskan permohonan. Sila cuba lagi.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter lists for admin
  const activeMembers = members.filter(m => (m.status === 'Active' || m.status === 'Inactive') && m.role !== 'Admin');
  const pendingMembers = members.filter(m => m.status === 'Pending');

  const filteredRoster = activeMembers.filter(m => {
    // 1. Status filter
    if (statusFilter !== 'all' && m.status !== statusFilter) {
      return false;
    }
    // 2. Search query filter
    if (!rosterSearch.trim()) return true;
    const query = rosterSearch.toLowerCase().trim();
    return (
      String(m.nama || '').toLowerCase().includes(query) || 
      String(m.noKp || '').includes(query) ||
      String(m.noAhli || '').toLowerCase().includes(query) ||
      String(m.program || '').toLowerCase().includes(query) ||
      String(m.noPendaftaran || '').toLowerCase().includes(query) ||
      String(m.emel || '').toLowerCase().includes(query) ||
      String(m.noTelefon || '').includes(query)
    );
  });

  // Export Filtered Roster to CSV
  const handleExportCsv = () => {
    if (filteredRoster.length === 0) {
      alert('Tiada rekod alumni yang sepadan untuk dimuat turun.');
      return;
    }

    const headers = [
      'Bil',
      'No. Ahli',
      'Nama Penuh',
      'No. Kad Pengenalan',
      'No. Pendaftaran',
      'Tahun Lulusan',
      'Program Pengajian',
      'Jantina',
      'Agama',
      'Kaum Utama',
      'Tarikh Graduasi',
      'No. Telefon',
      'Emel',
      'Pekerjaan',
      'Nama Majikan',
      'Negeri',
      'Status Keahlian'
    ];

    const escapeCsv = (val: any) => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredRoster.map((m, idx) => [
      idx + 1,
      escapeCsv(m.noAhli || '-'),
      escapeCsv(m.nama || ''),
      escapeCsv(m.noKp || ''),
      escapeCsv(m.noPendaftaran || ''),
      escapeCsv(m.tahunLulusan || ''),
      escapeCsv(m.program || ''),
      escapeCsv(m.jantina || ''),
      escapeCsv(m.agama || ''),
      escapeCsv(m.kaumUtama || ''),
      escapeCsv(formatDateString(m.tarikhGraduasi) || ''),
      escapeCsv(m.noTelefon || ''),
      escapeCsv(m.emel || ''),
      escapeCsv(m.pekerjaanJawatan || ''),
      escapeCsv(m.namaMajikan || ''),
      escapeCsv(m.negeri || ''),
      escapeCsv(m.status === 'Active' ? 'Aktif' : 'Tidak Aktif')
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const statusSuffix = statusFilter === 'all' ? 'Semua' : statusFilter === 'Active' ? 'Aktif' : 'Tidak_Aktif';
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `Senarai_Alumni_KKBS_${statusSuffix}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Simple QR URL generator (using qrserver api or inline QR drawing)
  const getQrUrl = (id: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(id)}`;
  };

  // 1. USER: Member Portal Layout
  if (userRole === 'member' && currentMember) {
    return (
      <div className="space-y-6">
        {/* Portal Tabs */}
        <div className="flex border-b border-slate-200 print:hidden">
          <button
            onClick={() => setActiveTab('card')}
            className={`py-2.5 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'card' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Kad Keahlian Digital
            </span>
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`py-2.5 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'edit' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Kemaskini Profil
            </span>
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'card' ? (
          <div className="max-w-xl mx-auto flex flex-col items-center py-6">
            {/* Force print colors to be preserved during print */}
            <style>{`
              @media print {
                body {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
            `}</style>
            {/* Digital Card render */}
            <div className="w-full bg-white text-slate-800 rounded-3xl shadow-[0_20px_45px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,0.9)] relative aspect-[1.586] overflow-hidden border-2 border-slate-200/80 max-w-md print:shadow-none print:border-2 print:border-slate-400">
              
              {/* Geometric blue/orange borders */}
              {/* Top-left dark blue curved panel */}
              <div className="absolute top-0 left-0 bg-linear-to-br from-blue-900 to-blue-800 w-[55%] h-[18%] -skew-x-12 -translate-x-[15%] origin-top-left border-r-4 border-orange-500 rounded-br-2xl z-20" />
              
              {/* Bottom-left dark blue curved panel */}
              <div className="absolute bottom-0 left-0 bg-linear-to-tr from-blue-950 to-blue-900 w-[35%] h-[22%] skew-x-12 -translate-x-[10%] origin-bottom-left border-r-4 border-orange-500 rounded-tr-3xl flex flex-col justify-end pl-9 pr-3 pb-2.5 z-10">
                <p className="text-[6px] text-orange-400 font-black uppercase italic tracking-wider block leading-tight -skew-x-12">ALUMNI DINAMIK,</p>
                <p className="text-[6px] text-white font-black uppercase italic tracking-wider block leading-tight -skew-x-12 mt-0.5">KOMUNITI PROGRESIF</p>
              </div>

              {/* Top-right status badge panel */}
              <div className="absolute top-0 right-0 bg-blue-900 text-white pl-6 pr-4 py-1.5 rounded-bl-3xl border-l-2 border-b-2 border-orange-500 flex items-center gap-1.5 shadow-xs">
                <User className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span className="text-[8px] font-black tracking-widest uppercase">
                  {currentMember.status === 'Active' ? 'AHLI AKTIF' : 'AHLI TIDAK AKTIF'}
                </span>
              </div>

              {/* Inner content container */}
              <div className="absolute inset-0 p-5 flex gap-4">
                
                {/* LEFT COLUMN: Logo (40% width) */}
                <div className="w-[38%] flex flex-col justify-start pt-8 items-center z-10 pr-2 border-r border-slate-100">
                  <img 
                    src="/logo-card.png" 
                    alt="Persatuan Alumni KKBS" 
                    className="w-full max-h-[80%] object-contain mt-2"
                  />
                </div>

                {/* RIGHT COLUMN: Details (62% width) */}
                <div className="w-[62%] flex flex-col justify-between pl-2 pt-8">
                  {/* Header Title */}
                  <div className="mb-2">
                    <span className="text-sm font-black text-orange-500 tracking-wide uppercase mr-1">KAD</span>
                    <span className="text-sm font-black text-blue-900 tracking-wide uppercase">KEAHLIAN</span>
                    <div className="w-12 h-0.5 bg-orange-500 mt-0.5" />
                  </div>

                  {/* Details block grid */}
                  <div className="flex-1 space-y-1 text-[9px] font-sans pr-2 mt-1">
                    {/* Name */}
                    <div className="flex border-b border-slate-100 pb-0.5 gap-1.5 items-start">
                      <span className="w-20 font-extrabold text-slate-400 uppercase text-[7.5px] tracking-wide shrink-0">NAMA</span>
                      <span className="font-extrabold text-slate-500 uppercase shrink-0">:</span>
                      <span className="font-black text-slate-800 uppercase block flex-1 break-words leading-tight">{currentMember.nama}</span>
                    </div>

                    {/* Member No. */}
                    <div className="flex border-b border-slate-100 pb-0.5 gap-1.5 items-center">
                      <span className="w-20 font-extrabold text-slate-400 uppercase text-[7.5px] tracking-wide shrink-0">NO. AHLI</span>
                      <span className="font-extrabold text-slate-500 uppercase shrink-0">:</span>
                      <span className="font-black text-slate-800 font-mono tracking-wide">{currentMember.noAhli || 'DALAM PROSES'}</span>
                    </div>

                    {/* Program */}
                    <div className="flex border-b border-slate-100 pb-0.5 gap-1.5 items-start">
                      <span className="w-20 font-extrabold text-slate-400 uppercase text-[7.5px] tracking-wide shrink-0">PROGRAM</span>
                      <span className="font-extrabold text-slate-500 uppercase shrink-0">:</span>
                      <span className="font-black text-slate-700 uppercase block flex-1 break-words leading-tight">{currentMember.program}</span>
                    </div>

                    {/* Graduation Date */}
                    <div className="flex border-b border-slate-100 pb-0.5 gap-1.5 items-center">
                      <span className="w-20 font-extrabold text-slate-400 uppercase text-[7.5px] tracking-wide shrink-0">TARIKH GRADUASI</span>
                      <span className="font-extrabold text-slate-500 uppercase shrink-0">:</span>
                      <span className="font-black text-slate-800">{formatDateString(currentMember.tarikhGraduasi)}</span>
                    </div>
                  </div>

                  {/* QR Code bottom right */}
                  <div className="flex justify-end pr-2 pb-0.5">
                    <div className="border border-blue-900/20 p-0.5 rounded-lg bg-white shadow-xs shrink-0">
                      <img 
                        src={getQrUrl(currentMember.id)} 
                        alt="QR Card Verification" 
                        className="w-11 h-11"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Print Date (Visible only during print) */}
            <div className="hidden print:block text-center text-[10px] text-slate-500 mt-4 font-mono font-bold">
              Tarikh Cetak: {new Date().toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>

            {/* Print triggers */}
            <div className="mt-8 flex gap-4 print:hidden">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Cetak Kad Ahli
              </button>
            </div>
          </div>
        ) : (
          /* Profile edit form */
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs">
            <form onSubmit={handleUpdateSubmit} className="space-y-5">
              <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-2">Maklumat Profil Ahli</h3>
              
              {formMsg && (
                <div className={`p-3.5 rounded-xl text-xs font-bold animate-in fade-in ${
                  formMsg.status === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                }`}>
                  {formMsg.text}
                </div>
              )}

              {/* A. Locked Fields Grid */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-wider">Maklumat Peribadi & Pengajian (Terkunci)</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase">No Ahli</label>
                    <div className="font-bold text-slate-700 mt-0.5 uppercase">{currentMember.noAhli || 'DALAM PROSES'}</div>
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase">Nama Penuh</label>
                    <div className="font-bold text-slate-700 mt-0.5 uppercase">{currentMember.nama}</div>
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase">No. KP</label>
                    <div className="font-bold text-slate-700 mt-0.5 font-mono">{currentMember.noKp}</div>
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase">No. Pendaftaran Pelajar</label>
                    <div className="font-bold text-slate-700 mt-0.5 font-mono">{currentMember.noPendaftaran}</div>
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase">Tahun Lulusan</label>
                    <div className="font-bold text-slate-700 mt-0.5">{currentMember.tahunLulusan}</div>
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase">Program Pengajian</label>
                    <div className="font-bold text-slate-700 mt-0.5 uppercase">{currentMember.program}</div>
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase">Jantina</label>
                    <div className="font-bold text-slate-700 mt-0.5 uppercase">{currentMember.jantina}</div>
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase">Agama</label>
                    <div className="font-bold text-slate-700 mt-0.5 uppercase">{currentMember.agama}</div>
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase">Kaum Utama</label>
                    <div className="font-bold text-slate-700 mt-0.5 uppercase">{currentMember.kaumUtama}</div>
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase">Tarikh Graduasi</label>
                    <div className="font-bold text-slate-700 mt-0.5">{formatDateString(currentMember.tarikhGraduasi)}</div>
                  </div>
                </div>
              </div>

              {/* B. Editable Fields Grid */}
              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                  <Edit className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-wider">Kemaskini Maklumat Hubungan & Kerjaya</span>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">No. Telefon Bimbit</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 012-3456789"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-blue-600 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Alamat Emel Utama</label>
                  <input
                    type="email"
                    required
                    placeholder="contoh@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Pekerjaan / Jawatan Semasa</label>
                    <input
                      type="text"
                      required
                      placeholder="Chef / Kerani"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Nama Syarikat / Majikan</label>
                    <input
                      type="text"
                      required
                      placeholder="Syarikat SDN BHD"
                      value={employer}
                      onChange={(e) => setEmployer(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-blue-600"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // 2. ADMIN: Roster Layout (No approvals needed)
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Search, Status Filter & Download CSV Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 flex-1 min-w-[220px] focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
              <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Cari nama, No. KP, No. Ahli, program..."
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                className="w-full text-xs bg-transparent outline-none font-medium text-slate-800 placeholder-slate-400"
              />
              {rosterSearch && (
                <button
                  type="button"
                  onClick={() => setRosterSearch('')}
                  className="text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter (Semua / Aktif / Tidak Aktif) */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 gap-1.5 shrink-0 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
              <Filter className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-[10px] text-slate-400 uppercase font-black">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'Active' | 'Inactive')}
                className="bg-transparent outline-none cursor-pointer font-bold text-slate-800 text-xs pr-1"
              >
                <option value="all">Semua ({activeMembers.length})</option>
                <option value="Active">Aktif ({activeMembers.filter(m => m.status === 'Active').length})</option>
                <option value="Inactive">Tidak Aktif ({activeMembers.filter(m => m.status === 'Inactive').length})</option>
              </select>
            </div>
          </div>

          {/* Download CSV & Member Counter Action Group */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer border border-emerald-600"
              title="Muat turun data keahlian dalam format fail .CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Muat Turun .CSV</span>
            </button>

            <div className="bg-slate-100 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap">
              <span>Jumlah: </span>
              <span className="text-blue-700 font-extrabold">{filteredRoster.length}</span>
              <span className="text-slate-400 font-normal"> / {activeMembers.length}</span>
            </div>
          </div>
        </div>

        {filteredRoster.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-2xs space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-slate-500 font-bold text-sm">Tiada rekod alumni dijumpai.</p>
            <p className="text-xs text-slate-400">Cuba ubah kata kunci carian atau tetapan penapis status.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRoster.map(m => (
              <div key={m.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wide">{m.nama}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">No. Ahli: {m.noAhli || 'DALAM PROSES'}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase ${
                      m.status === 'Active'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-rose-50 border-rose-200 text-rose-700'
                    }`}>
                      {m.status === 'Active' ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 my-3 pt-3 grid grid-cols-2 gap-y-2 gap-x-4 text-[11px] text-slate-500 font-medium font-sans">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">No. KP</span>
                      <span className="font-bold text-slate-700">{m.noKp}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">No. Pendaftaran</span>
                      <span className="font-bold text-slate-700">{m.noPendaftaran}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Tahun Lulusan</span>
                      <span className="font-bold text-slate-700">{m.tahunLulusan}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Program</span>
                      <span className="font-bold text-slate-700 truncate block">{m.program}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">No. Telefon</span>
                      <span className="font-bold text-slate-700">{m.noTelefon}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Emel</span>
                      <span className="font-bold text-slate-700 truncate block">{m.emel}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex gap-2 justify-end">
                  <button
                    onClick={() => m.status === 'Active' ? onDeactivateMember(m.id) : onActivateMember(m.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                      m.status === 'Active' 
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {m.status === 'Active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    <span>{m.status === 'Active' ? 'Nyahaktif' : 'Aktifkan'}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Adakah anda pasti mahu memadam rekod alumni '${m.nama}'?`)) {
                        onDeleteMember(m.id);
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
