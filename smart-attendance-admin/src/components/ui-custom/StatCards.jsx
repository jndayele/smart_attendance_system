import React from 'react';

export default function StatCard({ label, value, trend, trendUp, icon: Icon, borderColor }) {
  return (
    <div
      className="rounded-xl p-5 transition-colors hover:bg-opacity-80"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderTop: `3px solid ${borderColor || 'var(--accent-primary)'}`,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          <p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
          {trend && (
            <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: trendUp ? 'var(--accent-green)' : trendUp === false ? 'var(--accent-red)' : 'var(--text-muted)' }}>
              {trendUp ? '↑' : trendUp === false ? '↓' : '—'} {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
            <Icon size={20} style={{ color: borderColor || 'var(--accent-primary)' }} />
          </div>
        )}
      </div>
    </div>
  );
}