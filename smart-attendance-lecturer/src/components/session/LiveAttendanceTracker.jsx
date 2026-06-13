import React, { useState } from 'react';
import { ChevronDown, ChevronUp, QrCode, ScanFace } from 'lucide-react';

export default function LiveAttendanceTracker({ checkedIn, total }) {
  const [showAbsent, setShowAbsent] = useState(false);
  const presentCount = checkedIn.length;
  const absentCount = total - presentCount;
  const pct = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  return (
    <div className="rounded-[10px] border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
      <div className="p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Checked In</h3>

        {/* Circular indicator */}
        <div className="flex justify-center mb-4">
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-raised)" strokeWidth="6" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--accent-green)" strokeWidth="6"
                strokeDasharray={`${(pct / 100) * 264} 264`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{presentCount}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/ {total}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full mb-2" style={{ backgroundColor: 'var(--bg-raised)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: 'var(--accent-green)' }} />
        </div>
        <p className="text-xs text-center mb-4" style={{ color: 'var(--text-muted)' }}>
          {presentCount} of {total} students checked in ({pct}%)
        </p>

        {/* Recent check-ins */}
        <div className="max-h-72 overflow-y-auto scrollbar-thin space-y-1">
          {checkedIn.map((student, i) => (
            <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg animate-fade-in-up"
              style={{ backgroundColor: i === 0 ? 'rgba(16,185,129,0.06)' : 'transparent' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
                style={{ backgroundColor: 'var(--accent-blue)', color: '#fff' }}>
                {student.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{student.name}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{student.time}</p>
              </div>
              {student.method === 'face' ? (
                <ScanFace className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--accent-blue)' }} />
              ) : (
                <QrCode className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Absent section */}
      <button onClick={() => setShowAbsent(!showAbsent)}
        className="w-full flex items-center justify-between p-4 border-t text-xs font-medium transition-colors hover:bg-[var(--bg-raised)]"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
        <span>{absentCount} students not yet checked in</span>
        {showAbsent ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
    </div>
  );
}