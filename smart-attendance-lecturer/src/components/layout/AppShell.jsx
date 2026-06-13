import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import BottomNav from './BottomNav';

export default function AppShell() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-deep)' }}>
      <Sidebar />
      <div className="md:ml-16 xl:ml-60 flex flex-col min-h-screen">
        <TopHeader />
        <main className="flex-1 p-4 xl:p-6 pb-20 md:pb-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}