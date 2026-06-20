import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function RecentSessions({ sessions = [] }) {
  return (
    <div className="rounded-[10px] border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
      <div className="flex items-center justify-between p-4 xl:p-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Sessions</h3>
        <Link to="/sessions" className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent-primary)' }}>
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No sessions yet.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden xl:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Course', 'Date', 'Present', 'Enrolled', 'Rate', 'Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => {
                  const pct = s.attendance_pct ?? 0;
                  const rateColor = pct >= 75 ? 'var(--accent-green)' : pct >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';
                  const status = s.ended_at ? 'completed' : 'active';
                  return (
                    <tr key={s.session_id}
                      className="transition-colors hover:bg-[var(--bg-raised)] cursor-pointer"
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td className="px-5 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                        {s.course_title}
                        <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>{s.course_code}</span>
                      </td>
                      <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(s.session_date)}
                      </td>
                      <td className="px-5 py-3" style={{ color: 'var(--accent-green)' }}>{s.present_count}</td>
                      <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{s.total_enrolled}</td>
                      <td className="px-5 py-3 font-medium" style={{ color: rateColor }}>
                        {pct.toFixed(1)}%
                      </td>
                      <td className="px-5 py-3"><StatusBadge status={status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="xl:hidden divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {sessions.map(s => {
              const pct = s.attendance_pct ?? 0;
              const rateColor = pct >= 75 ? 'var(--accent-green)' : pct >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';
              const status = s.ended_at ? 'completed' : 'active';
              return (
                <div key={s.session_id}
                  className="p-4 transition-colors hover:bg-[var(--bg-raised)]"
                  style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {s.course_title} <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.course_code}</span>
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(s.session_date)} · {formatTime(s.session_date)}
                      </p>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--accent-green)' }}>{s.present_count} present</span>
                    <span>/ {s.total_enrolled}</span>
                    <span className="font-medium" style={{ color: rateColor }}>{pct.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}