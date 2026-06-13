import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppConfig } from '@/context/AppContext';
import { ToastProvider } from '@/components/ui-custom/ToastProvider';
import AppShell from '@/components/layout/AppShell';
import SetupPage from '@/pages/SetupPage';
import LoginPage from '@/pages/LoginPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPassword from '@/pages/ResetPassword';
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

  // Show full-screen spinner while we bootstrap (check setup-status + validate token)
  if (config.isBootstrapping) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: '#0F1623' }}>
        <div className="w-8 h-8 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  // ① Institution not set up yet → show setup wizard
  if (!config.isSetupComplete) {
    return (
      <Routes>
        <Route path="/setup" element={<SetupPage />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    );
  }

  // ② Set up but not authenticated → show auth pages
  if (!config.isLoggedIn) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // ③ Authenticated → show the main admin panel
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

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AppProvider>
        <ToastProvider>
          <Router>
            <AppRoutes />
          </Router>
          <Toaster />
        </ToastProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;