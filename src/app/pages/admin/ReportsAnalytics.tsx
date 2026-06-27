import { useState, useEffect } from 'react';
import {
  TrendingUp, Package, Users, Calendar,
  Download, Loader2, BarChart2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { dashboardService, MonthlyPoint, CategoryPoint } from '../../../services/dashboardService';

interface ReportSummary { totalReservations: number; avgUtilization: number; activeUsers: number; }
interface UtilizationItem { name: string; utilization: number; reservations: number; }

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[--border] p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-[--muted-foreground]">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-4 h-4" /></div>
      </div>
      <p className="text-3xl font-bold text-[--foreground]">{value}</p>
      {sub && <p className="text-xs text-[--muted-foreground] mt-1">{sub}</p>}
    </div>
  );
}

export function ReportsAnalytics() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyPoint[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryPoint[]>([]);
  const [utilization, setUtilization] = useState<UtilizationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [s, m, c, u] = await Promise.all([
          dashboardService.getReportSummary(),
          dashboardService.getMonthlyData(),
          dashboardService.getCategoryData(),
          dashboardService.getEquipmentUtilization(),
        ]);
        if (!cancelled) { setSummary(s); setMonthlyData(m); setCategoryData(c); setUtilization(u); }
      } catch (e) { console.error(e); }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[--foreground] mb-2">Reports & Analytics</h1>
          <p className="text-[--muted-foreground]">Real-time system insights from Firestore</p>
        </div>
        <div className="flex items-center gap-2">
          <Select options={[{ value: 'all', label: 'All Time' }, { value: '30', label: 'Last 30 days' }]} />
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[--border] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />Export
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Reservations" value={summary?.totalReservations ?? 0} sub="All time" icon={Calendar} color="bg-blue-100 text-blue-600" />
        <StatCard label="Avg. Utilization" value={`${summary?.avgUtilization ?? 0}%`} sub="Equipment usage rate" icon={BarChart2} color="bg-emerald-100 text-emerald-600" />
        <StatCard label="Registered Users" value={summary?.activeUsers ?? 0} sub="Students + Faculty + Admin" icon={Users} color="bg-purple-100 text-purple-600" />
        <StatCard label="Equipment Categories" value={categoryData.length} sub="Distinct categories" icon={Package} color="bg-amber-100 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly trend line */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Monthly Reservations Trend</CardTitle>
                <div className="flex items-center gap-4 text-xs text-[--muted-foreground]">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Reservations</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />Returns</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {monthlyData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-[--muted-foreground] text-sm">No data yet — reservations will appear here</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#64748B" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#64748B" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="reservations" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4, fill: '#2563EB' }} name="Reservations" />
                    <Line type="monotone" dataKey="returns" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981' }} name="Returns" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Equipment pie */}
        <Card>
          <CardHeader><CardTitle>Equipment by Category</CardTitle></CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-[--muted-foreground] text-sm">No equipment yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(val) => [`${val} items`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {categoryData.map((cat, i) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[--foreground] truncate max-w-[130px]">{cat.name}</span>
                      </div>
                      <span className="font-semibold text-[--foreground]">{cat.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <Card>
          <CardHeader><CardTitle>Monthly Overview (Bar)</CardTitle></CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-[--muted-foreground] text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                  <Bar dataKey="reservations" fill="#2563EB" radius={[4,4,0,0]} name="Reservations" />
                  <Bar dataKey="returns" fill="#10B981" radius={[4,4,0,0]} name="Returns" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Utilization */}
        <Card>
          <CardHeader><CardTitle>Equipment Utilization Rate</CardTitle></CardHeader>
          <CardContent>
            {utilization.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-[--muted-foreground] text-sm">No equipment data yet</div>
            ) : (
              <div className="space-y-4 mt-1">
                {utilization.map((item, i) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-[--foreground] truncate max-w-[200px]">{item.name}</span>
                      <span className="font-bold text-[--foreground] ml-2 shrink-0">{item.utilization}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${item.utilization}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                    <p className="text-xs text-[--muted-foreground] mt-1">{item.reservations} reservation{item.reservations !== 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export */}
      <Card>
        <CardHeader><CardTitle>Export Reports</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Monthly Report', desc: 'Reservations and returns by month', icon: Calendar },
              { label: 'Equipment Usage', desc: 'Utilization rates and borrowing stats', icon: Package },
              { label: 'User Activity', desc: 'Student and faculty activity summary', icon: Users },
            ].map(({ label, desc, icon: Icon }) => (
              <button key={label} className="flex items-start gap-4 p-4 bg-gray-50 border border-[--border] rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all text-left">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-[--border] shrink-0">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-[--foreground] text-sm">{label}</p>
                  <p className="text-xs text-[--muted-foreground] mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
