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

// Helper interface for tentative schedule
interface ScheduleItem {
  masa: string;
  aktiviti: string;
  tindakan: string;
}

// Helper interface for committee list
interface CommitteeItem {
  bil: number;
  jawatan: string;
  nama: string;
  peranan: string;
}

// Helper function to generate contextual tentative schedule based on program details
const generateTentativeSchedule = (program: Program): ScheduleItem[] => {
  const name = (program.namaProgram || '').toLowerCase();
  const timeRaw = (program.masaProgram || '').toLowerCase();
  const venue = program.tempatProgram || 'Kolej Komuniti Beaufort';

  // 1. Sukan / Futsal / Sukaneka / Karnival
  if (name.includes('sukan') || name.includes('futsal') || name.includes('karnival') || name.includes('bola')) {
    return [
      { masa: '07:30 Pagi', aktiviti: 'Pendaftaran peserta, taklimat keselamatan dan penyerahan nombor penyertaan', tindakan: 'AJK Pendaftaran & Urus Setia' },
      { masa: '08:00 Pagi', aktiviti: 'Sesi senamrobik / pemanasan badan dan taklimat peraturan pertandingan', tindakan: 'AJK Teknikal & Pengadil' },
      { masa: '08:30 Pagi', aktiviti: 'Perlawanan peringkat kumpulan / acara saringan bermula', tindakan: 'Pegawai Perlawanan & Peserta' },
      { masa: '10:30 Pagi', aktiviti: 'Rehat dan agihan minuman / makanan ringan', tindakan: 'AJK Jamuan' },
      { masa: '11:00 Pagi', aktiviti: 'Perlawanan peringkat suku akhir & separuh akhir', tindakan: 'Pegawai Perlawanan' },
      { masa: '01:00 Petang', aktiviti: 'Rehat, solat zohor dan makan tengah hari', tindakan: 'Semua Peserta' },
      { masa: '02:30 Petang', aktiviti: 'Perlawanan akhir (Final) dan penentuan tempat ke-3 & ke-4', tindakan: 'Pengadil Perlawanan' },
      { masa: '04:00 Petang', aktiviti: 'Majlis penutupan, penyampaian pingat, piala iringan dan cenderamata', tindakan: 'Pengerusi & Tetamu Jemputan' },
      { masa: '05:00 Petang', aktiviti: 'Sesi fotografi kenangan dan gotong-royong pembersihan kawasan', tindakan: 'Semua Jawatankuasa' }
    ];
  }

  // 2. Iftar / Ramadan / Makan Malam / Gala
  if (name.includes('iftar') || name.includes('ramadan') || name.includes('makan malam') || name.includes('gala') || timeRaw.includes('malam') || (timeRaw.includes('pm') && (timeRaw.includes('7') || timeRaw.includes('8')))) {
    if (name.includes('iftar') || name.includes('ramadan')) {
      return [
        { masa: '05:30 Petang', aktiviti: 'Ketibaan ahli alumni, jemputan khas dan pendaftaran', tindakan: 'AJK Pendaftaran & Protokol' },
        { masa: '06:00 Petang', aktiviti: 'Tazkirah Ramadan dan perkongsian santai alumni', tindakan: 'Penceramah Jemputan' },
        { masa: '06:25 Petang', aktiviti: 'Majlis penyerahan santunan kasih / sumbangan kebajikan asnaf', tindakan: 'Pengerusi Persatuan Alumni' },
        { masa: '06:33 Petang', aktiviti: 'Iftar (berbuka puasa) dan solat Maghrib berjemaah', tindakan: 'Semua Hadirin' },
        { masa: '07:15 Petang', aktiviti: 'Jamuan makan malam perdana iftar', tindakan: 'AJK Jamuan' },
        { masa: '08:00 Malam', aktiviti: 'Solat Isyak dan solat sunat Tarawih berjemaah', tindakan: 'Imam & Jemaah' },
        { masa: '09:00 Malam', aktiviti: 'Moreh, sesi ramah mesra alumni dan bersurai', tindakan: 'Urus Setia' }
      ];
    }
    return [
      { masa: '07:00 Malam', aktiviti: 'Ketibaan para alumni, pendaftaran dan sesi fotografi di Photo Booth', tindakan: 'AJK Pendaftaran & Media' },
      { masa: '07:45 Malam', aktiviti: 'Ketibaan tetamu kehormat dan nyanyian lagu Negaraku & Sabah Tanah Airku', tindakan: 'AJK Protokol' },
      { masa: '08:00 Malam', aktiviti: 'Bacaan doa dan ucapan alu-aluan Pengerusi Persatuan Alumni KKBS', tindakan: 'Pengerusi Alumni' },
      { masa: '08:15 Malam', aktiviti: 'Ucapan perasmian majlis oleh Tetamu Kehormat', tindakan: 'Tetamu Kehormat' },
      { masa: '08:30 Malam', aktiviti: 'Jamuan makan malam berhidang dan persembahan montaj aktiviti alumni', tindakan: 'AJK Jamuan & Multimedia' },
      { masa: '09:30 Malam', aktiviti: 'Penyampaian Anugerah Ikon Alumni & cabutan bertuah perdana', tindakan: 'Jawatankuasa Majlis' },
      { masa: '10:30 Malam', aktiviti: 'Sesi bergambar rasmi jawatankuasa dan bersurai', tindakan: 'AJK Dokumentasi' }
    ];
  }

  // 3. Sumbangan / CSR / Kebajikan / Prihatin / Bayaran Balik
  if (name.includes('sumbangan') || name.includes('kasih') || name.includes('csr') || name.includes('prihatin') || name.includes('kanopi') || name.includes('kebajikan') || name.includes('bayaran balik') || name.includes('cenderamata')) {
    return [
      { masa: '08:30 Pagi', aktiviti: `Ketibaan jawatankuasa persatuan dan wakil penerima di ${venue}`, tindakan: 'AJK Sambutan & Protokol' },
      { masa: '09:00 Pagi', aktiviti: 'Bacaan doa selamat dan ucapan pembukaan oleh Pengerusi Persatuan Alumni', tindakan: 'Pengerusi Alumni' },
      { masa: '09:30 Pagi', aktiviti: 'Ucapan aluan wakil Kolej Komuniti Beaufort / wakil komuniti setempat', tindakan: 'Pengurusan KKBS / Komuniti' },
      { masa: '10:00 Pagi', aktiviti: `Sesi simbolik penyerahan bantuan / program '${program.namaProgram}'`, tindakan: 'Pengerusi & Ahli Jawatankuasa' },
      { masa: '10:30 Pagi', aktiviti: 'Sesi fotografi penyerahan sumbangan dan temubual ringkas penerima', tindakan: 'AJK Publisiti & Media' },
      { masa: '11:00 Pagi', aktiviti: 'Jamuan ringan, sesi ramah mesra bersama penerima dan bersurai', tindakan: 'Urus Setia' }
    ];
  }

  // 4. Camp / Bootcamp / Kepimpinan
  if (name.includes('camp') || name.includes('kem') || name.includes('bootcamp') || name.includes('lead') || name.includes('futureready')) {
    return [
      { masa: '08:00 Pagi', aktiviti: 'Pendaftaran peserta, pembahagian kumpulan dan agihan kit peserta', tindakan: 'AJK Pendaftaran' },
      { masa: '08:30 Pagi', aktiviti: 'Taklimat program, sesi ice-breaking dan pembinaan dinamika kumpulan', tindakan: 'Ketua Fasilitator' },
      { masa: '10:30 Pagi', aktiviti: 'Rehat dan minum pagi', tindakan: 'AJK Jamuan' },
      { masa: '11:00 Pagi', aktiviti: 'Modul 1: Kepimpinan adaptif, kemahiran insaniah & strategi kerjaya moden', tindakan: 'Penceramah / Fasilitator' },
      { masa: '01:00 Petang', aktiviti: 'Makan tengah hari, solat zohor dan rehat kendiri', tindakan: 'Semua Peserta' },
      { masa: '02:00 Petang', aktiviti: 'Modul 2: Latihan Dalam Kumpulan (LDK) & simulasi industri dunia sebenar', tindakan: 'Fasilitator & Peserta' },
      { masa: '04:00 Petang', aktiviti: 'Pembentangan hasil kumpulan, rumusan fasilitator dan penilaian kendiri', tindakan: 'Panel Penilai' },
      { masa: '04:45 Petang', aktiviti: 'Penyampaian sijil penyertaan, sesi fotografi kenangan dan bersurai', tindakan: 'Pengerusi & Urus Setia' }
    ];
  }

  // 5. Mesyuarat Agung / AGM / Minit Mesyuarat
  if (name.includes('agm') || name.includes('mesyuarat') || name.includes('minit')) {
    return [
      { masa: '08:00 Pagi', aktiviti: 'Pendaftaran kehadiran ahli alumni dan pengedaran naskhah laporan tahunan', tindakan: 'AJK Pendaftaran & Urus Setia' },
      { masa: '08:45 Pagi', aktiviti: 'Ketibaan tetamu kehormat dan bacaan doa selamat', tindakan: 'AJK Protokol' },
      { masa: '09:00 Pagi', aktiviti: 'Ucapan alu-aluan Pengerusi Persatuan Alumni Kolej Komuniti Beaufort', tindakan: 'Pengerusi Alumni' },
      { masa: '09:30 Pagi', aktiviti: 'Ucapan perasmian oleh Pengarah Kolej Komuniti Beaufort', tindakan: 'Penaung / Pengarah' },
      { masa: '10:15 Pagi', aktiviti: 'Rehat dan jamuan minum pagi', tindakan: 'AJK Jamuan' },
      { masa: '10:45 Pagi', aktiviti: 'Mesyuarat bermula: Pembentangan minit, laporan aktiviti & penyata kewangan', tindakan: 'Setiausaha & Bendahari' },
      { masa: '12:30 Tengah Hari', aktiviti: 'Perbahasan usul, pelantikan jawatankuasa (jika ada) dan ucapan penangguhan', tindakan: 'Pengerusi Mesyuarat' },
      { masa: '01:15 Petang', aktiviti: 'Makan tengah hari, solat zohor dan bersurai', tindakan: 'Semua Hadirin' }
    ];
  }

  // 6. Bengkel / Kursus / Career / Lawatan / Default Standard Program
  return [
    { masa: '08:00 Pagi', aktiviti: 'Pendaftaran kehadiran peserta, pengambilan bahan kursus dan sarapan pagi', tindakan: 'AJK Pendaftaran' },
    { masa: '08:45 Pagi', aktiviti: 'Ketibaan tetamu jemputan, nyanyian lagu Negaraku dan bacaan doa', tindakan: 'AJK Protokol' },
    { masa: '09:00 Pagi', aktiviti: `Ucapan pembukaan program: '${program.namaProgram}'`, tindakan: 'Pengarah Program / Pengerusi' },
    { masa: '09:30 Pagi', aktiviti: 'Sesi 1: Perkongsian ilmu / modul pengenalan bersama penceramah industri', tindakan: 'Penceramah Jemputan' },
    { masa: '10:30 Pagi', aktiviti: 'Rehat dan jamuan minum pagi (networking alumni)', tindakan: 'AJK Jamuan' },
    { masa: '11:00 Pagi', aktiviti: 'Sesi 2: Bengkel kemahiran praktikal, sesi interaktif dan soal jawab (Q&A)', tindakan: 'Penceramah & Peserta' },
    { masa: '01:00 Petang', aktiviti: 'Makan tengah hari, solat zohor dan rehat kendiri', tindakan: 'Semua Peserta' },
    { masa: '02:00 Petang', aktiviti: 'Sesi 3: Perkongsian pengalaman kerjaya alumni, tips pasaran kerja & bimbingan industri', tindakan: 'Panel Alumni / Industri' },
    { masa: '03:45 Petang', aktiviti: 'Sesi penilaian program dan pengisian borang maklum balas peserta', tindakan: 'Urus Setia' },
    { masa: '04:15 Petang', aktiviti: 'Majlis penutupan, penyampaian cenderamata penceramah dan sijil kehadiran', tindakan: 'Pengerusi & Pengurusan KKBS' },
    { masa: '05:00 Petang', aktiviti: 'Sesi fotografi kenangan beramai-ramai dan majlis bersurai', tindakan: 'AJK Dokumentasi' }
  ];
};

// Helper function to generate committee list dynamically based on system config
const generateCommitteeList = (config: SystemConfig, program: Program): CommitteeItem[] => {
  const list: CommitteeItem[] = [];
  let bil = 1;

  // 1. Penaung / Penasihat
  list.push({
    bil: bil++,
    jawatan: 'Penaung / Penasihat',
    nama: config.penasihat || 'PENGARAH KOLEJ KOMUNITI BEAUFORT',
    peranan: 'Memberikan panduan dasar, nasihat pengurusan dan sokongan kolej.'
  });

  // 2. Pengerusi
  list.push({
    bil: bil++,
    jawatan: 'Pengerusi Program',
    nama: config.pengerusi || 'MOHAMMAD SYAFIQ BIN SHAMSUDDIN',
    peranan: 'Mengetuai pelaksanaan program, menyelia keseluruhan gerak kerja dan kelulusan program.'
  });

  // 3. Timbalan Pengerusi
  list.push({
    bil: bil++,
    jawatan: 'Timbalan Pengerusi Program',
    nama: config.timbalanPengerusi || 'TIMBALAN PENGERUSI PERSATUAN ALUMNI',
    peranan: 'Membantu memantau kelancaran gerak kerja jawatankuasa dan penyelarasan aktiviti.'
  });

  // 4. Setiausaha / Pengarah Program
  list.push({
    bil: bil++,
    jawatan: 'Pengarah Program / Setiausaha',
    nama: config.setiausaha || 'MOHD ISKANDAR BIN JIBLIN',
    peranan: 'Menyediakan kertas kerja, urusan surat-menyurat rasmi, minit mesyuarat dan laporan akhir.'
  });

  // 5. Penolong Setiausaha
  list.push({
    bil: bil++,
    jawatan: 'Penolong Setiausaha',
    nama: config.penolongSetiausaha || 'PENOLONG SETIAUSAHA PERSATUAN ALUMNI',
    peranan: 'Menguruskan pendaftaran peserta, rekod kehadiran dan dokumentasi program.'
  });

  // 6. Bendahari
  list.push({
    bil: bil++,
    jawatan: 'Bendahari / Pengurus Kewangan',
    nama: config.bendahari || 'SITI NURHAWA NABILAH BINTI FEDELIS',
    peranan: 'Menguruskan bajet perbelanjaan, rekod resit, tuntutan kewangan dan penyata kewangan.'
  });

  // 7. Juru Audit
  list.push({
    bil: bil++,
    jawatan: 'Pemeriksa Kira-Kira / Juru Audit',
    nama: config.juruAudit || 'REZIELLA BINTI LAHAJI',
    peranan: 'Menyemak ketepatan penyata perbelanjaan dan memastikan tatakelola kewangan berhemah.'
  });

  // 8. Ahli Jawatankuasa (AJK)
  const portfolioDefaults = [
    { title: 'AJK Logistik, Peralatan & Tempat', task: 'Menyediakan persiapan dewan/tempat, susun atur teknikal dan peralatan program.' },
    { title: 'AJK Protokol, Sambutan & Pengacaraan', task: 'Menyelaras sambutan tetamu jemputan, atur cara majlis dan teks juruacara.' },
    { title: 'AJK Makanan, Jamuan & Minuman', task: 'Mengurus tempahan katering, menu sajian dan agihan makanan kepada peserta.' },
    { title: 'AJK Publisiti, Media & Siaraya', task: 'Mengurus poster hebahan, siaran media sosial, fotografi dan rakaman montaj.' },
    { title: 'AJK Pendaftaran, Sijil & Cenderamata', task: 'Menyelaras kaunter pendaftaran, penyediaan sijil penyertaan dan cenderamata.' },
    { title: 'AJK Keselamatan, Kebajikan & Kebersihan', task: 'Memastikan keselamatan peserta, peti kecemasan dan kebersihan lokasi program.' },
    { title: 'AJK Teknikal & Multimedia', task: 'Mengurus PA sistem, projektor paparan, slaid pembentangan dan sokongan audio-visual.' },
    { title: 'AJK Fasilitator & Aktiviti', task: 'Memudah cara pelaksanaan aktiviti, penyelarasan modul dan interaksi peserta.' }
  ];

  if (Array.isArray(config.ajk) && config.ajk.length > 0) {
    config.ajk.forEach((ajkName, index) => {
      const port = portfolioDefaults[index % portfolioDefaults.length];
      list.push({
        bil: bil++,
        jawatan: port.title,
        nama: ajkName.toUpperCase(),
        peranan: port.task
      });
    });
  } else {
    // Default allocations when no custom AJK entered yet
    portfolioDefaults.slice(0, 4).forEach((port) => {
      list.push({
        bil: bil++,
        jawatan: port.title,
        nama: 'AHLI JAWATANKUASA ALUMNI KKBS',
        peranan: port.task
      });
    });
  }

  return list;
};

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
            <h3 className="text-sm font-black text-cyan-300 uppercase tracking-wider mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>Pengurusan Kertas Kerja & Laporan Program</span>
            </h3>
            <p className="text-xs text-slate-300 font-medium">
              Urus permohonan kertas kerja program alumni dan cetak laporan aktiviti persatuan yang dijalankan.
            </p>
          </div>
          
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer shrink-0"
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

            {/* LAMPIRAN 1: TENTATIF PROGRAM (KERTAS KERJA) */}
            <div className="page-break" style={{ pageBreakBefore: 'always', marginTop: '36px', paddingTop: '16px' }}>
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', margin: '0', textDecoration: 'underline' }}>
                  LAMPIRAN 1: TENTATIF {printJob.program.namaProgram?.toUpperCase()}
                </h3>
                <p style={{ fontSize: '10px', margin: '4px 0 0 0', color: '#444' }}>
                  Tarikh: <strong>{printJob.program.tarikhProgram || '-'}</strong> &nbsp;|&nbsp; Masa: <strong>{printJob.program.masaProgram || '-'}</strong> &nbsp;|&nbsp; Tempat: <strong>{printJob.program.tempatProgram || '-'}</strong>
                </p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #777', padding: '6px 8px', width: '22%', textAlign: 'center', fontWeight: 'bold' }}>MASA</th>
                    <th style={{ border: '1px solid #777', padding: '6px 8px', width: '56%', textAlign: 'left', fontWeight: 'bold' }}>PENGISIAN / AKTIVITI</th>
                    <th style={{ border: '1px solid #777', padding: '6px 8px', width: '22%', textAlign: 'center', fontWeight: 'bold' }}>TINDAKAN / CATATAN</th>
                  </tr>
                </thead>
                <tbody>
                  {generateTentativeSchedule(printJob.program).map((slot, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fcfcfc' }}>
                      <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', wordBreak: 'break-word' }}>{slot.masa}</td>
                      <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'left', wordBreak: 'break-word' }}>{slot.aktiviti}</td>
                      <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'center', wordBreak: 'break-word', color: '#444' }}>{slot.tindakan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* LAMPIRAN 2: JAWATANKUASA PELAKSANA (KERTAS KERJA) */}
            <div className="page-break" style={{ pageBreakBefore: 'always', marginTop: '36px', paddingTop: '16px' }}>
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', margin: '0', textDecoration: 'underline' }}>
                  LAMPIRAN 2: JAWATANKUASA PELAKSANA {printJob.program.namaProgram?.toUpperCase()}
                </h3>
                <p style={{ fontSize: '10px', margin: '4px 0 0 0', color: '#444' }}>
                  Persatuan Alumni Kolej Komuniti Beaufort Sabah (PAKKBS)
                </p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #777', padding: '6px 8px', width: '8%', textAlign: 'center', fontWeight: 'bold' }}>BIL</th>
                    <th style={{ border: '1px solid #777', padding: '6px 8px', width: '32%', textAlign: 'left', fontWeight: 'bold' }}>JAWATAN / PORTFOLIO</th>
                    <th style={{ border: '1px solid #777', padding: '6px 8px', width: '35%', textAlign: 'left', fontWeight: 'bold' }}>NAMA PEGAWAI / AHLI</th>
                    <th style={{ border: '1px solid #777', padding: '6px 8px', width: '25%', textAlign: 'left', fontWeight: 'bold' }}>PERANAN & TUGASAN</th>
                  </tr>
                </thead>
                <tbody>
                  {generateCommitteeList(config, printJob.program).map((item) => (
                    <tr key={item.bil} style={{ backgroundColor: item.bil % 2 === 0 ? '#fcfcfc' : '#fff' }}>
                      <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>{item.bil}</td>
                      <td style={{ border: '1px solid #999', padding: '6px 8px', fontWeight: 'bold', color: '#1e3a8a', wordBreak: 'break-word' }}>{item.jawatan}</td>
                      <td style={{ border: '1px solid #999', padding: '6px 8px', fontWeight: 'bold', textTransform: 'uppercase', wordBreak: 'break-word' }}>{item.nama}</td>
                      <td style={{ border: '1px solid #999', padding: '6px 8px', fontSize: '10px', color: '#444', wordBreak: 'break-word' }}>{item.peranan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              .page-break {
                page-break-before: always !important;
                break-before: page !important;
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

            {/* LAMPIRAN 1: ATUR CARA PROGRAM (LAPORAN) */}
            <div className="page-break" style={{ pageBreakBefore: 'always', marginTop: '36px', paddingTop: '16px' }}>
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', margin: '0', textDecoration: 'underline' }}>
                  LAMPIRAN 1: ATUR CARA {printJob.program.namaProgram?.toUpperCase()}
                </h3>
                <p style={{ fontSize: '10px', margin: '4px 0 0 0', color: '#444' }}>
                  Tarikh: <strong>{printJob.program.tarikhProgram || '-'}</strong> &nbsp;|&nbsp; Masa: <strong>{printJob.program.masaProgram || '-'}</strong> &nbsp;|&nbsp; Tempat: <strong>{printJob.program.tempatProgram || '-'}</strong>
                </p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #777', padding: '6px 8px', width: '22%', textAlign: 'center', fontWeight: 'bold' }}>MASA</th>
                    <th style={{ border: '1px solid #777', padding: '6px 8px', width: '56%', textAlign: 'left', fontWeight: 'bold' }}>PENGISIAN / AKTIVITI</th>
                    <th style={{ border: '1px solid #777', padding: '6px 8px', width: '22%', textAlign: 'center', fontWeight: 'bold' }}>TINDAKAN / CATATAN</th>
                  </tr>
                </thead>
                <tbody>
                  {generateTentativeSchedule(printJob.program).map((slot, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fcfcfc' }}>
                      <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', wordBreak: 'break-word' }}>{slot.masa}</td>
                      <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'left', wordBreak: 'break-word' }}>{slot.aktiviti}</td>
                      <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'center', wordBreak: 'break-word', color: '#444' }}>{slot.tindakan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* LAMPIRAN 2: JAWATANKUASA PELAKSANA (LAPORAN) */}
            <div className="page-break" style={{ pageBreakBefore: 'always', marginTop: '36px', paddingTop: '16px' }}>
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', margin: '0', textDecoration: 'underline' }}>
                  LAMPIRAN 2: JAWATANKUASA PELAKSANA {printJob.program.namaProgram?.toUpperCase()}
                </h3>
                <p style={{ fontSize: '10px', margin: '4px 0 0 0', color: '#444' }}>
                  Persatuan Alumni Kolej Komuniti Beaufort Sabah (PAKKBS)
                </p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #777', padding: '6px 8px', width: '8%', textAlign: 'center', fontWeight: 'bold' }}>BIL</th>
                    <th style={{ border: '1px solid #777', padding: '6px 8px', width: '32%', textAlign: 'left', fontWeight: 'bold' }}>JAWATAN / PORTFOLIO</th>
                    <th style={{ border: '1px solid #777', padding: '6px 8px', width: '35%', textAlign: 'left', fontWeight: 'bold' }}>NAMA PEGAWAI / AHLI</th>
                    <th style={{ border: '1px solid #777', padding: '6px 8px', width: '25%', textAlign: 'left', fontWeight: 'bold' }}>PERANAN & TUGASAN</th>
                  </tr>
                </thead>
                <tbody>
                  {generateCommitteeList(config, printJob.program).map((item) => (
                    <tr key={item.bil} style={{ backgroundColor: item.bil % 2 === 0 ? '#fcfcfc' : '#fff' }}>
                      <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>{item.bil}</td>
                      <td style={{ border: '1px solid #999', padding: '6px 8px', fontWeight: 'bold', color: '#1e3a8a', wordBreak: 'break-word' }}>{item.jawatan}</td>
                      <td style={{ border: '1px solid #999', padding: '6px 8px', fontWeight: 'bold', textTransform: 'uppercase', wordBreak: 'break-word' }}>{item.nama}</td>
                      <td style={{ border: '1px solid #999', padding: '6px 8px', fontSize: '10px', color: '#444', wordBreak: 'break-word' }}>{item.peranan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
