import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false, requireType = false }) {
  const [typed, setTyped] = useState('');

  if (!open) return null;

  const canConfirm = requireType ? typed === 'CONFIRM' : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
          <X size={16} />
        </button>
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg" style={{ backgroundColor: danger ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)' }}>
            <AlertTriangle size={20} style={{ color: danger ? 'var(--accent-red)' : 'var(--accent-primary)' }} />
          </div>
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{message}</p>
          </div>
        </div>

        {requireType && (
          <div className="mb-4">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
              Type CONFIRM to proceed
            </label>
            <input
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder="CONFIRM"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
              style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
            />
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/5" style={{ color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.15)' }}>
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); setTyped(''); onClose(); }}
            disabled={!canConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
            style={{ backgroundColor: danger ? 'var(--accent-red)' : 'var(--accent-primary)', color: danger ? '#fff' : 'var(--bg-deep)' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}