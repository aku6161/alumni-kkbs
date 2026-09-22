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
    "id": "PROG-c3c80ebe",
    "namaProgram": "MINGGU TRANSFORMASI SISWA SESI I 2025/2026",
    "tarikhProgram": "29 JULAI 2025 - 01 OGOS 2026",
    "masaProgram": "8.00 PAGI - 5.00 PETANG",
    "tempatProgram": "DEWAN KULIAH, KKBS",
    "kerjasama": "Unit Pembangunan Pelajar KKBS",
    "implikasiKewangan": "Tiada",
    "sasaranPeserta": "Pelajar baharu KKBS",
    "bilanganPeserta": 60
  },
  {
    "id": "PROG-6aa60e0a",
    "namaProgram": "Program Alumni@kasih: Sumbangan Rawatan Kanser",
    "tarikhProgram": "2025-11-19T08:00:00.000Z",
    "masaProgram": "9.00 pagi",
    "tempatProgram": "Kampung Luagan Sanginan, Beaufort",
    "kerjasama": "Kolej Komuniti Beaufort",
    "implikasiKewangan": "Tiada",
    "sasaranPeserta": "Alumni KKBS",
    "bilanganPeserta": 1
  },
  {
    "id": "PROG-dcb86671",
    "namaProgram": "My Career to Industry",
    "tarikhProgram": "10 April 2026",
    "masaProgram": "8.00 pagi - 5.00 petang",
    "tempatProgram": "Kolej Komuniti Beaufort",
    "kerjasama": "Kolej Komuniti Beaufort",
    "implikasiKewangan": "Tiada",
    "sasaranPeserta": "Pelajar Sijil Teknologi Elektrik",
    "bilanganPeserta": 47
  },
  {
    "id": "PROG-992d4cce",
    "namaProgram": "Kursus Penulisan Minit Mesyuarat Ringkas JKKK Dun Lumadan",
    "tarikhProgram": "13 & 14 Jun 2026",
    "masaProgram": "8.00 pagi - 5.00 petang",
    "tempatProgram": "Makmal Komputer, KKBS",
    "kerjasama": "Kolej Komuniti Beaufort & UPPM Dun Lumadan",
    "implikasiKewangan": "Tiada",
    "sasaranPeserta": "JKKK Dun Lumadan",
    "bilanganPeserta": 70
  },
  {
    "id": "PROG-7fa4ba56",
    "namaProgram": "Alumni Lead Camp 2026",
    "tarikhProgram": "22 & 23 Julai 2026",
    "masaProgram": "8.00 pagi - 5.00 petang",
    "tempatProgram": "Kundasang, Ranau",
    "kerjasama": "Tiada",
    "implikasiKewangan": "400",
    "sasaranPeserta": "JK Persatuan Alumni KKBS",
    "bilanganPeserta": 6
  },
  {
    "id": "PROG-945edbc1",
    "namaProgram": "Cenderamata Alumni Kolej Komuniti Beaufort 2026",
    "tarikhProgram": "24 September 2026",
    "masaProgram": "8.00 pagi - 5.00 petang",
    "tempatProgram": "Dewan Rafflesia, Politeknik Kota Kinabalu",
    "kerjasama": "Kolej Komuniti Beaufort",
    "implikasiKewangan": "1037",
    "sasaranPeserta": "Graduan KKBS 2026",
    "bilanganPeserta": 120
  },
  {
    "id": "PROG-2e92ec21",
    "namaProgram": "Sumbangan Kanopi Untuk Parkir Motorsikal Pelajar KKBS",
    "tarikhProgram": "16 Jun 2026",
    "masaProgram": "10.00 pagi",
    "tempatProgram": "Kolej Komuniti Beaufort",
    "kerjasama": "Kolej Komuniti Beaufort",
    "implikasiKewangan": "1000",
    "sasaranPeserta": "Pelajar Kolej Komuniti Beaufort",
    "bilanganPeserta": 50
  },
  {
    "id": "PROG-28d198cd",
    "namaProgram": "Alumni Back to Campus",
    "tarikhProgram": "25 Jun 2026",
    "masaProgram": "2.00 petang - 4.00 petang",
    "tempatProgram": "Kolej Komuniti Beaufort",
    "kerjasama": "Kolej Komuniti Beaufort",
    "implikasiKewangan": "Tiada",
    "sasaranPeserta": "Pelajr Semester 3, KKBS",
    "bilanganPeserta": 57
  },
  {
    "id": "PROG-0ae533b6",
    "namaProgram": "CAREER LAUNCHPAD (CLP) KKBS 2026",
    "tarikhProgram": "24 & 25 JULAI 2026",
    "masaProgram": "8.00-5.00",
    "tempatProgram": "DEWAN KULIAH KKBS",
    "kerjasama": "KOLEJ KOMUNTI BEAUFORT",
    "implikasiKewangan": "TIADA",
    "sasaranPeserta": "ALUMI KKBS DAN PELAJAR KKBS",
    "bilanganPeserta": 57
  },
  {
    "id": "PROG-603aaa27",
    "namaProgram": "POLYCC FUTUREREADY BOOTCAMP 2026",
    "tarikhProgram": "21 & 22 SEPTEMBER 2026",
    "masaProgram": "8.00 PAGI - 5.00 PETANG",
    "tempatProgram": "DEWAN KULIAH",
    "kerjasama": "KOLEJ KOMUNITI BEAUFORT",
    "implikasiKewangan": "TIADA",
    "sasaranPeserta": "PELAJAR KKBS",
    "bilanganPeserta": 57
  },
  {
    "id": "PROG-c3ae9dfd",
    "namaProgram": "BAYARAN BALIK YURAN KONVO",
    "tarikhProgram": "26 OGOS 2026",
    "masaProgram": "9.00 PAGI - 11.00 PAGI",
    "tempatProgram": "KOLEJ KOMUNITI BEAUFORT",
    "kerjasama": "TIADA",
    "implikasiKewangan": "RM 475.00",
    "sasaranPeserta": "3 ORANG",
    "bilanganPeserta": 3
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
    } else {
      await setDoc(configDocRef, { ...INITIAL_CONFIG, ...configSnap.data() }, { merge: true });
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
            status: m.status === 'Active' ? getMemberStatus(m.noTelefon) : (m.status || getMemberStatus(m.noTelefon))
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
        onUpdate({ ...INITIAL_CONFIG, ...snapshot.data() } as SystemConfig);
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
