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
}

// Helper interface for committee list
interface CommitteeItem {
  bil: number;
  jawatan: string;
  nama: string;
  peranan: string;
}

// Helper function to generate contextual, smart tentative schedule based on program details
const generateTentativeSchedule = (program: Program): ScheduleItem[] => {
  const name = (program.namaProgram || '').toLowerCase();
  const timeRaw = (program.masaProgram || '').toLowerCase();
  const dateRaw = (program.tarikhProgram || '').trim();
  const isMultiDay = dateRaw.includes('&') || dateRaw.includes('dan') || dateRaw.includes('hingga') || dateRaw.includes('-');

  // 1. Ziarah Kematian / Takziah / Sumbangan Meninggal Dunia / Khairat / Tahlil / Alumni Meninggal Dunia
  if (
    name.includes('meninggal') ||
    name.includes('kematian') ||
    name.includes('takziah') ||
    name.includes('tahlil') ||
    name.includes('khairat') ||
    name.includes('jenazah') ||
    name.includes('pusara') ||
    name.includes('arwah') ||
    name.includes('allahyarham') ||
    (name.includes('kasih') && (name.includes('mati') || name.includes('meninggal') || name.includes('keluarga')))
  ) {
    const defaultTime = program.masaProgram ? program.masaProgram.split(/[-–]/)[0]?.trim() || '09:00 Pagi' : '09:00 Pagi';
    return [
      { masa: defaultTime, aktiviti: 'Ketibaan delegasi Jawatankuasa PAKKBS & wakil alumni di lokasi kediaman keluarga Allahyarham / waris' },
      { masa: 'Sesi Tahlil & Doa', aktiviti: 'Bacaan tahlil ringkas & doa selamat dipimpin oleh wakil persatuan' },
      { masa: 'Ucapan Takziah', aktiviti: 'Ucapan takziah, kata-kata semangat dan sokongan moral oleh Pengerusi / wakil Persatuan Alumni KKBS' },
      { masa: 'Penyerahan Sumbangan', aktiviti: `Majlis simbolik penyerahan sumbangan kebajikan / khairat '${program.namaProgram}' kepada waris keluarga penerima` },
      { masa: 'Ramah Mesra & Bersurai', aktiviti: 'Sesi ramah mesra bersama waris keluarga, bertanyakan khabar kebajikan & majlis bersurai' }
    ];
  }

  // 2. Ziarah Sakit / Hospital / Bantuan Musibah / Kemalangan / Bencana
  if (
    name.includes('sakit') ||
    name.includes('hospital') ||
    name.includes('wad') ||
    name.includes('musibah') ||
    name.includes('banjir') ||
    name.includes('kebakaran') ||
    name.includes('kemalangan') ||
    name.includes('bencana')
  ) {
    const defaultTime = program.masaProgram ? program.masaProgram.split(/[-–]/)[0]?.trim() || '10:00 Pagi' : '10:00 Pagi';
    return [
      { masa: defaultTime, aktiviti: 'Ketibaan delegasi Jawatankuasa PAKKBS di lokasi kediaman / hospital' },
      { masa: 'Bertanya Khabar & Doa', aktiviti: 'Sesi ramah mesra, bertanyakan perkembangan kesihatan & bacaan doa kesembuhan / afiyah' },
      { masa: 'Sokongan Moral', aktiviti: 'Ucapan kata-kata perangsang dan sokongan moral oleh Pengerusi / wakil persatuan alumni' },
      { masa: 'Penyerahan Sumbangan', aktiviti: `Penyerahan sumbangan kebajikan prihatin '${program.namaProgram}' kepada penerima / waris` },
      { masa: 'Sesi Bersurai', aktiviti: 'Sesi bersurai dan doa kebaikan bersama' }
    ];
  }

  // 3. Sumbangan / Infaq / Kanopi / Peralatan / CSR Kasih Komuniti / Cenderamata
  if (
    name.includes('sumbangan') ||
    name.includes('kasih') ||
    name.includes('infaq') ||
    name.includes('sedekah') ||
    name.includes('wakaf') ||
    name.includes('prihatin') ||
    name.includes('kanopi') ||
    name.includes('cenderamata')
  ) {
    return [
      { masa: '08:30 Pagi', aktiviti: 'Ketibaan Jawatankuasa PAKKBS, tetamu jemputan dan wakil penerima sumbangan' },
      { masa: '09:00 Pagi', aktiviti: 'Bacaan doa selamat & ucapan alu-aluan oleh Pengerusi Persatuan Alumni KKBS' },
      { masa: '09:30 Pagi', aktiviti: 'Ucapan ringkas wakil pihak pengurusan kolej / penerima sumbangan' },
      { masa: '10:00 Pagi', aktiviti: `Majlis simbolik penyerahan '${program.namaProgram}' kepada pihak penerima` },
      { masa: '10:30 Pagi', aktiviti: 'Sesi fotografi kenangan, ramah mesra bersama penerima & jamuan ringan (Bersurai 11:30 Pagi)' }
    ];
  }

  // 4. Mesyuarat Agung Tahunan (AGM) / Mesyuarat Khas / Perjumpaan Rasmi
  if (
    name.includes('agm') ||
    name.includes('mesyuarat agung') ||
    name.includes('mesyuarat tahunan') ||
    name.includes('mesyuarat khas') ||
    name.includes('mesyuarat ajk')
  ) {
    return [
      { masa: '08:00 Pagi', aktiviti: 'Pendaftaran kehadiran ahli alumni & edaran buku laporan tahunan / penyata kewangan' },
      { masa: '08:45 Pagi', aktiviti: 'Nyanyian lagu Negaraku, bacaan doa & ucapan alu-aluan Pengerusi Persatuan Alumni' },
      { masa: '09:15 Pagi', aktiviti: 'Pembentangan & pengesahan minit mesyuarat yang lalu' },
      { masa: '09:45 Pagi', aktiviti: 'Pembentangan laporan aktiviti tahunan persatuan bagi sesi lepas' },
      { masa: '10:30 Pagi', aktiviti: 'Rehat & jamuan minum pagi' },
      { masa: '11:00 Pagi', aktiviti: 'Pembentangan dan penerimaan penyata kewangan yang telah diaudit' },
      { masa: '11:45 Pagi', aktiviti: 'Perbincangan usul-usul ahli & hal-hal berbangkit (atau pemilihan AJK baharu)' },
      { masa: '01:00 Petang', aktiviti: 'Ucapan penangguhan mesyuarat, sesi fotografi & jamuan tengah hari (Bersurai)' }
    ];
  }

  // 5. Iftar / Ramadan / Majlis Berbuka Puasa / Solat Tarawih / Bubur Lambuk
  if (
    name.includes('iftar') ||
    name.includes('ramadan') ||
    name.includes('berbuka') ||
    name.includes('tarawih') ||
    name.includes('tazkirah') ||
    name.includes('qiamullail') ||
    name.includes('bubur lambuk')
  ) {
    return [
      { masa: '05:30 Petang', aktiviti: 'Ketibaan ahli alumni, dif-dif jemputan & pendaftaran kehadiran' },
      { masa: '06:00 Petang', aktiviti: 'Tazkirah Ramadan, bacaan tahlil ringkas & majlis penyerahan santunan kasih asnaf / pelajar' },
      { masa: '06:33 Petang', aktiviti: 'Sesi iftar (berbuka puasa dengan kurma & kuih-muih) serta solat Maghrib berjemaah' },
      { masa: '07:15 Petang', aktiviti: 'Jamuan makan malam perdana iftar bersama keluarga alumni & warga kolej' },
      { masa: '08:00 Malam', aktiviti: 'Solat Isyak dan solat sunat Tarawih berjemaah secara beramai-ramai' },
      { masa: '09:15 Malam', aktiviti: 'Moreh santai alumni, sesi ramah mesra, fotografi & majlis bersurai (10:00 Malam)' }
    ];
  }

  // 6. Majlis Makan Malam / Dinner / Reunion / Gala / Jamuan Raya
  if (
    name.includes('dinner') ||
    name.includes('makan malam') ||
    name.includes('reunion') ||
    name.includes('gala') ||
    name.includes('raya') ||
    name.includes('aidilfitri') ||
    name.includes('aidiladha') ||
    name.includes('hi-tea') ||
    name.includes('apresiasi') ||
    timeRaw.includes('malam')
  ) {
    return [
      { masa: '07:00 Malam', aktiviti: 'Ketibaan tetamu alumni, pendaftaran di meja urus setia & sesi bergambar photo booth' },
      { masa: '07:45 Malam', aktiviti: 'Ketibaan tetamu kehormat & tayangan montaj kenangan alumni' },
      { masa: '08:00 Malam', aktiviti: 'Nyanyian lagu Negaraku, bacaan doa pembuka & ucapan alu-aluan Pengerusi Persatuan' },
      { masa: '08:30 Malam', aktiviti: 'Jamuan makan malam perdana berhidang diserikan dengan persembahan selingan alumni' },
      { masa: '09:30 Malam', aktiviti: 'Sesi penyampaian anugerah penghargaan alumni, cabutan bertuah perdana & ramah mesra' },
      { masa: '10:30 Malam', aktiviti: 'Sesi fotografi rasmi beramai-ramai & majlis bersurai' }
    ];
  }

  // 7. Sukan / Futsal / Badminton / Bowling / Bola / Fun Run / Sukaneka / Riadah / Kayuhan
  if (
    name.includes('sukan') ||
    name.includes('futsal') ||
    name.includes('badminton') ||
    name.includes('bowling') ||
    name.includes('bola') ||
    name.includes('fun run') ||
    name.includes('riadah') ||
    name.includes('marathon') ||
    name.includes('sukaneka') ||
    name.includes('kayuhan') ||
    name.includes('cycling')
  ) {
    return [
      { masa: '07:30 Pagi', aktiviti: 'Pendaftaran peserta / pasukan & sesi taklimat keselamatan pertandingan' },
      { masa: '08:00 Pagi', aktiviti: 'Sesi pemanasan badan (warm-up) & regangan beramai-ramai' },
      { masa: '08:30 Pagi', aktiviti: 'Perlawanan pusingan awal / acara sukan bermula' },
      { masa: '10:30 Pagi', aktiviti: 'Rehat pendek & agihan minuman isotonik' },
      { masa: '11:00 Pagi', aktiviti: 'Perlawanan peringkat suku akhir & separuh akhir' },
      { masa: '12:00 Tengah Hari', aktiviti: 'Perlawanan peringkat akhir (Final) kejohanan' },
      { masa: '01:00 Petang', aktiviti: 'Majlis penutupan, penyampaian pingat/hadiah, sesi fotografi & jamuan makan (Bersurai)' }
    ];
  }

  // 8. Gotong-royong / Khidmat Masyarakat / CSR Pembersihan / Alam Sekitar / Tanaman Pokok
  if (
    name.includes('gotong') ||
    name.includes('pembersihan') ||
    name.includes('khidmat masyarakat') ||
    name.includes('tanaman') ||
    name.includes('pokok') ||
    name.includes('pantai')
  ) {
    return [
      { masa: '07:30 Pagi', aktiviti: 'Pendaftaran sukarelawan alumni & sarapan pagi' },
      { masa: '08:00 Pagi', aktiviti: 'Taklimat agihan zon tugas & pengedaran alatan keselamatan / kebersihan' },
      { masa: '08:30 Pagi', aktiviti: 'Aktiviti gotong-royong bermula secara serentak mengikut zon ditetapkan' },
      { masa: '10:30 Pagi', aktiviti: 'Rehat & jamuan minum pagi' },
      { masa: '11:00 Pagi', aktiviti: 'Sambungan kerja pembersihan, pengumpulan sisa buangan & pengemasan tapak' },
      { masa: '12:30 Tengah Hari', aktiviti: 'Majlis penutup ringkas, ucapan terima kasih, sesi fotografi & jamuan tengah hari' }
    ];
  }

  // 9. Multi-Day Programs (e.g., 13 & 14 Jun 2026, 22 & 23 Julai 2026)
  if (isMultiDay && (dateRaw.includes('&') || dateRaw.includes('dan'))) {
    const dates = dateRaw.split(/&|dan/i).map((d) => d.trim());
    const day1Date = dates[0] || 'Hari 1';
    const day2Date = dates[1] || 'Hari 2';

    return [
      { masa: `HARI 1 (${day1Date}) - 08:00 Pagi`, aktiviti: 'Pendaftaran peserta, taklimat keselamatan & sarapan pagi' },
      { masa: `HARI 1 - 09:00 Pagi`, aktiviti: `Sesi Pembukaan & Modul 1: Pengenalan / Teori Program '${program.namaProgram}'` },
      { masa: `HARI 1 - 10:30 Pagi`, aktiviti: 'Rehat & jamuan minum pagi' },
      { masa: `HARI 1 - 11:00 Pagi`, aktiviti: 'Modul 2: Bengkel Praktikal & Latihan Berkumpulan' },
      { masa: `HARI 1 - 01:00 Petang`, aktiviti: 'Makan tengah hari, solat Zohor & rehat kendiri' },
      { masa: `HARI 1 - 02:00 Petang`, aktiviti: 'Sesi Latihan Lanjutan, Pembentangan & Penilaian Harian (Selesai 05:00 Petang)' },
      { masa: `HARI 2 (${day2Date}) - 08:30 Pagi`, aktiviti: 'Pendaftaran kehadiran & Sesi Refleksi Hari Pertama' },
      { masa: `HARI 2 - 09:00 Pagi`, aktiviti: 'Modul 3: Aplikasi Industri, Simulasi Sebenar & Bimbingan Panel' },
      { masa: `HARI 2 - 10:30 Pagi`, aktiviti: 'Rehat & minum pagi' },
      { masa: `HARI 2 - 11:00 Pagi`, aktiviti: 'Sesi Soal Jawab (Q&A), Rumusan Program & Penilaian Maklum Balas' },
      { masa: `HARI 2 - 01:00 Petang`, aktiviti: 'Makan tengah hari, solat Zohor & rehat' },
      { masa: `HARI 2 - 02:30 Petang`, aktiviti: 'Majlis Penutupan Rasmi, Penyampaian Sijil/Cenderamata & Sesi Bergambar (Bersurai 04:30 Petang)' }
    ];
  }

  // 10. Kerjaya / Industri / Temuduga / Resume / Career / Kebolehpasaran
  if (
    name.includes('career') ||
    name.includes('kerjaya') ||
    name.includes('industri') ||
    name.includes('temuduga') ||
    name.includes('resume') ||
    name.includes('kebolehpasaran') ||
    name.includes('employability')
  ) {
    return [
      { masa: '08:00 Pagi', aktiviti: 'Pendaftaran peserta, sarapan pagi & edaran kit modul program' },
      { masa: '08:45 Pagi', aktiviti: 'Ketibaan tetamu jemputan, nyanyian lagu Negaraku & bacaan doa' },
      { masa: '09:00 Pagi', aktiviti: `Ucapan pembukaan program '${program.namaProgram}' oleh Pengerusi Alumni / Pegawai Pengiring` },
      { masa: '09:15 Pagi', aktiviti: 'Sesi 1: Perkongsian hala tuju kerjaya & modul kebolehpasaran industri masa kini' },
      { masa: '10:30 Pagi', aktiviti: 'Rehat minum pagi & sesi networking interaktif bersama panel jemputan' },
      { masa: '11:00 Pagi', aktiviti: 'Sesi 2: Bengkel kemahiran praktikal penulisan resume berimpak tinggi & simulasi temuduga' },
      { masa: '01:00 Petang', aktiviti: 'Makan tengah hari, solat Zohor & rehat kendiri' },
      { masa: '02:00 Petang', aktiviti: 'Sesi 3: Perkongsian pengalaman alumni industri, bimbingan kerjaya & sesi soal jawab (Q&A)' },
      { masa: '04:15 Petang', aktiviti: 'Majlis penutupan rasmi, penyampaian cenderamata penceramah & sesi fotografi (Bersurai 05:00 Petang)' }
    ];
  }

  // 11. Short / Brief Programs (< 3 hours / half-day specific)
  if (
    timeRaw.includes('1 jam') ||
    timeRaw.includes('2 jam') ||
    (timeRaw.includes('9.00') && timeRaw.includes('11.00')) ||
    (timeRaw.includes('2.00') && timeRaw.includes('4.00')) ||
    timeRaw.includes('10.00 pagi')
  ) {
    return [
      { masa: 'Pendaftaran & Ketibaan', aktiviti: 'Ketibaan tetamu jemputan, pendaftaran kehadiran & taklimat ringkas' },
      { masa: 'Pelaksanaan Acara', aktiviti: `Pelaksanaan aktiviti utama program: '${program.namaProgram}'` },
      { masa: 'Penutupan & Jamuan', aktiviti: 'Simbolik penyerahan / penutupan, sesi fotografi kenangan & jamuan ringan' }
    ];
  }

  // 12. Standard 1-Day Program / Kursus / Bengkel / Latihan (Default Ringkas & Padat)
  return [
    { masa: '08:00 Pagi', aktiviti: 'Pendaftaran peserta, sarapan pagi & edaran bahan modul' },
    { masa: '08:45 Pagi', aktiviti: 'Ketibaan tetamu jemputan, nyanyian lagu Negaraku & bacaan doa' },
    { masa: '09:00 Pagi', aktiviti: `Sesi 1: Pengenalan & modul perkongsian program '${program.namaProgram}'` },
    { masa: '10:30 Pagi', aktiviti: 'Rehat & jamuan minum pagi (networking alumni)' },
    { masa: '11:00 Pagi', aktiviti: 'Sesi 2: Bengkel kemahiran praktikal & aktiviti interaktif bersama peserta' },
    { masa: '01:00 Petang', aktiviti: 'Makan tengah hari, solat Zohor & rehat kendiri' },
    { masa: '02:00 Petang', aktiviti: 'Sesi 3: Perkongsian aplikasi amali, sesi bimbingan & soal jawab (Q&A)' },
    { masa: '04:15 Petang', aktiviti: 'Majlis penutupan rasmi, penyampaian sijil/cenderamata & sesi fotografi (Bersurai 05:00 Petang)' }
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

  // 7. Ahli Jawatankuasa (AJK)
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
                size: A4 portrait;
                margin: 14mm 15mm 15mm 15mm !important;
              }
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
                background: transparent !important;
              }
              body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                background-color: #fff !important;
                color: #000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-container {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
                overflow: visible !important;
              }
              .page-break {
                page-break-before: always !important;
                break-before: page !important;
                clear: both !important;
                display: block !important;
                width: 100% !important;
              }
              table {
                width: 100% !important;
                max-width: 100% !important;
                margin-left: auto !important;
                margin-right: auto !important;
                table-layout: fixed !important;
                word-break: break-word !important;
                border-collapse: collapse !important;
                box-sizing: border-box !important;
              }
              tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              td, th {
                word-break: break-word !important;
                box-sizing: border-box !important;
              }
            }
          `}</style>

          {/* 1. DOKUMEN UTAMA KERTAS KERJA */}
          <div style={{ width: '100%', boxSizing: 'border-box' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginTop: '48px', textAlign: 'center', fontSize: '12px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
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

          {/* 2. LAMPIRAN 1: TENTATIF PROGRAM (HALAMAN BERASINGAN) */}
          <div className="page-break" style={{ pageBreakBefore: 'always', breakBefore: 'page', clear: 'both', width: '100%', paddingTop: '10px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
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
                  <th style={{ border: '1px solid #777', padding: '6px 8px', width: '25%', textAlign: 'center', fontWeight: 'bold' }}>MASA</th>
                  <th style={{ border: '1px solid #777', padding: '6px 8px', width: '75%', textAlign: 'left', fontWeight: 'bold' }}>PENGISIAN / AKTIVITI</th>
                </tr>
              </thead>
              <tbody>
                {generateTentativeSchedule(printJob.program).map((slot, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fcfcfc' }}>
                    <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', wordBreak: 'break-word' }}>{slot.masa}</td>
                    <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'left', wordBreak: 'break-word' }}>{slot.aktiviti}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 3. LAMPIRAN 2: JAWATANKUASA PELAKSANA (HALAMAN BERASINGAN) */}
          <div className="page-break" style={{ pageBreakBefore: 'always', breakBefore: 'page', clear: 'both', width: '100%', paddingTop: '10px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
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
                  <th style={{ border: '1px solid #777', padding: '6px 8px', width: '10%', textAlign: 'center', fontWeight: 'bold' }}>BIL</th>
                  <th style={{ border: '1px solid #777', padding: '6px 8px', width: '45%', textAlign: 'left', fontWeight: 'bold' }}>JAWATAN / PORTFOLIO</th>
                  <th style={{ border: '1px solid #777', padding: '6px 8px', width: '45%', textAlign: 'left', fontWeight: 'bold' }}>NAMA PEGAWAI / AHLI</th>
                </tr>
              </thead>
              <tbody>
                {generateCommitteeList(config, printJob.program).map((item) => (
                  <tr key={item.bil} style={{ backgroundColor: item.bil % 2 === 0 ? '#fcfcfc' : '#fff' }}>
                    <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>{item.bil}</td>
                    <td style={{ border: '1px solid #999', padding: '6px 8px', fontWeight: 'bold', color: '#1e3a8a', wordBreak: 'break-word' }}>{item.jawatan}</td>
                    <td style={{ border: '1px solid #999', padding: '6px 8px', fontWeight: 'bold', textTransform: 'uppercase', wordBreak: 'break-word' }}>{item.nama}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {printJob && printJob.type === 'laporan' && (
        <div className="hidden print:block print-container" style={{ backgroundColor: '#fff', color: '#000', fontFamily: 'Georgia, serif', fontSize: '12px', lineHeight: '1.4', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 14mm 15mm 15mm 15mm !important;
              }
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
                background: transparent !important;
              }
              body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                background-color: #fff !important;
                color: #000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-container {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
                overflow: visible !important;
              }
              .page-break {
                page-break-before: always !important;
                break-before: page !important;
                clear: both !important;
                display: block !important;
                width: 100% !important;
              }
              table {
                width: 100% !important;
                max-width: 100% !important;
                margin-left: auto !important;
                margin-right: auto !important;
                table-layout: fixed !important;
                word-break: break-word !important;
                border-collapse: collapse !important;
                box-sizing: border-box !important;
              }
              tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              td, th {
                word-break: break-word !important;
                box-sizing: border-box !important;
              }
            }
          `}</style>

          {/* 1. DOKUMEN UTAMA LAPORAN */}
          <div style={{ width: '100%', boxSizing: 'border-box' }}>
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

            {/* Section 6 */}
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '12px' }}>6. IMPAK & KESIMPULAN</h4>
              <p style={{ textAlign: 'justify', paddingLeft: '16px', margin: '0', fontWeight: 'normal', fontSize: '12px' }}>
                Pihak persatuan telah merekodkan impak positif di mana penglibatan alumni dapat dirangsang secara aktif. Secara keseluruhannya, program ini telah mencapai KPI utama yang telah digariskan dalam kertas cadangan awal.
              </p>
            </div>

            {/* Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginTop: '48px', textAlign: 'center', fontSize: '12px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
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

          {/* 2. LAMPIRAN 1: ATUR CARA PROGRAM (HALAMAN BERASINGAN) */}
          <div className="page-break" style={{ pageBreakBefore: 'always', breakBefore: 'page', clear: 'both', width: '100%', paddingTop: '10px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
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
                  <th style={{ border: '1px solid #777', padding: '6px 8px', width: '25%', textAlign: 'center', fontWeight: 'bold' }}>MASA</th>
                  <th style={{ border: '1px solid #777', padding: '6px 8px', width: '75%', textAlign: 'left', fontWeight: 'bold' }}>PENGISIAN / AKTIVITI</th>
                </tr>
              </thead>
              <tbody>
                {generateTentativeSchedule(printJob.program).map((slot, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fcfcfc' }}>
                    <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', wordBreak: 'break-word' }}>{slot.masa}</td>
                    <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'left', wordBreak: 'break-word' }}>{slot.aktiviti}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 3. LAMPIRAN 2: JAWATANKUASA PELAKSANA (HALAMAN BERASINGAN) */}
          <div className="page-break" style={{ pageBreakBefore: 'always', breakBefore: 'page', clear: 'both', width: '100%', paddingTop: '10px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
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
                  <th style={{ border: '1px solid #777', padding: '6px 8px', width: '10%', textAlign: 'center', fontWeight: 'bold' }}>BIL</th>
                  <th style={{ border: '1px solid #777', padding: '6px 8px', width: '45%', textAlign: 'left', fontWeight: 'bold' }}>JAWATAN / PORTFOLIO</th>
                  <th style={{ border: '1px solid #777', padding: '6px 8px', width: '45%', textAlign: 'left', fontWeight: 'bold' }}>NAMA PEGAWAI / AHLI</th>
                </tr>
              </thead>
              <tbody>
                {generateCommitteeList(config, printJob.program).map((item) => (
                  <tr key={item.bil} style={{ backgroundColor: item.bil % 2 === 0 ? '#fcfcfc' : '#fff' }}>
                    <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>{item.bil}</td>
                    <td style={{ border: '1px solid #999', padding: '6px 8px', fontWeight: 'bold', color: '#1e3a8a', wordBreak: 'break-word' }}>{item.jawatan}</td>
                    <td style={{ border: '1px solid #999', padding: '6px 8px', fontWeight: 'bold', textTransform: 'uppercase', wordBreak: 'break-word' }}>{item.nama}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
