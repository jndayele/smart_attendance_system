import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAppConfig } from '@/context/AppContext';
import { authAPI } from '@/api/api';
import { GraduationCap, Eye, EyeOff, AlertTriangle, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');
  const navigate = useNavigate();
  const { config } = useAppConfig();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // ── Invalid / missing token ────────────────────────────────────────────────
  if (!resetToken) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-deep)' }}>
        <div className="w-full max-w-md">
          <BrandHeader config={config} />
          <div className="rounded-xl p-8 text-center" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
              <AlertTriangle size={24} style={{ color: 'var(--accent-red)' }} />
            </div>
            <h2 className="font-heading text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Invalid reset link</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              This password reset link is missing or invalid. Please request a new one.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}
            >
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-deep)' }}>
        <div className="w-full max-w-md">
          <BrandHeader config={config} />
          <div className="rounded-xl p-8 text-center" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
              <CheckCircle2 size={24} style={{ color: 'var(--accent-green)' }} />
            </div>
            <h2 className="font-heading text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Password reset!</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Your password has been updated. You can now sign in with your new password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Reset form ────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(resetToken, newPassword);
      setSuccess(true);
    } catch (err) {
      if (err.status === 400 || err.status === 404) {
        setError('This reset link has expired or already been used. Please request a new one.');
      } else {
        setError(err.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-deep)' }}>
      <div className="w-full max-w-md">
        <BrandHeader config={config} />

        <div className="rounded-xl p-8" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <h2 className="font-heading text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Set new password</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Enter your new password below. Minimum 8 characters.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New password */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all pr-10"
                  style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-input)'}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all pr-10"
                  style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-input)'}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--accent-red)' }} />
                <p className="text-xs" style={{ color: 'var(--accent-red)' }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Resetting...</>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 mt-6 text-xs font-medium hover:underline"
            style={{ color: 'var(--accent-primary)' }}
          >
            <ArrowLeft size={14} /> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Shared branding header — logo + short code */
function BrandHeader({ config }) {
  return (
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
    </div>
  );
}
