import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', confirmVariant = 'primary', loading }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const btnStyles = {
    primary: { backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' },
    danger: { backgroundColor: 'var(--accent-red)', color: '#fff' },
    success: { backgroundColor: 'var(--accent-green)', color: '#fff' },
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end xl:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-full xl:max-w-md mx-auto rounded-t-2xl xl:rounded-xl p-6 border"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        onClick={e => e.stopPropagation()}>

        {/* Mobile drag handle */}
        <div className="xl:hidden w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: 'var(--text-muted)' }} />

        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{message}</p>

        <div className="flex gap-3 justify-end">
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-[var(--bg-raised)]"
            style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50"
            style={btnStyles[confirmVariant]}>
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}