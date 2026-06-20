import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLecturerAuth } from '../context/LecturerAuthContext';
import { useAppConfig } from '../context/AppContext';
import {
  BookOpen, Users, Calendar, AlertTriangle, Radio,
  BarChart3, Download, ArrowRight, RefreshCw, Loader2,
} from 'lucide-react';
import StatCard from '../components/shared/StatCard';
import CourseCard from '../components/dashboard/CourseCard';
import RecentSessions from '../components/dashboard/RecentSession';
import AtRiskStudents from '../components/dashboard/AtRiskStudents';
import { useToast } from '../components/shared/ToastManager';
import { dashboardAPI } from '../api/dashboardAPI';

// ── helpers ─────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function getToday() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// Get the first name from a full name
function getFirstName(fullName = '') {
  return fullName.split(' ')[0] || fullName;
}

// ── Skeleton shimmer ─────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ backgroundColor: 'var(--bg-raised)' }}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 xl:gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-60" />)}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { lecturer } = useLecturerAuth();
  const { config } = useAppConfig();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await dashboardAPI.getDashboard();
      setData(res);
      setError('');
      if (isManual) addToast('Dashboard refreshed', 'success');
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  // Initial load
  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchDashboard(), 60_000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <p className="text-sm" style={{ color: 'var(--accent-red)' }}>{error}</p>
        <button
          onClick={() => fetchDashboard(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
          Retry
        </button>
      </div>
    );
  }

  const { stats, courses, recent_sessions, at_risk_students, lecturer_name } = data || {};
  const displayName = getFirstName(lecturer_name || lecturer.lecturerName || '');

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl xl:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {getGreeting()}, {displayName} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{getToday()}</p>
        </div>
        <button
          onClick={() => fetchDashboard(true)}
          disabled={refreshing}
          className="self-start xl:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors hover:bg-[var(--bg-raised)] disabled:opacity-50"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
          {refreshing
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <RefreshCw className="w-3.5 h-3.5" />}
          Refresh
        </button>
      </div>

      {/* ── Alert Banner (only if there are at-risk students) ── */}
      {stats?.at_risk_count > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border"
          style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent-amber)' }} />
          <p className="text-sm flex-1" style={{ color: 'var(--accent-amber)' }}>
            <span className="font-medium">{stats.at_risk_count} student{stats.at_risk_count > 1 ? 's' : ''}</span> in your courses {stats.at_risk_count > 1 ? 'are' : 'is'} below the attendance threshold.
          </p>
          <Link
            to="/reports"
            className="flex items-center gap-1 text-xs font-medium flex-shrink-0"
            style={{ color: 'var(--accent-amber)' }}>
            View at-risk students <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 xl:gap-4">
        <StatCard
          label="My Courses"
          value={stats?.total_courses ?? 0}
          subtitle="Active Courses"
          icon={BookOpen}
          borderColor="var(--accent-blue)"
        />
        <StatCard
          label="Total Students"
          value={stats?.total_students ?? 0}
          subtitle="Enrolled"
          icon={Users}
          borderColor="var(--accent-primary)"
        />
        <StatCard
          label="Sessions This Week"
          value={stats?.sessions_this_week ?? 0}
          subtitle="Sessions"
          icon={Calendar}
          borderColor="var(--accent-green)"
          trend={stats?.sessions_this_week > 0 ? `${stats.sessions_this_week} this week` : undefined}
        />
        <StatCard
          label="At-Risk Students"
          value={stats?.at_risk_count ?? 0}
          subtitle="Students"
          icon={AlertTriangle}
          borderColor="var(--accent-red)"
        />
      </div>

      {/* ── Course Cards ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>My Courses</h2>
          <Link to="/courses" className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {courses.map((course, idx) => (
              <CourseCard key={course.course_id} course={course} index={idx} />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-[10px] border text-center"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            <BookOpen className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No courses assigned yet.</p>
          </div>
        )}
      </div>

      {/* ── Recent Sessions + At-Risk ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-6">
        <div className="xl:col-span-2">
          <RecentSessions sessions={recent_sessions ?? []} />
        </div>
        <div>
          <AtRiskStudents
            students={at_risk_students ?? []}
            totalAtRisk={stats?.at_risk_count ?? 0}
          />
        </div>
      </div>

      {/* ── Quick Actions ── */}
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
              <span className="text-xs font-medium text-center" style={{ color: 'var(--text-primary)' }}>
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}