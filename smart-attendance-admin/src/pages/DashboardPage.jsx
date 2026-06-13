import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppConfig } from '@/context/AppContext';
import TopHeader from '@/components/layout/TopHeader';
import StatCard from '@/components/ui-custom/StatCard';
import AttendanceTrendChart from '@/components/charts/AttendanceTrendChart';
import PresentAbsentDonut from '@/components/charts/PresentAbsentDonut';
import DeptBarChart from '@/components/charts/DeptBarChart';
import {
  Users, UserCheck, BookOpen, Building2, Clock, AlertTriangle,
  Plus, BarChart3, UserPlus, FileText, Zap, CheckCircle
} from 'lucide-react';

const activityFeed = [
  { type: 'student_registered', text: 'Kwame Asante registered via face enrollment', time: '2 min ago', color: '#10B981' },
  { type: 'session_started', text: 'CS301 attendance session started by Dr. Ama Owusu', time: '15 min ago', color: 'var(--accent-primary)' },
  { type: 'threshold_alert', text: 'Kweku Boateng fell below 60% in CS401', time: '1 hr ago', color: '#EF4444' },
  { type: 'report_exported', text: 'Department attendance report exported as PDF', time: '2 hrs ago', color: '#3B82F6' },
  { type: 'lecturer_added', text: 'Dr. Kweku Boateng added to Computer Science', time: '3 hrs ago', color: '#8B5CF6' },
  { type: 'session_started', text: 'EE201 attendance session started by Dr. Kofi Asante', time: '4 hrs ago', color: 'var(--accent-primary)' },
  { type: 'student_registered', text: 'Ama Boateng completed face registration', time: '5 hrs ago', color: '#10B981' },
  { type: 'threshold_alert', text: 'Adwoa Asiedu approaching threshold in BA201', time: '6 hrs ago', color: '#EF4444' },
];

const lowCourses = [
  { course: 'PH301 — Organic Chemistry', programme: 'BSc Pharmacy', rate: 68, status: 'Warning' },
  { course: 'BA201 — Marketing Mgmt', programme: 'BBA Business Admin', rate: 71, status: 'Warning' },
  { course: 'EE201 — Digital Circuits', programme: 'BSc Elec. Engineering', rate: 74, status: 'Warning' },
  { course: 'CS401 — Algorithms', programme: 'BSc Computer Science', rate: 76, status: 'Approaching' },
  { course: 'CE301 — Fluid Mechanics', programme: 'BSc Civil Engineering', rate: 78, status: 'Approaching' },
];

const quickActions = [
  { label: 'Add Lecturer', desc: 'Invite a new lecturer', icon: UserPlus, path: '/lecturers', action: 'addLecturer' },
  { label: 'Add Student', desc: 'Register a new student', icon: Plus, path: '/students', action: 'addStudent' },
  { label: 'Create Course', desc: 'Set up a new course', icon: BookOpen, path: '/courses', action: 'addCourse' },
  { label: 'View Reports', desc: 'Analytics & exports', icon: BarChart3, path: '/reports' },
];

export default function DashboardPage() {
  const { config } = useAppConfig();
  const navigate = useNavigate();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col h-full">
      <TopHeader title="Dashboard" breadcrumbs={['Home', 'Dashboard']} />
      <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: 'var(--bg-deep)' }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {greeting}, {config.adminName || 'Admin'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {today} · {config.institutionName}
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <StatCard label="Total Students" value="1,247" trend="+4 this week" trendUp={true} icon={Users} borderColor="var(--accent-primary)" />
          <StatCard label="Total Lecturers" value="48" trend="+1 this week" trendUp={true} icon={UserCheck} borderColor="#3B82F6" />
          <StatCard label="Active Courses" value="32" trend="no change" icon={BookOpen} borderColor="#10B981" />
          <StatCard label="Departments" value="5" trend="no change" icon={Building2} borderColor="#8B5CF6" />
          <StatCard label="Sessions Today" value="7" trend="+2 today" trendUp={true} icon={Clock} borderColor="var(--accent-primary)" />
          <StatCard label="Below Threshold" value="63" trend="-3 this week" trendUp={false} icon={AlertTriangle} borderColor="#EF4444" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <AttendanceTrendChart />
          </div>
          <PresentAbsentDonut />
        </div>

        {/* Dept bar + Low courses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <DeptBarChart />
          <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Top 5 Courses with Lowest Attendance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {['Course', 'Programme', 'Rate', 'Status'].map(h => (
                      <th key={h} className="text-left text-xs font-medium pb-3 pr-4" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lowCourses.map((c, i) => (
                    <tr key={i} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td className="py-2.5 pr-4 text-sm" style={{ color: 'var(--text-primary)' }}>{c.course}</td>
                      <td className="py-2.5 pr-4 text-xs" style={{ color: 'var(--text-secondary)' }}>{c.programme}</td>
                      <td className="py-2.5 pr-4 text-sm font-medium" style={{ color: c.rate < 75 ? '#EF4444' : '#F59E0B' }}>{c.rate}%</td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs" style={{
                          backgroundColor: c.status === 'Warning' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                          color: c.status === 'Warning' ? '#EF4444' : '#F59E0B',
                        }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.status === 'Warning' ? '#EF4444' : '#F59E0B' }} />
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Activity + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Activity Feed */}
          <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
            <div className="space-y-3">
              {activityFeed.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{a.text}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(qa => (
                <button
                  key={qa.label}
                  onClick={() => navigate(qa.path)}
                  className="p-4 rounded-xl text-left transition-all hover:-translate-y-0.5"
                  style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}
                >
                  <qa.icon size={20} style={{ color: 'var(--accent-primary)' }} className="mb-2" />
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{qa.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{qa.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}