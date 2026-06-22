import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import BottomNav from './BottomNav';
import { useStudentAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../ui/AppToast';
import { useEffect } from 'react';

export default function AppShell() {
  const { isLoggedIn, student } = useStudentAuth();
  const { socket } = useSocket();
  const addToast = useToast();

  useEffect(() => {
    if (!socket || !student?.id) return;

    const handleGlobalUpdate = (data) => {
      if (data?.type === 'attendance_marked' && data?.student_id === String(student.id)) {
        addToast(data.message, 'success');
      }
    };

    socket.on('global_update', handleGlobalUpdate);

    return () => {
      socket.off('global_update', handleGlobalUpdate);
    };
  }, [socket, student?.id, addToast]);

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