import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanFace, QrCode, X, Download, Loader2 } from 'lucide-react';
import { COURSES, RECENT_ACTIVITY } from '../data/dummyData';
import jsPDF from 'jspdf';

const ALL_HISTORY = [
  { date: "Jun 4, 2025", course: "CS301", courseName: "Database Systems", method: "face", status: "present", time: "10:14 AM" },
  { date: "Jun 3, 2025", course: "CS401", courseName: "Algorithms", method: "qr", status: "present", time: "2:05 PM" },
  { date: "Jun 1, 2025", course: "CS201", courseName: "Data Structures", method: null, status: "absent", time: null },
  { date: "May 28, 2025", course: "CS301", courseName: "Database Systems", method: "qr", status: "present", time: "10:02 AM" },
  { date: "May 27, 2025", course: "CS401", courseName: "Algorithms", method: "face", status: "present", time: "2:01 PM" },
  { date: "May 21, 2025", course: "CS201", courseName: "Data Structures", method: null, status: "absent", time: null },
  { date: "May 14, 2025", course: "CS301", courseName: "Database Systems", method: "face", status: "present", time: "9:58 AM" },
  { date: "May 7, 2025", course: "CS401", courseName: "Algorithms", method: "qr", status: "present", time: "2:10 PM" },
  { date: "Apr 30, 2025", course: "CS201", courseName: "Data Structures", method: "face", status: "present", time: "10:05 AM" },
  { date: "Apr 23, 2025", course: "CS301", courseName: "Database Systems", method: "face", status: "present", time: "10:05 AM" },
  { date: "Apr 16, 2025", course: "CS401", courseName: "Algorithms", method: "qr", status: "present", time: "2:12 PM" },
  { date: "Apr 9, 2025", course: "CS201", courseName: "Data Structures", method: null, status: "absent", time: null },
];

const METHOD_CONFIG = {
  face: { icon: ScanFace, label: 'Face Scan', color: 'var(--accent-purple)' },
  qr: { icon: QrCode, label: 'QR Code', color: 'var(--accent-blue)' },
};

function generatePDF() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = 0;

  // ── Header bar ──────────────────────────────────────────────────
  doc.setFillColor(15, 22, 35);
  doc.rect(0, 0, pageW, 38, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(240, 244, 255);
  doc.text('Attendance Report', margin, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(139, 157, 195);
  doc.text('BSc Computer Science · Level 300 · Semester 1, 2025/2026', margin, 24);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin, 30);

  // University name right-aligned
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(245, 158, 11);
  doc.text('University of Science & Technology', pageW - margin, 16, { align: 'right' });

  y = 48;

  // ── Summary boxes ───────────────────────────────────────────────
  const totalPresent = ALL_HISTORY.filter(r => r.status === 'present').length;
  const totalAbsent = ALL_HISTORY.filter(r => r.status === 'absent').length;
  const overallPct = Math.round((totalPresent / ALL_HISTORY.length) * 100);

  const boxes = [
    { label: 'Total Sessions', value: String(ALL_HISTORY.length), color: [26, 34, 54] },
    { label: 'Present', value: String(totalPresent), color: [16, 60, 44] },
    { label: 'Absent', value: String(totalAbsent), color: [60, 20, 20] },
    { label: 'Overall Rate', value: `${overallPct}%`, color: [50, 40, 10] },
  ];
  const boxW = (pageW - margin * 2 - 9) / 4;
  boxes.forEach((b, i) => {
    const x = margin + i * (boxW + 3);
    doc.setFillColor(...b.color);
    doc.roundedRect(x, y, boxW, 18, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(240, 244, 255);
    doc.text(b.value, x + boxW / 2, y + 10, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(139, 157, 195);
    doc.text(b.label, x + boxW / 2, y + 15.5, { align: 'center' });
  });

  y += 26;

  // ── Per-course breakdown ─────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(245, 158, 11);
  doc.text('COURSE SUMMARY', margin, y);
  y += 5;

  COURSES.forEach(course => {
    const records = ALL_HISTORY.filter(r => r.course === course.code);
    const present = records.filter(r => r.status === 'present').length;
    const pct = records.length ? Math.round((present / records.length) * 100) : 0;
    const statusColor = pct >= course.threshold + 5 ? [16, 185, 129] : pct >= course.threshold ? [245, 158, 11] : [239, 68, 68];

    doc.setFillColor(26, 34, 54);
    doc.roundedRect(margin, y, pageW - margin * 2, 13, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(240, 244, 255);
    doc.text(`${course.code} — ${course.name}`, margin + 4, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(139, 157, 195);
    doc.text(`${present}/${records.length} sessions  ·  Min required: ${course.threshold}%`, margin + 4, y + 10);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...statusColor);
    doc.text(`${pct}%`, pageW - margin - 4, y + 7.5, { align: 'right' });

    y += 16;
  });

  y += 4;

  // ── Session records table ────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(245, 158, 11);
  doc.text('SESSION RECORDS', margin, y);
  y += 5;

  // Table header
  doc.setFillColor(26, 34, 54);
  doc.rect(margin, y, pageW - margin * 2, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(139, 157, 195);
  doc.text('DATE', margin + 3, y + 4.8);
  doc.text('COURSE', margin + 38, y + 4.8);
  doc.text('METHOD', margin + 90, y + 4.8);
  doc.text('TIME', margin + 130, y + 4.8);
  doc.text('STATUS', pageW - margin - 3, y + 4.8, { align: 'right' });
  y += 9;

  ALL_HISTORY.forEach((r, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    const rowBg = idx % 2 === 0 ? [15, 22, 35] : [20, 28, 46];
    doc.setFillColor(...rowBg);
    doc.rect(margin, y, pageW - margin * 2, 6.5, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(200, 210, 240);
    doc.text(r.date, margin + 3, y + 4.4);
    doc.text(`${r.course} · ${r.courseName}`, margin + 38, y + 4.4);
    doc.text(r.method ? (r.method === 'face' ? 'Face Scan' : 'QR Code') : '—', margin + 90, y + 4.4);
    doc.text(r.time || '—', margin + 130, y + 4.4);

    const isPresent = r.status === 'present';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(isPresent ? 16 : 239, isPresent ? 185 : 68, isPresent ? 129 : 68);
    doc.text(isPresent ? 'Present' : 'Absent', pageW - margin - 3, y + 4.4, { align: 'right' });

    y += 6.5;
  });

  // ── Footer ───────────────────────────────────────────────────────
  const pages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(74, 92, 128);
    doc.text('This is an auto-generated report from the Smart Attendance System. For official use, please request a certified copy from your academic office.',
      pageW / 2, 290, { align: 'center', maxWidth: pageW - margin * 2 });
    doc.text(`Page ${p} of ${pages}`, pageW - margin, 290, { align: 'right' });
  }

  doc.save('attendance-report-semester1-2026.pdf');
}

export default function AttendanceHistoryPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => { generatePDF(); setDownloading(false); }, 200);
  };

  const filtered = ALL_HISTORY.filter(r => {
    const statusMatch = statusFilter === 'all' || r.status === statusFilter;
    const courseMatch = courseFilter === 'all' || r.course === courseFilter;
    return statusMatch && courseMatch;
  });

  const totalPresent = ALL_HISTORY.filter(r => r.status === 'present').length;
  const totalAbsent = ALL_HISTORY.filter(r => r.status === 'absent').length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Attendance History</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>All your attendance records across all courses</p>
        </div>
        <button onClick={handleDownload} disabled={downloading}
          className="flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-medium flex-shrink-0 transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-60"
          style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
          {downloading
            ? <><Loader2 size={14} className="animate-spin" /> Generating...</>
            : <><Download size={14} /> Download PDF</>}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{ALL_HISTORY.length}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Sessions</p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <p className="text-2xl font-semibold" style={{ color: 'var(--accent-green)' }}>{totalPresent}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Present</p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <p className="text-2xl font-semibold" style={{ color: 'var(--accent-red)' }}>{totalAbsent}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Absent</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-lg text-xs outline-none appearance-none cursor-pointer"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
          <option value="all">All Status</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
        </select>
        <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}
          className="h-9 px-3 rounded-lg text-xs outline-none appearance-none cursor-pointer"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
          <option value="all">All Courses</option>
          {COURSES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
      </div>

      {/* Records */}
      <div className="space-y-2">
        {filtered.map((r, i) => {
          const method = r.method ? METHOD_CONFIG[r.method] : null;
          const MethodIcon = method?.icon;
          const course = COURSES.find(c => c.code === r.course);
          return (
            <div key={i} className="rounded-xl p-4 transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
              onClick={() => course && navigate(`/courses/${course.id}/attendance`)}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: r.status === 'absent' ? 'rgba(239,68,68,0.12)' : `${method?.color}15` }}>
                    {r.status === 'absent' ? (
                      <X size={16} style={{ color: 'var(--accent-red)' }} />
                    ) : (
                      MethodIcon && <MethodIcon size={16} style={{ color: method.color }} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.courseName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.course} · {r.date}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: r.status === 'present' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                      color: r.status === 'present' ? 'var(--accent-green)' : 'var(--accent-red)',
                    }}>
                    <span className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: r.status === 'present' ? 'var(--accent-green)' : 'var(--accent-red)' }} />
                    {r.status === 'present' ? 'Present' : 'Absent'}
                  </span>
                  {r.time && <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{r.time}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}