import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanFace, QrCode, X, Download, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { studentAPI } from '../api/studentAPI';
import { useAppConfig } from '../context/AppContext';
import jsPDF from 'jspdf';

const METHOD_CONFIG = {
  face: { icon: ScanFace, label: 'Face Scan', color: 'var(--accent-purple)' },
  qr: { icon: QrCode, label: 'QR Code', color: 'var(--accent-blue)' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (timeStr) => {
  if (!timeStr) return null;
  return new Date(timeStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

function generatePDF(historyRecords, courses, summary, institutionName) {
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
  doc.text('Smart Attendance System', margin, 24);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin, 30);

  // University name right-aligned
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(245, 158, 11);
  doc.text(institutionName || 'Smart Attendance System', pageW - margin, 16, { align: 'right' });

  y = 48;

  // ── Summary boxes ───────────────────────────────────────────────
  const totalPresent = summary.present_count || 0;
  const totalAbsent = summary.absent_count || 0;
  const totalRecords = summary.total || 0;
  const overallPct = totalRecords ? Math.round((totalPresent / totalRecords) * 100) : 0;

  const boxes = [
    { label: 'Total Sessions', value: String(totalRecords), color: [26, 34, 54] },
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

  courses.forEach(course => {
    const records = historyRecords.filter(r => r.course_id === course.id);
    if (records.length === 0) return; // Skip courses with no records in current filter

    const present = records.filter(r => r.status === 'present').length;
    const pct = Math.round((present / records.length) * 100);
    const threshold = 75; // Default threshold
    const statusColor = pct >= threshold + 5 ? [16, 185, 129] : pct >= threshold ? [245, 158, 11] : [239, 68, 68];

    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(26, 34, 54);
    doc.roundedRect(margin, y, pageW - margin * 2, 13, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(240, 244, 255);
    doc.text(`${course.code} — ${course.title}`, margin + 4, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(139, 157, 195);
    doc.text(`${present}/${records.length} sessions  ·  Min required: ${threshold}%`, margin + 4, y + 10);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...statusColor);
    doc.text(`${pct}%`, pageW - margin - 4, y + 7.5, { align: 'right' });

    y += 16;
  });

  y += 4;

  // ── Session records table ────────────────────────────────────────
  if (y > 260) {
    doc.addPage();
    y = 20;
  }
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

  historyRecords.forEach((r, idx) => {
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
    doc.text(formatDate(r.session_date), margin + 3, y + 4.4);
    doc.text(`${r.course_code} · ${r.course_title}`, margin + 38, y + 4.4);
    doc.text(r.method ? (r.method === 'face' ? 'Face Scan' : 'QR Code') : '—', margin + 90, y + 4.4);
    doc.text(formatTime(r.checked_in_at) || '—', margin + 130, y + 4.4);

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

  doc.save('attendance-report.pdf');
}

export default function AttendanceHistoryPage() {
  const navigate = useNavigate();
  const { institutionName } = useAppConfig();
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [downloading, setDownloading] = useState(false);

  // Fetch student's courses for the filter dropdown
  const { data: coursesData } = useQuery({
    queryKey: ['studentCourses'],
    queryFn: () => studentAPI.getCourses({ limit: 100 }),
  });
  const courses = coursesData?.courses || [];

  // Fetch attendance history based on filters
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['studentHistory', statusFilter, courseFilter],
    queryFn: () => studentAPI.getHistory({ 
      status: statusFilter, 
      course_id: courseFilter,
      limit: 100 
    }),
  });

  const records = historyData?.records || [];
  const summary = {
    total: historyData?.total || 0,
    present_count: historyData?.present_count || 0,
    absent_count: historyData?.absent_count || 0
  };

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => { 
      generatePDF(records, courses, summary, institutionName); 
      setDownloading(false); 
    }, 200);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Attendance History</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>All your attendance records across all courses</p>
        </div>
        <button onClick={handleDownload} disabled={downloading || isLoading || records.length === 0}
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
          <p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {isLoading ? <Loader2 className="animate-spin mx-auto" size={24} /> : summary.total}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Sessions</p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <p className="text-2xl font-semibold" style={{ color: 'var(--accent-green)' }}>
            {isLoading ? <Loader2 className="animate-spin mx-auto" size={24} /> : summary.present_count}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Present</p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <p className="text-2xl font-semibold" style={{ color: 'var(--accent-red)' }}>
            {isLoading ? <Loader2 className="animate-spin mx-auto" size={24} /> : summary.absent_count}
          </p>
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
          {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
        </select>
      </div>

      {/* Records */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : records.length === 0 ? (
        <div className="py-12 text-center rounded-xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px dashed var(--border-subtle)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No attendance records found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => {
            const method = r.method ? METHOD_CONFIG[r.method] : null;
            const MethodIcon = method?.icon;
            return (
              <div key={r.id} className="rounded-xl p-4 transition-colors cursor-pointer hover:bg-white/[0.02]"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                onClick={() => navigate(`/courses/${r.course_id}/attendance`)}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: r.status === 'absent' ? 'rgba(239,68,68,0.12)' : `${method?.color || 'var(--text-muted)'}15` }}>
                      {r.status === 'absent' ? (
                        <X size={16} style={{ color: 'var(--accent-red)' }} />
                      ) : (
                        MethodIcon ? <MethodIcon size={16} style={{ color: method.color }} /> : null
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.course_title}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.course_code} · {formatDate(r.session_date)}</p>
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
                    {r.checked_in_at && <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatTime(r.checked_in_at)}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}