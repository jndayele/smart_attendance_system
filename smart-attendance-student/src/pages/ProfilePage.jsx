import React, { useState } from 'react';
import {
  Lock, Check, Shield, Camera, Bell, User, Eye, EyeOff, AlertTriangle, Loader2
} from 'lucide-react';
import { useStudentAuth } from '../context/AuthContext';
import { useAppConfig } from '../context/AppContext';
import { useToast } from '../components/ui/AppToast';
import { COURSES } from '../data/dummyData';

const TABS = [
  { id: 'info', label: 'Personal Info', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'face', label: 'Face Photo', icon: Camera },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export default function ProfilePage() {
  const auth = useStudentAuth();
  const { institutionName } = useAppConfig();
  const addToast = useToast();
  const [activeTab, setActiveTab] = useState('info');

  const initials = auth.name ? auth.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
  const totalAttended = COURSES.reduce((s, c) => s + c.attended, 0);
  const totalSessions = COURSES.reduce((s, c) => s + c.total, 0);
  const overallPct = Math.round((totalAttended / totalSessions) * 1000) / 10;

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>My Profile</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left profile card */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="rounded-xl p-6"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="text-center mb-4">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-semibold text-white mb-3"
                style={{ backgroundColor: 'var(--accent-green)' }}>
                {initials}
              </div>
              <button className="text-xs font-medium hover:underline" style={{ color: 'var(--accent-primary)' }}>
                Update Photo
              </button>
            </div>
            <h2 className="font-playfair text-lg text-center" style={{ color: 'var(--text-primary)' }}>{auth.name}</h2>
            <p className="text-xs text-center mb-1" style={{ color: 'var(--text-secondary)' }}>{auth.studentId}</p>
            <p className="text-xs text-center mb-4" style={{ color: 'var(--text-muted)' }}>
              {auth.email}
              <span className="inline-flex items-center gap-0.5 ml-1 text-[10px] px-1 py-0.5 rounded"
                style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: 'var(--accent-green)' }}>
                <Check size={8} /> Verified
              </span>
            </p>

            <div className="space-y-2 text-xs">
              {[
                { label: 'Programme', value: auth.programme },
                { label: 'Level', value: auth.level },
                { label: 'Department', value: auth.department },
                { label: 'Semester', value: auth.semester },
              ].map(f => (
                <div key={f.label} className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>{f.label}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{f.value}</span>
                </div>
              ))}
            </div>

            <div className="h-px my-4" style={{ backgroundColor: 'var(--border-subtle)' }} />

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="text-base font-semibold" style={{ color: 'var(--accent-primary)' }}>{overallPct}%</p>
                <p style={{ color: 'var(--text-muted)' }}>Average</p>
              </div>
              <div>
                <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{COURSES.length}</p>
                <p style={{ color: 'var(--text-muted)' }}>Courses</p>
              </div>
              <div>
                <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{totalAttended}/{totalSessions}</p>
                <p style={{ color: 'var(--text-muted)' }}>Sessions</p>
              </div>
            </div>

            <div className="h-px my-4" style={{ backgroundColor: 'var(--border-subtle)' }} />

            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--text-muted)' }}>Account Status</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: 'var(--accent-green)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-green)' }} /> Active
              </span>
            </div>
            <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>Member since September 2024</p>
          </div>
        </div>

        {/* Right settings */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
                style={{
                  backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.07)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}>
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl p-5 sm:p-6"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            {activeTab === 'info' && <PersonalInfoTab auth={auth} addToast={addToast} />}
            {activeTab === 'security' && <SecurityTab addToast={addToast} />}
            {activeTab === 'face' && <FacePhotoTab addToast={addToast} />}
            {activeTab === 'notifications' && <NotificationsTab addToast={addToast} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonalInfoTab({ auth, addToast }) {
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');

  return (
    <>
      <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Personal Information</h3>
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Display Name / Preferred Name</label>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={auth.firstName}
            className="w-full h-11 px-4 rounded-lg text-sm outline-none"
            style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Phone Number (optional)</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+233 XX XXX XXXX"
            className="w-full h-11 px-4 rounded-lg text-sm outline-none"
            style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
        </div>
      </div>
      <div className="space-y-3 mb-6">
        {[
          { label: 'Full Name', value: auth.name },
          { label: 'Student ID', value: auth.studentId },
          { label: 'Email', value: auth.email },
          { label: 'Programme', value: auth.programme },
          { label: 'Level', value: auth.level },
        ].map(f => (
          <div key={f.label}>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
            <div className="flex items-center h-11 px-4 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-secondary)' }}>
              <Lock size={12} className="mr-2 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              {f.value}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        Personal details are managed by your institution admin. Contact admin to update your name or email.
      </p>
      <button onClick={() => addToast('Changes saved successfully.', 'success')}
        className="h-10 px-6 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
        style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
        Save Changes
      </button>
    </>
  );
}

function SecurityTab({ addToast }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);

  const hasLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  const allChecks = hasLength && hasNumber && hasSpecial && passwordsMatch && currentPassword;

  return (
    <>
      <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Change Password</h3>
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Current Password</label>
          <div className="relative">
            <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              className="w-full h-11 px-4 pr-10 rounded-lg text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>New Password</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
            className="w-full h-11 px-4 rounded-lg text-sm outline-none"
            style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Confirm New Password</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            className="w-full h-11 px-4 rounded-lg text-sm outline-none"
            style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
        </div>
      </div>

      <div className="space-y-1.5 mb-6">
        {[
          { checked: hasLength, label: 'At least 8 characters' },
          { checked: hasNumber, label: 'At least one number' },
          { checked: hasSpecial, label: 'At least one special character' },
          { checked: passwordsMatch, label: 'Passwords match' },
        ].map(c => (
          <div key={c.label} className="flex items-center gap-2 text-xs">
            <div className="w-3.5 h-3.5 rounded flex items-center justify-center"
              style={{
                backgroundColor: c.checked ? 'var(--accent-green)' : 'transparent',
                border: c.checked ? 'none' : '1px solid var(--text-muted)',
              }}>
              {c.checked && <Check size={8} color="#fff" />}
            </div>
            <span style={{ color: c.checked ? 'var(--accent-green)' : 'var(--text-muted)' }}>{c.label}</span>
          </div>
        ))}
      </div>

      <button disabled={!allChecks}
        onClick={() => addToast('Password updated successfully.', 'success')}
        className="h-10 px-6 rounded-lg font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
        Update Password
      </button>

      <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Last Login</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>Today at 9:14 AM · Chrome on macOS</p>
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Not you? Change your password immediately.</p>
      </div>
    </>
  );
}

function FacePhotoTab({ addToast }) {
  const [processing, setProcessing] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(true);

  const handleUpdate = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      addToast('Face photo updated and encoding refreshed.', 'success');
    }, 2000);
  };

  return (
    <>
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Update Your Face Photo</h3>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Used for face recognition during attendance marking.</p>

      {/* Current status */}
      <div className="flex items-start gap-2 p-3 rounded-lg mb-4"
        style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
        <Check size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-green)' }} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--accent-green)' }}>Face encoding registered</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Last updated: September 15, 2024</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Your face encoding is active and ready for attendance.</p>
        </div>
      </div>

      {/* Requirements */}
      <div className="rounded-lg p-3 mb-4 flex items-start gap-2"
        style={{ backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <Camera size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-blue)' }} />
        <div className="text-xs space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
          <p>✓ Clear frontal view, no obstructions</p>
          <p>✓ Good lighting — not too dark or washed out</p>
          <p>✓ Only your face visible</p>
          <p>✓ Minimum 300×300 pixels</p>
        </div>
      </div>

      {/* Upload zone */}
      <div className="flex flex-col items-center mb-4">
        <div className="w-48 h-48 rounded-xl flex items-center justify-center relative group cursor-pointer"
          style={{ backgroundColor: 'var(--bg-raised)', border: '2px dashed var(--border-btn)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent-green)' }}>
            <span className="text-2xl font-semibold text-white">KA</span>
          </div>
          <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs font-medium text-white">Replace Photo</span>
          </div>
        </div>
      </div>

      {processing && (
        <div className="text-center py-3">
          <Loader2 size={20} className="mx-auto animate-spin mb-1" style={{ color: 'var(--accent-primary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>Analysing photo...</p>
        </div>
      )}

      <button onClick={handleUpdate} disabled={processing}
        className="h-10 px-6 rounded-lg font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40"
        style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
        Update Face Photo
      </button>

      <div className="flex items-start gap-2 p-3 rounded-lg mt-4"
        style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-amber)' }} />
        <p className="text-xs" style={{ color: 'var(--accent-amber)' }}>
          Updating your face photo will replace your current encoding. You may not be able to use face scan until processing completes (usually under 1 minute).
        </p>
      </div>
    </>
  );
}

function NotificationsTab({ addToast }) {
  const [prefs, setPrefs] = useState({
    dropBelow80: true,
    dropBelow75: true,
    sessionStart: true,
    sessionEnding: true,
    weeklySummary: false,
  });

  const toggle = (key) => {
    if (key === 'dropBelow75') return; // locked
    setPrefs(p => ({ ...p, [key]: !p[key] }));
  };

  const ITEMS = [
    { key: 'dropBelow80', label: 'My attendance drops below 80%', desc: 'Get notified early to take action', locked: false },
    { key: 'dropBelow75', label: 'My attendance drops below 75%', desc: 'Required by institution policy', locked: true },
    { key: 'sessionStart', label: 'A new attendance session starts', desc: 'Be the first to know when your lecturer starts a session', locked: false },
    { key: 'sessionEnding', label: 'A session is ending soon', desc: 'Reminder before session closes', locked: false },
    { key: 'weeklySummary', label: 'Weekly attendance summary every Monday', desc: 'Get a weekly recap of your attendance', locked: false },
  ];

  return (
    <>
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Email Notification Preferences</h3>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Email me when...</p>

      <div className="space-y-4 mb-6">
        {ITEMS.map(item => (
          <div key={item.key} className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                {item.locked && <Lock size={12} style={{ color: 'var(--text-muted)' }} />}
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
            </div>
            <button onClick={() => toggle(item.key)}
              className={`w-10 h-5 rounded-full relative transition-all flex-shrink-0 mt-1 ${item.locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              style={{ backgroundColor: prefs[item.key] ? 'var(--accent-primary)' : 'var(--bg-raised)' }}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                style={{ left: prefs[item.key] ? '22px' : '2px' }} />
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        Critical threshold alerts cannot be disabled as per institution policy.
      </p>

      <button onClick={() => addToast('Notification preferences saved.', 'success')}
        className="h-10 px-6 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
        style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
        Save Preferences
      </button>
    </>
  );
}