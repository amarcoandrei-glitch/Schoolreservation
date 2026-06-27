import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Equipment {
  id?: string;
  name: string;
  category: string;
  description: string;
  quantity: number;
  available: number;
  condition: "Excellent" | "Good" | "Fair" | "Poor";
  location: string;
  imageUrl?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Reservation {
  id?: string;
  equipmentId: string;
  equipmentName: string;
  userId: string;
  userName: string;
  userRole: "student" | "faculty";
  startDate: string;
  endDate: string;
  purpose: string;
  status: "pending" | "approved" | "rejected" | "returned";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface User {
  id?: string;
  name: string;
  email: string;
  role: "student" | "faculty" | "admin";
  department: string;
  studentId?: string;
  isActive: boolean;
  createdAt?: Timestamp;
}

// ─── Equipment CRUD ───────────────────────────────────────────────────────────

export const equipmentService = {
  async getAll(): Promise<Equipment[]> {
    const q = query(collection(db, "equipment"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Equipment));
  },

  async getById(id: string): Promise<Equipment | null> {
    const snap = await getDoc(doc(db, "equipment", id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Equipment) : null;
  },

  async create(data: Omit<Equipment, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const ref = await addDoc(collection(db, "equipment"), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id: string, data: Partial<Equipment>): Promise<void> {
    await updateDoc(doc(db, "equipment", id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "equipment", id));
  },
};

// ─── Reservation CRUD ─────────────────────────────────────────────────────────

export const reservationService = {
  async getAll(): Promise<Reservation[]> {
    const q = query(collection(db, "reservations"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reservation));
  },

  async create(data: Omit<Reservation, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const ref = await addDoc(collection(db, "reservations"), {
      ...data,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  async updateStatus(id: string, status: Reservation["status"]): Promise<void> {
    await updateDoc(doc(db, "reservations", id), {
      status,
      updatedAt: serverTimestamp(),
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "reservations", id));
  },
};

// ─── User CRUD ────────────────────────────────────────────────────────────────

export const userService = {
  async getAll(): Promise<User[]> {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as User));
  },

  async create(data: Omit<User, "id" | "createdAt">): Promise<string> {
    const ref = await addDoc(collection(db, "users"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id: string, data: Partial<User>): Promise<void> {
    await updateDoc(doc(db, "users", id), data);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "users", id));
  },
};
