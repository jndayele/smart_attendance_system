import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { studentAPI } from '../api/studentAPI';
import { useSocket } from './SocketContext';
import { getToken } from '../api/api';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const { socket } = useSocket();
  const [session, setSession] = useState(null);
  const [attendanceStep, setAttendanceStep] = useState('notify');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [attendancePct, setAttendancePct] = useState(null);
  const [loading, setLoading] = useState(true);
  // Tracks whether the session ended while the student was actively mid-scan
  const [sessionEndedWhileActive, setSessionEndedWhileActive] = useState(false);
  // Ref so socket handler always reads the latest step without stale closure
  const attendanceStepRef = useRef(attendanceStep);

  useEffect(() => {
    attendanceStepRef.current = attendanceStep;
  }, [attendanceStep]);

  const fetchLiveSession = useCallback(async () => {
    // Don't attempt if no token is stored — user is not logged in yet
    if (!getToken()) {
      setLoading(false);
      return;
    }
    try {
      const data = await studentAPI.getLiveSession();
      if (data.live_session) {
        setSession(data.live_session);
        setRemainingSeconds(data.live_session.seconds_remaining || 0);

        // Join the socket room for this specific session to receive targeted events
        if (socket) {
          socket.emit('join_session', { session_id: data.live_session.session_id });
        }

        // If already marked, skip straight to already_marked screen
        if (data.live_session.already_marked) {
          setAttendanceStep('already_marked');
        } else if (
          attendanceStepRef.current === 'notify' ||
          attendanceStepRef.current === 'success' ||
          attendanceStepRef.current === 'already_marked'
        ) {
          // Reset to notify only if the student isn't mid-flow
          setAttendanceStep('notify');
        }
      } else {
        if (socket && session) {
          socket.emit('leave_session', { session_id: session.session_id });
        }
        setSession(null);
        setRemainingSeconds(0);
        setAttendanceStep('notify');
      }
    } catch (err) {
      console.error("Failed to fetch live session", err);
    } finally {
      setLoading(false);
    }
  }, [socket, session]);

  useEffect(() => {
    fetchLiveSession();

    if (!socket) return;

    const handleGlobalUpdate = (data) => {
      if (data?.type === 'session_started') {
        fetchLiveSession();
      }
    };

    // Fired when lecturer ends or locks a session
    const handleSessionEnded = () => {
      const activeSteps = ['code', 'method', 'face', 'qr'];
      const currentStep = attendanceStepRef.current;

      if (activeSteps.includes(currentStep)) {
        // Student is mid-scan — interrupt immediately and show ended screen
        setSessionEndedWhileActive(true);
        setAttendanceStep('session_ended');
      } else {
        // Student hasn't started yet — silently clear the session
        setSession(null);
        setRemainingSeconds(0);
        setAttendanceStep('notify');
      }
    };

    socket.on('global_update', handleGlobalUpdate);
    // Backend emits these events when a session is locked/ended
    socket.on('session_ended', handleSessionEnded);
    socket.on('session_locked', handleSessionEnded);

    return () => {
      socket.off('global_update', handleGlobalUpdate);
      socket.off('session_ended', handleSessionEnded);
      socket.off('session_locked', handleSessionEnded);
    };
  }, [fetchLiveSession, socket]);

  useEffect(() => {
    if (!session || remainingSeconds <= 0) return;
    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [session]);

  const clearSession = useCallback(() => {
    if (socket && session) {
      socket.emit('leave_session', { session_id: session.session_id });
    }
    setSession(null);
    setAttendanceStep('notify');
    setSelectedMethod(null);
    setRemainingSeconds(0);
    setAttendancePct(null);
    setSessionEndedWhileActive(false);
  }, [socket, session]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SessionContext.Provider value={{
      session,
      isSessionActive: !!session && remainingSeconds > 0,
      attendanceStep,
      setAttendanceStep,
      selectedMethod,
      setSelectedMethod,
      remainingSeconds,
      formattedTime: formatTime(remainingSeconds),
      isUrgent: remainingSeconds > 0 && remainingSeconds < 120,
      refreshSession: fetchLiveSession,
      clearSession,
      loading,
      attendancePct,
      setAttendancePct,
      sessionEndedWhileActive,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);