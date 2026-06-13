import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { CALENDAR_EVENTS } from '../../data/dummyData';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function AttendanceCalendar() {
  const today = new Date(2026, 5, 13); // pinned to app's "today"
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const eventsByDate = useMemo(() => {
    const map = {};
    CALENDAR_EVENTS.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, []);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDate(null);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth);
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Course Calendar</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Sessions & attendance at a glance</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
            style={{ backgroundColor: 'var(--bg-raised)' }}>
            <ChevronLeft size={15} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <span className="text-sm font-medium w-32 text-center" style={{ color: 'var(--text-primary)' }}>{monthLabel}</span>
          <button onClick={nextMonth}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
            style={{ backgroundColor: 'var(--bg-raised)' }}>
            <ChevronRight size={15} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold pb-2 uppercase tracking-wide"
              style={{ color: 'var(--text-muted)' }}>{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e-${i}`} />)}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = toDateKey(viewYear, viewMonth, day);
            const events = eventsByDate[key] || [];
            const isToday = key === todayKey;
            const isSelected = key === selectedDate;
            const hasPresent = events.some(e => e.status === 'present');
            const hasAbsent = events.some(e => e.status === 'absent');
            const hasUpcoming = events.some(e => e.status === 'upcoming');

            return (
              <button key={key}
                onClick={() => setSelectedDate(isSelected ? null : key)}
                className="relative flex flex-col items-center py-1.5 rounded-lg transition-all"
                style={{
                  backgroundColor: isSelected
                    ? 'rgba(245,158,11,0.15)'
                    : isToday
                    ? 'rgba(245,158,11,0.08)'
                    : 'transparent',
                  border: isToday ? '1px solid rgba(245,158,11,0.4)' : '1px solid transparent',
                }}>
                <span className="text-xs font-medium mb-1"
                  style={{ color: isToday ? 'var(--accent-primary)' : isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {day}
                </span>
                {/* Dot indicators */}
                <div className="flex gap-0.5 h-1.5">
                  {hasPresent && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }} />}
                  {hasAbsent && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#EF4444' }} />}
                  {hasUpcoming && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--text-muted)' }} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 px-1">
          {[
            { color: '#10B981', label: 'Present' },
            { color: '#EF4444', label: 'Absent' },
            { color: 'var(--text-muted)', label: 'Upcoming' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected day panel */}
      {selectedDate && (
        <div className="px-4 pb-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
            <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            {selectedEvents.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No sessions on this day.</p>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map((ev, i) => {
                  const Icon = ev.status === 'present' ? CheckCircle2 : ev.status === 'absent' ? XCircle : Clock;
                  const iconColor = ev.status === 'present' ? '#10B981' : ev.status === 'absent' ? '#EF4444' : 'var(--text-muted)';
                  const statusLabel = ev.status === 'present' ? 'Present' : ev.status === 'absent' ? 'Absent' : 'Upcoming';
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{ev.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{ev.code} · {ev.time} · {ev.room}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Icon size={14} style={{ color: iconColor }} />
                        <span className="text-xs font-medium" style={{ color: iconColor }}>{statusLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}