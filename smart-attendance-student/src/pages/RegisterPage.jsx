import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Lock, Check, Camera, X, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useAppConfig } from '../context/AppContext';
import { useStudentAuth } from '../context/AuthContext';
import { authAPI, setToken } from '../api/api';

export default function RegisterPage() {
  const { shortCode, logoUrl } = useAppConfig();
  const { loginSuccess } = useStudentAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [step, setStep] = useState(1);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [photoStatus, setPhotoStatus] = useState(null); // null | 'success' | 'error'
  const [photoError, setPhotoError] = useState('');
  
  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraLoading, setCameraLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setInitialError("No invitation token provided in URL.");
      setLoadingInitial(false);
      return;
    }

    authAPI.validateStudentInvitation(token)
      .then(data => {
        setStudentData(data);
        setLoadingInitial(false);
      })
      .catch(err => {
        setInitialError(err.message || "Invalid or expired invitation token.");
        setLoadingInitial(false);
      });
  }, [token]);

  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [initialError, setInitialError] = useState('');
  const [studentData, setStudentData] = useState(null);

  // Auto-open camera on step 2, cleanup on leaving
  useEffect(() => {
    if (step === 2 && !photoPreview) {
      startCamera();
    }
    return () => {
      if (step !== 2) stopCamera();
    };
  }, [step]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setCameraError('');
    setCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setCameraError('Could not access camera. Please allow camera access and try again.');
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    // Mirror horizontally since it's a selfie feed
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'face_photo.jpg', { type: 'image/jpeg' });
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(blob));
      setPhotoError('');
      stopCamera();
    }, 'image/jpeg', 0.92);
  };

  const retakePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoStatus(null);
    setPhotoError('');
    startCamera();
  };

  const hasLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const allChecks = hasLength && hasNumber && hasSpecial && passwordsMatch;

  const strength = [hasLength, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][strength];
  const strengthColor = ['', '#EF4444', '#F59E0B', '#10B981'][strength];

  const handleCompleteRegistration = async () => {
    setPhotoProcessing(true);
    setPhotoStatus(null);
    setPhotoError('');
    
    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('password', password);
      formData.append('face_photo', photoFile);

      // Step 1: Submit — returns task_id + student_id immediately
      const { task_id, student_id } = await authAPI.registerStudent(formData);

      // Step 2: Poll until Celery worker finishes face encoding
      let attempts = 0;
      const maxAttempts = 40; // 40 × 3s = 2 minutes max
      const poll = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await authAPI.pollRegisterStudent(task_id, student_id);
          if (statusRes.status === 'complete') {
            clearInterval(poll);
            await loginSuccess({ access_token: statusRes.access_token });
            setPhotoStatus('success');
            setPhotoProcessing(false);
            setTimeout(() => setStep(3), 800);
          } else if (statusRes.status === 'error') {
            clearInterval(poll);
            setPhotoError(statusRes.detail || 'Face encoding failed. Please try again.');
            setPhotoProcessing(false);
          } else if (attempts >= maxAttempts) {
            clearInterval(poll);
            setPhotoError('Face processing is taking too long. Please try again.');
            setPhotoProcessing(false);
          }
          // else still 'processing' — keep polling
        } catch (pollErr) {
          clearInterval(poll);
          setPhotoError(pollErr.message || 'Something went wrong during face verification.');
          setPhotoProcessing(false);
        }
      }, 3000);

    } catch (err) {
      setPhotoError(err.message || 'Failed to submit registration. Please try again.');
      setPhotoProcessing(false);
    }
  };


  useEffect(() => {
    if (step !== 3) return;
    const timer = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, navigate]);

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[
        { n: 1, label: 'Set Password' },
        { n: 2, label: 'Capture Face Photo' },
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

  if (loadingInitial) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 py-8" style={{ backgroundColor: 'var(--bg-deep)' }}>
         <Loader2 size={32} className="animate-spin mb-4" style={{ color: 'var(--accent-primary)' }} />
         <p style={{ color: 'var(--text-secondary)' }}>Validating invitation...</p>
      </div>
    );
  }

  if (initialError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 py-8" style={{ backgroundColor: 'var(--bg-deep)' }}>
        <div className="w-full max-w-[400px] text-center p-8 rounded-xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
           <AlertCircle size={48} className="mx-auto mb-4" style={{ color: 'var(--accent-red)' }} />
           <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Invalid Invitation</h2>
           <p style={{ color: 'var(--text-secondary)' }}>{initialError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8" style={{ backgroundColor: 'var(--bg-deep)' }}>
      <div className="w-full max-w-[520px] animate-fade-in-up">
        <div className="text-center mb-6">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="w-12 h-12 mx-auto mb-2 rounded-xl object-contain" />
          ) : (
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-primary)' }}>
              <GraduationCap size={24} style={{ color: 'var(--bg-deep)' }} />
            </div>
          )}
          <h1 className="font-playfair text-2xl" style={{ color: 'var(--text-primary)' }}>{shortCode || 'University Portal'}</h1>
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
                  { label: 'Full Name', value: studentData.name },
                  { label: 'Student ID', value: studentData.student_id },
                  { label: 'Email', value: studentData.email },
                  { label: 'Programme & Level', value: `${studentData.programme} · Level ${studentData.level}` },
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

          {/* STEP 2 - Camera Capture */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Take Your Face Photo</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Position your face clearly in the frame, then tap the capture button.</p>

              <div className="rounded-lg p-4 mb-6 flex items-start gap-3"
                style={{ backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <Camera size={18} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-blue)' }} />
                <div className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  <p>✓ Look straight into the camera</p>
                  <p>✓ Good lighting — not too dark or washed out</p>
                  <p>✓ Only your face in the frame, no other people</p>
                  <p>✓ Remove glasses or hats if possible</p>
                </div>
              </div>

              {/* Camera view or preview */}
              {!photoPreview ? (
                <div className="flex flex-col items-center">
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-4" style={{ backgroundColor: '#000', border: '1px solid var(--border-subtle)' }}>
                    {cameraLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                        <Loader2 size={32} className="animate-spin mb-3" style={{ color: 'var(--accent-primary)' }} />
                        <p className="text-sm">Starting camera...</p>
                      </div>
                    )}
                    {cameraError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        <AlertCircle size={32} className="mb-3" style={{ color: 'var(--accent-red)' }} />
                        <p className="text-sm mb-4" style={{ color: 'var(--accent-red)' }}>{cameraError}</p>
                        <button onClick={startCamera}
                          className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                          style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                          <RefreshCw size={14} /> Try Again
                        </button>
                      </div>
                    )}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)', display: cameraActive ? 'block' : 'none' }}
                    />
                    {/* Face guide overlay */}
                    {cameraActive && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-40 h-48 rounded-full border-2 border-dashed" style={{ borderColor: 'var(--accent-primary)', opacity: 0.6 }} />
                      </div>
                    )}
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  {cameraActive && (
                    <button
                      onClick={capturePhoto}
                      className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                      style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 0 4px rgba(255,255,255,0.15), 0 0 0 8px rgba(var(--accent-primary-rgb, 0,200,150),0.15)' }}
                    >
                      <Camera size={24} style={{ color: 'var(--bg-deep)' }} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center mb-6">
                  <div className="relative w-48 h-48 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-subtle)' }}>
                    <img src={photoPreview} alt="Captured Face" className="w-full h-full object-cover" />
                  </div>
                  <button onClick={retakePhoto} disabled={photoProcessing}
                    className="mt-4 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all hover:opacity-80 disabled:opacity-40"
                    style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                    <RefreshCw size={14} /> Retake Photo
                  </button>
                </div>
              )}

              {photoProcessing && (
                <div className="text-center py-4">
                  <Loader2 size={24} className="mx-auto animate-spin mb-2" style={{ color: 'var(--accent-primary)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Analysing your photo...</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Our AI is processing your face. This can take up to 60 seconds — please don't close this page.</p>
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
                {photoProcessing ? 'Processing...' : 'Complete Registration'}
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
                You're all set, {studentData?.name?.split(' ')[0]}! 🎉
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Your account is ready. You've been enrolled in {studentData?.courses?.length || 0} courses.
              </p>

              <div className="space-y-2 mb-6">
                {studentData?.courses?.map(c => (
                  <div key={c.code} className="rounded-lg px-4 py-3 text-left flex items-center justify-between"
                    style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
                    <div>
                      <span className="text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>{c.code}</span>
                      <span className="text-sm ml-2" style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Redirecting to your dashboard in {redirectCountdown} seconds...
              </p>
              <button onClick={() => {
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