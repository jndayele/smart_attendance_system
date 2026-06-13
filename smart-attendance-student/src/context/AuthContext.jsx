import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const DEMO_STUDENT = {
  isLoggedIn: true,
  name: "Kwame Asante",
  firstName: "Kwame",
  studentId: "STU-0001",
  email: "kwame.asante@student.university.edu",
  programme: "BSc Computer Science",
  level: "Level 300",
  department: "Computer Science",
  semester: "Semester 1",
};

const EMPTY_AUTH = {
  isLoggedIn: false,
  name: "",
  firstName: "",
  studentId: "",
  email: "",
  programme: "",
  level: "",
  department: "",
  semester: "",
};

export function StudentAuthProvider({ children }) {
  const [auth, setAuth] = useState(EMPTY_AUTH);

  const loginAsDemo = () => setAuth(DEMO_STUDENT);

  const logout = () => setAuth(EMPTY_AUTH);

  const login = (data) => setAuth({ ...data, isLoggedIn: true });

  return (
    <AuthContext.Provider value={{ ...auth, loginAsDemo, logout, login }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useStudentAuth = () => useContext(AuthContext);
export { DEMO_STUDENT };