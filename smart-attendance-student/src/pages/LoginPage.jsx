import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAppConfig } from '../context/AppContext';
import { useStudentAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';

export default function LoginPage() {
  const { shortCode, logoUrl } = useAppConfig();
  const { isLoggedIn, loginAsDemo } = useStudentAuth();
  const { startDemoSession } = useSession();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (locked) return;
    const newAttempts = attempts + 1;
    if (newAttempts >= 5) {
      setLocked(true);
      setLockTimer(900);
    }
    setAttempts(newAttempts);
  };

  const handleDemoLogin = () => {
    loginAsDemo();
    startDemoSession();
    navigate('/dashboard');
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
          {attempts > 0 && !locked && (
            <div className="flex items-start gap-2 p-3 rounded-lg mb-4"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-red)' }} />
              <p className="text-sm" style={{ color: 'var(--accent-red)' }}>
                Incorrect email or password. {5 - attempts} attempts remaining before lockout.
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
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Student Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="student@university.edu"
                disabled={locked}
                className="w-full h-12 px-4 rounded-lg text-sm outline-none transition-all duration-150"
                style={{
                  backgroundColor: 'var(--bg-deep)',
                  border: '1px solid var(--border-input)',
                  color: 'var(--text-primary)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-input)'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={locked}
                  className="w-full h-12 px-4 pr-12 rounded-lg text-sm outline-none transition-all duration-150"
                  style={{
                    backgroundColor: 'var(--bg-deep)',
                    border: '1px solid var(--border-input)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-input)'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button type="button" onClick={() => navigate('/forgot-password')}
                className="text-sm font-medium hover:underline" style={{ color: 'var(--accent-primary)' }}>
                Forgot Password?
              </button>
            </div>

            <button type="submit" disabled={locked}
              className="w-full h-12 rounded-lg font-semibold text-sm transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
              Sign In
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          New student? Check your email for your registration link.
        </p>

        {/* Demo shortcuts */}
        <div className="flex flex-col items-center gap-2 mt-4">
          <button onClick={handleDemoLogin}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors hover:opacity-80"
            style={{ color: 'var(--text-secondary)', backgroundColor: 'transparent' }}>
            → Enter as Kwame Asante (Demo)
          </button>
          <button onClick={() => navigate('/register')}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors hover:opacity-80"
            style={{ color: 'var(--text-secondary)', backgroundColor: 'transparent' }}>
            → View Registration Screen
          </button>
        </div>
      </div>
    </div>
  );
}