import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Present', value: 847, color: '#10B981' },
  { name: 'Absent', value: 134, color: '#EF4444' },
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: '#212D42', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ color: payload[0].payload.color, fontSize: 13, fontWeight: 500 }}>
        {payload[0].name}: {payload[0].value}
      </p>
    </div>
  );
};

export default function PresentAbsentDonut() {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Present vs Absent Today</h3>
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{total}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total</p>
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-6 mt-2">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{d.name}: {d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}