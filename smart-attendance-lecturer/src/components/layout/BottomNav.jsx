import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Radio, BarChart3, UserCircle } from 'lucide-react';

const tabs = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/courses', label: 'Courses', icon: BookOpen },
  { path: '/session/active', label: 'Sessions', icon: Radio },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/profile', label: 'Profile', icon: UserCircle },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-40 flex items-center justify-around"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
      {tabs.map(tab => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className="flex flex-col items-center justify-center gap-0.5 w-full h-full"
        >
          {({ isActive }) => (
            <>
              <tab.icon className="w-5 h-5" style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
              <span className="text-[10px] font-medium" style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                {tab.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}