import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { AppProvider } from './context/AppContext';
import { StudentAuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import { ToastProvider } from './components/ui/AppToast';
import AppShell from './components/layout/AppShell';

// Auth pages
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import RegisterPage from './pages/RegisterPage';
import ExpiredLinkPage from './pages/ExpiredLinkPage';

// App pages
import DashboardPage from './pages/DashboardPage';
import CoursesPage from './pages/CoursesPage';
import CourseAttendancePage from './pages/CourseAttendancePage';
import MarkAttendancePage from './pages/MarkAttendancePage';
import AttendanceHistoryPage from './pages/AttendanceHistoryPage';
import ProfilePage from './pages/ProfilePage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-deep)' }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{ borderColor: 'var(--bg-raised)', borderTopColor: 'var(--accent-primary)' }} />
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  return (
    <AppProvider>
      <StudentAuthProvider>
        <SessionProvider>
          <ToastProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/expired" element={<ExpiredLinkPage />} />

              {/* Authenticated routes */}
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/:id/attendance" element={<CourseAttendancePage />} />
                <Route path="/mark-attendance" element={<MarkAttendancePage />} />
                <Route path="/history" element={<AttendanceHistoryPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* Redirects */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </ToastProvider>
        </SessionProvider>
      </StudentAuthProvider>
    </AppProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;