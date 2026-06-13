import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, TrendingUp } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';

export default function CourseCard({ course, isLive }) {
  const navigate = useNavigate();

  const attColor = course.avgAttendance >= 75 ? 'var(--accent-green)'
    : course.avgAttendance >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';

  return (
    <div className="rounded-[10px] border transition-all duration-200 cursor-pointer hover:-translate-y-[3px]"
      style={{
        backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = course.color}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>

      {/* Top band */}
      <div className="h-1 rounded-t-[10px]" style={{ backgroundColor: course.color }} />

      <div className="p-4 xl:p-5">
        {/* Title & badges */}
        <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          {course.title}
        </h3>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="px-2 py-0.5 rounded text-[11px] font-medium"
            style={{ backgroundColor: `${course.color}20`, color: course.color }}>
            {course.code}
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-medium"
            style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-secondary)' }}>
            {course.programme}
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-medium"
            style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-secondary)' }}>
            {course.level}
          </span>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{course.semester}</p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {course.totalStudents}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {course.sessionsHeld}</span>
          <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> {course.avgAttendance}%</span>
        </div>

        {/* Attendance bar */}
        <div className="h-1.5 rounded-full mb-2" style={{ backgroundColor: 'var(--bg-raised)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${course.avgAttendance}%`, backgroundColor: attColor }} />
        </div>

        {course.belowThreshold > 0 && (
          <p className="text-xs font-medium mb-3" style={{ color: 'var(--accent-red)' }}>
            {course.belowThreshold} students below threshold
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          {isLive ? (
            <>
              <span className="animate-pulse-live inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)' }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-green)' }} />
                LIVE SESSION
              </span>
              <button onClick={() => navigate('/session/active')}
                className="px-3 py-2 rounded-lg text-xs font-semibold border transition-colors hover:bg-[var(--bg-raised)]"
                style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
                View Session
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/session/active')}
                className="px-3 py-2 rounded-lg text-xs font-semibold transition-opacity"
                style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                Start Session
              </button>
              <button onClick={() => navigate(`/courses/${course.id}`)}
                className="px-3 py-2 rounded-lg text-xs font-semibold border transition-colors hover:bg-[var(--bg-raised)]"
                style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
                View Course
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}