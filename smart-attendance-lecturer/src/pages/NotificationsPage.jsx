import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/shared/ToastManager';
import { Bell, AlertCircle, Clock, CheckCircle, BarChart3, Settings, CircleDot } from 'lucide-react';
import { notifications as initialNotifications } from '../data/mockData';

const typeConfig = {
  threshold_alert: { icon: AlertCircle, color: 'var(--accent-red)', bg: 'rgba(239,68,68,0.1)' },
  session_reminder: { icon: Clock, color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.1)' },
  session_completed: { icon: CheckCircle, color: 'var(--accent-green)', bg: 'rgba(16,185,129,0.1)' },
  weekly_summary: { icon: BarChart3, color: 'var(--accent-blue)', bg: 'rgba(59,130,246,0.1)' },
  system: { icon: Settings, color: 'var(--accent-purple)', bg: 'rgba(139,92,246,0.1)' },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [notifs, setNotifs] = useState(initialNotifications);
  const [filter, setFilter] = useState('all');
  const [prefs, setPrefs] = useState({
    threshold: true, session_open: true, weekly_summary: true, new_student: false,
  });

  const unreadCount = notifs.filter(n => !n.read).length;
  const filters = ['all', 'unread', 'alerts', 'reminders'];

  const filtered = notifs.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'alerts') return n.type === 'threshold_alert';
    if (filter === 'reminders') return n.type === 'session_reminder';
    return true;
  });

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    addToast('All notifications marked as read', 'success');
  };

  const handleClick = (notif) => {
    setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    if (notif.link) navigate(notif.link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl xl:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ color: 'var(--text-secondary)' }}>
            Mark All Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-all"
            style={{
              borderColor: filter === f ? 'var(--accent-primary)' : 'transparent',
              color: filter === f ? 'var(--accent-primary)' : 'var(--text-muted)',
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filtered.length > 0 ? (
        <div className="space-y-1">
          {filtered.map(notif => {
            const cfg = typeConfig[notif.type] || typeConfig.system;
            const Icon = cfg.icon;
            return (
              <div key={notif.id} onClick={() => handleClick(notif)}
                className="flex gap-3 p-4 rounded-lg cursor-pointer transition-colors hover:bg-[var(--bg-raised)]"
                style={{ backgroundColor: notif.read ? 'transparent' : 'rgba(245,158,11,0.03)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: cfg.bg }}>
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notif.read ? '' : 'font-semibold'}`} style={{ color: 'var(--text-primary)' }}>
                    {notif.title}
                  </p>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{notif.description}</p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{notif.time}</p>
                </div>
                {!notif.read && (
                  <div className="flex-shrink-0 mt-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>You're all caught up!</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>No new notifications.</p>
        </div>
      )}

      {/* Preferences */}
      <div className="rounded-[10px] border p-5" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Notification Preferences</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Email me when...</p>
        <div className="space-y-3">
          {[
            { key: 'threshold', label: 'A student falls below threshold', on: true },
            { key: 'session_open', label: 'A session has not been closed after 2 hours', on: true },
            { key: 'weekly_summary', label: 'Weekly attendance summary every Monday', on: true },
            { key: 'new_student', label: 'New student enrolled in my course', on: false },
          ].map(p => (
            <div key={p.key} className="flex items-center justify-between py-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{p.label}</span>
              <button onClick={() => setPrefs(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                className="w-10 h-5 rounded-full transition-colors relative"
                style={{ backgroundColor: prefs[p.key] ? 'var(--accent-primary)' : 'var(--bg-raised)' }}>
                <div className="absolute w-4 h-4 rounded-full bg-white top-0.5 transition-all"
                  style={{ left: prefs[p.key] ? '22px' : '2px' }} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}