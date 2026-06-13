import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ScanFace, QrCode, AlertTriangle, Check, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import CircularProgress from '../components/ui/CircularProgress';
import { COURSES, SESSION_RECORDS, ATTENDANCE_TIMELINE, getAttendanceStatus, getStatusColor, getStatusLabel } from '../data/dummyData';

const METHOD_CONFIG = {
  face: { icon: ScanFace, label: 'Face Scan', color: 'var(--accent-purple)' },
  qr: { icon: QrCode, label: 'QR Code', color: 'var(--accent-blue)' },
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="px-3 py-2 rounded-lg text-xs shadow-lg"
      style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
      <p style={{ color: 'var(--text-primary)' }}>{d.week}: {d.attended}/{d.total} attended ({d.percentage}%)</p>
    </div>
  );
}

export default function CourseAttendancePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const course = COURSES.find(c => c.id === id) || COURSES[0];
  const pct = Math.round((course.attended / course.total) * 100);
  const status = getAttendanceStatus(pct, course.threshold);
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);

  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  const presentCount = SESSION_RECORDS.filter(r => r.status === 'present').length;
  const absentCount = SESSION_RECORDS.filter(r => r.status === 'absent').length;

  let filteredRecords = SESSION_RECORDS.filter(r =>
    statusFilter === 'all' || r.status === statusFilter
  );
  if (sortOrder === 'oldest') filteredRecords = [...filteredRecords].reverse();

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
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{course.name}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${course.color}20`, color: course.color }}>{course.code}</span>
          </div>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Lecturer: {course.lecturer}</p>
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
                {course.attended} of {course.total} sessions
              </p>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full sm:w-auto">
            {[
              { label: 'Present', value: presentCount, color: 'var(--accent-green)', icon: '✓' },
              { label: 'Absent', value: absentCount, color: 'var(--accent-red)', icon: '✗' },
              { label: 'Total', value: SESSION_RECORDS.length, color: 'var(--text-secondary)', icon: '📋' },
              { label: 'Threshold', value: `${course.threshold}%`, color: 'var(--accent-primary)', icon: '🎯' },
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
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: statusColor }} />
            <div className="absolute top-0 h-full w-px border-l-2 border-dashed"
              style={{ left: `${course.threshold}%`, borderColor: 'var(--text-muted)' }} />
          </div>
        </div>
      </div>

      {/* Alert banner */}
      {status === 'defaulter' && (
        <div className="flex items-start gap-2 p-3 rounded-xl mb-4"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-red)' }} />
          <p className="text-sm" style={{ color: 'var(--accent-red)' }}>
            You are below the minimum attendance threshold of {course.threshold}%. Attend the next {Math.ceil((course.threshold / 100) * course.total) - course.attended} sessions to recover.
          </p>
        </div>
      )}
      {status === 'at-risk' && (
        <div className="flex items-start gap-2 p-3 rounded-xl mb-4"
          style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-amber)' }} />
          <p className="text-sm" style={{ color: 'var(--accent-amber)' }}>
            You are approaching the minimum threshold. Missing 2 more sessions will put you below {course.threshold}%.
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

      {/* Desktop table / Mobile cards */}
      {/* Desktop */}
      <div className="hidden md:block rounded-xl overflow-hidden mb-8"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-raised)' }}>
              {['#', 'Session', 'Date', 'Day', 'Check-in', 'Method', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((r, i) => {
              const method = r.method ? METHOD_CONFIG[r.method] : null;
              const MethodIcon = method?.icon;
              return (
                <tr key={i} className="transition-colors"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{r.week}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{r.date}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{r.day}</td>
                  <td className="px-4 py-3" style={{ color: r.time ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                    {r.time || '—'}
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
                      style={{
                        backgroundColor: r.status === 'present'
                          ? (r.override ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)')
                          : 'rgba(239,68,68,0.12)',
                        color: r.status === 'present'
                          ? (r.override ? 'var(--accent-amber)' : 'var(--accent-green)')
                          : 'var(--accent-red)',
                      }}>
                      <span className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: r.status === 'present'
                            ? (r.override ? 'var(--accent-amber)' : 'var(--accent-green)')
                            : 'var(--accent-red)',
                        }} />
                      {r.status === 'present' ? (r.override ? 'Override' : 'Present') : 'Absent'}
                    </span>
                    {r.override && (
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
        {filteredRecords.map((r, i) => {
          const method = r.method ? METHOD_CONFIG[r.method] : null;
          const MethodIcon = method?.icon;
          return (
            <div key={i} className="rounded-xl p-4"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{r.date}</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: r.status === 'present'
                      ? (r.override ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)')
                      : 'rgba(239,68,68,0.12)',
                    color: r.status === 'present'
                      ? (r.override ? 'var(--accent-amber)' : 'var(--accent-green)')
                      : 'var(--accent-red)',
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: r.status === 'present'
                        ? (r.override ? 'var(--accent-amber)' : 'var(--accent-green)')
                        : 'var(--accent-red)',
                    }} />
                  {r.status === 'present' ? (r.override ? 'Override' : 'Present') : 'Absent'}
                </span>
              </div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{r.week}</p>
              {r.status === 'present' ? (
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>{r.time}</span>
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

      {/* Chart */}
      <div className="rounded-xl p-5 mb-8"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Your Attendance Timeline</h3>
        <div className="h-52 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ATTENDANCE_TIMELINE}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" tick={{ fill: '#4A5C80', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#4A5C80', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={course.threshold} stroke="#4A5C80" strokeDasharray="6 3" label={{ value: `${course.threshold}%`, fill: '#4A5C80', fontSize: 11, position: 'left' }} />
              <Line type="monotone" dataKey="percentage" stroke={statusColor} strokeWidth={2} dot={{ fill: statusColor, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}