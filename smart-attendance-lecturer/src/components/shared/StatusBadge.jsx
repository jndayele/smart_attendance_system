import React from 'react';

const statusConfig = {
  good: { label: 'Good Standing', dotColor: 'var(--accent-green)', bgColor: 'rgba(16,185,129,0.1)', textColor: 'var(--accent-green)' },
  'at-risk': { label: 'At Risk', dotColor: 'var(--accent-amber)', bgColor: 'rgba(245,158,11,0.1)', textColor: 'var(--accent-amber)' },
  defaulter: { label: 'Defaulter', dotColor: 'var(--accent-red)', bgColor: 'rgba(239,68,68,0.1)', textColor: 'var(--accent-red)' },
  completed: { label: 'Completed', dotColor: 'var(--accent-green)', bgColor: 'rgba(16,185,129,0.1)', textColor: 'var(--accent-green)' },
  live: { label: 'Live', dotColor: 'var(--accent-primary)', bgColor: 'rgba(245,158,11,0.1)', textColor: 'var(--accent-primary)' },
  active: { label: 'Active', dotColor: 'var(--accent-green)', bgColor: 'rgba(16,185,129,0.1)', textColor: 'var(--accent-green)' },
  inactive: { label: 'Inactive', dotColor: 'var(--text-muted)', bgColor: 'rgba(74,92,128,0.15)', textColor: 'var(--text-muted)' },
  ended: { label: 'Ended', dotColor: 'var(--text-muted)', bgColor: 'rgba(74,92,128,0.15)', textColor: 'var(--text-muted)' },
};

export default function StatusBadge({ status, label: customLabel }) {
  const cfg = statusConfig[status] || statusConfig.active;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: cfg.bgColor, color: cfg.textColor }}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status === 'live' ? 'animate-pulse-live' : ''}`}
        style={{ backgroundColor: cfg.dotColor }} />
      {customLabel || cfg.label}
    </span>
  );
}