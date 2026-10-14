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
  QrCode,
  ShieldCheck
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

// Helper: Convert numbers into Malay words for official receipts
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

// Helper: Format date
export const formatDisplayDate = (isoOrStr: string) => {
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

// Reusable Official Receipt Document Component (used for Screen Modal Preview & Browser Printing)
export const OfficialReceiptDocument: React.FC<{ receipt: ProgramReceipt }> = ({ receipt }) => {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '780px',
        margin: '0 auto',
        padding: '24px 28px',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '11px',
        lineHeight: '1.4',
        boxSizing: 'border-box'
      }}
    >
      {/* 1. Header Letterhead - Kotak No. Resit di bahagian atas telah dipadam */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          borderBottom: '3px double #000000',
          paddingBottom: '12px',
          marginBottom: '14px'
        }}
      >
        <img
          src="/logo-alumni.png"
          alt="Logo Alumni KKBS"
          style={{ width: '75px', height: '75px', objectFit: 'contain' }}
        />
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontSize: '13.5px',
              fontWeight: 'bold',
              margin: '0',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              color: '#000'
            }}
          >
            PERSATUAN ALUMNI KOLEJ KOMUNITI BEAUFORT SABAH
          </h1>
          <p style={{ fontSize: '9.5px', margin: '2px 0 0 0', color: '#333' }}>
            d.a. Kolej Komuniti Beaufort, Jalan Melalugus, Peti Surat 399, 89807 Beaufort, Sabah.
          </p>
          <p style={{ fontSize: '9px', margin: '2px 0 0 0', color: '#555' }}>
            Laman Web: alumni-kkbs.vercel.app &nbsp;|&nbsp; Emel: alumni.kkbs@gmail.com
          </p>
        </div>
      </div>

      {/* 2. Document Title - Ditukar ke [RESIT RASMI BAYARAN] */}
      <div style={{ textAlign: 'center', margin: '14px 0 16px 0' }}>
        <h2
          style={{
            fontSize: '14px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            margin: '0',
            textDecoration: 'underline',
            letterSpacing: '0.5px'
          }}
        >
          RESIT RASMI BAYARAN
        </h2>
      </div>

      {/* 3. Maklumat Pembayar & Transaksi (Biasa, bukan jadual kotak, ada no resit, tarikh, nama, no telefon, kaedah bayaran) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: '8px 24px',
          marginBottom: '16px',
          fontSize: '11px',
          lineHeight: '1.6'
        }}
      >
        <div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '105px', color: '#333', fontWeight: '500' }}>No. Resit</span>
            <span style={{ width: '12px' }}>:</span>
            <strong style={{ fontFamily: 'monospace', fontSize: '12px', color: '#000' }}>{receipt.receiptNo}</strong>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '105px', color: '#333', fontWeight: '500' }}>Tarikh</span>
            <span style={{ width: '12px' }}>:</span>
            <strong style={{ color: '#000' }}>{formatDisplayDate(receipt.date)}</strong>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '105px', color: '#333', fontWeight: '500' }}>Kaedah Bayaran</span>
            <span style={{ width: '12px' }}>:</span>
            <strong style={{ color: '#000' }}>
              {receipt.paymentMethod}
              {receipt.referenceNo ? ` (Ruj: ${receipt.referenceNo})` : ''}
            </strong>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '105px', color: '#333', fontWeight: '500' }}>Nama</span>
            <span style={{ width: '12px' }}>:</span>
            <strong style={{ textTransform: 'uppercase', color: '#000' }}>{receipt.payerName}</strong>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={{ width: '105px', color: '#333', fontWeight: '500' }}>No. Telefon</span>
            <span style={{ width: '12px' }}>:</span>
            <strong style={{ color: '#000' }}>{receipt.payerPhone || '-'}</strong>
          </div>
          {receipt.payerIcOrReg && (
            <div style={{ display: 'flex' }}>
              <span style={{ width: '105px', color: '#333', fontWeight: '500' }}>No. KP / Syarikat</span>
              <span style={{ width: '12px' }}>:</span>
              <span style={{ color: '#000' }}>{receipt.payerIcOrReg}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Particulars Table (Kolum Kaedah & Kategori dipadam, tajuk kolum [PERIHAL BAYARAN]) */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '14px',
          fontSize: '11px',
          border: '1px solid #000'
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#e9ecef', borderBottom: '1px solid #000' }}>
            <th style={{ width: '8%', padding: '8px', borderRight: '1px solid #000', textAlign: 'center' }}>BIL</th>
            <th style={{ width: '70%', padding: '8px 10px', borderRight: '1px solid #000', textAlign: 'left' }}>
              PERIHAL BAYARAN
            </th>
            <th style={{ width: '22%', padding: '8px 10px', textAlign: 'right' }}>JUMLAH (RM)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ minHeight: '85px', verticalAlign: 'top' }}>
            <td style={{ padding: '10px 8px', borderRight: '1px solid #000', textAlign: 'center', fontWeight: 'bold' }}>
              1
            </td>
            <td style={{ padding: '10px 10px', borderRight: '1px solid #000' }}>
              <div style={{ fontWeight: 'bold', fontSize: '11.5px', textTransform: 'uppercase' }}>
                {receipt.programName}
              </div>
              <div style={{ marginTop: '4px', color: '#333', fontSize: '10.5px' }}>
                {receipt.description || `Bayaran ${receipt.paymentCategory}`}
              </div>
            </td>
            <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '12px' }}>
              {receipt.amount.toFixed(2)}
            </td>
          </tr>

          {/* Spacer row */}
          <tr style={{ height: '35px' }}>
            <td style={{ borderRight: '1px solid #000' }}></td>
            <td style={{ borderRight: '1px solid #000' }}></td>
            <td></td>
          </tr>

          {/* Total Row */}
          <tr style={{ backgroundColor: '#f1f3f5', borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
            <td
              colSpan={2}
              style={{
                padding: '8px 10px',
                textAlign: 'right',
                fontWeight: 'bold',
                borderRight: '1px solid #000',
                fontSize: '11px',
                textTransform: 'uppercase'
              }}
            >
              JUMLAH KESELURUHAN:
            </td>
            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
              RM {receipt.amount.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 5. Ringgit in Words Box */}
      <div
        style={{
          border: '1px solid #000',
          padding: '8px 12px',
          backgroundColor: '#fafafa',
          marginBottom: '20px'
        }}
      >
        <span style={{ fontSize: '8.5px', fontWeight: 'bold', color: '#444', textTransform: 'uppercase', display: 'block' }}>
          RINGGIT MALAYSIA DALAM PERKATAAN:
        </span>
        <strong style={{ fontSize: '11px', textTransform: 'uppercase', display: 'block', marginTop: '2px', color: '#000' }}>
          {numberToMalayWords(receipt.amount)}
        </strong>
      </div>

      {/* 6. Official Stamp & Signatures - Padam "DISAHKAN LUNAS PERSATUAN ALUMNI KKBS", QR kod square sempurna */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '20px',
          pageBreakInside: 'avoid'
        }}
      >
        {/* Left: Square QR Code */}
        <div style={{ textAlign: 'center', width: '130px' }}>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=${encodeURIComponent(
              `RESIT RASMI BAYARAN: ${receipt.receiptNo}\nTARIKH: ${receipt.date}\nNAMA: ${receipt.payerName}\nJUMLAH: RM ${receipt.amount.toFixed(2)}\nKAEDAH: ${receipt.paymentMethod}`
            )}`}
            alt="QR Code"
            style={{
              width: '85px',
              height: '85px',
              display: 'block',
              margin: '0 auto',
              border: '1px solid #000',
              padding: '3px',
              backgroundColor: '#fff',
              boxSizing: 'border-box'
            }}
          />
          <span style={{ fontSize: '7.5px', color: '#333', display: 'block', marginTop: '4px', fontWeight: 'bold', letterSpacing: '0.3px' }}>
            IMBAS KOD PENGESAHAN
          </span>
        </div>

        {/* Right: Signature Section */}
        <div style={{ width: '45%', textAlign: 'center', paddingLeft: '16px' }}>
          <p style={{ fontSize: '9.5px', margin: '0 0 45px 0', fontWeight: 'normal', textAlign: 'left' }}>
            Disediakan / Diterima oleh:
          </p>
          <div style={{ borderBottom: '1px solid #000', width: '85%', margin: '0 auto 4px auto' }}></div>
          <strong style={{ fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>
            {receipt.receivedBy || 'BENDAHARI PERSATUAN ALUMNI'}
          </strong>
          <span style={{ fontSize: '9px', color: '#444', display: 'block' }}>
            Bendahari / Pegawai Persatuan Alumni
          </span>
          <span style={{ fontSize: '8.5px', color: '#666', display: 'block' }}>
            Kolej Komuniti Beaufort Sabah
          </span>
        </div>
      </div>

      {/* 7. Bottom Disclaimer */}
      <div
        style={{
          marginTop: '24px',
          borderTop: '1px solid #ccc',
          paddingTop: '6px',
          textAlign: 'center',
          fontSize: '8px',
          color: '#666'
        }}
      >
        Peringatan: Sila simpan resit rasmi ini sebagai bukti pembayaran yang sah bagi urusan rekod, audit persatuan, dan pendaftaran program.
      </div>
    </div>
  );
};

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

  // Generate automatic receipt number: e.g. RESIT-PK/2026/001
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

  // Member selector
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

  // Direct Print & Preview Trigger: opens on-screen preview AND browser print dialog
  const handleTriggerPrint = (receipt: ProgramReceipt) => {
    setPrintReceipt(receipt);
    setSelectedReceiptForPreview(receipt);
    setTimeout(() => {
      window.print();
    }, 250);
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

        const fullReceipt: ProgramReceipt = {
          ...newReceiptPayload,
          id: `REC-${Date.now()}`,
          createdAt: new Date().toISOString()
        };

        setIsFormOpen(false);

        if (shouldPrintImmediately) {
          handleTriggerPrint(fullReceipt);
        } else {
          setSelectedReceiptForPreview(fullReceipt);
        }
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

  return (
    <div className="space-y-6">
      {/* 1. SCREEN BROWSING UI (Hidden completely during printing) */}
      <div className="space-y-6 print:hidden">
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

        {/* Table of Receipts */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
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
                    <th className="py-3 px-4 text-right">Tindakan Cetakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredReceipts.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-extrabold text-blue-700 font-mono block text-xs">{rec.receiptNo}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{formatDisplayDate(rec.date)}</span>
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
                          {/* Main Print Button */}
                          <button
                            onClick={() => handleTriggerPrint(rec)}
                            title="Cetak Resit Rasmi (A4 / PDF)"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-xs transition-all cursor-pointer border border-blue-200"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak</span>
                          </button>

                          {/* Preview Button */}
                          <button
                            onClick={() => {
                              setSelectedReceiptForPreview(rec);
                              setPrintReceipt(rec);
                            }}
                            title="Papar Resit"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
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
      </div>

      {/* 2. MODAL: JANA RESIT BAHARU (Screen only) */}
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
              <div
                className="bg-blue-50/60 border border-blue-200 p-3 rounded-xl flex items-center justify-between cursor-pointer"
                onClick={() => setAutoLedgerSync(!autoLedgerSync)}
              >
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

      {/* 3. MODAL: PAPARAN CETAKAN RESIT RASMI DI SKRIN (Screen Preview Modal) */}
      {selectedReceiptForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:hidden">
          <div className="bg-slate-100 rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-300 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            {/* Modal Top Bar */}
            <div className="bg-slate-900 px-6 py-3.5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-600/30 rounded-lg text-blue-400">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">
                    Paparan Cetakan Resit Rasmi: {selectedReceiptForPreview.receiptNo}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Sahkan maklumat resit di bawah dan klik butang "Cetak / Simpan PDF"
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPrintReceipt(selectedReceiptForPreview);
                    setTimeout(() => {
                      window.print();
                    }, 200);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/30 cursor-pointer transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Simpan PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedReceiptForPreview(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Paper Container on Screen */}
            <div className="p-4 sm:p-8 overflow-y-auto bg-slate-200/80 flex justify-center">
              <div className="bg-white rounded-xl shadow-xl border border-slate-300 w-full max-w-[760px] p-6 sm:p-8">
                <OfficialReceiptDocument receipt={selectedReceiptForPreview} />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-white px-6 py-3 border-t border-slate-200 flex justify-between items-center shrink-0">
              <span className="text-[11px] font-medium text-slate-500">
                Pilihan saiz cetakan disyorkan: <strong>A4 Potret (Portrait)</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReceiptForPreview(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Tutup Paparan
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPrintReceipt(selectedReceiptForPreview);
                    setTimeout(() => {
                      window.print();
                    }, 200);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. DOKUMEN CETAKAN ASAL (Hanya dipaparkan semasa cetakan sebenar / browser print dialog) */}
      {printReceipt && (
        <div
          className="hidden print:block print-container"
          style={{
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            color: '#000000',
            margin: '0 auto',
            padding: '0'
          }}
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 12mm 12mm !important;
            }
            @media print {
              html, body, #root, main, div, table, tr, td, th {
                overflow: visible !important;
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
              }
              *::-webkit-scrollbar,
              html::-webkit-scrollbar,
              body::-webkit-scrollbar {
                display: none !important;
                width: 0 !important;
                height: 0 !important;
              }
              body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                background-color: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                font-family: Arial, Helvetica, sans-serif !important;
              }
              .print-container {
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 auto !important;
                padding: 0 !important;
                box-sizing: border-box !important;
                overflow: visible !important;
              }
              .no-print, .print\\:hidden {
                display: none !important;
              }
            }
          `
            }}
          />

          <OfficialReceiptDocument receipt={printReceipt} />
        </div>
      )}
    </div>
  );
};
