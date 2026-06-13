import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-deep)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col ml-60 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}