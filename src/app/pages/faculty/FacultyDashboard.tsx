import { useState, useEffect, useMemo } from 'react';
import {
  Package, Users, TrendingUp, Clock, CheckCircle,
  Loader2, Plus, AlertCircle, Edit2, Trash2, Building2,
  XCircle, Bell,
} from 'lucide-react';
import { StatsCard } from '../../components/ui/StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { optimizeImageUrl } from '../../../lib/cloudinary';
import { useAuth } from '../../../contexts/AuthContext';
import { equipmentService, Equipment, EquipmentInput } from '../../../services/equipmentService';
import { reservationService, Reservation } from '../../../services/reservationService';

const CATEGORIES = ['Laptops', 'Cameras', 'Tablets', 'Audio Equipment', 'Laboratory', 'Sports', 'Medical', 'Other'];
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor'] as const;

const DEPT_LABELS: Record<string, string> = {
  CECE: 'CECE',
  Ctelan: 'Ctelan',
  CBA: 'CBA',
  General: 'General',
};

const conditionVariant = (c: string) =>
  c === 'Excellent' ? 'success' : c === 'Good' ? 'primary' : c === 'Fair' ? 'warning' : 'danger';

export function FacultyDashboard() {
  const { userProfile } = useAuth();

  // ── Equipment state ───────────────────────────────────────────────────
  const [myEquipment, setMyEquipment] = useState<Equipment[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Add/Edit Equipment modal ──────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [form, setForm] = useState<EquipmentInput>({
    name: '', description: '', category: '', department: '',
    quantity: 1, availableQuantity: 1,
    condition: 'Good', imageUrl: '', location: '',
    ownerId: '', ownerType: 'faculty',
  });
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Derived: only requests for MY equipment ───────────────────────────
  const myEquipmentIds = useMemo(() => new Set(myEquipment.map((e) => e.id)), [myEquipment]);

  const myStudentRequests = useMemo(() =>
    allReservations.filter((r) => r.userRole === 'student' && myEquipmentIds.has(r.equipmentId)),
    [allReservations, myEquipmentIds]
  );

  const pendingRequests = useMemo(() =>
    myStudentRequests.filter((r) => r.status === 'pending'),
    [myStudentRequests]
  );

  const borrowedRequests = useMemo(() =>
    myStudentRequests.filter((r) => r.status === 'borrowed'),
    [myStudentRequests]
  );

  // ── Load data ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userProfile) return;
    let cancelled = false;

    const load = async () => {
      try {
        const [equipment, reservations] = await Promise.all([
          equipmentService.getAll(),
          reservationService.getAll(),
        ]);
        if (!cancelled) {
          setMyEquipment(equipment.filter((e) => e.ownerId === userProfile.uid));
          setAllReservations(reservations);
        }
      } catch (e) {
        console.error('Faculty dashboard load error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [userProfile?.uid]);

  // ── Realtime updates ──────────────────────────────────────────────────
  useEffect(() => {
    if (!userProfile) return;
    const u1 = equipmentService.subscribe((all) => {
      setMyEquipment(all.filter((e) => e.ownerId === userProfile.uid));
    });
    const u2 = reservationService.subscribe(setAllReservations);
    return () => { u1(); u2(); };
  }, [userProfile?.uid]);

  // ── Approve / Reject ──────────────────────────────────────────────────
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

  const handleReturn = async (r: Reservation) => {
    if (!confirm('Mark this equipment as returned?')) return;
    setActionId(r.id);
    try {
      await reservationService.markReturned(r.id, r);
    } catch (e) {
      console.error('Return failed', e);
      alert('Unable to mark this equipment returned. Please try again.');
    } finally {
      setActionId(null);
    }
  };

  // ── Add / Edit Equipment ──────────────────────────────────────────────
  const openAdd = () => {
    setEditingItem(null);
    setForm({
      name: '', description: '', category: '',
      department: userProfile?.department ?? '',
      quantity: 1, availableQuantity: 1,
      condition: 'Good', imageUrl: '', location: '',
      ownerId: userProfile?.uid ?? '', ownerType: 'faculty',
    });
    setFormError(null);
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
    setFormError(null);
    setShowModal(true);
  };

  const setField = (field: keyof EquipmentInput, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    if (!form.name.trim()) return 'Equipment name is required.';
    if (!form.category) return 'Category is required.';
    if (!form.location.trim()) return 'Location is required.';
    if (form.availableQuantity > form.quantity) return 'Available cannot exceed total quantity.';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setFormError(err); return; }
    setSaving(true); setFormError(null);
    try {
      if (editingItem) await equipmentService.update(editingItem.id, form);
      else await equipmentService.create(form);
      setShowModal(false);
    } catch (e: any) {
      setFormError(e.message ?? 'Failed to save equipment.');
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

  const totalAvailable = myEquipment.reduce((s, e) => s + e.availableQuantity, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[--foreground] mb-1">Faculty Dashboard</h1>
          <div className="flex items-center gap-2 text-[--muted-foreground]">
            <Building2 className="w-4 h-4" />
            <span className="text-sm">{userProfile?.department ? DEPT_LABELS[userProfile.department] ?? userProfile.department : 'No department assigned'}</span>
          </div>
        </div>
        <Button variant="primary" onClick={openAdd}>
          <Plus className="w-4 h-4" />Add Equipment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="My Equipment" value={String(myEquipment.length)} icon={Package} color="blue" trend={{ value: 'Items managed', isPositive: true }} />
        <StatsCard title="Available Units" value={String(totalAvailable)} icon={CheckCircle} color="green" trend={{ value: 'Ready to use', isPositive: true }} />
        <StatsCard title="Pending Requests" value={String(pendingRequests.length)} icon={Clock} color="orange" trend={{ value: 'Need review', isPositive: false }} />
        <StatsCard title="Borrowed" value={String(borrowedRequests.length)} icon={Clock} color="orange" trend={{ value: 'In use', isPositive: false }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* My Equipment */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Equipment</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="primary">{myEquipment.length} items</Badge>
                  <Button variant="outline" size="sm" onClick={openAdd}><Plus className="w-3.5 h-3.5" />Add</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {myEquipment.length === 0 ? (
                <div className="text-center py-10">
                  <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-[--muted-foreground] text-sm mb-3">No equipment added yet.</p>
                  <Button variant="primary" size="sm" onClick={openAdd}><Plus className="w-4 h-4" />Add Equipment</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myEquipment.slice(0, 5).map((eq) => (
                    <div key={eq.id} className="flex items-center gap-3 p-3 bg-[--background] rounded-xl hover:bg-[--secondary] transition-colors">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                        {eq.imageUrl
                          ? <img src={optimizeImageUrl(eq.imageUrl, 96, 80)} alt={eq.name} className="w-full h-full object-cover" />
                          : <Package className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[--foreground] truncate">{eq.name}</p>
                        <p className="text-xs text-[--muted-foreground]">{eq.category} • {eq.location}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[--foreground]">{eq.availableQuantity}<span className="text-[--muted-foreground] font-normal">/{eq.quantity}</span></p>
                          <p className="text-xs text-[--muted-foreground]">available</p>
                        </div>
                        <Badge variant={conditionVariant(eq.condition)}>{eq.condition}</Badge>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(eq)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(eq.id)} disabled={deletingId === eq.id} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50">
                            {deletingId === eq.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {myEquipment.length > 5 && (
                    <p className="text-center text-sm text-[--muted-foreground] pt-1">+{myEquipment.length - 5} more — view in Department tab</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Student Requests — filtered to MY equipment only */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>Student Equipment Requests</CardTitle>
                  <Bell className="w-4 h-4 text-[--muted-foreground]" />
                </div>
                <Badge variant="warning">{pendingRequests.length} Pending</Badge>
              </div>
              <p className="text-xs text-[--muted-foreground] mt-0.5">Only showing requests for your equipment</p>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                  <p className="text-sm text-[--muted-foreground]">No pending requests for your equipment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((r) => (
                    <div key={r.id} className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100/60 transition-colors">
                      <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="font-semibold text-[--foreground] text-sm">{r.userName}</p>
                          <span className="text-xs text-[--muted-foreground] bg-white px-2 py-0.5 rounded-full border">Student</span>
                        </div>
                        <p className="text-sm text-[--muted-foreground]">
                          Requesting <span className="font-medium text-[--foreground]">{r.equipmentName}</span> × {r.quantity}
                        </p>
                        <p className="text-xs text-[--muted-foreground] mt-0.5">{r.purpose} • {r.reservationDate}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleApprove(r)}
                          disabled={actionId === r.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          {actionId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(r)}
                          disabled={actionId === r.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white text-red-600 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>Borrowed Equipment</CardTitle>
                  <Clock className="w-4 h-4 text-[--muted-foreground]" />
                </div>
                <Badge variant="success">{borrowedRequests.length}</Badge>
              </div>
              <p className="text-xs text-[--muted-foreground] mt-0.5">Items currently borrowed from your equipment</p>
            </CardHeader>
            <CardContent>
              {borrowedRequests.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <p className="text-sm text-[--muted-foreground]">No currently borrowed items.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {borrowedRequests.map((r) => (
                    <div key={r.id} className="flex items-start gap-3 p-4 bg-[--background] border border-[--border] rounded-xl hover:bg-[--secondary] transition-colors">
                      <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="font-semibold text-[--foreground] text-sm">{r.userName}</p>
                          <span className="text-xs text-[--muted-foreground] bg-white px-2 py-0.5 rounded-full border">Borrowed</span>
                        </div>
                        <p className="text-sm text-[--muted-foreground]">{r.equipmentName} × {r.quantity}</p>
                        <p className="text-xs text-[--muted-foreground] mt-0.5">Due {r.returnDate ?? 'TBD'} • {r.purpose}</p>
                      </div>
                      <Button variant="success" size="sm" disabled={actionId === r.id} onClick={() => handleReturn(r)}>
                        {actionId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Mark Returned'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="primary" className="w-full justify-start" onClick={openAdd}><Plus className="w-4 h-4" />Add Equipment</Button>
                <Button variant="outline" className="w-full justify-start"><Users className="w-4 h-4" />View All Requests</Button>
                <Button variant="outline" className="w-full justify-start"><TrendingUp className="w-4 h-4" />View History</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Department Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { icon: Package,      color: 'text-blue-600',   label: 'Total Items',   value: myEquipment.reduce((s, e) => s + e.quantity, 0) },
                  { icon: CheckCircle,  color: 'text-emerald-600', label: 'Available',     value: totalAvailable },
                  { icon: Clock,        color: 'text-amber-600',  label: 'Borrowed',      value: myEquipment.reduce((s, e) => s + (e.quantity - e.availableQuantity), 0) },
                  { icon: Users,        color: 'text-purple-600', label: 'My Requests',   value: myStudentRequests.length },
                ].map(({ icon: Icon, color, label, value }) => (
                  <div key={label} className="flex items-center justify-between p-3 bg-[--background] rounded-xl">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-sm text-[--foreground]">{label}</span>
                    </div>
                    <span className={`text-lg font-bold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add / Edit Equipment Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setFormError(null); }}
        title={editingItem ? `Edit — ${editingItem.name}` : 'Add Equipment to My Department'}
        size="lg"
        footer={<>
          <Button variant="outline" onClick={() => { setShowModal(false); setFormError(null); }}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || imageUploading}>
            {imageUploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading image…</>
              : saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
              : editingItem ? 'Save Changes' : 'Add Equipment'}
          </Button>
        </>}
      >
        <div className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{formError}
            </div>
          )}

          {/* Department badge (read-only info) */}
          {form.department && (
            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 text-sm">
              <Building2 className="w-4 h-4 shrink-0" />
              <span>This equipment will be assigned to <strong>{form.department}</strong></span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[--foreground] mb-1.5">Equipment Name <span className="text-red-500">*</span></label>
              <input className="w-full px-4 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] placeholder:text-[--muted-foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
                placeholder="e.g. Dell XPS 15" value={form.name} onChange={(e) => setField('name', e.target.value)} />
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
                placeholder="e.g. Room 201, CECE Building" value={form.location} onChange={(e) => setField('location', e.target.value)} />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[--foreground] mb-1.5">Description</label>
              <textarea rows={3} className="w-full px-4 py-2.5 bg-white border border-[--border] rounded-xl text-[--foreground] placeholder:text-[--muted-foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all resize-none"
                placeholder="Optional description…" value={form.description} onChange={(e) => setField('description', e.target.value)} />
            </div>

            {/* Image */}
            <div className="sm:col-span-2">
              <ImageUpload value={form.imageUrl} onChange={(url) => setField('imageUrl', url)}
                onUploadingChange={setImageUploading} label="Equipment Image (JPG, PNG, WEBP · max 5MB)" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
