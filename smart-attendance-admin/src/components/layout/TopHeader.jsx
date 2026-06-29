import React from 'react';
import { useAppConfig } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function TopHeader({ title, breadcrumbs = [] }) {
  const { config } = useAppConfig();
  const navigate = useNavigate();

  // Derive initials from real user name (set in AppContext after login via /auth/me)
  const displayName = config.userName || 'Admin';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header
      className="h-16 flex items-center justify-between px-8 shrink-0"
      style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center gap-2">
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1.5 mr-2">
            {breadcrumbs.map((bc, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/</span>}
                <span className="text-xs" style={{ color: i === breadcrumbs.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {bc}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {config.currentSemester && (
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--accent-primary)' }}
            >
              {config.currentSemester}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {config.academicYear}
            </span>
          </div>
        )}

        {/* Profile avatar — real initials from /auth/me */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
          title={displayName}
          style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}