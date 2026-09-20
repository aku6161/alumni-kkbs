export interface AlumniMember {
  id: string;
  noAhli: string;
  nama: string;
  noKp: string;
  noPendaftaran: string;
  tahunLulusan: string;
  program: string;
  jantina: string;
  agama: string;
  kaumUtama: string;
  tarikhGraduasi: string;
  noTelefon: string;
  emel: string;
  pekerjaanJawatan: string;
  namaMajikan: string;
  negeri: string;
  status: 'Pending' | 'Active' | 'Inactive' | 'Rejected';
  role: 'Member' | 'Admin';
  createdAt?: string;
  password?: string;
}

export interface Transaction {
  id: string;
  date: string;
  category: string;
  amount: number;
  type: 'Income' | 'Expense';
  description: string;
  receiptUrl: string;
}

export interface SystemConfig {
  associationName: string;
  associationLogoUrl: string;
  membershipFee: number;
  membershipYear: string;
  appVersion: string;
  pengerusi?: string;
  setiausaha?: string;
  bendahari?: string;
  juruAudit?: string;
}

export interface Program {
  id: string;
  namaProgram: string;
  tarikhProgram: string;
  masaProgram: string;
  tempatProgram: string;
  kerjasama: string;
  implikasiKewangan: string;
  sasaranPeserta: string;
  bilanganPeserta: number;
}

export type ViewType = 'dashboard' | 'programs' | 'membership' | 'finance' | 'statistics' | 'reports' | 'settings';
export type UserRole = 'landing' | 'member' | 'admin';
