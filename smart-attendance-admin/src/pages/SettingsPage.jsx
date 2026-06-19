import React, { useState, useEffect, useRef, useCallback } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import { useAppConfig } from '@/context/AppContext';
import { useToast } from '@/components/ui-custom/ToastProvider';
import { Upload, Eye, EyeOff, Download, Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { institutionAPI } from '@/api/api';

const TABS = ['Institution', 'Session Config', 'Face Recognition', 'Audit Trail'];

// ─── Small shared components ────────────────────────────────────────────────

function SInput({ label, value, onChange, type = 'text', placeholder, disabled }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all disabled:opacity-50"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
        onFocus={e => !disabled && (e.target.style.borderColor = 'var(--accent-primary)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border-input)')}
      />
    </div>
  );
}

function Toggle({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-10 h-5 rounded-full relative transition-colors shrink-0"
      style={{ backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--bg-raised)' }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
        style={{ left: enabled ? '22px' : '2px' }}
      />
    </button>
  );
}

function SaveBtn({ onClick, loading, label = 'Save Changes' }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
      style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {label}
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { config, updateConfig } = useAppConfig();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('Institution');
  const fileRef = useRef(null);

  // Institution
  const [instName, setInstName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [savingInst, setSavingInst] = useState(false);

  // Password
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurr, setShowCurr] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  // Session config
  const [codeLen, setCodeLen] = useState(6);
  const [qrExpiry, setQrExpiry] = useState(15);
  const [maxFailed, setMaxFailed] = useState(5);
  const [autoClose, setAutoClose] = useState(false);
  const [autoCloseHrs, setAutoCloseHrs] = useState(2);
  const [savingSession, setSavingSession] = useState(false);

  // Face rec
  const [confidence, setConfidence] = useState(80);
  const [savingFace, setSavingFace] = useState(false);

  // Audit trail
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [downloadingAudit, setDownloadingAudit] = useState(null);
  const AUDIT_LIMIT = 50;

  // ─── Load initial data ──────────────────────────────────────────────────

  useEffect(() => {
    loadInstitution();
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'Audit Trail') loadAuditTrail(auditPage);
  }, [activeTab, auditPage]);

  const loadInstitution = async () => {
    try {
      const inst = await institutionAPI.get();
      setInstName(inst.name || '');
      setAdminName(inst.admin_name || '');
      setAdminEmail(inst.admin_email || '');
      setLogoPreview(inst.logo_url || '');
    } catch (err) {
      addToast('Failed to load institution info', 'error');
    }
  };

  const loadSettings = async () => {
    try {
      const s = await institutionAPI.getSettings();
      setCodeLen(s.session_code_length ?? 6);
      setQrExpiry(s.qr_default_expiry_minutes ?? 15);
      setMaxFailed(s.max_login_attempts ?? 5);
      setConfidence(s.face_confidence_threshold ?? 80);
      // session_not_ended_hours stored in notification settings but we use lockout_duration_minutes here for auto-close hours
      if (s.lockout_duration_minutes) setAutoCloseHrs(Math.round(s.lockout_duration_minutes / 60) || 2);
    } catch (err) {
      addToast('Failed to load system settings', 'error');
    }
  };

  const loadAuditTrail = async (page) => {
    setAuditLoading(true);
    try {
      const res = await institutionAPI.getAuditTrail({ page, limit: AUDIT_LIMIT });
      setAuditLogs(res.logs || []);
      setAuditTotal(res.total || 0);
    } catch (err) {
      addToast('Failed to load audit trail', 'error');
    } finally {
      setAuditLoading(false);
    }
  };

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const saveInstitution = async () => {
    setSavingInst(true);
    try {
      // Always use FormData — backend now expects multipart/form-data for this endpoint
      const instRes = await institutionAPI.updateInstitution(
        { name: instName, admin_name: adminName, admin_email: adminEmail },
        logoFile || null
      );

      // Update global context so navbar, header, favicon etc. update immediately
      updateConfig({
        institutionName: instRes.name || instName,
        logoUrl: instRes.logo_url || config.logoUrl,
        userName: instRes.admin_name || adminName,
        userEmail: instRes.admin_email || adminEmail,
      });

      setLogoFile(null);  // Clear staged file after successful upload
      setLogoPreview(instRes.logo_url || logoPreview);  // Use the Cloudinary URL
      addToast('Institution settings saved', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save institution settings', 'error');
    } finally {
      setSavingInst(false);
    }
  };

  const savePassword = async () => {
    if (!currPass || !newPass || !confirmPass) {
      addToast('Please fill in all password fields', 'warning');
      return;
    }
    if (newPass !== confirmPass) {
      addToast('New passwords do not match', 'error');
      return;
    }
    if (newPass.length < 8) {
      addToast('New password must be at least 8 characters', 'warning');
      return;
    }
    setSavingPass(true);
    try {
      await institutionAPI.changePassword({ current_password: currPass, new_password: newPass });
      setCurrPass(''); setNewPass(''); setConfirmPass('');
      addToast('Password updated successfully', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to change password', 'error');
    } finally {
      setSavingPass(false);
    }
  };

  const saveSessionConfig = async () => {
    setSavingSession(true);
    try {
      await institutionAPI.updateSettings({
        session_code_length: codeLen,
        qr_default_expiry_minutes: qrExpiry,
        max_login_attempts: maxFailed,
        lockout_duration_minutes: autoClose ? autoCloseHrs * 60 : undefined,
      });
      addToast('Session config saved', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save session config', 'error');
    } finally {
      setSavingSession(false);
    }
  };

  const saveFaceConfig = async () => {
    setSavingFace(true);
    try {
      await institutionAPI.updateSettings({ face_confidence_threshold: confidence });
      addToast('Face recognition settings saved', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save face settings', 'error');
    } finally {
      setSavingFace(false);
    }
  };

  const downloadAuditCSV = () => {
    if (!auditLogs.length) { addToast('No audit data to export', 'warning'); return; }
    const headers = ['Action', 'Details', 'Performed By', 'Timestamp', 'IP Address'];
    const rows = auditLogs.map(a => [
      a.action,
      JSON.stringify(a.details || ''),
      a.performed_by_name || a.performed_by || 'System',
      new Date(a.created_at).toLocaleString(),
      a.ip_address || '—',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'audit_trail.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Audit log exported as CSV', 'success');
  };

  const downloadAuditPDF = async () => {
    if (!auditLogs.length) { addToast('No audit data to export', 'warning'); return; }
    setDownloadingAudit('pdf');
    try {
      // Build a minimal HTML table and print it as PDF via the browser
      const rows = auditLogs.map(a => `
        <tr>
          <td>${a.action}</td>
          <td>${JSON.stringify(a.details || '')}</td>
          <td>${a.performed_by_name || a.performed_by || 'System'}</td>
          <td>${new Date(a.created_at).toLocaleString()}</td>
          <td>${a.ip_address || '—'}</td>
        </tr>`).join('');
      const html = `<!DOCTYPE html><html><head><title>Audit Trail</title>
        <style>body{font-family:sans-serif;font-size:11px;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#f5f5f5;font-weight:600}</style>
        </head><body><h2>Audit Trail</h2><table><thead><tr><th>Action</th><th>Details</th><th>Performed By</th><th>Timestamp</th><th>IP</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
      const win = window.open('', '_blank');
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 400);
      addToast('Audit PDF prepared for printing', 'success');
    } finally {
      setDownloadingAudit(null);
    }
  };

  const sampleCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: codeLen }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const totalAuditPages = Math.ceil(auditTotal / AUDIT_LIMIT);

  // ─── Format audit log details ────────────────────────────────────────────
  const formatDetails = (details) => {
    if (!details) return '—';
    if (typeof details === 'string') return details;
    const entries = Object.entries(details);
    if (!entries.length) return '—';
    return entries.map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(', ');
  };

  const formatTimestamp = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const actionBadgeColor = (action) => {
    if (action?.includes('delete') || action?.includes('suspend')) return { bg: 'rgba(239,68,68,0.12)', color: '#EF4444' };
    if (action?.includes('created') || action?.includes('added') || action?.includes('import')) return { bg: 'rgba(16,185,129,0.12)', color: '#10B981' };
    if (action?.includes('updated') || action?.includes('changed') || action?.includes('override')) return { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' };
    return { bg: 'rgba(139,157,195,0.12)', color: '#8B9DC3' };
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      <TopHeader title="System Settings" breadcrumbs={['Home', 'Settings']} />
      <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: 'var(--bg-deep)' }}>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto rounded-lg p-1" style={{ backgroundColor: 'var(--bg-surface)' }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className="px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors"
              style={{
                backgroundColor: activeTab === t ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === t ? 'var(--bg-deep)' : 'var(--text-secondary)',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── INSTITUTION TAB ─────────────────────────────────────────────── */}
        {activeTab === 'Institution' && (
          <div className="max-w-2xl space-y-8">

            {/* Institution Name */}
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Institution</p>
              <SInput label="Institution Name" value={instName} onChange={setInstName} />

              {/* Logo */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Institution Logo</label>
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
                    style={{ border: '2px dashed var(--border-input)', backgroundColor: 'var(--bg-surface)' }}
                  >
                    {logoPreview
                      ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                      : <Upload size={24} style={{ color: 'var(--text-muted)' }} />
                    }
                  </div>
                  <div>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                      style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}
                    >
                      <Upload size={14} /> Upload new logo
                    </button>
                    <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>PNG, JPG — Max 2MB. Changes take effect everywhere.</p>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
                </div>
              </div>
            </div>

            {/* Admin Info */}
            <div className="space-y-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Admin Account</p>
              <div className="grid grid-cols-2 gap-4">
                <SInput label="Admin Full Name" value={adminName} onChange={setAdminName} />
                <SInput label="Admin Email" value={adminEmail} onChange={setAdminEmail} type="email" />
              </div>
            </div>

            <SaveBtn onClick={saveInstitution} loading={savingInst} />

            {/* Password Section */}
            <div className="space-y-4 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Change Password</p>
              <div className="space-y-3">
                {/* Current */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Current Password</label>
                  <div className="relative">
                    <input type={showCurr ? 'text' : 'password'} value={currPass} onChange={e => setCurrPass(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none pr-10"
                      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
                    <button onClick={() => setShowCurr(!showCurr)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                      {showCurr ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>New Password</label>
                    <div className="relative">
                      <input type={showNew ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none pr-10"
                        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
                      <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                        {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <SInput label="Confirm New Password" value={confirmPass} onChange={setConfirmPass} type="password" />
                </div>
                {newPass && confirmPass && newPass !== confirmPass && (
                  <p className="text-xs" style={{ color: 'var(--accent-red)' }}>Passwords do not match</p>
                )}
              </div>
              <SaveBtn onClick={savePassword} loading={savingPass} label="Update Password" />
            </div>

          </div>
        )}

        {/* ── SESSION CONFIG TAB ──────────────────────────────────────────── */}
        {activeTab === 'Session Config' && (
          <div className="max-w-2xl space-y-6">

            {/* Code Length */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Session Code Length (4–8 characters)</label>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>The code students enter when a lecturer starts a session.</p>
              <div className="flex items-center gap-4">
                <input
                  type="number" min={4} max={8} value={codeLen}
                  onChange={e => setCodeLen(Math.min(8, Math.max(4, parseInt(e.target.value) || 6)))}
                  className="w-24 px-3.5 py-2.5 rounded-lg text-sm outline-none text-center"
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                />
                <div className="px-4 py-2 rounded-lg font-mono text-sm tracking-widest" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--accent-primary)', border: '1px solid var(--border-subtle)' }}>
                  {sampleCode()}
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>← sample code</span>
              </div>
            </div>

            {/* QR Expiry */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Default QR Code Expiry</label>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Duration a QR code remains valid when a lecturer starts a session.</p>
              <select
                value={qrExpiry}
                onChange={e => setQrExpiry(parseInt(e.target.value))}
                className="w-48 px-3.5 py-2.5 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
              >
                {[5, 10, 15, 20, 30, 45, 60].map(m => <option key={m} value={m}>{m} minutes</option>)}
              </select>
            </div>

            {/* Max Failed Attempts */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Max Failed Login Attempts Before Lockout</label>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>After this many failed attempts, a student's account is temporarily locked.</p>
              <input
                type="number" min={1} max={10} value={maxFailed}
                onChange={e => setMaxFailed(Math.min(10, Math.max(1, parseInt(e.target.value) || 5)))}
                className="w-24 px-3.5 py-2.5 rounded-lg text-sm outline-none text-center"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Auto-Close */}
            <div className="flex items-start justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Session Auto-Close After Inactivity</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {autoClose
                    ? `Sessions with no activity for ${autoCloseHrs} hour(s) will be automatically closed.`
                    : 'Sessions remain open until the lecturer manually ends them.'}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {autoClose && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number" min={1} max={8} value={autoCloseHrs}
                      onChange={e => setAutoCloseHrs(Math.min(8, Math.max(1, parseInt(e.target.value) || 2)))}
                      className="w-14 px-2 py-1.5 rounded text-sm text-center"
                      style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                    />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>hrs</span>
                  </div>
                )}
                <Toggle enabled={autoClose} onToggle={() => setAutoClose(!autoClose)} />
              </div>
            </div>

            <SaveBtn onClick={saveSessionConfig} loading={savingSession} />
          </div>
        )}

        {/* ── FACE RECOGNITION TAB ────────────────────────────────────────── */}
        {activeTab === 'Face Recognition' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Confidence Threshold: <span style={{ color: 'var(--accent-primary)' }}>{confidence}%</span>
              </label>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Higher values = stricter matching, fewer false positives. Lower values = more lenient, higher chance of accepting a wrong face.
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="range" min={60} max={99} step={1} value={confidence}
                  onChange={e => setConfidence(parseInt(e.target.value))}
                  className="flex-1"
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
                <input
                  type="number" min={60} max={99} value={confidence}
                  onChange={e => setConfidence(Math.min(99, Math.max(60, parseInt(e.target.value) || 80)))}
                  className="w-16 px-2 py-1.5 rounded text-sm text-center"
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Visual guide */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                {[
                  { label: 'Lenient', range: '60–74%', color: '#EF4444' },
                  { label: 'Balanced', range: '75–89%', color: '#F59E0B' },
                  { label: 'Strict', range: '90–99%', color: '#10B981' },
                ].map(z => (
                  <div key={z.label} className="p-3 rounded-lg" style={{
                    backgroundColor: confidence >= parseInt(z.range) && confidence <= parseInt(z.range.split('–')[1]) ? `${z.color}15` : 'var(--bg-surface)',
                    border: `1px solid ${z.color}30`,
                  }}>
                    <p className="font-semibold" style={{ color: z.color }}>{z.label}</p>
                    <p style={{ color: 'var(--text-muted)' }}>{z.range}</p>
                  </div>
                ))}
              </div>
            </div>

            <SaveBtn onClick={saveFaceConfig} loading={savingFace} />
          </div>
        )}

        {/* ── AUDIT TRAIL TAB ─────────────────────────────────────────────── */}
        {activeTab === 'Audit Trail' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Audit Trail
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {auditTotal} total actions recorded
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={downloadAuditPDF}
                  disabled={downloadingAudit === 'pdf' || auditLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}
                >
                  {downloadingAudit === 'pdf' ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} PDF
                </button>
                <button
                  onClick={downloadAuditCSV}
                  disabled={auditLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
                  style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}
                >
                  <Download size={12} /> CSV / Excel
                </button>
              </div>
            </div>

            {auditLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
              </div>
            ) : (
              <>
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ backgroundColor: 'var(--bg-raised)' }}>
                          {['Action', 'Details', 'Performed By', 'Timestamp', 'IP Address'].map(h => (
                            <th key={h} className="text-left text-xs font-medium px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                              No audit logs recorded yet.
                            </td>
                          </tr>
                        ) : auditLogs.map((a, i) => {
                          const badge = actionBadgeColor(a.action);
                          return (
                            <tr key={a.id || i} className={i % 2 === 0 ? 'table-row-even' : 'table-row-odd'} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: badge.bg, color: badge.color }}>
                                  {a.action?.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3 max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                                <span className="truncate block" title={formatDetails(a.details)}>
                                  {formatDetails(a.details)}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap font-medium" style={{ color: 'var(--text-primary)' }}>
                                {a.performed_by_name || 'Admin'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: 'var(--text-muted)' }}>
                                {formatTimestamp(a.created_at)}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                                {a.ip_address || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {totalAuditPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Page {auditPage} of {totalAuditPages} · {auditTotal} records
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                        disabled={auditPage === 1}
                        className="p-1.5 rounded-lg disabled:opacity-40"
                        style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => setAuditPage(p => Math.min(totalAuditPages, p + 1))}
                        disabled={auditPage === totalAuditPages}
                        className="p-1.5 rounded-lg disabled:opacity-40"
                        style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}