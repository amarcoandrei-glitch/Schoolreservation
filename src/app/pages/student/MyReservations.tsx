import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Package, Calendar, MapPin, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { reservationService, Reservation, ReservationStatus } from '../../../services/reservationService';
import { equipmentService, Equipment } from '../../../services/equipmentService';
import { optimizeImageUrl } from '../../../lib/cloudinary';

type FilterTab = 'All' | 'Active' | 'Pending' | 'Approved' | 'Completed';

const FILTER_STATUS: Record<FilterTab, ReservationStatus[]> = {
  All: ['pending', 'approved', 'borrowed', 'returned', 'rejected'],
  Active: ['borrowed'],
  Pending: ['pending'],
  Approved: ['approved'],
  Completed: ['returned'],
};

interface MyReservationsProps {
  onViewDetails: (equipmentId: string) => void;
}

export function MyReservations({ onViewDetails }: MyReservationsProps) {
  const { userProfile } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [equipmentById, setEquipmentById] = useState<Record<string, Equipment>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [actionId, setActionId] = useState<string | null>(null);

  // ── Initial load via getDocs (always completes) ──────────────────────────
  useEffect(() => {
    if (!userProfile) return;
    let cancelled = false;

    reservationService.getByUser(userProfile.uid)
      .then((items) => { if (!cancelled) setReservations(items); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });

    equipmentService.getAll()
      .then((items) => {
        if (!cancelled) setEquipmentById(Object.fromEntries(items.map((item) => [item.id, item])));
      })
      .catch(console.error);

    return () => { cancelled = true; };
  }, [userProfile?.uid]);

  // ── Realtime updates (independent of loading) ─────────────────────────
  useEffect(() => {
    if (!userProfile) return;
    const unsub = reservationService.subscribe((all) => {
      setReservations(all.filter((r) => r.userId === userProfile.uid));
    });
    return unsub;
  }, [userProfile?.uid]);

  const filtered = reservations.filter((r) =>
    FILTER_STATUS[activeFilter].includes(r.status as ReservationStatus)
  );

  const handleCancel = async (r: Reservation) => {
    if (!confirm('Cancel this reservation?')) return;
    setActionId(r.id);
    try { await reservationService.cancel(r.id); }
    finally { setActionId(null); }
  };

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

  const getStatusBadge = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'primary' | 'default' | 'danger'> = {
      borrowed: 'success', pending: 'warning', approved: 'primary',
      returned: 'default', rejected: 'danger',
    };
    const label = status === 'borrowed' ? 'Active' : status.charAt(0).toUpperCase() + status.slice(1);
    return <Badge variant={map[status] ?? 'default'}>{label}</Badge>;
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
      <div>
        <h1 className="text-3xl font-bold text-[--foreground] mb-2">My Reservations</h1>
        <p className="text-[--muted-foreground]">View and manage your equipment reservations</p>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {(['All', 'Active', 'Pending', 'Approved', 'Completed'] as FilterTab[]).map((f) => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === f
                ? 'bg-[--primary-blue] text-white'
                : 'bg-white border border-[--border] hover:bg-[--secondary] text-[--foreground]'
            }`}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-[--border] p-16 text-center text-[--muted-foreground]">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No {activeFilter.toLowerCase()} reservations.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-32 h-32 bg-[--secondary] rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                  {equipmentById[r.equipmentId]?.imageUrl ? (
                    <img
                      src={optimizeImageUrl(equipmentById[r.equipmentId].imageUrl, 240, 85)}
                      alt={r.equipmentName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-12 h-12 text-[--muted-foreground]" />
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-[--foreground] text-lg mb-1">{r.equipmentName}</h3>
                      <p className="text-sm text-[--muted-foreground]">{r.equipmentCategory ?? 'Equipment'}</p>
                    </div>
                    {getStatusBadge(r.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(r.status === 'borrowed') && (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-[--muted-foreground]" />
                          <div><p className="text-[--muted-foreground]">Borrowed</p><p className="text-[--foreground] font-medium">{r.borrowDate ?? r.reservationDate}</p></div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-[--muted-foreground]" />
                          <div><p className="text-[--muted-foreground]">Return by</p><p className="text-[--foreground] font-medium">{r.returnDate ?? '—'}</p></div>
                        </div>
                        {r.equipmentLocation && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-[--muted-foreground]" />
                            <div><p className="text-[--muted-foreground]">Location</p><p className="text-[--foreground] font-medium">{r.equipmentLocation}</p></div>
                          </div>
                        )}
                      </>
                    )}
                    {r.status === 'pending' && (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-[--muted-foreground]" />
                          <div><p className="text-[--muted-foreground]">Requested</p><p className="text-[--foreground] font-medium">{r.reservationDate}</p></div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-[--muted-foreground]" />
                          <div><p className="text-[--muted-foreground]">Purpose</p><p className="text-[--foreground] font-medium">{r.purpose}</p></div>
                        </div>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-[--muted-foreground]" />
                          <div><p className="text-[--muted-foreground]">Reservation Date</p><p className="text-[--foreground] font-medium">{r.reservationDate}</p></div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-[--muted-foreground]" />
                          <div><p className="text-[--muted-foreground]">Return Date</p><p className="text-[--foreground] font-medium">{r.returnDate ?? '—'}</p></div>
                        </div>
                      </>
                    )}
                    {r.status === 'returned' && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <div><p className="text-[--muted-foreground]">Returned on</p><p className="text-[--foreground] font-medium">{r.returnDate ?? '—'}</p></div>
                      </div>
                    )}
                  </div>

                  {r.remarks && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-700"><span className="font-medium">Remarks:</span> {r.remarks}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {r.status === 'pending' && (
                      <Button variant="danger" size="sm" disabled={actionId === r.id} onClick={() => handleCancel(r)}>
                        {actionId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Cancel Request'}
                      </Button>
                    )}
                    {r.status === 'borrowed' && (
                      <Button variant="success" size="sm" disabled={actionId === r.id} onClick={() => handleReturn(r)}>
                        {actionId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Return Equipment'}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => onViewDetails(r.equipmentId)}>View Details</Button>
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

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
