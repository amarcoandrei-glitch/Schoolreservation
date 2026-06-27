import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, onSnapshot, query, orderBy, where,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { equipmentService } from './equipmentService';
import { notificationService } from './notificationService';

export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'borrowed' | 'returned';

export interface Reservation {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentCategory?: string;
  equipmentLocation?: string;
  userId: string;
  userName: string;
  userRole: 'student' | 'faculty';
  quantity: number;
  status: ReservationStatus;
  reservationDate: string;
  borrowDate?: string;
  returnDate?: string;
  approvedBy?: string;
  remarks?: string;
  purpose: string;
  createdAt?: Timestamp;
}

export type ReservationInput = Omit<Reservation, 'id' | 'createdAt' | 'status' | 'approvedBy' | 'borrowDate' | 'returnDate'>;

const COL = 'reservations';

export const reservationService = {
  // ── Realtime ────────────────────────────────────────────────────────────
  subscribe(callback: (items: Reservation[]) => void): () => void {
    const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reservation)));
    });
  },

  subscribeByUser(userId: string, callback: (items: Reservation[]) => void): () => void {
    const q = query(
      collection(db, COL),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reservation)));
    });
  },

  subscribeByStatus(status: ReservationStatus, callback: (items: Reservation[]) => void): () => void {
    const q = query(
      collection(db, COL),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reservation)));
    });
  },

  // ── One-time reads ──────────────────────────────────────────────────────
  async getAll(): Promise<Reservation[]> {
    const snap = await getDocs(query(collection(db, COL), orderBy('createdAt', 'desc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reservation));
  },

  async getByUser(userId: string): Promise<Reservation[]> {
    const q = query(collection(db, COL), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reservation));
  },

  async getByStatus(status: ReservationStatus): Promise<Reservation[]> {
    const q = query(collection(db, COL), where('status', '==', status), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reservation));
  },

  // ── Create ──────────────────────────────────────────────────────────────
  async create(data: ReservationInput): Promise<string> {
    const ref = await addDoc(collection(db, COL), {
      ...data,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  // ── Status transitions ──────────────────────────────────────────────────
  async approve(id: string, adminId: string, reservation: Reservation): Promise<void> {
    await updateDoc(doc(db, COL, id), {
      status: 'approved',
      approvedBy: adminId,
    });
    await equipmentService.decreaseAvailable(reservation.equipmentId, reservation.quantity);
    await notificationService.create({
      userId: reservation.userId,
      title: 'Reservation Approved',
      message: `Your reservation for "${reservation.equipmentName}" has been approved. Please pick it up at your scheduled date.`,
    });
  },

  async reject(id: string, reservation: Reservation, remarks = ''): Promise<void> {
    await updateDoc(doc(db, COL, id), { status: 'rejected', remarks });
    await notificationService.create({
      userId: reservation.userId,
      title: 'Reservation Rejected',
      message: `Your reservation for "${reservation.equipmentName}" was rejected.${remarks ? ` Reason: ${remarks}` : ''}`,
    });
  },

  async markBorrowed(id: string, reservation: Reservation): Promise<void> {
    await updateDoc(doc(db, COL, id), {
      status: 'borrowed',
      borrowDate: new Date().toISOString().split('T')[0],
    });
    await notificationService.create({
      userId: reservation.userId,
      title: 'Equipment Borrowed',
      message: `You have borrowed "${reservation.equipmentName}". Please return it by ${reservation.returnDate}.`,
    });
  },

  async markReturned(id: string, reservation: Reservation): Promise<void> {
    await updateDoc(doc(db, COL, id), {
      status: 'returned',
      returnDate: new Date().toISOString().split('T')[0],
    });
    await equipmentService.increaseAvailable(reservation.equipmentId, reservation.quantity);
    await notificationService.create({
      userId: reservation.userId,
      title: 'Equipment Returned',
      message: `"${reservation.equipmentName}" has been successfully returned. Thank you!`,
    });
  },

  async cancel(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id));
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id));
  },
};
