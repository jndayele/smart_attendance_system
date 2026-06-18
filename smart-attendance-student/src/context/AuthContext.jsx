import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, getToken, clearToken, setToken } from '../api/api';

const AuthContext = createContext(null);

const EMPTY_AUTH = {
  isLoggedIn: false,
  isBootstrapping: true,
  name: "",
  firstName: "",
  studentId: "",
  email: "",
  programme: "",
  level: "",
  profileUrl: "",
};

export function StudentAuthProvider({ children }) {
  const [auth, setAuth] = useState(EMPTY_AUTH);

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    const token = getToken();
    if (!token) {
      setAuth(prev => ({ ...prev, isBootstrapping: false, isLoggedIn: false }));
      return;
    }

    try {
      // Assuming getMe returns { name, email, role, etc... }
      // We might need an extended getMe or just rely on getMe + local logic
      const meData = await authAPI.getMe();
      if (meData.role !== 'student') throw new Error("Not a student account");
      
      setAuth({
        isLoggedIn: true,
        isBootstrapping: false,
        name: meData.name || "",
        firstName: (meData.name || "").split(' ')[0],
        email: meData.email,
        studentId: meData.student_id || "", // ensure backend returns this if possible, or fetch via another endpoint
        programme: meData.programme || "",
        level: meData.level ? `Level ${meData.level}` : "",
        profileUrl: meData.profile_picture_url || "",
      });
    } catch (e) {
      clearToken();
      setAuth(prev => ({ ...prev, isBootstrapping: false, isLoggedIn: false }));
    }
  };

  const logout = () => {
    clearToken();
    setAuth({ ...EMPTY_AUTH, isBootstrapping: false });
  };

  const loginSuccess = async (tokenData) => {
    setToken(tokenData.access_token);
    await bootstrap();
  };

  return (
    <AuthContext.Provider value={{ ...auth, logout, loginSuccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useStudentAuth = () => useContext(AuthContext);