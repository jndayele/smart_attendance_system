import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppConfig } from '@/context/AppContext';
import {
  LayoutDashboard, Building2, GraduationCap, BookOpen, Calendar,
  Users, UserCheck, BarChart3, Bell, Settings, LogOut
} from 'lucide-react';

const navSections = [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'ACADEMICS',
    items: [
      { label: 'Departments', path: '/departments', icon: Building2 },
      { label: 'Programmes', path: '/programmes', icon: GraduationCap },
      { label: 'Courses', path: '/courses', icon: BookOpen },
      { label: 'Academic Years', path: '/academic-years', icon: Calendar },
    ],
  },
  {
    label: 'USERS',
    items: [
      { label: 'Lecturers', path: '/lecturers', icon: Users },
      { label: 'Students', path: '/students', icon: UserCheck },
    ],
  },
  {
    label: 'REPORTS',
    items: [
      { label: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const { config, logout } = useAppConfig();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();          // clears JWT from localStorage + resets context state
    navigate('/login');
  };

  // Derive initials from the real user name (populated after login via /auth/me)
  const displayName = config.userName || 'Admin';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 flex flex-col" style={{ backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)' }}>
      {/* Logo area — school logo + short code */}
      <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {config.logoUrl ? (
          <img src={config.logoUrl} alt="Logo" className="w-9 h-9 rounded-lg object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-primary)' }}>
            <GraduationCap size={20} style={{ color: 'var(--bg-deep)' }} />
          </div>
        )}
        <div>
          <h1 className="font-heading text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            {config.shortCode || 'SAS'}
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navSections.map(section => (
          <div key={section.label}>
            <p className="px-3 mb-2 text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive ? 'nav-active' : ''
                    }`
                  }
                  style={({ isActive }) => ({
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  })}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Admin profile card — shows real name from /auth/me */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {displayName}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>System Admin</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}