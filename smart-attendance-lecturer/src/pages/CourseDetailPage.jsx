import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, Users, Eye, Pencil, Mail, ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';
import { useToast } from '../components/shared/ToastManager';
import StatCard from '../components/shared/StatCard';
import StatusBadge from '../components/shared/StatusBadge';
import SlideOver from '../components/shared/SlideOver';
import { courses, studentsCS301, sessionsCS301 } from '../data/mockData';
import SessionBarChart from '../components/charts/SessionBarChart';

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const course = courses.find(c => c.id === id) || courses[0];

  const [activeTab, setActiveTab] = useState('students');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const tabs = [
    { key: 'students', label: 'Students' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'reports', label: 'Reports' },
  ];

  const filteredStudents = studentsCS301.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all'
      || (statusFilter === 'above' && s.status === 'good')
      || (statusFilter === 'below' && (s.status === 'at-risk' || s.status === 'defaulter'));
    return matchSearch && matchStatus;
  });

  const attColor = (pct) => pct >= 75 ? 'var(--accent-green)' : pct >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map(s => s.id));
    }
  };
  const allSelected = filteredStudents.length > 0 && selectedIds.length === filteredStudents.length;
  const someSelected = selectedIds.length > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate('/courses')} className="mt-1 p-1.5 rounded-lg hover:bg-[var(--bg-raised)]"
          style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{course.title}</h1>
            <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: `${course.color}20`, color: course.color }}>
              {course.code}
            </span>
            <StatusBadge status={course.status} />
          </div>
          <div className="flex flex-wrap gap-2 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {[course.programme, course.level, course.semester, `${course.credits} Credit Hours`, `Min Threshold: ${course.threshold}%`].map(t => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: 'var(--border-subtle)' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="px-4 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2"
            style={{
              borderColor: activeTab === tab.key ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--text-muted)',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard label="Total Enrolled" value={course.totalStudents} borderColor="var(--accent-blue)" icon={Users} />
            <StatCard label="Above Threshold" value={course.aboveThreshold} borderColor="var(--accent-green)" />
            <StatCard label="Below Threshold" value={course.belowThreshold} borderColor="var(--accent-red)" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID..."
                className="w-full h-10 pl-9 pr-3 rounded-lg text-sm border outline-none"
                style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[['all', 'All'], ['above', 'Above Threshold'], ['below', 'Below Threshold']].map(([val, label]) => (
                <button key={val} onClick={() => setStatusFilter(val)}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: statusFilter === val ? 'var(--accent-primary)' : 'var(--bg-surface)',
                    color: statusFilter === val ? 'var(--bg-deep)' : 'var(--text-secondary)',
                    border: statusFilter === val ? 'none' : '1px solid var(--border-subtle)',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{filteredStudents.length} results found</p>
            {someSelected && (
              <span className="text-xs font-medium" style={{ color: 'var(--accent-primary)' }}>
                {selectedIds.length} selected
              </span>
            )}
          </div>

          {/* Bulk Action Bar */}
          {someSelected && (
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-[10px] border animate-fade-in-up"
              style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--accent-primary)', borderWidth: '1px' }}>
              <span className="text-xs font-medium mr-2" style={{ color: 'var(--text-secondary)' }}>
                {selectedIds.length} student{selectedIds.length > 1 ? 's' : ''} selected —
              </span>
              <button onClick={() => { setSelectedIds([]); addToast('Override applied to selected students', 'success'); }}
                className="px-3 py-1.5 rounded text-xs font-medium transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--accent-green)', color: '#fff' }}>
                Mark Present
              </button>
              <button onClick={() => { setSelectedIds([]); addToast('Override applied to selected students', 'success'); }}
                className="px-3 py-1.5 rounded text-xs font-medium transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--accent-red)', color: '#fff' }}>
                Mark Absent
              </button>
              <button onClick={() => { setSelectedIds([]); addToast('Warning emails sent', 'success'); }}
                className="px-3 py-1.5 rounded text-xs font-medium border transition-opacity hover:opacity-80"
                style={{ borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' }}>
                Send Warning
              </button>
              <button onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 rounded text-xs font-medium ml-auto transition-opacity hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}>
                Clear selection
              </button>
            </div>
          )}

          {/* Desktop Table */}
          <div className="hidden xl:block rounded-[10px] border overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <th className="w-10 px-3 py-3">
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded accent-amber-500 cursor-pointer" />
                  </th>
                  {['Student', 'ID', 'Attendance', 'Sessions', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(s => {
                  const initials = s.name.split(' ').map(n => n[0]).join('');
                  return (
                    <tr key={s.id} className="transition-colors hover:bg-[var(--bg-raised)]"
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)}
                          className="w-3.5 h-3.5 rounded accent-amber-500 cursor-pointer" />
                      </td>
                      <td className="px-5 py-3 cursor-pointer" onClick={() => setSelectedStudent(s)}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                            style={{ backgroundColor: 'var(--accent-blue)', color: '#fff' }}>{initials}</div>
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 cursor-pointer" onClick={() => setSelectedStudent(s)} style={{ color: 'var(--text-secondary)' }}>{s.id}</td>
                      <td className="px-5 py-3 cursor-pointer" onClick={() => setSelectedStudent(s)}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold"
                            style={{ borderColor: attColor(s.percentage), color: attColor(s.percentage) }}>
                            {s.percentage}
                          </div>
                          <span className="text-xs" style={{ color: attColor(s.percentage) }}>{s.percentage}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 cursor-pointer" onClick={() => setSelectedStudent(s)} style={{ color: 'var(--text-secondary)' }}>{s.present}/{s.total}</td>
                      <td className="px-5 py-3 cursor-pointer" onClick={() => setSelectedStudent(s)}><StatusBadge status={s.status} /></td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          <button onClick={e => { e.stopPropagation(); setSelectedStudent(s); }} className="p-1.5 rounded hover:bg-[var(--bg-raised)]" style={{ color: 'var(--text-muted)' }}><Eye className="w-4 h-4" /></button>
                          <button onClick={e => { e.stopPropagation(); addToast('Override saved', 'success'); }} className="p-1.5 rounded hover:bg-[var(--bg-raised)]" style={{ color: 'var(--text-muted)' }}><Pencil className="w-4 h-4" /></button>
                          <button onClick={e => { e.stopPropagation(); addToast('Warning email sent', 'success'); }} className="p-1.5 rounded hover:bg-[var(--bg-raised)]" style={{ color: 'var(--text-muted)' }}><Mail className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="xl:hidden space-y-3">
            {filteredStudents.map(s => {
              const initials = s.name.split(' ').map(n => n[0]).join('');
              return (
                <div key={s.id} className="rounded-[10px] border p-4 transition-colors hover:bg-[var(--bg-raised)]"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: selectedIds.includes(s.id) ? 'var(--accent-primary)' : 'var(--border-subtle)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)}
                        onClick={e => e.stopPropagation()}
                        className="w-4 h-4 rounded accent-amber-500 cursor-pointer flex-shrink-0" />
                      <div onClick={() => setSelectedStudent(s)} className="cursor-pointer flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold"
                          style={{ backgroundColor: 'var(--accent-blue)', color: '#fff' }}>{initials}</div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.id}</p>
                        </div>
                      </div>
                    </div>
                    <span onClick={() => setSelectedStudent(s)} className="text-lg font-semibold cursor-pointer" style={{ color: attColor(s.percentage) }}>{s.percentage}%</span>
                  </div>
                  <div className="flex items-center justify-between" onClick={() => setSelectedStudent(s)} style={{ cursor: 'pointer' }}>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Present: {s.present}/{s.total} sessions</span>
                    <StatusBadge status={s.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => navigate('/session/active')}
              className="h-10 px-4 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
              Start New Session
            </button>
          </div>

          <div className="space-y-3">
            {sessionsCS301.map(s => (
              <div key={s.id} className="rounded-[10px] border p-4 xl:p-5 transition-all hover:bg-[var(--bg-raised)] cursor-pointer"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                onClick={() => setSelectedSession(s)}>
                <div className="flex gap-4">
                  <div className="hidden sm:flex flex-col items-center justify-center w-14">
                    <p className="text-xl font-semibold" style={{ color: 'var(--accent-primary)' }}>
                      {new Date(s.date).getDate()}
                    </p>
                    <p className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>
                      {new Date(s.date).toLocaleString('en-US', { month: 'short' })}
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.time} — {s.endTime}</p>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--accent-green)' }}>✓ {s.present} Present</span>
                      <span style={{ color: 'var(--accent-red)' }}>✗ {s.total - s.present} Absent</span>
                      <span className="font-medium" style={{ color: attColor(s.percentage) }}>{s.percentage}% Rate</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {s.faceScan} via Face Scan, {s.qrCode} via QR Code
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <SessionBarChart sessions={sessionsCS301} threshold={course.threshold} />
          <div className="flex gap-2">
            <button onClick={() => addToast('Generating PDF...', 'info')}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>Export PDF</button>
            <button onClick={() => addToast('Generating Excel...', 'info')}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold border hover:bg-[var(--bg-raised)]"
              style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>Export Excel</button>
          </div>
        </div>
      )}

      {/* Student SlideOver */}
      <SlideOver open={!!selectedStudent} onClose={() => setSelectedStudent(null)} title="Student Details">
        {selectedStudent && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold"
                style={{ backgroundColor: 'var(--accent-blue)', color: '#fff' }}>
                {selectedStudent.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedStudent.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedStudent.id} · {selectedStudent.programme} · {selectedStudent.level}</p>
              </div>
            </div>
            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-raised)' }}>
              <p className="text-3xl font-bold" style={{ color: attColor(selectedStudent.percentage) }}>{selectedStudent.percentage}%</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Overall Attendance</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Attendance History</h4>
              <div className="space-y-2">
                {sessionsCS301.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-deep)' }}>
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{s.label}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.date}</p>
                    </div>
                    <StatusBadge status={Math.random() > 0.3 ? 'completed' : 'ended'} label={Math.random() > 0.3 ? 'Present' : 'Absent'} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SlideOver>

      {/* Session SlideOver */}
      <SlideOver open={!!selectedSession} onClose={() => setSelectedSession(null)} title="Session Details">
        {selectedSession && (
          <div className="space-y-5">
            <div>
              <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedSession.label}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{selectedSession.date} · {selectedSession.time}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-raised)' }}>
                <p className="text-lg font-bold" style={{ color: 'var(--accent-green)' }}>{selectedSession.present}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Present</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-raised)' }}>
                <p className="text-lg font-bold" style={{ color: 'var(--accent-red)' }}>{selectedSession.total - selectedSession.present}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Absent</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-raised)' }}>
                <p className="text-lg font-bold" style={{ color: attColor(selectedSession.percentage) }}>{selectedSession.percentage}%</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Rate</p>
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-raised)' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Method Breakdown</p>
              <div className="flex h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-deep)' }}>
                <div className="h-full" style={{ width: `${(selectedSession.faceScan / selectedSession.present) * 100}%`, backgroundColor: 'var(--accent-blue)' }} />
                <div className="h-full" style={{ width: `${(selectedSession.qrCode / selectedSession.present) * 100}%`, backgroundColor: 'var(--accent-primary)' }} />
              </div>
              <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                <span>{selectedSession.faceScan} Face Scan</span>
                <span>{selectedSession.qrCode} QR Code</span>
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}