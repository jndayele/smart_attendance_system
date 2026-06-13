import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Bell, GraduationCap } from 'lucide-react';
import { useAppConfig } from '../../context/AppContext';

const DRILL_DOWN_PATHS = ['/mark-attendance', '/profile', '/history'];

export default function TopHeader() {
  const { shortCode, logoUrl } = useAppConfig();
  const navigate = useNavigate();
  const location = useLocation();

  const isDrillDown = DRILL_DOWN_PATHS.some(p => location.pathname.startsWith(p)) ||
    location.pathname.includes('/attendance');

  return (
    <header className="h-16 flex items-center px-4 lg:px-8 sticky top-0 z-30"
      style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
      
      {/* Mobile: back arrow */}
      <div className="lg:hidden w-10">
        {isDrillDown && (
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={20} />
          </button>
        )}
      </div>

      {/* Mobile center: wordmark */}
      <div className="lg:hidden flex-1 flex items-center justify-center gap-2">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="w-6 h-6 rounded" />
        ) : (
          <GraduationCap size={18} style={{ color: 'var(--accent-primary)' }} />
        )}
        <span className="font-playfair text-base" style={{ color: 'var(--text-primary)' }}>{shortCode}</span>
      </div>

      {/* Desktop: spacer */}
      <div className="hidden lg:block flex-1" />

      {/* Bell */}
      <div className="w-10 flex justify-end">
        <button className="relative p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}>
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-red)' }} />
        </button>
      </div>
    </header>
  );
}