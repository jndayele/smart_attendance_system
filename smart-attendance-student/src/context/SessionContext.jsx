import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
        // If already marked, skip straight to already_marked screen
        if (data.live_session.already_marked) {
          setAttendanceStep('already_marked');
        } else if (attendanceStep === 'notify' || attendanceStep === 'success' || attendanceStep === 'already_marked') {
          // Reset to notify only if the student isn't mid-flow
          setAttendanceStep('notify');
        }
      } else {
        setSession(null);
        setRemainingSeconds(0);
        setAttendanceStep('notify');
      }
    } catch (err) {
      console.error("Failed to fetch live session", err);
    } finally {
      setLoading(false);
    }
  }, [attendanceStep]);

  useEffect(() => {
    fetchLiveSession();
    
    if (!socket) return;
    
    const handleGlobalUpdate = (data) => {
      if (data?.type === 'session_started') {
        fetchLiveSession();
      }
    };
    
    socket.on('global_update', handleGlobalUpdate);
    
    return () => {
      socket.off('global_update', handleGlobalUpdate);
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
  }, [session]); // Reset timer when session changes

  const clearSession = useCallback(() => {
    setSession(null);
    setAttendanceStep('notify');
    setSelectedMethod(null);
    setRemainingSeconds(0);
    setAttendancePct(null);
  }, []);

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
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);