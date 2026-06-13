import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLecturerAuth } from '../context/LecturerAuthContext';
import { useAppConfig } from '../context/AppContext';
import { useSession } from '../context/SessionContext';
import { BookOpen, Users, Calendar, AlertTriangle, Radio, BarChart3, Download, ArrowRight } from 'lucide-react';
import StatCard from '../components/shared/StatCard';
import CourseCard from '../components/dashboard/CourseCard';
import RecentSessions from '../components/dashboard/RecentSession';
import AtRiskStudents from '../components/dashboard/AtRiskStudents';
import { courses } from '../data/mockData';
import { useToast } from '../components/shared/ToastManager';

export default function DashboardPage() {
  const { lecturer } = useLecturerAuth();
  const { config } = useAppConfig();
  const { sessionState } = useSession();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl xl:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {greeting}, {lecturer.firstName} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{today}</p>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border"
        style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)' }}>
        <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent-amber)' }} />
        <p className="text-sm flex-1" style={{ color: 'var(--accent-amber)' }}>
          <span className="font-medium">3 students</span> in your courses are below the attendance threshold.
        </p>
        <Link to="/reports" className="flex items-center gap-1 text-xs font-medium flex-shrink-0" style={{ color: 'var(--accent-amber)' }}>
          View at-risk students <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 xl:gap-4">
        <StatCard label="My Courses" value="3" subtitle="Active Courses" icon={BookOpen} borderColor="var(--accent-blue)" />
        <StatCard label="Total Students" value="287" subtitle="Enrolled" icon={Users} borderColor="var(--accent-primary)" />
        <StatCard label="Sessions This Week" value="5" subtitle="Sessions" icon={Calendar} borderColor="var(--accent-green)" trend="+2 from last week" />
        <StatCard label="At-Risk Students" value="8" subtitle="Students" icon={AlertTriangle} borderColor="var(--accent-red)" />
      </div>

      {/* Course Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>My Courses</h2>
          <Link to="/courses" className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} isLive={sessionState === 'active' && course.id === 'CS301'} />
          ))}
        </div>
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-6">
        <div className="xl:col-span-2">
          <RecentSessions />
        </div>
        <div>
          <AtRiskStudents />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: 'Start New Session', icon: Radio, color: 'var(--accent-primary)', path: '/session/active' },
            { label: 'View Reports', icon: BarChart3, color: 'var(--accent-blue)', path: '/reports' },
            { label: 'Export Attendance', icon: Download, color: 'var(--accent-green)', action: () => addToast('Generating export...', 'info') },
            { label: 'View All Students', icon: Users, color: 'var(--accent-purple)', path: '/courses' },
          ].map(action => (
            <button key={action.label}
              onClick={() => action.path ? navigate(action.path) : action.action?.()}
              className="flex flex-col items-center gap-2.5 p-4 xl:p-5 rounded-[10px] border transition-all hover:-translate-y-0.5 hover:bg-[var(--bg-raised)]"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${action.color}15` }}>
                <action.icon className="w-5 h-5" style={{ color: action.color }} />
              </div>
              <span className="text-xs font-medium text-center" style={{ color: 'var(--text-primary)' }}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}