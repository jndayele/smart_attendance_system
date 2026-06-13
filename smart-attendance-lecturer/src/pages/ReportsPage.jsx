import React, { useState } from 'react';
import { useAppConfig } from '../context/AppContext';
import { useToast } from '../components/shared/ToastManager';
import { Download, FileText, User, AlertTriangle, Mail, Search } from 'lucide-react';
import SessionBarChart from '../components/charts/SessionBarChart';
import WeeklyTrendChart from '../components/charts/WeeklyTrendChart';
import StatusBadge from '../components/shared/StatusBadge';
import { courses, sessionsCS301, sessionsCS401, sessionsCS201, allStudentsPool } from '../data/mockData';

export default function ReportsPage() {
  const { config } = useAppConfig();
  const { addToast } = useToast();
  const [chartCourse, setChartCourse] = useState('CS301');
  const [defaulterCourse, setDefaulterCourse] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState([]);

  const sessionMap = { CS301: sessionsCS301, CS401: sessionsCS401, CS201: sessionsCS201 };
  const course = courses.find(c => c.id === chartCourse);

  const defaulters = allStudentsPool.filter(s =>
    (s.status === 'at-risk' || s.status === 'defaulter') &&
    (defaulterCourse === 'all' || s.course === defaulterCourse || (defaulterCourse === 'CS301' && !s.course))
  );

  const toggleStudent = (id) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl xl:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Attendance Reports</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {config.institutionName} · {config.academicYear} — {config.currentSemester}
        </p>
      </div>

      {/* Export Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {[
          { icon: FileText, title: 'Course Attendance Report', desc: 'Full attendance record for a specific course', color: 'var(--accent-blue)' },
          { icon: User, title: 'Per-Student Report', desc: 'Individual attendance history across sessions', color: 'var(--accent-purple)' },
          { icon: AlertTriangle, title: 'Defaulters Report', desc: 'All students below the attendance threshold', color: 'var(--accent-red)' },
        ].map(item => (
          <div key={item.title} className="rounded-[10px] border p-5"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
              style={{ backgroundColor: `${item.color}15` }}>
              <item.icon className="w-5 h-5" style={{ color: item.color }} />
            </div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
            <div className="flex gap-2">
              <button onClick={() => addToast('Generating report... This may take a moment.', 'info')}
                className="px-3 py-2 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                Export PDF
              </button>
              <button onClick={() => addToast('Generating Excel...', 'info')}
                className="px-3 py-2 rounded-lg text-xs font-semibold border hover:bg-[var(--bg-raised)]"
                style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
                Export Excel
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Chart 1 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Attendance Rate Per Session — {course?.title} ({chartCourse})
          </h2>
          <select value={chartCourse} onChange={e => setChartCourse(e.target.value)}
            className="h-9 px-3 rounded-lg text-xs border outline-none"
            style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </div>
        <SessionBarChart sessions={sessionMap[chartCourse] || []} threshold={course?.threshold || 75} />
      </div>

      {/* Chart 2 */}
      <WeeklyTrendChart />

      {/* Defaulters Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>At-Risk Students</h2>
            <span className="w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-red)', color: '#fff' }}>{defaulters.length}</span>
          </div>
          <select value={defaulterCourse} onChange={e => setDefaulterCourse(e.target.value)}
            className="h-9 px-3 rounded-lg text-xs border outline-none"
            style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}>
            <option value="all">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </div>

        {selectedStudents.length > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg mb-3"
            style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)' }}>
            <p className="text-sm flex-1" style={{ color: 'var(--accent-primary)' }}>
              {selectedStudents.length} students selected
            </p>
            <button onClick={() => { addToast('Warning emails sent', 'success'); setSelectedStudents([]); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
              Send Warning Emails to All
            </button>
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden xl:block rounded-[10px] border overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded" onChange={e => {
                  setSelectedStudents(e.target.checked ? defaulters.map(d => d.id) : []);
                }} /></th>
                {['Student', 'ID', 'Course', 'Current %', 'Threshold', 'Shortfall', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {defaulters.map(s => {
                const threshold = courses.find(c => c.id === (s.course || 'CS301'))?.threshold || 75;
                const shortfall = s.percentage - threshold;
                return (
                  <tr key={s.id} className="transition-colors hover:bg-[var(--bg-raised)]"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded" checked={selectedStudents.includes(s.id)}
                        onChange={() => toggleStudent(s.id)} />
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.id}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.course || 'CS301'}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--accent-red)' }}>{s.percentage}%</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{threshold}%</td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--accent-red)' }}>{shortfall}%</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => addToast('Warning email sent', 'success')}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium hover:bg-[var(--bg-raised)]"
                          style={{ color: 'var(--accent-primary)' }}>
                          <Mail className="w-3 h-3" /> Warn
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="xl:hidden space-y-3">
          {defaulters.map(s => {
            const threshold = courses.find(c => c.id === (s.course || 'CS301'))?.threshold || 75;
            const shortfall = s.percentage - threshold;
            return (
              <div key={s.id} className="rounded-[10px] border p-4"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</p>
                  <span className="text-sm font-bold" style={{ color: 'var(--accent-red)' }}>{s.percentage}%</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>{s.id}</span>
                  <span>·</span>
                  <span>{s.course || 'CS301'}</span>
                  <span>·</span>
                  <span style={{ color: 'var(--accent-red)' }}>Shortfall: {shortfall}%</span>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <StatusBadge status={s.status} />
                  <button onClick={() => addToast('Warning email sent', 'success')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ color: 'var(--accent-primary)' }}>
                    <Mail className="w-3 h-3" /> Send Warning
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}