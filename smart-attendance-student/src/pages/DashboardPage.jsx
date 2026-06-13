import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, TrendingUp, CheckCircle, AlertTriangle, ScanFace, QrCode, X, ArrowRight } from 'lucide-react';
import { useStudentAuth } from '../context/AuthContext';
import { useAppConfig } from '../context/AppContext';
import SessionBanner from '../components/attendance/SessionBanner';
import StatCard from '../components/ui/StatCard';
import CourseCard from '../components/dashboard/CourseCard';
import AttendanceTrendChart from '../components/dashboard/AttendanceTrendChart';
import AttendanceCalendar from '../components/dashboard/AttendanceCalendar';
import { COURSES, RECENT_ACTIVITY, WEEKLY_SCHEDULE } from '../data/dummyData';

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

  const totalAttended = COURSES.reduce((s, c) => s + c.attended, 0);
  const totalSessions = COURSES.reduce((s, c) => s + c.total, 0);
  const overallPct = Math.round((totalAttended / totalSessions) * 1000) / 10;
  const atRiskCount = COURSES.filter(c => {
    const pct = (c.attended / c.total) * 100;
    return pct < c.threshold;
  }).length;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

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
      <SessionBanner />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard icon={BookOpen} label="Enrolled Courses" value={`${COURSES.length} Courses`} borderColor="var(--accent-blue)" />
        <StatCard icon={TrendingUp} label="Overall Attendance" value={`${overallPct}% Average`} borderColor="var(--accent-primary)" />
        <StatCard icon={CheckCircle} label="Sessions Attended" value={`${totalAttended} of ${totalSessions}`} borderColor="var(--accent-green)" />
        <StatCard icon={AlertTriangle} label="At-Risk Courses" value={`${atRiskCount} Course${atRiskCount !== 1 ? 's' : ''}`} borderColor="var(--accent-red)" />
      </div>

      {/* Attendance Insights */}
      <div className="mb-8">
        <AttendanceTrendChart />
      </div>

      {/* Calendar */}
      <div className="mb-8">
        <AttendanceCalendar />
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {COURSES.map(c => <CourseCard key={c.id} course={c} />)}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Activity</h2>
        <div className="rounded-xl overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          {RECENT_ACTIVITY.map((item, i) => {
            const methodInfo = item.method ? METHOD_ICONS[item.method] : null;
            const MethodIcon = methodInfo?.icon;
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-3 transition-colors"
                style={{ borderBottom: i < RECENT_ACTIVITY.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: item.status === 'absent' ? 'rgba(239,68,68,0.12)' : `${methodInfo?.color}15` }}>
                  {item.status === 'absent' ? (
                    <X size={16} style={{ color: 'var(--accent-red)' }} />
                  ) : (
                    MethodIcon && <MethodIcon size={16} style={{ color: methodInfo.color }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.courseName}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {item.method === 'face' ? 'Face Scan' : item.method === 'qr' ? 'QR Code' : ''} · {item.date}
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
      </div>

      {/* Weekly Schedule */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>This Week's Classes</h2>
        <div className="space-y-2">
          {WEEKLY_SCHEDULE.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-xl transition-colors"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderLeft: `3px solid ${COURSES.find(c => c.code === item.code)?.color || 'var(--accent-primary)'}`,
              }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {item.day} {item.time}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {item.course} ({item.code})
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.room}</p>
              </div>
              {item.isToday && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: 'var(--accent-green)' }}>
                  Today
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}