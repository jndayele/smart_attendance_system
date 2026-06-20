import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899', '#06B6D4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 border text-xs" style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-subtle)' }}>
      <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.dataKey}: <strong style={{ color: p.color }}>{Number(p.value).toFixed(1)}%</strong></span>
        </p>
      ))}
    </div>
  );
};

export default function WeeklyTrendChart({ rawCoursesData = [] }) {
  const { data, courseCodes } = useMemo(() => {
    const weekMap = {};
    const codes = new Set();
    
    rawCoursesData.forEach(courseObj => {
      const code = courseObj.course.code;
      codes.add(code);
      
      (courseObj.session_trend || []).forEach(session => {
        const d = new Date(session.session_date);
        const start = new Date(d.getFullYear(), 0, 1);
        const days = Math.floor((d - start) / (24 * 60 * 60 * 1000));
        const week = `Week ${Math.ceil(days / 7)}`;
        
        if (!weekMap[week]) weekMap[week] = { week };
        if (!weekMap[week][code]) weekMap[week][code] = [];
        weekMap[week][code].push(session.attendance_pct);
      });
    });
    
    const processedData = Object.values(weekMap).map(weekObj => {
      const res = { week: weekObj.week };
      codes.forEach(code => {
        if (weekObj[code]) {
           const sum = weekObj[code].reduce((a, b) => a + b, 0);
           res[code] = sum / weekObj[code].length;
        }
      });
      return res;
    }).sort((a, b) => {
       const w1 = parseInt(a.week.split(' ')[1]);
       const w2 = parseInt(b.week.split(' ')[1]);
       return w1 - w2;
    });
    
    return { data: processedData, courseCodes: Array.from(codes) };
  }, [rawCoursesData]);

  if (!data.length) {
    return (
      <div className="rounded-[10px] border p-4 xl:p-5 flex items-center justify-center min-h-[300px]" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <p className="text-sm text-[var(--text-muted)]">No trend data available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[10px] border p-4 xl:p-5" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Weekly Attendance Trend — All Courses</h3>
      <div className="w-full overflow-x-auto">
        <div className="min-w-[400px]" style={{ height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" tick={{ fill: '#8B9DC3', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.07)' }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#8B9DC3', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.07)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#8B9DC3' }} />
              {courseCodes.map((code, index) => (
                <Line key={code} type="monotone" dataKey={code} stroke={COLORS[index % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}