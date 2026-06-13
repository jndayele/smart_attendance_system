import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAppConfig } from '../context/AppContext';

export default function ForgotPasswordPage() {
  const { shortCode, logoUrl } = useAppConfig();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-deep)' }}>
      <div className="w-full max-w-[420px] animate-fade-in-up">
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
        </div>

        <div className="rounded-xl p-6 sm:p-8"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          
          {!sent ? (
            <>
              <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Reset Your Password</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Enter your registered email address.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full h-12 px-4 rounded-lg text-sm outline-none transition-all duration-150"
                    style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-input)'} />
                </div>
                <button type="submit"
                  className="w-full h-12 rounded-lg font-semibold text-sm transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                  Send Reset Link
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(16,185,129,0.15)' }}>
                <CheckCircle size={28} style={{ color: 'var(--accent-green)' }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Check Your Email</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                A password reset link has been sent to your email. Link expires in 30 minutes.
              </p>
            </div>
          )}

          <button onClick={() => navigate('/login')}
            className="flex items-center gap-1 mx-auto mt-6 text-sm font-medium hover:underline"
            style={{ color: 'var(--accent-primary)' }}>
            <ArrowLeft size={14} /> Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}