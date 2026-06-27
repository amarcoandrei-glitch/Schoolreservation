import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/ui/SearchBar';
import { User, Calendar, Package, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { reservationService, Reservation, ReservationStatus } from '../../../services/reservationService';

type FilterTab = 'All' | 'Pending' | 'Approved' | 'Rejected';
const FILTER_STATUS: Record<FilterTab, ReservationStatus[]> = {
  All: ['pending', 'approved', 'rejected', 'borrowed', 'returned'],
  Pending: ['pending'],
  Approved: ['approved', 'borrowed'],
  Rejected: ['rejected'],
};

export function StudentRequests() {
  const { userProfile } = useAuth();
  const [requests, setRequests] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to all pending student reservations
    const unsub = reservationService.subscribe((all) => {
      setRequests(all.filter((r) => r.userRole === 'student'));
      setLoading(false);
    });
    return unsub;
  }, [userProfile?.uid]);

  const filtered = requests.filter((r) => {
    const statusOk = FILTER_STATUS[activeFilter].includes(r.status as ReservationStatus);
    const q = searchQuery.toLowerCase();
    const searchOk = !q || r.userName.toLowerCase().includes(q) || r.equipmentName.toLowerCase().includes(q);
    return statusOk && searchOk;
  });

  const counts = {
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved' || r.status === 'borrowed').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  const handleApprove = async (r: Reservation) => {
    if (!userProfile) return;
    setActionId(r.id);
    try { await reservationService.approve(r.id, userProfile.uid, r); }
    finally { setActionId(null); }
  };

  const handleReject = async (r: Reservation) => {
    setActionId(r.id);
    try { await reservationService.reject(r.id, r, 'Request declined by faculty'); }
    finally { setActionId(null); }
  };

  const statusVariant = (s: string) =>
    s === 'approved' || s === 'borrowed' ? 'success' : s === 'pending' ? 'warning' : 'danger';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[--foreground] mb-2">Student Requests</h1>
        <p className="text-[--muted-foreground]">Review and approve student equipment reservation requests</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Pending Approval', value: counts.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Approved', value: counts.approved, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Rejected', value: counts.rejected, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-5`}>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-[--muted-foreground] mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(['All', 'Pending', 'Approved', 'Rejected'] as FilterTab[]).map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === f
                  ? 'bg-[--primary-blue] text-white'
                  : 'bg-white border border-[--border] hover:bg-[--secondary] text-[--foreground]'
              }`}>{f}</button>
          ))}
        </div>
        <div className="flex-1">
          <SearchBar placeholder="Search by student or equipment..." onSearch={setSearchQuery} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-[--border] p-16 text-center text-[--muted-foreground]">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No {activeFilter.toLowerCase()} requests found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row gap-5">
                {/* Student info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-[--foreground]">{r.userName}</h3>
                      <Badge variant={statusVariant(r.status)}>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-[--muted-foreground] shrink-0" />
                        <div>
                          <p className="text-[--muted-foreground]">Equipment</p>
                          <p className="font-medium text-[--foreground]">{r.equipmentName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[--muted-foreground] shrink-0" />
                        <div>
                          <p className="text-[--muted-foreground]">Requested</p>
                          <p className="font-medium text-[--foreground]">{r.reservationDate}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Package className="w-4 h-4 text-[--muted-foreground] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[--muted-foreground]">Purpose</p>
                          <p className="font-medium text-[--foreground] text-xs leading-snug">{r.purpose}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {r.status === 'pending' && (
                  <div className="flex items-center gap-2 lg:flex-col lg:justify-center shrink-0">
                    <Button variant="success" size="sm" disabled={actionId === r.id} onClick={() => handleApprove(r)} className="flex items-center gap-1.5">
                      {actionId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Approve
                    </Button>
                    <Button variant="outline" size="sm" disabled={actionId === r.id} onClick={() => handleReject(r)} className="flex items-center gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </Button>
                  </div>
                )}

                {r.status === 'approved' || r.status === 'borrowed' ? (
                  <div className="flex items-center lg:justify-center shrink-0">
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg text-emerald-700 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Approved
                    </div>
                  </div>
                ) : null}

                {r.status === 'rejected' && (
                  <div className="flex items-center lg:justify-center shrink-0">
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg text-red-600 text-sm font-medium">
                      <XCircle className="w-4 h-4" />
                      Rejected
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
