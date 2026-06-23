import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, TrendingUp, CheckCircle, AlertTriangle, ScanFace, QrCode, X, ArrowRight, Loader2 } from 'lucide-react';
import { useStudentAuth } from '../context/AuthContext';
import SessionBanner from '../components/attendance/SessionBanner';
import StatCard from '../components/ui/StatCard';
import CourseCard from '../components/dashboard/CourseCard';
import AttendanceTrendChart from '../components/dashboard/AttendanceTrendChart';
import { studentAPI } from '../api/studentAPI';
import { useSocketRefresh } from '../hooks/useSocketRefresh';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const METHOD_ICONS = {
  face: { icon: ScanFace, color: 'var(--accent-purple)' },
  qr: { icon: QrCode, color: 'var(--accent-blue)' },
};

export default function DashboardPage() {
  const { firstName } = useStudentAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [error, setError] = useState('');

  async function load() {
      try {
        setLoading(true);
        const [dashRes, trendRes] = await Promise.all([
          studentAPI.getDashboardData(),
          studentAPI.getAttendanceTrend()
        ]);
        setData(dashRes);
        setTrendData(trendRes.courses);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useSocketRefresh(load);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
        {error}
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const { stats, enrolled_courses, recent_activity } = data;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          {getGreeting()}, {firstName} 👋
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{today}</p>
      </div>

      {/* Live session banner */}
      <SessionBanner liveSession={data.live_session} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard icon={BookOpen} label="Enrolled Courses" value={`${stats.total_courses} Courses`} borderColor="var(--accent-blue)" />
        <StatCard icon={TrendingUp} label="Overall Attendance" value={`${Math.round(stats.overall_avg_pct * 10) / 10}% Average`} borderColor="var(--accent-primary)" />
        <StatCard icon={CheckCircle} label="Sessions Attended" value={`${stats.sessions_attended} of ${stats.sessions_total}`} borderColor="var(--accent-green)" />
        <StatCard icon={AlertTriangle} label="At-Risk Courses" value={`${stats.at_risk_courses} Course${stats.at_risk_courses !== 1 ? 's' : ''}`} borderColor="var(--accent-red)" />
      </div>

      {/* Attendance Insights */}
      {trendData && trendData.length > 0 && (
        <div className="mb-8">
          <AttendanceTrendChart trendData={trendData} />
        </div>
      )}

      {/* My Courses */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>My Courses</h2>
          <button onClick={() => navigate('/courses')}
            className="text-sm font-medium flex items-center gap-1 hover:underline"
            style={{ color: 'var(--accent-primary)' }}>
            View All <ArrowRight size={14} />
          </button>
        </div>
        {enrolled_courses.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>You are not enrolled in any active courses.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolled_courses.map(c => <CourseCard key={c.course_id} course={c} />)}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Activity</h2>
        {recent_activity.length === 0 ? (
          <div className="rounded-xl p-6 text-center text-sm"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
            No recent attendance activity.
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            {recent_activity.map((item, i) => {
              const methodInfo = item.method ? METHOD_ICONS[item.method] : null;
              const MethodIcon = methodInfo?.icon;
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3 transition-colors"
                  style={{ borderBottom: i < recent_activity.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: item.status === 'absent' ? 'rgba(239,68,68,0.12)' : `${methodInfo?.color || 'var(--accent-green)'}15` }}>
                    {item.status === 'absent' ? (
                      <X size={16} style={{ color: 'var(--accent-red)' }} />
                    ) : (
                      MethodIcon && <MethodIcon size={16} style={{ color: methodInfo.color }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.course_title} ({item.course_code})</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {item.method === 'face' ? 'Face Scan' : item.method === 'qr' ? 'QR Code' : item.is_manual_override ? 'Manual Override' : 'Unknown Method'} · {new Date(item.session_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: item.status === 'present' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                      color: item.status === 'present' ? 'var(--accent-green)' : 'var(--accent-red)',
                    }}>
                    <span className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: item.status === 'present' ? 'var(--accent-green)' : 'var(--accent-red)' }} />
                    {item.status === 'present' ? 'Present' : 'Absent'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}