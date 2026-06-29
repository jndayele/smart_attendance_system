import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppConfig } from '../../context/AppContext';
import { useLecturerAuth } from '../../context/LecturerAuthContext';
import { useSession } from '../../context/SessionContext';
import {
  LayoutDashboard, BookOpen, Radio, History, BarChart3,
  Bell, UserCircle, LogOut, GraduationCap,
} from 'lucide-react';

const navItems = [
  { section: 'MAIN', items: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/courses', label: 'My Courses', icon: BookOpen },
  ]},
  { section: 'SESSIONS', items: [
    { path: '/session/active', label: 'Active Session', icon: Radio, liveIndicator: true },
    { path: '/sessions', label: 'Session History', icon: History },
  ]},
  { section: 'REPORTS', items: [
    { path: '/reports', label: 'Attendance Reports', icon: BarChart3 },
  ]},
  { section: 'ACCOUNT', items: [
    { path: '/profile', label: 'Profile & Settings', icon: UserCircle },
  ]},
];

export default function Sidebar() {
  const { config } = useAppConfig();
  const { lecturer, logout } = useLecturerAuth();
  const { sessionState } = useSession();
  const navigate = useNavigate();
  const isLive = sessionState === 'active';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = lecturer.firstName && lecturer.lastName
    ? `${lecturer.firstName[0]}${lecturer.lastName[0]}`
    : 'LC';

  return (
    <aside className="hidden md:flex flex-col md:w-16 xl:w-60 h-screen fixed left-0 top-0 border-r z-40"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
      {/* Logo Section */}
      <div className="p-3 xl:p-5 border-b flex justify-center xl:justify-start" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          {config.logoUrl ? (
            <img src={config.logoUrl} alt="" className="w-9 h-9 rounded-lg object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-primary)' }}>
              <GraduationCap className="w-5 h-5" style={{ color: 'var(--bg-deep)' }} />
            </div>
          )}
          <div className="hidden xl:block overflow-hidden">
            <p className="text-lg font-bold truncate" style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-primary)' }}>
              {config.institutionName || config.shortCode}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{config.tagline || 'Lecturer Portal'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-1.5 xl:px-3">
        {navItems.map(section => (
          <div key={section.section} className="mb-4">
            <p className="hidden xl:block px-3 mb-2 text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: 'var(--text-muted)' }}>
              {section.section}
            </p>
            {section.items.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-center xl:justify-start gap-3 px-2 xl:px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5 ${
                    isActive ? 'xl:border-l-[3px]' : 'xl:border-l-[3px] border-transparent hover:bg-[var(--bg-raised)]'
                  }`
                }
                style={({ isActive }) => isActive ? {
                  borderColor: 'var(--accent-primary)',
                  color: 'var(--accent-primary)',
                  backgroundColor: 'rgba(245,158,11,0.08)',
                } : { color: 'var(--text-secondary)' }}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="hidden xl:inline">{item.label}</span>
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
          </div>
        ))}
      </nav>

      {/* Lecturer Profile */}
      <div className="p-2 xl:p-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex flex-col xl:flex-row items-center gap-2 xl:gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
            style={{ backgroundColor: 'var(--accent-blue)', color: '#fff' }}>
            {initials}
          </div>
          <div className="hidden xl:block flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {lecturer.lecturerName || 'Lecturer'}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {lecturer.department}
            </p>
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-raised)]"
            style={{ color: 'var(--text-muted)' }}>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}