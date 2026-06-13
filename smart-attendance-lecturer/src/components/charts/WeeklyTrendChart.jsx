import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { weeklyTrendData } from '../../data/mockData';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 border text-xs"
      style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-subtle)' }}>
      <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.dataKey}: <strong style={{ color: p.color }}>{p.value}%</strong></span>
        </p>
      ))}
    </div>
  );
};

export default function WeeklyTrendChart() {
  return (
    <div className="rounded-[10px] border p-4 xl:p-5" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Weekly Attendance Trend — All Courses</h3>
      <div className="w-full overflow-x-auto">
        <div className="min-w-[400px]" style={{ height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" tick={{ fill: '#8B9DC3', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.07)' }} />
              <YAxis domain={[50, 100]} tick={{ fill: '#8B9DC3', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.07)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#8B9DC3' }} />
              <Line type="monotone" dataKey="CS301" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="CS401" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="CS201" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}