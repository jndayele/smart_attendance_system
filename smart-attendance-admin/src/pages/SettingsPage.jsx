import React, { useState, useRef } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import { useAppConfig } from '@/context/AppContext';
import { useToast } from '@/components/ui-custom/ToastProvider';
import { Upload, Eye, EyeOff, Download } from 'lucide-react';

const TABS = ['Institution', 'Session Config', 'Face Recognition', 'Email / SMTP', 'Audit Trail'];

const auditData = [
  { action: 'Manual Attendance Override', details: 'Marked Kwame Asante present in CS301', by: 'Admin', time: '2 hrs ago', ip: '192.168.1.1' },
  { action: 'Student Suspended', details: 'Suspended: Ama Boateng (STU-0002)', by: 'Admin', time: '1 day ago', ip: '192.168.1.1' },
  { action: 'Course Created', details: 'Database Systems (CS301) added', by: 'Admin', time: '2 days ago', ip: '192.168.1.1' },
  { action: 'Bulk Import', details: '142 students imported, Level 100', by: 'Admin', time: '3 days ago', ip: '192.168.1.1' },
  { action: 'Lecturer Added', details: 'Dr. Kweku Boateng added to DCS', by: 'Admin', time: '4 days ago', ip: '192.168.1.1' },
  { action: 'Settings Updated', details: 'SMTP configuration changed', by: 'Admin', time: '5 days ago', ip: '192.168.1.1' },
  { action: 'Semester Closed', details: 'Semester 1 (2023/2024) archived', by: 'Admin', time: '1 week ago', ip: '192.168.1.1' },
  { action: 'Report Exported', details: 'Institution-wide attendance PDF', by: 'Admin', time: '1 week ago', ip: '192.168.1.1' },
];

export default function SettingsPage() {
  const { config, updateConfig } = useAppConfig();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('Institution');
  const fileRef = useRef(null);

  // Institution state
  const [instName, setInstName] = useState(config.institutionName);
  const [adminName, setAdminName] = useState(config.adminName);
  const [adminEmail, setAdminEmail] = useState(config.adminEmail);
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Session config
  const [codeLen, setCodeLen] = useState(6);
  const [qrExpiry, setQrExpiry] = useState(15);
  const [maxFailed, setMaxFailed] = useState(3);
  const [autoClose, setAutoClose] = useState(true);
  const [autoCloseHrs, setAutoCloseHrs] = useState(2);

  // Face rec
  const [confidence, setConfidence] = useState(80);
  const [liveness, setLiveness] = useState(true);
  const [fallbackQR, setFallbackQR] = useState(true);

  // SMTP
  const [smtp, setSmtp] = useState({ host: '', port: '587', user: '', pass: '', fromName: config.institutionName + ' Attendance System', fromEmail: '', encryption: 'TLS' });
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateConfig({ logoUrl: ev.target.result });
      addToast('Logo updated', 'success');
    };
    reader.readAsDataURL(file);
  };

  const saveInstitution = () => {
    updateConfig({ institutionName: instName, adminName, adminEmail });
    addToast('Institution settings saved', 'success');
  };

  const sampleCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: codeLen }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const Toggle = ({ enabled, onToggle }) => (
    <button onClick={onToggle} className="w-10 h-5 rounded-full relative transition-colors shrink-0" style={{ backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--bg-raised)' }}>
      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: enabled ? '22px' : '2px' }} />
    </button>
  );

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

        {/* Tab Content */}
        {activeTab === 'Institution' && (
          <div className="max-w-2xl space-y-6">
            <SInput label="Institution Name" value={instName} onChange={setInstName} />
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Institution Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center shrink-0" style={{ border: '2px dashed var(--border-input)', backgroundColor: 'var(--bg-surface)' }}>
                  {config.logoUrl ? <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <Upload size={24} style={{ color: 'var(--text-muted)' }} />}
                </div>
                <button onClick={() => fileRef.current?.click()} className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
                  <Upload size={14} /> Upload new logo
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SInput label="Admin Full Name" value={adminName} onChange={setAdminName} />
              <SInput label="Admin Email" value={adminEmail} onChange={setAdminEmail} />
            </div>
            <div className="pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Change Password</p>
              <div className="grid grid-cols-3 gap-4">
                <SInput label="Current" value={currPass} onChange={setCurrPass} type="password" />
                <SInput label="New" value={newPass} onChange={setNewPass} type="password" />
                <SInput label="Confirm" value={confirmPass} onChange={setConfirmPass} type="password" />
              </div>
            </div>
            <button onClick={saveInstitution} className="px-6 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>Save Changes</button>
          </div>
        )}

        {activeTab === 'Session Config' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Session Code Length (4–8)</label>
              <input type="number" min={4} max={8} value={codeLen} onChange={e => setCodeLen(parseInt(e.target.value) || 6)} className="w-32 px-3.5 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>Example code: {sampleCode()}</p>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Default QR Code Expiry</label>
              <select value={qrExpiry} onChange={e => setQrExpiry(parseInt(e.target.value))} className="w-48 px-3.5 py-2.5 rounded-lg text-sm appearance-none" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}>
                {[5, 10, 15, 20, 30].map(m => <option key={m} value={m}>{m} minutes</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Max Failed Attempts Before Lockout</label>
              <input type="number" min={1} max={10} value={maxFailed} onChange={e => setMaxFailed(parseInt(e.target.value) || 3)} className="w-32 px-3.5 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Session Auto-Close After Inactivity</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Automatically close sessions after {autoCloseHrs} hours</p>
              </div>
              <div className="flex items-center gap-3">
                {autoClose && <input type="number" min={1} max={8} value={autoCloseHrs} onChange={e => setAutoCloseHrs(parseInt(e.target.value) || 2)} className="w-16 px-2 py-1.5 rounded text-sm text-center" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />}
                <Toggle enabled={autoClose} onToggle={() => setAutoClose(!autoClose)} />
              </div>
            </div>
            <button onClick={() => addToast('Session settings saved', 'success')} className="px-6 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>Save Changes</button>
          </div>
        )}

        {activeTab === 'Face Recognition' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Confidence Threshold: {confidence}%</label>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Higher = stricter matching, fewer false positives</p>
              <div className="flex items-center gap-4">
                <input type="range" min={60} max={99} value={confidence} onChange={e => setConfidence(parseInt(e.target.value))} className="flex-1 accent-amber-500" />
                <input type="number" min={60} max={99} value={confidence} onChange={e => setConfidence(parseInt(e.target.value) || 80)} className="w-16 px-2 py-1.5 rounded text-sm text-center" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Liveness Detection</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Flags static photos of photos</p>
              </div>
              <Toggle enabled={liveness} onToggle={() => setLiveness(!liveness)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Fallback to QR on Face Failure</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Allow QR code check-in when face recognition fails</p>
              </div>
              <Toggle enabled={fallbackQR} onToggle={() => setFallbackQR(!fallbackQR)} />
            </div>
            <button onClick={() => addToast('Face recognition settings saved', 'success')} className="px-6 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>Save Changes</button>
          </div>
        )}

        {activeTab === 'Email / SMTP' && (
          <div className="max-w-2xl space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <SInput label="SMTP Host" value={smtp.host} onChange={v => setSmtp(p => ({ ...p, host: v }))} placeholder="smtp.example.com" />
              <SInput label="SMTP Port" value={smtp.port} onChange={v => setSmtp(p => ({ ...p, port: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SInput label="SMTP Username" value={smtp.user} onChange={v => setSmtp(p => ({ ...p, user: v }))} />
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>SMTP Password</label>
                <div className="relative">
                  <input type={showSmtpPass ? 'text' : 'password'} value={smtp.pass} onChange={e => setSmtp(p => ({ ...p, pass: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none pr-10" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
                  <button onClick={() => setShowSmtpPass(!showSmtpPass)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {showSmtpPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SInput label="From Name" value={smtp.fromName} onChange={v => setSmtp(p => ({ ...p, fromName: v }))} />
              <SInput label="From Email" value={smtp.fromEmail} onChange={v => setSmtp(p => ({ ...p, fromEmail: v }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Encryption</label>
              <div className="flex gap-2">
                {['TLS', 'SSL', 'None'].map(e => (
                  <button key={e} onClick={() => setSmtp(p => ({ ...p, encryption: e }))} className="px-4 py-2 rounded-lg text-sm font-medium" style={{
                    backgroundColor: smtp.encryption === e ? 'var(--accent-primary)' : 'transparent',
                    color: smtp.encryption === e ? 'var(--bg-deep)' : 'var(--text-secondary)',
                    border: smtp.encryption === e ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  }}>{e}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => addToast('SMTP connection test successful', 'success')} className="px-4 py-2.5 rounded-lg text-sm font-medium" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>Test Connection</button>
              <button onClick={() => addToast('SMTP settings saved', 'success')} className="px-6 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>Save SMTP Settings</button>
            </div>
          </div>
        )}

        {activeTab === 'Audit Trail' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Last 50 admin actions</p>
              <div className="flex gap-2">
                <button onClick={() => addToast('Exporting audit log as PDF...', 'info')} className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                  <Download size={12} /> PDF
                </button>
                <button onClick={() => addToast('Exporting audit log as Excel...', 'info')} className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
                  <Download size={12} /> Excel
                </button>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-raised)' }}>
                    {['Action', 'Details', 'Performed By', 'Timestamp', 'IP Address'].map(h => (
                      <th key={h} className="text-left text-xs font-medium px-4 py-3" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditData.map((a, i) => (
                    <tr key={i} className={`${i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{a.action}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{a.details}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{a.by}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{a.time}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{a.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SInput({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
    </div>
  );
}