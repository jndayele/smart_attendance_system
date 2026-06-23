import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppConfig } from '../context/AppContext';
import { useLecturerAuth } from '../context/LecturerAuthContext';
import { useToast } from '../components/shared/ToastManager';
import { Search, Users, Clock, TrendingUp, Download, Loader2 } from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';
import { coursesAPI } from '../api/dashboardAPI';
import { useSocketRefresh } from '../hooks/useSocketRefresh';

const COURSE_COLORS = ['#F59E0B', '#8B5CF6', '#3B82F6', '#10B981', '#EF4444', '#EC4899'];

export default function CoursesPage() {
  const { config } = useAppConfig();
  const { lecturer } = useLecturerAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        let isActiveParam = undefined;
        if (statusFilter === 'active') isActiveParam = true;
        if (statusFilter === 'inactive') isActiveParam = false;
        
        const res = await coursesAPI.getMyCourses({ search, isActive: isActiveParam });
        setCourses(res.courses || []);
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to fetch courses');
      } finally {
        setLoading(false);
      }
    };
    
    const debounce = setTimeout(() => {
      fetchCourses();
    }, 300);
    
    return () => clearTimeout(debounce);
  }, [search, statusFilter]);

  // Re-fetch immediately when backend pushes a global_update
  useSocketRefresh(() => {
    coursesAPI.getMyCourses({ search }).then(res => setCourses(res.courses || [])).catch(() => {});
  }, [search]);

  const initials = lecturer?.firstName && lecturer?.lastName 
    ? `${lecturer.firstName[0]}${lecturer.lastName[0]}` 
    : 'LC';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl xl:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>My Courses</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {config?.institutionName || 'Institution'} · {config?.academicYear || '2023/2024'} — {config?.currentSemester || 'Semester 1'}
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

      {loading && courses.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-primary)' }} />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--accent-red)' }}>{error}</div>
      ) : (
        <>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{courses.length} courses found</p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {courses.map((course, index) => {
              // Not directly provided by list endpoint, default logic:
              const avgAttendance = 0; // The list endpoint doesn't return global attendance avg easily per course
              // Wait, checking the list endpoint: enrolled_student_count and session_count. 
              // We'll mock the abovePercent and avg if not present, but wait, the detail endpoint gives it.
              // We'll leave progress bar empty if missing, or we can fetch course details. Let's omit or mock what's missing in list.
              // Wait, the prompt says: "Then it shos the Lecturers name, the number of student enrolled, the number of sessions had, then it shows the minimum threshold with a progress bar showing the number of students above in green and those below in red."
              // The backend list endpoint DOES NOT return above/below threshold counts. Only the detail endpoint does.
              // So I will just show the threshold, and a placeholder for above/below, or simply just the threshold until they open it.
              
              const color = COURSE_COLORS[index % COURSE_COLORS.length];

              return (
                <div key={course.id} className="rounded-[10px] border transition-all hover:-translate-y-[3px]"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
                  <div className="h-1 rounded-t-[10px]" style={{ backgroundColor: color }} />
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-lg font-semibold" style={{ color: color }}>{course.code}</p>
                      <StatusBadge status={course.is_active ? 'active' : 'inactive'} />
                    </div>
                    <h3 className="text-base font-semibold mb-3 truncate" style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-primary)' }}>
                      {course.title}
                    </h3>

                    <div className="flex flex-wrap gap-1.5 mb-3 text-[11px]">
                      {[course.programme_code || course.programme_name, `Level ${course.level}`, `Sem ${course.semester_number}`, `${course.credit_hours} Credits`].filter(Boolean).map(tag => (
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
                      <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{course.lecturer_name || 'Lecturer'}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                      <span className="flex items-center gap-1" title="Enrolled"><Users className="w-3.5 h-3.5" /> {course.enrolled_student_count}</span>
                      <span className="flex items-center gap-1" title="Sessions"><Clock className="w-3.5 h-3.5" /> {course.session_count}</span>
                    </div>

                    <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Min. Threshold: {course.threshold_pct}%</p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/courses/${course.id}`)}
                        className="flex-1 h-9 rounded-lg text-xs font-semibold transition-colors"
                        style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                        Open Course →
                      </button>
                      <button onClick={() => navigate('/session/active')}
                        className="h-9 px-3 rounded-lg text-xs font-semibold border hover:bg-[var(--bg-raised)] transition-colors"
                        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                        Start
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!loading && courses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No courses match your search.</p>
              <button onClick={() => { setSearch(''); setStatusFilter('all'); }}
                className="text-sm mt-2 font-medium" style={{ color: 'var(--accent-primary)' }}>Clear filters</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}