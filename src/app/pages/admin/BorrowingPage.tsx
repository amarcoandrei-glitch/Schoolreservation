import { useState, useEffect } from 'react';
import { reservationService, Reservation } from '../../../services/reservationService';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SearchBar } from '../../components/ui/SearchBar';
import {
  Package, Calendar, User, Loader2, AlertCircle,
  CheckCircle, ArrowDownToLine, RotateCcw, Clock,
} from 'lucide-react';

type ViewTab = 'approved' | 'borrowed' | 'returned';

export function BorrowingPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ViewTab>('approved');
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
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

  const counts = {
    approved: reservations.filter((r) => r.status === 'approved').length,
    borrowed: reservations.filter((r) => r.status === 'borrowed').length,
    returned: reservations.filter((r) => r.status === 'returned').length,
  };

  const displayed = reservations.filter((r) => {
    const statusOk = r.status === tab;
    const q = search.toLowerCase();
    const searchOk = !q || r.userName.toLowerCase().includes(q) || r.equipmentName.toLowerCase().includes(q);
    return statusOk && searchOk;
  });

  const handleMarkBorrowed = async (r: Reservation) => {
    setActionId(r.id);
    try {
      await reservationService.markBorrowed(r.id, r);
      notify(`${r.equipmentName} marked as borrowed by ${r.userName}`);
    } catch (e: any) {
      notify(e.message ?? 'Failed to update', false);
    } finally {
      setActionId(null);
    }
  };

  const handleMarkReturned = async (r: Reservation) => {
    setActionId(r.id);
    try {
      await reservationService.markReturned(r.id, r);
      notify(`${r.equipmentName} returned by ${r.userName}`);
    } catch (e: any) {
      notify(e.message ?? 'Failed to update', false);
    } finally {
      setActionId(null);
    }
  };

  const tabs: { key: ViewTab; label: string; icon: typeof Clock; color: string }[] = [
    { key: 'approved', label: 'Ready to Borrow', icon: Clock,           color: 'text-blue-600' },
    { key: 'borrowed', label: 'Currently Borrowed', icon: ArrowDownToLine, color: 'text-amber-600' },
    { key: 'returned', label: 'Returned',          icon: RotateCcw,     color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[--foreground] mb-2">Borrowing Management</h1>
        <p className="text-[--muted-foreground]">Track equipment pickups and returns</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2.5 p-4 rounded-xl border text-sm ${toast.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {tabs.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="bg-white rounded-xl border border-[--border] p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${color}`}>{loading ? '—' : counts[key]}</p>
              <p className="text-xs text-[--muted-foreground]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                tab === key ? 'bg-white text-[--foreground] shadow-sm' : 'text-[--muted-foreground] hover:text-[--foreground]'
              }`}
            >
              {label}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${tab === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-[--muted-foreground]'}`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex-1">
          <SearchBar placeholder="Search by student or equipment…" onSearch={setSearch} />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-xl border border-[--border] p-16 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-[--muted-foreground] opacity-30" />
          <p className="text-[--muted-foreground]">
            {tab === 'approved' ? 'No approved reservations awaiting pickup.' : tab === 'borrowed' ? 'No equipment currently borrowed.' : 'No returned equipment yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((r) => {
            const isBusy = actionId === r.id;

            return (
              <div key={r.id} className="bg-white rounded-xl border border-[--border] p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Status strip */}
                  <div className={`w-1 self-stretch rounded-full hidden lg:block ${
                    r.status === 'approved' ? 'bg-blue-400' : r.status === 'borrowed' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />

                  {/* Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-[--muted-foreground]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-[--foreground]">{r.userName}</p>
                          <span className="text-xs text-[--muted-foreground] capitalize bg-gray-100 px-2 py-0.5 rounded-full">{r.userRole}</span>
                        </div>
                        <p className="text-sm text-[--muted-foreground] mt-0.5">{r.purpose}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4 text-[--muted-foreground] shrink-0" />
                        <div>
                          <p className="text-xs text-[--muted-foreground]">Equipment</p>
                          <p className="font-medium text-[--foreground]">{r.equipmentName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4 text-[--muted-foreground] shrink-0" />
                        <div>
                          <p className="text-xs text-[--muted-foreground]">Quantity</p>
                          <p className="font-medium text-[--foreground]">{r.quantity} unit{r.quantity > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-[--muted-foreground] shrink-0" />
                        <div>
                          <p className="text-xs text-[--muted-foreground]">
                            {r.status === 'borrowed' ? 'Borrowed on' : r.status === 'returned' ? 'Returned on' : 'Approved for'}
                          </p>
                          <p className="font-medium text-[--foreground]">
                            {r.status === 'borrowed' ? (r.borrowDate ?? r.reservationDate) : r.status === 'returned' ? (r.returnDate ?? '—') : r.reservationDate}
                          </p>
                        </div>
                      </div>
                      {r.returnDate && r.status !== 'returned' && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                          <div>
                            <p className="text-xs text-[--muted-foreground]">Return by</p>
                            <p className="font-medium text-amber-600">{r.returnDate}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="shrink-0">
                    {r.status === 'approved' && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleMarkBorrowed(r)}
                        className="flex items-center gap-1.5"
                      >
                        {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
                        Mark as Borrowed
                      </Button>
                    )}

                    {r.status === 'borrowed' && (
                      <Button
                        variant="success"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleMarkReturned(r)}
                        className="flex items-center gap-1.5"
                      >
                        {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                        Mark as Returned
                      </Button>
                    )}

                    {r.status === 'returned' && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Returned
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
