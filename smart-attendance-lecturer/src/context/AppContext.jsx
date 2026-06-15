import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/api';

const AppContext = createContext(null);

const defaultConfig = {
  institutionName: "Smart Attendance",
  shortCode: "SA",
  tagline: "Modern Attendance Management",
  logoUrl: "",
  accentColor: "#F59E0B",
  academicYear: "",
  currentSemester: "",
};

export function AppProvider({ children }) {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('institutionConfig');
    return saved ? JSON.parse(saved) : defaultConfig;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await authAPI.getPublicSettings();
        if (data.is_setup) {
          setConfig(prev => ({
            ...prev,
            institutionName: data.institution_name || prev.institutionName,
            shortCode: data.shortcode || prev.shortCode,
            tagline: data.tagline || prev.tagline,
            logoUrl: data.logo_url || prev.logoUrl,
            accentColor: data.accent_color || prev.accentColor,
            academicYear: data.academic_year || prev.academicYear,
            currentSemester: data.current_semester || prev.currentSemester,
          }));
        }
      } catch (error) {
        console.error("Failed to load public settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-primary', config.accentColor);
  }, [config.accentColor]);

  useEffect(() => {
    localStorage.setItem('institutionConfig', JSON.stringify(config));
  }, [config]);

  return (
    <AppContext.Provider value={{ config, setConfig, isLoading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppConfig() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppConfig must be used within AppProvider');
  return ctx;
}