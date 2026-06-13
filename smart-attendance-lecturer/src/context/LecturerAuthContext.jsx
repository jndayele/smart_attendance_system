import React, { createContext, useContext, useState } from 'react';

const LecturerAuthContext = createContext(null);

const demoLecturer = {
  isLoggedIn: true,
  lecturerName: "Dr. Ama Owusu",
  firstName: "Ama",
  lastName: "Owusu",
  title: "Dr.",
  email: "a.owusu@umat.edu.gh",
  staffId: "EMP-001",
  department: "Computer Science",
};

export function LecturerAuthProvider({ children }) {
  const [lecturer, setLecturer] = useState({
    isLoggedIn: false,
    lecturerName: "",
    firstName: "",
    lastName: "",
    title: "",
    email: "",
    staffId: "",
    department: "",
  });

  const login = (data) => setLecturer({ ...data, isLoggedIn: true });
  const loginAsDemo = () => setLecturer(demoLecturer);
  const logout = () => setLecturer({ isLoggedIn: false, lecturerName: "", firstName: "", lastName: "", title: "", email: "", staffId: "", department: "" });
  const updateProfile = (data) => setLecturer(prev => ({ ...prev, ...data }));

  return (
    <LecturerAuthContext.Provider value={{ lecturer, login, loginAsDemo, logout, updateProfile }}>
      {children}
    </LecturerAuthContext.Provider>
  );
}

export function useLecturerAuth() {
  const ctx = useContext(LecturerAuthContext);
  if (!ctx) throw new Error('useLecturerAuth must be used within LecturerAuthProvider');
  return ctx;
}