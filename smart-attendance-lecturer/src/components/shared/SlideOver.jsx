import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function SlideOver({ open, onClose, title, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) { window.addEventListener('keydown', handler); document.body.style.overflow = 'hidden'; }
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Desktop: right slide */}
      <div className="hidden xl:block absolute right-0 top-0 bottom-0 w-[440px] overflow-y-auto scrollbar-thin border-l transition-transform"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-raised)]"
            style={{ color: 'var(--text-muted)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>

      {/* Mobile: bottom sheet */}
      <div className="xl:hidden absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto scrollbar-thin rounded-t-2xl border-t"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <div className="sticky top-0 z-10 pt-3 pb-2 px-5"
          style={{ backgroundColor: 'var(--bg-surface)' }}>
          <div className="w-10 h-1 rounded-full mx-auto mb-3" style={{ backgroundColor: 'var(--text-muted)' }} />
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-5 pt-2">{children}</div>
      </div>
    </div>
  );
}