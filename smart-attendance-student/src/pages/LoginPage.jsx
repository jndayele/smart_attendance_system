import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAppConfig } from '../context/AppContext';
import { useStudentAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { authAPI } from '../api/api';

export default function LoginPage() {
  const { shortCode, logoUrl } = useAppConfig();
  const { isLoggedIn, loginSuccess } = useStudentAuth();
  const { startDemoSession } = useSession();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isLoggedIn) navigate('/dashboard', { replace: true });
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (!locked || lockTimer <= 0) return;
    const timer = setInterval(() => {
      setLockTimer(prev => {
        if (prev <= 1) { setLocked(false); setAttempts(0); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [locked, lockTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked) return;
    
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await authAPI.login(email, password);
      if (data.role !== 'student') {
        throw new Error('Please use the admin/lecturer portal to log in.');
      }
      await loginSuccess(data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.message || 'Login failed';
      setErrorMsg(msg);
      const newAttempts = attempts + 1;
      if (newAttempts >= 5) {
        setLocked(true);
        setLockTimer(900);
      }
      setAttempts(newAttempts);
    } finally {
      setIsLoading(false);
    }
  };

  const lockMinutes = Math.floor(lockTimer / 60);
  const lockSeconds = lockTimer % 60;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-deep)' }}>
      <div className="w-full max-w-[420px] animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="w-14 h-14 mx-auto mb-3 rounded-xl" />
          ) : (
            <div className="w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-primary)' }}>
              <GraduationCap size={28} style={{ color: 'var(--bg-deep)' }} />
            </div>
          )}
          <h1 className="font-playfair text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>{shortCode}</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Smart Attendance System — Student Portal</p>
        </div>

        {/* Card */}
        <div className="rounded-xl p-6 sm:p-8"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Welcome back</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Sign in to your student account</p>

          {/* Error banners */}
          {errorMsg && !locked && (
            <div className="flex items-start gap-2 p-3 rounded-lg mb-4"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-red)' }} />
              <p className="text-sm" style={{ color: 'var(--accent-red)' }}>
                {errorMsg}. {5 - attempts} attempts remaining before lockout.
              </p>
            </div>
          )}
          {locked && (
            <div className="flex items-start gap-2 p-3 rounded-lg mb-4"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-red)' }} />
              <p className="text-sm" style={{ color: 'var(--accent-red)' }}>
                Account locked for 15 minutes. Too many failed attempts.
                <span className="block font-mono font-semibold mt-1">
                  {lockMinutes}:{lockSeconds.toString().padStart(2, '0')}
                </span>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="student@university.edu"
                className="w-full h-12 px-4 rounded-lg text-sm outline-none transition-all duration-150"
                style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-input)'} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Password</label>
                <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs font-medium hover:underline" style={{ color: 'var(--accent-primary)' }}>
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full h-12 pl-4 pr-11 rounded-lg text-sm outline-none transition-all duration-150"
                  style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-input)'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-black/5"
                  style={{ color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={locked || isLoading}
              className="w-full h-12 mt-2 rounded-lg font-semibold text-sm transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          New student? Check your email for your registration link.
        </p>
      </div>
    </div>
  );
}