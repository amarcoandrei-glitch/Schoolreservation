import {
  collection, doc, addDoc, updateDoc, getDocs,
  onSnapshot, query, orderBy, where, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt?: Timestamp;
}

const COL = 'notifications';

export const notificationService = {
  subscribe(userId: string, callback: (items: Notification[]) => void): () => void {
    const q = query(
      collection(db, COL),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification)));
    });
  },

  async getByUser(userId: string): Promise<Notification[]> {
    const q = query(collection(db, COL), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification));
  },

  async create(data: { userId: string; title: string; message: string }): Promise<string> {
    const ref = await addDoc(collection(db, COL), {
      ...data,
      read: false,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  async markRead(id: string): Promise<void> {
    await updateDoc(doc(db, COL, id), { read: true });
  },

  async markAllRead(userId: string): Promise<void> {
    const items = await this.getByUser(userId);
    await Promise.all(items.filter((n) => !n.read).map((n) => this.markRead(n.id)));
  },
};
