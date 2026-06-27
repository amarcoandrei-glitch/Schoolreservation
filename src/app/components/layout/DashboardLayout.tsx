import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

interface DashboardLayoutProps {
  children: ReactNode;
  role: 'student' | 'faculty' | 'admin';
  currentPath: string;
  userName: string;
  onNavigate: (path: string) => void;
  onLogout?: () => void;
}

export function DashboardLayout({
  children,
  role,
  currentPath,
  userName,
  onNavigate,
  onLogout,
}: DashboardLayoutProps) {
  const notifPath =
    role === 'student' ? '/student/notifications'
    : role === 'faculty' ? '/faculty/notifications'
    : '/admin/notifications';

  return (
    <div className="min-h-screen bg-[--background]">
      <Sidebar role={role} currentPath={currentPath} onNavigate={onNavigate} />
      <TopNav
        userName={userName}
        userRole={role}
        onLogout={onLogout}
        onNavigateNotifications={() => onNavigate(notifPath)}
      />
      <main className="ml-64 mt-16 p-8">{children}</main>
    </div>
  );
}
