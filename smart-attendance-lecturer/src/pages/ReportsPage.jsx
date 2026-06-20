import React, { useState, useEffect, useMemo } from 'react';
import { useAppConfig } from '../context/AppContext';
import { useToast } from '../components/shared/ToastManager';
import { Download, FileText, User, AlertTriangle, Mail, Search, Loader2 } from 'lucide-react';
import SessionBarChart from '../components/charts/SessionBarChart';
import WeeklyTrendChart from '../components/charts/WeeklyTrendChart';
import StatusBadge from '../components/shared/StatusBadge';
import { reportsAPI, coursesAPI } from '../api/dashboardAPI';

export default function ReportsPage() {
  const { config } = useAppConfig();
  const { addToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({ courses: [] });
  const [defaulters, setDefaulters] = useState([]);
  
  // Selections
  const [chartCourseId, setChartCourseId] = useState('');
  const [defaulterCourseId, setDefaulterCourseId] = useState('all');
  
  // Export selections
  const [exportCourseId, setExportCourseId] = useState('');
  const [exportStudentCourseId, setExportStudentCourseId] = useState('');
  const [exportStudentId, setExportStudentId] = useState('');
  const [exportDefaulterCourseId, setExportDefaulterCourseId] = useState('all');
  
  const [studentsForExport, setStudentsForExport] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, defaultersRes] = await Promise.all([
          reportsAPI.getOverview(),
          reportsAPI.getDefaulters('all')
        ]);
        setOverview(overviewRes || { courses: [] });
        setDefaulters(defaultersRes.defaulters || []);
        
        if (overviewRes?.courses?.length > 0) {
          setChartCourseId(overviewRes.courses[0].course.id);
          setExportCourseId(overviewRes.courses[0].course.id);
          setExportStudentCourseId(overviewRes.courses[0].course.id);
        }
      } catch (err) {
        addToast('Failed to load reports data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!exportStudentCourseId) return;
    coursesAPI.getCourseStudents(exportStudentCourseId, { limit: 100 }).then(res => {
      const studentsList = Array.isArray(res) ? res : (res.students || []);
      setStudentsForExport(studentsList);
      if (studentsList.length > 0) setExportStudentId(studentsList[0].student_id);
    }).catch(() => {
      setStudentsForExport([]);
    });
  }, [exportStudentCourseId]);

  useEffect(() => {
    if (loading) return; 
    reportsAPI.getDefaulters(defaulterCourseId).then(res => {
      setDefaulters(res.defaulters || []);
      setSelectedStudents([]);
    });
  }, [defaulterCourseId]);

  const toggleStudent = (id) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkWarning = async () => {
    if (!selectedStudents.length) return;
    try {
      const groups = {};
      selectedStudents.forEach(id => {
        const student = defaulters.find(d => d.student_id === id);
        if (student) {
          if (!groups[student.course_id]) groups[student.course_id] = [];
          groups[student.course_id].push(id);
        }
      });
      
      for (const [cId, sIds] of Object.entries(groups)) {
        await coursesAPI.bulkSendWarnings(cId, { student_ids: sIds });
      }
      
      addToast('Warning emails sent successfully', 'success');
      setSelectedStudents([]);
    } catch (err) {
      addToast('Failed to send some warnings', 'error');
    }
  };

  const activeCourseObj = overview.courses.find(c => c.course.id === chartCourseId);
  const sessionChartData = activeCourseObj?.session_trend || [];
  
  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl xl:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Attendance Reports</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {config.institutionName} · {config.academicYear} — {config.currentSemester}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-[10px] border p-5 flex flex-col" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(59,130,246,0.15)' }}>
            <FileText className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
          </div>
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Course Attendance Report</h3>
          <p className="text-xs mb-3 text-gray-500">Full attendance record for a specific course</p>
          <select value={exportCourseId} onChange={e => setExportCourseId(e.target.value)} className="w-full mb-4 h-9 px-3 rounded-lg text-xs border outline-none" style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}>
            {overview.courses.map(c => <option key={c.course.id} value={c.course.id}>{c.course.code}</option>)}
          </select>
          <div className="flex gap-2 mt-auto">
            <button onClick={() => reportsAPI.downloadCourseReport(exportCourseId, 'pdf').catch(e => addToast(e.message, 'error'))} className="px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--accent-primary)] text-[var(--bg-deep)]">Export PDF</button>
            <button onClick={() => reportsAPI.downloadCourseReport(exportCourseId, 'excel').catch(e => addToast(e.message, 'error'))} className="px-3 py-2 rounded-lg text-xs font-semibold border hover:bg-[var(--bg-raised)] text-[var(--text-primary)] border-[rgba(255,255,255,0.15)]">Export Excel</button>
          </div>
        </div>

        <div className="rounded-[10px] border p-5 flex flex-col" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(139,92,246,0.15)' }}>
            <User className="w-5 h-5" style={{ color: 'var(--accent-purple)' }} />
          </div>
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Per-Student Report</h3>
          <p className="text-xs mb-3 text-gray-500">Individual attendance history across sessions</p>
          <div className="flex gap-2 mb-4">
            <select value={exportStudentCourseId} onChange={e => setExportStudentCourseId(e.target.value)} className="w-1/2 h-9 px-3 rounded-lg text-xs border outline-none" style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}>
              {overview.courses.map(c => <option key={c.course.id} value={c.course.id}>{c.course.code}</option>)}
            </select>
            <select value={exportStudentId} onChange={e => setExportStudentId(e.target.value)} className="w-1/2 h-9 px-3 rounded-lg text-xs border outline-none" style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}>
              {studentsForExport.map(s => <option key={s.student_id} value={s.student_id}>{s.student_name}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-auto">
            <button onClick={() => { if(exportStudentId) reportsAPI.downloadStudentReport(exportStudentCourseId, exportStudentId, 'pdf').catch(e => addToast(e.message, 'error')); else addToast('Select a student first', 'error'); }} className="px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--accent-primary)] text-[var(--bg-deep)]">Export PDF</button>
          </div>
        </div>

        <div className="rounded-[10px] border p-5 flex flex-col" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}>
            <AlertTriangle className="w-5 h-5" style={{ color: 'var(--accent-red)' }} />
          </div>
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Defaulters Report</h3>
          <p className="text-xs mb-3 text-gray-500">All students below the attendance threshold</p>
          <select value={exportDefaulterCourseId} onChange={e => setExportDefaulterCourseId(e.target.value)} className="w-full mb-4 h-9 px-3 rounded-lg text-xs border outline-none" style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}>
            <option value="all">All Courses</option>
            {overview.courses.map(c => <option key={c.course.id} value={c.course.id}>{c.course.code}</option>)}
          </select>
          <div className="flex gap-2 mt-auto">
            <button onClick={() => reportsAPI.downloadDefaultersReport(exportDefaulterCourseId, 'pdf').catch(e => addToast(e.message, 'error'))} className="px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--accent-primary)] text-[var(--bg-deep)]">Export PDF</button>
            <button onClick={() => reportsAPI.downloadDefaultersReport(exportDefaulterCourseId, 'excel').catch(e => addToast(e.message, 'error'))} className="px-3 py-2 rounded-lg text-xs font-semibold border hover:bg-[var(--bg-raised)] text-[var(--text-primary)] border-[rgba(255,255,255,0.15)]">Export Excel</button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Attendance Rate Per Session — {activeCourseObj?.course?.title} ({activeCourseObj?.course?.code})
          </h2>
          <select value={chartCourseId} onChange={e => setChartCourseId(e.target.value)}
            className="h-9 px-3 rounded-lg text-xs border outline-none"
            style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}>
            {overview.courses.map(c => <option key={c.course.id} value={c.course.id}>{c.course.code}</option>)}
          </select>
        </div>
        <SessionBarChart sessions={sessionChartData.map(s => ({
            ...s, 
            label: s.session_label,
            date: s.session_date,
            percentage: s.attendance_pct
        }))} threshold={activeCourseObj?.course?.threshold_pct || 75} />
      </div>

      <WeeklyTrendChart rawCoursesData={overview.courses} />

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>At-Risk Students</h2>
            <span className="w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center bg-[var(--accent-red)] text-white">{defaulters.length}</span>
          </div>
          <select value={defaulterCourseId} onChange={e => setDefaulterCourseId(e.target.value)}
            className="h-9 px-3 rounded-lg text-xs border outline-none"
            style={{ backgroundColor: 'var(--bg-deep)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}>
            <option value="all">All Courses</option>
            {overview.courses.map(c => <option key={c.course.id} value={c.course.id}>{c.course.code}</option>)}
          </select>
        </div>

        {selectedStudents.length > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg mb-3 bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm flex-1 text-[var(--accent-primary)]">
              {selectedStudents.length} students selected
            </p>
            <button onClick={handleBulkWarning}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent-primary)] text-[var(--bg-deep)]">
              Send Warning Emails to All
            </button>
          </div>
        )}

        <div className="hidden xl:block rounded-[10px] border overflow-hidden bg-[var(--bg-surface)] border-[var(--border-subtle)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded" onChange={e => setSelectedStudents(e.target.checked ? defaulters.map(d => d.student_id) : [])} /></th>
                {['Student', 'ID', 'Course', 'Current %', 'Threshold', 'Shortfall', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {defaulters.map(s => (
                <tr key={`${s.course_id}-${s.student_id}`} className="transition-colors hover:bg-[var(--bg-raised)] border-b border-[var(--border-subtle)]">
                  <td className="px-4 py-3">
                    <input type="checkbox" className="rounded" checked={selectedStudents.includes(s.student_id)} onChange={() => toggleStudent(s.student_id)} />
                  </td>
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{s.student_name}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{s.student_number}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{s.course_code}</td>
                  <td className="px-4 py-3 font-medium text-[var(--accent-red)]">{s.current_pct.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{s.threshold_pct}%</td>
                  <td className="px-4 py-3 font-medium text-[var(--accent-red)]">{s.shortfall.toFixed(1)}%</td>
                  <td className="px-4 py-3">
                    <button onClick={() => coursesAPI.bulkSendWarnings(s.course_id, { student_ids: [s.student_id] }).then(() => addToast('Warning sent', 'success')).catch(e => addToast(e.message, 'error'))}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium hover:bg-[var(--bg-raised)] text-[var(--accent-primary)]">
                      <Mail className="w-3 h-3" /> Warn
                    </button>
                  </td>
                </tr>
              ))}
              {defaulters.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                    No at-risk students found for the selected course(s).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="xl:hidden space-y-3">
          {defaulters.map(s => (
            <div key={`${s.course_id}-${s.student_id}`} className="rounded-[10px] border p-4 bg-[var(--bg-surface)] border-[var(--border-subtle)]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-[var(--text-primary)]">{s.student_name}</p>
                <span className="text-sm font-bold text-[var(--accent-red)]">{s.current_pct.toFixed(1)}%</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                <span>{s.student_number}</span>·<span>{s.course_code}</span>·<span className="text-[var(--accent-red)]">Shortfall: {s.shortfall.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center mt-3">
                <StatusBadge status="at-risk" />
                <button onClick={() => coursesAPI.bulkSendWarnings(s.course_id, { student_ids: [s.student_id] }).then(() => addToast('Warning sent', 'success')).catch(e => addToast(e.message, 'error'))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--accent-primary)]">
                  <Mail className="w-3 h-3" /> Send Warning
                </button>
              </div>
            </div>
          ))}
          {defaulters.length === 0 && (
            <div className="p-8 text-center text-sm text-[var(--text-muted)]">No at-risk students found.</div>
          )}
        </div>
      </div>
    </div>
  );
}