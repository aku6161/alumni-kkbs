import React, { useState } from 'react';
import { AlumniMember } from '../types';
import { Search, ShieldAlert, Award, Calendar, BookOpen, User } from 'lucide-react';
import { formatDateString } from '../utils/date';

interface MemberDirectoryProps {
  members: AlumniMember[];
}

export const MemberDirectory: React.FC<MemberDirectoryProps> = ({ members }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [foundMember, setFoundMember] = useState<AlumniMember | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    
    // Clean IC formatting (remove dashes)
    const cleanQuery = searchQuery.replace(/\D/g, '').trim();
    if (!cleanQuery) {
      setFoundMember(null);
      return;
    }

    const match = members.find(m => String(m.noKp || '').replace(/\D/g, '').padStart(12, '0') === cleanQuery.padStart(12, '0'));
    setFoundMember(match || null);
  };

  const handleClear = () => {
    setSearchQuery('');
    setFoundMember(null);
    setHasSearched(false);
  };

  const formatIcNumber = (val: any): string => {
    const str = String(val || '');
    const digits = str.replace(/\D/g, '').substring(0, 12);
    if (digits.length <= 6) return digits;
    if (digits.length <= 8) return `${digits.substring(0, 6)}-${digits.substring(6)}`;
    return `${digits.substring(0, 6)}-${digits.substring(6, 8)}-${digits.substring(8)}`;
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs">
        <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-2">Carian Ahli Alumni</h3>
        <p className="text-xs text-slate-500 mb-4">
          Masukkan 12 digit nombor Kad Pengenalan untuk membuat semakan status keahlian alumni didalam database.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Contoh: 950505-12-5678"
              value={searchQuery}
              onChange={(e) => setSearchQuery(formatIcNumber(e.target.value))}
              className="bg-transparent text-sm w-full outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            Semak
          </button>
        </form>
      </div>

      {/* Lookup results */}
      {hasSearched && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
          {foundMember ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">{foundMember.nama}</h4>
                    <p className="text-xs text-slate-400 font-mono">No. Ahli: {foundMember.noAhli || 'DALAM PROSES'}</p>
                  </div>
                </div>
                
                {/* Status indicator tag */}
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border ${
                  foundMember.status === 'Active'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : foundMember.status === 'Pending'
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}>
                  {foundMember.status === 'Active' ? 'Aktif' : foundMember.status === 'Pending' ? 'Diproses' : 'Ditolak'}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-2.5">
                  <Award className="w-4.5 h-4.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Program Pengajian</p>
                    <p className="text-xs text-slate-700 font-semibold mt-0.5">{foundMember.program}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4.5 h-4.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tahun Lulusan & Tarikh Graduasi</p>
                    <p className="text-xs text-slate-700 font-semibold mt-0.5">{foundMember.tahunLulusan} ({formatDateString(foundMember.tarikhGraduasi)})</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <BookOpen className="w-4.5 h-4.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Negeri Mastautin</p>
                    <p className="text-xs text-slate-700 font-semibold mt-0.5">{foundMember.negeri || '-'}</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 text-center">
                <button
                  onClick={handleClear}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                >
                  Padam Carian
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 flex items-center gap-4 text-rose-800">
              <ShieldAlert className="w-8 h-8 text-rose-600 shrink-0" />
              <div>
                <h4 className="font-extrabold text-sm">Rekod Tidak Dijumpai</h4>
                <p className="text-xs text-rose-700/90 mt-0.5 leading-relaxed">
                  Tiada rekod keahlian bagi nombor kad pengenalan ini di dalam pangkalan data. Sila semak semula nombor KP anda.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
