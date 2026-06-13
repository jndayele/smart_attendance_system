import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg p-3 border text-xs"
      style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-subtle)' }}>
      <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{d.label}</p>
      <p style={{ color: 'var(--text-muted)' }}>{d.date}</p>
      <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{d.present}/{d.total} present</p>
      <p className="font-semibold" style={{ color: payload[0].fill }}>{d.percentage}%</p>
    </div>
  );
};

export default function SessionBarChart({ sessions, threshold }) {
  const data = sessions.map(s => ({
    ...s,
    name: s.date.slice(5),
  })).reverse();

  const getBarColor = (pct) => pct >= 75 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <div className="rounded-[10px] border p-4 xl:p-5" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Attendance Rate Per Session</h3>
      <div className="w-full overflow-x-auto">
        <div className="min-w-[400px]" style={{ height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#8B9DC3', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.07)' }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#8B9DC3', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.07)' }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={threshold} stroke="#F59E0B" strokeDasharray="6 3" label={{ value: `${threshold}%`, fill: '#F59E0B', fontSize: 10, position: 'right' }} />
              <Bar dataKey="percentage" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={getBarColor(entry.percentage)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}