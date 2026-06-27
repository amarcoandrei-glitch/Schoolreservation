import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Package, MapPin, Calendar, Info, CheckCircle,
  Clock, ArrowLeft, Loader2, AlertCircle,
} from 'lucide-react';
import { addDoc, collection, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { equipmentService, Equipment } from '../../../services/equipmentService';
import { reservationService } from '../../../services/reservationService';
import { optimizeImageUrl } from '../../../lib/cloudinary';

interface EquipmentDetailsProps {
  equipmentId: string | null;
  onBack: () => void;
  onViewDetails?: (id: string) => void;
}

const GUIDELINES = [
  'Handle with care and keep in the provided case when not in use.',
  'Do not modify, alter, or damage the equipment in any way.',
  'Report any issues or damage immediately to the equipment manager.',
  'Return on time with all accessories and in the same condition.',
];

export function EquipmentDetails({ equipmentId, onBack }: EquipmentDetailsProps) {
  const { userProfile } = useAuth();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [related, setRelated] = useState<Equipment[]>([]);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form state
  const [startDate, setStartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // ── Load equipment ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!equipmentId) { setNotFound(true); setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      try {
        const eq = await equipmentService.getById(equipmentId);
        if (!cancelled) {
          if (!eq) { setNotFound(true); }
          else {
            setEquipment(eq);
            setQuantity(1);
            // Fetch owner name if faculty-owned
            if (eq.ownerType === 'faculty' && eq.ownerId) {
              try {
                const ownerSnap = await getDoc(doc(db, 'users', eq.ownerId));
                if (ownerSnap.exists()) setOwnerName(ownerSnap.data().name ?? null);
              } catch { /* ignore */ }
            }
            // Load related (same category, different item)
            const all = await equipmentService.getAll();
            setRelated(all.filter((e) => e.category === eq.category && e.id !== eq.id).slice(0, 3));
          }
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [equipmentId]);

  // ── Submit reservation ─────────────────────────────────────────────────
  const handleReservation = async () => {
    if (!equipment || !userProfile) return;
    setResult(null);

    if (!startDate) { setResult({ ok: false, msg: 'Start date is required.' }); return; }
    if (!returnDate) { setResult({ ok: false, msg: 'Return date is required.' }); return; }
    if (returnDate < startDate) { setResult({ ok: false, msg: 'Return date must be after start date.' }); return; }
    if (!purpose.trim()) { setResult({ ok: false, msg: 'Purpose is required.' }); return; }
    if (quantity < 1 || quantity > equipment.availableQuantity) {
      setResult({ ok: false, msg: `Quantity must be between 1 and ${equipment.availableQuantity}.` }); return;
    }

    setSubmitting(true);
    try {
      await reservationService.create({
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        equipmentCategory: equipment.category,
        equipmentLocation: equipment.location,
        userId: userProfile.uid,
        userName: userProfile.name,
        userRole: userProfile.role === 'faculty' ? 'faculty' : 'student',
        quantity,
        reservationDate: startDate,
        returnDate,
        purpose,
      });

      // Notify the specific faculty who owns this equipment
      if (equipment.ownerType === 'faculty' && equipment.ownerId) {
        await addDoc(collection(db, 'notifications'), {
          userId: equipment.ownerId,
          title: 'New Equipment Request',
          message: `${userProfile.name} has requested to borrow "${equipment.name}" (${quantity} unit${quantity > 1 ? 's' : ''}) from ${startDate} to ${returnDate}.`,
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      setResult({ ok: true, msg: 'Reservation submitted successfully! You will be notified once approved.' });
      setStartDate('');
      setReturnDate('');
      setPurpose('');
      setQuantity(1);
    } catch (e: any) {
      setResult({ ok: false, msg: e.message ?? 'Failed to submit reservation.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / not found ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (notFound || !equipment) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4" />Back to Equipment</Button>
        <div className="bg-white rounded-xl border border-[--border] p-16 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-[--muted-foreground]">Equipment not found.</p>
          <Button variant="primary" className="mt-4" onClick={onBack}>Browse Equipment</Button>
        </div>
      </div>
    );
  }

  const isAvailable = equipment.availableQuantity > 0;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="w-4 h-4" />Back to Equipment
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            {/* Image */}
            <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden flex items-center justify-center">
              {equipment.imageUrl ? (
                <img
                  src={optimizeImageUrl(equipment.imageUrl, 800, 85)}
                  alt={equipment.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-24 h-24 text-gray-300" />
              )}
            </div>

            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-[--foreground] mb-1">{equipment.name}</h1>
                  <p className="text-[--muted-foreground]">{equipment.category}</p>
                </div>
                <Badge variant={isAvailable ? 'success' : 'danger'}>
                  {isAvailable ? 'Available' : 'Unavailable'}
                </Badge>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-[--background] rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600">{equipment.availableQuantity}</p>
                  <p className="text-sm text-[--muted-foreground]">Available Now</p>
                </div>
                <div className="text-center p-4 bg-[--background] rounded-lg">
                  <p className="text-2xl font-bold text-[--foreground]">{equipment.quantity}</p>
                  <p className="text-sm text-[--muted-foreground]">Total Units</p>
                </div>
                <div className="text-center p-4 bg-[--background] rounded-lg">
                  <MapPin className="w-5 h-5 text-[--primary-blue] mx-auto mb-1" />
                  <p className="text-sm text-[--muted-foreground] leading-tight">{equipment.location || '—'}</p>
                </div>
              </div>

              {/* Description */}
              {equipment.description && (
                <div className="mb-6">
                  <h3 className="font-semibold text-[--foreground] mb-2">Description</h3>
                  <p className="text-[--muted-foreground] leading-relaxed">{equipment.description}</p>
                </div>
              )}

              {/* Specs */}
              <div className="mb-6">
                <h3 className="font-semibold text-[--foreground] mb-3">Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Category', value: equipment.category },
                    { label: 'Condition', value: equipment.condition },
                    { label: 'Location', value: equipment.location || '—' },
                    { label: 'Available', value: `${equipment.availableQuantity} / ${equipment.quantity}` },
                    ...(equipment.department ? [{ label: 'Department', value: equipment.department }] : []),
                    ...(ownerName ? [{ label: 'Managed by', value: ownerName }] : []),
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between p-3 bg-[--background] rounded-lg">
                      <span className="text-sm text-[--muted-foreground]">{s.label}</span>
                      <span className="text-sm font-medium text-[--foreground]">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guidelines */}
              <div>
                <h3 className="font-semibold text-[--foreground] mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />Usage Guidelines
                </h3>
                <ul className="space-y-2">
                  {GUIDELINES.map((g, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-[--success] mt-0.5 shrink-0" />
                      <span className="text-[--foreground]">{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Related */}
          {related.length > 0 && (
            <Card>
              <CardContent>
                <h3 className="font-semibold text-[--foreground] mb-4">Related Equipment</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {related.map((item) => (
                    <div key={item.id}
                      onClick={onBack}
                      className="p-4 bg-[--background] rounded-lg hover:bg-[--secondary] transition-colors cursor-pointer"
                    >
                      {item.imageUrl && (
                        <img src={optimizeImageUrl(item.imageUrl, 200, 70)} alt={item.name}
                          className="w-full h-20 object-cover rounded-lg mb-2" />
                      )}
                      <p className="font-medium text-[--foreground] text-sm mb-1 truncate">{item.name}</p>
                      <p className="text-xs text-[--muted-foreground]">
                        {item.availableQuantity} of {item.quantity} available
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right column: Reservation form ── */}
        <div>
          <Card className="sticky top-24">
            <CardContent>
              <h3 className="font-semibold text-[--foreground] mb-4">Reserve This Equipment</h3>

              {/* Success state */}
              {result?.ok ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center text-center py-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="font-semibold text-[--foreground] mb-1">Request Submitted!</p>
                    <p className="text-sm text-[--muted-foreground]">{result.msg}</p>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => setResult(null)}>
                    Make Another Reservation
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Error */}
                  {result && !result.ok && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      {result.msg}
                    </div>
                  )}

                  {/* Start date */}
                  <div>
                    <label className="block text-sm font-medium text-[--foreground] mb-1.5">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      min={today}
                      className="w-full px-3 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  {/* Return date */}
                  <div>
                    <label className="block text-sm font-medium text-[--foreground] mb-1.5">
                      Return Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      min={startDate || today}
                      className="w-full px-3 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-[--foreground] mb-1.5">
                      Quantity <span className="text-[--muted-foreground] font-normal">(max {equipment.availableQuantity})</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={equipment.availableQuantity}
                      disabled={!isAvailable}
                      className="w-full px-3 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] disabled:bg-gray-50 transition-all"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  {/* Purpose */}
                  <div>
                    <label className="block text-sm font-medium text-[--foreground] mb-1.5">
                      Purpose of Use <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      disabled={!isAvailable}
                      className="w-full px-3 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] placeholder:text-[--muted-foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] resize-none disabled:bg-gray-50 transition-all"
                      placeholder="Describe how you'll use this equipment..."
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                    />
                  </div>

                  {/* Notice */}
                  <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                    <Clock className="w-4 h-4 text-[--primary-blue] mt-0.5 shrink-0" />
                    <p className="text-sm text-[--foreground]">
                      Your reservation will be reviewed and approved within 24 hours
                    </p>
                  </div>

                  {/* Submit */}
                  <Button
                    variant="primary"
                    className="w-full"
                    disabled={!isAvailable || submitting}
                    onClick={handleReservation}
                  >
                    {submitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</>
                      : isAvailable
                      ? 'Submit Reservation Request'
                      : 'Currently Unavailable'}
                  </Button>

                  <p className="text-xs text-center text-[--muted-foreground]">
                    By reserving, you agree to the equipment usage policies
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
