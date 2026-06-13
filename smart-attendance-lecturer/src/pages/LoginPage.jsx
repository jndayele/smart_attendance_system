import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppConfig } from '../context/AppContext';
import { useLecturerAuth } from '../context/LecturerAuthContext';
import { GraduationCap, Eye, EyeOff, AlertCircle, Lock } from 'lucide-react';

export default function LoginPage() {
  const { config } = useAppConfig();
  const { lecturer, login, loginAsDemo } = useLecturerAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  useEffect(() => {
    if (lecturer.isLoggedIn) navigate('/dashboard');
  }, [lecturer.isLoggedIn, navigate]);

  useEffect(() => {
    if (lockTimer <= 0) return;
    const t = setInterval(() => setLockTimer(prev => {
      if (prev <= 1) { setLocked(false); setAttempts(0); return 0; }
      return prev - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [lockTimer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (locked) return;
    if (email === 'a.owusu@umat.edu.gh' && password === 'password123') {
      login({
        lecturerName: "Dr. Ama Owusu", firstName: "Ama", lastName: "Owusu",
        title: "Dr.", email: "a.owusu@umat.edu.gh", staffId: "EMP-001",
        department: "Computer Science",
      });
      navigate('/dashboard');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setLocked(true);
        setLockTimer(900);
        setError('Account locked for 15 minutes due to too many failed attempts.');
      } else {
        setError(`Invalid email or password. ${3 - newAttempts} attempts remaining.`);
      }
    }
  };

  const handleDemo = () => {
    loginAsDemo();
    navigate('/dashboard');
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ backgroundColor: 'var(--bg-deep)' }}>

      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        {config.logoUrl ? (
          <img src={config.logoUrl} alt="" className="w-14 h-14 rounded-xl mb-3" />
        ) : (
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3"
            style={{ backgroundColor: 'var(--accent-primary)' }}>
            <GraduationCap className="w-7 h-7" style={{ color: 'var(--bg-deep)' }} />
          </div>
        )}
        <h1 className="text-[28px] xl:text-[32px] font-bold" style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-primary)' }}>
          {config.shortCode}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Smart Attendance System — Lecturer Portal
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-[440px] rounded-xl border p-6 xl:p-8"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Welcome back</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Sign in to your lecturer account</p>

        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg mb-4" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
            {locked ? <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-red)' }} /> :
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-red)' }} />}
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--accent-red)' }}>{error}</p>
              {locked && lockTimer > 0 && (
                <p className="text-xs mt-1 font-mono" style={{ color: 'var(--accent-red)' }}>
                  Try again in {formatTime(lockTimer)}
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="staff@university.edu"
              className="w-full h-11 px-3.5 rounded-lg text-sm border outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-input)'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                className="w-full h-11 px-3.5 pr-10 rounded-lg text-sm border outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)',
                  color: 'var(--text-primary)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-input)'}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>
              Forgot Password?
            </Link>
          </div>

          <button type="submit" disabled={locked || !email || !password}
            className="w-full h-11 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            Sign In
          </button>
        </form>
      </div>

      <p className="text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
        Don't have an account?{' '}
        <span style={{ color: 'var(--text-secondary)' }}>Contact your institution admin.</span>
      </p>

      <div className="flex gap-3 mt-4">
        <button onClick={handleDemo}
          className="text-sm px-4 py-2 rounded-lg border transition-colors hover:bg-[var(--bg-raised)]"
          style={{ borderColor: 'transparent', color: 'var(--text-secondary)' }}>
          Enter as Dr. Ama Owusu (Demo)
        </button>
        <Link to="/activate"
          className="text-sm px-4 py-2 rounded-lg transition-colors hover:bg-[var(--bg-raised)]"
          style={{ color: 'var(--text-muted)' }}>
          View Activation Screen
        </Link>
      </div>
    </div>
  );
}