import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { reservationService, Reservation } from '../../../services/reservationService';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SearchBar } from '../../components/ui/SearchBar';
import { Modal } from '../../components/ui/Modal';
import {
  CheckCircle, XCircle, Clock, Package,
  Calendar, User, Loader2, AlertCircle, FileText,
} from 'lucide-react';

type FilterTab = 'pending' | 'approved' | 'rejected' | 'all';

export function ApprovalsPage() {
  const { userProfile } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('pending');
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; reservation: Reservation | null }>({ open: false, reservation: null });
  const [remarks, setRemarks] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // ── Initial load ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    reservationService.getAll()
      .then((items) => { if (!cancelled) setReservations(items); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ── Realtime updates ──────────────────────────────────────────────────
  useEffect(() => {
    const unsub = reservationService.subscribe(setReservations);
    return unsub;
  }, []);

  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Counts ─────────────────────────────────────────────────────────────
  const counts = {
    pending:  reservations.filter((r) => r.status === 'pending').length,
    approved: reservations.filter((r) => r.status === 'approved').length,
    rejected: reservations.filter((r) => r.status === 'rejected').length,
    all:      reservations.length,
  };

  // ── Filter + search ───────────────────────────────────────────────────
  const displayed = reservations.filter((r) => {
    const statusOk = filter === 'all' || r.status === filter;
    const q = search.toLowerCase();
    const searchOk = !q || r.userName.toLowerCase().includes(q) || r.equipmentName.toLowerCase().includes(q) || r.purpose.toLowerCase().includes(q);
    return statusOk && searchOk;
  });

  // ── Actions ───────────────────────────────────────────────────────────
  const handleApprove = async (r: Reservation) => {
    if (!userProfile) return;
    setActionId(r.id);
    try {
      await reservationService.approve(r.id, userProfile.uid, r);
      notify(`Approved reservation for ${r.userName}`);
    } catch (e: any) {
      notify(e.message ?? 'Failed to approve', false);
    } finally {
      setActionId(null);
    }
  };

  const openRejectModal = (r: Reservation) => {
    setRejectModal({ open: true, reservation: r });
    setRemarks('');
  };

  const handleReject = async () => {
    const r = rejectModal.reservation;
    if (!r) return;
    setActionId(r.id);
    try {
      await reservationService.reject(r.id, r, remarks);
      setRejectModal({ open: false, reservation: null });
      notify(`Rejected reservation for ${r.userName}`);
    } catch (e: any) {
      notify(e.message ?? 'Failed to reject', false);
    } finally {
      setActionId(null);
    }
  };

  const statusConfig: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' | 'secondary' }> = {
    pending:  { label: 'Pending',  variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'danger' },
    borrowed: { label: 'Borrowed', variant: 'secondary' },
    returned: { label: 'Returned', variant: 'secondary' },
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'pending',  label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all',      label: 'All' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[--foreground] mb-2">Reservation Approvals</h1>
        <p className="text-[--muted-foreground]">Review and process equipment reservation requests</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2.5 p-4 rounded-xl border text-sm ${toast.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pending',  value: counts.pending,  color: 'text-amber-600',  bg: 'bg-amber-50',  icon: Clock },
          { label: 'Approved', value: counts.approved, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
          { label: 'Rejected', value: counts.rejected, color: 'text-red-600',    bg: 'bg-red-50',    icon: XCircle },
          { label: 'Total',    value: counts.all,      color: 'text-blue-600',   bg: 'bg-blue-50',   icon: FileText },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${color}`}>{loading ? '—' : value}</p>
              <p className="text-xs text-[--muted-foreground]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                filter === key ? 'bg-white text-[--foreground] shadow-sm' : 'text-[--muted-foreground] hover:text-[--foreground]'
              }`}
            >
              {label}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${filter === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-[--muted-foreground]'}`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex-1">
          <SearchBar placeholder="Search by student, equipment, or purpose…" onSearch={setSearch} />
        </div>
      </div>

      {/* Reservations list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-xl border border-[--border] p-16 text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 text-[--muted-foreground] opacity-30" />
          <p className="text-[--muted-foreground]">
            {filter === 'pending' ? 'No pending requests — all caught up!' : `No ${filter} reservations found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((r) => {
            const cfg = statusConfig[r.status] ?? { label: r.status, variant: 'secondary' as const };
            const isPending = r.status === 'pending';
            const isBusy = actionId === r.id;

            return (
              <div key={r.id} className="bg-white rounded-xl border border-[--border] p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-[--foreground]">{r.userName}</p>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          <span className="text-xs text-[--muted-foreground] capitalize bg-gray-100 px-2 py-0.5 rounded-full">{r.userRole}</span>
                        </div>
                        <p className="text-sm text-[--muted-foreground] mt-0.5 truncate">{r.purpose}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-13">
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4 text-[--muted-foreground] shrink-0" />
                        <div>
                          <p className="text-xs text-[--muted-foreground]">Equipment</p>
                          <p className="font-medium text-[--foreground]">{r.equipmentName} × {r.quantity}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-[--muted-foreground] shrink-0" />
                        <div>
                          <p className="text-xs text-[--muted-foreground]">Requested</p>
                          <p className="font-medium text-[--foreground]">{r.reservationDate}</p>
                        </div>
                      </div>
                      {r.returnDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-[--muted-foreground] shrink-0" />
                          <div>
                            <p className="text-xs text-[--muted-foreground]">Return by</p>
                            <p className="font-medium text-[--foreground]">{r.returnDate}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {r.remarks && (
                      <div className="pl-13">
                        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                          <span className="font-medium">Rejection reason:</span> {r.remarks}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {isPending && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="success"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleApprove(r)}
                        className="flex items-center gap-1.5"
                      >
                        {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => openRejectModal(r)}
                        className="flex items-center gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {r.status === 'approved' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Approved
                      </div>
                    </div>
                  )}

                  {r.status === 'rejected' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                        <XCircle className="w-4 h-4" />
                        Rejected
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, reservation: null })}
        title="Reject Reservation"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectModal({ open: false, reservation: null })}>Cancel</Button>
            <Button variant="danger" onClick={handleReject} disabled={actionId !== null}>
              {actionId !== null ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reject'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {rejectModal.reservation && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <p className="font-medium text-[--foreground]">{rejectModal.reservation.userName}</p>
              <p className="text-[--muted-foreground]">{rejectModal.reservation.equipmentName}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[--foreground] mb-1.5">
              Reason for rejection <span className="text-[--muted-foreground] font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] placeholder:text-[--muted-foreground] focus:outline-none focus:ring-2 focus:ring-red-400 resize-none transition-all"
              placeholder="e.g. Equipment is currently under maintenance…"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
