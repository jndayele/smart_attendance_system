import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { WEEKLY_TREND } from '../../data/dummyData';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs shadow-xl"
      style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
      <p className="font-semibold mb-0.5">{label}</p>
      <p style={{ color: 'var(--accent-primary)' }}>{payload[0].value}% overall</p>
    </div>
  );
};

export default function AttendanceTrendChart() {
  const recent = WEEKLY_TREND.slice(-4);
  const first = recent[0]?.overall ?? 0;
  const last = recent[recent.length - 1]?.overall ?? 0;
  const delta = last - first;

  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor = delta > 0 ? 'var(--accent-green)' : delta < 0 ? 'var(--accent-red)' : 'var(--text-muted)';
  const trendLabel = delta > 0 ? `+${delta}%` : delta < 0 ? `${delta}%` : 'Stable';

  return (
    <div className="rounded-xl p-5"
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Attendance Insights</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Overall % across all courses · last 4 weeks</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ backgroundColor: `${trendColor}18` }}>
          <TrendIcon size={13} style={{ color: trendColor }} />
          <span className="text-xs font-semibold" style={{ color: trendColor }}>{trendLabel}</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={recent} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[50, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={75} stroke="rgba(239,68,68,0.35)" strokeDasharray="4 3"
            label={{ value: '75% min', fill: 'rgba(239,68,68,0.55)', fontSize: 10, position: 'insideTopRight' }} />
          <Line
            type="monotone" dataKey="overall"
            stroke="var(--accent-primary)" strokeWidth={2.5}
            dot={{ fill: 'var(--accent-primary)', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: 'var(--accent-primary)', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Per-course mini stats */}
      <div className="flex gap-3 mt-4 flex-wrap">
        {recent[recent.length - 1]?.courses?.map((c) => (
          <div key={c.code} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.code}</span>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{c.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}