import React, { useState } from 'react';
import { AlumniMember } from '../types';
import { X, ShieldCheck, ShieldAlert, Clock, Scan } from 'lucide-react';

interface QrScannerModalProps {
  members: AlumniMember[];
  isOpen: boolean;
  onClose: () => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ members, isOpen, onClose }) => {
  const [scannedId, setScannedId] = useState('');
  const [scannedMember, setScannedMember] = useState<AlumniMember | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  if (!isOpen) return null;

  const handleSimulateScan = (id: string) => {
    setScannedId(id);
    const match = members.find(m => m.id === id);
    setScannedMember(match || null);
    setHasScanned(true);
  };

  const handleManualInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedId.trim()) return;
    const match = members.find(m => m.id === scannedId.trim());
    setScannedMember(match || null);
    setHasScanned(true);
  };

  const handleClear = () => {
    setScannedId('');
    setScannedMember(null);
    setHasScanned(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 shadow-xl w-full max-w-md space-y-5 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-900">
            <Scan className="w-5 h-5" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">Imbas QR Kad Ahli</h3>
          </div>
          <button
            onClick={() => {
              handleClear();
              onClose();
            }}
            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Simulation Box */}
        {!hasScanned ? (
          <div className="space-y-4">
            <div className="h-44 bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-white relative overflow-hidden border-2 border-dashed border-blue-500/50">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <Scan className="w-12 h-12 text-blue-500 animate-pulse mb-2" />
              <p className="text-xs text-slate-400">Sedia untuk mengimbas...</p>
              
              {/* Scan viewport corner markings */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-blue-500"></div>
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-blue-500"></div>
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-blue-500"></div>
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-blue-500"></div>
            </div>

            {/* Simulation triggers dropdown */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Simulasi Imbasan QR (Uji Cepat)</label>
              <select
                onChange={(e) => handleSimulateScan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 focus:outline-blue-600"
              >
                <option value="">-- Pilih Ahli untuk Simulasi --</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nama} ({m.status === 'Active' ? 'Aktif' : 'Diproses'})
                  </option>
                ))}
              </select>
            </div>

            <div className="text-center text-xs text-slate-400">atau</div>

            {/* Manual lookup input */}
            <form onSubmit={handleManualInputSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Masukkan ID Ahli secara manual..."
                value={scannedId}
                onChange={(e) => setScannedId(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-blue-600 font-mono font-bold"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Semak ID
              </button>
            </form>
          </div>
        ) : (
          /* Scanned status report overlay card */
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-150">
            {scannedMember ? (
              <div className="space-y-4">
                {/* Result header */}
                <div className="flex flex-col items-center text-center">
                  {scannedMember.status === 'Active' ? (
                    <>
                      <div className="bg-emerald-50 p-3 rounded-full text-emerald-600 mb-3 shadow-xs">
                        <ShieldCheck className="w-10 h-10" />
                      </div>
                      <h4 className="font-black text-sm text-emerald-700 tracking-wide">KEAHLIAN SAH & AKTIF</h4>
                    </>
                  ) : (
                    <>
                      <div className="bg-rose-50 p-3 rounded-full text-rose-600 mb-3 shadow-xs">
                        <ShieldAlert className="w-10 h-10" />
                      </div>
                      <h4 className="font-black text-sm text-rose-700 tracking-wide">KEAHLIAN TIDAK AKTIF</h4>
                    </>
                  )}
                </div>

                {/* Profile detail details */}
                <div className="bg-slate-50 rounded-2xl p-4 text-xs font-semibold text-slate-700 space-y-2 border border-slate-200/50">
                  <div className="flex justify-between">
                    <span className="text-slate-400">NAMA</span>
                    <span className="font-black text-slate-800 uppercase">{scannedMember.nama}</span>
                  </div>
                  <div className="h-px bg-slate-200/50"></div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">NO. AHLI</span>
                    <span className="font-black text-slate-800">{scannedMember.noAhli || '-'}</span>
                  </div>
                  <div className="h-px bg-slate-200/50"></div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">NO. KP</span>
                    <span className="font-black text-slate-800">{scannedMember.noKp}</span>
                  </div>
                  <div className="h-px bg-slate-200/50"></div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">PROGRAM</span>
                    <span className="font-black text-slate-800 truncate max-w-[200px]">{scannedMember.program}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Failure report */
              <div className="flex flex-col items-center text-center space-y-2 py-4">
                <div className="bg-rose-50 p-3 rounded-full text-rose-600 mb-2">
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <h4 className="font-black text-sm text-rose-700">QR TIDAK DIKENALI</h4>
                <p className="text-xs text-slate-500 max-w-[280px]">
                  Kod ID ini tidak sepadan dengan mana-mana rekod alumni di dalam database Persatuan Alumni KKBS.
                </p>
              </div>
            )}

            <button
              onClick={handleClear}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all"
            >
              Imbas Seterusnya
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
