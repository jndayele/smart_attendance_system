import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, institutionAPI, getToken, setToken, clearToken } from '@/api/api';

const AppContext = createContext(null);

const DEFAULT_STATE = {
  // Institution info (populated from backend after login or setup)
  institutionName: '',
  shortCode: '',
  tagline: '',
  country: '',
  timezone: '',
  logoUrl: '',
  accentColor: '#F59E0B',
  academicYear: '',
  currentSemester: '',

  // Auth state
  isSetupComplete: false,    // Driven by GET /auth/setup-status
  isLoggedIn: false,         // Driven by presence of valid token
  userName: '',              // From GET /auth/me — display_name / name
  userEmail: '',             // From GET /auth/me
  userRole: '',              // From GET /auth/me

  // Loading flag for initial bootstrap
  isBootstrapping: true,
};

export function AppProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_STATE);

  // ── Bootstrap on mount ────────────────────────────────────────────────────
  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bootstrap = async () => {
    try {
      // 1. Always check if the institution is set up
      const statusData = await authAPI.checkSetupStatus();
      const isSetupComplete = Boolean(statusData?.is_setup);

      if (!isSetupComplete) {
        // Not set up at all — show setup wizard
        setConfig(prev => ({
          ...prev,
          isSetupComplete: false,
          isLoggedIn: false,
          isBootstrapping: false,
        }));
        return;
      }

      // 2. Check for a stored JWT. If no token, and setup is complete, show login.
      const token = getToken();
      if (!token) {
        setConfig(prev => ({
          ...prev,
          isSetupComplete: isSetupComplete,
          institutionName: statusData?.institution_name || '',
          shortCode: statusData?.shortcode || '',
          logoUrl: statusData?.logo_url || '',
          isLoggedIn: false,
          isBootstrapping: false,
        }));
        return;
      }

      // 3. Token exists — validate it and populate user + institution data
      try {
        const [meData, instData] = await Promise.all([
          authAPI.me(),
          institutionAPI.get(),
        ]);

        setConfig(prev => ({
          ...prev,
          isSetupComplete: true,
          isLoggedIn: true,
          isBootstrapping: false,
          userName: meData.name || 'Administrator',
          userEmail: meData.email,
          userRole: meData.role,
          ...mapInstitution(instData),
        }));
      } catch {
        // Token invalid/expired — force re-login
        clearToken();
        setConfig(prev => ({
          ...prev,
          isSetupComplete: isSetupComplete,
          isLoggedIn: false,
          isBootstrapping: false,
        }));
      }
    } catch (err) {
      console.error('Bootstrap failed:', err);
      // If backend is unreachable, fall back to last known state from localStorage
      const saved = getSaved();
      setConfig(prev => ({
        ...prev,
        ...saved,
        isBootstrapping: false,
      }));
    }
  };

  // ── Persist minimal config to localStorage for offline resilience ──────────
  useEffect(() => {
    if (!config.isBootstrapping) {
      const toSave = {
        accentColor: config.accentColor,
        logoUrl: config.logoUrl,
        shortCode: config.shortCode,
        institutionName: config.institutionName,
        tagline: config.tagline,
        academicYear: config.academicYear,
        currentSemester: config.currentSemester,
        isSetupComplete: config.isSetupComplete,
      };
      localStorage.setItem('sas_config', JSON.stringify(toSave));
    }
  }, [config]);

  // ── Apply accent color to CSS variable ───────────────────────────────────
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-primary', config.accentColor);
  }, [config.accentColor]);

  // ── Apply institution logo as favicon ─────────────────────────────────────
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

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Called after successful login: stores token, populates user + institution data */
  const loginSuccess = useCallback((token, meData, instData) => {
    setToken(token);
    setConfig(prev => ({
      ...prev,
      isLoggedIn: true,
      isSetupComplete: true,
      userName: meData.name || 'Administrator',
      userEmail: meData.email,
      userRole: meData.role,
      ...mapInstitution(instData),
    }));
  }, []);

  /** Called after successful setup: marks setup complete */
  const setupComplete = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      isSetupComplete: true,
      isLoggedIn: false,
    }));
  }, []);

  /** Logout: clear token and reset auth state */
  const logout = useCallback(() => {
    clearToken();
    setConfig(prev => ({
      ...prev,
      isLoggedIn: false,
      userName: '',
      userEmail: '',
      userRole: '',
    }));
  }, []);

  /** Generic config updater (for legacy use in SetupPage preview) */
  const updateConfig = useCallback((updates) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <AppContext.Provider value={{ config, updateConfig, loginSuccess, setupComplete, logout }}>
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapInstitution(inst) {
  if (!inst) return {};
  return {
    institutionName: inst.name || '',
    shortCode: inst.shortcode || '',
    tagline: inst.tagline || '',
    country: inst.country || '',
    timezone: inst.timezone || '',
    logoUrl: inst.logo_url || '',
    accentColor: inst.accent_color || '#F59E0B',
    academicYear: inst.admin_email ? '' : '', // comes from academic_year model separately
  };
}

function getSaved() {
  try {
    const saved = localStorage.getItem('sas_config');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return {};
}