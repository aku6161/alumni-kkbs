import React, { useState, useEffect } from 'react';
import { SystemConfig } from '../types';
import { Settings, Database, MessageSquare, Facebook, Music, Lock, Save, CheckCircle2, RefreshCw, ShieldCheck, HardDrive, Calendar, Clock, ExternalLink, FileJson, Trash2 } from 'lucide-react';

interface SettingsPanelProps {
  config: SystemConfig;
  userRole: 'admin' | 'member';
  appsScriptUrl?: string;
  onUpdateConfig: (newConfig: SystemConfig) => Promise<boolean>;
  onUpdateAppsScriptUrl?: (url: string) => void;
  onOpenAdminModal: () => void;
  onReseedFirestore?: () => Promise<void>;
  membersCount?: number;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  config,
  userRole,
  onUpdateConfig,
  onOpenAdminModal,
  onReseedFirestore,
  membersCount = 0,
}) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(config.associationName);
  const [logo, setLogo] = useState(config.associationLogoUrl);
  const [fee, setFee] = useState(config.membershipFee.toString());
  const [year, setYear] = useState(config.membershipYear);
  const [pengerusi, setPengerusi] = useState(config.pengerusi || '');
  const [setiausaha, setSetiausaha] = useState(config.setiausaha || '');
  const [bendahari, setBendahari] = useState(config.bendahari || '');
  const [juruAudit, setJuruAudit] = useState(config.juruAudit || '');

  const [saveMsg, setSaveMsg] = useState<{ status: 'success' | 'error'; text: string } | null>(null);
  const [isReseeding, setIsReseeding] = useState(false);

  // Sync local form state whenever config prop updates from Firestore
  useEffect(() => {
    setName(config.associationName || '');
    setLogo(config.associationLogoUrl || '');
    setFee((config.membershipFee ?? 50).toString());
    setYear(config.membershipYear || '2026');
    setPengerusi(config.pengerusi || '');
    setSetiausaha(config.setiausaha || '');
    setBendahari(config.bendahari || '');
    setJuruAudit(config.juruAudit || '');
  }, [config]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMsg(null);
    const numFee = parseFloat(fee);
    if (!name || isNaN(numFee) || !year) {
      setSaveMsg({ status: 'error', text: 'Sila lengkapkan semua maklumat wajib.' });
      return;
    }

    const ok = await onUpdateConfig({
      associationName: name,
      associationLogoUrl: logo,
      membershipFee: numFee,
      membershipYear: year,
      appVersion: config.appVersion,
      pengerusi,
      setiausaha,
      bendahari,
      juruAudit
    });

    if (ok) {
      setSaveMsg({ status: 'success', text: 'Konfigurasi persatuan disimpan ke Firestore (icamp-aa9e4)!' });
      setEditing(false);
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* 1. Firestore Database Status Card */}
      {userRole === 'admin' && (
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
              <span className="font-mono text-[11px] text-slate-700">alumni-members, alumni-transactions, alumni-programs, alumni-config</span>
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
      )}

      {/* 2. Google Drive Cloud-to-Cloud Backup Card */}
      {userRole === 'admin' && (
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
      )}

      {/* 3. Association Branding Variables Form */}
      {userRole === 'admin' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <div className="flex items-center gap-2 text-blue-900">
              <Settings className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider">Konfigurasi Persatuan Alumni</h3>
            </div>
          </div>

          {saveMsg && (
            <div className={`p-3.5 rounded-xl text-xs font-bold ${
              saveMsg.status === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
            }`}>
              {saveMsg.text}
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-sans">Nama Persatuan</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-sans">Yuran Pendaftaran (RM)</label>
                <input
                  type="number"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-sans">Tahun Aktiviti Keahlian</label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-blue-600"
                />
              </div>
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
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 font-sans">Nama Setiausaha</label>
                <input
                  type="text"
                  value={setiausaha}
                  placeholder="Contoh: SITI BINTI ABU"
                  onChange={(e) => setSetiausaha(e.target.value.toUpperCase())}
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

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Save className="w-4.5 h-4.5" />
                <span>Simpan Konfigurasi</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Social Media Section */}
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

      {/* Portal swap check */}
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
