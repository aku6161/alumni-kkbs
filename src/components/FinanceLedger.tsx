import React, { useState } from 'react';
import { Transaction } from '../types';
import { PlusCircle, ArrowDownCircle, ArrowUpCircle, Trash2, Calendar, FileText, Image, Printer } from 'lucide-react';

interface FinanceLedgerProps {
  transactions: Transaction[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => Promise<boolean>;
  onDeleteTransaction: (id: string) => Promise<boolean>;
}

export const FinanceLedger: React.FC<FinanceLedgerProps> = ({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'add'>('roster');
  const [selectedYear, setSelectedYear] = useState<string>('Semua');

  const handlePrint = () => {
    window.print();
  };

  const years = Array.from(
    new Set(
      transactions
        .map(t => {
          try {
            return new Date(t.date).getFullYear().toString();
          } catch {
            return '';
          }
        })
        .filter(y => y && !isNaN(Number(y)))
    )
  ).sort((a, b) => b.localeCompare(a));

  // New Transaction Form State
  const [type, setType] = useState<'Income' | 'Expense'>('Income');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [receiptUrl, setReceiptUrl] = useState('');
  const [formMsg, setFormMsg] = useState<{ status: 'success' | 'error'; text: string } | null>(null);

  const incomeCategories = ["Yuran Keahlian", "Sumbangan", "Tajaan", "Aktiviti Persatuan", "Lain-lain"];
  const expenseCategories = ["Program Alumni", "Pentadbiran", "Kebajikan & Bantuan", "Cenderahati", "Lain-lain"];

  const filteredTransactions = transactions.filter(t => {
    if (selectedYear === 'Semua') return true;
    try {
      return new Date(t.date).getFullYear().toString() === selectedYear;
    } catch {
      return false;
    }
  });

  // Calculators
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const balance = totalIncome - totalExpense;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    const numAmount = parseFloat(amount.trim());
    if (!category || isNaN(numAmount) || numAmount <= 0 || !description) {
      setFormMsg({ status: 'error', text: 'Sila lengkapkan semua ruangan wajib.' });
      return;
    }

    const ok = await onAddTransaction({
      date: new Date(date).toISOString(),
      category,
      amount: numAmount,
      type,
      description,
      receiptUrl
    });

    if (ok) {
      setFormMsg({ status: 'success', text: 'Transaksi berjaya direkodkan!' });
      setCategory('');
      setAmount('');
      setDescription('');
      setReceiptUrl('');
    } else {
      setFormMsg({ status: 'error', text: 'Gagal merekod transaksi. Sila cuba semula.' });
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Finance Portal Subtabs */}
      <div className="flex border-b border-slate-200 print:hidden">
        <button
          onClick={() => setActiveTab('roster')}
          className={`py-2.5 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'roster' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Ringkasan & Lejar
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`py-2.5 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'add' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Rekod Transaksi
        </button>
      </div>

      {activeTab === 'roster' ? (
        <div className="space-y-6">
          {/* Print-only Header */}
          <div className="hidden print:block border-b border-slate-300 pb-4 mb-6">
            <h1 className="text-xl font-black text-slate-900 uppercase">Penyata Kewangan Tahunan ({selectedYear === 'Semua' ? 'Semua Tahun' : selectedYear})</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Persatuan Alumni Kolej Komuniti Beaufort, Sabah</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Tarikh Cetakan: {new Date().toLocaleDateString('ms-MY')}</p>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
            <div className="bg-linear-to-br from-blue-700 to-blue-900 text-white p-5 rounded-2xl shadow-xs print:bg-blue-800 print:text-white">
              <p className="text-[10px] text-blue-100 print:text-white font-bold uppercase tracking-wider">Baki Akaun Persatuan</p>
              <h3 className="text-2xl font-black mt-1 text-white print:text-white">{formatCurrency(balance)}</h3>
            </div>
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-2xs flex items-center gap-3 print:border print:border-slate-200">
              <ArrowDownCircle className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Jumlah Pendapatan</p>
                <h3 className="text-lg font-black text-emerald-700">{formatCurrency(totalIncome)}</h3>
              </div>
            </div>
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-2xs flex items-center gap-3 print:border print:border-slate-200">
              <ArrowUpCircle className="w-8 h-8 text-rose-600 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Jumlah Belanja</p>
                <h3 className="text-lg font-black text-rose-700">{formatCurrency(totalExpense)}</h3>
              </div>
            </div>
          </div>

          {/* Ledger List */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden print:border-none print:shadow-none">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center print:hidden flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">Penyata Buku Lejar Kewangan</h4>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Pilih Tahun:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-blue-600 text-slate-700 cursor-pointer"
                  >
                    <option value="Semua">Semua Tahun</option>
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Penyata Tahunan</span>
              </button>
            </div>

            {/* Print-only title */}
            <div className="hidden print:block py-3 border-b border-slate-200 mt-6">
              <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider font-sans">
                Penyata Buku Lejar Kewangan ({selectedYear === 'Semua' ? 'Semua Tahun' : selectedYear})
              </h4>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold">
                Tiada rekod transaksi kewangan ditemui.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTransactions.map(t => {
                  const isIncome = t.type === 'Income';
                  return (
                    <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {isIncome ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-slate-800">{t.category}</p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                            {new Date(t.date).toLocaleDateString('ms-MY')} • Ref: {t.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`font-black text-sm ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isIncome ? '+' : '-'} {formatCurrency(t.amount)}
                        </span>
                        
                        <button
                          onClick={() => {
                            if (window.confirm('Adakah anda pasti mahu memadam rekod kewangan ini?')) {
                              onDeleteTransaction(t.id);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 transition-all cursor-pointer print:hidden"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Signature Section - print only */}
          <div className="hidden print:flex justify-between items-start pt-16 px-4 text-xs mt-12 font-sans print:break-inside-avoid">
            {/* Left signature */}
            <div className="w-[40%] space-y-12">
              <p className="font-bold">Disediakan oleh:</p>
              <div className="space-y-1">
                <p className="font-bold">____________________</p>
                <p className="font-bold text-slate-800">Bendahari</p>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">Persatuan Alumni Kolej Komuniti Beaufort Sabah</p>
              </div>
            </div>

            {/* Right signature */}
            <div className="w-[40%] space-y-12">
              <p className="font-bold">Diaudit oleh:</p>
              <div className="space-y-1">
                <p className="font-bold">_____________________</p>
                <p className="font-bold text-slate-800">Juruaudit</p>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">Persatuan Alumni Kolej Komuniti Beaufort Sabah</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Record transaction form */
        <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-2">Daftar Rekod Kewangan Baharu</h3>

            {formMsg && (
              <div className={`p-3.5 rounded-xl text-xs font-bold ${
                formMsg.status === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
              }`}>
                {formMsg.text}
              </div>
            )}

            {/* Type toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Jenis Transaksi</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setType('Income'); setCategory(''); }}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs cursor-pointer border transition-all ${
                    type === 'Income' 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Pendapatan / Masuk
                </button>
                <button
                  type="button"
                  onClick={() => { setType('Expense'); setCategory(''); }}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs cursor-pointer border transition-all ${
                    type === 'Expense' 
                      ? 'bg-rose-50 border-rose-300 text-rose-700' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Perbelanjaan / Keluar
                </button>
              </div>
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-blue-600"
              >
                <option value="">-- Pilih Kategori --</option>
                {(type === 'Income' ? incomeCategories : expenseCategories).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Jumlah (RM)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Contoh: 150.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-blue-600"
              />
            </div>

            {/* Reference */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rujukan / Penerangan Ringkas</label>
              <input
                type="text"
                placeholder="Contoh: Yuran Ahli Baru / Resit D-045"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-blue-600"
              />
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tarikh Transaksi</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-blue-600"
              />
            </div>

            {/* Mock Attachment uploads */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fail Lampiran Gambar Resit</label>
              <button
                type="button"
                onClick={() => {
                  setReceiptUrl(`resit_alumni_${Date.now()}.png`);
                }}
                className="w-full border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all text-xs font-bold text-slate-500"
              >
                <Image className="w-4 h-4 text-blue-600" />
                <span>{receiptUrl || 'Pilih/Lampirkan Resit'}</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all"
              >
                Simpan Transaksi
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
