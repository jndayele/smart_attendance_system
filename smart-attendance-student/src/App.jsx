import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from './context/AppContext';
import { StudentAuthProvider, useStudentAuth } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import { ToastProvider } from './components/ui/AppToast';
import AppShell from './components/layout/AppShell';
import { SocketProvider } from './context/SocketContext';

// Auth pages
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import RegisterPage from './pages/RegisterPage';

// App pages
import DashboardPage from './pages/DashboardPage';
import CoursesPage from './pages/CoursesPage';
import CourseAttendancePage from './pages/CourseAttendancePage';
import MarkAttendancePage from './pages/MarkAttendancePage';
import AttendanceHistoryPage from './pages/AttendanceHistoryPage';
import ProfilePage from './pages/ProfilePage';

const AppRoutes = () => {
  const { isBootstrapping } = useStudentAuth();

  if (isBootstrapping) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-deep)' }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{ borderColor: 'var(--bg-raised)', borderTopColor: 'var(--accent-primary)' }} />
      </div>
    );
  }

  return (
    <SocketProvider>
      <SessionProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/register-student" element={<RegisterPage />} />
            <Route path="/register" element={<RegisterPage />} />

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
    </SocketProvider>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AppProvider>
        <StudentAuthProvider>
          <Router>
            <AppRoutes />
          </Router>
          <Toaster />
        </StudentAuthProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;