import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio, ArrowLeft, Lock, ScanFace, QrCode, CheckCircle,
  Info, ArrowRight, Clock, Loader2, X, Lightbulb
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { studentAPI } from '../api/studentAPI';
import OTPInput from '../components/ui/OTPInput';
import CameraViewfinder from '../components/attendance/CameraViewfinder';

// Step components
function NotifyStep() {
  const { session, formattedTime, isUrgent, setAttendanceStep } = useSession();
  const navigate = useNavigate();

  return (
    <div className="text-center animate-fade-in-up">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center animate-pulse-dot"
        style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}>
        <Radio size={36} style={{ color: 'var(--accent-primary)' }} />
      </div>
      <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Attendance Session Active!</h2>
      <p className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        {session?.course_title} — {session?.course_code}
      </p>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Lecturer: {session?.lecturer_name}</p>
      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Started: {session?.startedMinutesAgo} minutes ago</p>
      <p className="text-4xl font-semibold font-mono mb-6" style={{ color: isUrgent ? 'var(--accent-red)' : 'var(--accent-primary)' }}>
        {formattedTime}
      </p>
      <div className="rounded-lg p-3 mb-6 text-sm text-left flex items-start gap-2"
        style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
        <Info size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-blue)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>
          Make sure you are physically present in the classroom before proceeding.
        </span>
      </div>
      <button onClick={() => setAttendanceStep('code')}
        className="w-full h-12 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
        style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
        Proceed to Mark Attendance <ArrowRight size={16} />
      </button>
      <button onClick={() => navigate('/dashboard')}
        className="w-full h-10 mt-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
        style={{ color: 'var(--text-secondary)' }}>
        Not Now
      </button>
    </div>
  );
}

function CodeStep() {
  const { session, setAttendanceStep } = useSession();
  const navigate = useNavigate();
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleComplete = async (code) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await studentAPI.verifySessionCode(session.session_id, code);
      if (res.verified) {
        setAttendanceStep('method');
      } else {
        setError(true);
        setAttempts(3 - res.attempts_remaining);
        setErrorMsg(res.message || `Incorrect code. Please check with your lecturer. ${res.attempts_remaining} attempts remaining.`);
        setTimeout(() => setError(false), 700);
        if (res.locked_out) setLocked(true);
      }
    } catch (err) {
      setError(true);
      setErrorMsg(err.message || 'An error occurred connecting to the server.');
      setTimeout(() => setError(false), 700);
      // Fallback local lock if API returns 403 locked
      if (err.message && err.message.includes('locked')) setLocked(true);
    } finally {
      setLoading(false);
    }
  };

  if (locked) {
    return (
      <div className="text-center animate-fade-in-up">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}>
          <Lock size={28} style={{ color: 'var(--accent-red)' }} />
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>You have been locked out of this session</h2>
        <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>3 incorrect attempts. You can no longer mark attendance for this session.</p>
        <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>If this was a mistake, speak to your lecturer directly.</p>
        <button onClick={() => navigate('/dashboard')}
          className="w-full h-12 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
          style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setAttendanceStep('notify')} style={{ color: 'var(--text-secondary)' }}><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Step 1 of 3 — Verify Presence</p>
          <div className="h-1 mt-1 rounded-full" style={{ backgroundColor: 'var(--bg-raised)' }}>
            <div className="h-full rounded-full" style={{ width: '33%', backgroundColor: 'var(--accent-primary)' }} />
          </div>
        </div>
      </div>

      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}>
          <Lock size={24} style={{ color: 'var(--accent-primary)' }} />
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Enter Session Code</h2>
        <p className="text-sm italic mb-8" style={{ color: 'var(--text-secondary)' }}>
          Your lecturer has announced a session code. Enter it below to confirm you are physically present in the classroom.
        </p>

        <div className="relative">
          <OTPInput length={session?.code_length || 6} onComplete={handleComplete} error={error} disabled={locked || loading} />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
            </div>
          )}
        </div>

        {errorMsg && (
          <p className="text-sm mt-4" style={{ color: 'var(--accent-red)' }}>
            {errorMsg}
          </p>
        )}

        <p className="text-xs mt-8" style={{ color: 'var(--text-muted)' }}>
          Forgot the code? Ask your lecturer to announce it again.
        </p>
      </div>
    </div>
  );
}

function MethodStep() {
  const { setAttendanceStep, setSelectedMethod } = useSession();

  const select = (method) => {
    setSelectedMethod(method);
    setAttendanceStep(method);
  };

  return (
    <div className="animate-fade-in-up">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setAttendanceStep('code')} style={{ color: 'var(--text-secondary)' }}><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Step 2 of 3 — Choose Method</p>
          <div className="h-1 mt-1 rounded-full" style={{ backgroundColor: 'var(--bg-raised)' }}>
            <div className="h-full rounded-full" style={{ width: '66%', backgroundColor: 'var(--accent-primary)' }} />
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>How would you like to mark attendance?</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Both methods are equally valid.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Face scan */}
        <button onClick={() => select('face')}
          className="text-left p-5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 group"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-purple)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ backgroundColor: 'rgba(139,92,246,0.15)' }}>
            <ScanFace size={24} style={{ color: 'var(--accent-purple)' }} />
          </div>
          <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Scan My Face</h3>
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>Use your front camera to verify your identity</p>
          <div className="space-y-1 text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            <p>✓ Quick and hands-free</p>
            <p>✓ No need to point at screen</p>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: 'var(--accent-green)' }}>Recommended</span>
        </button>

        {/* QR code */}
        <button onClick={() => select('qr')}
          className="text-left p-5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 group"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ backgroundColor: 'rgba(59,130,246,0.15)' }}>
            <QrCode size={24} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Scan QR Code</h3>
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>Point your camera at the QR code on the projector</p>
          <div className="space-y-1 text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            <p>✓ Works if camera has issues</p>
            <p>✓ Reliable fallback option</p>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: 'var(--accent-blue)' }}>Fallback Option</span>
        </button>
      </div>
    </div>
  );
}

function FaceScanStep() {
  const { session, setAttendanceStep, setSelectedMethod, refreshSession, setAttendancePct } = useSession();
  const [scanState, setScanState] = useState('scanning');
  const [failed, setFailed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const cameraRef = React.useRef(null);

  const performScan = async () => {
    if (scanState !== 'scanning' || !cameraRef.current) return;
    try {
      setScanState('detected');
      // Briefly pause to simulate capturing
      await new Promise(r => setTimeout(r, 800));
      setScanState('processing');

      const imageFile = await cameraRef.current.captureImage();
      if (!imageFile) throw new Error("Failed to capture image from camera.");

      const res = await studentAPI.markAttendanceFace(session.session_id, imageFile);
      if (res.success && res.task_id) {
        // Poll for task completion
        let status = 'processing';
        let result = null;
        while (status === 'processing') {
          await new Promise(r => setTimeout(r, 1000)); // wait 1 second
          result = await studentAPI.checkFaceStatus(res.task_id);
          status = result.status;
        }

        if (status === 'success') {
          setScanState('done');
          // Refresh session to update already_marked state for future polls
          await refreshSession();
          // The face task result doesn't return pct; set null so SuccessStep hides the bar
          setAttendancePct(null);
          setAttendanceStep('success');
        } else {
          throw new Error(result.message || "Verification failed");
        }
      } else {
        throw new Error(res.message || "Failed to initiate scan");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Verification failed');
      setFailed(true);
      setScanState('done'); // Stop processing state
    }
  };

  useEffect(() => {
    if (scanState === 'scanning') {
      const timer = setTimeout(() => {
        performScan();
      }, 3000); // Wait 3s before auto-capturing
      return () => clearTimeout(timer);
    }
  }, [scanState]);

  const retry = () => {
    setFailed(false);
    setErrorMsg('');
    setScanState('scanning');
  };

  return (
    <div className="animate-fade-in-up">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setAttendanceStep('method')} style={{ color: 'var(--text-secondary)' }}><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Step 3 of 3 — Face Verification</p>
          <div className="h-1 mt-1 rounded-full" style={{ backgroundColor: 'var(--bg-raised)' }}>
            <div className="h-full rounded-full" style={{ width: '100%', backgroundColor: 'var(--accent-purple)' }} />
          </div>
        </div>
      </div>

      <CameraViewfinder ref={cameraRef} type="face" state={scanState}>
        {scanState === 'scanning' && (
          <>
            <p className="text-sm font-medium text-white">Position your face inside the frame</p>
            <p className="text-xs text-white/60 mt-1">Auto-capturing in a few seconds...</p>
          </>
        )}
        {scanState === 'detected' && (
          <p className="text-sm font-medium" style={{ color: 'var(--accent-green)' }}>Capturing...</p>
        )}
        {scanState === 'processing' && (
          <div className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent-purple)' }} />
            <span className="text-sm" style={{ color: 'var(--accent-purple)' }}>Verifying identity...</span>
          </div>
        )}
      </CameraViewfinder>

      {scanState === 'processing' && (
        <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
          Comparing with your registered face encoding
        </p>
      )}

      {failed && (
        <div className="mt-4 p-4 rounded-xl animate-fade-in-up"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <div className="flex items-center gap-2 mb-2">
            <X size={18} style={{ color: 'var(--accent-red)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--accent-red)' }}>Face Verification Failed</h3>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>{errorMsg}</p>
          <ul className="text-xs space-y-1 mb-4" style={{ color: 'var(--text-muted)' }}>
            <li>• Poor lighting in the room</li>
            <li>• Face not clearly visible</li>
            <li>• Camera quality issues</li>
          </ul>
          <div className="flex gap-2">
            <button onClick={retry}
              className="flex-1 h-10 rounded-lg text-xs font-medium transition-colors"
              style={{ border: '1px solid var(--border-btn)', color: 'var(--text-secondary)' }}>
              Try Face Scan Again
            </button>
            <button onClick={() => { setSelectedMethod('qr'); setAttendanceStep('qr'); }}
              className="flex-1 h-10 rounded-lg text-xs font-semibold transition-colors"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
              Switch to QR Code →
            </button>
          </div>
        </div>
      )}

      {!failed && (
        <div className="flex gap-2 mt-4">
          <button onClick={() => { setSelectedMethod('qr'); setAttendanceStep('qr'); }}
            className="flex-1 h-10 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-btn)' }}>
            Switch to QR Code
          </button>
        </div>
      )}
    </div>
  );
}

function QRScanStep() {
  const { session, setAttendanceStep, setSelectedMethod, refreshSession, setAttendancePct } = useSession();
  const [scanState, setScanState] = useState('scanning');
  const [errorMsg, setErrorMsg] = useState('');
  const cameraRef = React.useRef(null);

  useEffect(() => {
    if (scanState !== 'scanning') return;

    const interval = setInterval(async () => {
      if (!cameraRef.current) return;
      const qrData = cameraRef.current.scanQR();
      if (qrData) {
        clearInterval(interval);
        try {
          setScanState('detected');
          await new Promise(r => setTimeout(r, 500));
          setScanState('processing');

          const res = await studentAPI.markAttendanceQR(session.session_id, qrData);
          if (res.success) {
            setScanState('done');
            setAttendancePct(res.updated_attendance_pct ?? null);
            await refreshSession();
            setAttendanceStep('success');
          } else {
            throw new Error(res.message || "Invalid QR code");
          }
        } catch (err) {
          setErrorMsg(err.message || 'Verification failed. Try again.');
          setScanState('scanning');
          setTimeout(() => setErrorMsg(''), 3000);
        }
      }
    }, 500); // Check every 500ms

    return () => clearInterval(interval);
  }, [scanState, session.session_id, setAttendanceStep, refreshSession]);

  return (
    <div className="animate-fade-in-up">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setAttendanceStep('method')} style={{ color: 'var(--text-secondary)' }}><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Step 3 of 3 — Scan QR Code</p>
          <div className="h-1 mt-1 rounded-full" style={{ backgroundColor: 'var(--bg-raised)' }}>
            <div className="h-full rounded-full" style={{ width: '100%', backgroundColor: 'var(--accent-blue)' }} />
          </div>
        </div>
      </div>

      <CameraViewfinder ref={cameraRef} type="qr" state={scanState}>
        {scanState === 'scanning' && (
          <>
            <p className="text-sm font-medium text-white">Point your camera at the QR code on the projector screen</p>
            <p className="text-xs text-white/60 mt-1">Make sure the QR code is fully visible in the frame</p>
          </>
        )}
        {scanState === 'detected' && (
          <div className="flex items-center justify-center gap-2">
            <CheckCircle size={16} style={{ color: 'var(--accent-blue)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--accent-blue)' }}>QR Code detected!</span>
          </div>
        )}
        {scanState === 'processing' && (
          <div className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent-blue)' }} />
            <span className="text-sm" style={{ color: 'var(--accent-blue)' }}>Validating QR Code...</span>
          </div>
        )}
      </CameraViewfinder>

      {errorMsg && (
        <div className="mt-2 text-center text-sm" style={{ color: 'var(--accent-red)' }}>
          {errorMsg}
        </div>
      )}

      {/* Tip card */}
      {scanState === 'scanning' && (
        <div className="mt-4 p-3 rounded-lg flex items-start gap-2"
          style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
          <Lightbulb size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-amber)' }} />
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Tip: Move closer if the QR code appears small, or ask your lecturer to zoom in on the projector.
          </p>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button onClick={() => { setSelectedMethod('face'); setAttendanceStep('face'); }}
          className="flex-1 h-10 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-btn)' }}>
          Switch to Face Scan
        </button>
      </div>
    </div>
  );
}

function SuccessStep() {
  const { session, selectedMethod, clearSession, attendancePct } = useSession();
  const navigate = useNavigate();
  const isFace = selectedMethod === 'face';
  const methodColor = isFace ? 'var(--accent-purple)' : 'var(--accent-blue)';
  const MethodIcon = isFace ? ScanFace : QrCode;
  const methodLabel = isFace ? 'Face Scan' : 'QR Code';
  const displayPct = attendancePct != null ? Math.round(attendancePct) : null;
  const isGood = displayPct != null && displayPct >= 75;

  const handleReturn = () => {
    clearSession();
    navigate('/dashboard');
  };

  return (
    <div className="text-center animate-fade-in-up">
      {/* Confetti particles */}
      <div className="relative h-0 overflow-visible">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#3B82F6'][i],
              left: `${10 + i * 12}%`,
              top: '-20px',
              animation: `confetti-fall ${1 + i * 0.15}s ease-out ${i * 0.1}s forwards`,
            }} />
        ))}
      </div>

      <svg viewBox="0 0 52 52" className="w-24 h-24 mx-auto mb-6">
        <circle cx="26" cy="26" r="25" fill="none" stroke="#10B981" strokeWidth="2" opacity="0.2" />
        <circle cx="26" cy="26" r="25" fill="none" stroke="#10B981" strokeWidth="2"
          strokeDasharray="157" strokeDashoffset="0" className="animate-draw-check" />
        <path fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          d="M14.1 27.2l7.1 7.2 16.7-16.8"
          strokeDasharray="100" strokeDashoffset="0"
          style={{ animation: 'draw-check 0.6s ease-out 0.3s forwards' }} />
      </svg>

      <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Attendance Marked!</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>You're confirmed present for this session.</p>

      {/* Session details */}
      <div className="rounded-xl p-4 mb-4 text-left"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Course</span><span style={{ color: 'var(--text-primary)' }}>{session?.course_title} — {session?.course_code}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Session</span><span style={{ color: 'var(--text-primary)' }}>Live Session</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Date</span><span style={{ color: 'var(--text-primary)' }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Method</span>
            <span className="flex items-center gap-1.5" style={{ color: methodColor }}>
              <MethodIcon size={14} /> {methodLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Updated stat */}
      {displayPct != null && (
      <div className="rounded-xl p-4 mb-6"
        style={{ backgroundColor: isGood ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${isGood ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}` }}>
        <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Updated Attendance</p>
        <p className="text-3xl font-semibold transition-all" style={{ color: isGood ? 'var(--accent-green)' : 'var(--accent-primary)' }}>{displayPct}%</p>
        <div className="h-1.5 rounded-full mt-2" style={{ backgroundColor: 'var(--bg-raised)' }}>
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${displayPct}%`, backgroundColor: isGood ? 'var(--accent-green)' : 'var(--accent-primary)' }} />
        </div>
        <p className="text-xs mt-2" style={{ color: isGood ? 'var(--accent-green)' : 'var(--accent-primary)' }}>
          {isGood ? `You're at ${displayPct}%. Keep it up!` : `You're at ${displayPct}%. Attend more to reach 75%.`}
        </p>
      </div>
      )}

      <button onClick={handleReturn}
        className="w-full h-12 rounded-lg font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
        Return to Dashboard
      </button>
      <button onClick={() => { clearSession(); navigate('/history'); }}
        className="w-full h-10 mt-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
        style={{ color: 'var(--text-secondary)' }}>
        View My Attendance →
      </button>
    </div>
  );
}

function AlreadyMarkedStep() {
  const { session, clearSession } = useSession();
  const navigate = useNavigate();

  const checkedInTime = session?.started_at
    ? new Date(session.started_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div className="text-center animate-fade-in-up">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(59,130,246,0.15)' }}>
        <Info size={28} style={{ color: 'var(--accent-blue)' }} />
      </div>
      <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Already Checked In</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>You've already marked attendance for this session.</p>
      <div className="rounded-xl p-4 mb-6 text-left"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Course</span><span style={{ color: 'var(--text-primary)' }}>{session?.course_title} — {session?.course_code}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Session started</span><span style={{ color: 'var(--text-primary)' }}>{checkedInTime}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Status</span>
            <span className="flex items-center gap-1.5" style={{ color: 'var(--accent-green)' }}>
              <CheckCircle size={14} /> Present
            </span>
          </div>
        </div>
      </div>
      <button onClick={() => { clearSession(); navigate('/dashboard'); }}
        className="w-full h-12 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
        style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
        Return to Dashboard
      </button>
    </div>
  );
}

function NoSessionStep() {
  const navigate = useNavigate();
  return (
    <div className="text-center animate-fade-in-up">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-raised)' }}>
        <Clock size={28} style={{ color: 'var(--text-muted)' }} />
      </div>
      <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No Active Session</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        There's no attendance session active right now. Your lecturer will start one during class.
      </p>
      <button onClick={() => navigate('/dashboard')}
        className="w-full h-12 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
        style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
        Return to Dashboard
      </button>
    </div>
  );
}

export default function MarkAttendancePage() {
  const { isSessionActive, attendanceStep } = useSession();

  const STEPS = {
    notify: NotifyStep,
    code: CodeStep,
    method: MethodStep,
    face: FaceScanStep,
    qr: QRScanStep,
    success: SuccessStep,
    already_marked: AlreadyMarkedStep,
  };

  if (!isSessionActive && attendanceStep === 'notify') {
    return (
      <div className="max-w-lg mx-auto flex items-center justify-center min-h-[60vh]">
        <NoSessionStep />
      </div>
    );
  }

  const StepComponent = STEPS[attendanceStep] || NotifyStep;

  return (
    <div className="max-w-lg mx-auto flex items-center justify-center min-h-[60vh]">
      <div className="w-full">
        <StepComponent />
      </div>
    </div>
  );
}