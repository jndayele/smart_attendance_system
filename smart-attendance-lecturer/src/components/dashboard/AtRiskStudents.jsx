import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { allStudentsPool } from '../../data/mockData';

export default function AtRiskStudents() {
  const atRisk = allStudentsPool.filter(s => s.status === 'at-risk' || s.status === 'defaulter').slice(0, 5);

  if (atRisk.length === 0) {
    return (
      <div className="rounded-[10px] border p-5" style={{ backgroundColor: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.2)' }}>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" style={{ color: 'var(--accent-green)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--accent-green)' }}>
            All students are above threshold ✓
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[10px] border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
      <div className="flex items-center justify-between p-4 xl:p-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Students at Risk</h3>
        <Link to="/reports" className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent-primary)' }}>
          View all 8 <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
        {atRisk.map(student => {
          const initials = student.name.split(' ').map(n => n[0]).join('');
          return (
            <div key={student.id} className="flex items-center gap-3 p-4 transition-colors hover:bg-[var(--bg-raised)]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                style={{
                  backgroundColor: student.status === 'defaulter' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                  color: student.status === 'defaulter' ? 'var(--accent-red)' : 'var(--accent-amber)',
                }}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{student.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {student.course || 'CS301'}
                </p>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--accent-red)' }}>
                {student.percentage}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}