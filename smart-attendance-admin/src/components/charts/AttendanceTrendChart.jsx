import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { week: 'Wk 1', attendance: 82, sessions: 12 },
  { week: 'Wk 2', attendance: 78, sessions: 14 },
  { week: 'Wk 3', attendance: 85, sessions: 15 },
  { week: 'Wk 4', attendance: 80, sessions: 13 },
  { week: 'Wk 5', attendance: 88, sessions: 16 },
  { week: 'Wk 6', attendance: 84, sessions: 14 },
  { week: 'Wk 7', attendance: 90, sessions: 17 },
  { week: 'Wk 8', attendance: 87, sessions: 15 },
];

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

export default function AttendanceTrendChart() {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Weekly Attendance Trend</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="week" tick={{ fill: '#4A5C80', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fill: '#4A5C80', fontSize: 11 }} axisLine={false} tickLine={false} domain={[60, 100]} />
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