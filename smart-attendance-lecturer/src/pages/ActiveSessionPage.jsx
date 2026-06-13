import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useToast } from '../components/shared/ToastManager';
import ConfirmModal from '../components/shared/ConfirmModal';
import QRCodeDisplay from '../components/session/QRCodeDisplay';
import VerificationCodeDisplay from '../components/session/VerificationCodeDisplay';
import LiveAttendanceTracker from '../components/session/LiveAttendanceTracker';
import { courses, checkInPool } from '../data/mockData';
import { Radio, RefreshCw, Clock, Info, CheckCircle, Users, BarChart3, Timer, Download, ScanFace, QrCode } from 'lucide-react';

export default function ActiveSessionPage() {
  const { sessionState, sessionData, startSession, endSession, resetSession, addCheckIn, refreshQR } = useSession();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmRefresh, setConfirmRefresh] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('CS301');
  const [sessionLabel, setSessionLabel] = useState('Week 9 Lecture');
  const [qrExpiry, setQrExpiry] = useState(15);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [duration, setDuration] = useState(0);
  const [showTab, setShowTab] = useState('present');
  const checkInRef = useRef(0);

  // Countdown timer
  useEffect(() => {
    if (sessionState !== 'active') return;
    const t = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
      setDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [sessionState]);

  // Simulated check-ins
  useEffect(() => {
    if (sessionState !== 'active') return;
    const interval = setInterval(() => {
      if (checkInRef.current >= 47) return;
      const idx = checkInRef.current;
      if (idx < checkInPool.length) {
        const method = Math.random() > 0.3 ? 'face' : 'qr';
        const now = new Date();
        addCheckIn({
          name: checkInPool[idx],
          method,
          time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
        });
        addToast(`${checkInPool[idx]} checked in via ${method === 'face' ? 'Face Scan' : 'QR Code'}`, 'success');
        checkInRef.current++;
      }
    }, 3000 + Math.random() * 1000);
    return () => clearInterval(interval);
  }, [sessionState, addCheckIn, addToast]);

  const formatTimer = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const formatDuration = (s) => `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60).toString().padStart(2, '0')}m`;

  const handleStart = () => {
    const course = courses.find(c => c.id === selectedCourse);
    startSession({
      courseId: selectedCourse,
      courseName: course.title,
      courseCode: course.code,
      label: sessionLabel || `${course.code} Session`,
      qrExpiry,
      totalStudents: course.totalStudents,
    });
    setTimeLeft(qrExpiry * 60);
    setDuration(0);
    checkInRef.current = 0;
  };

  const handleEnd = () => {
    setConfirmEnd(false);
    endSession();
  };

  const handleRefresh = () => {
    setConfirmRefresh(false);
    refreshQR();
    setTimeLeft(qrExpiry * 60);
    addToast('QR code refreshed', 'success');
  };

  // CONFIG STATE
  if (sessionState === 'config') {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-[600px] rounded-xl border p-6 xl:p-8"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Start Attendance Session</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Configure and launch a live session</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Course</label>
              <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
                className="w-full h-11 px-3 rounded-lg text-sm border outline-none"
                style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Session Label</label>
              <input type="text" value={sessionLabel} onChange={e => setSessionLabel(e.target.value)}
                placeholder="e.g. Week 5 Lecture — Introduction to SQL"
                className="w-full h-11 px-3.5 rounded-lg text-sm border outline-none"
                style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>QR Code Expiry Duration</label>
              <div className="flex gap-2">
                {[10, 15, 20, 30].map(min => (
                  <button key={min} onClick={() => setQrExpiry(min)}
                    className="flex-1 h-10 rounded-lg text-sm font-medium transition-all"
                    style={{
                      backgroundColor: qrExpiry === min ? 'var(--accent-primary)' : 'var(--bg-deep)',
                      color: qrExpiry === min ? 'var(--bg-deep)' : 'var(--text-secondary)',
                      border: qrExpiry === min ? 'none' : '1px solid var(--border-input)',
                    }}>
                    {min} min
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg" style={{ backgroundColor: 'rgba(59,130,246,0.08)' }}>
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-blue)' }} />
              <p className="text-xs" style={{ color: 'var(--accent-blue)' }}>
                A unique QR code and 6-character verification code will be generated. Display the QR code on your projector and announce the verification code verbally to students.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => navigate('/dashboard')}
                className="flex-1 h-11 rounded-lg text-sm font-medium border hover:bg-[var(--bg-raised)]"
                style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
                Cancel
              </button>
              <button onClick={handleStart}
                className="flex-1 h-11 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                Create Session & Go Live
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE STATE
  if (sessionState === 'active') {
    const timerIsLow = timeLeft < 120;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold animate-pulse-live"
              style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-green)' }} />
              SESSION LIVE
            </span>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{sessionData.label}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sessionData.courseName} · {sessionData.courseCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <span className={`text-sm font-mono font-medium ${timerIsLow ? 'animate-pulse-red' : ''}`}
              style={{ color: timerIsLow ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
              {timeLeft > 0 ? `Expires in: ${formatTimer(timeLeft)}` : 'QR Code Expired'}
            </span>
          </div>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* Left: QR + Verification */}
          <div className="xl:col-span-3 space-y-4">
            {/* QR Card */}
            <div className="rounded-[10px] border p-5" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
              <QRCodeDisplay />
              <div className="text-center mt-4">
                <p className={`text-2xl font-mono font-bold ${timerIsLow ? 'animate-pulse-red' : ''}`}
                  style={{ color: timerIsLow ? 'var(--accent-red)' : 'var(--accent-primary)' }}>
                  {timeLeft > 0 ? formatTimer(timeLeft) : 'EXPIRED'}
                </p>
                <button onClick={() => setConfirmRefresh(true)}
                  className={`mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border transition-colors hover:bg-[var(--bg-raised)] ${timeLeft === 0 ? 'animate-pulse-live' : ''}`}
                  style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh QR Code
                </button>
              </div>
            </div>

            <VerificationCodeDisplay code={sessionData.verificationCode} />
          </div>

          {/* Right: Live tracker */}
          <div className="xl:col-span-2">
            <LiveAttendanceTracker checkedIn={sessionData.checkedIn} total={sessionData.totalStudents} />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="fixed bottom-16 xl:bottom-0 left-0 xl:left-60 right-0 h-14 flex items-center justify-between px-4 xl:px-6 border-t z-30"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <Timer className="w-4 h-4" />
            <span>Session running: {formatDuration(duration)}</span>
          </div>
          <button onClick={() => setConfirmEnd(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: 'var(--accent-red)', color: '#fff' }}>
            End Session
          </button>
        </div>

        <div className="h-14" /> {/* spacer for bottom bar */}

        <ConfirmModal open={confirmEnd} onClose={() => setConfirmEnd(false)} onConfirm={handleEnd}
          title="End Session?" confirmLabel="End Session" confirmVariant="danger"
          message={`Are you sure? This will finalise attendance for all ${sessionData.totalStudents} students. Students not checked in will be marked Absent.`}
        />
        <ConfirmModal open={confirmRefresh} onClose={() => setConfirmRefresh(false)} onConfirm={handleRefresh}
          title="Refresh QR Code?" confirmLabel="Refresh" confirmVariant="primary"
          message="Generate a new QR code for this session? The current code will become invalid."
        />
      </div>
    );
  }

  // ENDED STATE
  if (sessionState === 'ended') {
    const presentCount = sessionData.checkedIn.length;
    const absentCount = sessionData.totalStudents - presentCount;
    const rate = sessionData.totalStudents > 0 ? ((presentCount / sessionData.totalStudents) * 100).toFixed(1) : 0;
    const faceCount = sessionData.checkedIn.filter(s => s.method === 'face').length;
    const qrCount = sessionData.checkedIn.filter(s => s.method === 'qr').length;
    const facePct = presentCount > 0 ? ((faceCount / presentCount) * 100).toFixed(1) : 0;
    const qrPct = presentCount > 0 ? ((qrCount / presentCount) * 100).toFixed(1) : 0;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success header */}
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
            <CheckCircle className="w-8 h-8" style={{ color: 'var(--accent-green)' }} />
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Session Ended Successfully</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{sessionData.courseName} · {sessionData.label}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="rounded-[10px] border p-4 text-center" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderTopWidth: '3px', borderTopColor: 'var(--accent-green)' }}>
            <p className="text-2xl font-bold" style={{ color: 'var(--accent-green)' }}>{presentCount}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>✓ Present</p>
          </div>
          <div className="rounded-[10px] border p-4 text-center" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderTopWidth: '3px', borderTopColor: 'var(--accent-red)' }}>
            <p className="text-2xl font-bold" style={{ color: 'var(--accent-red)' }}>{absentCount}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>✗ Absent</p>
          </div>
          <div className="rounded-[10px] border p-4 text-center" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderTopWidth: '3px', borderTopColor: 'var(--accent-primary)' }}>
            <p className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{rate}%</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>📊 Rate</p>
          </div>
          <div className="rounded-[10px] border p-4 text-center" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderTopWidth: '3px', borderTopColor: 'var(--accent-blue)' }}>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatDuration(duration)}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>⏱ Duration</p>
          </div>
        </div>

        {/* Method breakdown */}
        <div className="rounded-[10px] border p-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Method Breakdown</p>
          <div className="flex h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-raised)' }}>
            <div className="h-full" style={{ width: `${facePct}%`, backgroundColor: 'var(--accent-blue)' }} />
            <div className="h-full" style={{ width: `${qrPct}%`, backgroundColor: 'var(--accent-primary)' }} />
          </div>
          <div className="flex justify-between text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
            <span className="flex items-center gap-1"><ScanFace className="w-3 h-3" style={{ color: 'var(--accent-blue)' }} />{faceCount} Face Scan ({facePct}%)</span>
            <span className="flex items-center gap-1"><QrCode className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} />{qrCount} QR Code ({qrPct}%)</span>
          </div>
        </div>

        {/* Attendance Tabs */}
        <div>
          <div className="flex gap-1 border-b mb-4" style={{ borderColor: 'var(--border-subtle)' }}>
            {[['present', `Present (${presentCount})`], ['absent', `Absent (${absentCount})`]].map(([key, label]) => (
              <button key={key} onClick={() => setShowTab(key)}
                className="px-4 py-2.5 text-sm font-medium border-b-2 transition-all"
                style={{
                  borderColor: showTab === key ? 'var(--accent-primary)' : 'transparent',
                  color: showTab === key ? 'var(--accent-primary)' : 'var(--text-muted)',
                }}>
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {showTab === 'present' ? sessionData.checkedIn.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{ backgroundColor: 'var(--accent-blue)', color: '#fff' }}>
                  {s.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</p>
                </div>
                {s.method === 'face' ? <ScanFace className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} /> : <QrCode className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />}
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.time}</span>
              </div>
            )) : (
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{absentCount} students were absent from this session</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pb-8">
          <button onClick={() => addToast('Generating PDF report...', 'info')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button onClick={() => addToast('Generating Excel...', 'info')}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold border hover:bg-[var(--bg-raised)]"
            style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
            Export Excel
          </button>
          <button onClick={() => navigate(`/courses/${sessionData.courseId}`)}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold border hover:bg-[var(--bg-raised)]"
            style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
            Back to Course
          </button>
          <button onClick={resetSession}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold border hover:bg-[var(--bg-raised)]"
            style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
            Start Another Session
          </button>
        </div>
      </div>
    );
  }

  return null;
}