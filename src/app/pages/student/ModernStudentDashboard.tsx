import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Package, Clock, CheckCircle, Calendar,
  TrendingUp, AlertCircle, ArrowRight, Sparkles,
} from 'lucide-react';
import { ModernStatsCard } from '../../components/ui/ModernStatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { TimelineActivity } from '../../components/ui/TimelineActivity';
import { useAuth } from '../../../contexts/AuthContext';
import { dashboardService, StudentStats } from '../../../services/dashboardService';
import { reservationService, Reservation } from '../../../services/reservationService';
import { equipmentService, Equipment } from '../../../services/equipmentService';
import { optimizeImageUrl } from '../../../lib/cloudinary';

const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  Laptops:           { emoji: '💻', color: 'from-blue-500 to-blue-600' },
  Cameras:           { emoji: '📷', color: 'from-purple-500 to-purple-600' },
  Tablets:           { emoji: '📱', color: 'from-emerald-500 to-emerald-600' },
  'Audio Equipment': { emoji: '🎤', color: 'from-amber-500 to-amber-600' },
  Laboratory:        { emoji: '🔬', color: 'from-red-500 to-red-600' },
  Sports:            { emoji: '⚽', color: 'from-green-500 to-green-600' },
  Other:             { emoji: '📦', color: 'from-gray-500 to-gray-600' },
};

interface ModernStudentDashboardProps {
  onViewDetails: (equipmentId: string) => void;
}

export function ModernStudentDashboard({ onViewDetails }: ModernStudentDashboardProps) {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<StudentStats>({ activeReservations: 0, pendingApprovals: 0, completedReturns: 0, upcomingReturns: 0 });
  const [activeRes, setActiveRes] = useState<Reservation[]>([]);
  const [recentRes, setRecentRes] = useState<Reservation[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [equipmentById, setEquipmentById] = useState<Record<string, Equipment>>({});
  const [actionId, setActionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // ── Initial load via getDocs (always completes) ──────────────────────────
  useEffect(() => {
    if (!userProfile) return;
    let cancelled = false;

    const load = async () => {
      try {
        const [s, myRes, allEq] = await Promise.all([
          dashboardService.getStudentStats(userProfile.uid),
          reservationService.getByUser(userProfile.uid),
          equipmentService.getAll(),
        ]);
        if (!cancelled) {
          setStats(s);
          setActiveRes(myRes.filter((r) => r.status === 'borrowed' || r.status === 'approved'));
          setRecentRes(myRes.slice(0, 4));
          setEquipment(allEq);
          setEquipmentById(Object.fromEntries(allEq.map((item) => [item.id, item])));
        }
      } catch (e) {
        console.error('Student dashboard load error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [userProfile?.uid]);

  // ── Realtime updates (independent of loading) ────────────────────────────
  useEffect(() => {
    if (!userProfile) return;

    const unsub1 = reservationService.subscribe((all) => {
      const mine = all.filter((r) => r.userId === userProfile.uid);
      setActiveRes(mine.filter((r) => r.status === 'borrowed' || r.status === 'approved'));
      setRecentRes(mine.slice(0, 4));
      dashboardService.getStudentStats(userProfile.uid).then(setStats).catch(() => {});
    });

    const unsub2 = equipmentService.subscribe((all) => {
      setEquipment(all);
      setEquipmentById(Object.fromEntries(all.map((item) => [item.id, item])));
    });

    return () => { unsub1(); unsub2(); };
  }, [userProfile?.uid]);

  // Build category availability map
  const categoryMap: Record<string, { available: number; total: number }> = {};
  equipment.forEach((e) => {
    if (!categoryMap[e.category]) categoryMap[e.category] = { available: 0, total: 0 };
    categoryMap[e.category].available += e.availableQuantity;
    categoryMap[e.category].total += e.quantity;
  });
  const equipmentCategories = Object.entries(categoryMap).slice(0, 4).map(([name, v]) => ({
    name, ...v,
    emoji: CATEGORY_META[name]?.emoji ?? '📦',
    color: CATEGORY_META[name]?.color ?? 'from-gray-500 to-gray-600',
  }));

  const handleReturn = async (r: Reservation) => {
    if (!confirm('Mark this equipment as returned?')) return;
    setActionId(r.id);
    try {
      await reservationService.markReturned(r.id, r);
    } catch (e) {
      console.error('Return failed', e);
      alert('Unable to return equipment. Please try again.');
    } finally {
      setActionId(null);
    }
  };

  const timelineItems = recentRes.map((r) => ({
    id: r.id,
    icon: r.status === 'returned' ? CheckCircle : r.status === 'borrowed' ? Package : r.status === 'approved' ? CheckCircle : AlertCircle,
    title: r.status === 'returned' ? 'Equipment Returned' : r.status === 'borrowed' ? 'Equipment Borrowed' : r.status === 'approved' ? 'Reservation Approved' : 'Pending Approval',
    description: r.equipmentName,
    time: r.reservationDate,
    color: r.status === 'returned' ? 'bg-purple-500' : r.status === 'borrowed' ? 'bg-blue-500' : r.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500',
  }));

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 md:p-12 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="text-blue-200 text-sm font-medium">{currentDate}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                {greeting}, {userProfile?.name?.split(' ')[0] ?? 'Student'}! 👋
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl">Here's your equipment activity and upcoming reservations</p>
            </div>
            <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">Student</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {[
              { icon: Package, value: loading ? '—' : stats.activeReservations, label: 'Active Reservations' },
              { icon: Clock,   value: loading ? '—' : stats.pendingApprovals,   label: 'Pending Approval' },
              { icon: Calendar,value: loading ? '—' : stats.upcomingReturns,    label: 'Upcoming Returns' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-sm text-blue-100">{label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ModernStatsCard title="Active Reservations" value={loading ? '…' : String(stats.activeReservations)} icon={Package} color="#2563EB" trend={{ value: 'Currently borrowed', isPositive: true }} sparklineData={[0, 0, 0, 0, 0, 0, stats.activeReservations]} delay={0} />
        <ModernStatsCard title="Pending Approvals"   value={loading ? '…' : String(stats.pendingApprovals)}   icon={Clock}   color="#F59E0B" trend={{ value: 'Awaiting review', isPositive: true }} sparklineData={[0, 0, 0, 0, 0, 0, stats.pendingApprovals]}   delay={0.1} />
        <ModernStatsCard title="Completed Returns"   value={loading ? '…' : String(stats.completedReturns)}   icon={CheckCircle} color="#10B981" trend={{ value: 'All time returns', isPositive: true }} sparklineData={[0, 0, 0, 0, 0, 0, stats.completedReturns]} delay={0.2} />
        <ModernStatsCard title="Upcoming Returns"    value={loading ? '…' : String(stats.upcomingReturns)}    icon={Calendar} color="#8B5CF6" trend={{ value: 'Due soon', isPositive: false }} sparklineData={[0, 0, 0, 0, 0, 0, stats.upcomingReturns]}    delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Reservations */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Reservations</CardTitle>
                <Button variant="ghost" size="sm">View All <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : activeRes.length === 0 ? (
                <p className="text-center text-[--muted-foreground] py-8">No active reservations yet.</p>
              ) : (
                <div className="space-y-4">
                  {activeRes.map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }}
                      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                      className="flex items-start gap-4 p-5 bg-gradient-to-br from-[--background] to-white rounded-2xl border border-[--border] hover:shadow-md transition-all cursor-pointer">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">📦</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-[--foreground] mb-1">{r.equipmentName}</h4>
                            <p className="text-sm text-[--muted-foreground]">{r.equipmentCategory ?? 'Equipment'}</p>
                          </div>
                          <Badge variant="success">Active</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[--muted-foreground] mb-3">
                          <span>📅 {r.borrowDate ?? r.reservationDate}</span>
                          {r.returnDate && <><span>→</span><span>🏁 {r.returnDate}</span></>}
                          {r.equipmentLocation && <><span>•</span><span>📍 {r.equipmentLocation}</span></>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => onViewDetails(r.equipmentId)}>Details</Button>
                          {r.status === 'borrowed' && (
                            <Button variant="success" size="sm" disabled={actionId === r.id} onClick={() => handleReturn(r)}>
                              {actionId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Return Equipment'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Equipment Availability */}
          <Card className="border-0 shadow-lg">
            <CardHeader><CardTitle>Equipment Availability</CardTitle></CardHeader>
            <CardContent>
              {equipmentCategories.length === 0 ? (
                <p className="text-center text-[--muted-foreground] py-8 text-sm">No equipment in the system yet.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {equipmentCategories.map((cat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: i * 0.1 }}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      className={`relative overflow-hidden bg-gradient-to-br ${cat.color} rounded-2xl p-5 text-white cursor-pointer group`}>
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                      <div className="relative">
                        <div className="text-4xl mb-3">{cat.emoji}</div>
                        <p className="text-sm font-medium mb-2 opacity-90">{cat.name}</p>
                        <p className="text-2xl font-bold mb-1">{cat.available}</p>
                        <p className="text-xs opacity-75">of {cat.total} available</p>
                        <div className="w-full bg-white/20 rounded-full h-1.5 mt-3">
                          <div className="bg-white h-full rounded-full transition-all group-hover:bg-white/90"
                            style={{ width: `${cat.total > 0 ? (cat.available / cat.total) * 100 : 0}%` }} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
              {timelineItems.length === 0
                ? <p className="text-center text-[--muted-foreground] py-8 text-sm">No activity yet.</p>
                : <TimelineActivity items={timelineItems} />}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="primary" className="w-full justify-start h-12 shadow-md hover:shadow-lg transition-all"><Package className="w-5 h-5" />Browse Equipment</Button>
                <Button variant="outline" className="w-full justify-start h-12 hover:bg-[--secondary] transition-all"><Calendar className="w-5 h-5" />View Reservations</Button>
                <Button variant="outline" className="w-full justify-start h-12 hover:bg-[--secondary] transition-all"><TrendingUp className="w-5 h-5" />Reservation History</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
