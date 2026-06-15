import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppConfig } from '../context/AppContext';
import { GraduationCap, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { authAPI } from '../api/api';

export default function ForgotPasswordPage() {
  const { config } = useAppConfig();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || !email) return;
    
    setIsLoading(true);
    setErrorMsg('');
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send reset link.');
    } finally {
      setIsLoading(false);
    }
  };

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

        {!sent ? (
          <>
            <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Reset your password</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Enter your email and we'll send a reset link.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 text-red-500 text-sm mb-4">
                  {errorMsg}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="staff@university.edu" required
                  className="w-full h-11 px-3.5 rounded-lg text-sm border outline-none transition-colors"
                  style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-input)'}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full h-11 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                Send Reset Link
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
              <CheckCircle className="w-7 h-7" style={{ color: 'var(--accent-green)' }} />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Reset link sent!</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Check your email for a link to reset your password.
            </p>
          </div>
        )}

        <Link to="/login" className="flex items-center gap-1.5 text-sm font-medium mt-6 justify-center"
          style={{ color: 'var(--accent-primary)' }}>
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>
      </div>
    </div>
  );
}