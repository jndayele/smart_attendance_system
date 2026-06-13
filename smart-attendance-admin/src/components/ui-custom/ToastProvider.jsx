import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors = {
  success: 'var(--accent-green)',
  error: 'var(--accent-red)',
  info: 'var(--accent-blue)',
  warning: '#F59E0B',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[60] space-y-2 max-w-sm">
        {toasts.map(toast => {
          const Icon = icons[toast.type];
          return (
            <div
              key={toast.id}
              className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl"
              style={{
                backgroundColor: 'var(--bg-raised)',
                border: `1px solid ${colors[toast.type]}30`,
                animation: 'toastIn 0.3s ease-out',
              }}
            >
              <Icon size={18} style={{ color: colors[toast.type], flexShrink: 0 }} />
              <p className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} className="p-0.5 hover:bg-white/5 rounded" style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}