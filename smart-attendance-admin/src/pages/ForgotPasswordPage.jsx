import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppConfig } from '@/context/AppContext';
import { authAPI } from '@/api/api';
import { GraduationCap, ArrowLeft, Mail, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { config } = useAppConfig();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setLoading(true);

    try {
      await authAPI.forgotPassword(email.trim().toLowerCase());
    } catch {
      // Backend always returns a generic success message for security
      // so any error here is a network / server issue
      // We still show success to avoid leaking which emails exist
    } finally {
      setLoading(false);
      setSent(true); // Always show success
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
        </div>

        <div className="rounded-xl p-8" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          {!sent ? (
            <>
              <h2 className="font-heading text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Reset your password</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Enter your admin email and we'll send a reset link.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    required
                    disabled={loading}
                  />
                </div>
                {error && <p className="text-xs" style={{ color: 'var(--accent-red)' }}>{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Sending...</>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
                <Mail size={24} style={{ color: 'var(--accent-green)' }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Check your inbox</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                If an account exists for <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>, a password reset link has been sent.
              </p>
            </div>
          )}

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