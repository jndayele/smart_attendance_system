import React, { useState, useEffect } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import { useAppConfig } from '@/context/AppContext';
import { useToast } from '@/components/ui-custom/ToastProvider';
import DeptBarChart from '@/components/charts/DeptBarChart';
import PresentAbsentDonut from '@/components/charts/PresentAbsentDonut';
import { Building2, BookOpen, UserCheck, AlertTriangle, Users, Download, Mail, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { reportsAPI, institutionAPI, departmentsAPI, coursesAPI, studentsAPI } from '@/api/api';

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: '#212D42', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ color: '#8B9DC3', fontSize: 12, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: 12 }}>{p.name}: {p.value}%</p>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const { config } = useAppConfig();
  const { addToast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [chartsData, setChartsData] = useState(null);
  const [defaulters, setDefaulters] = useState([]);
  
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch core data and student pages concurrently
      const [chartsRes, defRes, deptRes, crsRes, stuPage1, stuPage2] = await Promise.all([
        institutionAPI.getDashboardCharts(),
        reportsAPI.getDefaulters(),
        departmentsAPI.list({ limit: 100 }),
        coursesAPI.list({ limit: 100 }),
        studentsAPI.list({ page: 1, limit: 100 }),
        studentsAPI.list({ page: 2, limit: 100 }),
      ]);

      setChartsData(chartsRes);
      setDefaulters(defRes.defaulters || []);
      setDepartments(deptRes.departments || []);
      setCourses(crsRes.courses || []);

      const allStudents = [
        ...(stuPage1.students || []),
        ...(stuPage2.students || []),
      ];
      setStudents(allStudents);
    } catch (err) {
      addToast(err.message || 'Failed to load report data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (reportTitle, downloadFn, format, requiresId, selectedId) => {
    if (requiresId && !selectedId) {
      addToast(`Please select a ${requiresId} first`, 'warning');
      return;
    }
    
    try {
      setDownloadingReport(`${reportTitle}-${format}`);
      addToast(`Generating ${format} report...`, 'info');
      await downloadFn(format, selectedId);
      addToast('Report downloaded successfully', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to download report', 'error');
    } finally {
      setDownloadingReport(null);
    }
  };

  const handleSendWarnings = async () => {
    try {
      setIsSendingEmails(true);
      const res = await reportsAPI.sendThresholdWarnings();
      addToast(`Emails queued for ${res.students_notified || res.emails_sent} students`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to send warnings', 'error');
    } finally {
      setIsSendingEmails(false);
    }
  };

  const getStatusColor = (s) => s === 'Critical' ? '#EF4444' : s === 'Warning' ? '#F59E0B' : '#3B82F6';

  const reportCards = [
    { 
      id: 'institution',
      title: 'Institution-wide Attendance', 
      desc: 'Overall attendance summary across all departments', 
      icon: Building2,
      download: (format) => reportsAPI.downloadInstitutionReport(format)
    },
    { 
      id: 'department',
      title: 'Per-Department Report', 
      desc: 'Detailed breakdown by department', 
      icon: Building2,
      requiresId: 'department',
      value: selectedDeptId,
      onChange: setSelectedDeptId,
      options: departments.map(d => ({ value: d.id, label: d.name })),
      placeholder: 'Select Department...',
      download: (format, id) => reportsAPI.downloadDepartmentReport(id, format)
    },
    { 
      id: 'course',
      title: 'Per-Course Report', 
      desc: 'Attendance data for individual courses', 
      icon: BookOpen,
      requiresId: 'course',
      value: selectedCourseId,
      onChange: setSelectedCourseId,
      options: courses.map(c => ({ value: c.id, label: `${c.code} — ${c.title}` })),
      placeholder: 'Select Course...',
      download: (format, id) => reportsAPI.downloadCourseReport(id, format)
    },
    { 
      id: 'student',
      title: 'Per-Student Report', 
      desc: 'Individual student attendance records', 
      icon: UserCheck,
      requiresId: 'student',
      value: selectedStudentId,
      onChange: setSelectedStudentId,
      options: students.map(s => ({ value: s.id, label: `${s.student_id} — ${s.name}` })),
      placeholder: 'Select Student...',
      download: (format, id) => reportsAPI.downloadStudentReport(id, format),
      disableExcel: true
    },
    { 
      id: 'defaulters',
      title: 'Defaulters Report', 
      desc: 'Students below attendance threshold', 
      icon: AlertTriangle,
      download: (format) => reportsAPI.downloadDefaultersReport(format)
    },
    { 
      id: 'lecturers',
      title: 'Lecturer Activity', 
      desc: 'Session conduct and engagement metrics', 
      icon: Users,
      download: (format) => reportsAPI.downloadLecturerActivityReport(format)
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <TopHeader title="Reports & Analytics" breadcrumbs={['Home', 'Reports']} />
        <div className="flex-1 flex items-center justify-center bg-[var(--bg-deep)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
        </div>
      </div>
    );
  }

  const { weekly_attendance_trend = [], attendance_by_department = [], present_absent_today = { present: 0, absent: 0 }, lowest_attendance_courses = [] } = chartsData || {};

  return (
    <div className="flex flex-col h-full">
      <TopHeader title="Reports & Analytics" breadcrumbs={['Home', 'Reports']} />
      <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: 'var(--bg-deep)' }}>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          {config.institutionName} · {config.academicYear} — {config.currentSemester}
        </p>

        {/* Generate Reports */}
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Generate Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
          {reportCards.map(r => (
            <div key={r.title} className="rounded-xl p-5 flex flex-col justify-between" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                    <r.icon size={18} style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{r.desc}</p>
                  </div>
                </div>
                
                {r.requiresId && (
                  <div className="mb-4">
                    <select
                      value={r.value}
                      onChange={(e) => r.onChange(e.target.value)}
                      className="w-full bg-[var(--bg-deep)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    >
                      <option value="">{r.placeholder}</option>
                      {r.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-auto">
                <button 
                  onClick={() => handleExport(r.title, r.download, 'PDF', r.requiresId, r.value)} 
                  disabled={downloadingReport === `${r.title}-PDF`}
                  className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50" 
                  style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}
                >
                  {downloadingReport === `${r.title}-PDF` ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} PDF
                </button>
                {!r.disableExcel && (
                  <button 
                    onClick={() => handleExport(r.title, r.download, 'Excel', r.requiresId, r.value)} 
                    disabled={downloadingReport === `${r.title}-Excel`}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50" 
                    style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}
                  >
                    {downloadingReport === `${r.title}-Excel` ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} Excel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Live Analytics */}
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Live Analytics</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <DeptBarChart data={attendance_by_department} />
          <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Weekly Trends (Avg Attendance)</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weekly_attendance_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fill: '#4A5C80', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#4A5C80', fontSize: 11 }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#8B9DC3' }} />
                <Line type="monotone" dataKey="attendance_pct" name="Institution Avg" stroke="var(--accent-primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
          <PresentAbsentDonut present={present_absent_today.present} absent={present_absent_today.absent} />
          <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Top 10 Courses — Lowest Attendance</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {['Course', 'Programme', 'Avg %', 'Status'].map(h => (
                      <th key={h} className="text-left text-xs font-medium pb-2 pr-3" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lowest_attendance_courses.length === 0 ? (
                    <tr><td colSpan="4" className="py-4 text-center text-xs text-[var(--text-muted)]">No data available</td></tr>
                  ) : lowest_attendance_courses.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td className="py-2 pr-3 text-sm" style={{ color: 'var(--text-primary)' }}>{c.course}</td>
                      <td className="py-2 pr-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{c.programme}</td>
                      <td className="py-2 pr-3 text-sm font-medium" style={{ color: getStatusColor(c.status) }}>{c.rate}%</td>
                      <td className="py-2">
                        <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: `${getStatusColor(c.status)}15`, color: getStatusColor(c.status) }}>{c.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Defaulters */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Students Below Attendance Threshold</h3>
          <button 
            onClick={handleSendWarnings} 
            disabled={isSendingEmails}
            className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50" 
            style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}
          >
            {isSendingEmails ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />} 
            {isSendingEmails ? 'Sending...' : 'Send Warning Emails to All'}
          </button>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-raised)' }}>
                  {['Student', 'ID', 'Course', 'Programme', 'Current %', 'Threshold', 'Shortfall', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs font-medium px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {defaulters.length === 0 ? (
                  <tr><td colSpan="8" className="py-8 text-center text-sm text-[var(--text-muted)]">No students currently below their attendance thresholds.</td></tr>
                ) : defaulters.map((d, i) => (
                  <tr key={i} className={`${i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{d.student_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{d.student_number}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{d.course_code}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{d.programme_name}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: getStatusColor('Warning') }}>{d.current_pct.toFixed(1)}%</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{d.threshold_pct}%</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: 'var(--accent-red)' }}>-{d.shortfall.toFixed(1)}%</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: `${getStatusColor('Warning')}15`, color: getStatusColor('Warning') }}>Warning</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}