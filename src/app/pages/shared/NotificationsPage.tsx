import { useState, useEffect } from 'react';
import {
  Bell, CheckCheck, Trash2, Loader2, CheckCircle,
  XCircle, Package, ArrowDownToLine, RotateCcw, Info,
} from 'lucide-react';
import {
  collection, query, where, onSnapshot, doc,
  updateDoc, deleteDoc, writeBatch, Timestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt?: Timestamp;
}

type FilterTab = 'all' | 'unread' | 'read';

function timeAgo(ts?: Timestamp): string {
  if (!ts) return '';
  const seconds = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minute${Math.floor(seconds / 60) !== 1 ? 's' : ''} ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) !== 1 ? 's' : ''} ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) !== 1 ? 's' : ''} ago`;
  return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getNotificationIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes('approved')) return { icon: CheckCircle, bg: 'bg-emerald-100', color: 'text-emerald-600' };
  if (t.includes('rejected')) return { icon: XCircle, bg: 'bg-red-100', color: 'text-red-600' };
  if (t.includes('borrowed')) return { icon: ArrowDownToLine, bg: 'bg-blue-100', color: 'text-blue-600' };
  if (t.includes('returned')) return { icon: RotateCcw, bg: 'bg-purple-100', color: 'text-purple-600' };
  if (t.includes('equipment')) return { icon: Package, bg: 'bg-amber-100', color: 'text-amber-600' };
  return { icon: Info, bg: 'bg-gray-100', color: 'text-gray-600' };
}

export function NotificationsPage() {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch (where only — avoid composite index) ──────────────────────────
  useEffect(() => {
    if (!userProfile?.uid) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', userProfile.uid));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Notification))
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setNotifications(items);
      setLoading(false);
    }, () => { setLoading(false); });
    return unsub;
  }, [userProfile?.uid]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount   = notifications.filter((n) => n.read).length;

  const displayed = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read')   return n.read;
    return true;
  });

  const handleMarkRead = async (n: Notification) => {
    if (n.read) return;
    try { await updateDoc(doc(db, 'notifications', n.id), { read: true }); }
    catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (!unread.length) return;
    setMarkingAll(true);
    try {
      const batch = writeBatch(db);
      unread.forEach((n) => batch.update(doc(db, 'notifications', n.id), { read: true }));
      await batch.commit();
    } catch { /* ignore */ }
    finally { setMarkingAll(false); }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try { await deleteDoc(doc(db, 'notifications', id)); }
    catch { /* ignore */ }
    finally { setDeletingId(null); }
  };

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all',    label: 'All',    count: notifications.length },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'read',   label: 'Read',   count: readCount },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[--foreground] mb-1.5">Notifications</h1>
          <p className="text-[--muted-foreground]">Stay updated with your reservation activity</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[--border] rounded-xl text-sm font-medium text-[--foreground] hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            {markingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            Mark all as read
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total',  value: notifications.length, color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Unread', value: unreadCount,          color: 'text-red-600',    bg: 'bg-red-50' },
          { label: 'Read',   value: readCount,            color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${color}`}>{loading ? '—' : value}</p>
            <p className="text-sm text-[--muted-foreground]">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === key ? 'bg-white text-[--foreground] shadow-sm' : 'text-[--muted-foreground] hover:text-[--foreground]'
            }`}
          >
            {label}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
              filter === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-[--muted-foreground]'
            }`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Notification list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[--border] p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[--foreground] font-medium mb-1">
            {filter === 'unread' ? 'All caught up!' : 'No notifications'}
          </p>
          <p className="text-sm text-[--muted-foreground]">
            {filter === 'unread'
              ? 'You have no unread notifications.'
              : "Notifications will appear here when there's activity on your reservations."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((n) => {
            const { icon: Icon, bg, color } = getNotificationIcon(n.title);
            return (
              <div
                key={n.id}
                onClick={() => handleMarkRead(n)}
                className={`group flex items-start gap-4 p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-sm ${
                  !n.read
                    ? 'bg-blue-50/50 border-blue-200 hover:bg-blue-50'
                    : 'bg-white border-[--border] hover:bg-gray-50'
                }`}
              >
                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm mb-0.5 ${!n.read ? 'font-semibold text-[--foreground]' : 'font-medium text-[--foreground]'}`}>
                      {n.title}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {!n.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                        disabled={deletingId === n.id}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-[--muted-foreground] hover:text-red-500 transition-all disabled:opacity-50"
                      >
                        {deletingId === n.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[--muted-foreground] leading-relaxed">{n.message}</p>
                  <p className="text-xs text-[--muted-foreground] mt-1.5">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
