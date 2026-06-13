import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, CheckSquare, ClipboardList, UserCircle, LogOut, GraduationCap } from 'lucide-react';
import { useAppConfig } from '../../context/AppContext';
import { useStudentAuth } from '../../context/AuthContext';
import { useSession } from '../../context/SessionContext';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/courses', icon: BookOpen, label: 'My Courses' },
  { to: '/mark-attendance', icon: CheckSquare, label: 'Mark Attendance', pulse: true },
  { to: '/history', icon: ClipboardList, label: 'Attendance History' },
  { to: '/profile', icon: UserCircle, label: 'Profile' },
];

export default function Sidebar() {
  const { shortCode, logoUrl } = useAppConfig();
  const { name, programme, level, logout } = useStudentAuth();
  const { isSessionActive } = useSession();
  const navigate = useNavigate();

  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="hidden lg:flex flex-col w-60 h-screen fixed left-0 top-0 z-40"
      style={{ backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)' }}>
      
      {/* Logo section */}
      <div className="p-5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {logoUrl ? (
          <img src={logoUrl} alt="" className="w-9 h-9 rounded-lg object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-primary)' }}>
            <GraduationCap size={20} style={{ color: 'var(--bg-deep)' }} />
          </div>
        )}
        <div>
          <p className="font-playfair text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>{shortCode}</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Student Portal</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative ${
                isActive ? '' : 'hover:opacity-80'
              }`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
            })}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
            {item.pulse && isSessionActive && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full animate-pulse-dot"
                style={{ backgroundColor: 'var(--accent-primary)' }} />
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--accent-green)' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{programme} · {level}</p>
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded-md transition-colors hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}