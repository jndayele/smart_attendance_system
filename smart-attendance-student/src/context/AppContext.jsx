import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

const DEFAULT_CONFIG = {
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
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-primary', config.accentColor);
  }, [config.accentColor]);

  const updateConfig = (updates) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    localStorage.setItem('institutionConfig', JSON.stringify(newConfig));
  };

  return (
    <AppContext.Provider value={{ ...config, updateConfig }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppConfig = () => useContext(AppContext);