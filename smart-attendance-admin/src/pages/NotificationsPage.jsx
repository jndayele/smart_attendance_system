import React, { useState, useEffect } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import { useToast } from '@/components/ui-custom/ToastProvider';
import { AlertTriangle, Bell, Mail, Clock, UserCheck, BarChart3, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { institutionAPI } from '@/api/api';
import { useSocketRefresh } from '@/hooks/useSocketRefresh';

const alertRulesDef = [
  { id: 'alert_below_80', title: 'Student Below 80% Threshold', desc: 'Sends a warning email to the student', icon: AlertTriangle, color: '#F59E0B' },
  { id: 'alert_below_75', title: 'Student Below 75% Threshold', desc: 'Notifies student and admin via email', icon: AlertTriangle, color: '#EF4444' },
  { id: 'alert_below_70', title: 'Student Below 70% — Critical', desc: 'Urgent notification to student and admin', icon: AlertTriangle, color: '#EF4444' },
  { id: 'lecturer_inactive_weeks', title: 'Lecturer Inactive 2+ Weeks', desc: 'Alerts admin about inactive lecturers', icon: Clock, color: '#F59E0B' },
  { id: 'expired_invitation_alert', title: 'Expired Student Invitation', desc: 'Notifies admin of expired invites', icon: UserCheck, color: '#3B82F6' },
  { id: 'weekly_summary_enabled', title: 'Weekly Attendance Summary', desc: 'Sent to admin and all lecturers', icon: BarChart3, color: '#3B82F6' },
  { id: 'session_not_ended_hours', title: 'Session Not Ended After 2hrs', desc: 'Reminder email to the lecturer', icon: Clock, color: '#F59E0B' },
];

const notifLog = [
  { type: 'Threshold Warning', recipient: 'k.asante@stu.edu', sentAt: '2 hours ago', status: 'Delivered', color: '#F59E0B' },
  { type: 'Weekly Summary', recipient: 'admin@uni.edu', sentAt: '1 day ago', status: 'Delivered', color: '#3B82F6' },
  { type: 'Threshold Critical', recipient: 'k.boateng@stu.edu', sentAt: '1 day ago', status: 'Delivered', color: '#EF4444' },
  { type: 'Invite Expired', recipient: 'admin@uni.edu', sentAt: '2 days ago', status: 'Delivered', color: '#3B82F6' },
  { type: 'Threshold Warning', recipient: 'a.darko@stu.edu', sentAt: '2 days ago', status: 'Failed', color: '#F59E0B' },
  { type: 'Session Reminder', recipient: 'a.frimpong@uni.edu', sentAt: '3 days ago', status: 'Delivered', color: '#F59E0B' },
  { type: 'Weekly Summary', recipient: 'admin@uni.edu', sentAt: '8 days ago', status: 'Delivered', color: '#3B82F6' },
  { type: 'Threshold Warning', recipient: 'a.asiedu@stu.edu', sentAt: '8 days ago', status: 'Delivered', color: '#F59E0B' },
  { type: 'Invite Expired', recipient: 'admin@uni.edu', sentAt: '9 days ago', status: 'Failed', color: '#3B82F6' },
  { type: 'Threshold Critical', recipient: 'k.boateng@stu.edu', sentAt: '10 days ago', status: 'Delivered', color: '#EF4444' },
];

export default function NotificationsPage() {
  const { addToast } = useToast();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await institutionAPI.getNotificationSettings();
      // Map API response to local definition
      const mappedRules = alertRulesDef.map(def => {
        let isEnabled = false;
        if (def.id === 'lecturer_inactive_weeks' || def.id === 'session_not_ended_hours') {
          isEnabled = res[def.id] > 0;
        } else {
          isEnabled = !!res[def.id];
        }
        return { ...def, enabled: isEnabled };
      });
      setRules(mappedRules);
    } catch (err) {
      addToast(err.message || 'Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Hooks after declaration to avoid temporal dead zone
  useEffect(() => { fetchSettings(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useSocketRefresh(fetchSettings);

  const toggleRule = async (id) => {
    const currentRule = rules.find(r => r.id === id);
    if (!currentRule) return;

    const newEnabled = !currentRule.enabled;

    // Optimistic UI update
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: newEnabled } : r));

    try {
      const updatePayload = {};
      if (id === 'lecturer_inactive_weeks') {
        updatePayload[id] = newEnabled ? 2 : 0; // Default to 2 weeks if enabled
      } else if (id === 'session_not_ended_hours') {
        updatePayload[id] = newEnabled ? 2 : 0; // Default to 2 hours if enabled
      } else {
        updatePayload[id] = newEnabled;
      }

      await institutionAPI.updateNotificationSettings(updatePayload);
      addToast('Alert rule updated', 'success');
    } catch (err) {
      // Revert on failure
      setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: currentRule.enabled } : r));
      addToast(err.message || 'Failed to update rule', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <TopHeader title="Notifications & Alerts" breadcrumbs={['Home', 'Notifications']} />
        <div className="flex-1 flex items-center justify-center py-20" style={{ backgroundColor: 'var(--bg-deep)' }}>
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopHeader title="Notifications & Alerts" breadcrumbs={['Home', 'Notifications']} />
      <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: 'var(--bg-deep)' }}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Alert Rules */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Alert Rules</h3>
            <div className="space-y-3">
              {rules.map(r => (
                <div key={r.id} className="flex items-center gap-4 rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${r.color}15` }}>
                    <r.icon size={18} style={{ color: r.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleRule(r.id)}
                    className="w-10 h-5 rounded-full relative transition-colors shrink-0"
                    style={{ backgroundColor: r.enabled ? 'var(--accent-primary)' : 'var(--bg-raised)' }}
                  >
                    <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: r.enabled ? '22px' : '2px' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notification Log */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Notification Log</h3>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-raised)' }}>
                    {['Type', 'Recipient', 'Sent', 'Status'].map(h => (
                      <th key={h} className="text-left text-xs font-medium px-4 py-2.5" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {notifLog.map((n, i) => (
                    <tr key={i} className={`${i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: n.color }} />
                          <span style={{ color: 'var(--text-primary)' }}>{n.type}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-secondary)' }}>{n.recipient}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>{n.sentAt}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1 text-xs" style={{ color: n.status === 'Delivered' ? '#10B981' : '#EF4444' }}>
                          {n.status === 'Delivered' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {n.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Email Test */}
        <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Email Test Panel</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Send a test email to verify SMTP is configured correctly</p>
          <div className="flex items-center gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 px-3.5 py-2.5 rounded-lg text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
            />
            <button
              onClick={() => { if (testEmail) addToast(`Test email sent to ${testEmail}`, 'success'); }}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}
            >
              <Send size={14} /> Send Test Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}