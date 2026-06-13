import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import CircularProgress from '../ui/CircularProgress';
import { getAttendanceStatus, getStatusColor, getStatusLabel } from '../../data/dummyData';

export default function CourseCard({ course }) {
  const navigate = useNavigate();
  const percentage = Math.round((course.attended / course.total) * 100);
  const status = getAttendanceStatus(percentage, course.threshold);
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);
  const needed = Math.ceil((course.threshold / 100) * course.total) - course.attended;

  return (
    <div className="rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group"
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      onClick={() => navigate(`/courses/${course.id}/attendance`)}>
      {/* Top color stripe */}
      <div className="h-1" style={{ backgroundColor: course.color }} />

      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <span className="text-sm font-semibold" style={{ color: course.color }}>{course.code}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-muted)' }}>
            {course.semester}
          </span>
        </div>
        <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{course.name}</h3>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-muted)' }}>{course.programme}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-muted)' }}>{course.level}</span>
        </div>

        {/* Attendance ring + stats */}
        <div className="flex items-center gap-4 mb-3">
          <CircularProgress percentage={percentage} size={72} color={statusColor} />
          <div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {course.attended} of {course.total} sessions
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
          <div className="absolute top-0 h-full w-px border-l border-dashed" style={{ left: `${course.threshold}%`, borderColor: 'var(--text-muted)' }} />
        </div>
        <p className="text-[10px] mb-3" style={{ color: 'var(--text-muted)', textAlign: 'right' }}>Min: {course.threshold}%</p>

        {/* Warning */}
        {status === 'defaulter' && needed > 0 && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg"
            style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-red)' }} />
            <p className="text-xs" style={{ color: 'var(--accent-red)' }}>
              You need to attend {needed} more sessions to reach {course.threshold}%
            </p>
          </div>
        )}
        {status === 'at-risk' && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg"
            style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-amber)' }} />
            <p className="text-xs" style={{ color: 'var(--accent-amber)' }}>
              You're close to the minimum threshold. Don't miss class!
            </p>
          </div>
        )}

        {/* Action */}
        <div className="mt-3 flex items-center justify-end">
          <span className="text-xs font-medium flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--text-secondary)' }}>
            View Details <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </div>
  );
}