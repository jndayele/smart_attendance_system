import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, TrendingUp } from 'lucide-react';

const COURSE_COLORS = [
  '#F59E0B', '#8B5CF6', '#3B82F6', '#10B981', '#EF4444', '#EC4899',
];

export default function CourseCard({ course, index = 0 }) {
  const navigate = useNavigate();
  const color = COURSE_COLORS[index % COURSE_COLORS.length];

  const avg = course.avg_attendance_pct ?? 0;
  const attColor =
    avg >= 75 ? 'var(--accent-green)'
    : avg >= 60 ? 'var(--accent-amber)'
    : 'var(--accent-red)';

  // Threshold-aware progress bar: % of students ABOVE threshold
  const aboveThresholdPct = course.enrolled_count > 0
    ? ((course.enrolled_count - course.below_threshold_count) / course.enrolled_count) * 100
    : 0;

  return (
    <div
      className="rounded-[10px] border transition-all duration-200 cursor-pointer hover:-translate-y-[3px]"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
    >
      {/* Top colour band */}
      <div className="h-1 rounded-t-[10px]" style={{ backgroundColor: color }} />

      <div className="p-4 xl:p-5">
        {/* Title */}
        <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          {course.course_title}
        </h3>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="px-2 py-0.5 rounded text-[11px] font-medium"
            style={{ backgroundColor: `${color}20`, color }}>
            {course.course_code}
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-medium"
            style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-secondary)' }}>
            {course.programme_name}
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-medium"
            style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-secondary)' }}>
            Level {course.level}
          </span>
        </div>

        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Semester {course.semester_number} · {course.credit_hours} credit hrs
        </p>

        {/* Quick stats */}
        <div className="flex items-center gap-4 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {course.enrolled_count}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {course.sessions_held} sessions</span>
          <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> {avg.toFixed(1)}%</span>
        </div>

        {/* Progress bar — green = above threshold, red = below */}
        <div className="mb-1">
          <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>
            <span>Threshold: {course.threshold_pct}%</span>
            <span>{course.enrolled_count - course.below_threshold_count} / {course.enrolled_count} above</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-raised)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${aboveThresholdPct}%`, backgroundColor: attColor }}
            />
          </div>
        </div>

        {course.below_threshold_count > 0 && (
          <p className="text-xs font-medium mt-2" style={{ color: 'var(--accent-red)' }}>
            {course.below_threshold_count} student{course.below_threshold_count > 1 ? 's' : ''} below threshold
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          {course.has_live_session ? (
            <>
              <span className="animate-pulse-live inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)' }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-green)' }} />
                LIVE SESSION
              </span>
              <button
                onClick={() => navigate('/session/active')}
                className="px-3 py-2 rounded-lg text-xs font-semibold border transition-colors hover:bg-[var(--bg-raised)]"
                style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
                View Session
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/session/active')}
                className="px-3 py-2 rounded-lg text-xs font-semibold transition-opacity"
                style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                Start Session
              </button>
              <button
                onClick={() => navigate(`/courses/${course.course_id}`)}
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