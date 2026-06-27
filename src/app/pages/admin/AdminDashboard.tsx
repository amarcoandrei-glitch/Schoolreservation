import { useState, useEffect } from 'react';
import {
  Package, CheckCircle, Clock, AlertTriangle,
  TrendingUp, Users, Calendar, Archive, Loader2,
  RotateCcw,
} from 'lucide-react';
import { StatsCard } from '../../components/ui/StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useAuth } from '../../../contexts/AuthContext';
import { dashboardService, AdminStats, MonthlyPoint, CategoryPoint } from '../../../services/dashboardService';
import { reservationService, Reservation } from '../../../services/reservationService';

export function AdminDashboard() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalEquipment: 0, availableEquipment: 0, borrowedCount: 0,
    pendingCount: 0, totalUsers: 0, totalStudents: 0, totalFaculty: 0,
    totalAdmins: 0, overdueCount: 0, returnedCount: 0, lowStockCount: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyPoint[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryPoint[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Reservation[]>([]);
  const [recentActivity, setRecentActivity] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Initial load via getDocs (guaranteed to complete) ───────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [s, m, c] = await Promise.all([
          dashboardService.getAdminStats(),
          dashboardService.getMonthlyData(),
          dashboardService.getCategoryData(),
        ]);
        if (!cancelled) {
          setStats(s);
          setMonthlyData(m);
          setCategoryData(c);
        }
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Realtime listeners (independent of loading state) ───────────────────
  useEffect(() => {
    const unsub1 = reservationService.subscribe((all) => {
      setPendingApprovals(all.filter((r) => r.status === 'pending'));
      setRecentActivity(all.slice(0, 5));
    });
    return unsub1;
  }, []);

  const handleApprove = async (r: Reservation) => {
    if (!userProfile) return;
    setActionLoading(r.id);
    try {
      await reservationService.approve(r.id, userProfile.uid, r);
      const s = await dashboardService.getAdminStats();
      setStats(s);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (r: Reservation) => {
    setActionLoading(r.id);
    try {
      await reservationService.reject(r.id, r);
    } finally {
      setActionLoading(null);
    }
  };

  const statusLabel = (r: Reservation) => {
    if (r.status === 'returned') return 'Equipment Returned';
    if (r.status === 'borrowed') return 'Equipment Borrowed';
    if (r.status === 'approved') return 'Reservation Approved';
    if (r.status === 'rejected') return 'Reservation Rejected';
    return 'New Request';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[--foreground] mb-2">Admin Dashboard</h1>
        <p className="text-[--muted-foreground]">Overview of equipment management and reservations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Equipment" value={String(stats.totalEquipment)} icon={Package} color="blue" trend={{ value: 'All items tracked', isPositive: true }} />
        <StatsCard title="Available" value={String(stats.availableEquipment)} icon={CheckCircle} color="green" trend={{ value: 'Ready to reserve', isPositive: true }} />
        <StatsCard title="Borrowed" value={String(stats.borrowedCount)} icon={Archive} color="orange" trend={{ value: 'Currently in use', isPositive: true }} />
        <StatsCard title="Pending Requests" value={String(stats.pendingCount)} icon={Clock} color="red" trend={{ value: 'Awaiting approval', isPositive: false }} />
        <StatsCard title="Students" value={String(stats.totalStudents ?? 0)} icon={Users} color="blue" trend={{ value: 'Registered students', isPositive: true }} />
        <StatsCard title="Faculty" value={String(stats.totalFaculty ?? 0)} icon={Users} color="green" trend={{ value: 'Registered faculty', isPositive: true }} />
        <StatsCard title="Returned" value={String(stats.returnedCount ?? 0)} icon={CheckCircle} color="green" trend={{ value: 'Equipment returned', isPositive: true }} />
        <StatsCard title="Low Stock" value={String(stats.lowStockCount ?? 0)} icon={AlertTriangle} color="red" trend={{ value: '≤2 units left', isPositive: false }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Monthly Overview</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <Tooltip />
                  <Bar dataKey="reservations" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="returns" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[--primary-blue] rounded-full" />
                  <span className="text-sm text-[--muted-foreground]">Reservations</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[--success] rounded-full" />
                  <span className="text-sm text-[--muted-foreground]">Returns</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pending Approvals</CardTitle>
                <Badge variant="warning">{pendingApprovals.length} Pending</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {pendingApprovals.length === 0 ? (
                <p className="text-center text-[--muted-foreground] py-8">No pending approvals</p>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.slice(0, 5).map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-4 bg-[--background] rounded-lg hover:bg-[--secondary] transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-[--foreground]">{r.userName}</p>
                        <p className="text-sm text-[--muted-foreground]">{r.equipmentName} × {r.quantity}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-[--foreground]">{r.reservationDate}</p>
                          <p className="text-xs text-[--muted-foreground]">{r.purpose}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="success" size="sm" disabled={actionLoading === r.id} onClick={() => handleApprove(r)}>
                            {actionLoading === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Approve'}
                          </Button>
                          <Button variant="outline" size="sm" disabled={actionLoading === r.id} onClick={() => handleReject(r)}>
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-center text-[--muted-foreground] py-8">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((r) => (
                    <div key={r.id} className="flex items-start gap-3 pb-3 border-b border-[--border] last:border-0">
                      <div className="w-8 h-8 bg-[--secondary] rounded-full flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-[--primary-blue]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[--foreground]">{statusLabel(r)}</p>
                        <p className="text-sm text-[--muted-foreground]">{r.userName} • {r.equipmentName}</p>
                        <p className="text-xs text-[--muted-foreground] mt-1">{r.reservationDate}</p>
                      </div>
                      <Badge variant={r.status === 'returned' ? 'success' : r.status === 'pending' ? 'warning' : 'primary'}>
                        {r.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Equipment by Category</CardTitle></CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <p className="text-center text-[--muted-foreground] py-8 text-sm">No equipment yet</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                        {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-4">
                    {categoryData.map((cat) => (
                      <div key={cat.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-sm text-[--foreground]">{cat.name}</span>
                        </div>
                        <span className="text-sm font-medium text-[--foreground]">{cat.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>System Stats</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[--background] rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[--primary-blue]" />
                    <span className="text-sm text-[--foreground]">Total Users</span>
                  </div>
                  <span className="text-lg font-bold text-[--foreground]">{stats.totalUsers}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[--background] rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[--success]" />
                    <span className="text-sm text-[--foreground]">Total Equipment</span>
                  </div>
                  <span className="text-lg font-bold text-[--foreground]">{stats.totalEquipment}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[--background] rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[--warning]" />
                    <span className="text-sm text-[--foreground]">Overdue Returns</span>
                  </div>
                  <span className="text-lg font-bold text-[--foreground]">{stats.overdueCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="primary" className="w-full justify-start"><Package className="w-4 h-4" />Add New Equipment</Button>
                <Button variant="outline" className="w-full justify-start"><Users className="w-4 h-4" />Manage Users</Button>
                <Button variant="outline" className="w-full justify-start"><TrendingUp className="w-4 h-4" />Generate Report</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
