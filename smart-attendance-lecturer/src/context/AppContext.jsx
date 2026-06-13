import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

const defaultConfig = {
  institutionName: "University of Mines and Technology",
  shortCode: "UMAT",
  logoUrl: "",
  accentColor: "#F59E0B",
  academicYear: "2024/2025",
  currentSemester: "Semester 1",
};

export function AppProvider({ children }) {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('institutionConfig');
    return saved ? JSON.parse(saved) : defaultConfig;
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-primary', config.accentColor);
  }, [config.accentColor]);

  useEffect(() => {
    localStorage.setItem('institutionConfig', JSON.stringify(config));
  }, [config]);

  return (
    <AppContext.Provider value={{ config, setConfig }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppConfig() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppConfig must be used within AppProvider');
  return ctx;
}