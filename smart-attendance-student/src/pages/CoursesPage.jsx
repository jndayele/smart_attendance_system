import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, Mail, ArrowRight } from 'lucide-react';
import { useAppConfig } from '../context/AppContext';
import { useStudentAuth } from '../context/AuthContext';
import CircularProgress from '../components/ui/CircularProgress';
import { COURSES, getAttendanceStatus, getStatusColor, getStatusLabel } from '../data/dummyData';

export default function CoursesPage() {
  const { institutionName, academicYear, currentSemester } = useAppConfig();
  const { programme, level } = useStudentAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = COURSES.filter(c => {
    const pct = Math.round((c.attended / c.total) * 100);
    const status = getAttendanceStatus(pct, c.threshold);
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesStatus;
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
          <option value="at-risk">At Risk</option>
          <option value="defaulter">Defaulter</option>
        </select>
      </div>

      {/* Course cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(course => {
          const pct = Math.round((course.attended / course.total) * 100);
          const status = getAttendanceStatus(pct, course.threshold);
          const statusColor = getStatusColor(status);
          const statusLabel = getStatusLabel(status);
          const needed = Math.ceil((course.threshold / 100) * course.total) - course.attended;

          return (
            <div key={course.id} className="rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="h-1.5" style={{ backgroundColor: course.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-lg font-semibold" style={{ color: course.color }}>{course.code}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-muted)' }}>{course.semester}</span>
                </div>
                <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{course.name}</h3>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {[course.programme, course.level, `${course.credits} Credits`].map(tag => (
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
                      {course.attended} of {course.total} sessions attended
                    </p>
                    <span className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                      {statusLabel}
                    </span>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Min required: {course.threshold}%</p>
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
                    <p className="ml-[18px]">Missing {needed} more classes will result in disqualification</p>
                  </div>
                )}
                {status === 'at-risk' && (
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
                  <button onClick={() => navigate(`/courses/${course.id}/attendance`)}
                    className="flex-1 h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors hover:opacity-80"
                    style={{ backgroundColor: 'transparent', border: '1px solid var(--border-btn)', color: 'var(--text-secondary)' }}>
                    View History <ArrowRight size={12} />
                  </button>
                  <button className="h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors hover:opacity-80"
                    style={{ backgroundColor: 'transparent', border: '1px solid var(--border-btn)', color: 'var(--text-secondary)' }}>
                    <Mail size={12} /> Contact
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}