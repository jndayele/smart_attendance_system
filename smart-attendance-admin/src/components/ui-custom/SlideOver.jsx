import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function SlideOver({ open, onClose, title, subtitle, children }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape' && open) onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-[440px] h-full overflow-y-auto flex flex-col"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div className="flex items-start justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            {subtitle && <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 px-6 py-5">
          {children}
        </div>
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}