import { useState, useEffect } from "react";
import {
  equipmentService,
  reservationService,
  type Equipment,
  type Reservation,
} from "../../../lib/firestoreService";
import { createAdminUser } from "../../../lib/authService";
import {
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Database,
  Package,
  CalendarCheck,
  AlertCircle,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  UserCog,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
    returned: "bg-blue-100 text-blue-700 border-blue-200",
    Excellent: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Good: "bg-blue-100 text-blue-700 border-blue-200",
    Fair: "bg-amber-100 text-amber-700 border-amber-200",
    Poor: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[status] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}
    >
      {status}
    </span>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"} mr-2`}
    />
  );
}

// ─── Equipment Section ────────────────────────────────────────────────────────

const emptyEquipment: Omit<Equipment, "id" | "createdAt" | "updatedAt"> = {
  name: "",
  category: "Audio/Visual",
  description: "",
  quantity: 1,
  available: 1,
  condition: "Good",
  location: "",
};

function EquipmentSection() {
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyEquipment);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await equipmentService.getAll());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleEdit = (item: Equipment) => {
    setEditingId(item.id!);
    setForm({
      name: item.name,
      category: item.category,
      description: item.description,
      quantity: item.quantity,
      available: item.available,
      condition: item.condition,
      location: item.location,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.location.trim()) {
      notify("Name and location are required.", false);
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await equipmentService.update(editingId, form);
        notify("Equipment updated successfully.");
      } else {
        await equipmentService.create(form);
        notify("Equipment added to Firestore.");
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyEquipment);
      await load();
    } catch (e: any) {
      notify(e.message, false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await equipmentService.delete(id);
      notify("Equipment deleted.");
      await load();
    } catch (e: any) {
      notify(e.message, false);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[--border] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-[--border] bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-[--foreground]">Equipment Collection</h3>
            <p className="text-xs text-[--muted-foreground]">
              {items.length} document{items.length !== 1 ? "s" : ""} in Firestore
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 rounded-lg hover:bg-gray-100 text-[--muted-foreground] hover:text-[--foreground] transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setForm(emptyEquipment);
              setShowForm((v) => !v);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Equipment
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`mx-5 mt-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${
            toast.ok
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="p-5 bg-gray-50 border-b border-[--border]">
          <h4 className="text-sm font-semibold text-[--foreground] mb-4">
            {editingId ? "Edit Equipment" : "New Equipment"}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[--muted-foreground] mb-1">Name *</label>
              <input
                className="w-full border border-[--border] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="e.g. DSLR Camera Canon EOS"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[--muted-foreground] mb-1">Category</label>
              <select
                className="w-full border border-[--border] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {["Audio/Visual", "Computing", "Laboratory", "Sports", "Medical", "Other"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[--muted-foreground] mb-1">Description</label>
              <input
                className="w-full border border-[--border] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Brief description of the equipment"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[--muted-foreground] mb-1">Total Quantity</label>
              <input
                type="number"
                min={1}
                className="w-full border border-[--border] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[--muted-foreground] mb-1">Available</label>
              <input
                type="number"
                min={0}
                className="w-full border border-[--border] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={form.available}
                onChange={(e) => setForm({ ...form, available: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[--muted-foreground] mb-1">Condition</label>
              <select
                className="w-full border border-[--border] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value as Equipment["condition"] })}
              >
                {["Excellent", "Good", "Fair", "Poor"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[--muted-foreground] mb-1">Location *</label>
              <input
                className="w-full border border-[--border] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="e.g. Room 201, Building A"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : editingId ? "Update" : "Create"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(emptyEquipment);
              }}
              className="flex items-center gap-1.5 px-4 py-2 border border-[--border] rounded-lg text-sm text-[--muted-foreground] hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        {error ? (
          <div className="flex items-center gap-2 p-6 text-red-600 text-sm">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center p-12 text-[--muted-foreground]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Reading from Firestore…
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-[--muted-foreground] text-sm">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            No equipment yet. Add your first item above.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[--border] bg-gray-50 text-left">
                <th className="px-5 py-3 font-medium text-[--muted-foreground]">Name</th>
                <th className="px-5 py-3 font-medium text-[--muted-foreground]">Category</th>
                <th className="px-5 py-3 font-medium text-[--muted-foreground]">Stock</th>
                <th className="px-5 py-3 font-medium text-[--muted-foreground]">Condition</th>
                <th className="px-5 py-3 font-medium text-[--muted-foreground]">Location</th>
                <th className="px-5 py-3 font-medium text-[--muted-foreground] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`border-b border-[--border] last:border-0 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "" : "bg-gray-50/30"}`}
                >
                  <td className="px-5 py-3.5 font-medium text-[--foreground]">{item.name}</td>
                  <td className="px-5 py-3.5 text-[--muted-foreground]">{item.category}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-[--foreground] font-medium">{item.available}</span>
                    <span className="text-[--muted-foreground]">/{item.quantity}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge status={item.condition} />
                  </td>
                  <td className="px-5 py-3.5 text-[--muted-foreground]">{item.location}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id!)}
                        disabled={deletingId === item.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Reservations Section ─────────────────────────────────────────────────────

const emptyReservation: Omit<Reservation, "id" | "createdAt" | "updatedAt"> = {
  equipmentId: "manual",
  equipmentName: "",
  userId: "admin-test",
  userName: "Admin Test",
  userRole: "student",
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
  purpose: "",
  status: "pending",
};

function ReservationsSection() {
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyReservation);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await reservationService.getAll());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!form.equipmentName.trim() || !form.purpose.trim()) {
      notify("Equipment name and purpose are required.", false);
      return;
    }
    setSaving(true);
    try {
      await reservationService.create(form);
      notify("Reservation created in Firestore.");
      setShowForm(false);
      setForm(emptyReservation);
      await load();
    } catch (e: any) {
      notify(e.message, false);
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (id: string, status: Reservation["status"]) => {
    setUpdatingId(id);
    try {
      await reservationService.updateStatus(id, status);
      notify(`Status updated to "${status}".`);
      await load();
    } catch (e: any) {
      notify(e.message, false);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setUpdatingId(id);
    try {
      await reservationService.delete(id);
      notify("Reservation deleted.");
      await load();
    } catch (e: any) {
      notify(e.message, false);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[--border] overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-[--border] bg-gradient-to-r from-emerald-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-[--foreground]">Reservations Collection</h3>
            <p className="text-xs text-[--muted-foreground]">
              {items.length} document{items.length !== 1 ? "s" : ""} in Firestore
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 rounded-lg hover:bg-gray-100 text-[--muted-foreground] hover:text-[--foreground] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Reservation
          </button>
        </div>
      </div>

      {toast && (
        <div
          className={`mx-5 mt-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${
            toast.ok
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {showForm && (
        <div className="p-5 bg-gray-50 border-b border-[--border]">
          <h4 className="text-sm font-semibold text-[--foreground] mb-4">New Reservation</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[--muted-foreground] mb-1">Equipment Name *</label>
              <input
                className="w-full border border-[--border] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="e.g. DSLR Camera"
                value={form.equipmentName}
                onChange={(e) => setForm({ ...form, equipmentName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[--muted-foreground] mb-1">User Name</label>
              <input
                className="w-full border border-[--border] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                value={form.userName}
                onChange={(e) => setForm({ ...form, userName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[--muted-foreground] mb-1">Start Date</label>
              <input
                type="date"
                className="w-full border border-[--border] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[--muted-foreground] mb-1">End Date</label>
              <input
                type="date"
                className="w-full border border-[--border] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[--muted-foreground] mb-1">User Role</label>
              <select
                className="w-full border border-[--border] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                value={form.userRole}
                onChange={(e) => setForm({ ...form, userRole: e.target.value as "student" | "faculty" })}
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[--muted-foreground] mb-1">Purpose *</label>
              <input
                className="w-full border border-[--border] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="Purpose of reservation"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Creating…" : "Create"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex items-center gap-1.5 px-4 py-2 border border-[--border] rounded-lg text-sm text-[--muted-foreground] hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        {error ? (
          <div className="flex items-center gap-2 p-6 text-red-600 text-sm">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center p-12 text-[--muted-foreground]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Reading from Firestore…
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-[--muted-foreground] text-sm">
            <CalendarCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            No reservations yet. Create one above.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[--border] bg-gray-50 text-left">
                <th className="px-5 py-3 font-medium text-[--muted-foreground]">Equipment</th>
                <th className="px-5 py-3 font-medium text-[--muted-foreground]">User</th>
                <th className="px-5 py-3 font-medium text-[--muted-foreground]">Dates</th>
                <th className="px-5 py-3 font-medium text-[--muted-foreground]">Status</th>
                <th className="px-5 py-3 font-medium text-[--muted-foreground] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-[--border] last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-[--foreground]">{item.equipmentName}</td>
                  <td className="px-5 py-3.5">
                    <div className="text-[--foreground]">{item.userName}</div>
                    <div className="text-xs text-[--muted-foreground] capitalize">{item.userRole}</div>
                  </td>
                  <td className="px-5 py-3.5 text-[--muted-foreground]">
                    <div>{item.startDate}</div>
                    <div className="text-xs">→ {item.endDate}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge status={item.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      {item.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleStatus(item.id!, "approved")}
                            disabled={updatingId === item.id}
                            className="px-2 py-1 text-xs rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatus(item.id!, "rejected")}
                            disabled={updatingId === item.id}
                            className="px-2 py-1 text-xs rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {item.status === "approved" && (
                        <button
                          onClick={() => handleStatus(item.id!, "returned")}
                          disabled={updatingId === item.id}
                          className="px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
                        >
                          Mark Returned
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.id!)}
                        disabled={updatingId === item.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50"
                      >
                        {updatingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Admin Account Setup ──────────────────────────────────────────────────────

function AdminSetupSection() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);
    try {
      await createAdminUser({
        email: "admin@gmail.com",
        password: "makisan123",
        name: "Admin",
        department: "Administration",
      });
      setResult({ ok: true, msg: "Admin account created! Sign in with admin@gmail.com / makisan123" });
    } catch (e: any) {
      const msg =
        e.code === "auth/email-already-in-use"
          ? "Account already exists. Sign in with admin@gmail.com / makisan123"
          : e.message || "Failed to create admin account.";
      setResult({ ok: e.code === "auth/email-already-in-use", msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-blue-200 overflow-hidden">
      <div className="flex items-center gap-3 p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold">Admin Account Setup</h3>
          <p className="text-xs text-blue-100">Create the default admin account in Firebase Auth + Firestore</p>
        </div>
        <span className="ml-auto text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">One-time setup</span>
      </div>

      <div className="p-5 space-y-4">
        {result && (
          <div className={`flex items-start gap-2.5 p-3.5 rounded-lg text-sm border ${result.ok ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {result.ok ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
            {result.msg}
          </div>
        )}

        {/* Credentials preview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg border border-[--border]">
            <p className="text-xs text-[--muted-foreground] mb-0.5">Email</p>
            <p className="text-sm font-medium text-[--foreground]">admin@gmail.com</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-[--border]">
            <p className="text-xs text-[--muted-foreground] mb-0.5">Password</p>
            <p className="text-sm font-medium text-[--foreground]">makisan123</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-[--border]">
            <p className="text-xs text-[--muted-foreground] mb-0.5">Role</p>
            <p className="text-sm font-semibold text-blue-600">admin</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-[--border]">
            <p className="text-xs text-[--muted-foreground] mb-0.5">Department</p>
            <p className="text-sm font-medium text-[--foreground]">Administration</p>
          </div>
        </div>

        <button
          onClick={handleSeed}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-lg shadow-blue-500/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCog className="w-4 h-4" />}
          {loading ? "Creating account…" : "Create Admin Account"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function FirebaseTestPanel() {
  const [connStatus, setConnStatus] = useState<"checking" | "ok" | "error">("checking");
  const [connMsg, setConnMsg] = useState("");
  const [showEquip, setShowEquip] = useState(true);
  const [showRes, setShowRes] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        await equipmentService.getAll();
        setConnStatus("ok");
        setConnMsg("Connected to Firestore successfully");
      } catch (e: any) {
        setConnStatus("error");
        setConnMsg(e.message);
      }
    };
    check();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[--foreground] mb-1.5">Firebase Integration</h1>
          <p className="text-[--muted-foreground]">
            Live Firestore CRUD — all changes persist to your Firebase project in real time.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[--border] bg-white text-sm">
          <Database className="w-4 h-4 text-orange-500" />
          <span className="text-[--muted-foreground]">equipmentreservation-7ec83</span>
        </div>
      </div>

      {/* Connection Status Card */}
      <div
        className={`flex items-center gap-4 p-4 rounded-xl border ${
          connStatus === "ok"
            ? "bg-emerald-50 border-emerald-200"
            : connStatus === "error"
            ? "bg-red-50 border-red-200"
            : "bg-gray-50 border-[--border]"
        }`}
      >
        {connStatus === "checking" ? (
          <Loader2 className="w-5 h-5 animate-spin text-[--muted-foreground]" />
        ) : connStatus === "ok" ? (
          <CheckCircle className="w-5 h-5 text-emerald-600" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600" />
        )}
        <div>
          <p
            className={`font-medium text-sm ${
              connStatus === "ok"
                ? "text-emerald-700"
                : connStatus === "error"
                ? "text-red-700"
                : "text-[--muted-foreground]"
            }`}
          >
            {connStatus === "checking"
              ? "Connecting to Firestore…"
              : connStatus === "ok"
              ? "Firestore Connected"
              : "Firestore Error"}
          </p>
          {connMsg && (
            <p className="text-xs text-[--muted-foreground] mt-0.5">{connMsg}</p>
          )}
        </div>
        {connStatus === "ok" && (
          <div className="ml-auto flex items-center gap-6 text-xs text-[--muted-foreground]">
            <span>
              <StatusDot ok={true} />
              Test Mode (open rules)
            </span>
            <span>
              <StatusDot ok={true} />
              Real-time writes enabled
            </span>
          </div>
        )}
      </div>

      {/* Firestore Rules reminder */}
      {connStatus === "error" && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium mb-1">Enable Firestore test rules</p>
            <p>In your Firebase Console → Firestore → Rules, set:</p>
            <pre className="mt-2 p-2 bg-amber-100 rounded text-xs overflow-x-auto">{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}</pre>
          </div>
        </div>
      )}

      {/* Admin Setup */}
      {connStatus !== "error" && <AdminSetupSection />}

      {/* Collections */}
      {connStatus !== "error" && (
        <>
          {/* Equipment */}
          <div>
            <button
              onClick={() => setShowEquip((v) => !v)}
              className="flex items-center gap-2 mb-3 text-sm font-semibold text-[--foreground] hover:text-blue-600 transition-colors"
            >
              {showEquip ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Equipment Collection
              <span className="font-normal text-[--muted-foreground]">· Create, Read, Update, Delete</span>
            </button>
            {showEquip && <EquipmentSection />}
          </div>

          {/* Reservations */}
          <div>
            <button
              onClick={() => setShowRes((v) => !v)}
              className="flex items-center gap-2 mb-3 text-sm font-semibold text-[--foreground] hover:text-emerald-600 transition-colors"
            >
              {showRes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Reservations Collection
              <span className="font-normal text-[--muted-foreground]">· Create, Read, Update Status, Delete</span>
            </button>
            {showRes && <ReservationsSection />}
          </div>
        </>
      )}
    </div>
  );
}
