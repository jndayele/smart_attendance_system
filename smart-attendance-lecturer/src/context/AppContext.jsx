import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext(null);

const DEFAULT_STATE = {
  institutionName: '',
  shortCode: '',
  tagline: '',
  country: '',
  timezone: '',
  logoUrl: '',
  accentColor: '#F59E0B',
  adminName: '',
  adminEmail: '',
  academicYear: '',
  currentSemester: '',
  isSetupComplete: false,
  isLoggedIn: false,
};

export function AppProvider({ children }) {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('sas_config');
      if (saved) return { ...DEFAULT_STATE, ...JSON.parse(saved) };
    } catch (e) { /* ignore */ }
    return DEFAULT_STATE;
  });

  useEffect(() => {
    localStorage.setItem('sas_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-primary', config.accentColor);
  }, [config.accentColor]);

  useEffect(() => {
    const link = document.querySelector("link[rel='icon']") || (() => {
      const l = document.createElement('link');
      l.rel = 'icon';
      document.head.appendChild(l);
      return l;
    })();

    if (config.logoUrl) {
      link.type = 'image/png';
      link.href = config.logoUrl;
    } else {
      const color = encodeURIComponent(config.accentColor);
      link.type = 'image/svg+xml';
      link.href = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 15 L15 40 L50 30 L85 40 Z' fill='${color}'/%3E%3Cpath d='M25 45 L25 65 Q50 80 75 65 L75 45 L50 35 Z' fill='${color}' opacity='0.7'/%3E%3Cline x1='50' y1='30' x2='50' y2='90' stroke='${color}' stroke-width='3'/%3E%3Ccircle cx='50' cy='90' r='4' fill='${color}'/%3E%3C/svg%3E`;
    }
  }, [config.logoUrl, config.accentColor]);

  const updateConfig = useCallback((updates) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <AppContext.Provider value={{ config, updateConfig }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppConfig() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppConfig must be used within AppProvider');
  return ctx;
}

export default AppContext;