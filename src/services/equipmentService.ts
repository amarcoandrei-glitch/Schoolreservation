import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, onSnapshot, query, orderBy,
  where, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Equipment {
  id: string;
  name: string;
  description: string;
  category: string;
  department?: string;
  quantity: number;
  availableQuantity: number;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  imageUrl: string;
  location: string;
  ownerId: string;
  ownerType: 'admin' | 'faculty';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type EquipmentInput = Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>;

const COL = 'equipment';

export const equipmentService = {
  subscribe(callback: (items: Equipment[]) => void): () => void {
    const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Equipment)));
    });
  },

  subscribeByOwner(ownerId: string, callback: (items: Equipment[]) => void): () => void {
    const q = query(collection(db, COL), where('ownerId', '==', ownerId));
    return onSnapshot(q, (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Equipment))
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      callback(items);
    });
  },

  async getAll(): Promise<Equipment[]> {
    const snap = await getDocs(query(collection(db, COL), orderBy('createdAt', 'desc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Equipment));
  },

  async getById(id: string): Promise<Equipment | null> {
    const snap = await getDoc(doc(db, COL, id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Equipment) : null;
  },

  async getByCategory(category: string): Promise<Equipment[]> {
    const q = query(collection(db, COL), where('category', '==', category));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Equipment));
  },

  async getByOwner(ownerId: string): Promise<Equipment[]> {
    const q = query(collection(db, COL), where('ownerId', '==', ownerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Equipment));
  },

  async create(data: EquipmentInput): Promise<string> {
    const ref = await addDoc(collection(db, COL), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id: string, data: Partial<EquipmentInput>): Promise<void> {
    await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id));
  },

  async decreaseAvailable(id: string, by = 1): Promise<void> {
    const snap = await getDoc(doc(db, COL, id));
    if (!snap.exists()) return;
    const current = (snap.data().availableQuantity as number) ?? 0;
    await updateDoc(doc(db, COL, id), {
      availableQuantity: Math.max(0, current - by),
      updatedAt: serverTimestamp(),
    });
  },

  async increaseAvailable(id: string, by = 1): Promise<void> {
    const snap = await getDoc(doc(db, COL, id));
    if (!snap.exists()) return;
    const data = snap.data();
    const current = (data.availableQuantity as number) ?? 0;
    const max = (data.quantity as number) ?? current;
    await updateDoc(doc(db, COL, id), {
      availableQuantity: Math.min(max, current + by),
      updatedAt: serverTimestamp(),
    });
  },
};
