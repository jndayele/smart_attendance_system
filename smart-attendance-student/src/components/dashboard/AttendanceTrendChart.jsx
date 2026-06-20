import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#06B6D4', '#F43F5E'];

function getColorForIndex(idx) {
  return COLORS[idx % COLORS.length];
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs shadow-xl"
      style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((entry, index) => (
        <p key={index} style={{ color: entry.color }} className="flex justify-between gap-4">
          <span>{entry.name}:</span>
          <span className="font-semibold">{entry.value}%</span>
        </p>
      ))}
    </div>
  );
};

export default function AttendanceTrendChart({ trendData }) {
  const chartData = useMemo(() => {
    if (!trendData || trendData.length === 0) return [];
    
    // Get all unique week labels from the first course
    const weeks = trendData[0].trend.map(t => t.week_label);
    
    // Transform into Recharts format
    return weeks.map(week => {
      const dataPoint = { week };
      trendData.forEach(course => {
        const weekData = course.trend.find(t => t.week_label === week);
        dataPoint[course.course_code] = weekData ? weekData.attendance_pct : 0;
      });
      return dataPoint;
    });
  }, [trendData]);

  // Calculate overall trend to show the indicator pill
  const overallTrend = useMemo(() => {
    if (chartData.length < 2) return 0;
    const firstWeek = chartData[0];
    const lastWeek = chartData[chartData.length - 1];
    
    let firstAvg = 0, lastAvg = 0;
    trendData.forEach(c => {
      firstAvg += firstWeek[c.course_code] || 0;
      lastAvg += lastWeek[c.course_code] || 0;
    });
    
    firstAvg = firstAvg / trendData.length;
    lastAvg = lastAvg / trendData.length;
    
    return Math.round((lastAvg - firstAvg) * 10) / 10;
  }, [chartData, trendData]);

  const TrendIcon = overallTrend > 0 ? TrendingUp : overallTrend < 0 ? TrendingDown : Minus;
  const trendColor = overallTrend > 0 ? 'var(--accent-green)' : overallTrend < 0 ? 'var(--accent-red)' : 'var(--text-muted)';
  const trendLabel = overallTrend > 0 ? `+${overallTrend}%` : overallTrend < 0 ? `${overallTrend}%` : 'Stable';

  if (!trendData || trendData.length === 0) return null;

  return (
    <div className="rounded-xl p-5"
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Attendance Insights</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Course attendance across the last 4 weeks</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ backgroundColor: `${trendColor}18` }}>
          <TrendIcon size={13} style={{ color: trendColor }} />
          <span className="text-xs font-semibold" style={{ color: trendColor }}>{trendLabel}</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: 'var(--text-muted)' }} />
          
          {trendData.map((course, idx) => (
            <Line
              key={course.course_code}
              type="monotone" 
              dataKey={course.course_code}
              name={course.course_code}
              stroke={getColorForIndex(idx)} 
              strokeWidth={2}
              dot={{ fill: getColorForIndex(idx), r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: getColorForIndex(idx), stroke: 'var(--bg-surface)', strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}