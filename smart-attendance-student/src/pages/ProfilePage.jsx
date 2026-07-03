import React, { useState, useEffect, useRef } from 'react';
import {
  Lock, Check, Shield, Camera, User, Eye, EyeOff, AlertTriangle, Loader2, Upload, Video
} from 'lucide-react';
import { useStudentAuth } from '../context/AuthContext';
import { useAppConfig } from '../context/AppContext';
import { useToast } from '../components/ui/AppToast';
import { studentAPI } from '../api/studentAPI';
import CameraViewfinder from '../components/attendance/CameraViewfinder';

const TABS = [
  { id: 'info', label: 'Personal Info', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'face', label: 'Face Photo', icon: Camera },
];

export default function ProfilePage() {
  const auth = useStudentAuth();
  const { institutionName } = useAppConfig();
  const addToast = useToast();
  
  const [activeTab, setActiveTab] = useState('info');
  const [profile, setProfile] = useState(/** @type {any} */ ({}));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await studentAPI.getProfile();
      setProfile(data);
    } catch (err) {
      addToast((err instanceof Error ? err.message : 'Failed to load profile') || 'Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  if (!profile) return null;

  const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
  const overallPct = profile.overall_stats?.overall_avg_pct || 0;
  const totalCourses = profile.overall_stats?.total_courses || 0;
  const sessionsAttended = profile.overall_stats?.sessions_attended || 0;
  const sessionsTotal = profile.overall_stats?.sessions_total || 0;

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
            </div>
            <h2 className="font-playfair text-lg text-center" style={{ color: 'var(--text-primary)' }}>{profile.name}</h2>
            <p className="text-xs text-center mb-1" style={{ color: 'var(--text-secondary)' }}>{profile.student_number}</p>
            <p className="text-xs text-center mb-4" style={{ color: 'var(--text-muted)' }}>
              {profile.email}
              <span className="inline-flex items-center gap-0.5 ml-1 text-[10px] px-1 py-0.5 rounded"
                style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: 'var(--accent-green)' }}>
                <Check size={8} /> Verified
              </span>
            </p>

            <div className="space-y-2 text-xs">
              {[
                { label: 'Programme', value: profile.programme_name },
                { label: 'Level', value: profile.level },
                { label: 'Department', value: profile.department_name },
                { label: 'Semester', value: profile.semester_of_entry }, // This acts as entry semester/cohort
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
                <p className="text-base font-semibold" style={{ color: 'var(--accent-primary)' }}>{overallPct.toFixed(1)}%</p>
                <p style={{ color: 'var(--text-muted)' }}>Average</p>
              </div>
              <div>
                <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{totalCourses}</p>
                <p style={{ color: 'var(--text-muted)' }}>Courses</p>
              </div>
              <div>
                <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{sessionsAttended}/{sessionsTotal}</p>
                <p style={{ color: 'var(--text-muted)' }}>Sessions</p>
              </div>
            </div>

            <div className="h-px my-4" style={{ backgroundColor: 'var(--border-subtle)' }} />

            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--text-muted)' }}>Account Status</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ backgroundColor: profile.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: profile.is_active ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: profile.is_active ? 'var(--accent-green)' : 'var(--accent-red)' }} /> {profile.is_active ? 'Active' : 'Suspended'}
              </span>
            </div>
            <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
              Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
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
            {activeTab === 'info' && <PersonalInfoTab profile={profile} />}
            {activeTab === 'security' && <SecurityTab addToast={addToast} profile={profile} />}
            {activeTab === 'face' && <FacePhotoTab addToast={addToast} profile={profile} refreshProfile={loadProfile} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonalInfoTab({ profile }) {
  return (
    <>
      <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Personal Information</h3>
      
      <div className="space-y-3 mb-6">
        {[
          { label: 'Full Name', value: profile.name },
          { label: 'Student ID', value: profile.student_number },
          { label: 'Email', value: profile.email },
          { label: 'Programme', value: profile.programme_name },
          { label: 'Department', value: profile.department_name },
          { label: 'Level', value: profile.level },
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
        Personal details are managed by your institution admin. Contact admin to update your name, email, or academic details.
      </p>
    </>
  );
}

function SecurityTab({ addToast, profile }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [processing, setProcessing] = useState(false);

  const hasLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  const allChecks = hasLength && hasNumber && hasSpecial && passwordsMatch && currentPassword;

  const handleUpdatePassword = async () => {
    try {
      setProcessing(true);
      await studentAPI.changePassword(currentPassword, newPassword, confirmPassword);
      addToast('Password updated successfully.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      addToast(err.message || 'Failed to update password', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

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

      <button disabled={!allChecks || processing}
        onClick={handleUpdatePassword}
        className="h-10 px-6 rounded-lg font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
        {processing ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
      </button>

      <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Last Login</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
          {formatDate(profile.last_login)} · {profile.last_login_device || 'Unknown Device'} · {profile.last_login_location || 'Unknown Location'}
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Not you? Change your password immediately.</p>
      </div>
    </>
  );
}

function FacePhotoTab({ addToast, profile, refreshProfile }) {
  const [processing, setProcessing] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const fileInputRef = useRef(null);
  const cameraRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await performUpload(file);
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const file = await cameraRef.current.captureImage();
      if (!file) {
        addToast('Failed to capture image.', 'error');
        return;
      }
      setCameraMode(false);
      await performUpload(file);
    } catch (err) {
      addToast('Error capturing image.', 'error');
    }
  };

  const performUpload = async (file) => {
    try {
      setProcessing(true);
      await studentAPI.updateFacePhoto(file);
      addToast('Face photo updated and encoding refreshed.', 'success');
      await refreshProfile();
    } catch (err) {
      addToast(err.message || 'Failed to update face photo', 'error');
    } finally {
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Update Your Face Photo</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Used for face recognition during attendance marking.</p>
        </div>
        {cameraMode && (
          <button onClick={() => setCameraMode(false)}
            className="text-xs font-medium hover:underline" style={{ color: 'var(--text-secondary)' }}>
            Cancel Camera
          </button>
        )}
      </div>

      {cameraMode ? (
        <div className="mb-6 animate-fade-in">
          <CameraViewfinder ref={cameraRef} type="face" state="scanning">
            <p className="text-white text-sm font-medium mb-3">Position your face within the frame</p>
            <button onClick={handleCapture} disabled={processing}
              className="px-6 py-2.5 rounded-full font-semibold text-sm transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
              {processing ? 'Processing...' : 'Capture Photo'}
            </button>
          </CameraViewfinder>
        </div>
      ) : (
        <>
          {/* Current status */}
          <div className="flex items-start gap-2 p-3 rounded-lg mb-4"
            style={{ backgroundColor: profile.face_registered ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: profile.face_registered ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(239,68,68,0.15)' }}>
            {profile.face_registered ? (
              <Check size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-green)' }} />
            ) : (
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-red)' }} />
            )}
            <div>
              <p className="text-sm font-medium" style={{ color: profile.face_registered ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {profile.face_registered ? 'Face encoding registered' : 'No face encoding registered'}
              </p>
              {profile.face_registered && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Your face encoding is active and ready for attendance.</p>}
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-4 mt-6">
            <input 
              type="file" 
              accept="image/png, image/jpeg" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            
            <button onClick={() => !processing && fileInputRef.current?.click()}
              disabled={processing}
              className="w-48 h-40 rounded-xl flex flex-col items-center justify-center gap-3 transition-all hover:bg-opacity-80"
              style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <Upload size={24} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <span className="text-sm font-medium">Upload File</span>
            </button>

            <button onClick={() => setCameraMode(true)}
              disabled={processing}
              className="w-48 h-40 rounded-xl flex flex-col items-center justify-center gap-3 transition-all hover:bg-opacity-80"
              style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <Video size={24} style={{ color: 'var(--accent-green)' }} />
              </div>
              <span className="text-sm font-medium">Open Camera</span>
            </button>
          </div>
        </>
      )}

      {processing && (
        <div className="text-center py-3 animate-fade-in">
          <Loader2 size={20} className="mx-auto animate-spin mb-1" style={{ color: 'var(--accent-primary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>Analysing photo...</p>
        </div>
      )}

      <div className="flex items-start gap-2 p-3 rounded-lg mt-4"
        style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-amber)' }} />
        <p className="text-xs" style={{ color: 'var(--accent-amber)' }}>
          Updating your face photo will replace your current encoding. The new photo must be of the same person currently registered.
        </p>
      </div>
    </>
  );
}