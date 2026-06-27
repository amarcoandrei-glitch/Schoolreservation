import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/ui/SearchBar';
import { User, Calendar, Package, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
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

  const handleMarkBorrowed = async (r: Reservation) => {
    setActionId(r.id);
    try { await reservationService.markBorrowed(r.id, r); }
    finally { setActionId(null); }
  };

  const handleMarkReturned = async (r: Reservation) => {
    setActionId(r.id);
    try { await reservationService.markReturned(r.id, r); }
    finally { setActionId(null); }
  };

  const statusVariant = (s: string) =>
    s === 'approved' || s === 'borrowed' ? 'success' : s === 'pending' ? 'warning' : 'danger';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200/80 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-8 text-white shadow-2xl shadow-slate-900/10">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300/80">Faculty Dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Student Equipment Requests</h1>
          <p className="mt-4 text-slate-300 leading-7">
            Manage student reservation requests with a clean workflow. Approve, borrow, and return equipment using an intuitive, fast interface.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-slate-900/90 p-4 ring-1 ring-white/10 backdrop-blur">
              <p className="text-sm text-slate-400">Pending</p>
              <p className="mt-2 text-3xl font-semibold text-white">{counts.pending}</p>
            </div>
            <div className="rounded-3xl bg-slate-900/90 p-4 ring-1 ring-white/10 backdrop-blur">
              <p className="text-sm text-slate-400">Approved</p>
              <p className="mt-2 text-3xl font-semibold text-white">{counts.approved}</p>
            </div>
            <div className="rounded-3xl bg-slate-900/90 p-4 ring-1 ring-white/10 backdrop-blur">
              <p className="text-sm text-slate-400">Rejected</p>
              <p className="mt-2 text-3xl font-semibold text-white">{counts.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] items-end">
        <div className="rounded-3xl bg-white border border-slate-200 p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Filter requests</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['All', 'Pending', 'Approved', 'Rejected'] as FilterTab[]).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeFilter === f
                    ? 'bg-slate-950 text-white shadow-lg shadow-slate-800/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-3xl bg-white border border-slate-200 p-4 shadow-sm">
          <SearchBar placeholder="Search by student or equipment..." onSearch={setSearchQuery} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-16 text-center text-slate-500 shadow-sm">
          <Package className="mx-auto h-14 w-14 text-slate-300" />
          <p className="mt-4 text-lg font-medium">No {activeFilter.toLowerCase()} requests found.</p>
          <p className="mt-2 text-sm text-slate-500">Try changing the filter or search query to find the request.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <Card key={r.id} className="overflow-hidden border border-slate-200 bg-white shadow-xl shadow-slate-900/5 transition hover:-translate-y-0.5">
              <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr] p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-sm shadow-slate-900/10">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Student</p>
                      <p className="text-xl font-semibold text-slate-950">{r.userName}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Equipment</p>
                      <p className="mt-2 font-semibold text-slate-900">{r.equipmentName}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Requested</p>
                      <p className="mt-2 font-semibold text-slate-900">{r.reservationDate}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Purpose</p>
                      <p className="mt-2 font-semibold text-slate-900 leading-snug">{r.purpose}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Status</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant={statusVariant(r.status)}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Quantity</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{r.quantity}</p>
                    {r.status === 'borrowed' && r.borrowDate && (
                      <p className="mt-2 text-sm text-slate-500">Borrowed on {r.borrowDate}</p>
                    )}
                    {r.status === 'returned' && r.returnDate && (
                      <p className="mt-2 text-sm text-slate-500">Returned on {r.returnDate}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {r.status === 'pending' && (
                      <>
                        <Button variant="success" size="sm" disabled={actionId === r.id} onClick={() => handleApprove(r)} className="w-full sm:w-auto">
                          {actionId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Approve
                        </Button>
                        <Button variant="outline" size="sm" disabled={actionId === r.id} onClick={() => handleReject(r)} className="w-full sm:w-auto text-red-600 border-red-200 hover:bg-red-50">
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </Button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <Button variant="success" size="sm" disabled={actionId === r.id} onClick={() => handleMarkBorrowed(r)} className="w-full">
                        {actionId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                        Mark Borrowed
                      </Button>
                    )}
                    {r.status === 'borrowed' && (
                      <Button variant="secondary" size="sm" disabled={actionId === r.id} onClick={() => handleMarkReturned(r)} className="w-full">
                        {actionId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Mark Returned
                      </Button>
                    )}
                    {r.status === 'rejected' && (
                      <div className="rounded-3xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4" />
                          Rejected request
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
