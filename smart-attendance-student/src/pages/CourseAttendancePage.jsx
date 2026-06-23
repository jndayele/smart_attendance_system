import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ScanFace, QrCode, AlertTriangle, Check, Info, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, BarChart, Bar,
} from 'recharts';
import CircularProgress from '../components/ui/CircularProgress';
import { studentAPI } from '../api/studentAPI';
import { useSocket } from '../context/SocketContext';

const METHOD_CONFIG = {
  face: { icon: ScanFace, label: 'Face Scan', color: 'var(--accent-purple)' },
  qr: { icon: QrCode, label: 'QR Code', color: 'var(--accent-blue)' },
};

const STATUS_CONFIG = {
  good: { label: 'Good Standing', color: 'var(--accent-green)' },
  at_risk: { label: 'At Risk', color: 'var(--accent-amber)' },
  defaulter: { label: 'Defaulter', color: 'var(--accent-red)' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (timeStr) => {
  if (!timeStr) return null;
  return new Date(timeStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const getDayName = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
};

const getWeekLabel = (dateStr, sessions) => {
  if (!dateStr) return '—';
  // Find the index of this session among all sessions sorted by date to assign a week number
  const sortedDates = [...sessions].sort((a, b) => new Date(a.session_date) - new Date(b.session_date));
  const idx = sortedDates.findIndex(s => s.session_id === sessions.find(x => x.session_date === dateStr)?.session_id);
  return idx >= 0 ? `Week ${idx + 1}` : '—';
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="px-3 py-2 rounded-lg text-xs shadow-lg"
      style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
      <p style={{ color: 'var(--text-primary)' }}>{d.week}: {d.present}/{d.total} attended ({d.pct}%)</p>
    </div>
  );
}

export default function CourseAttendancePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  // Real-time: invalidate this course's data when attendance is updated
  useEffect(() => {
    if (!socket) return;
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['courseDetails', id] });
    socket.on('global_update', refresh);
    return () => socket.off('global_update', refresh);
  }, [socket, queryClient, id]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['courseDetails', id],
    queryFn: () => studentAPI.getCourseDetails(id),
    enabled: !!id,
  });

  const course = data?.course;
  const summary = data?.attendance_summary;
  const sessions = data?.sessions || [];
  const warningMsg = data?.warning_message;

  const pct = Math.round(summary?.attendance_pct || 0);
  const status = summary?.status || 'good';
  const { label: statusLabel, color: statusColor } = STATUS_CONFIG[status] || STATUS_CONFIG.good;

  // Build filtered & sorted session records (only locked sessions)
  const lockedSessions = sessions.filter(s => s.is_locked || s.student_status === 'absent' || s.student_status === 'present');

  const filteredRecords = useMemo(() => {
    let list = lockedSessions.filter(s =>
      statusFilter === 'all' || s.student_status === statusFilter
    );
    if (sortOrder === 'oldest') {
      list = [...list].sort((a, b) => new Date(a.session_date) - new Date(b.session_date));
    } else {
      list = [...list].sort((a, b) => new Date(b.session_date) - new Date(a.session_date));
    }
    return list;
  }, [lockedSessions, statusFilter, sortOrder]);

  // Build weekly timeline data for chart
  const timelineData = useMemo(() => {
    const sortedSessions = [...lockedSessions].sort((a, b) => new Date(a.session_date) - new Date(b.session_date));
    const weekMap = {};
    sortedSessions.forEach((s, idx) => {
      const weekLabel = `Wk ${idx + 1}`;
      if (!weekMap[weekLabel]) weekMap[weekLabel] = { week: weekLabel, present: 0, total: 0 };
      weekMap[weekLabel].total += 1;
      if (s.student_status === 'present') weekMap[weekLabel].present += 1;
    });
    return Object.values(weekMap).map(w => ({ ...w, pct: w.total ? Math.round((w.present / w.total) * 100) : 0 }));
  }, [lockedSessions]);

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="animate-spin" size={36} style={{ color: 'var(--text-muted)' }} />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="max-w-4xl mx-auto py-10 text-center rounded-xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px dashed var(--border-subtle)' }}>
        <p className="text-sm" style={{ color: 'var(--accent-red)' }}>Failed to load course details.</p>
      </div>
    );
  }

  const presentCount = summary?.sessions_present || 0;
  const absentCount = (summary?.sessions_total || 0) - presentCount;
  const threshold = course?.threshold_pct || summary?.threshold_pct || 75;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/courses')} className="p-2 rounded-lg hidden sm:block"
          style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{course.title}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>{course.code}</span>
          </div>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Lecturer: {course.lecturer_name}
            {course.lecturer_email && (
              <a href={`mailto:${course.lecturer_email}`} className="ml-2 underline hover:opacity-80"
                style={{ color: 'var(--accent-blue)' }}>{course.lecturer_email}</a>
            )}
          </p>
        </div>
      </div>

      {/* Summary card */}
      <div className="rounded-xl p-5 mb-4"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="flex items-center gap-4">
            <CircularProgress percentage={pct} size={88} strokeWidth={7} color={statusColor} />
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                {statusLabel}
              </span>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {presentCount} of {summary?.sessions_total || 0} sessions
              </p>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full sm:w-auto">
            {[
              { label: 'Present', value: presentCount, color: 'var(--accent-green)' },
              { label: 'Absent', value: absentCount, color: 'var(--accent-red)' },
              { label: 'Total', value: summary?.sessions_total || 0, color: 'var(--text-secondary)' },
              { label: 'Min Threshold', value: `${threshold}%`, color: 'var(--accent-primary)' },
            ].map(s => (
              <div key={s.label} className="text-center p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-raised)' }}>
                <p className="text-lg font-semibold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Threshold bar */}
        <div className="mt-4">
          <div className="relative h-2 rounded-full" style={{ backgroundColor: 'var(--bg-raised)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: statusColor }} />
            <div className="absolute top-0 h-full w-px border-l-2 border-dashed"
              style={{ left: `${threshold}%`, borderColor: 'var(--text-muted)' }} />
          </div>
          <div className="flex justify-between mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span>0%</span>
            <span>{threshold}% min</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Alert banner */}
      {status === 'defaulter' && (
        <div className="flex items-start gap-2 p-3 rounded-xl mb-4"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-red)' }} />
          <p className="text-sm" style={{ color: 'var(--accent-red)' }}>
            {warningMsg || `You are below the minimum attendance threshold of ${threshold}%.`}
          </p>
        </div>
      )}
      {status === 'at_risk' && (
        <div className="flex items-start gap-2 p-3 rounded-xl mb-4"
          style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-amber)' }} />
          <p className="text-sm" style={{ color: 'var(--accent-amber)' }}>
            {warningMsg || `You are approaching the minimum threshold of ${threshold}%. Don't miss class!`}
          </p>
        </div>
      )}
      {status === 'good' && (
        <div className="flex items-start gap-2 p-3 rounded-xl mb-4"
          style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <Check size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-green)' }} />
          <p className="text-sm" style={{ color: 'var(--accent-green)' }}>You are in good standing. Keep it up!</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-lg text-xs outline-none appearance-none cursor-pointer"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
          <option value="all">All Status</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
        </select>
        <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
          className="h-9 px-3 rounded-lg text-xs outline-none appearance-none cursor-pointer"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl overflow-hidden mb-8"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-raised)' }}>
              {['#', 'Date', 'Day', 'Time', 'Method', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>No records found.</td>
              </tr>
            ) : filteredRecords.map((r, i) => {
              const method = r.method ? METHOD_CONFIG[r.method] : null;
              const MethodIcon = method?.icon;
              const isPresent = r.student_status === 'present';
              const isOverride = r.is_manual_override;
              const statusBg = isPresent
                ? (isOverride ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)')
                : 'rgba(239,68,68,0.12)';
              const statusClr = isPresent
                ? (isOverride ? 'var(--accent-amber)' : 'var(--accent-green)')
                : 'var(--accent-red)';

              return (
                <tr key={r.session_id} className="transition-colors"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{formatDate(r.session_date)}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{getDayName(r.session_date)}</td>
                  <td className="px-4 py-3" style={{ color: r.checked_in_at ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                    {formatTime(r.checked_in_at) || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {method ? (
                      <span className="flex items-center gap-1.5">
                        <MethodIcon size={14} style={{ color: method.color }} />
                        <span style={{ color: method.color }} className="text-xs">{method.label}</span>
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: statusBg, color: statusClr }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusClr }} />
                      {isPresent ? (isOverride ? 'Override' : 'Present') : 'Absent'}
                    </span>
                    {isOverride && (
                      <span className="ml-1 inline-block" title="This record was manually adjusted by your lecturer">
                        <Info size={12} style={{ color: 'var(--accent-amber)' }} />
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2 mb-8">
        {filteredRecords.length === 0 ? (
          <div className="py-8 text-center rounded-xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px dashed var(--border-subtle)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No records found.</p>
          </div>
        ) : filteredRecords.map((r, i) => {
          const method = r.method ? METHOD_CONFIG[r.method] : null;
          const MethodIcon = method?.icon;
          const isPresent = r.student_status === 'present';
          const isOverride = r.is_manual_override;
          const statusClr = isPresent ? (isOverride ? 'var(--accent-amber)' : 'var(--accent-green)') : 'var(--accent-red)';

          return (
            <div key={r.session_id} className="rounded-xl p-4"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatDate(r.session_date)}</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isPresent ? (isOverride ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)') : 'rgba(239,68,68,0.12)',
                    color: statusClr,
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusClr }} />
                  {isPresent ? (isOverride ? 'Override' : 'Present') : 'Absent'}
                </span>
              </div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{getDayName(r.session_date)}</p>
              {isPresent ? (
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>{formatTime(r.checked_in_at) || '—'}</span>
                  {method && (
                    <span className="flex items-center gap-1">
                      <MethodIcon size={12} style={{ color: method.color }} />
                      <span style={{ color: method.color }}>{method.label}</span>
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--accent-red)' }}>Not checked in</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Attendance Timeline Chart */}
      <div className="rounded-xl p-5 mb-8"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Attendance Timeline</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Number of sessions attended per week</p>
        {timelineData.length === 0 ? (
          <div className="h-52 flex items-center justify-center">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No timeline data yet.</p>
          </div>
        ) : (
          <div className="h-52 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fill: '#4A5C80', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4A5C80', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={summary?.sessions_total ? Math.ceil((threshold / 100) * summary.sessions_total) : undefined}
                  stroke="#4A5C80" strokeDasharray="6 3"
                />
                <Bar dataKey="present" fill={statusColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}