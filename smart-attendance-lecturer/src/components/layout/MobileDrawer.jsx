import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppConfig } from '../../context/AppContext';
import { useLecturerAuth } from '../../context/LecturerAuthContext';
import { useSession } from '../../context/SessionContext';
import {
  X, LayoutDashboard, BookOpen, Radio, History, BarChart3,
  Bell, UserCircle, LogOut, GraduationCap,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/courses', label: 'My Courses', icon: BookOpen },
  { path: '/session/active', label: 'Active Session', icon: Radio, liveIndicator: true },
  { path: '/sessions', label: 'Session History', icon: History },
  { path: '/reports', label: 'Attendance Reports', icon: BarChart3 },
  { path: '/notifications', label: 'Notifications', icon: Bell, badge: 4 },
  { path: '/profile', label: 'Profile & Settings', icon: UserCircle },
];

export default function MobileDrawer({ open, onClose }) {
  const { config } = useAppConfig();
  const { lecturer, logout } = useLecturerAuth();
  const { sessionState } = useSession();
  const navigate = useNavigate();
  const isLive = sessionState === 'active';

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  const initials = lecturer.firstName && lecturer.lastName
    ? `${lecturer.firstName[0]}${lecturer.lastName[0]}`
    : 'LC';

  return (
    <>
      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 xl:hidden" onClick={onClose} />
      )}

      {/* Drawer */}
      <div className={`fixed inset-y-0 left-0 w-[80%] max-w-xs z-50 xl:hidden transition-transform duration-300 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`} style={{ backgroundColor: 'var(--bg-surface)' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="" className="w-8 h-8 rounded-lg" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-primary)' }}>
                <GraduationCap className="w-4 h-4" style={{ color: 'var(--bg-deep)' }} />
              </div>
            )}
            <span className="text-lg font-bold truncate max-w-[180px]" style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-primary)' }}>
              {config.institutionName || config.shortCode}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium mb-1 transition-all ${
                  isActive ? 'border-l-[3px]' : 'border-l-[3px] border-transparent'
                }`
              }
              style={({ isActive }) => isActive ? {
                borderColor: 'var(--accent-primary)',
                color: 'var(--accent-primary)',
                backgroundColor: 'rgba(245,158,11,0.08)',
              } : { color: 'var(--text-secondary)' }}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.liveIndicator && isLive && (
                <span className="ml-auto w-2 h-2 rounded-full animate-pulse-live"
                  style={{ backgroundColor: 'var(--accent-green)' }} />
              )}
              {item.badge && (
                <span className="ml-auto w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center"
                  style={{ backgroundColor: 'var(--accent-red)', color: '#fff' }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Lecturer Profile */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{ backgroundColor: 'var(--accent-blue)', color: '#fff' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {lecturer.lecturerName}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {lecturer.department}
              </p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--bg-raised)]"
            style={{ color: 'var(--accent-red)' }}>
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}