import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { SystemConfig, AlumniMember } from '../types';
import {
  Settings,
  Database,
  MessageSquare,
  Facebook,
  Music,
  Lock,
  Save,
  CheckCircle2,
  RefreshCw,
  HardDrive,
  Calendar,
  Clock,
  ExternalLink,
  FileJson,
  Trash2,
  Plus,
  Users,
  CreditCard,
  FileSpreadsheet,
  UploadCloud,
  Download,
  AlertCircle,
  X,
  UserCheck,
  Check
} from 'lucide-react';

interface SettingsPanelProps {
  config: SystemConfig;
  userRole: 'admin' | 'member';
  appsScriptUrl?: string;
  onUpdateConfig: (newConfig: SystemConfig) => Promise<boolean>;
  onUpdateAppsScriptUrl?: (url: string) => void;
  onOpenAdminModal: () => void;
  onReseedFirestore?: () => Promise<void>;
  membersCount?: number;
  onBulkAddMembers?: (newMembers: AlumniMember[]) => Promise<{ success: boolean; count: number; error?: string }>;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  config,
  userRole,
  onUpdateConfig,
  onOpenAdminModal,
  onReseedFirestore,
  membersCount = 0,
  onBulkAddMembers,
}) => {
  // Subtab navigation: [Data], [JK Persatuan], [Keahlian]
  const [activeSubTab, setActiveSubTab] = useState<'data' | 'jk' | 'keahlian'>('data');

  // Form State
  const [name, setName] = useState(config.associationName);
  const [logo, setLogo] = useState(config.associationLogoUrl);
  const [fee, setFee] = useState(config.membershipFee.toString());
  const [year, setYear] = useState(config.membershipYear);
  const [penasihat, setPenasihat] = useState(config.penasihat || '');
  const [pengerusi, setPengerusi] = useState(config.pengerusi || '');
  const [timbalanPengerusi, setTimbalanPengerusi] = useState(config.timbalanPengerusi || '');
  const [setiausaha, setSetiausaha] = useState(config.setiausaha || '');
  const [penolongSetiausaha, setPenolongSetiausaha] = useState(config.penolongSetiausaha || '');
  const [bendahari, setBendahari] = useState(config.bendahari || '');
  const [juruAudit, setJuruAudit] = useState(config.juruAudit || '');
  const [ajkList, setAjkList] = useState<string[]>(config.ajk || []);

  const [saveMsg, setSaveMsg] = useState<{ status: 'success' | 'error'; text: string } | null>(null);
  const [isReseeding, setIsReseeding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Bulk Upload Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [previewMembers, setPreviewMembers] = useState<AlumniMember[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local form state whenever config prop updates from Firestore
  useEffect(() => {
    setName(config.associationName || '');
    setLogo(config.associationLogoUrl || '');
    setFee((config.membershipFee ?? 50).toString());
    setYear(config.membershipYear || '2026');
    setPenasihat(config.penasihat || '');
    setPengerusi(config.pengerusi || '');
    setTimbalanPengerusi(config.timbalanPengerusi || '');
    setSetiausaha(config.setiausaha || '');
    setPenolongSetiausaha(config.penolongSetiausaha || '');
    setBendahari(config.bendahari || '');
    setJuruAudit(config.juruAudit || '');
    setAjkList(Array.isArray(config.ajk) ? config.ajk : []);
  }, [config]);

  const handleAddAjk = () => {
    setAjkList((prev) => [...prev, '']);
  };

  const handleAjkChange = (index: number, val: string) => {
    setAjkList((prev) => {
      const updated = [...prev];
      updated[index] = val.toUpperCase();
      return updated;
    });
  };

  const handleRemoveAjk = (index: number) => {
    setAjkList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMsg(null);
    setIsSaving(true);
    const numFee = parseFloat(fee);
    if (!name || isNaN(numFee) || !year) {
      setSaveMsg({ status: 'error', text: 'Sila lengkapkan semua maklumat wajib.' });
      setIsSaving(false);
      return;
    }

    const cleanedAjk = ajkList.map((item) => item.trim()).filter((item) => item.length > 0);

    const ok = await onUpdateConfig({
      associationName: name,
      associationLogoUrl: logo,
      membershipFee: numFee,
      membershipYear: year,
      appVersion: config.appVersion,
      penasihat: penasihat.trim(),
      pengerusi: pengerusi.trim(),
      timbalanPengerusi: timbalanPengerusi.trim(),
      setiausaha: setiausaha.trim(),
      penolongSetiausaha: penolongSetiausaha.trim(),
      bendahari: bendahari.trim(),
      juruAudit: juruAudit.trim(),
      ajk: cleanedAjk,
    });

    setIsSaving(false);
    if (ok) {
      setSaveMsg({ status: 'success', text: 'Konfigurasi berjaya dikemaskini dan disimpan ke Firestore!' });
      setTimeout(() => setSaveMsg(null), 4000);
    } else {
      setSaveMsg({ status: 'error', text: 'Ralat menyimpan konfigurasi.' });
    }
  };

  const handleTriggerReseed = async () => {
    if (!onReseedFirestore) return;
    if (window.confirm('Adakah anda pasti mahu menyegerak / muat data awal ke Firebase Firestore (icamp-aa9e4)?')) {
      setIsReseeding(true);
      try {
        await onReseedFirestore();
        setSaveMsg({ status: 'success', text: 'Penyegerakan data ke Firebase Firestore selesai!' });
      } catch (err: any) {
        setSaveMsg({ status: 'error', text: 'Ralat penyegerakan: ' + err.toString() });
      } finally {
        setIsReseeding(false);
      }
    }
  };

  const handleOpenSocial = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Muat turun templat rasmi Excel (.xlsx) untuk tambah ahli secara pukal
  const handleDownloadExcelTemplate = () => {
    const templateRows = [
      {
        'Nama Penuh': 'AHMAD BIN ALI',
        'No KP': '980102125541',
        'No Pendaftaran Pelajar': 'KKBS-2020-001',
        'Program': 'Sijil Kulinari',
        'Tahun Lulusan': '2024',
        'Tarikh Graduasi': '12/10/2024',
        'Jantina': 'Lelaki',
        'Agama': 'Islam',
        'Kaum Utama': 'Bumiputera Sabah',
        'Negeri': 'Sabah',
        'No Telefon': '0138899123',
        'Emel': 'ahmad@gmail.com',
        'No Ahli': 'ALUMNI-2026-001',
        'Pekerjaan / Jawatan': 'Demi Chef',
        'Nama Majikan': 'Hotel Grand Beaufort',
        'Status': 'Active'
      },
      {
        'Nama Penuh': 'SITI NURHALIZA BINTI MOHD',
        'No KP': '000512126622',
        'No Pendaftaran Pelajar': 'KKBS-2021-045',
        'Program': 'Sijil Kulinari',
        'Tahun Lulusan': '2024',
        'Tarikh Graduasi': '12/10/2024',
        'Jantina': 'Perempuan',
        'Agama': 'Islam',
        'Kaum Utama': 'Melayu',
        'Negeri': 'Sabah',
        'No Telefon': '0198877665',
        'Emel': 'siti.nur@yahoo.com',
        'No Ahli': 'ALUMNI-2026-002',
        'Pekerjaan / Jawatan': 'Pastry Chef',
        'Nama Majikan': 'Bakery Delights Beaufort',
        'Status': 'Active'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateRows);
    // Auto column width
    ws['!cols'] = [
      { wch: 30 }, // Nama Penuh
      { wch: 16 }, // No KP
      { wch: 24 }, // No Pendaftaran Pelajar
      { wch: 22 }, // Program
      { wch: 14 }, // Tahun Lulusan
      { wch: 16 }, // Tarikh Graduasi
      { wch: 12 }, // Jantina
      { wch: 12 }, // Agama
      { wch: 18 }, // Kaum Utama
      { wch: 14 }, // Negeri
      { wch: 16 }, // No Telefon
      { wch: 25 }, // Emel
      { wch: 18 }, // No Ahli
      { wch: 24 }, // Pekerjaan / Jawatan
      { wch: 30 }, // Nama Majikan
      { wch: 12 }  // Status
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Ahli');
    XLSX.writeFile(wb, 'Templat_Muat_Naik_Ahli_Alumni_KKBS.xlsx');
  };

  // Baca fail Excel / CSV yang dipilih pengguna
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setImportSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rawJson.length === 0) {
          setUploadError('Fail Excel kosong atau tidak mengandungi data.');
          return;
        }

        // Map data mengikut nama kolum
        const parsed: AlumniMember[] = rawJson.map((row, idx) => {
          const noAhli = String(row['No Ahli'] || row['NoAhli'] || row['noAhli'] || '').trim();
          const nama = String(row['Nama Penuh'] || row['Nama'] || row['nama'] || '').trim().toUpperCase();
          const rawKp = String(row['No KP'] || row['No K/P'] || row['NoKP'] || row['noKp'] || row['Kad Pengenalan'] || '');
          const noKp = rawKp.replace(/\D/g, '');
          const noPendaftaran = String(row['No Pendaftaran Pelajar'] || row['No Pendaftaran'] || row['No Pelajar'] || row['noPendaftaran'] || '').trim();
          const tahunLulusan = String(row['Tahun Lulusan'] || row['Tahun'] || row['tahunLulusan'] || '2026').trim();
          const program = String(row['Program'] || row['Kursus'] || row['program'] || 'Alumni KKBS').trim();
          const jantina = String(row['Jantina'] || row['jantina'] || 'Lelaki').trim();
          const agama = String(row['Agama'] || row['agama'] || 'Islam').trim();
          const kaumUtama = String(row['Kaum'] || row['Kaum Utama'] || row['kaumUtama'] || 'Bumiputera Sabah').trim();
          let tarikhGraduasi = String(row['Tarikh Graduasi'] || row['tarikhGraduasi'] || row['Tarikh Konvokesyen'] || '').trim();
          if (/^\d{5}$/.test(tarikhGraduasi)) {
            const serial = parseInt(tarikhGraduasi, 10);
            const utc_days = Math.floor(serial - 25569);
            const date_info = new Date(utc_days * 86400 * 1000);
            const day = String(date_info.getDate()).padStart(2, '0');
            const month = String(date_info.getMonth() + 1).padStart(2, '0');
            const year = date_info.getFullYear();
            tarikhGraduasi = `${day}/${month}/${year}`;
          }
          const noTelefon = String(row['No Telefon'] || row['Telefon'] || row['noTelefon'] || '').trim();
          const emel = String(row['Emel'] || row['Email'] || row['emel'] || '').trim();
          const pekerjaanJawatan = String(row['Pekerjaan / Jawatan'] || row['Pekerjaan'] || row['Jawatan'] || row['pekerjaanJawatan'] || '').trim();
          const namaMajikan = String(row['Nama Majikan'] || row['Majikan'] || row['namaMajikan'] || '').trim();
          const negeri = String(row['Negeri'] || row['negeri'] || 'Sabah').trim();
          const statusRaw = String(row['Status'] || row['status'] || 'Active').trim();
          const status = ['Active', 'Pending', 'Inactive', 'Rejected'].includes(statusRaw) ? (statusRaw as any) : 'Active';

          return {
            id: `MEM-${noKp || Date.now().toString(36) + idx}`,
            noAhli: noAhli || `ALUMNI-${Date.now().toString().slice(-4)}-${idx + 1}`,
            nama: nama || `AHLI ${idx + 1}`,
            noKp,
            noPendaftaran,
            tahunLulusan,
            program,
            jantina,
            agama,
            kaumUtama,
            tarikhGraduasi,
            noTelefon,
            emel,
            pekerjaanJawatan,
            namaMajikan,
            negeri,
            status,
            role: 'Member',
            createdAt: new Date().toISOString()
          };
        }).filter(m => m.nama && (m.noKp || m.noTelefon || m.noAhli));

        if (parsed.length === 0) {
          setUploadError('Tiada rekod sah dijumpai. Sila pastikan kolum Nama dan No KP / Telefon diisi dalam fail Excel.');
          return;
        }

        setPreviewMembers(parsed);
      } catch (err: any) {
        console.error('Error reading excel:', err);
        setUploadError('Gagal memproses fail Excel: ' + (err.message || 'Format fail tidak disokong.'));
      }
    };
    reader.readAsBinaryString(file);
  };

  // Simpan senarai ahli yang dipratonton ke Firestore
  const handleConfirmBulkImport = async () => {
    if (!onBulkAddMembers || previewMembers.length === 0) return;

    setIsImporting(true);
    setUploadError(null);
    try {
      const result = await onBulkAddMembers(previewMembers);
      if (result.success) {
        setImportSuccessMsg(`Tahniah! Sebanyak ${result.count} rekod ahli alumni berjaya dimasukkan ke pangkalan data.`);
        setPreviewMembers([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setUploadError(result.error || 'Gagal menyimpan rekod ahli ke pangkalan data.');
      }
    } catch (err: any) {
      setUploadError('Ralat sistem semasa memuat naik data: ' + err.toString());
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Admin Subtabs Bar */}
      {userRole === 'admin' && (
        <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('data')}
            className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'data'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Data</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('jk')}
            className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'jk'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>JK Persatuan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('keahlian')}
            className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'keahlian'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Keahlian</span>
          </button>
        </div>
      )}

      {/* Global save feedback message */}
      {saveMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
          saveMsg.status === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {saveMsg.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{saveMsg.text}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. SUBTAB: [DATA]                                              */}
      {/* ============================================================== */}
      {activeSubTab === 'data' && userRole === 'admin' && (
        <div className="space-y-6">
          {/* Firestore Database Status Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-900">
                <Database className="w-5 h-5 shrink-0 text-cyan-600" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider">Pangkalan Data Cloud Firestore</h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Tersambung
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-semibold">Firebase Project ID:</span>
                <span className="font-mono font-bold text-blue-700">icamp-aa9e4</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-semibold">Koleksi Firestore:</span>
                <span className="font-mono text-[11px] text-slate-700">alumni-members, alumni-transactions, alumni-programs, alumni-config, alumni-receipts</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-semibold">Jumlah Ahli Tersinkron:</span>
                <span className="font-mono font-bold text-slate-900">{membersCount} Ahli</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-semibold">Status Masa Nyata (Real-time):</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Aktif (onSnapshot)
                </span>
              </div>
            </div>

            {onReseedFirestore && (
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={handleTriggerReseed}
                  disabled={isReseeding}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin' : ''}`} />
                  <span>{isReseeding ? 'Sedang Memproses...' : 'Segerak Semula ke Firestore'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Google Drive Cloud-to-Cloud Backup Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-950">
                <HardDrive className="w-5 h-5 shrink-0 text-indigo-600" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider">Sandaran Awan (Google Drive Cloud-to-Cloud)</h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                <Clock className="w-3.5 h-3.5 text-indigo-500" /> Setiap Ahad 2:00 AM
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Data Firestore disandarkan secara cloud-to-cloud ke Google Drive secara automatik. Hanya data <strong>2 minggu terkini</strong> (14 hari) disimpan, dan fail lama dibersihkan secara automatik.
            </p>

            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 text-xs space-y-2.5">
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-semibold flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-500" /> Jadual Sandaran:
                </span>
                <span className="font-bold text-indigo-900">Setiap Hari Ahad, Jam 2:00 Pagi</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-semibold flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-amber-600" /> Dasar Pengekalan (Retention):
                </span>
                <span className="font-bold text-amber-900">14 Hari (Auto-padam fail &gt; 2 minggu)</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-semibold flex items-center gap-1.5">
                  <FileJson className="w-4 h-4 text-blue-500" /> Format Fail:
                </span>
                <span className="font-mono text-slate-800">.JSON (Penuh) + .CSV (Ringkasan Ahli)</span>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <a
                href="https://drive.google.com/drive/folders/1wGTh5vxZePNzv0hq2e51jkxuSXYVVear?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <span>Buka Folder Google Drive Sandaran</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. SUBTAB: [JK PERSATUAN]                                      */}
      {/* ============================================================== */}
      {activeSubTab === 'jk' && userRole === 'admin' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-blue-900">
              <Users className="w-5 h-5 shrink-0 text-blue-600" />
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider">Jawatankuasa & Profil Persatuan</h3>
                <p className="text-[11px] text-slate-400">Kemaskini nama rasmi persatuan dan barisan saf pimpinan jawatankuasa alumni</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-5">
            {/* Profil Persatuan */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Rasmi Persatuan</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pautan Logo Persatuan (URL Gambar)</label>
                <input
                  type="text"
                  value={logo}
                  placeholder="https://..."
                  onChange={(e) => setLogo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 focus:outline-blue-600"
                />
              </div>
            </div>

            {/* Jawatan Utama & Eksekutif */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Jawatankuasa Utama</span>
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-sans">Nama Penasihat</label>
                <input
                  type="text"
                  value={penasihat}
                  placeholder="Contoh: PENGARAH KOLEJ KOMUNITI BEAUFORT"
                  onChange={(e) => setPenasihat(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-blue-600 uppercase"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-sans">Nama Pengerusi</label>
                  <input
                    type="text"
                    value={pengerusi}
                    placeholder="Contoh: AHMAD BIN ALI"
                    onChange={(e) => setPengerusi(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-blue-600 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-sans">Nama Timbalan Pengerusi</label>
                  <input
                    type="text"
                    value={timbalanPengerusi}
                    placeholder="Contoh: MOHD SHARIF BIN KASIM"
                    onChange={(e) => setTimbalanPengerusi(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-blue-600 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-sans">Nama Setiausaha</label>
                  <input
                    type="text"
                    value={setiausaha}
                    placeholder="Contoh: SITI BINTI ABU"
                    onChange={(e) => setSetiausaha(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-blue-600 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-sans">Nama Penolong Setiausaha</label>
                  <input
                    type="text"
                    value={penolongSetiausaha}
                    placeholder="Contoh: NURUL AIN BINTI ISMAIL"
                    onChange={(e) => setPenolongSetiausaha(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-blue-600 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-sans">Nama Bendahari</label>
                  <input
                    type="text"
                    value={bendahari}
                    placeholder="Contoh: MOHD BIN OTHMAN"
                    onChange={(e) => setBendahari(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-blue-600 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-sans">Nama Juru Audit</label>
                  <input
                    type="text"
                    value={juruAudit}
                    placeholder="Contoh: FATIMAH BINTI RAMLI"
                    onChange={(e) => setJuruAudit(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-blue-600 uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Ahli Jawatankuasa (AJK) Dynamic Section */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Ahli Jawatankuasa (AJK)</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {ajkList.length} AJK
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddAjk}
                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah AJK</span>
                </button>
              </div>

              {ajkList.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-center text-xs text-slate-500">
                  Tiada Ahli Jawatankuasa (AJK) ditambah. Klik butang <strong>&quot;Tambah AJK&quot;</strong> di atas untuk menambah senarai AJK.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {ajkList.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="shrink-0 w-16 text-[11px] font-extrabold text-slate-500 bg-slate-100 px-2 py-2 rounded-xl text-center">
                        AJK {index + 1}
                      </span>
                      <input
                        type="text"
                        value={item}
                        placeholder={`Contoh: NAMA AHLI JAWATANKUASA ${index + 1}`}
                        onChange={(e) => handleAjkChange(index, e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-blue-600 uppercase"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAjk(index)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                        title="Padam AJK"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan Konfigurasi...' : 'Simpan Konfigurasi JK Persatuan'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. SUBTAB: [KEAHLIAN]                                          */}
      {/* ============================================================== */}
      {activeSubTab === 'keahlian' && userRole === 'admin' && (
        <div className="space-y-6">
          {/* Card A: Tetapan Yuran Keahlian */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900">
                <CreditCard className="w-5 h-5 shrink-0 text-blue-600" />
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider">Kadar Yuran & Tahun Aktiviti Keahlian</h3>
                  <p className="text-[11px] text-slate-400">Tetapkan kadar yuran rasmi pendaftaran dan tahun semasa persatuan</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Yuran Pendaftaran Keahlian (RM)
                  </label>
                  <input
                    type="number"
                    required
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-blue-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Kadar semasa: RM {config.membershipFee}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Tahun Aktiviti Keahlian
                  </label>
                  <input
                    type="text"
                    required
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-blue-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Tahun semasa: {config.membershipYear}</span>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Tetapan Yuran'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Card B: Pengurusan Data Ahli Pukal (Bulk Upload Excel) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900">
                <Users className="w-5 h-5 shrink-0 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider">Muat Naik Data Ahli Pukal (Bulk Import)</h3>
                  <p className="text-[11px] text-slate-400">Tambah ratusan rekod profil alumni serentak menggunakan fail Microsoft Excel (.xlsx) atau CSV</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Muat turun templat Excel rasmi"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Muat Turun Templat Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Ahli (Pukal)</span>
                </button>
              </div>
            </div>

            {/* Cadangan Jadual Data Excel (Rujukan Format) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Cadangan Jadual Format Data (Rujukan Kolum Excel)</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-medium">16 Medan Data Piawai</span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Sebelum memuat naik data ahli secara pukal, pastikan fail Excel anda disusun mengikut format kolum piawai di bawah. Anda juga boleh memuat turun templat sedia ada menggunakan butang <strong>&quot;Muat Turun Templat Excel&quot;</strong>.
              </p>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold text-[11px] uppercase">
                      <th className="py-2.5 px-3 whitespace-nowrap">Bil</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Nama Kolum (Header)</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Penerangan / Format</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Contoh Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] text-slate-600">
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-400">1</td>
                      <td className="py-2 px-3 font-bold text-slate-900">Nama Penuh</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[9px] font-bold">Wajib</span></td>
                      <td className="py-2 px-3">Nama penuh pelajar / graduan alumni</td>
                      <td className="py-2 px-3 font-mono text-slate-800">MOHAMAD AFIF BIN ABDULLAH</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-400">2</td>
                      <td className="py-2 px-3 font-bold text-slate-900">No KP</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[9px] font-bold">Wajib</span></td>
                      <td className="py-2 px-3">12 digit kad pengenalan tanpa sengkang</td>
                      <td className="py-2 px-3 font-mono text-slate-800">990102125541</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-400">3</td>
                      <td className="py-2 px-3 font-bold text-slate-900">No Pendaftaran Pelajar</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[9px] font-bold">Wajib</span></td>
                      <td className="py-2 px-3">No matrik pendaftaran kolej semasa belajar</td>
                      <td className="py-2 px-3 font-mono text-slate-800">KKBS-2021-009</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-400">4</td>
                      <td className="py-2 px-3 font-bold text-slate-900">Program</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[9px] font-bold">Wajib</span></td>
                      <td className="py-2 px-3">Nama program pengajian di KKBS</td>
                      <td className="py-2 px-3 font-mono text-slate-800">Sijil Kulinari</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-400">5</td>
                      <td className="py-2 px-3 font-bold text-slate-900">Tahun Lulusan</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[9px] font-bold">Wajib</span></td>
                      <td className="py-2 px-3">Tahun graduasi / tamat pengajian (4 digit)</td>
                      <td className="py-2 px-3 font-mono text-slate-800">2024</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-400">6</td>
                      <td className="py-2 px-3 font-bold text-slate-900">Tarikh Graduasi</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[9px] font-bold">Wajib</span></td>
                      <td className="py-2 px-3">Tarikh konvokesyen (format: dd/mm/yyyy)</td>
                      <td className="py-2 px-3 font-mono text-slate-800">12/10/2024</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-400">7</td>
                      <td className="py-2 px-3 font-bold text-slate-900">Jantina</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[9px] font-bold">Disyorkan</span></td>
                      <td className="py-2 px-3">Lelaki atau Perempuan</td>
                      <td className="py-2 px-3 font-mono text-slate-800">Lelaki</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-400">8</td>
                      <td className="py-2 px-3 font-bold text-slate-900">Agama</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[9px] font-bold">Disyorkan</span></td>
                      <td className="py-2 px-3">Agama anutan ahli (Islam / Kristian dll.)</td>
                      <td className="py-2 px-3 font-mono text-slate-800">Islam</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-400">9</td>
                      <td className="py-2 px-3 font-bold text-slate-900">Kaum Utama</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[9px] font-bold">Disyorkan</span></td>
                      <td className="py-2 px-3">Kategori etnik / kaum utama</td>
                      <td className="py-2 px-3 font-mono text-slate-800">Bumiputera Sabah</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-400">10</td>
                      <td className="py-2 px-3 font-bold text-slate-900">Negeri</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[9px] font-bold">Disyorkan</span></td>
                      <td className="py-2 px-3">Negeri asal atau tempat tinggal semasa</td>
                      <td className="py-2 px-3 font-mono text-slate-800">Sabah</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-400">11</td>
                      <td className="py-2 px-3 font-bold text-slate-900">No Telefon</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[9px] font-bold">Disyorkan</span></td>
                      <td className="py-2 px-3">Nombor telefon bimbit untuk semakan status</td>
                      <td className="py-2 px-3 font-mono text-slate-800">0138899123</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-400">12</td>
                      <td className="py-2 px-3 font-bold text-slate-900">Emel</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold">Opsyen</span></td>
                      <td className="py-2 px-3">Alamat e-mel untuk notifikasi</td>
                      <td className="py-2 px-3 font-mono text-slate-800">afif@gmail.com</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-400">13</td>
                      <td className="py-2 px-3 font-bold text-slate-900">No Ahli</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold">Opsyen</span></td>
                      <td className="py-2 px-3">No pendaftaran ahli (auto-jana jika kosong)</td>
                      <td className="py-2 px-3 font-mono text-slate-800">ALUMNI-2026-001</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-400">14</td>
                      <td className="py-2 px-3 font-bold text-slate-900">Pekerjaan / Jawatan</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold">Opsyen</span></td>
                      <td className="py-2 px-3">Jawatan atau status kerjaya terkini</td>
                      <td className="py-2 px-3 font-mono text-slate-800">Chef Eksekutif</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-400">15</td>
                      <td className="py-2 px-3 font-bold text-slate-900">Nama Majikan</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold">Opsyen</span></td>
                      <td className="py-2 px-3">Nama syarikat majikan atau agensi</td>
                      <td className="py-2 px-3 font-mono text-slate-800">Hotel Grand Beaufort</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-400">16</td>
                      <td className="py-2 px-3 font-bold text-slate-900">Status</td>
                      <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold">Opsyen</span></td>
                      <td className="py-2 px-3">Active / Pending / Inactive (default: Active)</td>
                      <td className="py-2 px-3 font-mono text-slate-800">Active</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: TAMBAH AHLI (PUKAL EXCEL / CSV)                          */}
      {/* ============================================================== */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-300 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/30 rounded-xl text-cyan-300 border border-blue-400/20">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">Muat Naik Data Ahli Pukal (Excel)</h3>
                  <p className="text-[11px] text-blue-200">Sertakan fail .xlsx, .xls atau .csv untuk mendaftar ahli ke pangkalan data</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setPreviewMembers([]);
                  setUploadError(null);
                  setImportSuccessMsg(null);
                }}
                className="p-1.5 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {uploadError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              {importSuccessMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                  <span>{importSuccessMsg}</span>
                </div>
              )}

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50/60 transition-colors">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-file-input"
                />
                <label
                  htmlFor="excel-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-1">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-extrabold text-slate-800">
                    Klik untuk pilih fail Excel (.xlsx, .xls) atau CSV
                  </span>
                  <span className="text-xs text-slate-400">
                    Fail mengandungi senarai ahli alumni yang lengkap
                  </span>
                </label>
              </div>

              {/* Action helper bar */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="text-blue-700 hover:text-blue-800 font-bold inline-flex items-center gap-1.5 hover:underline cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Belum ada templat? Muat turun templat Excel di sini</span>
                </button>
              </div>

              {/* Preview Table of Uploaded Members */}
              {previewMembers.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Pratonton Rekod Sah ({previewMembers.length} Ahli Dijumpai)</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold">Memaparkan 5 rekod pertama</span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-56">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0 text-[10px] uppercase font-black">
                        <tr>
                          <th className="py-2 px-3">Bil</th>
                          <th className="py-2 px-3">Nama</th>
                          <th className="py-2 px-3">No. KP</th>
                          <th className="py-2 px-3">No. Pendaftaran</th>
                          <th className="py-2 px-3">Program</th>
                          <th className="py-2 px-3">Tahun</th>
                          <th className="py-2 px-3">Tarikh Graduasi</th>
                          <th className="py-2 px-3">Telefon</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px] text-slate-600">
                        {previewMembers.slice(0, 5).map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-1.5 px-3 font-bold text-slate-800">{m.nama}</td>
                            <td className="py-1.5 px-3 font-mono">{m.noKp || '-'}</td>
                            <td className="py-1.5 px-3 font-mono text-slate-700">{m.noPendaftaran || '-'}</td>
                            <td className="py-1.5 px-3 truncate max-w-[150px]">{m.program}</td>
                            <td className="py-1.5 px-3">{m.tahunLulusan}</td>
                            <td className="py-1.5 px-3 font-mono text-slate-700">{m.tarikhGraduasi || '-'}</td>
                            <td className="py-1.5 px-3 font-mono">{m.noTelefon || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setPreviewMembers([]);
                  setUploadError(null);
                  setImportSuccessMsg(null);
                }}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Tutup
              </button>

              <button
                type="button"
                disabled={previewMembers.length === 0 || isImporting}
                onClick={handleConfirmBulkImport}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sedang Menyimpan Ahli...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Sahkan & Simpan {previewMembers.length > 0 ? `(${previewMembers.length} Ahli)` : ''}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Social Media & Contact Section (Common for all subtabs) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
          {userRole === 'member' ? 'Hubungi Kami & Media Sosial' : 'Media Sosial Kolej Komuniti Beaufort'}
        </h3>
        <p className="text-xs text-slate-500">Pautan pantas untuk menghubungi pentadbiran atau mengikuti perkembangan kolej.</p>
        
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleOpenSocial("https://chat.whatsapp.com/DHCBEYsZMUAE24wytVmYMn?s=cl&p=i&ilr=4&amv=0")}
            className="flex flex-col items-center p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-800 transition-all cursor-pointer"
          >
            <MessageSquare className="w-6 h-6 mb-2" />
            <span className="text-[10px] font-extrabold uppercase">WhatsApp</span>
          </button>

          <button
            onClick={() => handleOpenSocial("https://www.facebook.com/persatuanalumnikkbs")}
            className="flex flex-col items-center p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-800 transition-all cursor-pointer"
          >
            <Facebook className="w-6 h-6 mb-2" />
            <span className="text-[10px] font-extrabold uppercase">Facebook</span>
          </button>

          <button
            onClick={() => handleOpenSocial("https://www.tiktok.com/@alumni.kkbs")}
            className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-all cursor-pointer"
          >
            <Music className="w-6 h-6 mb-2" />
            <span className="text-[10px] font-extrabold uppercase">TikTok</span>
          </button>
        </div>

        {/* Maklumat Perhubungan Tambahan */}
        <div className="border-t border-slate-100 pt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-1.5">
              <span className="font-black text-[9px] text-slate-400 uppercase tracking-widest block">Alamat</span>
              <p className="font-bold text-slate-700 leading-relaxed font-sans">
                Persatuan Alumni Kolej Komuniti Beaufort Sabah (PAKKBS),<br />
                d.a Kolej Komuniti Beaufort,<br />
                Jalan Melalugus,<br />
                89807 Beaufort, Sabah.
              </p>
            </div>
            
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="font-black text-[9px] text-slate-400 uppercase tracking-widest block mb-1">Emel</span>
                <a 
                  href="mailto:alumnikkbs@gmail.com" 
                  className="font-black text-blue-600 hover:text-blue-700 text-sm hover:underline block mt-1 break-all"
                >
                  alumnikkbs@gmail.com
                </a>
              </div>
              <div className="text-[10px] text-slate-400 font-medium leading-relaxed mt-4">
                Sila hubungi emel rasmi persatuan untuk sebarang urusan persuratan atau pertanyaan alumni.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portal swap check for member view */}
      {userRole === 'member' && (
        <div className="text-center pt-4">
          <button
            onClick={onOpenAdminModal}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Tukar ke Portal Pentadbir (Admin)</span>
          </button>
        </div>
      )}
    </div>
  );
};
