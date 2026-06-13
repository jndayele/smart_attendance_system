import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

const ToastContext = createContext(null);

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};
const colors = {
  success: 'var(--accent-green)',
  error: 'var(--accent-red)',
  warning: 'var(--accent-amber)',
  info: 'var(--accent-blue)',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-20 xl:bottom-6 right-4 xl:right-6 z-[100] flex flex-col gap-2 items-end">
        {toasts.map(toast => {
          const IconComp = icons[toast.type];
          return (
            <div key={toast.id}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-fade-in-up max-w-xs xl:max-w-sm"
              style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-subtle)' }}>
              <IconComp className="w-4 h-4 flex-shrink-0" style={{ color: colors[toast.type] }} />
              <p className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}