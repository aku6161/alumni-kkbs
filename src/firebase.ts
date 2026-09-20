import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { AlumniMember, Transaction, Program, SystemConfig } from './types';
import { INITIAL_MEMBERS, INITIAL_TRANSACTIONS, INITIAL_CONFIG } from './data/initialData';

const getApiKey = () => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY) {
      return import.meta.env.VITE_FIREBASE_API_KEY;
    }
  } catch {}
  return "AIzaSyDummyKeyForFirestoreInit";
};

const firebaseConfig = {
  apiKey: getApiKey(),
  authDomain: "icamp-aa9e4.firebaseapp.com",
  projectId: "icamp-aa9e4",
  storageBucket: "icamp-aa9e4.firebasestorage.app",
  messagingSenderId: "367351658392",
  appId: "1:367351658392:web:icamp-alumni"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Collection Names with 'alumni-' prefix
export const COLLECTIONS = {
  MEMBERS: 'alumni-members',
  TRANSACTIONS: 'alumni-transactions',
  PROGRAMS: 'alumni-programs',
  CONFIG: 'alumni-config'
} as const;

export const INITIAL_PROGRAMS_LIST: Program[] = [
  {
    id: 'PROG-1',
    namaProgram: 'Kejohanan Badminton Alumni KKBS 2025',
    tarikhProgram: '14 Ogos 2025',
    masaProgram: '8:00 Pagi - 2:00 Petang',
    tempatProgram: 'Dewan Sukan Beaufort',
    kerjasama: 'Majlis Belia Beaufort',
    implikasiKewangan: 'RM 450.00',
    sasaranPeserta: 'Semua Ahli Alumni',
    bilanganPeserta: 40
  },
  {
    id: 'PROG-2',
    namaProgram: 'Bengkel Kerjaya & Keusahawanan Alumni KKBS',
    tarikhProgram: '20 Disember 2025',
    masaProgram: '9:00 Pagi - 1:00 Tengah Hari',
    tempatProgram: 'Bilik Seminar Kolej Komuniti Beaufort',
    kerjasama: 'Unit Keusahawanan KKBS',
    implikasiKewangan: 'RM 600.00',
    sasaranPeserta: 'Alumni & Pelajar Semester Akhir',
    bilanganPeserta: 80
  },
  {
    id: 'PROG-3',
    namaProgram: 'Mesyuarat Agung Tahunan (AGM) Persatuan Alumni KKBS Kali Ke-5',
    tarikhProgram: '15 Mac 2026',
    masaProgram: '8:30 Pagi - 12:30 Tengah Hari',
    tempatProgram: 'Dewan Kuliah Utama KKBS',
    kerjasama: 'Pengurusan KKBS',
    implikasiKewangan: 'RM 800.00',
    sasaranPeserta: 'Semua Ahli Berdaftar',
    bilanganPeserta: 120
  },
  {
    id: 'PROG-4',
    namaProgram: 'Program Iftar Perdana & Santunan Kasih Ramadan Alumni KKBS',
    tarikhProgram: '28 Mac 2026',
    masaProgram: '5:30 Petang - 9:00 Malam',
    tempatProgram: 'Dewan Serbaguna KKBS',
    kerjasama: 'Surau An-Nur KKBS & Jawatankuasa Kebajikan',
    implikasiKewangan: 'RM 1,500.00',
    sasaranPeserta: 'Ahli Alumni, Pelajar & Asnaf',
    bilanganPeserta: 150
  },
  {
    id: 'PROG-5',
    namaProgram: 'Karnival Sukaneka & Kejohanan Futsal Tertutup Alumni KKBS',
    tarikhProgram: '10 Mei 2026',
    masaProgram: '8:00 Pagi - 5:00 Petang',
    tempatProgram: 'Gelanggang Futsal Kompleks Sukan Beaufort',
    kerjasama: 'Kelab Sukan KKBS',
    implikasiKewangan: 'RM 1,200.00',
    sasaranPeserta: 'Ahli Alumni Mengikut Sijil/Kohort',
    bilanganPeserta: 90
  },
  {
    id: 'PROG-6',
    namaProgram: 'Kursus Pensijilan & Peningkatan Kemahiran Elektrik (Wireman PW2/PW4)',
    tarikhProgram: '14 Jun 2026',
    masaProgram: '9:00 Pagi - 4:00 Petang',
    tempatProgram: 'Bengkel Teknologi Elektrik KKBS',
    kerjasama: 'Suruhanjaya Tenaga (ST) & Unit Elektrik KKBS',
    implikasiKewangan: 'RM 750.00',
    sasaranPeserta: 'Lulusan Sijil Pemasangan / Teknologi Elektrik',
    bilanganPeserta: 35
  },
  {
    id: 'PROG-7',
    namaProgram: 'Bengkel Kemahiran Kulinari & Pastri Komersial Alumni',
    tarikhProgram: '18 Julai 2026',
    masaProgram: '8:30 Pagi - 3:30 Petang',
    tempatProgram: 'Dapur Latihan Kulinari KKBS',
    kerjasama: 'Persatuan Chef Sabah',
    implikasiKewangan: 'RM 950.00',
    sasaranPeserta: 'Lulusan Sijil Kulinari & Pengusaha Bakeri Alumni',
    bilanganPeserta: 30
  },
  {
    id: 'PROG-8',
    namaProgram: 'Program Khidmat Komuniti & CSR "Alumni Prihatin" Beaufort',
    tarikhProgram: '22 Ogos 2026',
    masaProgram: '8:00 Pagi - 2:00 Petang',
    tempatProgram: 'Kampung Weston / Lumadan, Beaufort',
    kerjasama: 'JKKK Kampung & Pusat Khidmat Parlimen Beaufort',
    implikasiKewangan: 'RM 1,000.00',
    sasaranPeserta: 'Sukarelawan Alumni KKBS',
    bilanganPeserta: 50
  },
  {
    id: 'PROG-9',
    namaProgram: 'Sambutan Hari Kebangsaan & Konvoi Kembara Merdeka Alumni KKBS',
    tarikhProgram: '30 Ogos 2026',
    masaProgram: '7:30 Pagi - 1:00 Tengah Hari',
    tempatProgram: 'Dataran Bagandang Beaufort',
    kerjasama: 'Kelab Permotoran Alumni & PDRM Beaufort',
    implikasiKewangan: 'RM 500.00',
    sasaranPeserta: 'Semua Ahli Alumni KKBS',
    bilanganPeserta: 60
  },
  {
    id: 'PROG-10',
    namaProgram: 'Forum Bicara Alumni & Perkongsian Industri (Graduan Maju)',
    tarikhProgram: '19 September 2026',
    masaProgram: '9:00 Pagi - 12:00 Tengah Hari',
    tempatProgram: 'Auditorium Kolej Komuniti Beaufort',
    kerjasama: 'Unit Kaunseling & Kerjaya KKBS',
    implikasiKewangan: 'RM 400.00',
    sasaranPeserta: 'Pelajar Baharu & Semester Akhir',
    bilanganPeserta: 100
  },
  {
    id: 'PROG-11',
    namaProgram: 'Majlis Makan Malam Gala Tahunan & Anugerah Ikon Alumni KKBS',
    tarikhProgram: '14 November 2026',
    masaProgram: '7:30 Malam - 11:00 Malam',
    tempatProgram: 'Dewan Ballroom Hotel Grand Beaufort',
    kerjasama: 'Pihak Pengurusan KKBS & Penaja Korporat',
    implikasiKewangan: 'RM 3,500.00',
    sasaranPeserta: 'Ahli Alumni, Staf Kolej & Tetamu Kehormat',
    bilanganPeserta: 200
  },
  {
    id: 'PROG-12',
    namaProgram: 'Program Jejak Alumni & Kemas Kini Profil Kebolehpasaran',
    tarikhProgram: '5 Disember 2026',
    masaProgram: '9:00 Pagi - 4:00 Petang',
    tempatProgram: 'Portal Rasmi Alumni KKBS (Hibrid)',
    kerjasama: 'Unit Pengesanan Graduan (Tracer Study) KKBS',
    implikasiKewangan: 'RM 300.00',
    sasaranPeserta: 'Semua Graduan Kohort 2015-2025',
    bilanganPeserta: 300
  }
];

// Helper to determine active/inactive status from phone number
export const getMemberStatus = (noTelefon: string | undefined | null): 'Active' | 'Inactive' => {
  const phone = String(noTelefon || '').replace(/\D/g, '');
  if (!phone || phone === '0120000000' || phone === '01200000000' || phone === '-') {
    return 'Inactive';
  }
  return 'Active';
};

/**
 * Seed initial data if Firestore collections are empty
 */
export async function seedInitialFirestoreData(): Promise<void> {
  try {
    // 1. Check & Seed Config
    const configDocRef = doc(db, COLLECTIONS.CONFIG, 'system');
    const configSnap = await getDoc(configDocRef);
    if (!configSnap.exists()) {
      console.log('Seeding initial config to Firestore...');
      await setDoc(configDocRef, INITIAL_CONFIG);
    }

    // 2. Check & Seed Programs
    const progSnap = await getDocs(collection(db, COLLECTIONS.PROGRAMS));
    if (progSnap.empty) {
      console.log('Seeding initial programs to Firestore...');
      const batch = writeBatch(db);
      INITIAL_PROGRAMS_LIST.forEach(prog => {
        const ref = doc(db, COLLECTIONS.PROGRAMS, prog.id);
        batch.set(ref, prog);
      });
      await batch.commit();
    }

    // 3. Check & Seed Transactions (only if INITIAL_TRANSACTIONS has records)
    const txSnap = await getDocs(collection(db, COLLECTIONS.TRANSACTIONS));
    if (txSnap.empty && INITIAL_TRANSACTIONS.length > 0) {
      console.log('Seeding initial transactions to Firestore...');
      const batch = writeBatch(db);
      INITIAL_TRANSACTIONS.forEach(tx => {
        const ref = doc(db, COLLECTIONS.TRANSACTIONS, tx.id);
        batch.set(ref, tx);
      });
      await batch.commit();
    }

    // 4. Check & Seed Members (in chunks of 400 to respect 500-op limit)
    const membersSnap = await getDocs(collection(db, COLLECTIONS.MEMBERS));
    if (membersSnap.empty) {
      console.log(`Seeding ${INITIAL_MEMBERS.length} initial members to Firestore...`);
      const chunkSize = 400;
      for (let i = 0; i < INITIAL_MEMBERS.length; i += chunkSize) {
        const chunk = INITIAL_MEMBERS.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(m => {
          const docId = m.id || `MEM-${m.noAhli || Math.random().toString(36).substring(7)}`;
          const ref = doc(db, COLLECTIONS.MEMBERS, docId);
          batch.set(ref, {
            ...m,
            id: docId,
            status: m.status || 'Active'
          });
        });
        await batch.commit();
        console.log(`Seeded members chunk ${i + 1} - ${Math.min(i + chunkSize, INITIAL_MEMBERS.length)}`);
      }
    }
  } catch (error) {
    console.error('Error during Firestore data seeding:', error);
  }
}

/**
 * Real-time listener for Members
 */
export function subscribeToMembers(
  onUpdate: (members: AlumniMember[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.MEMBERS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: AlumniMember[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as AlumniMember;
        items.push({
          ...data,
          id: doc.id,
          status: data.status || getMemberStatus(data.noTelefon)
        });
      });
      // Sort members by id (MEM-1, MEM-2...) or noAhli
      items.sort((a, b) => {
        const numA = parseInt((a.id || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt((b.id || '').replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });
      onUpdate(items);
    },
    (err) => {
      console.error('Error listening to alumni-members:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time listener for Transactions
 */
export function subscribeToTransactions(
  onUpdate: (txs: Transaction[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.TRANSACTIONS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Transaction[] = [];
      snapshot.forEach((doc) => {
        items.push({ ...(doc.data() as Transaction), id: doc.id });
      });
      onUpdate(items);
    },
    (err) => {
      console.error('Error listening to alumni-transactions:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time listener for Programs
 */
export function subscribeToPrograms(
  onUpdate: (programs: Program[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.PROGRAMS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Program[] = [];
      snapshot.forEach((doc) => {
        items.push({ ...(doc.data() as Program), id: doc.id });
      });
      onUpdate(items);
    },
    (err) => {
      console.error('Error listening to alumni-programs:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time listener for System Config
 */
export function subscribeToConfig(
  onUpdate: (cfg: SystemConfig) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const docRef = doc(db, COLLECTIONS.CONFIG, 'system');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as SystemConfig);
      } else {
        onUpdate(INITIAL_CONFIG);
      }
    },
    (err) => {
      console.error('Error listening to alumni-config:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------- CRUD Operations -----------------

export async function addOrUpdateMember(member: AlumniMember): Promise<boolean> {
  try {
    const docId = member.id || `MEM-${Date.now()}`;
    const docRef = doc(db, COLLECTIONS.MEMBERS, docId);
    await setDoc(docRef, { ...member, id: docId }, { merge: true });
    return true;
  } catch (err) {
    console.error('Error saving member to Firestore:', err);
    return false;
  }
}

export async function updateMemberPartial(id: string, data: Partial<AlumniMember>): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTIONS.MEMBERS, id);
    await updateDoc(docRef, data);
    return true;
  } catch (err) {
    console.error(`Error updating member ${id}:`, err);
    return false;
  }
}

export async function deleteMemberFromFirestore(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTIONS.MEMBERS, id);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error(`Error deleting member ${id}:`, err);
    return false;
  }
}

export async function addOrUpdateTransaction(tx: Transaction): Promise<boolean> {
  try {
    const docId = tx.id || `TX-${Date.now()}`;
    const docRef = doc(db, COLLECTIONS.TRANSACTIONS, docId);
    await setDoc(docRef, { ...tx, id: docId }, { merge: true });
    return true;
  } catch (err) {
    console.error('Error saving transaction:', err);
    return false;
  }
}

export async function deleteTransactionFromFirestore(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTIONS.TRANSACTIONS, id);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Error deleting transaction:', err);
    return false;
  }
}

export async function addOrUpdateProgram(program: Program): Promise<boolean> {
  try {
    const docId = program.id || `PROG-${Date.now()}`;
    const docRef = doc(db, COLLECTIONS.PROGRAMS, docId);
    await setDoc(docRef, { ...program, id: docId }, { merge: true });
    return true;
  } catch (err) {
    console.error('Error saving program:', err);
    return false;
  }
}

export async function deleteProgramFromFirestore(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTIONS.PROGRAMS, id);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Error deleting program:', err);
    return false;
  }
}

export async function updateSystemConfig(config: SystemConfig): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTIONS.CONFIG, 'system');
    await setDoc(docRef, config, { merge: true });
    return true;
  } catch (err) {
    console.error('Error updating system config:', err);
    return false;
  }
}
