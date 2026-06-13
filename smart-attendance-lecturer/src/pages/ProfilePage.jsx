import React, { useState } from 'react';
import { useLecturerAuth } from '../context/LecturerAuthContext';
import { useToast } from '../components/shared/ToastManager';
import { Camera, Lock, Eye, EyeOff, Check, BookOpen, Radio, Users } from 'lucide-react';

export default function ProfilePage() {
  const { lecturer, updateProfile } = useLecturerAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('personal');
  const [fullName, setFullName] = useState(lecturer.lecturerName);
  const [displayName, setDisplayName] = useState(lecturer.title);
  const [phone, setPhone] = useState('+233 24 555 0001');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [prefs, setPrefs] = useState({
    threshold: true, session_open: true, weekly_summary: true, new_student: false,
  });
  const [timezone, setTimezone] = useState('Africa/Accra');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [defaultQRExpiry, setDefaultQRExpiry] = useState('admin');

  const initials = lecturer.firstName && lecturer.lastName
    ? `${lecturer.firstName[0]}${lecturer.lastName[0]}` : 'LC';

  const tabs = [
    { key: 'personal', label: 'Personal Info' },
    { key: 'security', label: 'Security' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'preferences', label: 'Preferences' },
  ];

  const pwChecks = {
    length: newPw.length >= 8,
    number: /\d/.test(newPw),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPw),
  };
  const strength = [pwChecks.length, pwChecks.number, pwChecks.special].filter(Boolean).length;
  const strengthColors = ['', 'var(--accent-red)', 'var(--accent-amber)', 'var(--accent-green)'];

  return (
    <div className="space-y-6">
      <h1 className="text-xl xl:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Profile & Settings</h1>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Profile Card */}
        <div className="rounded-[10px] border p-6 text-center"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="relative inline-block mb-3">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold mx-auto"
              style={{ backgroundColor: 'var(--accent-blue)', color: '#fff' }}>
              {initials}
            </div>
            <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center border-2"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}
              onClick={() => addToast('Photo upload coming soon', 'info')}>
              <Camera className="w-3 h-3" />
            </button>
          </div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{lecturer.lecturerName}</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{lecturer.department}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{lecturer.staffId}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{lecturer.email}
            <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-medium"
              style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)' }}>Verified</span>
          </p>
          <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>Member since September 2022</p>

          <div className="grid grid-cols-3 gap-2 mt-5">
            {[
              { icon: BookOpen, value: '3', label: 'Courses' },
              { icon: Radio, value: '34', label: 'Sessions' },
              { icon: Users, value: '287', label: 'Students' },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-raised)' }}>
                <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Tabs */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: 'var(--border-subtle)' }}>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all"
                style={{
                  borderColor: activeTab === tab.key ? 'var(--accent-primary)' : 'transparent',
                  color: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--text-muted)',
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="rounded-[10px] border p-5"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>

            {/* Personal Info */}
            {activeTab === 'personal' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Full Name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Display Name / Title</label>
                  <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Phone Number</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Department</label>
                  <div className="relative">
                    <input type="text" value={lecturer.department} readOnly
                      className="w-full h-11 px-3.5 pr-10 rounded-lg text-sm border"
                      style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-input)', color: 'var(--text-muted)' }}
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
                <div className="group relative">
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Email</label>
                  <div className="relative">
                    <input type="email" value={lecturer.email} readOnly
                      className="w-full h-11 px-3.5 pr-10 rounded-lg text-sm border"
                      style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-input)', color: 'var(--text-muted)' }}
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Email can only be changed by your institution admin</p>
                </div>
                <button onClick={() => addToast('Changes saved successfully', 'success')}
                  className="h-10 px-5 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                  Save Changes
                </button>
              </div>
            )}

            {/* Security */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Change Password</h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Current Password</label>
                      <input type={showCurrent ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                        className="w-full h-11 px-3.5 pr-10 rounded-lg text-sm border outline-none"
                        style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
                      />
                      <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-[38px]" style={{ color: 'var(--text-muted)' }}>
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>New Password</label>
                      <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                        className="w-full h-11 px-3.5 pr-10 rounded-lg text-sm border outline-none"
                        style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
                      />
                      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-[38px]" style={{ color: 'var(--text-muted)' }}>
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {newPw.length > 0 && (
                      <>
                        <div className="flex gap-1">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="h-1 flex-1 rounded-full" style={{ backgroundColor: i <= strength ? strengthColors[strength] : 'var(--bg-raised)' }} />
                          ))}
                        </div>
                        <div className="space-y-1">
                          {[{ met: pwChecks.length, label: 'At least 8 characters' }, { met: pwChecks.number, label: 'At least one number' }, { met: pwChecks.special, label: 'At least one special character' }].map(r => (
                            <div key={r.label} className="flex items-center gap-2">
                              <Check className="w-3 h-3" style={{ color: r.met ? 'var(--accent-green)' : 'var(--text-muted)' }} />
                              <span className="text-xs" style={{ color: r.met ? 'var(--accent-green)' : 'var(--text-muted)' }}>{r.label}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Confirm New Password</label>
                      <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-lg text-sm border outline-none"
                        style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <button onClick={() => addToast('Password updated successfully', 'success')}
                      className="h-10 px-5 rounded-lg text-sm font-semibold"
                      style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                      Update Password
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Login Activity</h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Last login: Today at 9:14 AM from Chrome</p>
                  <p className="text-[11px] mt-2" style={{ color: 'var(--accent-amber)' }}>
                    If you don't recognize this activity, change your password immediately.
                  </p>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-3">
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Email me when...</p>
                {[
                  { key: 'threshold', label: 'A student falls below threshold' },
                  { key: 'session_open', label: 'A session has not been closed after 2 hours' },
                  { key: 'weekly_summary', label: 'Weekly attendance summary every Monday' },
                  { key: 'new_student', label: 'New student enrolled in my course' },
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
            )}

            {/* Preferences */}
            {activeTab === 'preferences' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Timezone</label>
                  <select value={timezone} onChange={e => setTimezone(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}>
                    <option value="Africa/Accra">Africa/Accra (GMT+0)</option>
                    <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                    <option value="Europe/London">Europe/London (GMT+0)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Default QR Expiry</label>
                  <div className="flex gap-3">
                    {[['admin', 'Use Admin Default (15 min)'], ['custom', 'Custom']].map(([v, l]) => (
                      <label key={v} className="flex items-center gap-2 cursor-pointer">
                        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                          style={{ borderColor: defaultQRExpiry === v ? 'var(--accent-primary)' : 'var(--border-input)' }}>
                          {defaultQRExpiry === v && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />}
                        </div>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}
                          onClick={() => setDefaultQRExpiry(v)}>{l}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Date Format</label>
                  <div className="flex gap-3">
                    {['DD/MM/YYYY', 'MM/DD/YYYY'].map(f => (
                      <button key={f} onClick={() => setDateFormat(f)}
                        className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                        style={{
                          backgroundColor: dateFormat === f ? 'var(--accent-primary)' : 'var(--bg-deep)',
                          color: dateFormat === f ? 'var(--bg-deep)' : 'var(--text-secondary)',
                          border: dateFormat === f ? 'none' : '1px solid var(--border-input)',
                        }}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => addToast('Preferences saved', 'success')}
                  className="h-10 px-5 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                  Save Preferences
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}