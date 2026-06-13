import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppConfig } from '@/context/AppContext';
import { authAPI, institutionAPI } from '@/api/api';
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { config, loginSuccess } = useAppConfig();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);

    try {
      // 1. Authenticate and get JWT
      const loginData = await authAPI.login(email.trim().toLowerCase(), password);
      const token = loginData.access_token;

      // 2. Fetch user profile and institution data in parallel
      //    We need to temporarily set the token so requests include auth header
      localStorage.setItem('sas_token', token);
      const [meData, instData] = await Promise.all([
        authAPI.me(),
        institutionAPI.get(),
      ]);

      // 3. Store everything in context and redirect
      loginSuccess(token, meData, instData);
      navigate('/dashboard');
    } catch (err) {
      // Show friendly message for common error codes
      if (err.status === 401) {
        setError('Incorrect email or password. Please try again.');
      } else if (err.status === 423) {
        setError(err.message || 'Account temporarily locked. Please try again later.');
      } else if (err.status === 403) {
        setError('Your account has been suspended. Contact your administrator.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-deep)' }}>
      <div className="w-full max-w-md">
        {/* Logo & institution */}
        <div className="text-center mb-8">
          {config.logoUrl ? (
            <img src={config.logoUrl} alt="Logo" className="w-14 h-14 rounded-xl mx-auto mb-3 object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: 'var(--accent-primary)' }}>
              <GraduationCap size={28} style={{ color: 'var(--bg-deep)' }} />
            </div>
          )}
          <h1 className="font-heading text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {config.shortCode || 'SAS'}
          </h1>
          {config.tagline && (
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{config.tagline}</p>
          )}
        </div>

        {/* Login card */}
        <div className="rounded-xl p-8" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <h2 className="font-heading text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Welcome back</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Sign in to your admin panel</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@university.edu"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-input)'}
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all pr-10"
                  style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-input)'}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs px-1" style={{ color: 'var(--accent-red)' }}>{error}</p>
            )}

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-xs font-medium hover:underline"
                style={{ color: 'var(--accent-primary)' }}
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in...</>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}