import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS = {
  success: '#10B981',
  error: '#EF4444',
  info: '#3B82F6',
  warning: '#F59E0B',
};

function ToastItem({ toast, onRemove }) {
  const Icon = ICONS[toast.type] || Info;

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div className="animate-fade-in-up flex items-start gap-3 px-4 py-3 rounded-lg shadow-xl max-w-sm w-full"
      style={{ backgroundColor: 'var(--bg-raised)', border: `1px solid ${COLORS[toast.type]}30` }}>
      <Icon size={18} style={{ color: COLORS[toast.type], flexShrink: 0, marginTop: 2 }} />
      <p className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} style={{ color: 'var(--text-muted)' }}>
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-[100] flex flex-col gap-2 items-end">
        {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={removeToast} />)}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);