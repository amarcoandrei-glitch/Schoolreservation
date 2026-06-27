import { useState, useEffect } from 'react';
import { SearchBar } from '../../components/ui/SearchBar';
import { EquipmentCard } from '../../components/ui/EquipmentCard';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Filter, Loader2, CheckCircle, AlertCircle, Clock, Package, MapPin } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { equipmentService, Equipment } from '../../../services/equipmentService';
import { reservationService } from '../../../services/reservationService';
import { optimizeImageUrl } from '../../../lib/cloudinary';

interface BrowseEquipmentProps {
  onViewDetails: (id: string) => void;
}

interface ReserveForm {
  startDate: string;
  returnDate: string;
  quantity: number;
  purpose: string;
}

const emptyForm: ReserveForm = {
  startDate: '',
  returnDate: '',
  quantity: 1,
  purpose: '',
};

export function BrowseEquipment({ onViewDetails }: BrowseEquipmentProps) {
  const { userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Reserve modal state
  const [reserveTarget, setReserveTarget] = useState<Equipment | null>(null);
  const [form, setForm] = useState<ReserveForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // ── Initial load ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    equipmentService.getAll()
      .then((items) => { if (!cancelled) { setEquipment(items); } })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ── Realtime updates ──────────────────────────────────────────────────
  useEffect(() => {
    const unsub = equipmentService.subscribe(setEquipment);
    return unsub;
  }, []);

  // ── Categories ─────────────────────────────────────────────────────────
  const categoryCounts: Record<string, number> = {};
  equipment.forEach((e) => {
    categoryCounts[e.category] = (categoryCounts[e.category] ?? 0) + 1;
  });
  const categories = [
    { id: 'all', name: 'All Equipment', count: equipment.length },
    ...Object.entries(categoryCounts).map(([name, count]) => ({ id: name, name, count })),
  ];

  const filtered = equipment.filter((e) => {
    const catOk = selectedCategory === 'all' || e.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const searchOk = !q || e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || e.location.toLowerCase().includes(q);
    return catOk && searchOk;
  });

  // ── Reserve handlers ───────────────────────────────────────────────────
  const openReserve = (item: Equipment) => {
    setReserveTarget(item);
    setForm({ ...emptyForm, quantity: 1 });
    setSubmitResult(null);
  };

  const closeReserve = () => {
    setReserveTarget(null);
    setSubmitResult(null);
    setForm(emptyForm);
  };

  const today = new Date().toISOString().split('T')[0];

  const validateForm = () => {
    if (!form.startDate) return 'Start date is required.';
    if (!form.returnDate) return 'Return date is required.';
    if (form.returnDate < form.startDate) return 'Return date must be after start date.';
    if (!form.purpose.trim()) return 'Purpose is required.';
    if (form.quantity < 1) return 'Quantity must be at least 1.';
    if (reserveTarget && form.quantity > reserveTarget.availableQuantity) {
      return `Only ${reserveTarget.availableQuantity} unit(s) available.`;
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!userProfile || !reserveTarget) return;
    const err = validateForm();
    if (err) { setSubmitResult({ ok: false, msg: err }); return; }

    setSubmitting(true);
    setSubmitResult(null);
    try {
      await reservationService.create({
        equipmentId: reserveTarget.id,
        equipmentName: reserveTarget.name,
        equipmentCategory: reserveTarget.category,
        equipmentLocation: reserveTarget.location,
        userId: userProfile.uid,
        userName: userProfile.name,
        userRole: userProfile.role === 'faculty' ? 'faculty' : 'student',
        quantity: form.quantity,
        reservationDate: form.startDate,
        returnDate: form.returnDate,
        purpose: form.purpose,
      });

      // Notify the specific faculty who owns this equipment (not all faculty)
      if (reserveTarget.ownerType === 'faculty' && reserveTarget.ownerId) {
        await addDoc(collection(db, 'notifications'), {
          userId: reserveTarget.ownerId,
          title: 'New Equipment Request',
          message: `${userProfile.name} has requested to borrow "${reserveTarget.name}" (${form.quantity} unit${form.quantity > 1 ? 's' : ''}) from ${form.startDate} to ${form.returnDate}.`,
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      setSubmitResult({ ok: true, msg: 'Reservation submitted! You will be notified once approved.' });
      setForm(emptyForm);
    } catch (e: any) {
      setSubmitResult({ ok: false, msg: e.message ?? 'Failed to submit reservation.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[--foreground] mb-2">Browse Equipment</h1>
        <p className="text-[--muted-foreground]">Find and reserve equipment for your academic needs</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <SearchBar placeholder="Search by equipment name, category, or location..." onSearch={setSearchQuery} />
        </div>
        <Button variant="outline"><Filter className="w-4 h-4" />Filters</Button>
      </div>

      {/* Category pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-[--primary-blue] text-white'
                : 'bg-white text-[--foreground] hover:bg-[--secondary] border border-[--border]'
            }`}>
            {cat.name}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-[--secondary] text-[--muted-foreground]'
            }`}>{cat.count}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-[--muted-foreground]">{filtered.length} item{filtered.length !== 1 ? 's' : ''} found</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[--muted-foreground]">Sort by:</span>
          <select className="px-3 py-1.5 bg-white border border-[--border] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--primary-blue]">
            <option>Most Available</option>
            <option>Name (A-Z)</option>
            <option>Category</option>
          </select>
        </div>
      </div>

      {/* Equipment grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-[--muted-foreground]">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>{searchQuery ? 'No equipment matches your search.' : 'Equipment will appear here once added.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((item) => {
            const isOwnedByUser = userProfile?.role === 'faculty' && item.ownerId === userProfile.uid;
            return (
              <EquipmentCard
                key={item.id}
                name={item.name}
                category={item.category}
                image={item.imageUrl ? optimizeImageUrl(item.imageUrl, 400, 80) : undefined}
                available={item.availableQuantity}
                total={item.quantity}
                location={item.location}
                isOwnedByUser={isOwnedByUser}
                onReserve={() => openReserve(item)}
                onView={() => onViewDetails(item.id)}
              />
            );
          })}
        </div>
      )}

      {/* ── Quick Reserve Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={!!reserveTarget}
        onClose={closeReserve}
        title="Reserve Equipment"
        size="md"
        footer={
          submitResult?.ok ? (
            <Button variant="primary" onClick={closeReserve}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={closeReserve}>Cancel</Button>
              <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : 'Submit Reservation'}
              </Button>
            </>
          )
        }
      >
        {reserveTarget && (
          <div className="space-y-4">
            {/* Equipment preview */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-[--border]">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                {reserveTarget.imageUrl ? (
                  <img src={optimizeImageUrl(reserveTarget.imageUrl, 112, 80)} alt={reserveTarget.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[--foreground] truncate">{reserveTarget.name}</p>
                <p className="text-sm text-[--muted-foreground]">{reserveTarget.category}</p>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant={reserveTarget.availableQuantity > 0 ? 'success' : 'danger'}>
                    {reserveTarget.availableQuantity} available
                  </Badge>
                  {reserveTarget.location && (
                    <span className="text-xs text-[--muted-foreground] flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{reserveTarget.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Result message */}
            {submitResult && (
              <div className={`flex items-start gap-2.5 p-3.5 rounded-lg border text-sm ${
                submitResult.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {submitResult.ok
                  ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                {submitResult.msg}
              </div>
            )}

            {!submitResult?.ok && (
              <>
                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[--foreground] mb-1.5">Start Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      min={today}
                      className="w-full px-3 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
                      value={form.startDate}
                      onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[--foreground] mb-1.5">Return Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      min={form.startDate || today}
                      className="w-full px-3 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
                      value={form.returnDate}
                      onChange={(e) => setForm((f) => ({ ...f, returnDate: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-[--foreground] mb-1.5">
                    Quantity <span className="text-[--muted-foreground] font-normal">(max {reserveTarget.availableQuantity})</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={reserveTarget.availableQuantity}
                    className="w-full px-3 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                  />
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-sm font-medium text-[--foreground] mb-1.5">Purpose of Use <span className="text-red-500">*</span></label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] placeholder:text-[--muted-foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] resize-none transition-all"
                    placeholder="Describe how you will use this equipment..."
                    value={form.purpose}
                    onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                  />
                </div>

                {/* Notice */}
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                  <Clock className="w-4 h-4 shrink-0" />
                  Requests are reviewed and approved within 24 hours.
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
