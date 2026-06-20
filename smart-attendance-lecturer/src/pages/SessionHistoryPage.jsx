import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react';
import StatCard from '../components/shared/StatCard';
import StatusBadge from '../components/shared/StatusBadge';
import SlideOver from '../components/shared/SlideOver';
import { sessionsAPI, coursesAPI } from '../api/dashboardAPI';

// ── helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getAttColor(pct) {
  return pct >= 75 ? 'var(--accent-green)' : pct >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';
}

const COURSE_COLORS = [
  '#F59E0B', '#8B5CF6', '#3B82F6', '#10B981', '#EF4444', '#EC4899',
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function SessionHistoryPage() {
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  
  const [historyData, setHistoryData] = useState(null);
  const [coursesList, setCoursesList] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState(null);
  const [collapsed, setCollapsed] = useState({});

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      // Fetch available courses for the dropdown filter
      const cRes = await coursesAPI.getMyCourses();
      setCoursesList(cRes.courses || []);

      // Fetch history data
      // If a specific course is selected, pass it to the API
      const filterParams = courseFilter !== 'all' ? { courseId: courseFilter } : {};
      const hRes = await sessionsAPI.getHistory(filterParams);
      setHistoryData(hRes);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load session history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseFilter]);

  // Client-side search filter by session label/name
  const filteredGroups = useMemo(() => {
    if (!historyData?.grouped_by_course) return [];
    
    const query = search.toLowerCase();
    
    return historyData.grouped_by_course.map(group => {
      const matchedSessions = group.sessions.filter(s => {
        const label = s.label || '';
        const title = s.course_title || '';
        const code = s.course_code || '';
        return label.toLowerCase().includes(query) || 
               title.toLowerCase().includes(query) || 
               code.toLowerCase().includes(query);
      });
      return { ...group, sessions: matchedSessions };
    }).filter(group => group.sessions.length > 0);
  }, [historyData, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-sm" style={{ color: 'var(--accent-red)' }}>{error}</p>
        <button
          onClick={() => fetchData(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
          Retry
        </button>
      </div>
    );
  }

  // Calculate global stats from the raw fetched data
  const totalSessions = historyData?.total || 0;
  const flatSessions = historyData?.sessions || [];
  const totalPresent = flatSessions.reduce((acc, s) => acc + (s.present_count || 0), 0);
  const avgRate = totalSessions > 0
    ? flatSessions.reduce((acc, s) => acc + (s.attendance_pct || 0), 0) / totalSessions
    : 0;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl xl:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Session History
        </h1>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors hover:bg-[var(--bg-raised)] disabled:opacity-50"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
          {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Refresh
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sessions..."
            className="w-full h-10 pl-9 pr-3 rounded-lg text-sm border outline-none transition-colors focus:border-opacity-100"
            style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
          />
        </div>
        <select
          value={courseFilter}
          onChange={e => setCourseFilter(e.target.value)}
          className="h-10 px-3 rounded-lg text-sm border outline-none transition-colors"
          style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}>
          <option value="all">All Courses</option>
          {coursesList.map(c => (
            <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
          ))}
        </select>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Total Sessions" value={totalSessions} borderColor="var(--accent-blue)" />
        <StatCard label="Total Present" value={totalPresent.toLocaleString()} borderColor="var(--accent-green)" />
        <StatCard label="Avg Rate" value={`${avgRate.toFixed(1)}%`} borderColor="var(--accent-primary)" />
      </div>

      {/* ── Grouped List ── */}
      {filteredGroups.length === 0 ? (
        <div className="p-8 text-center rounded-[10px] border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No sessions found.</p>
        </div>
      ) : (
        filteredGroups.map((group, index) => {
          const courseId = group.course_id;
          const isCollapsed = collapsed[courseId];
          const color = COURSE_COLORS[index % COURSE_COLORS.length];
          
          return (
            <div key={courseId} className="rounded-[10px] border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
              <button
                onClick={() => setCollapsed(p => ({ ...p, [courseId]: !p[courseId] }))}
                className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-raised)] transition-colors rounded-t-[10px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 rounded-full" style={{ backgroundColor: color }} />
                  <div className="text-left">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {group.course_title} — {group.course_code}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{group.session_count} sessions</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: `${getAttColor(group.avg_attendance_pct)}15`, color: getAttColor(group.avg_attendance_pct) }}>
                    Avg: {group.avg_attendance_pct.toFixed(1)}%
                  </span>
                  {isCollapsed ? <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                </div>
              </button>

              {!isCollapsed && (
                <div className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  {group.sessions.map(s => {
                    const status = s.is_locked ? 'completed' : (s.is_active ? 'active' : 'inactive');
                    return (
                      <div key={s.id} onClick={() => setSelected({ ...s, _color: color })}
                        className="flex gap-4 p-4 border-b last:border-b-0 transition-colors hover:bg-[var(--bg-raised)] cursor-pointer"
                        style={{ borderColor: 'var(--border-subtle)' }}>
                        <div className="hidden sm:flex flex-col items-center justify-center w-12">
                          <p className="text-lg font-semibold" style={{ color: 'var(--accent-primary)' }}>
                            {new Date(s.session_date).getDate()}
                          </p>
                          <p className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>
                            {new Date(s.session_date).toLocaleString('en-US', { month: 'short' })}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 mr-4">
                              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                {s.label || 'Unnamed Session'}
                              </p>
                              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                                {formatTime(s.started_at)} — {s.ended_at ? formatTime(s.ended_at) : 'Ongoing'}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <StatusBadge status={status} />
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                            <span style={{ color: 'var(--accent-green)' }}>✓ {s.present_count} Present</span>
                            <span style={{ color: 'var(--accent-red)' }}>✗ {s.absent_count} Absent</span>
                            <span className="font-medium" style={{ color: getAttColor(s.attendance_pct) }}>
                              {s.attendance_pct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* ── Details Slide-over ── */}
      <SlideOver open={!!selected} onClose={() => setSelected(null)} title="Session Details">
        {selected && (
          <div className="space-y-5">
            <div>
              <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{selected.label || 'Unnamed Session'}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {selected.course_title} · {formatDate(selected.session_date)} · {formatTime(selected.started_at)}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: selected.present_count, label: 'Present', color: 'var(--accent-green)' },
                { val: selected.absent_count, label: 'Absent', color: 'var(--accent-red)' },
                { val: `${selected.attendance_pct.toFixed(1)}%`, label: 'Rate', color: getAttColor(selected.attendance_pct) },
              ].map(s => (
                <div key={s.label} className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-raised)' }}>
                  <p className="text-lg font-bold" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
              <p className="text-xs font-medium mb-3 uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Method Breakdown</p>
              <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex justify-between items-center">
                  <span>Face Scan</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selected.face_scan_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>QR Code</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selected.qr_scan_count}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <StatusBadge status={selected.is_locked ? 'completed' : (selected.is_active ? 'active' : 'inactive')} />
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}