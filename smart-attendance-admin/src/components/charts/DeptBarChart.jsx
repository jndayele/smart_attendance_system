import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: '#212D42', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ color: '#8B9DC3', fontSize: 12, marginBottom: 4 }}>{label}</p>
      <p style={{ color: 'var(--accent-primary)', fontSize: 13, fontWeight: 500 }}>
        Attendance: {payload[0].value}%
      </p>
    </div>
  );
};

export default function DeptBarChart({ data = [] }) {
  // Transform backend data (department, avg_pct) to chart format
  const chartData = data.map(d => ({
    dept: d.department || d.dept || 'Unknown',
    rate: d.avg_pct || 0,
  }));

  // If no data, show empty state
  if (chartData.length === 0) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Attendance Rate by Department</h3>
        <div className="flex items-center justify-center h-56" style={{ color: 'var(--text-muted)' }}>
          <p className="text-sm">No department data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Attendance Rate by Department</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: '#4A5C80', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="dept" tick={{ fill: '#8B9DC3', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
          <Bar dataKey="rate" fill="var(--accent-primary)" radius={[0, 4, 4, 0]} barSize={18} background={{ fill: 'rgba(255,255,255,0.03)', radius: [0, 4, 4, 0] }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}