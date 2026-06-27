import { useState, useEffect } from 'react';
import { SearchBar } from '../../components/ui/SearchBar';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Plus, Edit, Trash2, Loader2, AlertCircle, Package, Building2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { equipmentService, Equipment, EquipmentInput } from '../../../services/equipmentService';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { optimizeImageUrl } from '../../../lib/cloudinary';

const CATEGORIES = ['Laptops', 'Cameras', 'Tablets', 'Audio Equipment', 'Laboratory', 'Sports', 'Medical', 'Other'];
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor'] as const;
const DEPARTMENTS = [
  { value: 'CECE',   label: 'CECE – College of Engineering & Computer Education' },
  { value: 'Ctelan', label: 'Ctelan – College of Teacher Education, Liberal Arts & Nursing' },
  { value: 'CBA',    label: 'CBA – College of Business & Accountancy' },
  { value: 'General', label: 'General / Shared' },
];

const emptyForm: EquipmentInput = {
  name: '', description: '', category: '', department: '',
  quantity: 1, availableQuantity: 1,
  condition: 'Good', imageUrl: '', location: '', ownerId: '', ownerType: 'admin',
};

const conditionVariant = (c: string) =>
  c === 'Excellent' ? 'success' : c === 'Good' ? 'primary' : c === 'Fair' ? 'warning' : 'danger';

export function EquipmentManagement() {
  const { userProfile } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filtered, setFiltered] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [form, setForm] = useState<EquipmentInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    equipmentService.getAll()
      .then((items) => { if (!cancelled) { setEquipment(items); setFiltered(items); } })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const unsub = equipmentService.subscribe(setEquipment);
    return unsub;
  }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFiltered(
      equipment.filter((e) => {
        const searchOk = !q || e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || e.location.toLowerCase().includes(q);
        const deptOk = deptFilter === 'all' || (e.department ?? '') === deptFilter;
        return searchOk && deptOk;
      })
    );
  }, [searchQuery, deptFilter, equipment]);

  const setField = (field: keyof EquipmentInput, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const openAdd = () => {
    setForm({ ...emptyForm, ownerId: userProfile?.uid ?? '', ownerType: 'admin' });
    setError(null);
    setShowAddModal(true);
  };

  const openEdit = (item: Equipment) => {
    setEditingItem(item);
    setForm({
      name: item.name, description: item.description, category: item.category,
      department: item.department ?? '',
      quantity: item.quantity, availableQuantity: item.availableQuantity,
      condition: item.condition, imageUrl: item.imageUrl ?? '',
      location: item.location, ownerId: item.ownerId, ownerType: item.ownerType,
    });
    setError(null);
    setShowEditModal(true);
  };

  const validate = () => {
    if (!form.name.trim()) return 'Equipment name is required.';
    if (!form.category) return 'Category is required.';
    if (!form.location.trim()) return 'Location is required.';
    if (form.quantity < 1) return 'Quantity must be at least 1.';
    if (form.availableQuantity > form.quantity) return 'Available cannot exceed total quantity.';
    return null;
  };

  const handleAdd = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true); setError(null);
    try {
      await equipmentService.create(form);
      setShowAddModal(false); setForm(emptyForm);
    } catch (e: any) { setError(e.message ?? 'Failed to add equipment.'); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!editingItem) return;
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true); setError(null);
    try {
      await equipmentService.update(editingItem.id, form);
      setShowEditModal(false);
    } catch (e: any) { setError(e.message ?? 'Failed to update equipment.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this equipment? This cannot be undone.')) return;
    setDeletingId(id);
    try { await equipmentService.delete(id); }
    finally { setDeletingId(null); }
  };

  const renderForm = () => (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[--foreground] mb-1.5">Equipment Name <span className="text-red-500">*</span></label>
          <input className="w-full px-4 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] placeholder:text-[--muted-foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
            placeholder="e.g. MacBook Pro 16 inch" value={form.name} onChange={(e) => setField('name', e.target.value)} />
        </div>

        {/* Department */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[--foreground] mb-1.5">
            <Building2 className="inline w-3.5 h-3.5 mr-1 text-[--muted-foreground]" />
            Department / College
          </label>
          <select className="w-full px-3 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
            value={form.department ?? ''} onChange={(e) => setField('department', e.target.value)}>
            <option value="">Select Department (optional)</option>
            {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-[--foreground] mb-1.5">Category <span className="text-red-500">*</span></label>
          <select className="w-full px-3 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
            value={form.category} onChange={(e) => setField('category', e.target.value)}>
            <option value="">Select Category</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-[--foreground] mb-1.5">Condition</label>
          <select className="w-full px-3 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
            value={form.condition} onChange={(e) => setField('condition', e.target.value)}>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-[--foreground] mb-1.5">Total Quantity <span className="text-red-500">*</span></label>
          <input type="number" min={1} className="w-full px-4 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
            value={form.quantity} onChange={(e) => setField('quantity', Number(e.target.value))} />
        </div>

        {/* Available */}
        <div>
          <label className="block text-sm font-medium text-[--foreground] mb-1.5">Available Quantity</label>
          <input type="number" min={0} max={form.quantity} className="w-full px-4 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
            value={form.availableQuantity} onChange={(e) => setField('availableQuantity', Number(e.target.value))} />
        </div>

        {/* Location */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[--foreground] mb-1.5">Location <span className="text-red-500">*</span></label>
          <input className="w-full px-4 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] placeholder:text-[--muted-foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
            placeholder="e.g. Room 204, Building A" value={form.location} onChange={(e) => setField('location', e.target.value)} />
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-[--foreground] mb-1.5">Description</label>
          <textarea rows={3} className="w-full px-4 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] placeholder:text-[--muted-foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all resize-none"
            placeholder="Enter equipment description..." value={form.description} onChange={(e) => setField('description', e.target.value)} />
        </div>

        {/* Image */}
        <div className="sm:col-span-2">
          <ImageUpload value={form.imageUrl} onChange={(url) => setField('imageUrl', url)}
            onUploadingChange={setImageUploading} label="Equipment Image (JPG, PNG, WEBP · max 5MB)" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[--foreground] mb-2">Equipment Management</h1>
          <p className="text-[--muted-foreground]">Manage all equipment across departments</p>
        </div>
        <Button variant="primary" onClick={openAdd}><Plus className="w-4 h-4" />Add Equipment</Button>
      </div>

      {/* Search + department filter + add */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1">
          <SearchBar placeholder="Search equipment by name, category, or location..." onSearch={setSearchQuery} />
        </div>
        <select
          className="px-3 py-2.5 bg-white border border-[--border] rounded-xl text-sm text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
          value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="all">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.value}</option>)}
        </select>
        <Button variant="primary" onClick={openAdd}><Plus className="w-4 h-4" />Add Equipment</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: equipment.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Available Units', value: equipment.reduce((s, e) => s + e.availableQuantity, 0), color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Borrowed', value: equipment.reduce((s, e) => s + (e.quantity - e.availableQuantity), 0), color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Departments', value: new Set(equipment.map((e) => e.department).filter(Boolean)).size, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-4`}>
            <p className={`text-2xl font-bold ${color}`}>{loading ? '—' : value}</p>
            <p className="text-sm text-[--muted-foreground] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[--border] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-16"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipment</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Borrowed</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="text-center py-12">
                      <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <p className="text-[--muted-foreground]">
                        {searchQuery || deptFilter !== 'all' ? 'No equipment matches your filters.' : 'No equipment added yet.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                        {item.imageUrl
                          ? <img src={optimizeImageUrl(item.imageUrl, 96, 80)} alt={item.name} className="w-full h-full object-cover" />
                          : <Package className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div>
                        <p className="font-medium text-[--foreground]">{item.name}</p>
                        <p className="text-xs text-[--muted-foreground] truncate max-w-[160px]">{item.location}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.department
                      ? <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg"><Building2 className="w-3 h-3" />{item.department}</span>
                      : <span className="text-[--muted-foreground] text-xs">—</span>}
                  </TableCell>
                  <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                  <TableCell className="font-medium">{item.quantity}</TableCell>
                  <TableCell><span className={`font-medium ${item.availableQuantity > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{item.availableQuantity}</span></TableCell>
                  <TableCell><span className={`font-medium ${(item.quantity - item.availableQuantity) > 0 ? 'text-amber-600' : 'text-[--muted-foreground]'}`}>{item.quantity - item.availableQuantity}</span></TableCell>
                  <TableCell><Badge variant={conditionVariant(item.condition)}>{item.condition}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50" title="Delete">
                        {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setError(null); }} title="Add New Equipment" size="lg"
        footer={<>
          <Button variant="outline" onClick={() => { setShowAddModal(false); setError(null); }}>Cancel</Button>
          <Button variant="primary" onClick={handleAdd} disabled={saving || imageUploading}>
            {imageUploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</> : saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Add Equipment'}
          </Button>
        </>}>
        {renderForm()}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setError(null); }} title={`Edit — ${editingItem?.name ?? ''}`} size="lg"
        footer={<>
          <Button variant="outline" onClick={() => { setShowEditModal(false); setError(null); }}>Cancel</Button>
          <Button variant="primary" onClick={handleEdit} disabled={saving || imageUploading}>
            {imageUploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</> : saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Save Changes'}
          </Button>
        </>}>
        {renderForm()}
      </Modal>
    </div>
  );
}
