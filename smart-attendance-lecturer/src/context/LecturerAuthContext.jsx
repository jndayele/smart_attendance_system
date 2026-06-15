import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/api';

const LecturerAuthContext = createContext(null);

export function LecturerAuthProvider({ children }) {
  const [lecturer, setLecturer] = useState({
    isLoggedIn: false,
    lecturerName: "",
    email: "",
    role: "",
    userId: "",
  });
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('lecturer_token');
      if (token) {
        try {
          const profile = await authAPI.getMe();
          setLecturer({
            isLoggedIn: true,
            lecturerName: profile.name,
            email: profile.email,
            role: profile.role,
            userId: profile.user_id,
          });
        } catch (err) {
          localStorage.removeItem('lecturer_token');
        }
      }
      setIsInitializing(false);
    };
    initAuth();
  }, []);

  const login = (token, profile) => {
    localStorage.setItem('lecturer_token', token);
    setLecturer({
      isLoggedIn: true,
      lecturerName: profile.name,
      email: profile.email,
      role: profile.role,
      userId: profile.user_id,
    });
  };

  const logout = () => {
    localStorage.removeItem('lecturer_token');
    setLecturer({
      isLoggedIn: false,
      lecturerName: "",
      email: "",
      role: "",
      userId: "",
    });
  };

  const updateProfile = (data) => setLecturer(prev => ({ ...prev, ...data }));

  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <LecturerAuthContext.Provider value={{ lecturer, login, logout, updateProfile }}>
      {children}
    </LecturerAuthContext.Provider>
  );
}

export function useLecturerAuth() {
  const ctx = useContext(LecturerAuthContext);
  if (!ctx) throw new Error('useLecturerAuth must be used within LecturerAuthProvider');
  return ctx;
}