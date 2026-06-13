import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SessionContext = createContext(null);

const DEMO_SESSION = {
  isActive: true,
  courseCode: "CS301",
  courseName: "Database Systems",
  sessionLabel: "Week 9 Lecture",
  lecturerName: "Dr. Ama Owusu",
  verificationCode: "AX72KC",
  startedMinutesAgo: 10,
  totalMinutes: 25,
  room: "Room LT4",
};

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [attendanceStep, setAttendanceStep] = useState('notify');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const startDemoSession = useCallback(() => {
    const remaining = (DEMO_SESSION.totalMinutes - DEMO_SESSION.startedMinutesAgo) * 60 + 23;
    setRemainingSeconds(remaining);
    setSession(DEMO_SESSION);
    setAttendanceStep('notify');
    setSelectedMethod(null);
  }, []);

  const clearSession = useCallback(() => {
    setSession(null);
    setAttendanceStep('notify');
    setSelectedMethod(null);
    setRemainingSeconds(0);
  }, []);

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
  }, [session, remainingSeconds]);

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
      startDemoSession,
      clearSession,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);