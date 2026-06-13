import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import BottomNav from './BottomNav';
import { useStudentAuth } from '../../context/AuthContext';

export default function AppShell() {
  const { isLoggedIn } = useStudentAuth();

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-deep)' }}>
      <Sidebar />
      <div className="lg:ml-60 min-h-screen flex flex-col">
        <TopHeader />
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}