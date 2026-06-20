import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import CircularProgress from '../ui/CircularProgress';

function getStatusColor(status) {
  if (status === 'good') return 'var(--accent-green)';
  if (status === 'at_risk') return 'var(--accent-amber)';
  return 'var(--accent-red)';
}

function getStatusLabel(status) {
  if (status === 'good') return 'Good Standing';
  if (status === 'at_risk') return 'At Risk';
  return 'Defaulter';
}

// Generate a consistent color based on course code
function getColorForCourse(code) {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899'];
  return colors[Math.abs(hash) % colors.length];
}

export default function CourseCard({ course }) {
  const navigate = useNavigate();
  const percentage = Math.round(course.attendance_pct || 0);
  const status = course.status || 'good';
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);
  const needed = course.sessions_needed_to_pass || 0;
  const courseColor = getColorForCourse(course.course_code || '');

  return (
    <div className="rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group flex flex-col h-full"
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      onClick={() => navigate(`/courses/${course.course_id}/attendance`)}>
      {/* Top color stripe */}
      <div className="h-1" style={{ backgroundColor: courseColor }} />

      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <span className="text-sm font-semibold" style={{ color: courseColor }}>{course.course_code}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-muted)' }}>
            Semester {course.semester_number}
          </span>
        </div>
        <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{course.course_title}</h3>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-muted)' }}>{course.programme_name}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-muted)' }}>Level {course.level}</span>
        </div>

        {/* Attendance ring + stats */}
        <div className="flex items-center gap-4 mb-3">
          <CircularProgress percentage={percentage} size={72} color={statusColor} />
          <div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {course.sessions_present} of {course.sessions_total} sessions
            </p>
            <span className="inline-flex items-center gap-1.5 mt-1 text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-1.5 rounded-full mb-1" style={{ backgroundColor: 'var(--bg-raised)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: statusColor }} />
          <div className="absolute top-0 h-full w-px border-l border-dashed" style={{ left: `${course.threshold_pct}%`, borderColor: 'var(--text-muted)' }} />
        </div>
        <p className="text-[10px] mb-3" style={{ color: 'var(--text-muted)', textAlign: 'right' }}>Min: {course.threshold_pct}%</p>

        {/* Spacer to push warning/action down */}
        <div className="flex-1" />

        {/* Warning */}
        {status === 'defaulter' && needed > 0 && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg mb-3"
            style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-red)' }} />
            <p className="text-xs" style={{ color: 'var(--accent-red)' }}>
              You need to attend {needed} more sessions to reach {course.threshold_pct}%
            </p>
          </div>
        )}
        {status === 'at_risk' && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg mb-3"
            style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-amber)' }} />
            <p className="text-xs" style={{ color: 'var(--accent-amber)' }}>
              You're close to the minimum threshold. Don't miss class!
            </p>
          </div>
        )}

        {/* Action */}
        <div className="mt-auto flex items-center justify-end">
          <span className="text-xs font-medium flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--text-secondary)' }}>
            View Details <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </div>
  );
}