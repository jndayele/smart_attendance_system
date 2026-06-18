import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

import { authAPI } from '@/api/api';

const DEFAULT_CONFIG = {
  institutionName: "University Portal",
  shortCode: "UNI",
  logoUrl: "",
  accentColor: "#F59E0B",
  academicYear: "",
  currentSemester: "",
};

export function AppProvider({ children }) {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('institutionConfig');
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
  });

  useEffect(() => {
    // Fetch public settings from backend
    const loadSettings = async () => {
      try {
        const data = await authAPI.getPublicSettings();
        if (data) {
          updateConfig({
            institutionName: data.institutionName || config.institutionName,
            shortCode: data.shortCode || config.shortCode,
            tagline: data.tagline || config.tagline,
            logoUrl: data.logoUrl || config.logoUrl,
            accentColor: data.accentColor || config.accentColor
          });
        }
      } catch (err) {
        console.error("Failed to load public settings:", err);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-primary', config.accentColor);
  }, [config.accentColor]);

  const updateConfig = (updates) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      localStorage.setItem('institutionConfig', JSON.stringify(newConfig));
      return newConfig;
    });
  };

  return (
    <AppContext.Provider value={{ ...config, updateConfig }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppConfig = () => useContext(AppContext);