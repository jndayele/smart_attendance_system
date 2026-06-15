import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAppConfig } from '../context/AppContext';
import { GraduationCap, Lock, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';
import { authAPI } from '../api/api';

export default function AccountActivationPage() {
  const { config } = useAppConfig();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [expired, setExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setExpired(true);
      return;
    }
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);
      
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        setExpired(true);
      } else {
        setEmail(payload.sub || '');
        setName(payload.name || '');
      }
    } catch (e) {
      setExpired(true);
    }
  }, [token]);


  const checks = {
    length: password.length >= 8,
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const allValid = checks.length && checks.number && checks.special;
  const passwordsMatch = password === confirm && confirm.length > 0;

  const strength = [checks.length, checks.number, checks.special].filter(Boolean).length;
  const strengthLabels = ['', 'Weak', 'Fair', 'Strong'];
  const strengthColors = ['', 'var(--accent-red)', 'var(--accent-amber)', 'var(--accent-green)'];

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!allValid || !passwordsMatch || isLoading) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      await authAPI.activateLecturer(token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to activate account.');
    } finally {
      setIsLoading(false);
    }
  };

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-deep)' }}>
        <div className="w-full max-w-[440px] rounded-xl border p-6 xl:p-8 text-center"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
          <p className="text-lg font-semibold mb-2" style={{ color: 'var(--accent-red)' }}>Activation link expired</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Contact your admin for a new link.</p>
          <Link to="/login" className="inline-block mt-4 text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ backgroundColor: 'var(--bg-deep)' }}>

      <div className="flex flex-col items-center mb-8">
        {config.logoUrl ? (
          <img src={config.logoUrl} alt="" className="w-14 h-14 rounded-xl mb-3" />
        ) : (
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3"
            style={{ backgroundColor: 'var(--accent-primary)' }}>
            <GraduationCap className="w-7 h-7" style={{ color: 'var(--bg-deep)' }} />
          </div>
        )}
        <h1 className="text-[28px] font-bold" style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-primary)' }}>
          {config.shortCode}
        </h1>
      </div>

      <div className="w-full max-w-[440px] rounded-xl border p-6 xl:p-8"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>

        {success ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
              <CheckCircle className="w-7 h-7" style={{ color: 'var(--accent-green)' }} />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Account Activated!</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Redirecting to dashboard...</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Activate Your Account</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              You've been added as a lecturer. Set your password to get started.
            </p>

            <form onSubmit={handleActivate} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 text-red-500 text-sm mb-4">
                  {errorMsg}
                </div>
              )}
              {/* Pre-filled fields */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Name</label>
                <div className="relative">
                  <input type="text" value={name} readOnly
                    className="w-full h-11 px-3.5 pr-10 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-input)', color: 'var(--text-muted)' }}
                  />
                  <Lock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Email Address</label>
                <div className="relative">
                  <input type="email" value={email} readOnly
                    className="w-full h-11 px-3.5 pr-10 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-input)', color: 'var(--text-muted)' }}
                  />
                  <Lock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>

              {/* Password Fields */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>New Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="Create a strong password"
                    className="w-full h-11 px-3.5 pr-10 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-input)'}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength meter */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all"
                          style={{ backgroundColor: i <= strength ? strengthColors[strength] : 'var(--bg-raised)' }} />
                      ))}
                    </div>
                    <p className="text-xs font-medium" style={{ color: strengthColors[strength] }}>
                      {strengthLabels[strength]}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Confirm Password</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} value={confirm}
                    onChange={e => setConfirm(e.target.value)} placeholder="Re-enter your password"
                    className="w-full h-11 px-3.5 pr-10 rounded-lg text-sm border outline-none"
                    style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-input)'}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Requirements checklist */}
              <div className="space-y-1.5">
                {[
                  { met: checks.length, label: 'At least 8 characters' },
                  { met: checks.number, label: 'At least one number' },
                  { met: checks.special, label: 'At least one special character' },
                ].map(req => (
                  <div key={req.label} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: req.met ? 'rgba(16,185,129,0.15)' : 'transparent' }}>
                      <Check className="w-3 h-3" style={{ color: req.met ? 'var(--accent-green)' : 'var(--text-muted)' }} />
                    </div>
                    <span className="text-xs" style={{ color: req.met ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={!allValid || !passwordsMatch || isLoading}
                className="w-full h-11 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 mt-8 disabled:opacity-50 transition-colors"
                style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                Activate Account
              </button>
            </form>
          </>
        )}
      </div>

      <button onClick={() => setExpired(true)} className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
        View expired state
      </button>
    </div>
  );
}