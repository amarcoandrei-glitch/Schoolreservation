import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/ui/SearchBar';
import {
  Package, Calendar, MapPin, Clock, Loader2,
  CheckCircle, XCircle, History, RotateCcw, Users,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { reservationService, Reservation, ReservationStatus } from '../../../services/reservationService';
import { equipmentService, Equipment } from '../../../services/equipmentService';
import { optimizeImageUrl } from '../../../lib/cloudinary';

const COMPLETED_STATUSES: ReservationStatus[] = ['returned', 'rejected'];

const statusConfig: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'secondary' | 'primary'; icon: React.ElementType }> = {
  returned: { label: 'Returned',  variant: 'success', icon: CheckCircle },
  rejected: { label: 'Rejected',  variant: 'danger',  icon: XCircle },
  borrowed: { label: 'Borrowed',  variant: 'warning', icon: Package },
  approved: { label: 'Approved',  variant: 'primary', icon: CheckCircle },
  pending:  { label: 'Pending',   variant: 'secondary', icon: Clock },
};

export function HistoryPage() {
  const { userProfile } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [equipmentById, setEquipmentById] = useState<Record<string, Equipment>>({});
  const [ownedEquipmentIds, setOwnedEquipmentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'returned' | 'rejected'>('all');

  // ── Load via getDocs (always completes) ───────────────────────────────
  useEffect(() => {
    if (!userProfile) return;
    let cancelled = false;

    const loadEquipmentById = equipmentService.getAll()
      .then((items) => {
        if (!cancelled) setEquipmentById(Object.fromEntries(items.map((item) => [item.id, item])));
      })
      .catch(console.error);

    const loadReservations = async () => {
      if (userProfile.role === 'faculty') {
        const [ownedEquipment, reservations] = await Promise.all([
          equipmentService.getByOwner(userProfile.uid),
          reservationService.getAll(),
        ]);
        if (cancelled) return;

        const ownedIds = ownedEquipment.map((eq) => eq.id);
        setOwnedEquipmentIds(ownedIds);
        setReservations(
          reservations.filter((r) =>
            COMPLETED_STATUSES.includes(r.status as ReservationStatus) &&
            (r.userId === userProfile.uid || ownedIds.includes(r.equipmentId))
          )
        );
      } else {
        const items = await reservationService.getByUser(userProfile.uid);
        if (cancelled) return;
        setReservations(items.filter((r) => COMPLETED_STATUSES.includes(r.status as ReservationStatus)));
      }
    };

    loadReservations().catch(console.error).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [userProfile?.uid, userProfile?.role]);

  // ── Realtime updates ──────────────────────────────────────────────────
  useEffect(() => {
    if (!userProfile) return;
    const unsub = reservationService.subscribe((all) => {
      setReservations(
        all.filter((r) => {
          const completed = COMPLETED_STATUSES.includes(r.status as ReservationStatus);
          if (!completed) return false;
          if (userProfile.role === 'faculty') {
            return r.userId === userProfile.uid || ownedEquipmentIds.includes(r.equipmentId);
          }
          return r.userId === userProfile.uid;
        })
      );
    });
    return unsub;
  }, [userProfile?.uid, userProfile?.role, ownedEquipmentIds]);

  const filtered = reservations.filter((r) => {
    const statusOk = statusFilter === 'all' || r.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const searchOk = !q || r.equipmentName.toLowerCase().includes(q) || r.purpose.toLowerCase().includes(q);
    return statusOk && searchOk;
  });

  const counts = {
    all:      reservations.length,
    returned: reservations.filter((r) => r.status === 'returned').length,
    rejected: reservations.filter((r) => r.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[--foreground] mb-2">Reservation History</h1>
        <p className="text-[--muted-foreground]">
          {userProfile?.role === 'faculty'
            ? 'Completed requests from students for equipment you own, including returned reservations.'
            : 'Your complete history of returned and closed reservations.'}
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total History', value: counts.all,      color: 'text-blue-600',   bg: 'bg-blue-50',   icon: History },
          { label: 'Returned',      value: counts.returned,  color: 'text-emerald-600', bg: 'bg-emerald-50', icon: RotateCcw },
          { label: 'Rejected',      value: counts.rejected,  color: 'text-red-600',    bg: 'bg-red-50',    icon: XCircle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
            <div className={`w-10 h-10 bg-white/60 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-[--muted-foreground]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
          {([['all', 'All'], ['returned', 'Returned'], ['rejected', 'Rejected']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setStatusFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                statusFilter === key ? 'bg-white text-[--foreground] shadow-sm' : 'text-[--muted-foreground] hover:text-[--foreground]'
              }`}>
              {label}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${statusFilter === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-[--muted-foreground]'}`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex-1">
          <SearchBar placeholder="Search by equipment name or purpose…" onSearch={setSearchQuery} />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[--border] p-16 text-center">
          <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="font-medium text-[--foreground] mb-1">No history found</p>
          <p className="text-sm text-[--muted-foreground]">
            {searchQuery ? 'Try a different search term.' : 'Completed reservations will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const cfg = statusConfig[r.status] ?? statusConfig.pending;
            const Icon = cfg.icon;
            return (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row gap-5">
                  <div className="w-full lg:w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                    {equipmentById[r.equipmentId]?.imageUrl ? (
                      <img
                        src={optimizeImageUrl(equipmentById[r.equipmentId].imageUrl, 192, 85)}
                        alt={r.equipmentName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-10 h-10 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-[--foreground] text-lg mb-0.5">{r.equipmentName}</h3>
                        <p className="text-sm text-[--muted-foreground]">{r.equipmentCategory ?? 'Equipment'}</p>
                      </div>
                      <Badge variant={cfg.variant}>
                        <Icon className="w-3 h-3 mr-1" />{cfg.label}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[--muted-foreground] shrink-0" />
                        <div>
                          <p className="text-xs text-[--muted-foreground]">Reserved</p>
                          <p className="font-medium text-[--foreground]">{r.reservationDate}</p>
                        </div>
                      </div>
                      {r.borrowDate && (
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-[--muted-foreground] shrink-0" />
                          <div>
                            <p className="text-xs text-[--muted-foreground]">Borrowed</p>
                            <p className="font-medium text-[--foreground]">{r.borrowDate}</p>
                          </div>
                        </div>
                      )}
                      {r.returnDate && (
                        <div className="flex items-center gap-2">
                          <RotateCcw className="w-4 h-4 text-[--muted-foreground] shrink-0" />
                          <div>
                            <p className="text-xs text-[--muted-foreground]">Returned</p>
                            <p className="font-medium text-[--foreground]">{r.returnDate}</p>
                          </div>
                        </div>
                      )}
                      {r.userName && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[--muted-foreground] shrink-0" />
                          <div>
                            <p className="text-xs text-[--muted-foreground]">Requested By</p>
                            <p className="font-medium text-[--foreground]">{r.userName}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Clock className="w-4 h-4 text-[--muted-foreground] mt-0.5 shrink-0" />
                      <p className="text-[--muted-foreground]"><span className="font-medium text-[--foreground]">Purpose:</span> {r.purpose}</p>
                    </div>
                    {r.remarks && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                        <span className="font-medium">Remarks:</span> {r.remarks}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
