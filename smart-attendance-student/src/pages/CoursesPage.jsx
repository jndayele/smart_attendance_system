import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, Mail, ArrowRight, Loader2, BookOpen } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppConfig } from '../context/AppContext';
import { useStudentAuth } from '../context/AuthContext';
import { studentAPI } from '../api/studentAPI';
import CircularProgress from '../components/ui/CircularProgress';
import { useSocket } from '../context/SocketContext';

const getAttendanceStatus = (pct, threshold) => {
  if (pct >= threshold) return 'good';
  if (pct >= threshold - 10) return 'at_risk';
  return 'defaulter';
};

const STATUS_CONFIG = {
  good: { label: 'Good Standing', color: 'var(--accent-green)' },
  at_risk: { label: 'At Risk', color: 'var(--accent-amber)' },
  defaulter: { label: 'Defaulter', color: 'var(--accent-red)' },
};

const COURSE_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#10B981', '#3B82F6', '#EF4444',
];

export default function CoursesPage() {
  const { institutionName, academicYear, currentSemester } = useAppConfig();
  const { programme, level } = useStudentAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Invalidate the courses query whenever the backend pushes a global_update
  useEffect(() => {
    if (!socket) return;
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['studentCourses'] });
    socket.on('global_update', refresh);
    return () => socket.off('global_update', refresh);
  }, [socket, queryClient]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['studentCourses', search],
    queryFn: () => studentAPI.getCourses({ limit: 100, search }),
    staleTime: 30000,
  });

  const allCourses = (data?.courses || []).map((c, idx) => ({
    ...c,
    color: COURSE_COLORS[idx % COURSE_COLORS.length],
  }));

  const filtered = allCourses.filter(c => {
    const status = c.status || getAttendanceStatus(c.attendance_pct, c.threshold_pct);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    const matchesSearch = !search
      || c.course_title.toLowerCase().includes(search.toLowerCase())
      || c.course_code.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>My Courses</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {institutionName} · {academicYear} — {currentSemester} | {programme}, {level}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full h-10 pl-10 pr-4 rounded-lg text-sm outline-none"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-lg text-sm outline-none appearance-none cursor-pointer"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
          <option value="all">All Status</option>
          <option value="good">Good Standing</option>
          <option value="at_risk">At Risk</option>
          <option value="defaulter">Defaulter</option>
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="py-16 flex justify-center">
          <Loader2 className="animate-spin" size={36} style={{ color: 'var(--text-muted)' }} />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="py-10 text-center rounded-xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px dashed var(--border-subtle)' }}>
          <p className="text-sm" style={{ color: 'var(--accent-red)' }}>Failed to load courses. Please try again.</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="py-16 text-center rounded-xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px dashed var(--border-subtle)' }}>
          <BookOpen size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No courses found.</p>
        </div>
      )}

      {/* Course cards */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(course => {
            const pct = Math.round(course.attendance_pct);
            const status = course.status || getAttendanceStatus(pct, course.threshold_pct);
            const { label: statusLabel, color: statusColor } = STATUS_CONFIG[status] || STATUS_CONFIG.good;
            const needed = course.sessions_needed_to_pass || 0;

            return (
              <div key={course.course_id} className="rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                {/* Colored top accent */}
                <div className="h-1.5" style={{ backgroundColor: course.color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-lg font-semibold" style={{ color: course.color }}>{course.course_code}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-muted)' }}>
                      Sem {course.semester_number}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{course.course_title}</h3>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {[
                      course.programme_name,
                      `Level ${course.level}`,
                      course.credit_hours ? `${course.credit_hours} Credits` : null,
                    ].filter(Boolean).map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-muted)' }}>{tag}</span>
                    ))}
                  </div>
                  <div className="h-px mb-4" style={{ backgroundColor: 'var(--border-subtle)' }} />

                  {/* Attendance */}
                  <div className="flex items-center gap-4 mb-4">
                    <CircularProgress percentage={pct} size={80} color={statusColor} />
                    <div>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {course.sessions_present} of {course.sessions_total} sessions attended
                      </p>
                      <span className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                        {statusLabel}
                      </span>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Min required: {course.threshold_pct}%</p>
                    </div>
                  </div>

                  {/* Warnings */}
                  {status === 'defaulter' && needed > 0 && (
                    <div className="p-2.5 rounded-lg mb-3 text-xs space-y-1"
                      style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--accent-red)' }}>
                      <div className="flex items-start gap-1.5">
                        <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                        <span>You need {needed} more sessions to reach minimum attendance</span>
                      </div>
                    </div>
                  )}
                  {status === 'at_risk' && (
                    <div className="p-2.5 rounded-lg mb-3 text-xs"
                      style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: 'var(--accent-amber)' }}>
                      <div className="flex items-start gap-1.5">
                        <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                        <span>You're close to the minimum threshold. Don't miss class!</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-3">
                    <button onClick={() => navigate(`/courses/${course.course_id}/attendance`)}
                      className="flex-1 h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors hover:opacity-80"
                      style={{ backgroundColor: 'transparent', border: '1px solid var(--border-btn)', color: 'var(--text-secondary)' }}>
                      View History <ArrowRight size={12} />
                    </button>
                    {course.lecturer_email ? (
                      <a href={`mailto:${course.lecturer_email}?subject=Attendance Inquiry — ${course.course_code}`}
                        className="h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors hover:opacity-80"
                        style={{ backgroundColor: 'transparent', border: '1px solid var(--border-btn)', color: 'var(--text-secondary)' }}>
                        <Mail size={12} /> Contact
                      </a>
                    ) : (
                      <button disabled
                        className="h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-1 opacity-40 cursor-not-allowed"
                        style={{ backgroundColor: 'transparent', border: '1px solid var(--border-btn)', color: 'var(--text-secondary)' }}>
                        <Mail size={12} /> Contact
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}