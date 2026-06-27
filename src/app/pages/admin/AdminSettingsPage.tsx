import { useState, useEffect } from 'react';
import {
  Settings, School, Mail, Calendar, Package,
  Bell, Shield, Save, Loader2, CheckCircle,
  AlertCircle, Key, Eye, EyeOff, Globe, Lock,
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  updatePassword, reauthenticateWithCredential, EmailAuthProvider,
} from 'firebase/auth';
import { db, auth } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';

// ── Types ──────────────────────────────────────────────────────────────────────

interface SystemSettings {
  general: {
    schoolName: string;
    contactEmail: string;
    websiteUrl: string;
  };
  reservation: {
    maxDays: number;
    maxEquipmentPerReservation: number;
    autoCancelDays: number;
    requireApproval: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    reservationNotifications: boolean;
    approvalNotifications: boolean;
    returnReminders: boolean;
    lowStockAlerts: boolean;
    lowStockThreshold: number;
  };
}

const defaultSettings: SystemSettings = {
  general: { schoolName: 'EquipHub University', contactEmail: 'admin@equiphub.edu', websiteUrl: '' },
  reservation: { maxDays: 7, maxEquipmentPerReservation: 5, autoCancelDays: 3, requireApproval: true },
  notifications: { emailNotifications: true, reservationNotifications: true, approvalNotifications: true, returnReminders: true, lowStockAlerts: true, lowStockThreshold: 2 },
};

type Tab = 'general' | 'reservation' | 'notifications' | 'security';

// ── Helpers ────────────────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[--border] overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[--border] bg-gray-50/50">
        <Icon className="w-4 h-4 text-[--muted-foreground]" />
        <h3 className="font-semibold text-[--foreground] text-sm">{title}</h3>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

function FieldRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
      <div className="sm:w-56 shrink-0">
        <p className="text-sm font-medium text-[--foreground]">{label}</p>
        {desc && <p className="text-xs text-[--muted-foreground] mt-0.5">{desc}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-4 py-2.5 text-sm bg-white border border-[--border] rounded-xl text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all" />
  );
}

function NumberInput({ value, onChange, min = 1, max = 999 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <input type="number" value={value} min={min} max={max} onChange={(e) => onChange(Number(e.target.value))}
      className="w-32 px-4 py-2.5 text-sm bg-white border border-[--border] rounded-xl text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all" />
  );
}

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
      <div>
        <p className="text-sm font-medium text-[--foreground]">{label}</p>
        {desc && <p className="text-xs text-[--muted-foreground] mt-0.5">{desc}</p>}
      </div>
      <div className="relative ml-4 shrink-0" onClick={(e) => e.stopPropagation()} onChange={() => onChange(!checked)}>
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}>
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
        </div>
      </div>
    </label>
  );
}

function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const score = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  const colors = ['bg-red-400', 'bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-emerald-500'];
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">{[0,1,2,3].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full ${i < score ? colors[score] : 'bg-gray-200'}`} />)}</div>
      <p className={`text-xs ${score >= 3 ? 'text-emerald-600' : score >= 2 ? 'text-amber-600' : 'text-red-500'}`}>{labels[score]}</p>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────────

export function AdminSettingsPage() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Password state
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Load settings from Firestore ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'system'));
        if (snap.exists()) {
          const data = snap.data() as Partial<SystemSettings>;
          setSettings({
            general: { ...defaultSettings.general, ...data.general },
            reservation: { ...defaultSettings.reservation, ...data.reservation },
            notifications: { ...defaultSettings.notifications, ...data.notifications },
          });
        }
      } catch { /* use defaults */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // ── Save settings ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'system'), {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: userProfile?.uid ?? '',
      }, { merge: true });
      notify('Settings saved successfully!');
    } catch (e: any) {
      notify(e.message ?? 'Failed to save settings.', false);
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    setPwError(null);
    if (!pwForm.current) { setPwError('Current password is required.'); return; }
    if (pwForm.newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (!/[A-Z]/.test(pwForm.newPw)) { setPwError('Must include an uppercase letter.'); return; }
    if (!/[0-9]/.test(pwForm.newPw)) { setPwError('Must include a number.'); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Passwords do not match.'); return; }

    const user = auth.currentUser;
    if (!user?.email) return;
    setPwSaving(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, pwForm.current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, pwForm.newPw);
      setPwForm({ current: '', newPw: '', confirm: '' });
      notify('Password changed successfully!');
    } catch (e: any) {
      setPwError(e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'
        ? 'Current password is incorrect.' : e.message ?? 'Failed to change password.');
    } finally {
      setPwSaving(false); }
  };

  const upd = <K extends keyof SystemSettings>(section: K) => (key: keyof SystemSettings[K], value: unknown) =>
    setSettings((s) => ({ ...s, [section]: { ...s[section], [key]: value } }));

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'general',       label: 'General',       icon: Globe },
    { key: 'reservation',   label: 'Reservation',   icon: Calendar },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'security',      label: 'Security',      icon: Shield },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium ${toast.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[--foreground] mb-1">System Settings</h1>
          <p className="text-[--muted-foreground]">Configure EquipHub system preferences and policies</p>
        </div>
        {activeTab !== 'security' && (
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-lg shadow-blue-500/20">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-2xl w-fit flex-wrap">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === key ? 'bg-white text-[--foreground] shadow-sm' : 'text-[--muted-foreground] hover:text-[--foreground]'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── GENERAL ── */}
      {activeTab === 'general' && (
        <div className="space-y-5">
          <SectionCard title="School Information" icon={School}>
            <FieldRow label="School Name" desc="Displayed throughout the application">
              <TextInput value={settings.general.schoolName} onChange={upd('general')('schoolName' as any, undefined) as any}
                placeholder="e.g. University of the Philippines" />
            </FieldRow>
            <hr className="border-[--border]" />
            <FieldRow label="Contact Email" desc="For system-generated emails">
              <TextInput type="email" value={settings.general.contactEmail} onChange={(v) => upd('general')('contactEmail', v)}
                placeholder="admin@school.edu" />
            </FieldRow>
            <hr className="border-[--border]" />
            <FieldRow label="Website URL" desc="School or department website">
              <TextInput type="url" value={settings.general.websiteUrl} onChange={(v) => upd('general')('websiteUrl', v)}
                placeholder="https://school.edu" />
            </FieldRow>
          </SectionCard>

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save General Settings
            </button>
          </div>
        </div>
      )}

      {/* ── RESERVATION ── */}
      {activeTab === 'reservation' && (
        <div className="space-y-5">
          <SectionCard title="Reservation Policies" icon={Calendar}>
            <FieldRow label="Maximum Reservation Days" desc="Longest allowed loan period">
              <div className="flex items-center gap-3">
                <NumberInput value={settings.reservation.maxDays} onChange={(v) => upd('reservation')('maxDays', v)} min={1} max={60} />
                <span className="text-sm text-[--muted-foreground]">days</span>
              </div>
            </FieldRow>
            <hr className="border-[--border]" />
            <FieldRow label="Max Equipment Per Reservation" desc="Items a user can reserve at once">
              <div className="flex items-center gap-3">
                <NumberInput value={settings.reservation.maxEquipmentPerReservation} onChange={(v) => upd('reservation')('maxEquipmentPerReservation', v)} min={1} max={50} />
                <span className="text-sm text-[--muted-foreground]">items</span>
              </div>
            </FieldRow>
            <hr className="border-[--border]" />
            <FieldRow label="Auto-Cancel After" desc="Cancel pending requests if no action taken">
              <div className="flex items-center gap-3">
                <NumberInput value={settings.reservation.autoCancelDays} onChange={(v) => upd('reservation')('autoCancelDays', v)} min={1} max={30} />
                <span className="text-sm text-[--muted-foreground]">days</span>
              </div>
            </FieldRow>
            <hr className="border-[--border]" />
            <Toggle checked={settings.reservation.requireApproval} onChange={(v) => upd('reservation')('requireApproval', v)}
              label="Require Approval" desc="All reservations need admin or faculty approval before borrowing" />
          </SectionCard>

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save Reservation Settings
            </button>
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {activeTab === 'notifications' && (
        <div className="space-y-5">
          <SectionCard title="Notification Preferences" icon={Bell}>
            <Toggle checked={settings.notifications.emailNotifications} onChange={(v) => upd('notifications')('emailNotifications', v)}
              label="Email Notifications" desc="Send email alerts for important events" />
            <Toggle checked={settings.notifications.reservationNotifications} onChange={(v) => upd('notifications')('reservationNotifications', v)}
              label="Reservation Notifications" desc="Notify users on reservation status changes" />
            <Toggle checked={settings.notifications.approvalNotifications} onChange={(v) => upd('notifications')('approvalNotifications', v)}
              label="Approval Notifications" desc="Alert admins and faculty when requests need review" />
            <Toggle checked={settings.notifications.returnReminders} onChange={(v) => upd('notifications')('returnReminders', v)}
              label="Return Reminders" desc="Remind users when equipment return is due" />
            <Toggle checked={settings.notifications.lowStockAlerts} onChange={(v) => upd('notifications')('lowStockAlerts', v)}
              label="Low Stock Alerts" desc="Alert when equipment availability falls below threshold" />
            {settings.notifications.lowStockAlerts && (
              <FieldRow label="Low Stock Threshold" desc="Alert when available quantity falls below this number">
                <div className="flex items-center gap-3">
                  <NumberInput value={settings.notifications.lowStockThreshold} onChange={(v) => upd('notifications')('lowStockThreshold', v)} min={1} max={20} />
                  <span className="text-sm text-[--muted-foreground]">units</span>
                </div>
              </FieldRow>
            )}
          </SectionCard>

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save Notification Settings
            </button>
          </div>
        </div>
      )}

      {/* ── SECURITY ── */}
      {activeTab === 'security' && (
        <div className="space-y-5">
          <SectionCard title="Change Admin Password" icon={Key}>
            {pwError && (
              <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />{pwError}
              </div>
            )}
            <div className="space-y-4 max-w-md">
              <FieldRow label="Current Password">
                <div className="relative">
                  <input type={showCurrent ? 'text' : 'password'} value={pwForm.current}
                    onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))} placeholder="Enter current password"
                    className="w-full px-4 py-2.5 pr-11 text-sm bg-white border border-[--border] rounded-xl text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all" />
                  <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[--muted-foreground]">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FieldRow>
              <FieldRow label="New Password">
                <div>
                  <div className="relative">
                    <input type={showNew ? 'text' : 'password'} value={pwForm.newPw}
                      onChange={(e) => setPwForm((f) => ({ ...f, newPw: e.target.value }))} placeholder="At least 8 characters"
                      className="w-full px-4 py-2.5 pr-11 text-sm bg-white border border-[--border] rounded-xl text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all" />
                    <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[--muted-foreground]">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrengthBar password={pwForm.newPw} />
                </div>
              </FieldRow>
              <FieldRow label="Confirm New Password">
                <input type="password" value={pwForm.confirm}
                  onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} placeholder="Re-enter new password"
                  className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl text-[--foreground] focus:outline-none focus:ring-2 transition-all ${
                    pwForm.confirm && pwForm.confirm !== pwForm.newPw ? 'border-red-400 focus:ring-red-400' : 'border-[--border] focus:ring-[--primary-blue]'
                  }`} />
                {pwForm.confirm && pwForm.confirm !== pwForm.newPw && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </FieldRow>
              <button onClick={handleChangePassword} disabled={pwSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Update Password
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Session & Account" icon={Shield}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Admin UID', value: userProfile?.uid ?? '—' },
                { label: 'Email', value: userProfile?.email ?? '—' },
                { label: 'Email Verified', value: auth.currentUser?.emailVerified ? 'Verified ✓' : 'Not Verified' },
                { label: 'Last Login', value: auth.currentUser?.metadata?.lastSignInTime ? new Date(auth.currentUser.metadata.lastSignInTime).toLocaleString() : '—' },
                { label: 'Account Created', value: auth.currentUser?.metadata?.creationTime ? new Date(auth.currentUser.metadata.creationTime).toLocaleDateString() : '—' },
                { label: 'Active Session', value: 'Current session active' },
              ].map(({ label, value }) => (
                <div key={label} className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-medium text-[--muted-foreground] uppercase tracking-wide mb-1">{label}</p>
                  <p className="font-medium text-[--foreground] break-all">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Two-Factor Authentication (2FA) — Coming in a future update
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
