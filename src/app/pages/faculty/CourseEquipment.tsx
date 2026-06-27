import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Plus, Package, Trash2, Edit2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { equipmentService, Equipment, EquipmentInput } from '../../../services/equipmentService';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { optimizeImageUrl } from '../../../lib/cloudinary';

const CATEGORIES = ['Laptops', 'Cameras', 'Tablets', 'Audio Equipment', 'Laboratory', 'Sports', 'Medical', 'Other'];
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor'] as const;

const emptyForm: EquipmentInput = {
  name: '', description: '', category: '', quantity: 1, availableQuantity: 1,
  condition: 'Good', imageUrl: '', location: '', ownerId: '', ownerType: 'faculty',
};

export function CourseEquipment() {
  const { userProfile } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [form, setForm] = useState<EquipmentInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Initial load ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!userProfile) return;
    let cancelled = false;
    equipmentService.getAll()
      .then((all) => {
        if (!cancelled) setEquipment(all.filter((e) => e.ownerId === userProfile.uid));
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userProfile?.uid]);

  // ── Realtime updates ──────────────────────────────────────────────────
  useEffect(() => {
    if (!userProfile) return;
    const unsub = equipmentService.subscribe((all) => {
      setEquipment(all.filter((e) => e.ownerId === userProfile.uid));
    });
    return unsub;
  }, [userProfile?.uid]);

  const setField = (field: keyof EquipmentInput, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const openAdd = () => {
    setEditingItem(null);
    setForm({
      ...emptyForm,
      ownerId: userProfile?.uid ?? '',
      ownerType: 'faculty',
      department: userProfile?.department ?? '',
    });
    setError(null);
    setShowModal(true);
  };

  const openEdit = (item: Equipment) => {
    setEditingItem(item);
    setForm({
      name: item.name, description: item.description, category: item.category,
      department: item.department ?? userProfile?.department ?? '',
      quantity: item.quantity, availableQuantity: item.availableQuantity,
      condition: item.condition, imageUrl: item.imageUrl ?? '',
      location: item.location, ownerId: item.ownerId, ownerType: item.ownerType,
    });
    setError(null);
    setShowModal(true);
  };

  const validate = () => {
    if (!form.name.trim()) return 'Equipment name is required.';
    if (!form.category) return 'Category is required.';
    if (!form.location.trim()) return 'Location is required.';
    if (form.availableQuantity > form.quantity) return 'Available cannot exceed total quantity.';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    setError(null);
    try {
      if (editingItem) await equipmentService.update(editingItem.id, form);
      else await equipmentService.create(form);
      setShowModal(false);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this equipment?')) return;
    setDeletingId(id);
    try { await equipmentService.delete(id); }
    finally { setDeletingId(null); }
  };

  const conditionVariant = (c: string) =>
    c === 'Excellent' ? 'success' : c === 'Good' ? 'primary' : c === 'Fair' ? 'warning' : 'danger';

  // Inline form (NOT a nested component — prevents focus loss on keystroke)
  const renderForm = () => (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[--foreground] mb-1.5">Equipment Name <span className="text-red-500">*</span></label>
          <input
            className="w-full px-4 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] placeholder:text-[--muted-foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
            placeholder="e.g. Dell XPS 15"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[--foreground] mb-1.5">Category <span className="text-red-500">*</span></label>
          <select
            className="w-full px-3 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
            value={form.category}
            onChange={(e) => setField('category', e.target.value)}
          >
            <option value="">Select Category</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[--foreground] mb-1.5">Condition</label>
          <select
            className="w-full px-3 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
            value={form.condition}
            onChange={(e) => setField('condition', e.target.value)}
          >
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[--foreground] mb-1.5">Total Quantity <span className="text-red-500">*</span></label>
          <input
            type="number" min={1}
            className="w-full px-4 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
            value={form.quantity}
            onChange={(e) => setField('quantity', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[--foreground] mb-1.5">Available</label>
          <input
            type="number" min={0} max={form.quantity}
            className="w-full px-4 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
            value={form.availableQuantity}
            onChange={(e) => setField('availableQuantity', Number(e.target.value))}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[--foreground] mb-1.5">Location <span className="text-red-500">*</span></label>
          <input
            className="w-full px-4 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] placeholder:text-[--muted-foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
            placeholder="e.g. Room 201"
            value={form.location}
            onChange={(e) => setField('location', e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[--foreground] mb-1.5">Description</label>
          <textarea
            rows={3}
            className="w-full px-4 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] placeholder:text-[--muted-foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all resize-none"
            placeholder="Optional description…"
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <ImageUpload
            value={form.imageUrl}
            onChange={(url) => setField('imageUrl', url)}
            onUploadingChange={setImageUploading}
            label="Equipment Image (JPG, PNG, WEBP · max 5MB)"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[--foreground] mb-2">Department</h1>
          <p className="text-[--muted-foreground]">Manage equipment allocated to your department</p>
        </div>
        <Button variant="primary" onClick={openAdd}><Plus className="w-4 h-4" />Add Equipment</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Items', value: equipment.reduce((s, e) => s + e.quantity, 0), color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Available',   value: equipment.reduce((s, e) => s + e.availableQuantity, 0), color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Borrowed',    value: equipment.reduce((s, e) => s + (e.quantity - e.availableQuantity), 0), color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-4`}>
            <p className={`text-2xl font-bold ${color}`}>{loading ? '—' : value}</p>
            <p className="text-sm text-[--muted-foreground]">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : equipment.length === 0 ? (
        <div className="bg-white rounded-xl border border-[--border] p-16 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-[--muted-foreground] opacity-40" />
          <p className="text-[--muted-foreground] mb-4">No department equipment yet.</p>
          <Button variant="primary" onClick={openAdd}><Plus className="w-4 h-4" />Add Your First Equipment</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {equipment.map((eq) => (
            <Card key={eq.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {eq.imageUrl ? (
                      <img src={optimizeImageUrl(eq.imageUrl, 80, 80)} alt={eq.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <CardTitle className="text-lg truncate">{eq.name}</CardTitle>
                      <p className="text-sm text-[--muted-foreground] mt-0.5">{eq.category} • {eq.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2 shrink-0">
                    <Badge variant={eq.condition === 'Excellent' ? 'success' : eq.condition === 'Good' ? 'primary' : 'warning'}>{eq.condition}</Badge>
                    <button onClick={() => openEdit(eq)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(eq.id)} disabled={deletingId === eq.id} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50">
                      {deletingId === eq.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {eq.description && <p className="text-sm text-[--muted-foreground] mb-4 line-clamp-2">{eq.description}</p>}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-[--background] rounded-lg p-3">
                    <p className="text-2xl font-bold text-[--foreground]">{eq.quantity}</p>
                    <p className="text-xs text-[--muted-foreground]">Total</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-emerald-600">{eq.availableQuantity}</p>
                    <p className="text-xs text-[--muted-foreground]">Available</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-amber-600">{eq.quantity - eq.availableQuantity}</p>
                    <p className="text-xs text-[--muted-foreground]">Borrowed</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-[--muted-foreground] mb-1">
                    <span>Availability</span>
                    <span>{eq.quantity > 0 ? Math.round((eq.availableQuantity / eq.quantity) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${eq.quantity > 0 ? (eq.availableQuantity / eq.quantity) * 100 : 0}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setError(null); }}
        title={editingItem ? `Edit — ${editingItem.name}` : 'Add Department Equipment'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowModal(false); setError(null); }}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving || imageUploading}>
              {imageUploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading image…</> : saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : editingItem ? 'Save Changes' : 'Add Equipment'}
            </Button>
          </>
        }
      >
        {renderForm()}
      </Modal>
    </div>
  );
}
