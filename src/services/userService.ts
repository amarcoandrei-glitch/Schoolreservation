import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, onSnapshot, query, orderBy,
  where, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AppUser {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'faculty' | 'student';
  department: string;
  studentId: string;
  isActive: boolean;
  createdAt?: Timestamp;
}

const COL = 'users';

export const userService = {
  subscribe(callback: (items: AppUser[]) => void): () => void {
    const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppUser)));
    });
  },

  async getAll(): Promise<AppUser[]> {
    const snap = await getDocs(query(collection(db, COL), orderBy('createdAt', 'desc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppUser));
  },

  async getById(id: string): Promise<AppUser | null> {
    const snap = await getDoc(doc(db, COL, id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as AppUser) : null;
  },

  async getByRole(role: 'admin' | 'faculty' | 'student'): Promise<AppUser[]> {
    const q = query(collection(db, COL), where('role', '==', role));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppUser));
  },

  async update(id: string, data: Partial<AppUser>): Promise<void> {
    await updateDoc(doc(db, COL, id), data);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id));
  },
};
