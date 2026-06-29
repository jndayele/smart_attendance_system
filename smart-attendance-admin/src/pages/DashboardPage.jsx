import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppConfig } from '@/context/AppContext';
import { useSocket } from '@/context/SocketContext';
import { useSocketRefresh } from '@/hooks/useSocketRefresh';
import TopHeader from '@/components/layout/TopHeader';
import StatCard from '@/components/ui-custom/StatCards';
import AttendanceTrendChart from '@/components/charts/AttendanceTrendChart';
import PresentAbsentDonut from '@/components/charts/PresentAbsentDonut';
import DeptBarChart from '@/components/charts/DeptBarChart';
import { academicYearsAPI, institutionAPI } from '@/api/api';
import {
  Users, UserCheck, BookOpen, Building2, Clock, AlertTriangle,
  Plus, BarChart3, UserPlus, FileText, Zap, CheckCircle, Calendar, X
} from 'lucide-react';

const quickActions = [
  { label: 'Add Lecturer', desc: 'Invite a new lecturer', icon: UserPlus, path: '/lecturers', action: 'addLecturer' },
  { label: 'Add Student', desc: 'Register a new student', icon: Plus, path: '/students', action: 'addStudent' },
  { label: 'Create Course', desc: 'Set up a new course', icon: BookOpen, path: '/courses', action: 'addCourse' },
  { label: 'View Reports', desc: 'Analytics & exports', icon: BarChart3, path: '/reports' },
];

export default function DashboardPage() {
  const { config } = useAppConfig();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [showAcadBanner, setShowAcadBanner] = useState(false);
  
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [statsData, chartsData] = await Promise.all([
        institutionAPI.getDashboardStats(),
        institutionAPI.getDashboardCharts()
      ]);
      setStats(statsData);
      setCharts(chartsData);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Check if an academic year has been set up
    const dismissed = sessionStorage.getItem('acad_banner_dismissed');
    if (!dismissed) {
      academicYearsAPI.list().then(res => {
        if (!res.academic_years || res.academic_years.length === 0) {
          setShowAcadBanner(true);
        }
      }).catch(() => {});
    }
  }, []);

  // Auto-refresh data when global events (like attendance marked) happen
  useSocketRefresh(() => {
    fetchDashboardData();
  }, []);

  const dismissBanner = () => {
    setShowAcadBanner(false);
    sessionStorage.setItem('acad_banner_dismissed', '1');
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col h-full">
      <TopHeader title="Dashboard" breadcrumbs={['Home', 'Dashboard']} />
      <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: 'var(--bg-deep)' }}>

        {/* Academic Year setup prompt banner */}
        {showAcadBanner && (
          <div className="rounded-xl p-4 mb-6 flex items-center justify-between gap-4" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div className="flex items-center gap-3">
              <Calendar size={20} style={{ color: '#F59E0B' }} className="shrink-0" />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No Academic Year set up yet</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Set up your academic year and semesters to unlock course creation and attendance tracking.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate('/academic-years')}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: '#F59E0B', color: '#000' }}
              >
                Set Up Now
              </button>
              <button onClick={dismissBanner} className="p-1.5 rounded hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {greeting}, {config.userName || 'Admin'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {today} · {config.institutionName}
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <StatCard label="Total Students" value={stats?.total_students || 0} trend={stats?.total_students_trend} trendUp={stats?.total_students_trend?.includes('+')} icon={Users} borderColor="var(--accent-primary)" />
          <StatCard label="Total Lecturers" value={stats?.total_lecturers || 0} trend={stats?.total_lecturers_trend} trendUp={stats?.total_lecturers_trend?.includes('+')} icon={UserCheck} borderColor="#3B82F6" />
          <StatCard label="Active Courses" value={stats?.active_courses || 0} trend="no change" icon={BookOpen} borderColor="#10B981" />
          <StatCard label="Departments" value={stats?.total_departments || 0} trend="no change" icon={Building2} borderColor="#8B5CF6" />
          <StatCard label="Sessions Today" value={stats?.sessions_today || 0} trend={stats?.sessions_today_trend} trendUp={stats?.sessions_today_trend?.includes('+')} icon={Clock} borderColor="var(--accent-primary)" />
          <StatCard label="Below Threshold" value={stats?.students_below_threshold || 0} trend={stats?.students_below_threshold_trend} trendUp={false} icon={AlertTriangle} borderColor="#EF4444" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <AttendanceTrendChart data={charts?.weekly_attendance_trend || []} />
          </div>
          <PresentAbsentDonut present={charts?.present_absent_today?.present || 0} absent={charts?.present_absent_today?.absent || 0} />
        </div>

        {/* Dept bar + Low courses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <DeptBarChart data={charts?.attendance_by_department || []} />
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
                  {(charts?.lowest_attendance_courses || []).slice(0, 5).map((c, i) => (
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
                  {(!charts?.lowest_attendance_courses || charts.lowest_attendance_courses.length === 0) && (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No courses below threshold</td>
                    </tr>
                  )}
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
              {(stats?.recent_activity || []).map((a, i) => {
                let color = '#3B82F6';
                if (a.action.includes('start') || a.action.includes('create')) color = '#10B981';
                else if (a.action.includes('delete') || a.action.includes('alert')) color = '#EF4444';
                else if (a.action.includes('update')) color = 'var(--accent-primary)';
                
                const date = new Date(a.created_at);
                const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{a.details?.message || a.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{timeStr}</p>
                    </div>
                  </div>
                );
              })}
              {(!stats?.recent_activity || stats.recent_activity.length === 0) && (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No recent activity</p>
              )}
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