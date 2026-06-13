import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';
import { allSessions } from '../../data/mockData';

export default function RecentSessions() {
  const sessions = allSessions.slice(0, 5);

  return (
    <div className="rounded-[10px] border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
      <div className="flex items-center justify-between p-4 xl:p-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Sessions</h3>
        <Link to="/sessions" className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent-primary)' }}>
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden xl:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {['Course', 'Date', 'Present', 'Total', 'Rate', 'Status'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id} className="transition-colors hover:bg-[var(--bg-raised)] cursor-pointer"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td className="px-5 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                  {s.courseName}
                  <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>{s.courseCode}</span>
                </td>
                <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{s.date}</td>
                <td className="px-5 py-3" style={{ color: 'var(--accent-green)' }}>{s.present}</td>
                <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{s.total}</td>
                <td className="px-5 py-3 font-medium" style={{
                  color: s.percentage >= 75 ? 'var(--accent-green)' : s.percentage >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)'
                }}>{s.percentage}%</td>
                <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="xl:hidden divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
        {sessions.map(s => (
          <div key={s.id} className="p-4 transition-colors hover:bg-[var(--bg-raised)]"
            style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {s.courseName} <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.courseCode}</span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.date} · {s.time}</p>
              </div>
              <StatusBadge status={s.status} />
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent-green)' }}>{s.present} present</span>
              <span>/ {s.total}</span>
              <span className="font-medium" style={{
                color: s.percentage >= 75 ? 'var(--accent-green)' : s.percentage >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)'
              }}>{s.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}