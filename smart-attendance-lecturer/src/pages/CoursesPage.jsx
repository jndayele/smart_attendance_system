import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppConfig } from '../context/AppContext';
import { useLecturerAuth } from '../context/LecturerAuthContext';
import { useToast } from '../components/shared/ToastManager';
import { Search, Users, Clock, TrendingUp, Download } from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';
import { courses } from '../data/mockData';

export default function CoursesPage() {
  const { config } = useAppConfig();
  const { lecturer } = useLecturerAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const initials = lecturer.firstName && lecturer.lastName ? `${lecturer.firstName[0]}${lecturer.lastName[0]}` : 'LC';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl xl:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>My Courses</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {config.institutionName} · {config.academicYear} — {config.currentSemester}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full h-10 pl-9 pr-3 rounded-lg text-sm border outline-none"
            style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-input)'}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'inactive'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: statusFilter === s ? 'var(--accent-primary)' : 'var(--bg-surface)',
                color: statusFilter === s ? 'var(--bg-deep)' : 'var(--text-secondary)',
                border: statusFilter === s ? 'none' : '1px solid var(--border-subtle)',
              }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{filtered.length} courses found</p>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(course => {
          const attColor = course.avgAttendance >= 75 ? 'var(--accent-green)'
            : course.avgAttendance >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';
          const abovePercent = Math.round((course.aboveThreshold / course.totalStudents) * 100);

          return (
            <div key={course.id} className="rounded-[10px] border transition-all hover:-translate-y-[3px]"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = course.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
              <div className="h-1 rounded-t-[10px]" style={{ backgroundColor: course.color }} />
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-1">
                  <p className="text-lg font-semibold" style={{ color: course.color }}>{course.code}</p>
                  <StatusBadge status={course.status} />
                </div>
                <h3 className="text-base font-semibold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-primary)' }}>
                  {course.title}
                </h3>

                <div className="flex flex-wrap gap-1.5 mb-3 text-[11px]">
                  {[course.programme, course.level, course.semester, `${course.credits} Credits`].map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-secondary)' }}>
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="h-px mb-3" style={{ backgroundColor: 'var(--border-subtle)' }} />

                {/* Lecturer */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold"
                    style={{ backgroundColor: 'var(--accent-blue)', color: '#fff' }}>{initials}</div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{lecturer.lecturerName}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {course.totalStudents}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {course.sessionsHeld}</span>
                  <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> {course.avgAttendance}%</span>
                </div>

                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Min: {course.threshold}%</p>

                {/* Distribution bar */}
                <div className="flex h-2 rounded-full overflow-hidden mb-1" style={{ backgroundColor: 'var(--bg-raised)' }}>
                  <div className="h-full" style={{ width: `${abovePercent}%`, backgroundColor: 'var(--accent-green)' }} />
                  <div className="h-full" style={{ width: `${100 - abovePercent}%`, backgroundColor: 'var(--accent-red)' }} />
                </div>
                <div className="flex justify-between text-[10px] mb-4">
                  <span style={{ color: 'var(--accent-green)' }}>{course.aboveThreshold} above</span>
                  <span style={{ color: 'var(--accent-red)' }}>{course.belowThreshold} below</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/courses/${course.id}`)}
                    className="flex-1 h-9 rounded-lg text-xs font-semibold"
                    style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                    Open Course →
                  </button>
                  <button onClick={() => navigate('/session/active')}
                    className="h-9 px-3 rounded-lg text-xs font-semibold border hover:bg-[var(--bg-raised)]"
                    style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
                    Start
                  </button>
                  <button onClick={() => addToast('Generating report...', 'info')}
                    className="h-9 w-9 rounded-lg flex items-center justify-center border hover:bg-[var(--bg-raised)]"
                    style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-secondary)' }}>
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No courses match your search.</p>
          <button onClick={() => { setSearch(''); setStatusFilter('all'); }}
            className="text-sm mt-2 font-medium" style={{ color: 'var(--accent-primary)' }}>Clear filters</button>
        </div>
      )}
    </div>
  );
}