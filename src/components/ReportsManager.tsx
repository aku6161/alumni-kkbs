import React, { useState } from 'react';
import { AlumniMember, Transaction } from '../types';
import { FileDown, Printer, FileText, Table } from 'lucide-react';

interface ReportsManagerProps {
  members: AlumniMember[];
  transactions: Transaction[];
}

export const ReportsManager: React.FC<ReportsManagerProps> = ({ members, transactions }) => {
  const [reportType, setReportType] = useState<'members' | 'finance'>('members');
  const [statusFilter, setStatusFilter] = useState('Semua');

  // Convert array to CSV string and download
  const downloadCsv = (headers: string[], rows: string[][], filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (reportType === 'members') {
      const activeList = members.filter(m => statusFilter === 'Semua' || m.status === statusFilter);
      const headers = ["No. Ahli", "Nama", "No. KP", "No. Pendaftaran", "Tahun Lulusan", "Program", "Telefon", "E-mel", "Pekerjaan", "Majikan", "Negeri", "Status"];
      const rows = activeList.map(m => [
        m.noAhli || '-',
        m.nama,
        m.noKp,
        m.noPendaftaran,
        m.tahunLulusan,
        m.program,
        m.noTelefon,
        m.emel,
        m.pekerjaanJawatan,
        m.namaMajikan,
        m.negeri,
        m.status
      ]);
      downloadCsv(headers, rows, `Roster_Alumni_KKBS_${statusFilter}`);
    } else {
      const headers = ["Tarikh", "Jenis", "Kategori", "Jumlah (RM)", "Keterangan"];
      const rows = transactions.map(t => [
        new Date(t.date).toLocaleDateString('ms-MY'),
        t.type === 'Income' ? 'PENDAPATAN' : 'PERBELANJAAN',
        t.category,
        t.amount.toString(),
        t.description
      ]);
      downloadCsv(headers, rows, "Penyata_Kewangan_Alumni_KKBS");
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const activeFilteredList = members.filter(m => statusFilter === 'Semua' || m.status === statusFilter);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-5">
        <div>
          <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-1">Modul Laporan Database</h3>
          <p className="text-xs text-slate-500">Jana fail laporan bercetak (PDF) atau hamparan Excel (CSV) bagi ahli alumni dan ledger kewangan.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category selection */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kategori Laporan</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'members' | 'finance')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-blue-600 font-semibold text-slate-700"
            >
              <option value="members">Direktori Roster Alumni</option>
              <option value="finance">Penyata Buku Kewangan</option>
            </select>
          </div>

          {/* Conditional filter dropdown */}
          {reportType === 'members' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status Keahlian</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-blue-600 font-semibold text-slate-700"
              >
                <option value="Semua">Semua Rekod</option>
                <option value="Active">Aktif</option>
                <option value="Inactive">Tidak Aktif</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 print:hidden">
          <button
            onClick={handleExportExcel}
            className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
          >
            <Table className="w-4 h-4" />
            <span>Eksport Excel (CSV)</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF Laporan</span>
          </button>
        </div>
      </div>

      {/* Printer-friendly layout wrapper */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-4 print:p-0 print:border-none print:shadow-none">
        <div className="border-b border-slate-200 pb-3 flex justify-between items-end">
          <div>
            <h2 className="font-extrabold text-sm text-slate-800 uppercase">
              {reportType === 'members' ? 'Laporan Roster Pendaftaran Ahli' : 'Penyata Aliran Tunai Persatuan'}
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Tarikh Laporan: {new Date().toLocaleDateString('ms-MY')}</p>
          </div>
          <span className="text-[9px] font-bold text-slate-400 font-mono">PERSATUAN ALUMNI KKBS</span>
        </div>

        {reportType === 'members' ? (
          /* Members Report Table */
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase">
                  <th className="p-2">No. Ahli</th>
                  <th className="p-2">Nama Alumni</th>
                  <th className="p-2">No. KP</th>
                  <th className="p-2">Program Pengajian</th>
                  <th className="p-2">Tahun</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeFilteredList.map(m => (
                  <tr key={m.id}>
                    <td className="p-2 font-semibold font-mono">{m.noAhli || '-'}</td>
                    <td className="p-2 font-bold text-slate-800 uppercase">{m.nama}</td>
                    <td className="p-2">{m.noKp}</td>
                    <td className="p-2 truncate max-w-[120px]">{m.program}</td>
                    <td className="p-2">{m.tahunLulusan}</td>
                    <td className="p-2 font-bold">{m.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Financial statement report */
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase">
                  <th className="p-2">Tarikh</th>
                  <th className="p-2">Jenis</th>
                  <th className="p-2">Kategori</th>
                  <th className="p-2">Penerangan</th>
                  <th className="p-2 text-right">Jumlah (RM)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td className="p-2">{new Date(t.date).toLocaleDateString('ms-MY')}</td>
                    <td className="p-2 font-bold">{t.type === 'Income' ? 'PENDAPATAN' : 'BELANJA'}</td>
                    <td className="p-2 font-bold text-slate-800">{t.category}</td>
                    <td className="p-2">{t.description}</td>
                    <td className="p-2 text-right font-black">
                      {new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2 }).format(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
