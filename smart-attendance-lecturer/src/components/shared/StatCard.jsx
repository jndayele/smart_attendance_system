import React from 'react';

export default function StatCard({ label, value, subtitle, icon: Icon, borderColor, trend }) {
  return (
    <div className="rounded-[10px] p-4 xl:p-5 border transition-colors hover:bg-[var(--bg-raised)]"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
        borderTopWidth: '3px',
        borderTopColor: borderColor,
      }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            {label}
          </p>
          <p className="text-2xl xl:text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
          )}
          {trend && (
            <p className="text-xs mt-2 font-medium" style={{ color: 'var(--accent-green)' }}>{trend}</p>
          )}
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${borderColor}15` }}>
            <Icon className="w-[18px] h-[18px]" style={{ color: borderColor }} />
          </div>
        )}
      </div>
    </div>
  );
}