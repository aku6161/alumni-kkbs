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
  penasihat?: string;
  pengerusi?: string;
  timbalanPengerusi?: string;
  setiausaha?: string;
  penolongSetiausaha?: string;
  bendahari?: string;
  juruAudit?: string;
  ajk?: string[];
  homecomingDriveScriptUrl?: string;
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

export interface HomecomingRegistration {
  id: string;
  participantType: 'Alumni' | 'Pensyarah';
  nama: string;
  noAhli?: string;
  noTelefon?: string;
  emel?: string;
  pax12Plus: number;
  pax5To11: number;
  pax4Below: number;
  totalPax: number;
  totalAmount: number;
  referenceNo: string;
  receiptNo: string;
  proofFileName: string;
  proofMimeType?: string;
  driveFileId?: string;
  driveFileUrl?: string;
  proofPreviewDataUrl?: string;
  driveSyncStatus: 'synced' | 'pending_script' | 'error';
  driveSyncMessage?: string;
  programName: string;
  createdAt: string;
}

export interface ProgramReceipt {
  id: string;
  receiptNo: string;
  date: string;
  payerName: string;
  payerIcOrReg?: string;
  payerPhone?: string;
  payerEmail?: string;
  programName: string;
  programId?: string;
  paymentCategory: string;
  paymentMethod: string;
  referenceNo: string;
  amount: number;
  description?: string;
  receivedBy: string;
  status: 'Lunas' | 'Batal';
  createdAt: string;
  autoLedgerSync?: boolean;
}

export type ViewType = 'dashboard' | 'programs' | 'homecoming_registration' | 'membership' | 'finance' | 'receipts' | 'statistics' | 'reports' | 'settings';
export type UserRole = 'landing' | 'member' | 'admin';
