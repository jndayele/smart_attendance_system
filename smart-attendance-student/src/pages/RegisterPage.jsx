import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, Check, Upload, Camera, X, AlertCircle, Loader2 } from 'lucide-react';
import { useAppConfig } from '../context/AppContext';
import { useStudentAuth } from '../context/AuthContext';

const DEMO_PREFILL = {
  name: "Kwame Asante",
  studentId: "STU-0001",
  email: "kwame.asante@student.university.edu",
  programme: "BSc Computer Science",
  level: "Level 300",
};

const COURSES_PREVIEW = [
  { code: "CS301", name: "Database Systems" },
  { code: "CS401", name: "Algorithms" },
  { code: "CS201", name: "Data Structures" },
];

export default function RegisterPage() {
  const { shortCode, logoUrl } = useAppConfig();
  const { login } = useStudentAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [photoStatus, setPhotoStatus] = useState(null); // null | 'success' | 'error'
  const [photoError, setPhotoError] = useState('');
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  const hasLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const allChecks = hasLength && hasNumber && hasSpecial && passwordsMatch;

  const strength = [hasLength, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][strength];
  const strengthColor = ['', '#EF4444', '#F59E0B', '#10B981'][strength];

  const handlePhotoSelect = () => {
    setPhotoPreview('/placeholder-face.jpg');
    setPhotoStatus(null);
    setPhotoError('');
  };

  const handleCompleteRegistration = () => {
    setPhotoProcessing(true);
    setPhotoStatus(null);
    setTimeout(() => {
      setPhotoProcessing(false);
      setPhotoStatus('success');
      setTimeout(() => setStep(3), 800);
    }, 2000);
  };

  useEffect(() => {
    if (step !== 3) return;
    const timer = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          login({ ...DEMO_PREFILL, firstName: "Kwame", department: "Computer Science", semester: "Semester 1" });
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, login, navigate]);

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[
        { n: 1, label: 'Set Password' },
        { n: 2, label: 'Upload Face Photo' },
        { n: 3, label: 'Complete' },
      ].map((s, i) => (
        <React.Fragment key={s.n}>
          {i > 0 && <div className="w-8 h-px" style={{ backgroundColor: step > s.n - 1 ? 'var(--accent-green)' : 'var(--text-muted)' }} />}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{
                backgroundColor: step > s.n ? 'var(--accent-green)' : step === s.n ? 'var(--accent-primary)' : 'transparent',
                color: step >= s.n ? 'var(--bg-deep)' : 'var(--text-muted)',
                border: step < s.n ? '1px solid var(--text-muted)' : 'none',
              }}>
              {step > s.n ? <Check size={14} /> : s.n}
            </div>
            <span className="text-xs hidden sm:inline"
              style={{ color: step >= s.n ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {s.label}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  const CheckItem = ({ checked, label }) => (
    <div className="flex items-center gap-2 text-sm">
      <div className="w-4 h-4 rounded flex items-center justify-center"
        style={{
          backgroundColor: checked ? 'var(--accent-green)' : 'transparent',
          border: checked ? 'none' : '1px solid var(--text-muted)',
        }}>
        {checked && <Check size={10} color="#fff" />}
      </div>
      <span style={{ color: checked ? 'var(--accent-green)' : 'var(--text-muted)' }}>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8" style={{ backgroundColor: 'var(--bg-deep)' }}>
      <div className="w-full max-w-[520px] animate-fade-in-up">
        <div className="text-center mb-6">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="w-12 h-12 mx-auto mb-2 rounded-xl" />
          ) : (
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-primary)' }}>
              <GraduationCap size={24} style={{ color: 'var(--bg-deep)' }} />
            </div>
          )}
          <h1 className="font-playfair text-2xl" style={{ color: 'var(--text-primary)' }}>{shortCode}</h1>
        </div>

        <StepIndicator />

        <div className="rounded-xl p-6 sm:p-8"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Complete Your Registration</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>You've been enrolled. Set your password to get started.</p>

              <div className="space-y-3 mb-6">
                {[
                  { label: 'Full Name', value: DEMO_PREFILL.name },
                  { label: 'Student ID', value: DEMO_PREFILL.studentId },
                  { label: 'Email', value: DEMO_PREFILL.email },
                  { label: 'Programme & Level', value: `${DEMO_PREFILL.programme} · ${DEMO_PREFILL.level}` },
                ].map(field => (
                  <div key={field.label}>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{field.label}</label>
                    <div className="flex items-center h-11 px-4 rounded-lg text-sm"
                      style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-secondary)' }}>
                      <Lock size={14} className="mr-2 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                      {field.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>New Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg text-sm outline-none transition-all"
                    style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-input)'} />
                  {password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-raised)' }}>
                        <div className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${(strength / 3) * 100}%`, backgroundColor: strengthColor }} />
                      </div>
                      <span className="text-xs font-medium" style={{ color: strengthColor }}>{strengthLabel}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg text-sm outline-none transition-all"
                    style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-input)'} />
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <CheckItem checked={hasLength} label="At least 8 characters" />
                <CheckItem checked={hasNumber} label="At least one number" />
                <CheckItem checked={hasSpecial} label="At least one special character (!@#$%...)" />
                <CheckItem checked={passwordsMatch} label="Passwords match" />
              </div>

              <button onClick={() => setStep(2)} disabled={!allChecks}
                className="w-full h-12 rounded-lg font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                Continue to Face Photo →
              </button>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Upload Your Face Photo</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>This photo will be used to verify your identity during attendance.</p>

              <div className="rounded-lg p-4 mb-6 flex items-start gap-3"
                style={{ backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <Camera size={18} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-blue)' }} />
                <div className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  <p>✓ Clear frontal view, no obstructions</p>
                  <p>✓ Good lighting — not too dark or washed out</p>
                  <p>✓ Only your face visible</p>
                  <p>✓ Minimum 300×300 pixels</p>
                </div>
              </div>

              {!photoPreview ? (
                <button onClick={handlePhotoSelect}
                  className="w-full py-12 rounded-xl border-2 border-dashed flex flex-col items-center gap-3 transition-colors hover:opacity-80"
                  style={{ borderColor: 'var(--border-btn)', backgroundColor: 'transparent' }}>
                  <Upload size={32} style={{ color: 'var(--text-muted)' }} />
                  <div className="text-center">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Drag & drop your photo here</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>or click to browse files</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Accepted: JPG, PNG — Max 5MB</p>
                  </div>
                </button>
              ) : (
                <div className="flex flex-col items-center mb-6">
                  <div className="relative w-48 h-48 rounded-xl overflow-hidden group">
                    <div className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--bg-raised)' }}>
                      <div className="w-24 h-24 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'var(--accent-green)' }}>
                        <span className="text-3xl font-semibold text-white">KA</span>
                      </div>
                    </div>
                    <button onClick={() => { setPhotoPreview(null); setPhotoStatus(null); }}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm font-medium text-white flex items-center gap-1"><X size={14} /> Remove</span>
                    </button>
                  </div>
                </div>
              )}

              {photoProcessing && (
                <div className="text-center py-4">
                  <Loader2 size={24} className="mx-auto animate-spin mb-2" style={{ color: 'var(--accent-primary)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Analysing your photo...</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Detecting face and extracting encoding. This may take a moment.</p>
                </div>
              )}

              {photoStatus === 'success' && (
                <div className="flex items-center gap-2 p-3 rounded-lg mt-4"
                  style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <Check size={16} style={{ color: 'var(--accent-green)' }} />
                  <p className="text-sm" style={{ color: 'var(--accent-green)' }}>Face detected successfully!</p>
                </div>
              )}

              {photoError && (
                <div className="flex items-start gap-2 p-3 rounded-lg mt-4"
                  style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-red)' }} />
                  <p className="text-sm" style={{ color: 'var(--accent-red)' }}>{photoError}</p>
                </div>
              )}

              <button onClick={handleCompleteRegistration} disabled={!photoPreview || photoProcessing}
                className="w-full h-12 rounded-lg font-semibold text-sm mt-6 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                Complete Registration
              </button>
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="text-center py-6 animate-fade-in-up">
              <svg viewBox="0 0 52 52" className="w-20 h-20 mx-auto mb-4">
                <circle cx="26" cy="26" r="25" fill="none" stroke="#10B981" strokeWidth="2" opacity="0.2" />
                <circle cx="26" cy="26" r="25" fill="none" stroke="#10B981" strokeWidth="2"
                  strokeDasharray="157" strokeDashoffset="0"
                  style={{ animation: 'draw-check 0.6s ease-out forwards' }} />
                <path fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  d="M14.1 27.2l7.1 7.2 16.7-16.8"
                  strokeDasharray="100" strokeDashoffset="0"
                  style={{ animation: 'draw-check 0.6s ease-out 0.3s forwards' }} />
              </svg>
              <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                You're all set, Kwame! 🎉
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Your account is ready. You've been enrolled in 3 courses.
              </p>

              <div className="space-y-2 mb-6">
                {COURSES_PREVIEW.map(c => (
                  <div key={c.code} className="rounded-lg px-4 py-3 text-left"
                    style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
                    <span className="text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>{c.code}</span>
                    <span className="text-sm ml-2" style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Redirecting to your dashboard in {redirectCountdown} seconds...
              </p>
              <button onClick={() => {
                login({ ...DEMO_PREFILL, firstName: "Kwame", department: "Computer Science", semester: "Semester 1" });
                navigate('/dashboard');
              }}
                className="w-full h-12 rounded-lg font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                Go to Dashboard Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}