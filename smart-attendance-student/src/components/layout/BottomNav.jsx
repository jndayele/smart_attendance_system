import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, CheckSquare, ClipboardList, UserCircle } from 'lucide-react';
import { useSession } from '../../context/SessionContext';

const TABS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/courses', icon: BookOpen, label: 'Courses' },
  { to: '/mark-attendance', icon: CheckSquare, label: 'Attend', pulse: true },
  { to: '/history', icon: ClipboardList, label: 'History' },
  { to: '/profile', icon: UserCircle, label: 'Profile' },
];

export default function BottomNav() {
  const { isSessionActive } = useSession();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-16 flex items-center justify-around px-1"
      style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}>
      {TABS.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className="flex flex-col items-center justify-center gap-0.5 min-w-[48px] py-1 relative"
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <tab.icon size={22} style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                {tab.pulse && isSessionActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-pulse-dot"
                    style={{ backgroundColor: 'var(--accent-primary)' }} />
                )}
              </div>
              <span className="text-[10px] font-medium"
                style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                {tab.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}