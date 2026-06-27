import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  User, Mail, Phone, MapPin, Shield, Key, Bell,
  Save, Eye, EyeOff, Camera, Loader2, CheckCircle,
  AlertCircle, Building2, BookOpen, GraduationCap,
  Lock, Palette, Edit3, X,
} from 'lucide-react';
import {
  doc, getDoc, updateDoc, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import {
  updateProfile, updatePassword,
  reauthenticateWithCredential, EmailAuthProvider,
} from 'firebase/auth';
import { db, auth } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { uploadToCloudinary, validateImageFile, optimizeImageUrl } from '../../../lib/cloudinary';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExtendedProfile {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'faculty' | 'student';
  department?: string;
  studentId?: string;
  phone?: string;
  address?: string;
  photoURL?: string;
  course?: string;
  yearLevel?: string;
  section?: string;
  position?: string;
  office?: string;
  isActive?: boolean;
  createdAt?: { toDate: () => Date };
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: {
      reservationUpdates?: boolean;
      approvalNotifications?: boolean;
      returnReminders?: boolean;
      equipmentAvailability?: boolean;
    };
  };
}

type Tab = 'profile' | 'security' | 'preferences';

// ── Password strength ──────────────────────────────────────────────────────────

function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)];
  const score = checks.filter(Boolean).length;
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-red-400', 'bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-emerald-500'];
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < score ? colors[score] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-xs ${score >= 3 ? 'text-emerald-600' : score >= 2 ? 'text-amber-600' : 'text-red-500'}`}>{labels[score]}</p>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────────

function Toast({ msg, ok, onDismiss }: { msg: string; ok: boolean; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium max-w-sm ${
        ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
      }`}
    >
      {ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
      <span className="flex-1">{msg}</span>
      <button onClick={onDismiss} className="ml-2 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
    </motion.div>
  );
}

// ── Section card ───────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[--border] overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[--border] bg-gray-50/50">
        <Icon className="w-4 h-4 text-[--muted-foreground]" />
        <h3 className="font-semibold text-[--foreground] text-sm">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Field helpers ──────────────────────────────────────────────────────────────

function Field({ label, value, readOnly = false, placeholder = '', type = 'text', onChange }: {
  label: string; value: string; readOnly?: boolean;
  placeholder?: string; type?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[--muted-foreground] mb-1.5 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        readOnly={readOnly}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full px-4 py-2.5 text-sm rounded-xl border transition-all ${
          readOnly
            ? 'bg-gray-50 border-gray-200 text-[--muted-foreground] cursor-not-allowed'
            : 'bg-white border-[--border] text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] focus:border-transparent'
        }`}
      />
    </div>
  );
}

function ReadOnlyBadge({ label, value, color = 'bg-gray-100 text-gray-600' }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[--muted-foreground] mb-1.5 uppercase tracking-wide">{label}</label>
      <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-medium ${color}`}>{value}</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<ExtendedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', phone: '', address: '',
    course: '', yearLevel: '', section: '', position: '', office: '',
  });
  const [photoUploading, setPhotoUploading] = useState(false);

  // Password form state
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // Preferences state
  const [prefs, setPrefs] = useState({
    theme: 'system' as 'light' | 'dark' | 'system',
    reservationUpdates: true,
    approvalNotifications: true,
    returnReminders: true,
    equipmentAvailability: false,
  });

  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Load profile ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userProfile?.uid) return;
    let cancelled = false;

    const unsub = onSnapshot(doc(db, 'users', userProfile.uid), (snap) => {
      if (!snap.exists() || cancelled) return;
      const data = { uid: snap.id, ...snap.data() } as ExtendedProfile;
      setProfile(data);

      // Sync edit form
      const [firstName = '', ...rest] = (data.name ?? '').split(' ');
      const lastName = rest.join(' ');
      setEditForm({
        firstName, lastName,
        phone: data.phone ?? '',
        address: data.address ?? '',
        course: data.course ?? '',
        yearLevel: data.yearLevel ?? '',
        section: data.section ?? '',
        position: data.position ?? '',
        office: data.office ?? '',
      });

      // Sync prefs
      const p = data.preferences ?? {};
      setPrefs({
        theme: p.theme ?? 'system',
        reservationUpdates: p.notifications?.reservationUpdates ?? true,
        approvalNotifications: p.notifications?.approvalNotifications ?? true,
        returnReminders: p.notifications?.returnReminders ?? true,
        equipmentAvailability: p.notifications?.equipmentAvailability ?? false,
      });

      setLoading(false);
    }, () => setLoading(false));

    return () => { cancelled = true; unsub(); };
  }, [userProfile?.uid]);

  // ── Save personal info ──────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!userProfile?.uid) return;
    if (!editForm.firstName.trim()) { notify('First name cannot be empty.', false); return; }

    const fullName = `${editForm.firstName.trim()} ${editForm.lastName.trim()}`.trim();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), {
        name: fullName,
        phone: editForm.phone,
        address: editForm.address,
        course: editForm.course,
        yearLevel: editForm.yearLevel,
        section: editForm.section,
        position: editForm.position,
        office: editForm.office,
        updatedAt: serverTimestamp(),
      });
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: fullName });
      }
      notify('Profile updated successfully!');
    } catch (e: any) {
      notify(e.message ?? 'Failed to save profile.', false);
    } finally {
      setSaving(false);
    }
  };

  // ── Profile picture upload ──────────────────────────────────────────────
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile?.uid) return;
    const err = validateImageFile(file);
    if (err) { notify(err, false); return; }

    setPhotoUploading(true);
    try {
      const result = await uploadToCloudinary(file);
      await updateDoc(doc(db, 'users', userProfile.uid), {
        photoURL: result.secure_url, updatedAt: serverTimestamp(),
      });
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: result.secure_url });
      }
      notify('Profile picture updated!');
    } catch (e: any) {
      notify(e.message ?? 'Failed to upload photo.', false);
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  // ── Change password ─────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    setPwError(null);
    if (!pwForm.current) { setPwError('Current password is required.'); return; }
    if (pwForm.newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (!/[A-Z]/.test(pwForm.newPw)) { setPwError('Must include an uppercase letter.'); return; }
    if (!/[0-9]/.test(pwForm.newPw)) { setPwError('Must include a number.'); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Passwords do not match.'); return; }

    const user = auth.currentUser;
    if (!user || !user.email) return;

    setPwSaving(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, pwForm.current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, pwForm.newPw);
      setPwForm({ current: '', newPw: '', confirm: '' });
      notify('Password changed successfully!');
    } catch (e: any) {
      const msg = e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'
        ? 'Current password is incorrect.'
        : e.message ?? 'Failed to change password.';
      setPwError(msg);
    } finally {
      setPwSaving(false);
    }
  };

  // ── Save preferences ────────────────────────────────────────────────────
  const handleSavePrefs = async () => {
    if (!userProfile?.uid) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), {
        preferences: {
          theme: prefs.theme,
          notifications: {
            reservationUpdates: prefs.reservationUpdates,
            approvalNotifications: prefs.approvalNotifications,
            returnReminders: prefs.returnReminders,
            equipmentAvailability: prefs.equipmentAvailability,
          },
        },
        updatedAt: serverTimestamp(),
      });
      notify('Preferences saved!');
    } catch (e: any) {
      notify(e.message ?? 'Failed to save preferences.', false);
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'profile',     label: 'Profile',      icon: User },
    { key: 'security',    label: 'Security',      icon: Lock },
    { key: 'preferences', label: 'Preferences',   icon: Palette },
  ];

  const roleColor = profile?.role === 'admin' ? 'bg-red-100 text-red-700' : profile?.role === 'faculty' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Toast */}
      {toast && <Toast msg={toast.msg} ok={toast.ok} onDismiss={() => setToast(null)} />}

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-[--foreground] mb-1">Profile Settings</h1>
        <p className="text-[--muted-foreground]">Manage your account information and preferences</p>
      </div>

      {/* Profile hero card */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="relative flex items-center gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/20 ring-4 ring-white/30">
              {profile?.photoURL ? (
                <img src={optimizeImageUrl(profile.photoURL, 192, 90)} alt={profile.name} className="w-full h-full object-cover object-center" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white">
                  {(profile?.name ?? 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-blue-600 rounded-xl flex items-center justify-center shadow-lg hover:bg-blue-50 transition-colors disabled:opacity-60"
              title="Change photo"
            >
              {photoUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h2 className="text-2xl font-bold">{profile?.name ?? '—'}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-white/20 text-white`}>
                {profile?.role}
              </span>
            </div>
            <p className="text-blue-100 text-sm mb-3">{profile?.email}</p>
            <div className="flex items-center gap-4 text-sm text-blue-100 flex-wrap">
              {profile?.department && (
                <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{profile.department}</span>
              )}
              {profile?.isActive !== false
                ? <span className="flex items-center gap-1.5 text-emerald-300"><CheckCircle className="w-3.5 h-3.5" />Active Account</span>
                : <span className="flex items-center gap-1.5 text-red-300"><AlertCircle className="w-3.5 h-3.5" />Inactive</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-2xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === key ? 'bg-white text-[--foreground] shadow-sm' : 'text-[--muted-foreground] hover:text-[--foreground]'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {activeTab === 'profile' && (
        <div className="space-y-5">
          {/* Personal Information */}
          <Section title="Personal Information" icon={Edit3}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First Name" value={editForm.firstName} placeholder="John" onChange={(v) => setEditForm((f) => ({ ...f, firstName: v }))} />
              <Field label="Last Name" value={editForm.lastName} placeholder="Doe" onChange={(v) => setEditForm((f) => ({ ...f, lastName: v }))} />
              <Field label="Email Address" value={profile?.email ?? ''} readOnly />
              <Field label="Phone Number" value={editForm.phone} placeholder="+63 912 345 6789" type="tel" onChange={(v) => setEditForm((f) => ({ ...f, phone: v }))} />
              <div className="sm:col-span-2">
                <Field label="Address" value={editForm.address} placeholder="City, Province, Country" onChange={(v) => setEditForm((f) => ({ ...f, address: v }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5 pt-5 border-t border-[--border]">
              <button onClick={() => {}} className="px-4 py-2 text-sm border border-[--border] rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSaveProfile} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </Section>

          {/* Account Information (read-only) */}
          <Section title="Account Information" icon={Shield}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="User ID (UID)" value={profile?.uid ?? ''} readOnly />
              <ReadOnlyBadge label="Role" value={(profile?.role ?? '').charAt(0).toUpperCase() + (profile?.role ?? '').slice(1)} color={roleColor} />
              <Field label="Email" value={profile?.email ?? ''} readOnly />
              <Field label="Account Status" value={profile?.isActive !== false ? 'Active' : 'Inactive'} readOnly />
              {profile?.createdAt && (
                <Field label="Date Joined" value={profile.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} readOnly />
              )}
              <Field label="Email Verified" value={auth.currentUser?.emailVerified ? 'Verified ✓' : 'Not Verified'} readOnly />
            </div>
          </Section>

          {/* Role-specific section */}
          {profile?.role === 'student' && (
            <Section title="Student Information" icon={GraduationCap}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Student ID" value={profile.studentId ?? '—'} readOnly />
                <Field label="Department" value={profile.department ?? '—'} readOnly />
                <Field label="Course" value={editForm.course} placeholder="e.g. BSCS" onChange={(v) => setEditForm((f) => ({ ...f, course: v }))} />
                <Field label="Year Level" value={editForm.yearLevel} placeholder="e.g. 3rd Year" onChange={(v) => setEditForm((f) => ({ ...f, yearLevel: v }))} />
                <Field label="Section" value={editForm.section} placeholder="e.g. Section A" onChange={(v) => setEditForm((f) => ({ ...f, section: v }))} />
              </div>
              <div className="flex justify-end mt-5 pt-5 border-t border-[--border]">
                <button onClick={handleSaveProfile} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save
                </button>
              </div>
            </Section>
          )}

          {profile?.role === 'faculty' && (
            <Section title="Faculty Information" icon={BookOpen}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Employee ID" value={profile.studentId ?? '—'} readOnly />
                <Field label="Department" value={profile.department ?? '—'} readOnly />
                <Field label="Position / Title" value={editForm.position} placeholder="e.g. Professor" onChange={(v) => setEditForm((f) => ({ ...f, position: v }))} />
                <Field label="Office" value={editForm.office} placeholder="e.g. Room 302, Faculty Building" onChange={(v) => setEditForm((f) => ({ ...f, office: v }))} />
              </div>
              <div className="flex justify-end mt-5 pt-5 border-t border-[--border]">
                <button onClick={handleSaveProfile} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save
                </button>
              </div>
            </Section>
          )}

          {profile?.role === 'admin' && (
            <Section title="Admin Information" icon={Shield}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Employee ID" value={profile.studentId ?? '—'} readOnly />
                <Field label="Department" value={profile.department ?? 'Administration'} readOnly />
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium text-[--muted-foreground] uppercase tracking-wide mb-3">Permissions</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['Manage Users', 'Manage Equipment', 'Approve Reservations', 'Reject Reservations', 'View Reports', 'View Audit Logs'].map((p) => (
                    <div key={p} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg text-xs text-emerald-700 font-medium">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />{p}
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          )}
        </div>
      )}

      {/* ── SECURITY TAB ── */}
      {activeTab === 'security' && (
        <div className="space-y-5">
          <Section title="Change Password" icon={Key}>
            {pwError && (
              <div className="flex items-center gap-2.5 p-3.5 mb-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />{pwError}
              </div>
            )}
            <div className="space-y-4 max-w-md">
              {/* Current password */}
              <div>
                <label className="block text-xs font-medium text-[--muted-foreground] mb-1.5 uppercase tracking-wide">Current Password</label>
                <div className="relative">
                  <input type={showCurrent ? 'text' : 'password'} value={pwForm.current} onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                    className="w-full px-4 py-2.5 pr-11 text-sm bg-white border border-[--border] rounded-xl text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
                    placeholder="Enter current password" />
                  <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[--muted-foreground] hover:text-[--foreground]">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-xs font-medium text-[--muted-foreground] mb-1.5 uppercase tracking-wide">New Password</label>
                <div className="relative">
                  <input type={showNew ? 'text' : 'password'} value={pwForm.newPw} onChange={(e) => setPwForm((f) => ({ ...f, newPw: e.target.value }))}
                    className="w-full px-4 py-2.5 pr-11 text-sm bg-white border border-[--border] rounded-xl text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
                    placeholder="At least 8 characters" />
                  <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[--muted-foreground] hover:text-[--foreground]">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrengthBar password={pwForm.newPw} />
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-medium text-[--muted-foreground] mb-1.5 uppercase tracking-wide">Confirm New Password</label>
                <input type="password" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                  className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl text-[--foreground] focus:outline-none focus:ring-2 transition-all ${
                    pwForm.confirm && pwForm.confirm !== pwForm.newPw ? 'border-red-400 focus:ring-red-400' : 'border-[--border] focus:ring-[--primary-blue]'
                  }`}
                  placeholder="Re-enter new password" />
                {pwForm.confirm && pwForm.confirm !== pwForm.newPw && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              <button onClick={handleChangePassword} disabled={pwSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                Change Password
              </button>
            </div>
          </Section>

          <Section title="Session Information" icon={Shield}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Last Login" value={auth.currentUser?.metadata?.lastSignInTime ? new Date(auth.currentUser.metadata.lastSignInTime).toLocaleString() : '—'} readOnly />
              <Field label="Email Verified" value={auth.currentUser?.emailVerified ? 'Yes ✓' : 'No'} readOnly />
              <Field label="Account Created" value={auth.currentUser?.metadata?.creationTime ? new Date(auth.currentUser.metadata.creationTime).toLocaleDateString() : '—'} readOnly />
              <Field label="Active Session" value="Current session active" readOnly />
            </div>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Two-Factor Authentication (2FA) — Coming soon
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ── PREFERENCES TAB ── */}
      {activeTab === 'preferences' && (
        <div className="space-y-5">
          <Section title="Theme" icon={Palette}>
            <div className="grid grid-cols-3 gap-3">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button key={t} onClick={() => setPrefs((p) => ({ ...p, theme: t }))}
                  className={`p-4 rounded-xl border-2 transition-all text-sm font-medium capitalize ${
                    prefs.theme === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-[--border] hover:border-gray-300 text-[--foreground]'
                  }`}>
                  {t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '🖥️'} {t}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Notification Preferences" icon={Bell}>
            <div className="space-y-3">
              {[
                { key: 'reservationUpdates', label: 'Reservation Updates', desc: 'Status changes to your reservations' },
                { key: 'approvalNotifications', label: 'Approval Notifications', desc: 'When requests are approved or rejected' },
                { key: 'returnReminders', label: 'Return Reminders', desc: 'Reminders when equipment is due back' },
                { key: 'equipmentAvailability', label: 'Equipment Availability', desc: 'When new equipment becomes available' },
              ].map(({ key, label, desc }) => (
                <label key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-[--foreground]">{label}</p>
                    <p className="text-xs text-[--muted-foreground] mt-0.5">{desc}</p>
                  </div>
                  <div className="relative ml-4 shrink-0">
                    <input type="checkbox" className="sr-only"
                      checked={prefs[key as keyof typeof prefs] as boolean}
                      onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))} />
                    <div className={`w-11 h-6 rounded-full transition-colors ${prefs[key as keyof typeof prefs] ? 'bg-blue-600' : 'bg-gray-300'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[key as keyof typeof prefs] ? 'translate-x-5' : ''}`} />
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-end mt-5 pt-5 border-t border-[--border]">
              <button onClick={handleSavePrefs} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save Preferences
              </button>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
