import React, { createContext, useContext, useState } from 'react';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [sessionState, setSessionState] = useState('config'); // 'config' | 'active' | 'ended'
  const [sessionData, setSessionData] = useState({
    courseId: 'CS301',
    courseName: 'Database Systems',
    courseCode: 'CS301',
    label: 'Week 9 Lecture',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    qrExpiry: 15,
    verificationCode: 'AX72KC',
    totalStudents: 94,
    checkedIn: [],
    startTime: null,
    duration: 0,
  });

  const startSession = (data) => {
    const codes = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += codes[Math.floor(Math.random() * codes.length)];
    setSessionData(prev => ({
      ...prev,
      ...data,
      verificationCode: code,
      checkedIn: [],
      startTime: Date.now(),
    }));
    setSessionState('active');
  };

  const endSession = () => setSessionState('ended');
  const resetSession = () => {
    setSessionState('config');
    setSessionData(prev => ({ ...prev, checkedIn: [], startTime: null }));
  };

  const addCheckIn = (student) => {
    setSessionData(prev => ({
      ...prev,
      checkedIn: [student, ...prev.checkedIn],
    }));
  };

  const refreshQR = () => {
    const codes = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += codes[Math.floor(Math.random() * codes.length)];
    setSessionData(prev => ({ ...prev, verificationCode: code }));
  };

  return (
    <SessionContext.Provider value={{
      sessionState, sessionData,
      startSession, endSession, resetSession,
      addCheckIn, refreshQR, setSessionData,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}