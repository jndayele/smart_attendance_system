import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/shared/ToastManager';
import ConfirmModal from '../components/shared/ConfirmModal';
import QRCodeDisplay from '../components/session/QRCodeDisplay';
import VerificationCodeDisplay from '../components/session/VerificationCodeDisplay';
import LiveAttendanceTracker from '../components/session/LiveAttendanceTracker';
import { activeSessionAPI, coursesAPI, reportsAPI } from '../api/dashboardAPI';
import { Radio, RefreshCw, Clock, Info, CheckCircle, Users, BarChart3, Timer, Download, ScanFace, QrCode, Loader2, Lock } from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTimer(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function formatDuration(totalSecs) {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ActiveSessionPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Page state machine: 'config' | 'loading' | 'active' | 'ending' | 'ended'
  const [phase, setPhase] = useState('config');

  // Config form
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [sessionLabel, setSessionLabel] = useState('');
  const [qrExpiry, setQrExpiry] = useState(15);          // minutes
  const [prefs, setPrefs] = useState(null);               // {qr_expiry_mode, custom_qr_expiry_mins, admin_qr_default_mins}
  const [prefsLoading, setPrefsLoading] = useState(true);

  // Active session live state
  const [liveData, setLiveData] = useState(null);         // ActiveSessionResponse from backend
  const [qrBase64, setQrBase64] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [durationSecs, setDurationSecs] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState(null);

  // Ended state
  const [endedData, setEndedData] = useState(null);       // SessionEndResponse
  const [showTab, setShowTab] = useState('present');

  // Modals
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmRefresh, setConfirmRefresh] = useState(false);

  const pollRef = useRef(null);
  const tickRef = useRef(null);

  // ── Config: Load courses & preferences ────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      try {
        const [coursesRes, prefsRes] = await Promise.all([
          coursesAPI.getMyCourses({ isActive: true, limit: 100 }),
          activeSessionAPI.getPreferences(),
        ]);
        const courseList = coursesRes.courses || [];
        setCourses(courseList);
        if (courseList.length > 0) setSelectedCourseId(courseList[0].id);

        const p = prefsRes.preferences || {};
        const adminDefault = prefsRes.admin_qr_default_mins || 15;
        setPrefs({ ...p, admin_qr_default_mins: adminDefault });

        // Set the initial expiry value
        if (p.qr_expiry_mode === 'admin_default') {
          setQrExpiry(adminDefault);
        } else {
          setQrExpiry(p.custom_qr_expiry_mins || 15);
        }
      } catch (err) {
        addToast('Failed to load session setup', 'error');
      } finally {
        setPrefsLoading(false);
      }
    };

    // Also check if there's already an active session we need to resume
    const resume = async () => {
      try {
        const active = await activeSessionAPI.getActiveSession();
        // There's an active session — resume it
        const sid = String(active.id);
        setSessionId(sid);
        setLiveData(active);
        setQrBase64(active.qr_image_base64);
        setSecondsLeft(active.seconds_until_qr_expiry || 0);
        setSessionStartedAt(Date.now() - (active.duration_minutes ? active.duration_minutes * 60000 : 0));
        setDurationSecs(active.duration_minutes ? active.duration_minutes * 60 : 0);
        setPhase('active');
        startPolling(sid);
      } catch {
        // No active session, stay in config phase
        init();
        return;
      }
      // Still need to load prefs for the config page if they navigate back
      init();
    };
    resume();
  }, []);

  // ── Live polling ───────────────────────────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  }, []);

  const startPolling = useCallback((sid) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const data = await activeSessionAPI.getActiveSession();
        setLiveData(data);
        if (data.qr_image_base64) setQrBase64(data.qr_image_base64);
        // Only update secondsLeft from server if it differs significantly (avoid flicker)
        setSecondsLeft(prev => {
          const serverVal = data.seconds_until_qr_expiry || 0;
          return Math.abs(prev - serverVal) > 5 ? serverVal : prev;
        });
      } catch (err) {
        // 404 means session ended externally (e.g., another tab). Stop polling silently.
        if (err?.message?.includes('No active session') || err?.message?.includes('404')) {
          stopPolling();
        }
      }
    }, 4000); // poll every 4 seconds
  }, [stopPolling]);

  // ── QR countdown tick ─────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'active') {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
      setDurationSecs(prev => prev + 1);
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [phase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!selectedCourseId) return addToast('Please select a course', 'error');
    setPhase('loading');
    try {
      const today = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
      const data = await activeSessionAPI.createSession({
        course_id: selectedCourseId,
        label: sessionLabel.trim() || undefined,
        qr_expiry_minutes: qrExpiry,
        session_date: today,
        session_time: nowTime,
      });
      setSessionId(String(data.id));
      setLiveData(data);
      setQrBase64(data.qr_image_base64);
      setSecondsLeft(data.seconds_until_qr_expiry || qrExpiry * 60);
      setSessionStartedAt(Date.now());
      setDurationSecs(0);
      setPhase('active');
      startPolling(String(data.id));
    } catch (err) {
      addToast(err.message || 'Failed to start session', 'error');
      setPhase('config');
    }
  };

  const handleRefreshQR = async () => {
    setConfirmRefresh(false);
    try {
      const data = await activeSessionAPI.refreshQR(sessionId);
      setQrBase64(data.qr_image_base64);
      setSecondsLeft(data.seconds_until_expiry || 0);
      addToast('QR code refreshed — students can use the new code', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to refresh QR', 'error');
    }
  };

  const handleEnd = async () => {
    setConfirmEnd(false);
    setPhase('ending');
    stopPolling();
    try {
      const data = await activeSessionAPI.endSession(sessionId);
      setEndedData(data);
      setPhase('ended');
    } catch (err) {
      addToast(err.message || 'Failed to end session', 'error');
      setPhase('active');
      startPolling(sessionId);
    }
  };

  const handleStartAnother = () => {
    setPhase('config');
    setLiveData(null);
    setQrBase64(null);
    setSessionId(null);
    setEndedData(null);
    setSessionLabel('');
    setDurationSecs(0);
    setSecondsLeft(0);
  };

  // ── Derived values ────────────────────────────────────────────────────────

  const isAdminDefault = prefs?.qr_expiry_mode === 'admin_default';
  const sessionCodeLength = liveData?.session_code?.length || prefs?.session_code_length || 6;
  const checkedIn = liveData?.checked_in_students || [];
  const totalEnrolled = liveData?.total_enrolled || 0;
  const qrExpired = secondsLeft <= 0;
  const timerIsLow = secondsLeft > 0 && secondsLeft < 120;

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  // ── CONFIG ─────────────────────────────────────────────────────────────────

  if (phase === 'config' || phase === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-[600px] rounded-xl border p-6 xl:p-8"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Start Attendance Session</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Configure and launch a live session</p>

          {prefsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[var(--accent-primary)]" /></div>
          ) : (
            <div className="space-y-5">
              {/* Course */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Course</label>
                {courses.length === 0 ? (
                  <p className="text-sm text-[var(--accent-red)]">No active courses found. Please contact admin.</p>
                ) : (
                  <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Session Label */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Session Label</label>
                <input
                  type="text"
                  value={sessionLabel}
                  onChange={e => setSessionLabel(e.target.value)}
                  placeholder="e.g. Week 5 Lecture — Introduction to SQL"
                  className="w-full h-11 px-3.5 rounded-lg text-sm border outline-none"
                  style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* QR Expiry */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>QR Code Expiry Duration</label>
                  {isAdminDefault && (
                    <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Lock className="w-3 h-3" /> Locked by admin
                    </span>
                  )}
                </div>
                {isAdminDefault ? (
                  <div className="h-11 px-3.5 rounded-lg border flex items-center text-sm"
                    style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-muted)' }}>
                    {prefs.admin_qr_default_mins} minutes (Admin default)
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {[5, 10, 15, 20, 30].map(min => (
                      <button key={min} onClick={() => setQrExpiry(min)}
                        className="flex-1 h-10 rounded-lg text-sm font-medium transition-all"
                        style={{
                          backgroundColor: qrExpiry === min ? 'var(--accent-primary)' : 'var(--bg-deep)',
                          color: qrExpiry === min ? 'var(--bg-deep)' : 'var(--text-secondary)',
                          border: qrExpiry === min ? 'none' : '1px solid var(--border-input)',
                        }}>
                        {min}m
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info Banner */}
              <div className="flex items-start gap-2.5 p-3 rounded-lg" style={{ backgroundColor: 'rgba(59,130,246,0.08)' }}>
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-blue)' }} />
                <p className="text-xs" style={{ color: 'var(--accent-blue)' }}>
                  A unique QR code and <strong>{sessionCodeLength}-character</strong> verification code will be generated.
                  Display the QR code on your projector and announce the verification code verbally to students.
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => navigate('/dashboard')}
                  className="flex-1 h-11 rounded-lg text-sm font-medium border hover:bg-[var(--bg-raised)]"
                  style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={phase === 'loading' || courses.length === 0}
                  className="flex-1 h-11 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                  {phase === 'loading' ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create Session & Go Live'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── ACTIVE ─────────────────────────────────────────────────────────────────

  if (phase === 'active' || phase === 'ending') {
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
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {liveData?.label || liveData?.session_code}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {liveData?.course_title} · {liveData?.course_code}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <span className={`text-sm font-mono font-medium ${timerIsLow ? 'animate-pulse-red' : ''}`}
              style={{ color: timerIsLow ? 'var(--accent-red)' : qrExpired ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
              {qrExpired ? 'QR Code Expired — Refresh Required' : `QR Expires in: ${formatTimer(secondsLeft)}`}
            </span>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* Left: QR + Verification */}
          <div className="xl:col-span-3 space-y-4">
            {/* QR Card */}
            <div className="rounded-[10px] border p-5"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
              <QRCodeDisplay qrImageBase64={qrBase64} expired={qrExpired} />
              <div className="text-center mt-4">
                <p className={`text-2xl font-mono font-bold ${timerIsLow || qrExpired ? 'animate-pulse-red' : ''}`}
                  style={{ color: timerIsLow || qrExpired ? 'var(--accent-red)' : 'var(--accent-primary)' }}>
                  {qrExpired ? 'EXPIRED' : formatTimer(secondsLeft)}
                </p>
                <button
                  onClick={() => setConfirmRefresh(true)}
                  disabled={phase === 'ending'}
                  className={`mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border transition-colors hover:bg-[var(--bg-raised)] ${qrExpired ? 'animate-pulse-live' : ''}`}
                  style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh QR Code
                </button>
              </div>
            </div>

            {/* Verification Code */}
            <VerificationCodeDisplay code={liveData?.session_code || '------'} />
          </div>

          {/* Right: Live Tracker */}
          <div className="xl:col-span-2">
            <LiveAttendanceTracker
              checkedIn={checkedIn.map(s => ({
                name: s.student_name,
                method: s.method,
                time: s.checked_in_at
                  ? new Date(s.checked_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
                  : '',
              }))}
              total={totalEnrolled}
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="fixed bottom-16 xl:bottom-0 left-0 xl:left-60 right-0 h-14 flex items-center justify-between px-4 xl:px-6 border-t z-30"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <Timer className="w-4 h-4" />
            <span>Session running: {formatDuration(durationSecs)}</span>
          </div>
          <button
            onClick={() => setConfirmEnd(true)}
            disabled={phase === 'ending'}
            className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: 'var(--accent-red)', color: '#fff' }}>
            {phase === 'ending' ? <><Loader2 className="w-4 h-4 animate-spin" /> Ending…</> : 'End Session'}
          </button>
        </div>

        <div className="h-14" />

        <ConfirmModal open={confirmEnd} onClose={() => setConfirmEnd(false)} onConfirm={handleEnd}
          title="End Session?" confirmLabel="End Session" confirmVariant="danger"
          message={`Are you sure? This will finalise attendance for all ${totalEnrolled} students. Students not checked in will be marked Absent.`}
        />
        <ConfirmModal open={confirmRefresh} onClose={() => setConfirmRefresh(false)} onConfirm={handleRefreshQR}
          title="Refresh QR Code?" confirmLabel="Refresh" confirmVariant="primary"
          message="Generate a new QR code for this session? Students who haven't scanned yet will use the new code — previously scanned students are unaffected."
        />
      </div>
    );
  }

  // ── ENDED ──────────────────────────────────────────────────────────────────

  if (phase === 'ended' && endedData) {
    const summary = endedData.summary;
    const presentStudents = endedData.present_students || [];
    const absentStudents = endedData.absent_students || [];
    const presentCount = summary.present_count;
    const absentCount = summary.absent_count;
    const rate = summary.attendance_pct?.toFixed(1) || '0.0';
    const faceCount = summary.face_scan_count || 0;
    const qrCount = summary.qr_scan_count || 0;
    const facePct = presentCount > 0 ? ((faceCount / presentCount) * 100).toFixed(1) : 0;
    const qrPct = presentCount > 0 ? ((qrCount / presentCount) * 100).toFixed(1) : 0;
    const dur = summary.duration_minutes || Math.floor(durationSecs / 60);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success header */}
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
            <CheckCircle className="w-8 h-8" style={{ color: 'var(--accent-green)' }} />
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Session Ended Successfully</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {summary.course_title} ({summary.course_code}) · {summary.label || summary.course_code}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { val: presentCount, label: '✓ Present', color: 'var(--accent-green)' },
            { val: absentCount, label: '✗ Absent', color: 'var(--accent-red)' },
            { val: `${rate}%`, label: '📊 Rate', color: 'var(--accent-primary)' },
            { val: `${dur}m`, label: '⏱ Duration', color: 'var(--accent-blue)' },
          ].map(({ val, label, color }) => (
            <div key={label} className="rounded-[10px] border p-4 text-center"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderTopWidth: '3px', borderTopColor: color }}>
              <p className="text-2xl font-bold" style={{ color }}>{val}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Method Breakdown */}
        <div className="rounded-[10px] border p-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Method Breakdown</p>
          <div className="flex h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-raised)' }}>
            <div className="h-full transition-all" style={{ width: `${facePct}%`, backgroundColor: 'var(--accent-blue)' }} />
            <div className="h-full transition-all" style={{ width: `${qrPct}%`, backgroundColor: 'var(--accent-primary)' }} />
          </div>
          <div className="flex justify-between text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
            <span className="flex items-center gap-1">
              <ScanFace className="w-3 h-3" style={{ color: 'var(--accent-blue)' }} />
              {faceCount} Face Scan ({facePct}%)
            </span>
            <span className="flex items-center gap-1">
              <QrCode className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} />
              {qrCount} QR Code ({qrPct}%)
            </span>
          </div>
        </div>

        {/* Student Tabs */}
        <div>
          <div className="flex gap-1 border-b mb-4" style={{ borderColor: 'var(--border-subtle)' }}>
            {[['present', `Present (${presentCount})`], ['absent', `Absent (${absentCount})`]].map(([key, lbl]) => (
              <button key={key} onClick={() => setShowTab(key)}
                className="px-4 py-2.5 text-sm font-medium border-b-2 transition-all"
                style={{
                  borderColor: showTab === key ? 'var(--accent-primary)' : 'transparent',
                  color: showTab === key ? 'var(--accent-primary)' : 'var(--text-muted)',
                }}>
                {lbl}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {showTab === 'present' ? (
              presentStudents.length > 0 ? presentStudents.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{ backgroundColor: 'var(--accent-blue)', color: '#fff' }}>
                    {(s.student_name || '?').split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.student_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.student_number}</p>
                  </div>
                  {s.method === 'face'
                    ? <ScanFace className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent-blue)' }} />
                    : <QrCode className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />}
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {s.checked_in_at
                      ? new Date(s.checked_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                      : ''}
                  </span>
                </div>
              )) : (
                <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No students were present.</p>
              )
            ) : (
              absentStudents.length > 0 ? absentStudents.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)' }}>
                    {(s.student_name || '?').split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.student_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.student_number}</p>
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--accent-red)' }}>Absent</span>
                </div>
              )) : (
                <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>All students were present!</p>
              )
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pb-8">
          <button
            onClick={() => reportsAPI.downloadCourseReport(endedData.session?.course_id, 'pdf').catch(() => addToast('Failed to download', 'error'))}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button
            onClick={() => navigate(`/courses/${endedData.session?.course_id}`)}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold border hover:bg-[var(--bg-raised)]"
            style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
            Back to Course
          </button>
          <button
            onClick={handleStartAnother}
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