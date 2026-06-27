import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AdminStats {
  totalEquipment: number;
  availableEquipment: number;
  borrowedCount: number;
  pendingCount: number;
  totalUsers: number;
  totalStudents: number;
  totalFaculty: number;
  totalAdmins: number;
  overdueCount: number;
  returnedCount: number;
  lowStockCount: number;
}

export interface StudentStats {
  activeReservations: number;
  pendingApprovals: number;
  completedReturns: number;
  upcomingReturns: number;
}

export interface MonthlyPoint {
  month: string;
  reservations: number;
  returns: number;
}

export interface CategoryPoint {
  name: string;
  value: number;
  color: string;
}

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export const dashboardService = {
  async getAdminStats(): Promise<AdminStats> {
    const [equipSnap, resSnap, userSnap] = await Promise.all([
      getDocs(collection(db, 'equipment')),
      getDocs(collection(db, 'reservations')),
      getDocs(collection(db, 'users')),
    ]);

    const equipment = equipSnap.docs.map((d) => d.data());
    const reservations = resSnap.docs.map((d) => d.data());

    const users = userSnap.docs.map((d) => d.data());
    const totalEquipment = equipment.length;
    const availableEquipment = equipment.reduce((s, e) => s + (e.availableQuantity ?? 0), 0);
    const borrowedCount = reservations.filter((r) => r.status === 'borrowed').length;
    const returnedCount = reservations.filter((r) => r.status === 'returned').length;
    const pendingCount = reservations.filter((r) => r.status === 'pending').length;
    const totalUsers = userSnap.size;
    const totalStudents = users.filter((u) => u.role === 'student').length;
    const totalFaculty = users.filter((u) => u.role === 'faculty').length;
    const totalAdmins = users.filter((u) => u.role === 'admin').length;
    const lowStockCount = equipment.filter((e) => (e.availableQuantity ?? 0) <= 2 && (e.quantity ?? 0) > 0).length;

    const today = new Date().toISOString().split('T')[0];
    const overdueCount = reservations.filter(
      (r) => r.status === 'borrowed' && r.returnDate && r.returnDate < today,
    ).length;

    return { totalEquipment, availableEquipment, borrowedCount, returnedCount, pendingCount, totalUsers, totalStudents, totalFaculty, totalAdmins, overdueCount, lowStockCount };
  },

  async getStudentStats(userId: string): Promise<StudentStats> {
    const q = query(collection(db, 'reservations'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const reservations = snap.docs.map((d) => d.data());

    return {
      activeReservations: reservations.filter((r) => r.status === 'approved' || r.status === 'borrowed').length,
      pendingApprovals: reservations.filter((r) => r.status === 'pending').length,
      completedReturns: reservations.filter((r) => r.status === 'returned').length,
      upcomingReturns: reservations.filter((r) => r.status === 'borrowed').length,
    };
  },

  async getMonthlyData(): Promise<MonthlyPoint[]> {
    const snap = await getDocs(collection(db, 'reservations'));
    const reservations = snap.docs.map((d) => d.data());

    const months: Record<string, { reservations: number; returns: number }> = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short' });
      months[key] = { reservations: 0, returns: 0 };
    }

    reservations.forEach((r) => {
      const created = r.createdAt?.toDate?.() ?? new Date();
      const key = created.toLocaleString('default', { month: 'short' });
      if (months[key]) {
        months[key].reservations += 1;
        if (r.status === 'returned') months[key].returns += 1;
      }
    });

    return Object.entries(months).map(([month, v]) => ({ month, ...v }));
  },

  async getCategoryData(): Promise<CategoryPoint[]> {
    const snap = await getDocs(collection(db, 'equipment'));
    const counts: Record<string, number> = {};
    snap.docs.forEach((d) => {
      const cat = d.data().category ?? 'Other';
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value], i) => ({
      name,
      value,
      color: COLORS[i % COLORS.length],
    }));
  },

  async getReportSummary() {
    const [eqSnap, resSnap, userSnap] = await Promise.all([
      getDocs(collection(db, 'equipment')),
      getDocs(collection(db, 'reservations')),
      getDocs(collection(db, 'users')),
    ]);
    const reservations = resSnap.docs.map((d) => d.data());
    const totalReservations = reservations.length;
    const equipment = eqSnap.docs.map((d) => d.data());
    const totalUnits = equipment.reduce((s, e) => s + (e.quantity ?? 0), 0);
    const availableUnits = equipment.reduce((s, e) => s + (e.availableQuantity ?? 0), 0);
    const avgUtilization = totalUnits > 0 ? Math.round(((totalUnits - availableUnits) / totalUnits) * 100) : 0;
    const activeUsers = userSnap.size;
    const returned = reservations.filter((r) => r.status === 'returned').length;
    const avgDuration = returned > 0 ? '—' : '—'; // placeholder for future calculation
    return { totalReservations, avgUtilization, activeUsers, avgDuration };
  },

  async getEquipmentUtilization() {
    const [eqSnap, resSnap] = await Promise.all([
      getDocs(collection(db, 'equipment')),
      getDocs(collection(db, 'reservations')),
    ]);

    const reservationCounts: Record<string, number> = {};
    resSnap.docs.forEach((d) => {
      const id = d.data().equipmentId;
      if (id) reservationCounts[id] = (reservationCounts[id] ?? 0) + 1;
    });

    return eqSnap.docs.map((d) => {
      const eq = d.data();
      const total = eq.quantity ?? 1;
      const available = eq.availableQuantity ?? total;
      const utilization = Math.round(((total - available) / total) * 100);
      return { name: eq.name, utilization, reservations: reservationCounts[d.id] ?? 0 };
    }).sort((a, b) => b.utilization - a.utilization).slice(0, 5);
  },
};
