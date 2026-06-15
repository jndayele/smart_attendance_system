import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import { AppProvider } from './context/AppContext';
import { LecturerAuthProvider, useLecturerAuth } from './context/LecturerAuthContext';
import { SessionProvider } from './context/SessionContext';
import { ToastProvider } from './components/shared/ToastManager';
import AppShell from './components/layout/AppShell';

import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AccountActivationPage from './pages/AccountActivationPage';
import DashboardPage from './pages/DashboardPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import ActiveSessionPage from './pages/ActiveSessionPage';
import SessionHistoryPage from './pages/SessionHistoryPage';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';

function LecturerProtectedRoute({ children }) {
  const { lecturer } = useLecturerAuth();
  if (!lecturer.isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { lecturer } = useLecturerAuth();
  if (lecturer.isLoggedIn) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/activate" element={<AccountActivationPage />} />

      {/* Protected routes inside AppShell */}
      <Route element={
        <LecturerProtectedRoute>
          <AppShell />
        </LecturerProtectedRoute>
      }>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="/session/active" element={<ActiveSessionPage />} />
        <Route path="/sessions" element={<SessionHistoryPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

const AuthenticatedApp = () => {
  return (
    <AppProvider>
      <LecturerAuthProvider>
        <SessionProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </SessionProvider>
      </LecturerAuthProvider>
    </AppProvider>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AuthenticatedApp />
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App