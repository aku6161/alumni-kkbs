import React, { useState, useMemo } from 'react';
import { ProgramReceipt, Program, SystemConfig, AlumniMember, Transaction } from '../types';
import {
  Receipt,
  PlusCircle,
  Printer,
  Search,
  Filter,
  Trash2,
  Eye,
  CheckCircle,
  X,
  CreditCard,
  Building,
  Calendar,
  DollarSign,
  FileText,
  User,
  Phone,
  Hash,
  Download,
  CheckSquare,
  Square,
  QrCode
} from 'lucide-react';

interface ProgramReceiptsManagerProps {
  receipts: ProgramReceipt[];
  programs?: Program[];
  config?: SystemConfig;
  members?: AlumniMember[];
  onAddReceipt: (receipt: Omit<ProgramReceipt, 'id' | 'createdAt'>) => Promise<boolean>;
  onDeleteReceipt: (id: string) => Promise<boolean>;
  onAddTransaction?: (tx: Omit<Transaction, 'id'>) => Promise<boolean>;
}

// Convert numbers into Malay words for official receipts
export function numberToMalayWords(amount: number): string {
  if (isNaN(amount) || amount <= 0) return 'SIFAR RINGGIT SAHAJA';

  const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Lapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  function convertGroup(n: number): string {
    if (n === 0) return '';
    if (n < 12) return units[n];
    if (n < 20) return units[n - 10] + ' Belas';
    if (n < 100) {
      const u = n % 10;
      return units[Math.floor(n / 10)] + ' Puluh' + (u ? ' ' + units[u] : '');
    }
    if (n < 200) {
      const rem = n % 100;
      return 'Seratus' + (rem ? ' ' + convertGroup(rem) : '');
    }
    if (n < 1000) {
      const rem = n % 100;
      return units[Math.floor(n / 100)] + ' Ratus' + (rem ? ' ' + convertGroup(rem) : '');
    }
    return '';
  }

  function convertThousand(n: number): string {
    if (n === 0) return 'Sifar';
    let result = '';

    const millions = Math.floor(n / 1000000);
    const remMillions = n % 1000000;
    if (millions > 0) {
      if (millions === 1) result += 'Satu Juta ';
      else result += convertGroup(millions) + ' Juta ';
    }

    const thousands = Math.floor(remMillions / 1000);
    const remThousands = remMillions % 1000;
    if (thousands > 0) {
      if (thousands === 1 && millions === 0) result += 'Seribu ';
      else result += convertGroup(thousands) + ' Ribu ';
    }

    if (remThousands > 0) {
      result += convertGroup(remThousands);
    }

    return result.trim();
  }

  const ringgit = Math.floor(amount);
  const sen = Math.round((amount - ringgit) * 100);

  let text = convertThousand(ringgit).toUpperCase() + ' RINGGIT';
  if (sen > 0) {
    text += ' DAN ' + convertGroup(sen).toUpperCase() + ' SEN';
  }
  text += ' SAHAJA';
  return text;
}

export const ProgramReceiptsManager: React.FC<ProgramReceiptsManagerProps> = ({
  receipts = [],
  programs = [],
  config,
  members = [],
  onAddReceipt,
  onDeleteReceipt,
  onAddTransaction
}) => {
  // Navigation & View state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedReceiptForPreview, setSelectedReceiptForPreview] = useState<ProgramReceipt | null>(null);
  const [printReceipt, setPrintReceipt] = useState<ProgramReceipt | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProgram, setFilterProgram] = useState('Semua');
  const [filterMethod, setFilterMethod] = useState('Semua');

  // Form State
  const defaultOfficer = config?.bendahari || 'SITI NURHAWA NABILAH BINTI FEDELIS';
  const currentYear = new Date().getFullYear();

  // Generate automatic receipt number: e.g. RESIT-PK/2026/003
  const nextReceiptNumber = useMemo(() => {
    const yearPrefix = `RESIT-PK/${currentYear}/`;
    const yearReceipts = receipts.filter(r => r.receiptNo && r.receiptNo.startsWith(yearPrefix));
    let maxNum = 0;
    yearReceipts.forEach(r => {
      const parts = r.receiptNo.split('/');
      const numPart = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    });
    return `${yearPrefix}${String(maxNum + 1).padStart(3, '0')}`;
  }, [receipts, currentYear]);

  const [receiptNo, setReceiptNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [customProgramName, setCustomProgramName] = useState('');
  const [paymentCategory, setPaymentCategory] = useState('Yuran Penyertaan Program Khas');
  const [payerName, setPayerName] = useState('');
  const [payerIcOrReg, setPayerIcOrReg] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pindahan Bank (Online)');
  const [referenceNo, setReferenceNo] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receivedBy, setReceivedBy] = useState(defaultOfficer);
  const [autoLedgerSync, setAutoLedgerSync] = useState(true);

  // Member autofill selector helper
  const [selectedMemberId, setSelectedMemberId] = useState('');

  // Form message
  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Categories list
  const categoryOptions = [
    'Yuran Penyertaan Program Khas',
    'Tajaan & Sumbangan Program Khas',
    'Bayaran Sewaan Gerai / Booth',
    'Sumbangan Meja Majlis Makan Malam',
    'Yuran Kursus & Bengkel Kemahiran',
    'Bayaran Pendaftaran Kontinjen / Pasukan',
    'Kerjasama Agensi / Penaja Luar',
    'Lain-lain Bayaran Khas'
  ];

  const methodOptions = [
    'Pindahan Bank (Online)',
    'DuitNow QR',
    'Tunai',
    'Cek',
    'Kad Debit / Kredit'
  ];

  // Open Form Handler
  const handleOpenForm = () => {
    setReceiptNo(nextReceiptNumber);
    setDate(new Date().toISOString().substring(0, 10));
    setSelectedProgramId(programs.length > 0 ? programs[0].id : '');
    setCustomProgramName('');
    setPaymentCategory('Yuran Penyertaan Program Khas');
    setPayerName('');
    setPayerIcOrReg('');
    setPayerPhone('');
    setPayerEmail('');
    setPaymentMethod('Pindahan Bank (Online)');
    setReferenceNo('');
    setAmount('');
    setDescription('');
    setReceivedBy(config?.bendahari || defaultOfficer);
    setAutoLedgerSync(true);
    setSelectedMemberId('');
    setFormMsg(null);
    setIsFormOpen(true);
  };

  // Autofill when a registered member is selected
  const handleMemberSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const memId = e.target.value;
    setSelectedMemberId(memId);
    if (!memId) return;
    const found = members.find(m => m.id === memId);
    if (found) {
      setPayerName(found.nama);
      setPayerIcOrReg(found.noKp || found.noAhli || '');
      setPayerPhone(found.noTelefon || '');
      setPayerEmail(found.emel || '');
    }
  };

  // Submit Handler
  const handleSubmitReceipt = async (e: React.FormEvent, shouldPrintImmediately = false) => {
    e.preventDefault();
    setFormMsg(null);

    const parsedAmount = parseFloat(amount);
    if (!payerName.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormMsg({ type: 'error', text: 'Sila lengkapkan nama pembayar dan jumlah bayaran yang sah.' });
      return;
    }

    let resolvedProgramName = '';
    if (selectedProgramId === 'custom' || !selectedProgramId) {
      if (!customProgramName.trim()) {
        setFormMsg({ type: 'error', text: 'Sila masukkan nama program khas.' });
        return;
      }
      resolvedProgramName = customProgramName.trim();
    } else {
      const match = programs.find(p => p.id === selectedProgramId);
      resolvedProgramName = match ? match.namaProgram : customProgramName.trim() || 'PROGRAM KHAS ALUMNI';
    }

    setIsSubmitting(true);

    const newReceiptPayload: Omit<ProgramReceipt, 'id' | 'createdAt'> = {
      receiptNo: receiptNo.trim() || nextReceiptNumber,
      date,
      payerName: payerName.trim(),
      payerIcOrReg: payerIcOrReg.trim() || undefined,
      payerPhone: payerPhone.trim() || undefined,
      payerEmail: payerEmail.trim() || undefined,
      programName: resolvedProgramName,
      programId: selectedProgramId !== 'custom' ? selectedProgramId : undefined,
      paymentCategory,
      paymentMethod,
      referenceNo: referenceNo.trim() || `REF-${Date.now().toString().slice(-6)}`,
      amount: parsedAmount,
      description: description.trim() || `Bayaran ${paymentCategory} bagi ${resolvedProgramName}`,
      receivedBy: receivedBy.trim() || defaultOfficer,
      status: 'Lunas',
      autoLedgerSync
    };

    try {
      const ok = await onAddReceipt(newReceiptPayload);
      if (ok) {
        // If autoLedgerSync is checked, simultaneously add income transaction into ledger
        if (autoLedgerSync && onAddTransaction) {
          await onAddTransaction({
            date: new Date(date).toISOString(),
            category: 'Aktiviti Persatuan',
            amount: parsedAmount,
            type: 'Income',
            description: `[${newReceiptPayload.receiptNo}] ${payerName.trim()} - ${resolvedProgramName}`,
            receiptUrl: `resit_${newReceiptPayload.receiptNo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
          });
        }

        setFormMsg({ type: 'success', text: `Resit ${newReceiptPayload.receiptNo} berjaya dijana!` });

        if (shouldPrintImmediately) {
          const fullReceipt: ProgramReceipt = {
            ...newReceiptPayload,
            id: `REC-${Date.now()}`,
            createdAt: new Date().toISOString()
          };
          setPrintReceipt(fullReceipt);
          setTimeout(() => {
            window.print();
          }, 350);
        }

        setIsFormOpen(false);
      } else {
        setFormMsg({ type: 'error', text: 'Gagal menjana resit ke pengkalan data. Sila cuba lagi.' });
      }
    } catch (err) {
      console.error('Error generating receipt:', err);
      setFormMsg({ type: 'error', text: 'Ralat semasa menyimpan resit.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Print existing receipt
  const handlePrintExisting = (receipt: ProgramReceipt) => {
    setPrintReceipt(receipt);
    setTimeout(() => {
      window.print();
    }, 350);
  };

  // Clean print state on afterprint
  React.useEffect(() => {
    const handleAfterPrint = () => {
      setPrintReceipt(null);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // Filter receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter(r => {
      const matchSearch =
        searchQuery === '' ||
        (r.receiptNo && r.receiptNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.payerName && r.payerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.programName && r.programName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.referenceNo && r.referenceNo.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchProgram = filterProgram === 'Semua' || r.programName === filterProgram;
      const matchMethod = filterMethod === 'Semua' || r.paymentMethod === filterMethod;

      return matchSearch && matchProgram && matchMethod;
    });
  }, [receipts, searchQuery, filterProgram, filterMethod]);

  // Calculations
  const totalReceiptsAmount = filteredReceipts.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const totalReceiptsCount = filteredReceipts.length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(val);
  };

  const formatDate = (isoOrStr: string) => {
    try {
      const d = new Date(isoOrStr);
      if (isNaN(d.getTime())) return isoOrStr;
      return d.toLocaleDateString('ms-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isoOrStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP STATS & ACTIONS HEADER (Screen only) */}
      <div className="print:hidden space-y-4">
        {/* Banner Card */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-blue-800/40 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 border border-blue-400/30">
                <Receipt className="w-3.5 h-3.5" />
                <span>Modul Kewangan • Resit & Invois Program Khas</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">Jana Resit Bayaran Program Khas</h2>
              <p className="text-xs text-blue-200/80 max-w-xl mt-1 leading-relaxed">
                Jana, rekod, dan cetak resit bayaran rasmi bagi kutipan yuran peserta, tajaan syarikat, sumbangan khas, serta sewaan gerai untuk program anjuran Persatuan Alumni KKBS.
              </p>
            </div>

            <button
              onClick={handleOpenForm}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition-all shrink-0 hover:scale-[1.02] active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Jana Resit Baharu</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-2xs flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Jumlah Kutipan Resit</p>
              <h4 className="text-lg font-black text-slate-800">{formatCurrency(totalReceiptsAmount)}</h4>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-2xs flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bilangan Resit Dikeluarkan</p>
              <h4 className="text-lg font-black text-slate-800">{totalReceiptsCount} Resit</h4>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-2xs flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Resit Terkini</p>
              <h4 className="text-xs font-black text-slate-800 truncate max-w-[160px]">
                {receipts.length > 0 ? receipts[0].receiptNo : 'Tiada rekod'}
              </h4>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Cari nombor resit, nama pembayar, atau rujukan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs outline-none bg-transparent font-medium text-slate-700 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Program:</span>
              <select
                value={filterProgram}
                onChange={(e) => setFilterProgram(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-blue-600 max-w-[170px] truncate"
              >
                <option value="Semua">Semua Program</option>
                {Array.from(new Set(receipts.map(r => r.programName).filter(Boolean))).map(prog => (
                  <option key={prog} value={prog}>{prog}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Kaedah:</span>
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-blue-600"
              >
                <option value="Semua">Semua Kaedah</option>
                {methodOptions.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SENARAI REKOD RESIT (Screen Table) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden print:hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            <span>Rekod Resit Bayaran Program Khas ({filteredReceipts.length})</span>
          </h4>
          <span className="text-[10px] font-bold text-slate-400">
            Jumlah: <strong className="text-slate-700">{formatCurrency(totalReceiptsAmount)}</strong>
          </span>
        </div>

        {filteredReceipts.length === 0 ? (
          <div className="text-center py-14 px-4">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Receipt className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-600">Tiada resit bayaran ditemui.</p>
            <p className="text-xs text-slate-400 mt-1">Klik butang "Jana Resit Baharu" untuk mula mengeluarkan resit program khas.</p>
            <button
              onClick={handleOpenForm}
              className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Jana Resit Pertama</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">No. Resit & Tarikh</th>
                  <th className="py-3 px-4">Diterima Daripada</th>
                  <th className="py-3 px-4">Program Khas & Kategori</th>
                  <th className="py-3 px-4">Kaedah & Rujukan</th>
                  <th className="py-3 px-4 text-right">Amaun (RM)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredReceipts.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-extrabold text-blue-700 font-mono block text-xs">{rec.receiptNo}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{formatDate(rec.date)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800 line-clamp-1">{rec.payerName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {rec.payerPhone ? `Tel: ${rec.payerPhone}` : rec.payerIcOrReg ? `ID: ${rec.payerIcOrReg}` : '-'}
                      </p>
                    </td>
                    <td className="py-3 px-4 max-w-[220px]">
                      <p className="font-semibold text-slate-800 text-xs truncate" title={rec.programName}>
                        {rec.programName}
                      </p>
                      <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 mt-0.5">
                        {rec.paymentCategory}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="font-medium text-slate-700 text-xs">{rec.paymentMethod}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Ruj: {rec.referenceNo || '-'}</p>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="font-black text-emerald-700 text-sm">
                        {formatCurrency(rec.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle className="w-2.5 h-2.5" />
                        <span>LUNAS</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedReceiptForPreview(rec)}
                          title="Papar Resit"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintExisting(rec)}
                          title="Cetak Resit Rasmi (PDF)"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Adakah anda pasti mahu memadamkan rekod resit ${rec.receiptNo}?`)) {
                              onDeleteReceipt(rec.id);
                            }
                          }}
                          title="Padam Rekod"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. MODAL: JANA RESIT BAHARU */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-800/80 rounded-xl">
                  <Receipt className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Jana Resit Bayaran Program Khas</h3>
                  <p className="text-[11px] text-blue-200">Resit Rasmi Persatuan Alumni Kolej Komuniti Beaufort</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-xl text-blue-200 hover:text-white hover:bg-blue-800/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => handleSubmitReceipt(e, false)} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold ${
                    formMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {formMsg.text}
                </div>
              )}

              {/* Section 1: Nombor & Tarikh Resit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                    No. Resit Rasmi
                  </label>
                  <input
                    type="text"
                    required
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    placeholder="Contoh: RESIT-PK/2026/001"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-blue-800 focus:outline-blue-600"
                  />
                  <span className="text-[9px] text-slate-400 mt-0.5 block">Format auto janaan sistem atau boleh disunting.</span>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                    Tarikh Bayaran / Resit
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-blue-600"
                  />
                </div>
              </div>

              {/* Section 2: Program Khas & Kategori */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                      Pilih Program Khas
                    </label>
                    <select
                      value={selectedProgramId}
                      onChange={(e) => setSelectedProgramId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-blue-600"
                    >
                      {programs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.namaProgram}
                        </option>
                      ))}
                      <option value="custom">+ Program Khas Baharu / Masukkan Manual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                      Kategori Bayaran
                    </label>
                    <select
                      value={paymentCategory}
                      onChange={(e) => setPaymentCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-blue-600"
                    >
                      {categoryOptions.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* If custom program selected */}
                {(selectedProgramId === 'custom' || programs.length === 0) && (
                  <div>
                    <label className="block text-[10px] font-black text-blue-700 uppercase mb-1">
                      Nama Program Khas (Manual)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: KURSUS KEMAHIRAN PEMBUATAN PASTRI ALUMNI 2026"
                      value={customProgramName}
                      onChange={(e) => setCustomProgramName(e.target.value)}
                      className="w-full bg-blue-50/50 border border-blue-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-blue-600"
                    />
                  </div>
                )}
              </div>

              {/* Section 3: Maklumat Pembayar */}
              <div className="border border-slate-200 p-3.5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Maklumat Pembayar / Peserta / Syarikat</span>
                  </h4>

                  {/* Optional Alumni Autofill */}
                  {members.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Isi dari Ahli:</span>
                      <select
                        value={selectedMemberId}
                        onChange={handleMemberSelect}
                        className="bg-slate-100 border border-slate-200 text-[10px] font-medium rounded-lg px-2 py-0.5 text-slate-600 cursor-pointer focus:outline-blue-500 max-w-[150px] truncate"
                      >
                        <option value="">-- Pilih Ahli --</option>
                        {members.map(m => (
                          <option key={m.id} value={m.id}>{m.nama}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                      Diterima Daripada (Nama Penuh / Syarikat / Agensi) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama individu, syarikat, atau agensi penaja"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                      No. Kad Pengenalan / Pendaftaran Syarikat
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 940215-12-5541 atau SSM 202201099"
                      value={payerIcOrReg}
                      onChange={(e) => setPayerIcOrReg(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                      No. Telefon
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 013-8899123"
                      value={payerPhone}
                      onChange={(e) => setPayerPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                      Emel (Pilihan)
                    </label>
                    <input
                      type="email"
                      placeholder="contoh@gmail.com"
                      value={payerEmail}
                      onChange={(e) => setPayerEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Maklumat Pembayaran */}
              <div className="border border-slate-200 p-3.5 rounded-xl space-y-3">
                <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>Maklumat Transaksi & Pembayaran</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                      Kaedah Bayaran
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-blue-600"
                    >
                      {methodOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                      No. Rujukan / Slip Transaksi
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: MBB-9821820 / No. Cek"
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                      Jumlah Bayaran (RM) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Contoh: 150.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-blue-400 rounded-xl px-3 py-2 text-sm font-black text-emerald-700 focus:outline-blue-600"
                    />
                  </div>
                </div>

                {/* Amount in words preview */}
                {amount && parseFloat(amount) > 0 && (
                  <div className="bg-emerald-50/70 border border-emerald-200/80 p-2.5 rounded-xl">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase">Jumlah Dalam Perkataan (Ejaan Rasmi):</p>
                    <p className="text-xs font-black text-emerald-900 mt-0.5">
                      {numberToMalayWords(parseFloat(amount))}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                    Keterangan / Butiran Tambahan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Bayaran yuran penyertaan 2 peserta bagi kursus kulinari khas"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                    Pegawai Penerima / Disediakan Oleh
                  </label>
                  <input
                    type="text"
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    placeholder="Nama Bendahari atau Pegawai Bertanggungjawab"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-blue-600"
                  />
                </div>
              </div>

              {/* Option: Auto-sync to Ledger */}
              <div className="bg-blue-50/60 border border-blue-200 p-3 rounded-xl flex items-center justify-between cursor-pointer" onClick={() => setAutoLedgerSync(!autoLedgerSync)}>
                <div className="flex items-center gap-2.5">
                  {autoLedgerSync ? (
                    <CheckSquare className="w-5 h-5 text-blue-700 shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-blue-900">
                      Rekodkan secara automatik ke dalam Buku Lejar Kewangan
                    </p>
                    <p className="text-[10px] text-blue-700">
                      Jumlah ini akan dimasukkan sebagai Pendapatan (Income) di bawah Penyata Lejar Persatuan.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-200 text-blue-900 uppercase">
                  Auto-Sync
                </span>
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all order-2 sm:order-1"
                >
                  Batal
                </button>

                <div className="flex-1 flex gap-2 order-1 sm:order-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-xs cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Resit Sahaja'}
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={(e) => handleSubmitReceipt(e, true)}
                    className="flex-1 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md shadow-blue-500/20 cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Jana & Cetak Resit</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: LIHAT / PREVIEW RESIT (Screen modal with quick print) */}
      {selectedReceiptForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-900 px-5 py-3.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-black uppercase tracking-wider">
                  Salinan Resit: {selectedReceiptForPreview.receiptNo}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceiptForPreview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-6 space-y-4">
              <div className="text-center pb-4 border-b border-slate-100">
                <img
                  src="/logo-alumni.png"
                  alt="Logo Alumni KKBS"
                  className="w-16 h-16 object-contain mx-auto mb-2"
                />
                <h3 className="font-black text-sm text-slate-800 uppercase tracking-tight">
                  Persatuan Alumni Kolej Komuniti Beaufort Sabah
                </h3>
                <p className="text-[10px] text-slate-500">Resit Rasmi Bayaran Program Khas</p>
                <span className="inline-block mt-2 font-mono font-black text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  {selectedReceiptForPreview.receiptNo}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Tarikh Bayaran</span>
                  <p className="font-bold text-slate-800">{formatDate(selectedReceiptForPreview.date)}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Status</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>LUNAS</span>
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Diterima Daripada</span>
                  <p className="font-black text-slate-800 text-sm">{selectedReceiptForPreview.payerName}</p>
                  {selectedReceiptForPreview.payerIcOrReg && (
                    <p className="text-[10px] text-slate-500">No. KP / Reg: {selectedReceiptForPreview.payerIcOrReg}</p>
                  )}
                  {selectedReceiptForPreview.payerPhone && (
                    <p className="text-[10px] text-slate-500">No. Tel: {selectedReceiptForPreview.payerPhone}</p>
                  )}
                </div>
                <div className="col-span-2 bg-slate-50 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Program Khas</span>
                  <p className="font-extrabold text-slate-800">{selectedReceiptForPreview.programName}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{selectedReceiptForPreview.paymentCategory}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Kaedah Bayaran</span>
                  <p className="font-bold text-slate-800">{selectedReceiptForPreview.paymentMethod}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">No. Rujukan</span>
                  <p className="font-bold text-slate-800 font-mono">{selectedReceiptForPreview.referenceNo || '-'}</p>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="font-bold text-xs text-slate-600 uppercase">Jumlah Bayaran</span>
                  <span className="text-xl font-black text-emerald-700">
                    {formatCurrency(selectedReceiptForPreview.amount)}
                  </span>
                </div>
                <div className="col-span-2 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/60">
                  <span className="text-[9px] font-bold text-emerald-800 uppercase block">Ejaan Ringgit Malaysia:</span>
                  <span className="text-xs font-black text-emerald-900 block mt-0.5">
                    {numberToMalayWords(selectedReceiptForPreview.amount)}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReceiptForPreview(null)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const r = selectedReceiptForPreview;
                    setSelectedReceiptForPreview(null);
                    handlePrintExisting(r);
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Resit Rasmi (A4 / PDF)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. DOKUMEN CETAKAN RASMI RESIT BAYARAN PROGRAM KHAS (Print-only A4 Official Layout) */}
      {printReceipt && (
        <div className="hidden print:block fixed inset-0 z-[99999] bg-white text-black p-0 m-0">
          <style dangerouslySetInnerHTML={{ __html: `
            @page {
              size: A4 portrait;
              margin: 12mm 15mm 15mm 15mm !important;
            }
            @media print {
              html, body, #root, main, div, table, tr, td, th {
                overflow: visible !important;
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
              }
              *::-webkit-scrollbar {
                display: none !important;
              }
              body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                background-color: #fff !important;
                color: #000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                font-family: Arial, Helvetica, sans-serif !important;
              }
            }
          `}} />

          <div style={{ width: '100%', boxSizing: 'border-box', color: '#000', fontSize: '12px', lineHeight: '1.4' }}>
            {/* Header Letterhead */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px double #000', paddingBottom: '12px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img
                  src="/logo-alumni.png"
                  alt="Logo"
                  style={{ width: '75px', height: '75px', objectFit: 'contain' }}
                />
                <div>
                  <h1 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    PERSATUAN ALUMNI KOLEJ KOMUNITI BEAUFORT SABAH
                  </h1>
                  <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#333' }}>
                    d.a. Kolej Komuniti Beaufort, Jalan Melalugus, Peti Surat 399, 89807 Beaufort, Sabah.
                  </p>
                  <p style={{ fontSize: '9px', margin: '2px 0 0 0', color: '#444' }}>
                    Laman Web: alumni-kkbs.vercel.app &nbsp;|&nbsp; Emel: alumni.kkbs@gmail.com
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ border: '2px solid #000', padding: '6px 12px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>
                  <span style={{ fontSize: '9px', fontWeight: 'bold', display: 'block', textTransform: 'uppercase' }}>NO. RESIT</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace' }}>{printReceipt.receiptNo}</span>
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div style={{ textAlign: 'center', margin: '14px 0 16px 0' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0', textDecoration: 'underline' }}>
                RESIT RASMI BAYARAN PROGRAM KHAS
              </h2>
              <p style={{ fontSize: '10px', fontStyle: 'italic', margin: '2px 0 0 0', color: '#444' }}>
                OFFICIAL RECEIPT - SPECIAL PROGRAMME PAYMENT
              </p>
            </div>

            {/* Payer and Metadata Info Box */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '11px', border: '1px solid #000' }}>
              <tbody>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <td colSpan={2} style={{ padding: '6px 10px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #000' }}>
                    A. MAKLUMAT PEMBAYAR & PROGRAM
                  </td>
                  <td style={{ padding: '6px 10px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #000', borderLeft: '1px solid #000' }}>
                    B. STATUS & TARIKH
                  </td>
                </tr>
                <tr>
                  <td style={{ width: '22%', padding: '6px 10px', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>
                    Diterima Daripada:
                  </td>
                  <td style={{ width: '45%', padding: '6px 10px', fontWeight: 'bold', fontSize: '12px', borderBottom: '1px solid #ddd' }}>
                    {printReceipt.payerName}
                  </td>
                  <td rowSpan={3} style={{ width: '33%', padding: '8px 10px', borderLeft: '1px solid #000', verticalAlign: 'top' }}>
                    <div style={{ marginBottom: '6px' }}>
                      <span style={{ fontSize: '9px', color: '#555', display: 'block' }}>TARIKH BAYARAN:</span>
                      <strong style={{ fontSize: '11px' }}>{formatDate(printReceipt.date)}</strong>
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      <span style={{ fontSize: '9px', color: '#555', display: 'block' }}>STATUS BAYARAN:</span>
                      <span style={{ display: 'inline-block', backgroundColor: '#e6f7ec', border: '1px solid #28a745', color: '#155724', fontWeight: 'bold', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>
                        ✓ LUNAS (PAID)
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '9px', color: '#555', display: 'block' }}>NO. RUJUKAN TRANSAKSI:</span>
                      <strong style={{ fontFamily: 'monospace', fontSize: '10px' }}>{printReceipt.referenceNo || '-'}</strong>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 10px', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>
                    No. KP / No. Rujukan:
                  </td>
                  <td style={{ padding: '6px 10px', borderBottom: '1px solid #ddd' }}>
                    {printReceipt.payerIcOrReg || '-'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 10px', fontWeight: 'bold' }}>
                    No. Telefon / Emel:
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    {printReceipt.payerPhone || '-'} {printReceipt.payerEmail ? `(${printReceipt.payerEmail})` : ''}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Particulars Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', fontSize: '11px', border: '1px solid #000' }}>
              <thead>
                <tr style={{ backgroundColor: '#e9ecef', borderBottom: '1px solid #000' }}>
                  <th style={{ width: '6%', padding: '8px', borderRight: '1px solid #000', textAlign: 'center' }}>BIL</th>
                  <th style={{ width: '54%', padding: '8px', borderRight: '1px solid #000', textAlign: 'left' }}>PERIHAL PROGRAM KHAS & KETERANGAN BAYARAN</th>
                  <th style={{ width: '22%', padding: '8px', borderRight: '1px solid #000', textAlign: 'left' }}>KAEDAH & KATEGORI</th>
                  <th style={{ width: '18%', padding: '8px', textAlign: 'right' }}>JUMLAH (RM)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ minHeight: '90px', verticalAlign: 'top' }}>
                  <td style={{ padding: '10px 8px', borderRight: '1px solid #000', textAlign: 'center', fontWeight: 'bold' }}>
                    1
                  </td>
                  <td style={{ padding: '10px 10px', borderRight: '1px solid #000' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase' }}>
                      {printReceipt.programName}
                    </div>
                    <div style={{ marginTop: '4px', color: '#333', fontSize: '10.5px' }}>
                      {printReceipt.description || `Bayaran ${printReceipt.paymentCategory}`}
                    </div>
                  </td>
                  <td style={{ padding: '10px 10px', borderRight: '1px solid #000' }}>
                    <div style={{ fontWeight: 'bold' }}>{printReceipt.paymentCategory}</div>
                    <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>
                      Kaedah: {printReceipt.paymentMethod}
                    </div>
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '12px' }}>
                    {printReceipt.amount.toFixed(2)}
                  </td>
                </tr>

                {/* Blank spacing lines for professional look */}
                <tr style={{ height: '35px' }}>
                  <td style={{ borderRight: '1px solid #000' }}></td>
                  <td style={{ borderRight: '1px solid #000' }}></td>
                  <td style={{ borderRight: '1px solid #000' }}></td>
                  <td></td>
                </tr>

                {/* Subtotal / Total Row */}
                <tr style={{ backgroundColor: '#f2f2f2', borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
                  <td colSpan={3} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', borderRight: '1px solid #000', fontSize: '11px', textTransform: 'uppercase' }}>
                    JUMLAH KESELURUHAN (TOTAL AMOUNT):
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                    RM {printReceipt.amount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Ringgit In Words Box */}
            <div style={{ border: '1px solid #000', padding: '8px 12px', backgroundColor: '#fafafa', marginBottom: '22px' }}>
              <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#444', textTransform: 'uppercase', display: 'block' }}>
                RINGGIT MALAYSIA DALAM PERKATAAN:
              </span>
              <strong style={{ fontSize: '11.5px', textTransform: 'uppercase', display: 'block', marginTop: '2px' }}>
                {numberToMalayWords(printReceipt.amount)}
              </strong>
            </div>

            {/* Official Stamp & Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '24px', pageBreakInside: 'avoid' }}>
              {/* Left: Stamp & Verification QR */}
              <div style={{ width: '48%', border: '1px dashed #666', padding: '12px', display: 'flex', alignItems: 'center', gap: '14px', borderRadius: '4px' }}>
                <div style={{ border: '1px solid #999', padding: '4px', backgroundColor: '#fff', textAlign: 'center' }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(
                      `PERSATUAN ALUMNI KKBS\nRESIT: ${printReceipt.receiptNo}\nTARIKH: ${printReceipt.date}\nPEMBAYAR: ${printReceipt.payerName}\nJUMLAH: RM ${printReceipt.amount.toFixed(2)}\nPROGRAM: ${printReceipt.programName}`
                    )}`}
                    alt="Kod Pengesahan"
                    style={{ width: '65px', height: '65px', display: 'block' }}
                  />
                  <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#666', marginTop: '2px', display: 'block' }}>KOD SAH RESIT</span>
                </div>
                <div>
                  <div style={{ border: '2px solid #1e3a8a', padding: '4px 8px', borderRadius: '4px', color: '#1e3a8a', textAlign: 'center' }}>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', display: 'block' }}>DISAHKAN LUNAS</span>
                    <span style={{ fontSize: '8px', display: 'block' }}>PERSATUAN ALUMNI KKBS</span>
                  </div>
                  <p style={{ fontSize: '8px', color: '#555', margin: '4px 0 0 0' }}>
                    Resit ini sah diperakui melalui janaan pangkalan data rasmi Persatuan Alumni Kolej Komuniti Beaufort.
                  </p>
                </div>
              </div>

              {/* Right: Signature Section */}
              <div style={{ width: '45%', textAlign: 'center', paddingLeft: '20px' }}>
                <p style={{ fontSize: '10px', margin: '0 0 45px 0', fontWeight: 'normal', textAlign: 'left' }}>
                  Disediakan / Diterima oleh:
                </p>
                <div style={{ borderBottom: '1px solid #000', width: '80%', margin: '0 auto 4px auto' }}></div>
                <strong style={{ fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>
                  {printReceipt.receivedBy || 'BENDAHARI PERSATUAN ALUMNI'}
                </strong>
                <span style={{ fontSize: '9.5px', color: '#444', display: 'block' }}>
                  Bendahari / Pegawai Persatuan Alumni
                </span>
                <span style={{ fontSize: '9px', color: '#666', display: 'block' }}>
                  Kolej Komuniti Beaufort Sabah
                </span>
              </div>
            </div>

            {/* Bottom Disclaimer */}
            <div style={{ marginTop: '30px', borderTop: '1px solid #ccc', paddingTop: '6px', textAlign: 'center', fontSize: '8.5px', color: '#777' }}>
              Peringatan: Sila simpan resit rasmi ini sebagai bukti pembayaran yang sah bagi urusan rekod, audit persatuan, dan pendaftaran program.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
