import React from 'react';

export default function StatCard({ icon: Icon, label, value, subtext, borderColor }) {
  return (
    <div className="rounded-xl p-4 transition-all duration-150 hover:-translate-y-0.5"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderTop: `3px solid ${borderColor}`,
      }}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <Icon size={16} style={{ color: borderColor }} />
      </div>
      <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      {subtext && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{subtext}</p>}
    </div>
  );
}