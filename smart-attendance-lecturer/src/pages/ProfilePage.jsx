import React, { useState, useEffect } from 'react';
import { useLecturerAuth } from '../context/LecturerAuthContext';
import { useToast } from '../components/shared/ToastManager';
import { Camera, Lock, Eye, EyeOff, Check, BookOpen, Radio, Users, Loader2 } from 'lucide-react';
import { profileAPI } from '../api/api';

export default function ProfilePage() {
  const { lecturer, updateProfile } = useLecturerAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('personal');
  
  // Profile state
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Security state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // Notification state
  const [notifPrefs, setNotifPrefs] = useState({
    alert_student_below_threshold: true, 
    session_not_closed_reminder: true, 
    weekly_summary: false, 
    new_student_enrolled: false
  });
  
  // General preferences state
  const [genPrefs, setGenPrefs] = useState({
    qr_expiry_mode: 'admin_default',
    custom_qr_expiry_mins: 5,
    date_format: 'DD/MM/YYYY'
  });
  const [adminQrDefaultMins, setAdminQrDefaultMins] = useState(15);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const profile = await profileAPI.getProfile();
      setProfileData(profile);
      
      if (profile.notification_preferences) {
        setNotifPrefs(profile.notification_preferences);
      }
      
      const prefsRes = await profileAPI.getGeneralPreferences();
      if (prefsRes.preferences) {
        setGenPrefs(prefsRes.preferences);
      }
      if (prefsRes.admin_qr_default_mins) {
        setAdminQrDefaultMins(prefsRes.admin_qr_default_mins);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const initials = lecturer?.lecturerName
    ? `${lecturer.lecturerName.split(' ')[0][0]}${lecturer.lecturerName.split(' ').length > 1 ? lecturer.lecturerName.split(' ')[1][0] : ''}` : 'LC';

  const tabs = [
    { key: 'personal', label: 'Personal Info' },
    { key: 'security', label: 'Security' },
    { key: 'preferences', label: 'Preferences' },
  ];

  const pwChecks = {
    length: newPw.length >= 8,
    number: /\d/.test(newPw),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPw),
  };
  const strength = [pwChecks.length, pwChecks.number, pwChecks.special].filter(Boolean).length;
  const strengthColors = ['', 'var(--accent-red)', 'var(--accent-amber)', 'var(--accent-green)'];

  const handleChangePassword = async () => {
    if (newPw !== confirmPw) {
      addToast('Passwords do not match', 'error');
      return;
    }
    if (strength < 3) {
      addToast('Password does not meet requirements', 'error');
      return;
    }
    
    try {
      setPwSaving(true);
      await profileAPI.changePassword(currentPw, newPw);
      addToast('Password updated successfully', 'success');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err) {
      addToast(err.message || 'Failed to update password', 'error');
    } finally {
      setPwSaving(false);
    }
  };

  const toggleNotifPref = async (key) => {
    const newPrefs = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(newPrefs);
    try {
      await profileAPI.updateNotificationPreferences(newPrefs);
      addToast('Notification preferences saved', 'success');
    } catch (err) {
      setNotifPrefs(notifPrefs); // revert on error
      addToast(err.message || 'Failed to save preferences', 'error');
    }
  };

  const saveGenPrefs = async (newPrefs) => {
    setGenPrefs(newPrefs);
    try {
      await profileAPI.updateGeneralPreferences(newPrefs);
      addToast('Preferences saved', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save preferences', 'error');
    }
  };

  if (loading || !profileData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  // Formatting date logic
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };
  
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl xl:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Profile & Settings</h1>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Profile Card */}
        <div className="rounded-[10px] border p-6 text-center"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="relative inline-block mb-3">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold mx-auto uppercase"
              style={{ backgroundColor: 'var(--accent-blue)', color: '#fff' }}>
              {initials}
            </div>
            <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center border-2"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}
              onClick={() => addToast('Photo upload coming soon', 'info')}>
              <Camera className="w-3 h-3" />
            </button>
          </div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{profileData.name}</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{profileData.department_name}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{profileData.staff_id}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{profileData.email}
            {profileData.is_verified && (
              <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-medium"
                style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)' }}>Verified</span>
            )}
          </p>
          <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>Member since {formatDate(profileData.created_at)}</p>

          <div className="grid grid-cols-3 gap-2 mt-5">
            {[
              { icon: BookOpen, value: profileData.course_count, label: 'Courses' },
              { icon: Radio, value: profileData.session_count, label: 'Sessions' },
              { icon: Users, value: profileData.total_students, label: 'Students' },
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
                <div className="group relative">
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Full Name</label>
                  <div className="relative">
                    <input type="text" value={profileData.name} readOnly
                      className="w-full h-11 px-3.5 pr-10 rounded-lg text-sm border outline-none"
                      style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-input)', color: 'var(--text-muted)' }}
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
                
                <div className="group relative">
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Phone Number</label>
                  <div className="relative">
                    <input type="tel" value={profileData.phone || 'N/A'} readOnly
                      className="w-full h-11 px-3.5 pr-10 rounded-lg text-sm border outline-none"
                      style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-input)', color: 'var(--text-muted)' }}
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
                
                <div className="group relative">
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Department</label>
                  <div className="relative">
                    <input type="text" value={profileData.department_name} readOnly
                      className="w-full h-11 px-3.5 pr-10 rounded-lg text-sm border"
                      style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-input)', color: 'var(--text-muted)' }}
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
                
                <div className="group relative">
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Email</label>
                  <div className="relative">
                    <input type="email" value={profileData.email} readOnly
                      className="w-full h-11 px-3.5 pr-10 rounded-lg text-sm border"
                      style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-input)', color: 'var(--text-muted)' }}
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Personal details can only be changed by your institution admin</p>
                </div>
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
                    <button onClick={handleChangePassword} disabled={pwSaving}
                      className="h-10 px-5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all"
                      style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                      {pwSaving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Login Activity</h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Last login: {profileData.last_login ? formatDateTime(profileData.last_login) : 'Unknown'} 
                    {profileData.last_login_device && ` from ${profileData.last_login_device}`}
                    {profileData.last_login_location && profileData.last_login_location !== 'Unknown IP' && ` (${profileData.last_login_location})`}
                  </p>
                  <p className="text-[11px] mt-2" style={{ color: 'var(--accent-amber)' }}>
                    If you don't recognize this activity, change your password immediately.
                  </p>
                </div>
              </div>
            )}


            {/* Preferences */}
            {activeTab === 'preferences' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Default QR Expiry</label>
                  <div className="flex gap-3 mb-3">
                    {[
                      { value: 'admin_default', label: `Use Admin Default (${adminQrDefaultMins} min)` },
                      { value: 'custom', label: 'Custom' }
                    ].map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all"
                          style={{ borderColor: genPrefs.qr_expiry_mode === opt.value ? 'var(--accent-primary)' : 'var(--border-input)' }}>
                          {genPrefs.qr_expiry_mode === opt.value && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />}
                        </div>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}
                          onClick={() => saveGenPrefs({...genPrefs, qr_expiry_mode: opt.value})}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  {genPrefs.qr_expiry_mode === 'custom' && (
                    <div className="flex items-center gap-2 mt-2">
                      <input 
                        type="number" min="1" max="60"
                        value={genPrefs.custom_qr_expiry_mins} 
                        onChange={e => saveGenPrefs({...genPrefs, custom_qr_expiry_mins: parseInt(e.target.value) || 5})}
                        className="w-20 h-10 px-3 rounded-lg text-sm border outline-none"
                        style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
                      />
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>minutes</span>
                    </div>
                  )}
                </div>
                <div className="pt-2">
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Date Format</label>
                  <div className="flex gap-3">
                    {['DD/MM/YYYY', 'MM/DD/YYYY'].map(f => (
                      <button key={f} onClick={() => saveGenPrefs({...genPrefs, date_format: f})}
                        className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                        style={{
                          backgroundColor: genPrefs.date_format === f ? 'var(--accent-primary)' : 'var(--bg-deep)',
                          color: genPrefs.date_format === f ? 'var(--bg-deep)' : 'var(--text-secondary)',
                          border: genPrefs.date_format === f ? 'none' : '1px solid var(--border-input)',
                        }}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}