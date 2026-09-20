import React, { useState } from 'react';
import { Program, SystemConfig } from '../types';
import { PlusCircle, Edit2, Printer, FileText, X, Calendar, MapPin, Users, DollarSign, Clock, Search, Handshake } from 'lucide-react';

interface ProgramsManagerProps {
  programs: Program[];
  config: SystemConfig;
  onAddProgram: (program: Omit<Program, 'id'>) => void;
  onUpdateProgram: (program: Program) => void;
  onDeleteProgram: (id: string) => void;
}

export const ProgramsManager: React.FC<ProgramsManagerProps> = ({
  programs,
  config,
  onAddProgram,
  onUpdateProgram,
  onDeleteProgram
}) => {
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  // Form states
  const [namaProgram, setNamaProgram] = useState('');
  const [tarikhProgram, setTarikhProgram] = useState('');
  const [masaProgram, setMasaProgram] = useState('');
  const [tempatProgram, setTempatProgram] = useState('');
  const [kerjasama, setKerjasama] = useState('');
  const [implikasiKewangan, setImplikasiKewangan] = useState('');
  const [sasaranPeserta, setSasaranPeserta] = useState('');
  const [bilanganPeserta, setBilanganPeserta] = useState<number>(0);

  // Print state
  const [printJob, setPrintJob] = useState<{ program: Program; type: 'kertas_kerja' | 'laporan' } | null>(null);

  // Reset form inputs
  const resetForm = () => {
    setNamaProgram('');
    setTarikhProgram('');
    setMasaProgram('');
    setTempatProgram('');
    setKerjasama('');
    setImplikasiKewangan('');
    setSasaranPeserta('');
    setBilanganPeserta(0);
    setEditingProgram(null);
  };

  // Open modal for adding
  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (program: Program) => {
    setEditingProgram(program);
    setNamaProgram(program.namaProgram);
    setTarikhProgram(program.tarikhProgram);
    setMasaProgram(program.masaProgram);
    setTempatProgram(program.tempatProgram);
    setKerjasama(program.kerjasama);
    setImplikasiKewangan(program.implikasiKewangan);
    setSasaranPeserta(program.sasaranPeserta);
    setBilanganPeserta(program.bilanganPeserta);
    setIsModalOpen(true);
  };

  // Handle submit (Add or Edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaProgram.trim()) return;

    const payload = {
      namaProgram,
      tarikhProgram,
      masaProgram,
      tempatProgram,
      kerjasama,
      implikasiKewangan,
      sasaranPeserta,
      bilanganPeserta: Number(bilanganPeserta) || 0
    };

    if (editingProgram) {
      onUpdateProgram({ ...payload, id: editingProgram.id });
    } else {
      onAddProgram(payload);
    }

    setIsModalOpen(false);
    resetForm();
  };

  // Handle printing Proposal or Report
  const handlePrint = (program: Program, type: 'kertas_kerja' | 'laporan') => {
    setPrintJob({ program, type });
    // Timeout gives React time to render print elements before opening print dialog
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Add a listener to clean up print job after printing is completed or canceled
  React.useEffect(() => {
    const handleAfterPrint = () => {
      setPrintJob(null);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // Filter programs
  const filteredPrograms = programs.filter(p =>
    String(p.namaProgram || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(p.tempatProgram || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(p.kerjasama || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Screen layout (Hidden during printing) */}
      <div className="space-y-6 print:hidden">
        {/* Header & Add Button */}
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Pengurusan Kertas Kerja & Laporan Program
            </h3>
            <p className="text-xs text-slate-500">
              Urus permohonan kertas kerja program alumni dan cetak laporan aktiviti persatuan yang dijalankan.
            </p>
          </div>
          
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Program</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-4 py-2 max-w-md shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Cari program, tempat, atau kerjasama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm bg-transparent outline-none font-medium text-slate-700"
          />
        </div>

        {/* Program Cards Grid */}
        {filteredPrograms.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-bold bg-white rounded-2xl border border-slate-100 p-8">
            Tiada rekod program/aktiviti ditemui. Sila tambah program baharu.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPrograms.map(p => (
              <div
                key={p.id}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all hover:shadow-xs"
              >
                {/* Details */}
                <div className="flex-1">
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wide">
                    {p.namaProgram}
                  </h4>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap items-center justify-end shrink-0 border-t border-slate-50 pt-3 md:border-t-0 md:pt-0">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="px-3 py-1.5 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 border border-slate-200"
                    title="Kemaskini maklumat program"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Kemaskini</span>
                  </button>

                  <button
                    onClick={() => handlePrint(p, 'kertas_kerja')}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 border border-amber-200/50"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Kertas Kerja</span>
                  </button>

                  <button
                    onClick={() => handlePrint(p, 'laporan')}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 border border-emerald-200/50"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Cetak Laporan</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Adakah anda pasti mahu memadam rekod program '${p.namaProgram}'?`)) {
                        onDeleteProgram(p.id);
                      }
                    }}
                    className="px-2 py-1.5 hover:bg-rose-50 text-rose-500 rounded-xl text-xs font-bold cursor-pointer transition-all border border-transparent"
                    title="Padam rekod"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* A. Modal Form (Add / Edit Program) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl p-6 shadow-xl w-full max-w-lg space-y-4 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                {editingProgram ? 'Kemaskini Maklumat Program' : 'Daftar Program Baharu'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Nama Program</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kejohanan Sukan Alumni KKBS 2026"
                  value={namaProgram}
                  onChange={(e) => setNamaProgram(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-blue-600 font-bold text-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Tarikh Program</label>
                  <input
                    type="text"
                    placeholder="Contoh: 12 Mac 2026 atau 12/03/2026"
                    value={tarikhProgram}
                    onChange={(e) => setTarikhProgram(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-blue-600 font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Masa Program</label>
                  <input
                    type="text"
                    placeholder="Contoh: 8:00 Pagi - 5:00 Petang"
                    value={masaProgram}
                    onChange={(e) => setMasaProgram(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-blue-600 font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Tempat Program</label>
                  <input
                    type="text"
                    placeholder="Contoh: Dewan Serbaguna KKBS"
                    value={tempatProgram}
                    onChange={(e) => setTempatProgram(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-blue-600 font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Kerjasama / Kolaborasi</label>
                  <input
                    type="text"
                    placeholder="Contoh: Kolej Komuniti Beaufort & Belia Sabah"
                    value={kerjasama}
                    onChange={(e) => setKerjasama(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-blue-600 font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Implikasi Kewangan (Bajet)</label>
                <input
                  type="text"
                  placeholder="Contoh: RM 1,200.00 (Sumbangan Alumni)"
                  value={implikasiKewangan}
                  onChange={(e) => setImplikasiKewangan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-blue-600 font-semibold text-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Sasaran Peserta</label>
                  <input
                    type="text"
                    placeholder="Contoh: Semua Ahli Alumni & Pelajar Semester Akhir"
                    value={sasaranPeserta}
                    onChange={(e) => setSasaranPeserta(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-blue-600 font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Bilangan Peserta</label>
                  <input
                    type="number"
                    placeholder="Contoh: 100"
                    value={bilanganPeserta === 0 ? '' : bilanganPeserta}
                    onChange={(e) => setBilanganPeserta(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-blue-600 font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold cursor-pointer transition-all hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  {editingProgram ? 'Simpan Kemaskini' : 'Daftar Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. Print-only Layouts (Hidden during normal screen browsing, visible during printing) */}
      {printJob && printJob.type === 'kertas_kerja' && (
        <div className="hidden print:block print-container" style={{ backgroundColor: '#fff', color: '#000', fontFamily: 'Georgia, serif', fontSize: '12px', lineHeight: '1.4', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          <style>{`
            @media print {
              @page {
                size: A4;
                margin: 12mm 15mm 15mm 15mm !important;
              }
              body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                background-color: #fff !important;
                color: #000 !important;
              }
              .print-container {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
              }
              table {
                width: 99.5% !important;
                max-width: 99.5% !important;
                margin-left: auto !important;
                margin-right: auto !important;
                table-layout: fixed !important;
                word-break: break-word !important;
                border-collapse: collapse !important;
                box-sizing: border-box !important;
              }
              td, th {
                word-break: break-word !important;
                box-sizing: border-box !important;
              }
            }
          `}</style>

          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingBottom: '12px', borderBottom: '2px solid #000', marginBottom: '8px', marginTop: '0px', paddingTop: '0px' }}>
            <img src="/logo-alumni.png" alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '6px', marginTop: '0px' }} />
            <h2 style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', margin: '0' }}>PERSATUAN ALUMNI KOLEJ KOMUNITI BEAUFORT, SABAH</h2>
            <p style={{ fontSize: '9px', color: '#555', margin: '2px 0 0 0', fontWeight: 'normal' }}>d.a. Kolej Komuniti Beaufort, Jalan Melalugus, 89807 Beaufort, Sabah.</p>
          </div>

          {/* Title */}
          <h1 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', textDecoration: 'underline', marginTop: '16px', marginBottom: '0' }}>
            KERTAS CADANGAN PENGANJURAN PROGRAM: {printJob.program.namaProgram}
          </h1>

          {/* Section 1 */}
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '12px' }}>1. PENDAHULUAN</h4>
            <p style={{ textAlign: 'justify', paddingLeft: '16px', margin: '0', fontWeight: 'normal', fontSize: '12px' }}>
              Kertas cadangan ini disediakan bertujuan untuk memohon kelulusan dan peruntukan bagi penganjuran program{' '}
              <strong style={{ fontWeight: 'bold' }}>"{printJob.program.namaProgram}"</strong> yang dikelolakan oleh Persatuan Alumni Kolej Komuniti Beaufort. Program ini dirancang untuk mencapai objektif perpaduan alumni serta pembangunan kemahiran modal insan.
            </p>
          </div>

          {/* Section 2 */}
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '12px' }}>2. OBJEKTIF PROGRAM</h4>
            <div style={{ paddingLeft: '16px', margin: '0', fontSize: '12px' }}>
              <p style={{ margin: '0 0 4px 0', fontWeight: 'normal' }}>2.1 Mewujudkan rangkaian perhubungan yang erat dan interaksi yang sihat sesama bekas pelajar (alumni) KKBS.</p>
              <p style={{ margin: '0 0 4px 0', fontWeight: 'normal' }}>2.2 Meningkatkan penglibatan aktif alumni dalam pembangunan Kolej Komuniti Beaufort Sabah serta komuniti setempat.</p>
              <p style={{ margin: '0', fontWeight: 'normal' }}>2.3 Memberikan pendedahan kemahiran serta berkongsi pengalaman kerjaya bersama pelajar semasa di kolej.</p>
            </div>
          </div>

          {/* Section 3 */}
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '12px' }}>3. BUTIRAN PROGRAM</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', tableLayout: 'fixed' }}>
              <tbody>
                {[
                  ['NAMA PROGRAM', printJob.program.namaProgram?.toUpperCase()],
                  ['TARIKH', printJob.program.tarikhProgram || '-'],
                  ['TEMPAT PROGRAM', printJob.program.tempatProgram || '-'],
                  ['SASARAN PESERTA', printJob.program.sasaranPeserta || 'Ahli Alumni & Pelajar'],
                  ['ANJURAN / KERJASAMA', printJob.program.kerjasama || 'Persatuan Alumni KKBS'],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td style={{ border: '1px solid #999', padding: '6px 8px', fontWeight: 'bold', width: '30%', backgroundColor: '#f9f9f9', wordBreak: 'break-word' }}>{label}</td>
                    <td style={{ border: '1px solid #999', padding: '6px 8px', fontWeight: 'normal', width: '70%', wordBreak: 'break-word' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Natural Flow sections */}
          <div>
            {/* Section 5 */}
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '12px' }}>5. IMPLIKASI KEWANGAN</h4>
              <p style={{ paddingLeft: '16px', margin: '0', fontWeight: 'normal', fontSize: '12px' }}>
                Anggaran implikasi kewangan dan bajet yang diperlukan bagi menjayakan program ini adalah sebanyak{' '}
                <strong style={{ fontWeight: 'bold' }}>{printJob.program.implikasiKewangan || 'RM 0.00'}</strong> yang akan ditanggung melalui dana persatuan alumni dan penaja luar.
              </p>
            </div>

            {/* Section 6 */}
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '12px' }}>6. TENTATIF PROGRAM</h4>
              <p style={{ paddingLeft: '16px', margin: '0', fontWeight: 'normal', fontSize: '12px' }}>
                Tentatif program adalah seperti yang dilampirkan di dalam <strong style={{ fontWeight: 'bold' }}>Lampiran 1</strong>.
              </p>
            </div>

            {/* Section 7 */}
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '12px' }}>7. JAWATANKUASA PELAKSANA</h4>
              <p style={{ paddingLeft: '16px', margin: '0', fontWeight: 'normal', fontSize: '12px' }}>
                Jawatankuasa pelaksana program adalah seperti yang dilampirkan di dalam <strong style={{ fontWeight: 'bold' }}>Lampiran 2</strong>.
              </p>
            </div>

            {/* Section 8 */}
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '12px' }}>8. PENUTUP</h4>
              <p style={{ textAlign: 'justify', paddingLeft: '16px', margin: '0', fontWeight: 'normal', fontSize: '12px' }}>
                Penganjuran program ini diharapkan akan mendapat kelulusan penuh daripada pihak Jawatankuasa Persatuan Alumni Kolej Komuniti Beaufort. Sokongan dan komitmen daripada semua pihak amatlah dihargai demi memastikan kejayaan program ini.
              </p>
            </div>

            {/* Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginTop: '48px', textAlign: 'center', fontSize: '12px' }}>
              <div>
                <p style={{ fontWeight: 'normal', margin: '0 0 40px 0' }}>Disediakan oleh:</p>
                <p style={{ fontWeight: 'normal', margin: '0' }}>___________________________</p>
                <p style={{ fontWeight: 'bold', textTransform: 'uppercase', margin: '4px 0 0 0' }}>{config.setiausaha || 'SETIAUSAHA'}</p>
                <p style={{ fontWeight: 'normal', margin: '2px 0 0 0' }}>Setiausaha</p>
                <p style={{ fontWeight: 'normal', margin: '2px 0 0 0' }}>Persatuan Alumni KKBS</p>
              </div>
              <div>
                <p style={{ fontWeight: 'normal', margin: '0 0 40px 0' }}>Disahkan & Diluluskan oleh:</p>
                <p style={{ fontWeight: 'normal', margin: '0' }}>___________________________</p>
                <p style={{ fontWeight: 'bold', textTransform: 'uppercase', margin: '4px 0 0 0' }}>{config.pengerusi || 'PENGERUSI'}</p>
                <p style={{ fontWeight: 'normal', margin: '2px 0 0 0' }}>Pengerusi</p>
                <p style={{ fontWeight: 'normal', margin: '2px 0 0 0' }}>Persatuan Alumni KKBS</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {printJob && printJob.type === 'laporan' && (
        <div className="hidden print:block print-container" style={{ backgroundColor: '#fff', color: '#000', fontFamily: 'Georgia, serif', fontSize: '12px', lineHeight: '1.4', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          <style>{`
            @media print {
              @page {
                size: A4;
                margin: 12mm 15mm 15mm 15mm !important;
              }
              body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                background-color: #fff !important;
                color: #000 !important;
              }
              .print-container {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
              }
              table {
                width: 99.5% !important;
                max-width: 99.5% !important;
                margin-left: auto !important;
                margin-right: auto !important;
                table-layout: fixed !important;
                word-break: break-word !important;
                border-collapse: collapse !important;
                box-sizing: border-box !important;
              }
              td, th {
                word-break: break-word !important;
                box-sizing: border-box !important;
              }
            }
          `}</style>

          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingBottom: '12px', borderBottom: '2px solid #000', marginBottom: '8px', marginTop: '0px', paddingTop: '0px' }}>
            <img src="/logo-alumni.png" alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '6px', marginTop: '0px' }} />
            <h2 style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', margin: '0' }}>PERSATUAN ALUMNI KOLEJ KOMUNITI BEAUFORT, SABAH</h2>
            <p style={{ fontSize: '9px', color: '#555', margin: '2px 0 0 0', fontWeight: 'normal' }}>d.a. Kolej Komuniti Beaufort, Jalan Melalugus, 89807 Beaufort, Sabah.</p>
          </div>

          {/* Title */}
          <h1 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', textDecoration: 'underline', marginTop: '16px', marginBottom: '0' }}>
            LAPORAN PENUH PROGRAM: {printJob.program.namaProgram}
          </h1>

          {/* Section 1 */}
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '12px' }}>1. LATAR BELAKANG PROGRAM</h4>
            <p style={{ textAlign: 'justify', paddingLeft: '16px', margin: '0', fontWeight: 'normal', fontSize: '12px' }}>
              Program ini telah dilaksanakan dengan jayanya hasil kerjasama erat daripada pihak Kolej Komuniti Beaufort Sabah serta para alumni yang sentiasa menyokong usaha murni persatuan.
            </p>
          </div>

          {/* Section 2 */}
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '12px' }}>2. RINGKASAN DATA LAPORAN</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', tableLayout: 'fixed' }}>
              <tbody>
                {[
                  ['TARIKH PROGRAM', printJob.program.tarikhProgram || '-'],
                  ['TEMPAT PROGRAM', printJob.program.tempatProgram?.toUpperCase()],
                  ['ANJURAN BERSAMA', printJob.program.kerjasama || 'Persatuan Alumni KKBS'],
                  ['JUMLAH PERBELANJAAN SEBENAR', printJob.program.implikasiKewangan || 'RM 0.00'],
                  ['BILANGAN PESERTA', `${printJob.program.bilanganPeserta} Orang (${printJob.program.sasaranPeserta})`],
                ].map(([label, value], i) => (
                  <tr key={label}>
                    <td style={{ border: '1px solid #999', padding: '6px 8px', fontWeight: 'bold', width: '30%', backgroundColor: '#f9f9f9', wordBreak: 'break-word' }}>{label}</td>
                    <td style={{ border: '1px solid #999', padding: '6px 8px', fontWeight: i === 3 ? 'bold' : 'normal', color: i === 3 ? '#c00' : 'inherit', width: '70%', wordBreak: 'break-word' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 3 */}
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '12px' }}>3. JADUAL PELAKSANAAN PROGRAM</h4>
            <p style={{ paddingLeft: '16px', margin: '0', fontWeight: 'normal', fontSize: '12px' }}>
              Jadual pelaksanaan program adalah seperti yang dilampirkan di dalam <strong style={{ fontWeight: 'bold' }}>Lampiran 1</strong>.
            </p>
          </div>

          {/* Section 4 */}
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '12px' }}>4. JAWATANKUASA PELAKSANA</h4>
            <p style={{ paddingLeft: '16px', margin: '0', fontWeight: 'normal', fontSize: '12px' }}>
              Jawatankuasa pelaksanaan program adalah seperti yang dilampirkan di dalam <strong style={{ fontWeight: 'bold' }}>Lampiran 2</strong>.
            </p>
          </div>

          {/* Section 5 */}
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '12px' }}>5. GAMBAR PROGRAM</h4>
            <p style={{ paddingLeft: '16px', margin: '0', fontWeight: 'normal', fontSize: '12px' }}>
              Gambar pelaksanaan program adalah seperti yang dilampirkan di dalam <strong style={{ fontWeight: 'bold' }}>Lampiran 3</strong>.
            </p>
          </div>

          {/* Natural Flow sections */}
          <div>
            {/* Section 6 */}
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '12px' }}>6. IMPAK & KESIMPULAN</h4>
              <p style={{ textAlign: 'justify', paddingLeft: '16px', margin: '0', fontWeight: 'normal', fontSize: '12px' }}>
                Pihak persatuan telah merekodkan impak positif di mana penglibatan alumni dapat dirangsang secara aktif. Secara keseluruhannya, program ini telah mencapai KPI utama yang telah digariskan dalam kertas cadangan awal.
              </p>
            </div>

            {/* Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginTop: '48px', textAlign: 'center', fontSize: '12px' }}>
              <div>
                <p style={{ fontWeight: 'normal', margin: '0 0 40px 0' }}>Disediakan oleh:</p>
                <p style={{ fontWeight: 'normal', margin: '0' }}>___________________________</p>
                <p style={{ fontWeight: 'bold', textTransform: 'uppercase', margin: '4px 0 0 0' }}>{config.setiausaha || 'SETIAUSAHA'}</p>
                <p style={{ fontWeight: 'normal', margin: '2px 0 0 0' }}>Setiausaha</p>
                <p style={{ fontWeight: 'normal', margin: '2px 0 0 0' }}>Persatuan Alumni KKBS</p>
              </div>
              <div>
                <p style={{ fontWeight: 'normal', margin: '0 0 40px 0' }}>Disemak & Disahkan oleh:</p>
                <p style={{ fontWeight: 'normal', margin: '0' }}>___________________________</p>
                <p style={{ fontWeight: 'bold', textTransform: 'uppercase', margin: '4px 0 0 0' }}>{config.pengerusi || 'PENGERUSI'}</p>
                <p style={{ fontWeight: 'normal', margin: '2px 0 0 0' }}>Pengerusi</p>
                <p style={{ fontWeight: 'normal', margin: '2px 0 0 0' }}>Persatuan Alumni KKBS</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
