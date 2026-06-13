import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import StatCard from '../components/shared/StatCard';
import StatusBadge from '../components/shared/StatusBadge';
import SlideOver from '../components/shared/SlideOver';
import { allSessions, courses } from '../data/mockData';

export default function SessionHistoryPage() {
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [collapsed, setCollapsed] = useState({});

  const filtered = allSessions.filter(s => {
    const matchSearch = s.label.toLowerCase().includes(search.toLowerCase());
    const matchCourse = courseFilter === 'all' || s.courseId === courseFilter;
    return matchSearch && matchCourse;
  });

  // Group by course
  const grouped = {};
  filtered.forEach(s => {
    if (!grouped[s.courseId]) grouped[s.courseId] = [];
    grouped[s.courseId].push(s);
  });

  const attColor = (pct) => pct >= 75 ? 'var(--accent-green)' : pct >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';

  return (
    <div className="space-y-6">
      <h1 className="text-xl xl:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Session History</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sessions..."
            className="w-full h-10 pl-9 pr-3 rounded-lg text-sm border outline-none"
            style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
          />
        </div>
        <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}
          className="h-10 px-3 rounded-lg text-sm border outline-none"
          style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}>
          <option value="all">All Courses</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.code})</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Total Sessions" value="34" borderColor="var(--accent-blue)" />
        <StatCard label="Total Present" value="2,847" borderColor="var(--accent-green)" />
        <StatCard label="Avg Rate" value="79.3%" borderColor="var(--accent-primary)" />
      </div>

      {/* Grouped list */}
      {Object.entries(grouped).map(([courseId, sessions]) => {
        const course = courses.find(c => c.id === courseId) || {};
        const isCollapsed = collapsed[courseId];
        const avg = (sessions.reduce((s, x) => s + x.percentage, 0) / sessions.length).toFixed(1);

        return (
          <div key={courseId} className="rounded-[10px] border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            <button onClick={() => setCollapsed(p => ({ ...p, [courseId]: !p[courseId] }))}
              className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-raised)] transition-colors rounded-t-[10px]">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 rounded-full" style={{ backgroundColor: course.color }} />
                <div className="text-left">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {course.title} — {course.code}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sessions.length} sessions</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: `${attColor(parseFloat(avg))}15`, color: attColor(parseFloat(avg)) }}>
                  Avg: {avg}%
                </span>
                {isCollapsed ? <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
              </div>
            </button>

            {!isCollapsed && (
              <div className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                {sessions.map(s => (
                  <div key={s.id} onClick={() => setSelected(s)}
                    className="flex gap-4 p-4 border-b last:border-b-0 transition-colors hover:bg-[var(--bg-raised)] cursor-pointer"
                    style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="hidden sm:flex flex-col items-center justify-center w-12">
                      <p className="text-lg font-semibold" style={{ color: 'var(--accent-primary)' }}>{new Date(s.date).getDate()}</p>
                      <p className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>{new Date(s.date).toLocaleString('en-US', { month: 'short' })}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.label}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.time} — {s.endTime}</p>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs">
                        <span style={{ color: 'var(--accent-green)' }}>✓ {s.present} Present</span>
                        <span style={{ color: 'var(--accent-red)' }}>✗ {s.total - s.present} Absent</span>
                        <span className="font-medium" style={{ color: attColor(s.percentage) }}>{s.percentage}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <SlideOver open={!!selected} onClose={() => setSelected(null)} title="Session Details">
        {selected && (
          <div className="space-y-5">
            <div>
              <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{selected.label}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selected.courseName} · {selected.date} · {selected.time}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: selected.present, label: 'Present', color: 'var(--accent-green)' },
                { val: selected.total - selected.present, label: 'Absent', color: 'var(--accent-red)' },
                { val: `${selected.percentage}%`, label: 'Rate', color: attColor(selected.percentage) },
              ].map(s => (
                <div key={s.label} className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-raised)' }}>
                  <p className="text-lg font-bold" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-raised)' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Method Breakdown</p>
              <div className="flex gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span>{selected.faceScan} via Face Scan</span>
                <span>·</span>
                <span>{selected.qrCode} via QR Code</span>
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}