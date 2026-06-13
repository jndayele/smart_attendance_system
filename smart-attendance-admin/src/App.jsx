import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { AppProvider, useAppConfig } from '@/context/AppContext';
import { ToastProvider } from '@/components/ui-custom/ToastProvider';
import AppShell from '@/components/layout/AppShell';
import SetupPage from '@/pages/SetupPage';
import LoginPage from '@/pages/LoginPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import DepartmentsPage from '@/pages/DepartmentsPage';
import ProgrammesPage from '@/pages/ProgrammesPage';
import CoursesPage from '@/pages/CoursesPage';
import AcademicYearsPage from '@/pages/AcademicYearsPage';
import LecturersPage from '@/pages/LecturersPage';
import StudentsPage from '@/pages/StudentsPage';
import ReportsPage from '@/pages/ReportPage';
import NotificationsPage from '@/pages/NotificationsPage';
import SettingsPage from '@/pages/SettingsPage';

function AppRoutes() {
  const { config } = useAppConfig();

  // Not setup yet → force to setup
  if (!config.isSetupComplete) {
    return (
      <Routes>
        <Route path="/setup" element={<SetupPage />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    );
  }

  // Setup complete but not logged in
  if (!config.isLoggedIn) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Authenticated
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/programmes" element={<ProgrammesPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/academic-years" element={<AcademicYearsPage />} />
        <Route path="/lecturers" element={<LecturersPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/setup" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: '#0F1623' }}>
        <div className="w-8 h-8 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  return <AppRoutes />;
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <AppProvider>
          <ToastProvider>
            <Router>
              <AuthenticatedApp />
            </Router>
            <Toaster />
          </ToastProvider>
        </AppProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App