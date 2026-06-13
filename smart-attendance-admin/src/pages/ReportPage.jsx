import React, { useState } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import { useAppConfig } from '@/context/AppContext';
import { useToast } from '@/components/ui-custom/ToastProvider';
import DeptBarChart from '@/components/charts/DeptBarChart';
import PresentAbsentDonut from '@/components/charts/PresentAbsentDonut';
import { FileText, Building2, BookOpen, UserCheck, AlertTriangle, Users, Download, Mail, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const reportCards = [
  { title: 'Institution-wide Attendance', desc: 'Overall attendance summary across all departments', icon: Building2 },
  { title: 'Per-Department Report', desc: 'Detailed breakdown by department', icon: Building2 },
  { title: 'Per-Course Report', desc: 'Attendance data for individual courses', icon: BookOpen },
  { title: 'Per-Student Report', desc: 'Individual student attendance records', icon: UserCheck },
  { title: 'Defaulters Report', desc: 'Students below attendance threshold', icon: AlertTriangle },
  { title: 'Lecturer Activity', desc: 'Session conduct and engagement metrics', icon: Users },
];

const weeklyTrend = [
  { week: 'Wk1', cs: 85, ee: 78, ce: 82, ba: 71, ph: 68 },
  { week: 'Wk2', cs: 82, ee: 80, ce: 79, ba: 73, ph: 65 },
  { week: 'Wk3', cs: 88, ee: 76, ce: 84, ba: 70, ph: 72 },
  { week: 'Wk4', cs: 84, ee: 82, ce: 81, ba: 68, ph: 69 },
  { week: 'Wk5', cs: 90, ee: 79, ce: 86, ba: 74, ph: 71 },
  { week: 'Wk6', cs: 87, ee: 84, ce: 83, ba: 72, ph: 67 },
];

const lowestCourses = [
  { course: 'PH301', name: 'Organic Chemistry', programme: 'BSPH', enrolled: 103, rate: 68, status: 'Critical' },
  { course: 'BA201', name: 'Marketing Mgmt', programme: 'BBA', enrolled: 89, rate: 71, status: 'Warning' },
  { course: 'EE201', name: 'Digital Circuits', programme: 'BSEE', enrolled: 124, rate: 74, status: 'Warning' },
  { course: 'CS401', name: 'Algorithms', programme: 'BSCS', enrolled: 98, rate: 76, status: 'Approaching' },
  { course: 'CE301', name: 'Fluid Mechanics', programme: 'BSCE', enrolled: 87, rate: 78, status: 'Approaching' },
];

const defaulters = [
  { name: 'Kweku Boateng', sid: 'STU-0007', course: 'CS401', programme: 'BSCS', current: 55, threshold: 80, shortfall: 25, status: 'Critical' },
  { name: 'Kwame Asante', sid: 'STU-0001', course: 'CS301', programme: 'BSCS', current: 68, threshold: 75, shortfall: 7, status: 'Warning' },
  { name: 'Akua Darko', sid: 'STU-0004', course: 'BA201', programme: 'BBA', current: 71, threshold: 75, shortfall: 4, status: 'Warning' },
  { name: 'Adwoa Asiedu', sid: 'STU-0008', course: 'BA201', programme: 'BBA', current: 74, threshold: 75, shortfall: 1, status: 'Approaching' },
];

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
  const [filterCourse, setFilterCourse] = useState('');
  const [filterDept, setFilterDept] = useState('');

  const handleExport = (type) => addToast(`Generating ${type} report... This may take a moment.`, 'info');

  const getStatusColor = (s) => s === 'Critical' ? '#EF4444' : s === 'Warning' ? '#F59E0B' : '#3B82F6';

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
            <div key={r.title} className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                  <r.icon size={18} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{r.desc}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleExport('PDF')} className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                  <Download size={12} /> PDF
                </button>
                <button onClick={() => handleExport('Excel')} className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
                  <Download size={12} /> Excel
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Live Analytics */}
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Live Analytics</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <DeptBarChart />
          <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Weekly Trends by Department</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fill: '#4A5C80', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[50, 100]} tick={{ fill: '#4A5C80', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#8B9DC3' }} />
                <Line type="monotone" dataKey="cs" name="Comp Sci" stroke="var(--accent-primary)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ee" name="Elec Eng" stroke="#3B82F6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ce" name="Civil Eng" stroke="#10B981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ba" name="Business" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ph" name="Pharmacy" stroke="#EF4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
          <PresentAbsentDonut />
          <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Top 10 Courses — Lowest Attendance</h4>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Course', 'Programme', 'Enrolled', 'Avg %', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs font-medium pb-2 pr-3" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lowestCourses.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="py-2 pr-3 text-sm" style={{ color: 'var(--text-primary)' }}>{c.course}</td>
                    <td className="py-2 pr-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{c.programme}</td>
                    <td className="py-2 pr-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{c.enrolled}</td>
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

        {/* Defaulters */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Students Below Attendance Threshold</h3>
          <button onClick={() => addToast('Warning emails queued for all defaulters', 'info')} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            <Mail size={14} /> Send Warning Emails to All
          </button>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-raised)' }}>
                {['Student', 'ID', 'Course', 'Programme', 'Current %', 'Threshold', 'Shortfall', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-medium px-4 py-3" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {defaulters.map((d, i) => (
                <tr key={i} className={`${i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{d.name}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{d.sid}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{d.course}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{d.programme}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: getStatusColor(d.status) }}>{d.current}%</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{d.threshold}%</td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--accent-red)' }}>-{d.shortfall}%</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: `${getStatusColor(d.status)}15`, color: getStatusColor(d.status) }}>{d.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}