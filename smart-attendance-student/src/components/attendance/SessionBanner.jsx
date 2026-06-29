import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useSession } from '../../context/SessionContext';

export default function SessionBanner() {
  const { session, isSessionActive, formattedTime, isUrgent } = useSession();
  const navigate = useNavigate();

  if (!isSessionActive || !session) return null;

  return (
    <div className="rounded-xl p-4 mb-6 animate-fade-in-up relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))`,
        border: '1px solid rgba(245,158,11,0.25)',
      }}>
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5"
        style={{ backgroundColor: 'var(--accent-primary)', transform: 'translate(30%, -30%)' }} />
      
      <div className="flex items-start gap-3 mb-3">
        <span className="mt-1 w-2.5 h-2.5 rounded-full animate-pulse-dot flex-shrink-0"
          style={{ backgroundColor: 'var(--accent-primary)' }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold tracking-wider mb-1" style={{ color: 'var(--accent-primary)' }}>
            LIVE SESSION
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Your lecturer has started an attendance session for
          </p>
          <p className="text-base font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>
            {session.course_title} — {session.course_code}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Lecturer: {session.lecturer_name}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Closes in</p>
          <p className="text-xl font-semibold font-mono" style={{ color: isUrgent ? 'var(--accent-red)' : 'var(--accent-primary)' }}>
            {formattedTime}
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate('/mark-attendance')}
        className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
        style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
        Mark My Attendance Now
        <ArrowRight size={16} />
      </button>
    </div>
  );
}