import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, Users, Eye, Pencil, Mail, Loader2, Download, X, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../components/shared/ToastManager';
import StatCard from '../components/shared/StatCard';
import StatusBadge from '../components/shared/StatusBadge';
import SlideOver from '../components/shared/SlideOver';
import SessionBarChart from '../components/charts/SessionBarChart';
import { coursesAPI, sessionsAPI } from '../api/dashboardAPI';
import { useSocketRefresh } from '../hooks/useSocketRefresh';

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('students');
  const [courseDetail, setCourseDetail] = useState(null);
  const [sessionsData, setSessionsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected entities for SlideOvers
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentHistory, setSelectedStudentHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // Bulk action state
  const [selectedIds, setSelectedIds] = useState([]);

  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState(null); // 'present' or 'absent'
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [selectedBulkSessionId, setSelectedBulkSessionId] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [detailRes, historyRes] = await Promise.all([
        coursesAPI.getCourseDetail(id),
        sessionsAPI.getHistory({ courseId: id, limit: 100 })
      ]);
      setCourseDetail(detailRes);
      setSessionsData(historyRes.sessions || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [id]);

  // Re-fetch whenever a global socket update arrives
  useSocketRefresh(fetchAll, [id]);

  const handleBulkWarning = async () => {
    if (!selectedIds.length) return;
    setIsBulkActionLoading(true);
    try {
      await coursesAPI.bulkSendWarnings(id, { student_ids: selectedIds });
      addToast('Warning emails sent successfully', 'success');
      setSelectedIds([]);
    } catch (err) {
      addToast(err.message || 'Failed to send warnings', 'error');
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkOverride = async () => {
    if (!selectedBulkSessionId) {
      addToast('Please select a session', 'error');
      return;
    }
    setIsBulkActionLoading(true);
    try {
      await sessionsAPI.bulkOverrideAttendance(selectedBulkSessionId, {
        student_ids: selectedIds,
        status: bulkActionType,
        reason: 'Bulk manual override from course view'
      });
      addToast(`Marked ${selectedIds.length} students as ${bulkActionType}`, 'success');
      setSessionModalOpen(false);
      setSelectedIds([]);
      fetchAll();
    } catch (err) {
      addToast(err.message || 'Failed to override attendance', 'error');
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const loadStudentHistory = async (student) => {
    setSelectedStudent(student);
    setLoadingHistory(true);
    setSelectedStudentHistory(null);
    try {
      const res = await coursesAPI.getStudentAttendance(id, student.student_id);
      setSelectedStudentHistory(res.records || []);
    } catch (err) {
      addToast('Failed to load student history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const attColor = (pct) => pct >= 75 ? 'var(--accent-green)' : pct >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';

  const filteredStudents = useMemo(() => {
    if (!courseDetail?.enrolled_students) return [];
    return courseDetail.enrolled_students.filter(s => {
      const matchSearch = s.student_name.toLowerCase().includes(search.toLowerCase()) || 
                          s.student_number.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all'
        || (statusFilter === 'above' && s.status === 'good')
        || (statusFilter === 'below' && (s.status === 'at_risk' || s.status === 'defaulter'));
      return matchSearch && matchStatus;
    });
  }, [courseDetail, search, statusFilter]);

  const toggleSelect = (sId) => {
    setSelectedIds(prev => prev.includes(sId) ? prev.filter(i => i !== sId) : [...prev, sId]);
  };
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) setSelectedIds([]);
    else setSelectedIds(filteredStudents.map(s => s.student_id));
  };

  const allSelected = filteredStudents.length > 0 && selectedIds.length === filteredStudents.length;
  const someSelected = selectedIds.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  if (error || !courseDetail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-sm" style={{ color: 'var(--accent-red)' }}>{error || 'Course not found'}</p>
        <button onClick={() => navigate('/courses')}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
          Back to Courses
        </button>
      </div>
    );
  }

  const c = courseDetail;
  const totalEnrolled = c.enrolled_students?.length || 0;
  const belowCount = c.below_threshold_count || 0;
  const aboveCount = totalEnrolled - belowCount;

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
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{c.course_title}</h1>
            <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--accent-primary)' }}>
              {c.course_code}
            </span>
            <StatusBadge status={c.is_active ? 'active' : 'inactive'} />
          </div>
          <div className="flex flex-wrap gap-2 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {[c.programme_code || c.programme_name, `Level ${c.level}`, `Semester ${c.semester_number}`, `${c.credit_hours} Credit Hours`, `Min Threshold: ${c.threshold_pct}%`].map(t => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: 'var(--border-subtle)' }}>
        {[
          { key: 'students', label: 'Students' },
          { key: 'sessions', label: 'Sessions' },
          { key: 'reports', label: 'Reports' },
        ].map(tab => (
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

      {/* ── STUDENTS TAB ── */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard label="Total Enrolled" value={totalEnrolled} borderColor="var(--accent-blue)" icon={Users} />
            <StatCard label="Above Threshold" value={aboveCount} borderColor="var(--accent-green)" />
            <StatCard label="Below Threshold" value={belowCount} borderColor="var(--accent-red)" />
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
              <div className="flex gap-2 ml-auto sm:ml-0">
                <button onClick={() => { setBulkActionType('present'); setSessionModalOpen(true); }}
                  disabled={isBulkActionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}>
                  <CheckCircle className="w-3.5 h-3.5" /> Mark Present
                </button>
                <button onClick={() => { setBulkActionType('absent'); setSessionModalOpen(true); }}
                  disabled={isBulkActionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}>
                  <XCircle className="w-3.5 h-3.5" /> Mark Absent
                </button>
                <button onClick={handleBulkWarning} disabled={isBulkActionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' }}>
                  <Mail className="w-3.5 h-3.5" /> {isBulkActionLoading ? 'Sending...' : 'Send Warning'}
                </button>
              </div>
            </div>
          )}

          {/* Desktop Table */}
          <div className="hidden xl:block rounded-[10px] border overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <th className="w-10 px-3 py-3">
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded cursor-pointer" />
                  </th>
                  {['Student', 'ID', 'Attendance', 'Sessions', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(s => {
                  const initials = s.student_name.split(' ').map(n => n[0]).join('');
                  return (
                    <tr key={s.student_id} className="transition-colors hover:bg-[var(--bg-raised)]"
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.includes(s.student_id)} onChange={() => toggleSelect(s.student_id)}
                          className="w-3.5 h-3.5 rounded cursor-pointer" />
                      </td>
                      <td className="px-5 py-3 cursor-pointer" onClick={() => loadStudentHistory(s)}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                            style={{ backgroundColor: 'var(--accent-blue)', color: '#fff' }}>{initials}</div>
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{s.student_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 cursor-pointer" onClick={() => loadStudentHistory(s)} style={{ color: 'var(--text-secondary)' }}>{s.student_number}</td>
                      <td className="px-5 py-3 cursor-pointer" onClick={() => loadStudentHistory(s)}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold"
                            style={{ borderColor: attColor(s.attendance_pct), color: attColor(s.attendance_pct) }}>
                            {Math.round(s.attendance_pct)}
                          </div>
                          <span className="text-xs" style={{ color: attColor(s.attendance_pct) }}>{s.attendance_pct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 cursor-pointer" onClick={() => loadStudentHistory(s)} style={{ color: 'var(--text-secondary)' }}>{s.sessions_present}/{s.sessions_total}</td>
                      <td className="px-5 py-3 cursor-pointer" onClick={() => loadStudentHistory(s)}>
                        <StatusBadge status={s.status === 'good' ? 'active' : 'inactive'} label={s.status.replace('_', ' ')} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); loadStudentHistory(s); }} className="p-1.5 rounded hover:bg-[var(--bg-raised)]" style={{ color: 'var(--text-muted)' }}><Eye className="w-4 h-4" /></button>
                          <button onClick={(e) => { e.stopPropagation(); addToast('Warning email sent', 'success'); }} className="p-1.5 rounded hover:bg-[var(--bg-raised)]" style={{ color: 'var(--text-muted)' }}><Mail className="w-4 h-4" /></button>
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
              const initials = s.student_name.split(' ').map(n => n[0]).join('');
              return (
                <div key={s.student_id} className="rounded-[10px] border p-4 transition-colors hover:bg-[var(--bg-raised)]"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: selectedIds.includes(s.student_id) ? 'var(--accent-primary)' : 'var(--border-subtle)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <input type="checkbox" checked={selectedIds.includes(s.student_id)} onChange={() => toggleSelect(s.student_id)}
                        onClick={e => e.stopPropagation()}
                        className="w-4 h-4 rounded cursor-pointer flex-shrink-0" />
                      <div onClick={() => loadStudentHistory(s)} className="cursor-pointer flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold"
                          style={{ backgroundColor: 'var(--accent-blue)', color: '#fff' }}>{initials}</div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.student_name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.student_number}</p>
                        </div>
                      </div>
                    </div>
                    <span onClick={() => loadStudentHistory(s)} className="text-lg font-semibold cursor-pointer" style={{ color: attColor(s.attendance_pct) }}>{s.attendance_pct.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between" onClick={() => loadStudentHistory(s)} style={{ cursor: 'pointer' }}>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Present: {s.sessions_present}/{s.sessions_total} sessions</span>
                    <StatusBadge status={s.status === 'good' ? 'active' : 'inactive'} label={s.status.replace('_', ' ')} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SESSIONS TAB ── */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => navigate('/session/active')}
              className="h-10 px-4 rounded-lg text-sm font-semibold transition-colors"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
              Start New Session
            </button>
          </div>

          <div className="space-y-3">
            {sessionsData.length === 0 ? (
              <div className="p-8 text-center rounded-[10px] border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No sessions recorded yet.</p>
              </div>
            ) : (
              sessionsData.map(s => (
                <div key={s.id} className="rounded-[10px] border p-4 xl:p-5 transition-all hover:bg-[var(--bg-raised)] cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                  onClick={() => setSelectedSession(s)}>
                  <div className="flex gap-4">
                    <div className="hidden sm:flex flex-col items-center justify-center w-14">
                      <p className="text-xl font-semibold" style={{ color: 'var(--accent-primary)' }}>
                        {new Date(s.session_date).getDate()}
                      </p>
                      <p className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>
                        {new Date(s.session_date).toLocaleString('en-US', { month: 'short' })}
                      </p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.label || 'Unnamed Session'}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {new Date(s.started_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} — 
                            {s.ended_at ? new Date(s.ended_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Ongoing'}
                          </p>
                        </div>
                        <StatusBadge status={s.is_locked ? 'completed' : (s.is_active ? 'active' : 'inactive')} />
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--accent-green)' }}>✓ {s.present_count} Present</span>
                        <span style={{ color: 'var(--accent-red)' }}>✗ {s.absent_count} Absent</span>
                        <span className="font-medium" style={{ color: attColor(s.attendance_pct) }}>{s.attendance_pct.toFixed(1)}% Rate</span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {s.face_scan_count} via Face Scan, {s.qr_scan_count} via QR Code
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── REPORTS TAB ── */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <SessionBarChart 
            sessions={sessionsData.map(s => ({
              label: s.label || new Date(s.session_date).toLocaleDateString(),
              percentage: s.attendance_pct
            }))} 
            threshold={c.threshold_pct} 
          />
          <div className="flex gap-2">
            <button onClick={() => addToast('Generating PDF...', 'info')}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>Export PDF</button>
            <button onClick={() => addToast('Generating Excel...', 'info')}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold border hover:bg-[var(--bg-raised)]"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>Export Excel</button>
          </div>
        </div>
      )}

      {/* ── SLIDEOVERS ── */}
      
      {/* Student SlideOver */}
      <SlideOver open={!!selectedStudent} onClose={() => setSelectedStudent(null)} title="Student Details">
        {selectedStudent && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold"
                style={{ backgroundColor: 'var(--accent-blue)', color: '#fff' }}>
                {selectedStudent.student_name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedStudent.student_name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedStudent.student_number} · {c.programme_code}</p>
              </div>
            </div>
            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-raised)' }}>
              <p className="text-3xl font-bold" style={{ color: attColor(selectedStudent.attendance_pct) }}>{selectedStudent.attendance_pct.toFixed(1)}%</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Overall Attendance</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Recent Attendance History</h4>
              {loadingHistory ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--accent-primary)' }} /></div>
              ) : selectedStudentHistory?.length > 0 ? (
                <div className="space-y-2">
                  {selectedStudentHistory.slice(-5).reverse().map(rec => (
                    <div key={rec.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-subtle)' }}>
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{rec.session_label}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {new Date(rec.session_date).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={rec.status === 'present' ? 'completed' : 'inactive'} label={rec.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No history found.</p>
              )}
            </div>
          </div>
        )}
      </SlideOver>

      {/* Session SlideOver */}
      <SlideOver open={!!selectedSession} onClose={() => setSelectedSession(null)} title="Session Details">
        {selectedSession && (
          <div className="space-y-5">
            <div>
              <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedSession.label || 'Unnamed Session'}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {new Date(selectedSession.session_date).toLocaleDateString()} · 
                {new Date(selectedSession.started_at).toLocaleTimeString()}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-raised)' }}>
                <p className="text-lg font-bold" style={{ color: 'var(--accent-green)' }}>{selectedSession.present_count}</p>
                <p className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>Present</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-raised)' }}>
                <p className="text-lg font-bold" style={{ color: 'var(--accent-red)' }}>{selectedSession.absent_count}</p>
                <p className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>Absent</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-raised)' }}>
                <p className="text-lg font-bold" style={{ color: attColor(selectedSession.attendance_pct) }}>{selectedSession.attendance_pct.toFixed(1)}%</p>
                <p className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>Rate</p>
              </div>
            </div>
            <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
              <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Method Breakdown</p>
              <div className="flex h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-deep)' }}>
                <div className="h-full" style={{ width: `${selectedSession.present_count ? (selectedSession.face_scan_count / selectedSession.present_count) * 100 : 0}%`, backgroundColor: 'var(--accent-blue)' }} />
                <div className="h-full" style={{ width: `${selectedSession.present_count ? (selectedSession.qr_scan_count / selectedSession.present_count) * 100 : 0}%`, backgroundColor: 'var(--accent-primary)' }} />
              </div>
              <div className="flex justify-between text-[10px] mt-2" style={{ color: 'var(--text-secondary)' }}>
                <span>{selectedSession.face_scan_count} Face Scan</span>
                <span>{selectedSession.qr_scan_count} QR Code</span>
              </div>
            </div>
          </div>
        )}
      </SlideOver>
      {/* Session Select Modal for Bulk Override */}
      {sessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl shadow-2xl p-6" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Select Session for Override</h3>
              <button onClick={() => setSessionModalOpen(false)} className="p-2 rounded-lg hover:bg-[var(--bg-raised)]" style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Choose the session you want to mark these {selectedIds.length} students {bulkActionType} for:
            </p>
            
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {sessionsData.filter(s => s.is_locked).length === 0 ? (
                <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>No completed sessions found for this course.</p>
              ) : (
                sessionsData.filter(s => s.is_locked).map(s => (
                  <label key={s.id} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-[var(--bg-raised)]"
                    style={{ 
                      borderColor: selectedBulkSessionId === s.id ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      backgroundColor: selectedBulkSessionId === s.id ? 'var(--bg-raised)' : 'transparent'
                    }}>
                    <input type="radio" name="sessionSelect" value={s.id} checked={selectedBulkSessionId === s.id} onChange={() => setSelectedBulkSessionId(s.id)}
                      className="w-4 h-4" style={{ accentColor: 'var(--accent-primary)' }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.label || 'Unnamed Session'}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(s.session_date).toLocaleDateString()} · {new Date(s.started_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setSessionModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-[var(--bg-raised)]"
                style={{ color: 'var(--text-secondary)' }}>
                Cancel
              </button>
              <button onClick={handleBulkOverride} disabled={isBulkActionLoading || !selectedBulkSessionId}
                className="px-4 py-2 text-sm font-medium rounded-lg flex items-center justify-center min-w-[120px] disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                {isBulkActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Override'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}