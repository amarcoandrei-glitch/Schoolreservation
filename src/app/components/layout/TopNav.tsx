import { Bell, Search, User, LogOut, Settings, Moon, CheckCheck, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore';
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

interface TopNavProps {
  userName: string;
  userRole: string;
  onLogout?: () => void;
  onNavigateNotifications?: () => void;
}

function timeAgo(ts?: Timestamp): string {
  if (!ts) return '';
  const seconds = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function TopNav({ userName, userRole, onLogout, onNavigateNotifications }: TopNavProps) {
  const { userProfile } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [markingAll, setMarkingAll] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // ── Fetch real notifications (where only — no orderBy to avoid composite index) ──
  useEffect(() => {
    if (!userProfile?.uid) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', userProfile.uid));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Notification))
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setNotifications(items);
    }, () => {}); // silently handle errors
    return unsub;
  }, [userProfile?.uid]);

  // ── Close dropdowns on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (n: Notification) => {
    if (n.read) return;
    try {
      await updateDoc(doc(db, 'notifications', n.id), { read: true });
    } catch { /* ignore */ }
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

  const handleViewAll = () => {
    setShowNotifications(false);
    onNavigateNotifications?.();
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-[--border] fixed top-0 right-0 left-64 z-40 px-6 shadow-sm">
      <div className="h-full flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[--muted-foreground]" />
            <input
              type="search"
              placeholder="Search equipment, reservations..."
              className="w-full pl-12 pr-4 py-2.5 bg-[--background] border border-[--border] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[--primary-blue] transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <button className="p-2.5 text-[--muted-foreground] hover:text-[--foreground] hover:bg-[--secondary] rounded-xl transition-all">
            <Moon className="w-5 h-5" />
          </button>

          {/* ── Notifications ── */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifications((v) => !v); setShowProfile(false); }}
              className="relative p-2.5 text-[--muted-foreground] hover:text-[--foreground] hover:bg-[--secondary] rounded-xl transition-all"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-14 w-96 bg-white rounded-2xl shadow-xl border border-[--border] overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-[--border]">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[--foreground]">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        disabled={markingAll}
                        className="flex items-center gap-1.5 text-xs text-[--primary-blue] hover:underline font-medium disabled:opacity-60"
                      >
                        {markingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-[--border]">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-[--muted-foreground]">
                        <Bell className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkRead(n)}
                          className={`flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                            !n.read ? 'bg-blue-50/60' : ''
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm mb-0.5 ${!n.read ? 'font-semibold text-[--foreground]' : 'font-medium text-[--foreground]'}`}>
                              {n.title}
                            </p>
                            <p className="text-sm text-[--muted-foreground] leading-snug">{n.message}</p>
                            <p className="text-xs text-[--muted-foreground] mt-1">{timeAgo(n.createdAt)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-3 border-t border-[--border] text-center">
                    <button
                      onClick={handleViewAll}
                      className="text-sm text-[--primary-blue] font-medium hover:underline"
                    >
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-8 w-px bg-[--border]" />

          {/* ── Profile ── */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setShowProfile((v) => !v); setShowNotifications(false); }}
              className="flex items-center gap-3 hover:bg-[--secondary] rounded-xl px-3 py-2 transition-all"
            >
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-blue-500/30 bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold">{userName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-semibold text-[--foreground]">{userName}</p>
                <p className="text-xs text-[--muted-foreground] capitalize">{userRole}</p>
              </div>
            </button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-14 w-56 bg-white rounded-2xl shadow-xl border border-[--border] overflow-hidden"
                >
                  <div className="p-4 border-b border-[--border]">
                    <p className="font-medium text-[--foreground]">{userName}</p>
                    <p className="text-sm text-[--muted-foreground] capitalize">{userRole}</p>
                  </div>
                  <div className="p-2">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[--foreground] hover:bg-[--secondary] rounded-lg transition-colors">
                      <User className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[--foreground] hover:bg-[--secondary] rounded-lg transition-colors">
                      <Settings className="w-4 h-4" />
                      <span>Preferences</span>
                    </button>
                  </div>
                  <div className="p-2 border-t border-[--border]">
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[--danger] hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
