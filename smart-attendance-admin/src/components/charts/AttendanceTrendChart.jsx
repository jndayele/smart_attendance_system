import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: '#212D42', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ color: '#8B9DC3', fontSize: 12, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 500 }}>
          {p.name}: {p.value}{p.name === 'Avg Attendance' ? '%' : ''}
        </p>
      ))}
    </div>
  );
};

export default function AttendanceTrendChart({ data = [] }) {
  // Transform backend data (week, attendance_pct) to chart format
  const chartData = data.map((d, i) => ({
    week: d.week || `Week ${i + 1}`,
    attendance: d.attendance_pct || 0,
    sessions: d.sessions_count || 0,
  }));

  // If no data, show empty state
  if (chartData.length === 0) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Weekly Attendance Trend</h3>
        <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>
          <p className="text-sm">No attendance data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Weekly Attendance Trend</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="week" tick={{ fill: '#4A5C80', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fill: '#4A5C80', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: '#4A5C80', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#8B9DC3' }} />
          <Line yAxisId="left" type="monotone" dataKey="attendance" name="Avg Attendance" stroke="var(--accent-primary)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--accent-primary)' }} />
          <Line yAxisId="right" type="monotone" dataKey="sessions" name="Sessions" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3, fill: '#3B82F6' }} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}