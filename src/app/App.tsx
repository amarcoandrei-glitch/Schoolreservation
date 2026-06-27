import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { logoutUser } from '../lib/authService';
import { ModernLoginPage } from './pages/auth/ModernLoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ModernStudentDashboard } from './pages/student/ModernStudentDashboard';
import { BrowseEquipment } from './pages/student/BrowseEquipment';
import { EquipmentDetails } from './pages/student/EquipmentDetails';
import { MyReservations } from './pages/student/MyReservations';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { EquipmentManagement } from './pages/admin/EquipmentManagement';
import { UserManagement } from './pages/admin/UserManagement';
import { ReportsAnalytics } from './pages/admin/ReportsAnalytics';
import { FirebaseTestPanel } from './pages/admin/FirebaseTestPanel';
import { ApprovalsPage } from './pages/admin/ApprovalsPage';
import { BorrowingPage } from './pages/admin/BorrowingPage';
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { CourseEquipment } from './pages/faculty/CourseEquipment';
import { StudentRequests } from './pages/faculty/StudentRequests';
import { NotificationsPage } from './pages/shared/NotificationsPage';
import { ProfilePage } from './pages/shared/ProfilePage';
import { HistoryPage } from './pages/shared/HistoryPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { DashboardLayout } from './components/layout/DashboardLayout';

type AuthView = 'login' | 'register' | 'forgot-password';

function AppContent() {
  const { userProfile, authLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState('/');
  const [authView, setAuthView] = useState<AuthView>('login');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [detailReturnPath, setDetailReturnPath] = useState('/student/equipment');

  const navigateToDetails = (id: string, returnPath = '/student/equipment') => {
    setSelectedEquipmentId(id);
    setDetailReturnPath(returnPath);
    const basePath = returnPath.replace(/\/details$/, '');
    const detailsPath = `${basePath}/details`;
    setCurrentPath(detailsPath);
  };

  // Navigate to role dashboard when user logs in
  useEffect(() => {
    if (userProfile) {
      if (userProfile.role === 'student') setCurrentPath('/student/dashboard');
      else if (userProfile.role === 'faculty') setCurrentPath('/faculty/dashboard');
      else if (userProfile.role === 'admin') setCurrentPath('/admin/dashboard');
    }
  }, [userProfile?.uid]);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentPath('/');
    setAuthView('login');
  };

  // Loading screen while Firebase checks auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--background]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-[--muted-foreground] text-sm">Loading EquipHub…</p>
        </div>
      </div>
    );
  }

  // Auth pages
  if (!userProfile) {
    if (authView === 'register') {
      return (
        <RegisterPage
          onSwitchToLogin={() => setAuthView('login')}
          onRegisterSuccess={() => {}} // onAuthStateChanged handles the redirect
        />
      );
    }
    if (authView === 'forgot-password') {
      return <ForgotPasswordPage />;
    }
    return (
      <ModernLoginPage
        onLogin={() => {}} // onAuthStateChanged handles the redirect
        onSwitchToRegister={() => setAuthView('register')}
      />
    );
  }

  // Dashboard pages
  const renderPage = () => {
    // Student Routes
    if (currentPath === '/student/dashboard') return <ModernStudentDashboard onViewDetails={(id) => navigateToDetails(id, '/student/dashboard')} />;
    if (currentPath === '/student/equipment') return <BrowseEquipment onViewDetails={(id) => navigateToDetails(id, '/student/equipment')} />;
    if (
      currentPath === '/student/equipment/details' ||
      currentPath === '/faculty/equipment/details' ||
      currentPath === '/student/reservations/details' ||
      currentPath === '/faculty/reservations/details'
    ) return <EquipmentDetails equipmentId={selectedEquipmentId} onBack={() => setCurrentPath(detailReturnPath)} />;
    if (currentPath === '/student/reservations') return <MyReservations onViewDetails={(id) => navigateToDetails(id, '/student/reservations')} />;
    if (currentPath === '/student/history') return <HistoryPage />;
    if (currentPath === '/student/notifications') return <NotificationsPage />;
    if (currentPath === '/student/profile') return <ProfilePage />;

    // Faculty Routes
    if (currentPath === '/faculty/dashboard') return <FacultyDashboard />;
    if (currentPath === '/faculty/equipment') return <BrowseEquipment onViewDetails={(id) => navigateToDetails(id, '/faculty/equipment')} />;
    if (currentPath === '/faculty/department') return <CourseEquipment />;
    if (currentPath === '/faculty/requests') return <StudentRequests />;
    if (currentPath === '/faculty/reservations') return <MyReservations onViewDetails={(id) => navigateToDetails(id, '/faculty/reservations')} />;
    if (currentPath === '/faculty/history') return <HistoryPage />;
    if (currentPath === '/faculty/notifications') return <NotificationsPage />;
    if (currentPath === '/faculty/profile') return <ProfilePage />;

    // Admin Routes
    if (currentPath === '/admin/dashboard') return <AdminDashboard />;
    if (currentPath === '/admin/equipment') return <EquipmentManagement />;
    if (currentPath === '/admin/approvals') return <ApprovalsPage />;
    if (currentPath === '/admin/borrowing') return <BorrowingPage />;
    if (currentPath === '/admin/returns') return <BorrowingPage />;
    if (currentPath === '/admin/reports') return <ReportsAnalytics />;
    if (currentPath === '/admin/users') return <UserManagement />;
    if (currentPath === '/admin/firebase') return <FirebaseTestPanel />;
    if (currentPath === '/admin/notifications') return <NotificationsPage />;
    if (currentPath === '/admin/settings') return <AdminSettingsPage />;

    return <NotificationsPlaceholder title="Page Not Found" desc="The requested page could not be found" />;
  };

  return (
    <DashboardLayout
      role={userProfile.role}
      currentPath={currentPath}
      userName={userProfile.name}
      onNavigate={setCurrentPath}
      onLogout={handleLogout}
    >
      {renderPage()}
    </DashboardLayout>
  );
}

function NotificationsPlaceholder({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[--foreground] mb-2">{title}</h1>
        <p className="text-[--muted-foreground]">{desc}</p>
      </div>
      <div className="bg-white rounded-lg border border-[--border] p-12 text-center">
        <p className="text-[--muted-foreground]">Coming soon…</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
