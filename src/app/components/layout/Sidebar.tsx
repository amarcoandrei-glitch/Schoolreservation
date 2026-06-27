import { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Package, Calendar, History,
  Bell, User, Settings, Users, BarChart3,
  CheckSquare, Archive, ClipboardList, FlameKindling,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../../contexts/AuthContext';
import { useUnreadCount } from '../../../hooks/useUnreadCount';
import { usePendingCount } from '../../../hooks/usePendingCount';

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  badgeKey?: 'unread' | 'pending';
}

interface SidebarProps {
  role: 'student' | 'faculty' | 'admin';
  currentPath: string;
  onNavigate: (path: string) => void;
}

const navItems: Record<string, NavItem[]> = {
  student: [
    { icon: LayoutDashboard, label: 'Dashboard',       href: '/student/dashboard' },
    { icon: Package,         label: 'Browse Equipment', href: '/student/equipment' },
    { icon: Calendar,        label: 'My Reservations', href: '/student/reservations' },
    { icon: History,         label: 'History',          href: '/student/history' },
    { icon: Bell,            label: 'Notifications',    href: '/student/notifications', badgeKey: 'unread' },
    { icon: User,            label: 'Profile',          href: '/student/profile' },
  ],
  faculty: [
    { icon: LayoutDashboard, label: 'Dashboard',        href: '/faculty/dashboard' },
    { icon: Package,         label: 'Browse Equipment', href: '/faculty/equipment' },
    { icon: Archive,         label: 'My Equipment',     href: '/faculty/department' },
    { icon: Users,           label: 'Student Requests', href: '/faculty/requests', badgeKey: 'unread' },
    { icon: Calendar,        label: 'My Reservations',  href: '/faculty/reservations' },
    { icon: History,         label: 'History',           href: '/faculty/history' },
    { icon: Bell,            label: 'Notifications',     href: '/faculty/notifications', badgeKey: 'unread' },
    { icon: User,            label: 'Profile',           href: '/faculty/profile' },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard',     href: '/admin/dashboard' },
    { icon: Package,         label: 'Equipment',     href: '/admin/equipment' },
    { icon: CheckSquare,     label: 'Approvals',     href: '/admin/approvals', badgeKey: 'pending' },
    { icon: Archive,         label: 'Borrowing',     href: '/admin/borrowing' },
    { icon: ClipboardList,   label: 'Returns',       href: '/admin/returns' },
    { icon: BarChart3,       label: 'Reports',       href: '/admin/reports' },
    { icon: Users,           label: 'Users',         href: '/admin/users' },
    { icon: Bell,            label: 'Notifications', href: '/admin/notifications', badgeKey: 'unread' },
    { icon: FlameKindling,   label: 'Firebase',      href: '/admin/firebase' },
    { icon: Settings,        label: 'Settings',      href: '/admin/settings' },
  ],
};

function LiveBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = count > 99 ? '99+' : String(count);
  return (
    <span
      key={count}
      className="min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-[11px] font-bold rounded-full shadow flex items-center justify-center transition-all duration-300 ease-out"
      style={{ animation: 'badgePop 0.25s ease-out' }}
    >
      {label}
    </span>
  );
}

export function Sidebar({ role, currentPath, onNavigate }: SidebarProps) {
  const { userProfile } = useAuth();
  const unreadCount  = useUnreadCount(userProfile?.uid);
  const pendingCount = usePendingCount();

  const items = navItems[role] ?? [];

  const getCount = (key?: 'unread' | 'pending') => {
    if (!key) return 0;
    if (key === 'unread')  return unreadCount;
    if (key === 'pending') return pendingCount;
    return 0;
  };

  return (
    <>
      {/* Badge pop animation */}
      <style>{`
        @keyframes badgePop {
          0%   { transform: scale(0.6); opacity: 0; }
          70%  { transform: scale(1.15); }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>

      <aside className="w-64 bg-white border-r border-[--border] h-screen fixed left-0 top-0 overflow-y-auto shadow-sm">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[--foreground]">EquipHub</h1>
              <p className="text-xs text-[--muted-foreground] capitalize">{role} Portal</p>
            </div>
          </div>

          {/* Nav items */}
          <nav className="space-y-1.5">
            {items.map((item) => {
              const isActive = currentPath === item.href;
              const count = getCount(item.badgeKey);

              return (
                <button
                  key={item.href}
                  onClick={() => onNavigate(item.href)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-blue-50/50 text-[--primary-blue] shadow-sm'
                      : 'text-[--foreground] hover:bg-[--secondary] hover:translate-x-0.5'
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <LiveBadge count={count} />
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
