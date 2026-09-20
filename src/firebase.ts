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

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForFirestoreInit",
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

    // 3. Check & Seed Transactions
    const txSnap = await getDocs(collection(db, COLLECTIONS.TRANSACTIONS));
    if (txSnap.empty) {
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
            status: m.status || getMemberStatus(m.noTelefon)
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
