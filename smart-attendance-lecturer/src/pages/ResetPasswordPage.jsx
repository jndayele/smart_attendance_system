import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAppConfig } from '../context/AppContext';
import { GraduationCap, CheckCircle, ArrowLeft, Loader2, Lock } from 'lucide-react';
import { authAPI } from '../api/api';

export default function ResetPasswordPage() {
  const { config } = useAppConfig();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const checks = {
    length: password.length >= 8,
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const allValid = checks.length && checks.number && checks.special;
  const passwordsMatch = password === confirm && confirm.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setErrorMsg('Invalid or missing reset token.');
      return;
    }
    if (isLoading || !allValid || !passwordsMatch) return;
    
    setIsLoading(true);
    setErrorMsg('');
    try {
      await authAPI.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ backgroundColor: 'var(--bg-deep)' }}>
        <div className="w-full max-w-[440px] rounded-xl border p-6 xl:p-8 text-center" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
            <CheckCircle className="w-7 h-7" style={{ color: 'var(--accent-green)' }} />
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Password Reset Successful!</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>You can now log in with your new password. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ backgroundColor: 'var(--bg-deep)' }}>
      <div className="flex flex-col items-center mb-8">
        {config.logoUrl ? (
          <img src={config.logoUrl} alt="" className="w-14 h-14 rounded-xl mb-3" />
        ) : (
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--accent-primary)' }}>
            <GraduationCap className="w-7 h-7" style={{ color: 'var(--bg-deep)' }} />
          </div>
        )}
        <h1 className="text-[28px] font-bold" style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-primary)' }}>{config.shortCode}</h1>
      </div>

      <div className="w-full max-w-[440px] rounded-xl border p-6 xl:p-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Create New Password</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Please enter your new password below.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 text-red-500 text-sm mb-4">
              {errorMsg}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>New Password</label>
            <div className="relative">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full h-11 px-3.5 pr-10 rounded-lg text-sm border outline-none transition-colors"
                style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-input)'}
              />
              <Lock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            </div>
            
            {password && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${checks.length ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-transparent'}`}>
                    <CheckCircle className="w-2.5 h-2.5" />
                  </div>
                  <span style={{ color: checks.length ? 'var(--text-primary)' : 'var(--text-muted)' }}>At least 8 characters</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${checks.number ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-transparent'}`}>
                    <CheckCircle className="w-2.5 h-2.5" />
                  </div>
                  <span style={{ color: checks.number ? 'var(--text-primary)' : 'var(--text-muted)' }}>Contains a number</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${checks.special ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-transparent'}`}>
                    <CheckCircle className="w-2.5 h-2.5" />
                  </div>
                  <span style={{ color: checks.special ? 'var(--text-primary)' : 'var(--text-muted)' }}>Contains a special character</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Confirm Password</label>
            <div className="relative">
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                className="w-full h-11 px-3.5 pr-10 rounded-lg text-sm border outline-none transition-colors"
                style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-input)'}
              />
              <Lock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            </div>
            {confirm && !passwordsMatch && (
              <p className="text-xs mt-1 text-red-500">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!allValid || !passwordsMatch || isLoading}
            className="w-full h-11 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 mt-8 disabled:opacity-50 transition-colors"
            style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            Reset Password
          </button>
        </form>

        <Link to="/login" className="flex items-center gap-1.5 text-sm font-medium mt-6 justify-center" style={{ color: 'var(--accent-primary)' }}>
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>
      </div>
    </div>
  );
}
