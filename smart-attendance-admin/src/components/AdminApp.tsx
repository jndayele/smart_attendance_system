import { useState, useEffect, useMemo, type ReactNode, type CSSProperties } from "react";
import {
  LayoutDashboard, Building2, GraduationCap, BookOpen, Calendar, Users, UserCheck,
  BarChart3, Bell, Settings, LogOut, Plus, Search, Edit, Trash2, X, Check, Clock,
  AlertTriangle, ChevronDown, ChevronUp, MoreHorizontal, Eye, Copy, Power, Upload,
  Download, Mail, KeyRound, ShieldAlert, FileText, FileSpreadsheet, Send, Filter,
  TrendingUp, TrendingDown, CheckCircle2, XCircle, Info, AlertCircle, ArrowRight,
  ArrowUpDown, Pencil, RotateCcw, UserPlus, FilePlus, RefreshCw, Eye as EyeIcon,
  EyeOff, Image as ImageIcon, ChevronRight, Menu,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

/* ============================================================
   THEME TOKENS
============================================================ */
const C = {
  bg: "#0F1623",
  surface: "#1A2236",
  raised: "#212D42",
  border: "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.12)",
  text: "#F0F4FF",
  textSec: "#8B9DC3",
  textMuted: "#4A5C80",
  amber: "#F59E0B",
  green: "#10B981",
  red: "#EF4444",
  blue: "#3B82F6",
  purple: "#8B5CF6",
};

const fontCss = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
.font-display { font-family: 'Playfair Display', serif; letter-spacing: -0.01em; }
.font-sans { font-family: 'DM Sans', sans-serif; }
body, #root { font-family: 'DM Sans', sans-serif; background:${C.bg}; color:${C.text}; }
* { box-sizing: border-box; }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: ${C.bg}; }
::-webkit-scrollbar-thumb { background: ${C.raised}; border-radius: 8px; }
::-webkit-scrollbar-thumb:hover { background: #2c3a55; }
input, select, textarea { font-family: 'DM Sans', sans-serif; }
input:focus, select:focus, textarea:focus { outline: none; border-color: ${C.amber} !important; box-shadow: 0 0 0 3px rgba(245,158,11,0.12); }
.slide-in { animation: slideIn 0.28s cubic-bezier(0.16,1,0.3,1); }
@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
.fade-in { animation: fadeIn 0.2s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.toast-in { animation: toastIn 0.28s cubic-bezier(0.16,1,0.3,1); }
@keyframes toastIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
.row-hover:hover { background: #1C2640 !important; }
.lift:hover { transform: translateY(-2px); transition: transform 0.18s; }
.lift { transition: transform 0.18s, background 0.18s, border-color 0.18s; }
input[type=range]{ -webkit-appearance: none; height: 4px; background:${C.raised}; border-radius:9999px; }
input[type=range]::-webkit-slider-thumb{ -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:${C.amber}; cursor:pointer; box-shadow:0 0 0 4px rgba(245,158,11,0.18); }

/* Skeleton */
.sk { background: linear-gradient(90deg, ${C.raised} 0%, #2a3550 50%, ${C.raised} 100%); background-size: 200% 100%; animation: skShine 1.3s ease-in-out infinite; border-radius: 6px; }
@keyframes skShine { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* Responsive */
.app-sidebar { transform: translateX(0); transition: transform 0.25s ease; }
.app-main { margin-left: 240px; }
.slideover-panel { width: 440px; max-width: 100vw; }
.hamburger { display: none; }
.header-search { display: block; }

@media (max-width: 1024px) {
  .app-sidebar { transform: translateX(-100%); z-index: 70; box-shadow: 0 0 40px rgba(0,0,0,0.5); }
  .app-sidebar.open { transform: translateX(0); }
  .app-main { margin-left: 0 !important; }
  .hamburger { display: inline-flex; }
  .sb-backdrop { position: fixed; inset: 0; background: rgba(7,11,20,0.6); z-index: 65; }
}
@media (max-width: 768px) {
  .app-main main { padding: 16px !important; }
  .app-header { padding-left: 16px !important; padding-right: 16px !important; }
  .header-search { display: none; }
  .slideover-panel { width: 100vw; }
  .toast-stack { right: 12px !important; bottom: 12px !important; left: 12px !important; }
  .toast-stack > * { max-width: 100%; }
  table.tbl-resp { display: block; overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; }
  .grid-resp-2 { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
  .hide-sm { display: none !important; }
  .confirm-modal { width: calc(100vw - 24px) !important; }
}
@media (max-width: 480px) {
  .grid-resp-1 { grid-template-columns: 1fr !important; }
}
`;

/* ============================================================
   DATA
============================================================ */
const INSTITUTION = "Kwame Nkrumah University of Science and Technology";
const ABBR = "KNUST";

const departmentsSeed = [
  { id: 1, name: "Computer Science", code: "DCS", faculty: "Faculty of Computing", programmes: 1, students: 412, active: true },
  { id: 2, name: "Electrical Engineering", code: "DEE", faculty: "Faculty of Engineering", programmes: 1, students: 268, active: true },
  { id: 3, name: "Civil Engineering", code: "DCE", faculty: "Faculty of Engineering", programmes: 1, students: 201, active: true },
  { id: 4, name: "Business Administration", code: "DBA", faculty: "Faculty of Business", programmes: 1, students: 244, active: true },
  { id: 5, name: "Pharmacy", code: "DPH", faculty: "Faculty of Health Sciences", programmes: 1, students: 122, active: false },
];

const programmesSeed = [
  { id: 1, name: "BSc Computer Science", code: "BSCS", deptId: 1, duration: 4, students: 412, active: true },
  { id: 2, name: "BSc Electrical Engineering", code: "BSEE", deptId: 2, duration: 4, students: 268, active: true },
  { id: 3, name: "BSc Civil Engineering", code: "BSCE", deptId: 3, duration: 4, students: 201, active: true },
  { id: 4, name: "BBA Business Administration", code: "BBA", deptId: 4, duration: 3, students: 244, active: true },
  { id: 5, name: "BSc Pharmacy", code: "BSPH", deptId: 5, duration: 4, students: 122, active: true },
];

const lecturersSeed = [
  { id: 1, name: "Dr. Ama Owusu", staffId: "EMP-001", deptId: 1, active: true, courses: 3, sessions: 24, email: "a.owusu@knust.edu.gh", phone: "+233 24 000 0001" },
  { id: 2, name: "Dr. Kofi Asante", staffId: "EMP-002", deptId: 2, active: true, courses: 2, sessions: 18, email: "k.asante@knust.edu.gh", phone: "+233 24 000 0002" },
  { id: 3, name: "Prof. Akosua Mensah", staffId: "EMP-003", deptId: 3, active: true, courses: 2, sessions: 20, email: "a.mensah@knust.edu.gh", phone: "+233 24 000 0003" },
  { id: 4, name: "Dr. Yaw Darko", staffId: "EMP-004", deptId: 4, active: true, courses: 2, sessions: 15, email: "y.darko@knust.edu.gh", phone: "+233 24 000 0004" },
  { id: 5, name: "Dr. Abena Frimpong", staffId: "EMP-005", deptId: 5, active: false, courses: 1, sessions: 8, email: "a.frimpong@knust.edu.gh", phone: "+233 24 000 0005" },
  { id: 6, name: "Dr. Kweku Boateng", staffId: "EMP-006", deptId: 1, active: true, courses: 2, sessions: 22, email: "k.boateng@knust.edu.gh", phone: "+233 24 000 0006" },
];

const coursesSeed = [
  { id: 1, title: "Database Systems", code: "CS301", programmeId: 1, level: 300, semester: 1, credits: 3, lecturerId: 1, threshold: 75, active: true, avg: 78 },
  { id: 2, title: "Digital Circuits", code: "EE201", programmeId: 2, level: 200, semester: 1, credits: 3, lecturerId: 2, threshold: 75, active: true, avg: 81 },
  { id: 3, title: "Fluid Mechanics", code: "CE301", programmeId: 3, level: 300, semester: 2, credits: 3, lecturerId: 3, threshold: 75, active: true, avg: 72 },
  { id: 4, title: "Marketing Management", code: "BA201", programmeId: 4, level: 200, semester: 1, credits: 2, lecturerId: 4, threshold: 70, active: true, avg: 69 },
  { id: 5, title: "Organic Chemistry", code: "PH301", programmeId: 5, level: 300, semester: 1, credits: 3, lecturerId: 5, threshold: 75, active: false, avg: 58 },
  { id: 6, title: "Algorithms", code: "CS401", programmeId: 1, level: 400, semester: 1, credits: 3, lecturerId: 6, threshold: 80, active: true, avg: 84 },
];

const studentsSeed = [
  { id: 1, name: "Kwame Asante", studentId: "STU-0001", programmeId: 1, level: 300, status: "active", invitation: "Registered", attendance: 68, email: "k.asante.s@knust.edu.gh" },
  { id: 2, name: "Ama Boateng", studentId: "STU-0002", programmeId: 1, level: 300, status: "active", invitation: "Registered", attendance: 82, email: "a.boateng@knust.edu.gh" },
  { id: 3, name: "Kofi Mensah", studentId: "STU-0003", programmeId: 2, level: 200, status: "active", invitation: "Pending", attendance: 0, email: "k.mensah@knust.edu.gh" },
  { id: 4, name: "Akua Darko", studentId: "STU-0004", programmeId: 4, level: 200, status: "active", invitation: "Registered", attendance: 71, email: "a.darko@knust.edu.gh" },
  { id: 5, name: "Yaw Frimpong", studentId: "STU-0005", programmeId: 5, level: 300, status: "active", invitation: "Expired", attendance: 0, email: "y.frimpong@knust.edu.gh" },
  { id: 6, name: "Abena Owusu", studentId: "STU-0006", programmeId: 3, level: 300, status: "active", invitation: "Registered", attendance: 90, email: "a.owusu.s@knust.edu.gh" },
  { id: 7, name: "Kweku Boateng", studentId: "STU-0007", programmeId: 1, level: 400, status: "active", invitation: "Registered", attendance: 55, email: "k.boateng.s@knust.edu.gh" },
  { id: 8, name: "Adwoa Asiedu", studentId: "STU-0008", programmeId: 4, level: 200, status: "active", invitation: "Registered", attendance: 74, email: "a.asiedu@knust.edu.gh" },
];

const weeklyTrend = [
  { week: "W1", rate: 88, sessions: 22 },
  { week: "W2", rate: 84, sessions: 26 },
  { week: "W3", rate: 86, sessions: 28 },
  { week: "W4", rate: 81, sessions: 24 },
  { week: "W5", rate: 78, sessions: 30 },
  { week: "W6", rate: 82, sessions: 32 },
  { week: "W7", rate: 79, sessions: 29 },
  { week: "W8", rate: 76, sessions: 31 },
];

const deptRates = [
  { name: "Computer Science", rate: 84 },
  { name: "Electrical Eng.", rate: 79 },
  { name: "Civil Eng.", rate: 81 },
  { name: "Business Admin.", rate: 73 },
  { name: "Pharmacy", rate: 68 },
];

const recentActivity = [
  { type: "student_registered", text: "Ama Boateng completed registration", time: "12 min ago" },
  { type: "session_started", text: "Dr. Ama Owusu started CS301 session", time: "34 min ago" },
  { type: "threshold_alert", text: "Kweku Boateng dropped below 60% in CS401", time: "1 hr ago" },
  { type: "report_exported", text: "Defaulters report exported (PDF)", time: "2 hrs ago" },
  { type: "lecturer_added", text: "Dr. Kweku Boateng added to faculty", time: "3 hrs ago" },
  { type: "session_started", text: "Dr. Kofi Asante started EE201 session", time: "4 hrs ago" },
  { type: "student_registered", text: "Adwoa Asiedu completed registration", time: "5 hrs ago" },
  { type: "report_exported", text: "Per-Department report exported (Excel)", time: "Yesterday" },
];

const auditLog = [
  { action: "Manual Attendance Override", details: "Marked Kwame Asante present in CS301", by: "Admin", time: "2 hrs ago", ip: "10.0.12.4" },
  { action: "Student Suspended", details: "Account suspended: Ama Boateng (STU-0021)", by: "Admin", time: "1 day ago", ip: "10.0.12.4" },
  { action: "Course Created", details: "Database Systems (CS301) added", by: "Admin", time: "2 days ago", ip: "10.0.12.4" },
  { action: "Bulk Import", details: "142 students imported for BSc CS Level 100", by: "Admin", time: "3 days ago", ip: "10.0.12.4" },
  { action: "Lecturer Added", details: "Dr. Kweku Boateng (EMP-006) added to DCS", by: "Admin", time: "4 days ago", ip: "10.0.12.4" },
  { action: "Threshold Updated", details: "CS401 threshold changed 75% → 80%", by: "Admin", time: "5 days ago", ip: "10.0.12.4" },
  { action: "Report Exported", details: "Institution-wide attendance (PDF)", by: "Admin", time: "6 days ago", ip: "10.0.12.4" },
  { action: "Semester Activated", details: "2024/2025 — Semester 1 activated", by: "Admin", time: "1 week ago", ip: "10.0.12.4" },
];

const NAV: Array<{ section: string; items: Array<{ id: string; label: string; icon: any }> }> = [
  { section: "OVERVIEW", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  { section: "ACADEMICS", items: [
    { id: "departments", label: "Departments", icon: Building2 },
    { id: "programmes", label: "Programmes", icon: GraduationCap },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "years", label: "Academic Years", icon: Calendar },
  ]},
  { section: "USERS", items: [
    { id: "lecturers", label: "Lecturers", icon: Users },
    { id: "students", label: "Students", icon: UserCheck },
  ]},
  { section: "REPORTS", items: [{ id: "reports", label: "Reports & Analytics", icon: BarChart3 }] },
  { section: "SYSTEM", items: [
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "settings", label: "Settings", icon: Settings },
  ]},
];

/* ============================================================
   PRIMITIVES
============================================================ */
type ToastT = { id: number; type: "success" | "error" | "info" | "warning"; msg: string };

function Badge({ color, label }: { color: string; label: string }) {
  const bg = `${color}1F`;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
      style={{ background: bg, color: C.text, border: `1px solid ${color}33` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function Pill({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium"
      style={{ background: `${color}1A`, color, border: `1px solid ${color}33` }}>
      {label}
    </span>
  );
}

function Button({ children, variant = "primary", onClick, icon: Icon, disabled, title, full }:
  { children: ReactNode; variant?: "primary" | "secondary" | "danger" | "ghost"; onClick?: () => void; icon?: any; disabled?: boolean; title?: string; full?: boolean }) {
  const styles: Record<string, CSSProperties> = {
    primary: { background: C.amber, color: C.bg, border: "1px solid transparent" },
    secondary: { background: "transparent", color: C.text, border: `1px solid ${C.borderStrong}` },
    danger: { background: C.red, color: "#fff", border: "1px solid transparent" },
    ghost: { background: "transparent", color: C.textSec, border: "1px solid transparent" },
  };
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className={`inline-flex items-center justify-center gap-2 px-4 h-9 rounded-md text-sm font-semibold transition-all ${full ? "w-full" : ""} ${disabled ? "opacity-40 cursor-not-allowed" : "hover:brightness-110"}`}
      style={styles[variant]}>
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}

function IconBtn({ icon: Icon, onClick, color, title, disabled }:
  { icon: any; onClick?: () => void; color?: string; title?: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className={`w-8 h-8 rounded-md inline-flex items-center justify-center transition-colors ${disabled ? "opacity-30 cursor-not-allowed" : "hover:bg-white/5"}`}
      style={{ color: color || C.textSec }}>
      <Icon size={15} />
    </button>
  );
}

function Card({ children, className = "", topBorder, style }:
  { children: ReactNode; className?: string; topBorder?: string; style?: CSSProperties }) {
  return (
    <div className={className}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        borderTop: topBorder ? `3px solid ${topBorder}` : `1px solid ${C.border}`,
        ...style,
      }}>
      {children}
    </div>
  );
}

/* Skeleton primitives */
function Sk({ w = "100%", h = 12, r = 6, className = "", style }: { w?: number | string; h?: number | string; r?: number; className?: string; style?: CSSProperties }) {
  return <div className={`sk ${className}`} style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

function PageSkeleton({ variant = "table" }: { variant?: "table" | "dashboard" | "cards" | "form" }) {
  if (variant === "dashboard") {
    return (
      <div className="space-y-6 fade-in">
        <div className="flex items-end justify-between">
          <div className="space-y-2"><Sk w={220} h={22} /><Sk w={320} h={12} /></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3"><Sk w={80} h={10} /><Sk w={60} h={22} /><Sk w={90} h={10} /></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-5 space-y-3"><Sk w={180} h={14} /><Sk w="100%" h={240} /></Card>
          <Card className="p-5 space-y-3"><Sk w={140} h={14} /><Sk w="100%" h={240} /></Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-5 space-y-3"><Sk w={160} h={14} />{Array.from({length:5}).map((_,i)=><Sk key={i} h={14} />)}</Card>
          <Card className="p-5 space-y-3"><Sk w={160} h={14} />{Array.from({length:5}).map((_,i)=><Sk key={i} h={14} />)}</Card>
        </div>
      </div>
    );
  }
  if (variant === "cards") {
    return (
      <div className="space-y-6 fade-in">
        <div className="flex items-center justify-between"><Sk w={200} h={20} /><Sk w={120} h={36} /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-3">
              <div className="flex items-center gap-3"><Sk w={44} h={44} r={22} /><div className="flex-1 space-y-2"><Sk w="70%" h={14} /><Sk w="50%" h={10} /></div></div>
              <Sk h={10} /><Sk h={10} w="80%" />
              <div className="grid grid-cols-2 gap-3 pt-3"><Sk h={40} /><Sk h={40} /></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  if (variant === "form") {
    return (
      <div className="space-y-6 fade-in max-w-3xl">
        <Sk w={240} h={20} />
        <Card className="p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2"><Sk w={120} h={10} /><Sk h={40} /></div>
          ))}
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3"><Sk w={200} h={20} /><Sk w={120} h={36} /></div>
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap gap-3"><Sk w={220} h={36} /><Sk w={140} h={36} /><Sk w={140} h={36} /></div>
      </Card>
      <Card className="p-0">
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 hide-sm">{Array.from({length:4}).map((_,i)=><Sk key={i} h={12} />)}</div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-3"><Sk h={16} /><Sk h={16} /><Sk h={16} /><Sk h={16} /></div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", error, maxLength, ...rest }: any) {
  return (
    <input
      type={type} value={value ?? ""} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} maxLength={maxLength}
      className="w-full h-10 px-3 rounded-md text-sm"
      style={{ background: C.bg, border: `1px solid ${error ? C.red : C.borderStrong}`, color: C.text }}
      {...rest}
    />
  );
}

function Select({ value, onChange, children, placeholder }: any) {
  return (
    <select value={value ?? ""} onChange={(e) => onChange?.(e.target.value)}
      className="w-full h-10 px-3 rounded-md text-sm appearance-none cursor-pointer"
      style={{
        background: `${C.bg} url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238B9DC3' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>") no-repeat right 10px center`,
        border: `1px solid ${C.borderStrong}`, color: C.text, paddingRight: 28,
      }}>
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  );
}

function Field({ label, required, children, error, hint }:
  { label: string; required?: boolean; children: ReactNode; error?: string; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium" style={{ color: C.textSec }}>
        {label}{required && <span style={{ color: C.amber }}> *</span>}
      </label>
      {children}
      {error && <p className="text-xs" style={{ color: C.red }}>{error}</p>}
      {hint && !error && <p className="text-xs" style={{ color: C.textMuted }}>{hint}</p>}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="relative w-10 h-6 rounded-full transition-colors"
      style={{ background: value ? C.green : C.raised }}>
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
        style={{ left: value ? 18 : 2 }} />
    </button>
  );
}

/* ============================================================
   CHART HELPERS
============================================================ */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.raised, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
      {label && <div className="text-[11px] mb-1.5" style={{ color: C.textMuted }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs" style={{ color: C.text }}>
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span style={{ color: C.textSec }}>{p.name}:</span>
          <span className="font-semibold">{p.value}{p.unit || ""}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   SLIDE-OVER
============================================================ */
function SlideOver({ open, onClose, title, subtitle, children, footer }:
  { open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 fade-in">
      <div className="absolute inset-0" style={{ background: "rgba(7,11,20,0.7)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div className="slideover-panel absolute right-0 top-0 h-full slide-in flex flex-col"
        style={{ background: C.surface, borderLeft: `1px solid ${C.border}` }}>
        <div className="px-6 py-5 flex items-start justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div>
            <h3 className="text-base font-semibold" style={{ color: C.text }}>{title}</h3>
            {subtitle && <p className="text-xs mt-0.5" style={{ color: C.textSec }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-white/5 inline-flex items-center justify-center" style={{ color: C.textSec }}>
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 flex flex-wrap items-center justify-end gap-3" style={{ borderTop: `1px solid ${C.border}` }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ============================================================
   MAIN APP
============================================================ */
type Setup = {
  name: string; shortCode: string; tagline: string; logo: string | null;
  primary: string; country: string; timezone: string;
  adminName: string; adminEmail: string; academicYear: string; semester: string;
};
const DEFAULT_SETUP: Setup = {
  name: "Kwame Nkrumah University of Science & Technology",
  shortCode: "KNUST", tagline: "Smart Attendance · Admin", logo: null,
  primary: "#F59E0B", country: "Ghana", timezone: "Africa/Accra",
  adminName: "System Admin", adminEmail: "admin@knust.edu.gh",
  academicYear: "2024/2025", semester: "Semester 1",
};

export default function AdminApp() {
  const [setup, setSetup] = useState<Setup | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem("knust_setup");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [authed, setAuthed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("knust_admin_authed") === "1";
  });
  const [view, setView] = useState("dashboard");
  const [toasts, setToasts] = useState<ToastT[]>([]);
  const [slide, setSlide] = useState<{ type: string; data?: any } | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; body: string; danger?: boolean; requireType?: boolean; onConfirm: () => void } | null>(null);
  const [filterCtx, setFilterCtx] = useState<{ programmeId?: number; lecturerId?: number; deptId?: number; courseId?: number } | null>(null);
  const [sbOpen, setSbOpen] = useState(false);
  const [loading, setLoading] = useState(true);



  // mutable lists
  const [departments, setDepartments] = useState(departmentsSeed);
  const [programmes, setProgrammes] = useState(programmesSeed);
  const [lecturers, setLecturers] = useState(lecturersSeed);
  const [courses, setCourses] = useState(coursesSeed);
  const [students, setStudents] = useState(studentsSeed);

  // Per-view skeleton: re-trigger on navigation
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(t);
  }, [view]);

  const toast = (type: ToastT["type"], msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, msg }].slice(-3));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };

  const navigate = (id: string, ctx?: any) => {
    setView(id);
    setFilterCtx(ctx || null);
    setSlide(null);
    setSbOpen(false);
  };

  const handleLogin = (email: string) => {
    window.localStorage.setItem("knust_admin_authed", "1");
    setAuthed(true);
    setView("dashboard");
    setTimeout(() => toast("success", `Welcome back, ${email.split("@")[0]}`), 50);
  };

  const handleLogout = () => {
    setConfirm({
      title: "Sign out of admin panel?",
      body: "You'll need to sign back in to manage attendance, users, and reports.",
      onConfirm: () => {
        window.localStorage.removeItem("knust_admin_authed");
        setAuthed(false);
        setConfirm(null);
        setView("dashboard");
      },
    });
  };

  const skeletonVariant: Record<string, "table" | "dashboard" | "cards" | "form"> = {
    dashboard: "dashboard", lecturers: "cards", settings: "form", notifications: "table",
  };

  const completeSetup = (s: Setup) => {
    window.localStorage.setItem("knust_setup", JSON.stringify(s));
    setSetup(s);
    setTimeout(() => toast("success", `${s.shortCode || s.name} is ready. Please sign in.`), 50);
  };

  if (!setup) {
    return (
      <>
        <style>{fontCss}</style>
        <SetupWizard initial={DEFAULT_SETUP} onComplete={completeSetup} />
        <div className="toast-stack fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
          {toasts.map((t) => <Toast key={t.id} t={t} />)}
        </div>
      </>
    );
  }

  if (!authed) {
    return (
      <>
        <style>{fontCss}</style>
        <LoginScreen onLogin={handleLogin} setup={setup} />
        <div className="toast-stack fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
          {toasts.map((t) => <Toast key={t.id} t={t} />)}
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: C.bg, color: C.text }}>
      <style>{fontCss}</style>

      {sbOpen && <div className="sb-backdrop" onClick={() => setSbOpen(false)} />}
      <Sidebar view={view} onNavigate={(id) => navigate(id)} open={sbOpen} onLogout={handleLogout} setup={setup} />



      <div className="app-main flex-1 flex flex-col min-w-0">
        <Header view={view} onMenu={() => setSbOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {loading ? (
            <PageSkeleton variant={skeletonVariant[view] || "table"} />
          ) : (
            <>
              {view === "dashboard" && <Dashboard onNav={navigate} />}
              {view === "departments" && <DepartmentsView
                departments={departments} setDepartments={setDepartments}
                openSlide={setSlide} confirm={setConfirm} toast={toast} onNav={navigate} />}
              {view === "programmes" && <ProgrammesView
                programmes={programmes} setProgrammes={setProgrammes} departments={departments}
                ctx={filterCtx} openSlide={setSlide} confirm={setConfirm} toast={toast} onNav={navigate} />}
              {view === "courses" && <CoursesView
                courses={courses} setCourses={setCourses} programmes={programmes} lecturers={lecturers}
                ctx={filterCtx} openSlide={setSlide} confirm={setConfirm} toast={toast} onNav={navigate} />}
              {view === "years" && <AcademicYearsView openSlide={setSlide} confirm={setConfirm} toast={toast} />}
              {view === "lecturers" && <LecturersView
                lecturers={lecturers} setLecturers={setLecturers} departments={departments} courses={courses}
                openSlide={setSlide} confirm={setConfirm} toast={toast} onNav={navigate} />}
              {view === "students" && <StudentsView
                students={students} setStudents={setStudents} programmes={programmes} courses={courses}
                ctx={filterCtx} openSlide={setSlide} confirm={setConfirm} toast={toast} onNav={navigate} />}
              {view === "reports" && <ReportsView toast={toast} confirm={setConfirm} students={students} programmes={programmes} courses={courses} />}
              {view === "notifications" && <NotificationsView toast={toast} />}
              {view === "settings" && <SettingsView toast={toast} />}
            </>
          )}
        </main>
      </div>

      {/* SLIDE-OVERS */}
      <SlideRouter slide={slide} setSlide={setSlide} toast={toast}
        departments={departments} setDepartments={setDepartments}
        programmes={programmes} setProgrammes={setProgrammes}
        lecturers={lecturers} setLecturers={setLecturers}
        courses={courses} setCourses={setCourses}
        students={students} setStudents={setStudents}
      />

      {/* CONFIRM */}
      {confirm && <ConfirmModal {...confirm} onClose={() => setConfirm(null)} />}

      {/* TOASTS */}
      <div className="toast-stack fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
        {toasts.map((t) => <Toast key={t.id} t={t} />)}
      </div>
    </div>
  );
}

/* ============================================================
   SIDEBAR & HEADER
============================================================ */
function Sidebar({ view, onNavigate, open, onLogout, setup }: { view: string; onNavigate: (id: string) => void; open?: boolean; onLogout?: () => void; setup?: Setup }) {
  const accent = setup?.primary || C.amber;
  const shortCode = setup?.shortCode || "KNUST";
  return (
    <aside className={`app-sidebar ${open ? "open" : ""} fixed left-0 top-0 h-full flex flex-col`} style={{ width: 240, background: C.surface, borderRight: `1px solid ${C.border}` }}>
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md flex items-center justify-center overflow-hidden" style={{ background: `${accent}1A`, border: `1px solid ${accent}33` }}>
            {setup?.logo ? <img src={setup.logo} alt="" className="w-full h-full object-cover" /> : <GraduationCap size={18} style={{ color: accent }} />}
          </div>
          <div className="min-w-0">
            <div className="font-display text-xl leading-none truncate" style={{ color: C.text }}>{shortCode}</div>
            <div className="text-[10px] uppercase tracking-[0.14em] mt-1" style={{ color: C.textSec }}>Admin Panel</div>
          </div>
        </div>
      </div>


      <nav className="flex-1 overflow-y-auto py-4">
        {NAV.map((sec) => (
          <div key={sec.section} className="mb-5">
            <div className="px-5 mb-2 text-[10px] font-semibold tracking-[0.16em]" style={{ color: C.textMuted }}>
              {sec.section}
            </div>
            {sec.items.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button key={item.id} onClick={() => onNavigate(item.id)}
                  className="w-full flex items-center gap-3 pl-5 pr-4 h-10 text-sm font-medium transition-colors lift"
                  style={{
                    color: active ? C.text : C.textSec,
                    background: active ? C.raised : "transparent",
                    borderLeft: `3px solid ${active ? C.amber : "transparent"}`,
                    paddingLeft: active ? 17 : 20,
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = C.raised; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                  <Icon size={16} style={{ color: active ? C.amber : C.textSec }} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-4" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-3 p-2 rounded-md" style={{ background: C.raised }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
            style={{ background: accent, color: C.bg }}>{(setup?.adminName || "SA").split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase()}</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: C.text }}>{setup?.adminName || "System Admin"}</div>
            <div className="text-[10px] truncate" style={{ color: C.textSec }}>{setup?.adminEmail || "admin@knust.edu.gh"}</div>
          </div>

          <button onClick={onLogout} className="w-7 h-7 rounded hover:bg-white/5 flex items-center justify-center" style={{ color: C.textSec }} title="Logout">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

const VIEW_TITLES: Record<string, { t: string; s?: string }> = {
  dashboard: { t: "Dashboard", s: "Overview" },
  departments: { t: "Departments", s: "Academics · Departments" },
  programmes: { t: "Programmes", s: "Academics · Programmes" },
  courses: { t: "Courses", s: "Academics · Courses" },
  years: { t: "Academic Years", s: "Academics · Calendar" },
  lecturers: { t: "Lecturers", s: "Users · Faculty" },
  students: { t: "Students", s: "Users · Students" },
  reports: { t: "Reports & Analytics", s: "Insights" },
  notifications: { t: "Notifications", s: "System" },
  settings: { t: "Settings", s: "System" },
};

function Header({ view, onMenu }: { view: string; onMenu?: () => void }) {
  const info = VIEW_TITLES[view] || { t: view };
  return (
    <header className="app-header flex items-center justify-between px-4 sm:px-8 gap-3" style={{ height: 64, background: C.surface, borderBottom: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenu} className="hamburger w-9 h-9 rounded-md items-center justify-center hover:bg-white/5 shrink-0" style={{ color: C.textSec, border: `1px solid ${C.borderStrong}` }} aria-label="Open menu">
          <Menu size={16} />
        </button>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.14em] truncate" style={{ color: C.textMuted }}>{info.s}</div>
          <div className="text-sm font-semibold truncate" style={{ color: C.text }}>{info.t}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="header-search relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
          <input placeholder="Search anywhere…" className="h-9 pl-9 pr-3 rounded-md text-sm w-48 md:w-72"
            style={{ background: C.bg, border: `1px solid ${C.borderStrong}`, color: C.text }} />
        </div>
        <button className="w-9 h-9 rounded-md flex items-center justify-center relative hover:bg-white/5 shrink-0" style={{ color: C.textSec, border: `1px solid ${C.borderStrong}` }}>
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: C.amber }} />
        </button>
      </div>
    </header>
  );
}

/* ============================================================
   DASHBOARD
============================================================ */
function Dashboard({ onNav }: { onNav: (id: string, ctx?: any) => void }) {
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const stats = [
    { label: "Total Students", value: "1,247", icon: UserCheck, color: C.amber, trend: "+24 this week", up: true },
    { label: "Total Lecturers", value: "48", icon: Users, color: C.blue, trend: "+2 this week", up: true },
    { label: "Active Courses", value: "32", icon: BookOpen, color: C.green, trend: "+1 this week", up: true },
    { label: "Departments", value: "5", icon: Building2, color: C.purple, trend: "No change", up: true },
    { label: "Sessions Today", value: "7", icon: Calendar, color: C.amber, trend: "+3 vs yesterday", up: true },
    { label: "Below Threshold", value: "63", icon: ShieldAlert, color: C.red, trend: "-2 this week", up: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: C.text }}>Good morning, Admin</h1>
          <p className="text-sm mt-1" style={{ color: C.textSec }}>{today} · {INSTITUTION}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} topBorder={s.color} className="p-4 lift cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="text-[11px] uppercase tracking-wider" style={{ color: C.textSec }}>{s.label}</div>
                <Icon size={16} style={{ color: s.color }} />
              </div>
              <div className="text-2xl font-semibold mt-3" style={{ color: C.text }}>{s.value}</div>
              <div className="flex items-center gap-1 mt-2 text-[11px]" style={{ color: s.up ? C.green : C.red }}>
                {s.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                <span>{s.trend}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Row 2: trend + donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: C.text }}>Weekly Attendance Trend</h3>
              <p className="text-xs" style={{ color: C.textSec }}>Last 8 weeks · Average % and sessions conducted</p>
            </div>
            <div className="flex items-center gap-4 text-[11px]" style={{ color: C.textSec }}>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: C.amber }} />Avg %</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: C.blue }} />Sessions</span>
            </div>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="week" stroke={C.textMuted} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="l" stroke={C.textMuted} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="r" orientation="right" stroke={C.textMuted} tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Line yAxisId="l" type="monotone" dataKey="rate" name="Avg %" stroke={C.amber} strokeWidth={2} dot={{ r: 3, fill: C.amber }} />
                <Line yAxisId="r" type="monotone" dataKey="sessions" name="Sessions" stroke={C.blue} strokeWidth={2} dot={{ r: 3, fill: C.blue }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold" style={{ color: C.text }}>Present vs Absent Today</h3>
          <p className="text-xs mb-3" style={{ color: C.textSec }}>Across all live sessions</p>
          <div style={{ height: 200, position: "relative" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={[{ name: "Present", value: 847 }, { name: "Absent", value: 134 }]}
                  innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                  <Cell fill={C.green} /><Cell fill={C.red} />
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-[10px] uppercase tracking-wider" style={{ color: C.textMuted }}>Total</div>
              <div className="text-2xl font-semibold" style={{ color: C.text }}>981</div>
            </div>
          </div>
          <div className="flex items-center justify-around pt-3 mt-3" style={{ borderTop: `1px solid ${C.border}` }}>
            <div className="text-center">
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: C.textSec }}>
                <span className="w-2 h-2 rounded-full" style={{ background: C.green }} />Present
              </div>
              <div className="text-lg font-semibold mt-1" style={{ color: C.text }}>847</div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: C.textSec }}>
                <span className="w-2 h-2 rounded-full" style={{ background: C.red }} />Absent
              </div>
              <div className="text-lg font-semibold mt-1" style={{ color: C.text }}>134</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-1" style={{ color: C.text }}>Attendance Rate by Department</h3>
          <p className="text-xs mb-4" style={{ color: C.textSec }}>Current semester</p>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={deptRates} layout="vertical" margin={{ top: 0, right: 20, left: 90, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" stroke={C.textMuted} tick={{ fontSize: 11 }} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" stroke={C.textMuted} tick={{ fontSize: 11 }} width={90} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="rate" fill={C.amber} radius={[0, 4, 4, 0]} background={{ fill: C.raised, radius: 4 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: C.text }}>Top 5 Courses with Lowest Attendance</h3>
            <button onClick={() => onNav("reports")} className="text-xs flex items-center gap-1" style={{ color: C.amber }}>
              See report <ArrowRight size={11} />
            </button>
          </div>
          <table className="w-full text-sm tbl-resp">
            <thead>
              <tr style={{ color: C.textMuted }} className="text-[10px] uppercase tracking-wider">
                <th className="text-left py-2 font-medium">Course</th>
                <th className="text-left py-2 font-medium">Programme</th>
                <th className="text-right py-2 font-medium">Rate</th>
                <th className="text-right py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { c: "Organic Chemistry", p: "BSc Pharmacy", r: 58, s: "critical" },
                { c: "Marketing Mgmt", p: "BBA", r: 69, s: "warning" },
                { c: "Fluid Mechanics", p: "BSc Civil Eng.", r: 72, s: "warning" },
                { c: "Database Systems", p: "BSc CS", r: 78, s: "ok" },
                { c: "Digital Circuits", p: "BSc EE", r: 81, s: "ok" },
              ].map((r, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${C.border}` }} className="row-hover">
                  <td className="py-2.5 font-medium" style={{ color: C.text }}>{r.c}</td>
                  <td className="py-2.5" style={{ color: C.textSec }}>{r.p}</td>
                  <td className="py-2.5 text-right font-semibold" style={{ color: r.r < 60 ? C.red : r.r < 75 ? C.amber : C.green }}>{r.r}%</td>
                  <td className="py-2.5 text-right">
                    {r.s === "critical" ? <Badge color={C.red} label="Critical" /> : r.s === "warning" ? <Badge color={C.amber} label="Warning" /> : <Badge color={C.green} label="On track" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Row 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: C.text }}>Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((a, i) => {
              const map: Record<string, { c: string; i: any }> = {
                student_registered: { c: C.green, i: UserCheck },
                session_started: { c: C.amber, i: Clock },
                report_exported: { c: C.blue, i: FileText },
                threshold_alert: { c: C.red, i: AlertTriangle },
                lecturer_added: { c: C.purple, i: UserPlus },
              };
              const m = map[a.type];
              const Icon = m.i;
              return (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: m.c }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm" style={{ color: C.text }}>{a.text}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>{a.time}</div>
                  </div>
                  <Icon size={13} style={{ color: m.c }} className="mt-1.5" />
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: C.text }}>Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: "Add Lecturer", d: "Invite faculty to platform", i: UserPlus, go: "lecturers" },
              { l: "Add Student", d: "Register new learner", i: UserCheck, go: "students" },
              { l: "Create Course", d: "Open a new module", i: BookOpen, go: "courses" },
              { l: "View Reports", d: "Analytics & exports", i: BarChart3, go: "reports" },
            ].map((q, i) => {
              const Icon = q.i;
              return (
                <button key={i} onClick={() => onNav(q.go)} className="text-left p-4 rounded-lg lift"
                  style={{ background: C.raised, border: `1px solid ${C.border}` }}>
                  <div className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
                    style={{ background: `${C.amber}1A`, color: C.amber }}>
                    <Icon size={16} />
                  </div>
                  <div className="text-sm font-semibold" style={{ color: C.text }}>{q.l}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: C.textSec }}>{q.d}</div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   TABLE HELPERS
============================================================ */
function TH({ children, onClick, sortDir }: { children: ReactNode; onClick?: () => void; sortDir?: "asc" | "desc" | null }) {
  return (
    <th onClick={onClick} className={`text-left px-4 py-3 text-[10px] uppercase tracking-wider font-semibold ${onClick ? "cursor-pointer select-none" : ""}`}
      style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>
      <span className="inline-flex items-center gap-1">
        {children}
        {onClick && (sortDir === "asc" ? <ChevronUp size={11} /> : sortDir === "desc" ? <ChevronDown size={11} /> : <ArrowUpDown size={10} style={{ opacity: 0.5 }} />)}
      </span>
    </th>
  );
}

function ScreenHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <div className="flex items-center gap-1.5 text-[11px] mb-1" style={{ color: C.textMuted }}>
          <span>Admin</span><ChevronRight size={11} /><span style={{ color: C.textSec }}>{title}</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: C.text }}>{title}</h1>
        {sub && <p className="text-xs mt-0.5" style={{ color: C.textSec }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon, title, body, action }: { icon: any; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: C.raised, border: `1px solid ${C.border}` }}>
        <Icon size={24} style={{ color: C.textSec }} />
      </div>
      <h3 className="text-base font-semibold" style={{ color: C.text }}>{title}</h3>
      <p className="text-sm mt-1 max-w-sm" style={{ color: C.textSec }}>{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ============================================================
   DEPARTMENTS
============================================================ */
function DepartmentsView({ departments, setDepartments, openSlide, confirm, toast, onNav }: any) {
  const [q, setQ] = useState("");
  const filtered = departments.filter((d: any) => d.name.toLowerCase().includes(q.toLowerCase()) || d.code.toLowerCase().includes(q.toLowerCase()));
  const active = departments.filter((d: any) => d.active).length;
  const inactive = departments.length - active;

  return (
    <div>
      <ScreenHeader title="Departments" sub="Manage academic departments and faculties"
        action={<Button icon={Plus} onClick={() => openSlide({ type: "department" })}>Add Department</Button>} />

      <div className="flex items-center gap-2 mb-4">
        <Pill color={C.blue} label={`Total: ${departments.length}`} />
        <Pill color={C.green} label={`Active: ${active}`} />
        <Pill color={C.textMuted} label={`Inactive: ${inactive}`} />
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search departments…"
              className="w-full h-9 pl-9 pr-3 rounded-md text-sm"
              style={{ background: C.bg, border: `1px solid ${C.borderStrong}`, color: C.text }} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Building2} title="No departments yet" body="Create your first department to start organising programmes and courses."
            action={<Button icon={Plus} onClick={() => openSlide({ type: "department" })}>Add Department</Button>} />
        ) : (
          <table className="w-full text-sm tbl-resp">
            <thead style={{ background: C.surface, position: "sticky", top: 0 }}>
              <tr>
                <TH>Department</TH><TH>Code</TH><TH>Faculty</TH><TH>Programmes</TH><TH>Students</TH><TH>Status</TH>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d: any, i: number) => (
                <tr key={d.id} className="row-hover" style={{ background: i % 2 ? "#1C2640" : C.surface }}>
                  <td className="px-4 py-3 font-medium" style={{ color: C.text }}>{d.name}</td>
                  <td className="px-4 py-3" style={{ color: C.textSec }}>{d.code}</td>
                  <td className="px-4 py-3" style={{ color: C.textSec }}>{d.faculty}</td>
                  <td className="px-4 py-3" style={{ color: C.text }}>{d.programmes}</td>
                  <td className="px-4 py-3" style={{ color: C.text }}>{d.students}</td>
                  <td className="px-4 py-3">{d.active ? <Badge color={C.green} label="Active" /> : <Badge color={C.textMuted} label="Inactive" />}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn icon={Pencil} title="Edit" onClick={() => openSlide({ type: "department", data: d })} />
                      <IconBtn icon={Power} title="Toggle status" color={d.active ? C.green : C.textMuted}
                        onClick={() => { setDepartments(departments.map((x: any) => x.id === d.id ? { ...x, active: !x.active } : x)); toast("success", `${d.name} ${d.active ? "deactivated" : "activated"}`); }} />
                      <IconBtn icon={Eye} title="View Programmes" onClick={() => onNav("programmes", { deptId: d.id })} />
                      <IconBtn icon={Trash2} title={d.programmes > 0 ? "Remove programmes first" : "Delete"} color={C.red}
                        disabled={d.programmes > 0}
                        onClick={() => confirm({ title: "Delete department?", body: `This will permanently remove ${d.name}. This cannot be undone.`, danger: true,
                          onConfirm: () => { setDepartments(departments.filter((x: any) => x.id !== d.id)); toast("success", "Department deleted"); } })} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

/* ============================================================
   PROGRAMMES
============================================================ */
function ProgrammesView({ programmes, setProgrammes, departments, ctx, openSlide, confirm, toast, onNav }: any) {
  const [deptId, setDeptId] = useState<string>(ctx?.deptId ? String(ctx.deptId) : "");
  const filtered = programmes.filter((p: any) => !deptId || String(p.deptId) === deptId);

  return (
    <div>
      <ScreenHeader title="Programmes" sub="Manage degree programmes per department"
        action={<Button icon={Plus} onClick={() => openSlide({ type: "programme" })}>Add Programme</Button>} />

      <Card className="overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="w-56">
            <Select value={deptId} onChange={setDeptId} placeholder="All Departments">
              {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>
          {deptId && <button onClick={() => setDeptId("")} className="text-xs" style={{ color: C.amber }}>Clear filter</button>}
        </div>

        <table className="w-full text-sm tbl-resp">
          <thead>
            <tr>
              <TH>Programme</TH><TH>Code</TH><TH>Department</TH><TH>Duration</TH><TH>Levels</TH><TH>Students</TH><TH>Status</TH>
              <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p: any, i: number) => {
              const dept = departments.find((d: any) => d.id === p.deptId);
              const levels = Array.from({ length: p.duration }, (_, k) => `L${(k + 1) * 100}`);
              return (
                <tr key={p.id} className="row-hover" style={{ background: i % 2 ? "#1C2640" : C.surface }}>
                  <td className="px-4 py-3 font-medium" style={{ color: C.text }}>{p.name}</td>
                  <td className="px-4 py-3" style={{ color: C.textSec }}>{p.code}</td>
                  <td className="px-4 py-3" style={{ color: C.textSec }}>{dept?.name}</td>
                  <td className="px-4 py-3" style={{ color: C.text }}>{p.duration} Years</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">{levels.map((l) => <Pill key={l} color={C.blue} label={l} />)}</div>
                  </td>
                  <td className="px-4 py-3" style={{ color: C.text }}>{p.students}</td>
                  <td className="px-4 py-3">{p.active ? <Badge color={C.green} label="Active" /> : <Badge color={C.textMuted} label="Archived" />}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn icon={Pencil} title="Edit" onClick={() => openSlide({ type: "programme", data: p })} />
                      <IconBtn icon={UserCheck} title="View Students" onClick={() => onNav("students", { programmeId: p.id })} />
                      <IconBtn icon={BookOpen} title="View Courses" onClick={() => onNav("courses", { programmeId: p.id })} />
                      <IconBtn icon={Power} title="Archive" onClick={() => { setProgrammes(programmes.map((x: any) => x.id === p.id ? { ...x, active: !x.active } : x)); toast("info", "Status updated"); }} />
                      <IconBtn icon={Trash2} color={C.red} title="Delete"
                        onClick={() => confirm({ title: "Delete programme?", body: `Permanently remove ${p.name}?`, danger: true,
                          onConfirm: () => { setProgrammes(programmes.filter((x: any) => x.id !== p.id)); toast("success", "Programme deleted"); } })} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ============================================================
   COURSES
============================================================ */
function CoursesView({ courses, setCourses, programmes, lecturers, ctx, openSlide, confirm, toast, onNav }: any) {
  const [q, setQ] = useState("");
  const [pid, setPid] = useState<string>(ctx?.programmeId ? String(ctx.programmeId) : "");
  const [lvl, setLvl] = useState("");
  const [sem, setSem] = useState("");
  const [status, setStatus] = useState("");
  const [lid] = useState<string>(ctx?.lecturerId ? String(ctx.lecturerId) : "");

  const filtered = courses.filter((c: any) => {
    if (q && !c.title.toLowerCase().includes(q.toLowerCase()) && !c.code.toLowerCase().includes(q.toLowerCase())) return false;
    if (pid && String(c.programmeId) !== pid) return false;
    if (lvl && String(c.level) !== lvl) return false;
    if (sem && String(c.semester) !== sem) return false;
    if (status === "active" && !c.active) return false;
    if (status === "inactive" && c.active) return false;
    if (lid && String(c.lecturerId) !== lid) return false;
    return true;
  });

  const thColor = (t: number) => t >= 75 ? C.green : t >= 60 ? C.amber : C.red;

  return (
    <div>
      <ScreenHeader title="Courses" sub="All offered courses across programmes"
        action={<Button icon={Plus} onClick={() => openSlide({ type: "course" })}>Add Course</Button>} />

      <Card className="overflow-hidden">
        <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses…"
              className="w-full h-10 pl-9 pr-3 rounded-md text-sm" style={{ background: C.bg, border: `1px solid ${C.borderStrong}`, color: C.text }} />
          </div>
          <Select value={pid} onChange={setPid} placeholder="All Programmes">
            {programmes.map((p: any) => <option key={p.id} value={p.id}>{p.code}</option>)}
          </Select>
          <Select value={lvl} onChange={setLvl} placeholder="All Levels">
            {[100, 200, 300, 400].map((l) => <option key={l} value={l}>Level {l}</option>)}
          </Select>
          <Select value={sem} onChange={setSem} placeholder="All Semesters">
            <option value="1">First Semester</option><option value="2">Second Semester</option>
          </Select>
          <Select value={status} onChange={setStatus} placeholder="All Statuses">
            <option value="active">Active</option><option value="inactive">Inactive</option>
          </Select>
        </div>

        <table className="w-full text-sm tbl-resp">
          <thead>
            <tr>
              <TH>Course</TH><TH>Code</TH><TH>Programme</TH><TH>Level</TH><TH>Sem</TH><TH>Credits</TH><TH>Lecturer</TH><TH>Threshold</TH><TH>Status</TH>
              <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c: any, i: number) => {
              const prog = programmes.find((p: any) => p.id === c.programmeId);
              const lec = lecturers.find((l: any) => l.id === c.lecturerId);
              return (
                <tr key={c.id} className="row-hover" style={{ background: i % 2 ? "#1C2640" : C.surface }}>
                  <td className="px-4 py-3 font-medium" style={{ color: C.text }}>{c.title}</td>
                  <td className="px-4 py-3" style={{ color: C.textSec }}>{c.code}</td>
                  <td className="px-4 py-3" style={{ color: C.textSec }}>{prog?.code}</td>
                  <td className="px-4 py-3" style={{ color: C.text }}>L{c.level}</td>
                  <td className="px-4 py-3" style={{ color: C.text }}>S{c.semester}</td>
                  <td className="px-4 py-3" style={{ color: C.text }}>{c.credits}</td>
                  <td className="px-4 py-3" style={{ color: C.textSec }}>{lec?.name}</td>
                  <td className="px-4 py-3"><Pill color={thColor(c.threshold)} label={`${c.threshold}%`} /></td>
                  <td className="px-4 py-3">{c.active ? <Badge color={C.green} label="Active" /> : <Badge color={C.textMuted} label="Inactive" />}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn icon={Pencil} title="Edit" onClick={() => openSlide({ type: "course", data: c })} />
                      <IconBtn icon={UserCheck} title="View Students" onClick={() => onNav("students", { courseId: c.id })} />
                      <IconBtn icon={Clock} title="Attendance History" onClick={() => toast("info", "Opening attendance history…")} />
                      <IconBtn icon={Copy} title="Clone" onClick={() => openSlide({ type: "clone-course", data: c })} />
                      <IconBtn icon={Power} title="Toggle" onClick={() => { setCourses(courses.map((x: any) => x.id === c.id ? { ...x, active: !x.active } : x)); toast("info", "Status updated"); }} />
                      <IconBtn icon={Trash2} color={C.red} title="Delete"
                        onClick={() => confirm({ title: "Delete course?", body: `Permanently delete ${c.title}? Attendance records will remain in the archive.`, danger: true,
                          onConfirm: () => { setCourses(courses.filter((x: any) => x.id !== c.id)); toast("success", "Course deleted"); } })} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ============================================================
   ACADEMIC YEARS
============================================================ */
function AcademicYearsView({ openSlide, confirm, toast }: any) {
  const years = [
    { year: "2024/2025", active: true, semesters: [
      { n: 1, start: "Sep 2, 2024", end: "Dec 20, 2024", status: "Active" },
      { n: 2, start: "Jan 13, 2025", end: "May 9, 2025", status: "Scheduled" },
    ]},
    { year: "2023/2024", active: false, semesters: [
      { n: 1, start: "Sep 4, 2023", end: "Dec 22, 2023", status: "Closed" },
      { n: 2, start: "Jan 15, 2024", end: "May 10, 2024", status: "Closed" },
    ]},
    { year: "2022/2023", active: false, semesters: [
      { n: 1, start: "Sep 5, 2022", end: "Dec 23, 2022", status: "Closed" },
      { n: 2, start: "Jan 16, 2023", end: "May 12, 2023", status: "Closed" },
    ]},
  ];

  return (
    <div>
      <ScreenHeader title="Academic Years & Semesters" sub="Manage academic calendar and active periods"
        action={<Button icon={Plus} onClick={() => openSlide({ type: "year" })}>New Academic Year</Button>} />

      <Card className="p-5 mb-5" style={{ borderLeft: `3px solid ${C.amber}` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: `${C.amber}1A`, color: C.amber }}>
              <Calendar size={18} />
            </div>
            <div>
              <div className="text-xs" style={{ color: C.textSec }}>Currently Active</div>
              <div className="text-lg font-semibold" style={{ color: C.text }}>2024/2025 — Semester 1 <span style={{ color: C.green, fontSize: 12 }}>● Live</span></div>
              <div className="text-xs mt-1" style={{ color: C.textSec }}>Sep 2, 2024 → Dec 20, 2024 · 7 weeks remaining</div>
            </div>
          </div>
          <Button onClick={() => confirm({ title: "Close current semester?", body: "Closing this semester will archive all attendance data for this period. This cannot be undone. Type CONFIRM to proceed.", danger: true, requireType: true, onConfirm: () => toast("success", "Semester closed and archived") })}>Close Semester</Button>
        </div>
      </Card>

      <div className="space-y-4">
        {years.map((y) => (
          <Card key={y.year} className="overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-3">
                <div className="font-display text-xl" style={{ color: C.text }}>{y.year}</div>
                {y.active ? <Badge color={C.green} label="Active" /> : <Badge color={C.textMuted} label="Archived" />}
              </div>
              <span className="text-xs" style={{ color: C.textSec }}>{y.semesters.length} semesters</span>
            </div>
            <div>
              {y.semesters.map((s, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between" style={{ borderTop: i ? `1px solid ${C.border}` : "none" }}>
                  <div className="flex items-center gap-6">
                    <div className="text-sm font-medium" style={{ color: C.text }}>Semester {s.n}</div>
                    <div className="text-xs" style={{ color: C.textSec }}>{s.start} → {s.end}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.status === "Active" ? <Badge color={C.green} label="Active" /> : s.status === "Scheduled" ? <Badge color={C.blue} label="Scheduled" /> : <Badge color={C.textMuted} label="Closed" />}
                    {s.status === "Active" && <Button variant="secondary" onClick={() => confirm({ title: "Close semester?", body: "Type CONFIRM to archive all data for this semester.", danger: true, requireType: true, onConfirm: () => toast("success", "Semester closed") })}>Close</Button>}
                    {s.status === "Scheduled" && <Button onClick={() => toast("success", "Semester activated")}>Activate</Button>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   LECTURERS
============================================================ */
function LecturersView({ lecturers, setLecturers, departments, courses, openSlide, confirm, toast, onNav }: any) {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [detail, setDetail] = useState<any>(null);

  const filtered = lecturers.filter((l: any) => {
    if (q && !l.name.toLowerCase().includes(q.toLowerCase()) && !l.staffId.toLowerCase().includes(q.toLowerCase())) return false;
    if (dept && String(l.deptId) !== dept) return false;
    return true;
  });

  const initials = (name: string) => name.split(" ").filter(p => p.length > 1).slice(-2).map(p => p[0]).join("").toUpperCase();

  return (
    <div>
      <ScreenHeader title="Lecturers" sub="Faculty members and instructors"
        action={<Button icon={Plus} onClick={() => openSlide({ type: "lecturer" })}>Add Lecturer</Button>} />

      <Card className="p-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or staff ID…"
              className="w-full h-10 pl-9 pr-3 rounded-md text-sm" style={{ background: C.bg, border: `1px solid ${C.borderStrong}`, color: C.text }} />
          </div>
          <div className="w-56">
            <Select value={dept} onChange={setDept} placeholder="All Departments">
              {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((l: any) => {
          const d = departments.find((x: any) => x.id === l.deptId);
          return (
            <Card key={l.id} className="p-5 lift cursor-pointer" style={{ position: "relative" }} >
              <div onClick={() => setDetail(l)}>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-base font-semibold shrink-0"
                    style={{ background: C.amber, color: C.bg }}>{initials(l.name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate" style={{ color: C.text }}>{l.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: C.textSec }}>{l.staffId}</div>
                    <div className="mt-2"><Pill color={C.blue} label={d?.name || ""} /></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                  <div className="flex items-center gap-2 text-xs" style={{ color: C.textSec }}>
                    <BookOpen size={13} /><span><b style={{ color: C.text }}>{l.courses}</b> Courses</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: C.textSec }}>
                    <Clock size={13} /><span><b style={{ color: C.text }}>{l.sessions}</b> Sessions</span>
                  </div>
                </div>
                <div className="mt-3">{l.active ? <Badge color={C.green} label="Active" /> : <Badge color={C.red} label="Suspended" />}</div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
                <Button variant="secondary" onClick={() => onNav("courses", { lecturerId: l.id })}>View Courses</Button>
                <Button variant="ghost" icon={Pencil} onClick={() => openSlide({ type: "lecturer", data: l })}>Edit</Button>
                <div className="ml-auto relative">
                  <IconBtn icon={MoreHorizontal} onClick={() => setOpenMenu(openMenu === l.id ? null : l.id)} />
                  {openMenu === l.id && (
                    <div className="absolute right-0 top-9 w-52 rounded-md fade-in z-10"
                      style={{ background: C.raised, border: `1px solid ${C.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                      <button onClick={() => { setLecturers(lecturers.map((x: any) => x.id === l.id ? { ...x, active: !x.active } : x)); toast("success", `Account ${l.active ? "suspended" : "reactivated"}`); setOpenMenu(null); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-white/5" style={{ color: C.text }}>
                        {l.active ? "Suspend Account" : "Reactivate"}
                      </button>
                      <button onClick={() => { toast("info", "Password reset email sent"); setOpenMenu(null); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-white/5" style={{ color: C.text }}>Reset Password</button>
                      <button disabled={l.courses > 0} title={l.courses > 0 ? "Remove course assignments first" : ""}
                        onClick={() => { confirm({ title: "Delete account?", body: `Permanently delete ${l.name}?`, danger: true, onConfirm: () => { setLecturers(lecturers.filter((x: any) => x.id !== l.id)); toast("success", "Account deleted"); } }); setOpenMenu(null); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed" style={{ color: C.red }}>Delete Account</button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {detail && <LecturerDetail l={detail} departments={departments} courses={courses} onClose={() => setDetail(null)} />}
    </div>
  );
}

function LecturerDetail({ l, departments, courses, onClose }: any) {
  const d = departments.find((x: any) => x.id === l.deptId);
  const myCourses = courses.filter((c: any) => c.lecturerId === l.id);
  return (
    <SlideOver open={true} onClose={onClose} title={l.name} subtitle={`${l.staffId} · ${d?.name}`}
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}>
      <div className="space-y-5">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wider mb-3" style={{ color: C.textMuted }}>Account</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span style={{ color: C.textSec }}>Email</span><span style={{ color: C.text }}>{l.email}</span></div>
            <div className="flex justify-between"><span style={{ color: C.textSec }}>Phone</span><span style={{ color: C.text }}>{l.phone}</span></div>
            <div className="flex justify-between"><span style={{ color: C.textSec }}>Status</span>{l.active ? <Badge color={C.green} label="Active" /> : <Badge color={C.red} label="Suspended" />}</div>
            <div className="flex justify-between"><span style={{ color: C.textSec }}>Created</span><span style={{ color: C.text }}>Aug 12, 2024</span></div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-wider mb-3" style={{ color: C.textMuted }}>Assigned Courses</div>
          <div className="space-y-2">
            {myCourses.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-2.5 rounded-md" style={{ background: C.bg }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: C.text }}>{c.title}</div>
                  <div className="text-[11px]" style={{ color: C.textSec }}>{c.code} · L{c.level}</div>
                </div>
                <Pill color={c.avg >= 75 ? C.green : c.avg >= 60 ? C.amber : C.red} label={`${c.avg}%`} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-wider mb-3" style={{ color: C.textMuted }}>Recent Sessions</div>
          <div className="space-y-2">
            {[
              { c: "CS301", date: "Today, 10:30 AM", n: 42 },
              { c: "CS401", date: "Yesterday, 2:00 PM", n: 38 },
              { c: "CS301", date: "Mon, 10:30 AM", n: 41 },
              { c: "CS401", date: "Last Fri, 2:00 PM", n: 36 },
              { c: "CS301", date: "Last Wed, 10:30 AM", n: 40 },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium" style={{ color: C.text }}>{s.c}</span>
                  <span className="ml-2 text-xs" style={{ color: C.textSec }}>{s.date}</span>
                </div>
                <span style={{ color: C.textSec }} className="text-xs">{s.n} attended</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </SlideOver>
  );
}

/* ============================================================
   STUDENTS
============================================================ */
function StudentsView({ students, setStudents, programmes, courses, ctx, openSlide, confirm, toast, onNav }: any) {
  const [q, setQ] = useState("");
  const [pid, setPid] = useState(ctx?.programmeId ? String(ctx.programmeId) : "");
  const [lvl, setLvl] = useState("");
  const [status, setStatus] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const filtered = students.filter((s: any) => {
    if (q && !s.name.toLowerCase().includes(q.toLowerCase()) && !s.studentId.toLowerCase().includes(q.toLowerCase())) return false;
    if (pid && String(s.programmeId) !== pid) return false;
    if (lvl && String(s.level) !== lvl) return false;
    if (status && s.invitation !== status) return false;
    return true;
  });

  const initials = (n: string) => n.split(" ").map(p => p[0]).slice(0, 2).join("");

  return (
    <div>
      <ScreenHeader title="Students" sub="Registered learners across programmes"
        action={<div className="flex gap-2">
          <Button variant="secondary" icon={Upload} onClick={() => setBulkOpen(true)}>Bulk Import</Button>
          <Button icon={Plus} onClick={() => openSlide({ type: "student" })}>Add Student</Button>
        </div>} />

      <Card className="overflow-hidden">
        <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or ID…"
              className="w-full h-10 pl-9 pr-3 rounded-md text-sm" style={{ background: C.bg, border: `1px solid ${C.borderStrong}`, color: C.text }} />
          </div>
          <Select value={pid} onChange={setPid} placeholder="All Programmes">
            {programmes.map((p: any) => <option key={p.id} value={p.id}>{p.code}</option>)}
          </Select>
          <Select value={lvl} onChange={setLvl} placeholder="All Levels">
            {[100, 200, 300, 400].map((l) => <option key={l} value={l}>Level {l}</option>)}
          </Select>
          <Select value={status} onChange={setStatus} placeholder="All Statuses">
            <option value="Registered">Registered</option><option value="Pending">Pending</option><option value="Expired">Expired</option>
          </Select>
        </div>

        <table className="w-full text-sm tbl-resp">
          <thead>
            <tr>
              <TH>Student</TH><TH>ID</TH><TH>Programme</TH><TH>Level</TH><TH>Email</TH><TH>Status</TH><TH>Invitation</TH>
              <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s: any, i: number) => {
              const p = programmes.find((x: any) => x.id === s.programmeId);
              return (
                <tr key={s.id} className="row-hover" style={{ background: i % 2 ? "#1C2640" : C.surface }}>
                  <td className="px-4 py-3">
                    <button onClick={() => setProfile(s)} className="flex items-center gap-3 text-left hover:underline">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold"
                        style={{ background: C.raised, color: C.amber, border: `1px solid ${C.border}` }}>{initials(s.name)}</span>
                      <span className="font-medium" style={{ color: C.text }}>{s.name}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3" style={{ color: C.textSec }}>{s.studentId}</td>
                  <td className="px-4 py-3" style={{ color: C.textSec }}>{p?.code}</td>
                  <td className="px-4 py-3" style={{ color: C.text }}>L{s.level}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: C.textSec }}>{s.email}</td>
                  <td className="px-4 py-3"><Badge color={s.status === "active" ? C.green : C.red} label={s.status === "active" ? "Active" : "Suspended"} /></td>
                  <td className="px-4 py-3">
                    {s.invitation === "Registered" && <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: C.green }}><CheckCircle2 size={13} />Registered</span>}
                    {s.invitation === "Pending" && <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: C.amber }}><Clock size={13} />Pending</span>}
                    {s.invitation === "Expired" && <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: C.red }}><AlertTriangle size={13} />Expired · <button onClick={() => toast("success", "Invitation resent")} className="underline">Resend</button></span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn icon={Eye} title="Profile" onClick={() => setProfile(s)} />
                      <IconBtn icon={Pencil} title="Edit" onClick={() => openSlide({ type: "student", data: s })} />
                      <IconBtn icon={ArrowUpDown} title="Move Level" onClick={() => openSlide({ type: "move-level", data: s })} />
                      <IconBtn icon={ShieldAlert} title="Manual Override" color={C.amber} onClick={() => openSlide({ type: "override", data: s })} />
                      <IconBtn icon={Trash2} color={C.red} title="Delete"
                        onClick={() => confirm({ title: "Delete student?", body: `Permanently delete ${s.name}?`, danger: true,
                          onConfirm: () => { setStudents(students.filter((x: any) => x.id !== s.id)); toast("success", "Student removed"); } })} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {bulkOpen && <BulkImport onClose={() => setBulkOpen(false)} toast={toast} />}
      {profile && <StudentProfile s={profile} programmes={programmes} courses={courses} onClose={() => setProfile(null)} />}
    </div>
  );
}

function BulkImport({ onClose, toast }: any) {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  return (
    <div className="fixed inset-0 z-50 fade-in flex items-center justify-center p-8" style={{ background: "rgba(7,11,20,0.8)" }}>
      <Card className="w-full max-w-3xl">
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div>
            <h3 className="text-base font-semibold" style={{ color: C.text }}>Bulk Import Students</h3>
            <p className="text-xs" style={{ color: C.textSec }}>Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-white/5 flex items-center justify-center" style={{ color: C.textSec }}><X size={16} /></button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex-1 h-1 rounded-full" style={{ background: n <= step ? C.amber : C.raised }} />
            ))}
          </div>

          {step === 1 && (
            <div>
              <div className="p-10 rounded-lg flex flex-col items-center justify-center text-center"
                style={{ background: C.bg, border: `2px dashed ${C.borderStrong}` }}>
                <Upload size={28} style={{ color: C.amber }} />
                <div className="mt-3 text-sm font-medium" style={{ color: C.text }}>Drop CSV or Excel file here</div>
                <div className="text-xs mt-1" style={{ color: C.textSec }}>or click to browse · max 5MB</div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <Button variant="ghost" icon={Download} onClick={() => toast("info", "Template downloaded")}>Download Template</Button>
                <Button onClick={() => setStep(2)}>Continue</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <Pill color={C.green} label="142 valid rows" />
                <Pill color={C.red} label="3 errors" />
              </div>
              <div className="rounded-md overflow-hidden" style={{ border: `1px solid ${C.border}`, maxHeight: 280, overflowY: "auto" }}>
                <table className="w-full text-xs tbl-resp">
                  <thead style={{ background: C.raised, position: "sticky", top: 0 }}>
                    <tr><TH>Row</TH><TH>Name</TH><TH>Student ID</TH><TH>Email</TH><TH>Programme</TH><TH>Status</TH></tr>
                  </thead>
                  <tbody>
                    {[
                      { r: 1, n: "Yaa Mensah", id: "STU-0142", e: "y.mensah@knust.edu.gh", p: "BSCS", ok: true },
                      { r: 2, n: "Kojo Twum", id: "STU-0143", e: "k.twum@knust.edu.gh", p: "BSCS", ok: true },
                      { r: 14, n: "Esi Quartey", id: "STU-0155", e: "", p: "BBA", ok: false, err: "Missing email" },
                      { r: 27, n: "Nii Lartey", id: "STU-0168", e: "n.lartey@knust.edu.gh", p: "BSEE", ok: true },
                      { r: 41, n: "Akua Dapaah", id: "STU-0182", e: "bad-email", p: "BSCE", ok: false, err: "Invalid email" },
                      { r: 58, n: "Yaw Owusu", id: "STU-0199", e: "y.owusu@knust.edu.gh", p: "BSCS", ok: true },
                    ].map((r, i) => (
                      <tr key={i} style={{ background: !r.ok ? "rgba(239,68,68,0.06)" : "transparent" }}>
                        <td className="px-3 py-2" style={{ color: C.textSec }}>{r.r}</td>
                        <td className="px-3 py-2" style={{ color: C.text }}>{r.n}</td>
                        <td className="px-3 py-2" style={{ color: C.textSec }}>{r.id}</td>
                        <td className="px-3 py-2" style={{ color: r.ok ? C.textSec : C.red }}>{r.e || "—"} {r.err && <span className="ml-2 text-[10px]">({r.err})</span>}</td>
                        <td className="px-3 py-2" style={{ color: C.textSec }}>{r.p}</td>
                        <td className="px-3 py-2">{r.ok ? <Pill color={C.green} label="OK" /> : <Pill color={C.red} label="Error" />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between mt-4">
                <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)}>Continue</Button>
              </div>
            </div>
          )}

          {step === 3 && !done && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{ background: `${C.amber}1A` }}>
                <Send size={20} style={{ color: C.amber }} />
              </div>
              <h4 className="text-base font-semibold mt-3" style={{ color: C.text }}>Import 142 students and send invitations?</h4>
              <p className="text-xs mt-1" style={{ color: C.textSec }}>Each student receives an email valid for 48 hours.</p>
              <div className="flex items-center justify-center gap-3 mt-5">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={() => { setDone(true); toast("success", "Import complete"); }}>Import Now</Button>
              </div>
            </div>
          )}

          {step === 3 && done && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{ background: `${C.green}1A` }}>
                <CheckCircle2 size={22} style={{ color: C.green }} />
              </div>
              <h4 className="text-base font-semibold mt-3" style={{ color: C.text }}>Import complete</h4>
              <div className="flex items-center justify-center gap-3 mt-3">
                <Pill color={C.green} label="142 created" />
                <Pill color={C.red} label="3 failed" />
              </div>
              <div className="flex items-center justify-center gap-3 mt-5">
                <Button variant="secondary" icon={Download} onClick={() => toast("info", "Error log downloaded")}>Download Error Log</Button>
                <Button onClick={onClose}>Done</Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function StudentProfile({ s, programmes, courses, onClose }: any) {
  const p = programmes.find((x: any) => x.id === s.programmeId);
  const enrolled = courses.filter((c: any) => c.programmeId === s.programmeId && c.level === s.level);
  return (
    <SlideOver open={true} onClose={onClose} title={s.name} subtitle={`${s.studentId} · ${p?.name} · L${s.level}`}
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}>
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-lg flex items-center justify-center text-xl font-semibold"
            style={{ background: C.amber, color: C.bg }}>{s.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}</div>
          <div>
            <button className="text-xs flex items-center gap-1.5 px-3 h-8 rounded-md" style={{ background: C.raised, color: C.textSec, border: `1px solid ${C.border}` }}>
              <ImageIcon size={12} />Upload Photo
            </button>
            <div className="text-[11px] mt-2" style={{ color: C.textMuted }}>JPG or PNG, max 2MB</div>
          </div>
        </div>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-wider mb-3" style={{ color: C.textMuted }}>Enrolled Courses</div>
          <div className="space-y-3">
            {enrolled.map((c: any) => {
              const att = c.id === 1 ? s.attendance : Math.round(60 + Math.random() * 35);
              const col = att >= 75 ? C.green : att >= 60 ? C.amber : C.red;
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-sm font-medium" style={{ color: C.text }}>{c.code} · {c.title}</div>
                    <div className="text-xs font-semibold" style={{ color: col }}>{att}%</div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.raised }}>
                    <div style={{ width: `${att}%`, background: col, height: "100%" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-wider mb-3" style={{ color: C.textMuted }}>Account</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span style={{ color: C.textSec }}>Email</span><span style={{ color: C.text }}>{s.email}</span></div>
            <div className="flex justify-between"><span style={{ color: C.textSec }}>Registered</span><span style={{ color: C.text }}>Sep 5, 2024</span></div>
            <div className="flex justify-between"><span style={{ color: C.textSec }}>Last Login</span><span style={{ color: C.text }}>Today, 9:12 AM</span></div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs uppercase tracking-wider mb-3" style={{ color: C.textMuted }}>Recent Check-ins</div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span style={{ color: C.text }}>{["CS301", "CS401", "CS301", "CS401", "CS301", "CS401"][i]}</span>
                <span style={{ color: C.textSec }}>{["10:32 AM", "Yesterday 2:04 PM", "Mon 10:34 AM", "Fri 2:01 PM", "Wed 10:31 AM", "Last Mon 10:30 AM"][i]}</span>
                <Pill color={i === 2 ? C.red : C.green} label={i === 2 ? "Absent" : "Present"} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </SlideOver>
  );
}

/* ============================================================
   REPORTS
============================================================ */
function ReportsView({ toast, confirm, students, programmes }: any) {
  const reports = [
    { i: BarChart3, t: "Institution-wide Attendance", d: "Overall attendance across every course and programme.", excel: true },
    { i: Building2, t: "Per-Department", d: "Breakdown of attendance by department and faculty.", excel: true },
    { i: BookOpen, t: "Per-Course", d: "Complete register for a single course.", excel: true },
    { i: UserCheck, t: "Per-Student", d: "Individual attendance history and shortfall.", excel: true },
    { i: ShieldAlert, t: "Defaulters Report", d: "All students currently below attendance threshold.", excel: true },
    { i: Users, t: "Lecturer Activity", d: "Sessions and attendance rates per lecturer.", excel: false },
  ];

  const deptTrend = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    week: `W${i + 1}`,
    CS: 80 + Math.round(Math.sin(i) * 6),
    EE: 75 + Math.round(Math.cos(i) * 5),
    CE: 78 + Math.round(Math.sin(i + 1) * 4),
    BA: 70 + Math.round(Math.cos(i + 1) * 5),
    PH: 65 + Math.round(Math.sin(i + 2) * 7),
  })), []);

  const defaulters = students.filter((s: any) => s.attendance > 0 && s.attendance < 80).map((s: any) => {
    const p = programmes.find((x: any) => x.id === s.programmeId);
    const status = s.attendance < 60 ? "Critical" : s.attendance < 75 ? "Warning" : "Approaching";
    const col = s.attendance < 60 ? C.red : s.attendance < 75 ? C.amber : C.blue;
    return { ...s, prog: p?.code, status, col, course: "CS301", threshold: 75, shortfall: 75 - s.attendance };
  });

  return (
    <div>
      <ScreenHeader title="Reports & Analytics" sub="2024/2025 · Semester 1" />

      {/* SECTION A */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3" style={{ color: C.text }}>Generate Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((r) => {
            const Icon = r.i;
            return (
              <Card key={r.t} className="p-5 lift">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0" style={{ background: `${C.amber}1A`, color: C.amber }}>
                    <Icon size={17} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: C.text }}>{r.t}</div>
                    <div className="text-xs mt-1" style={{ color: C.textSec }}>{r.d}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button variant="secondary" icon={FileText} onClick={() => toast("info", "Generating report… This may take a moment.")}>PDF</Button>
                  {r.excel && <Button variant="ghost" icon={FileSpreadsheet} onClick={() => toast("info", "Generating Excel export…")}>Excel</Button>}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* SECTION B */}
      <h3 className="text-sm font-semibold mb-3" style={{ color: C.text }}>Live Analytics</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <h4 className="text-sm font-semibold mb-3" style={{ color: C.text }}>Attendance Rate per Department</h4>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={deptRates} layout="vertical" margin={{ left: 90, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" stroke={C.textMuted} tick={{ fontSize: 11 }} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" stroke={C.textMuted} tick={{ fontSize: 11 }} width={90} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="rate" fill={C.amber} radius={[0, 4, 4, 0]} background={{ fill: C.raised, radius: 4 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h4 className="text-sm font-semibold mb-3" style={{ color: C.text }}>Weekly Trend by Department</h4>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={deptTrend} margin={{ left: -10, right: 10, top: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="week" stroke={C.textMuted} tick={{ fontSize: 11 }} />
                <YAxis stroke={C.textMuted} tick={{ fontSize: 11 }} domain={[50, 100]} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="CS" stroke={C.amber} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="EE" stroke={C.blue} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="CE" stroke={C.green} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="BA" stroke={C.purple} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="PH" stroke={C.red} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h4 className="text-sm font-semibold mb-3" style={{ color: C.text }}>Present vs Absent (Institution)</h4>
          <div style={{ height: 240, position: "relative" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={[{ name: "Present", value: 9847 }, { name: "Absent", value: 1834 }]}
                  innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                  <Cell fill={C.green} /><Cell fill={C.red} />
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-[10px] uppercase tracking-wider" style={{ color: C.textMuted }}>Semester</div>
              <div className="text-xl font-semibold" style={{ color: C.text }}>84.3%</div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h4 className="text-sm font-semibold mb-3" style={{ color: C.text }}>Lowest Attendance · Top 10</h4>
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            <table className="w-full text-xs tbl-resp">
              <thead><tr><TH>Course</TH><TH>Programme</TH><TH>Enrolled</TH><TH>Avg %</TH><TH>Status</TH></tr></thead>
              <tbody>
                {[
                  { c: "PH301", p: "BSPH", e: 64, r: 58 },
                  { c: "BA201", p: "BBA", e: 88, r: 69 },
                  { c: "CE301", p: "BSCE", e: 52, r: 72 },
                  { c: "CS301", p: "BSCS", e: 96, r: 78 },
                  { c: "EE201", p: "BSEE", e: 71, r: 81 },
                  { c: "CS401", p: "BSCS", e: 64, r: 84 },
                ].map((r, i) => (
                  <tr key={i} className="row-hover" style={{ background: i % 2 ? "#1C2640" : C.surface }}>
                    <td className="px-3 py-2 font-medium" style={{ color: C.text }}>{r.c}</td>
                    <td className="px-3 py-2" style={{ color: C.textSec }}>{r.p}</td>
                    <td className="px-3 py-2" style={{ color: C.text }}>{r.e}</td>
                    <td className="px-3 py-2 font-semibold" style={{ color: r.r < 60 ? C.red : r.r < 75 ? C.amber : C.green }}>{r.r}%</td>
                    <td className="px-3 py-2">{r.r < 60 ? <Pill color={C.red} label="Critical" /> : r.r < 75 ? <Pill color={C.amber} label="Warning" /> : <Pill color={C.green} label="OK" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* SECTION C */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div>
            <h4 className="text-sm font-semibold" style={{ color: C.text }}>Students Below Attendance Threshold</h4>
            <p className="text-xs" style={{ color: C.textSec }}>{defaulters.length} students currently flagged</p>
          </div>
          <Button onClick={() => confirm({ title: "Send warning emails?", body: `Send warning notifications to all ${defaulters.length} flagged students?`, onConfirm: () => toast("success", "Warning emails dispatched") })}>
            Send Warning Emails to All
          </Button>
        </div>
        <table className="w-full text-sm tbl-resp">
          <thead><tr><TH>Student</TH><TH>ID</TH><TH>Course</TH><TH>Programme</TH><TH>Current %</TH><TH>Threshold</TH><TH>Shortfall</TH><TH>Status</TH></tr></thead>
          <tbody>
            {defaulters.map((d: any, i: number) => (
              <tr key={d.id} className="row-hover" style={{ background: i % 2 ? "#1C2640" : C.surface }}>
                <td className="px-4 py-3 font-medium" style={{ color: C.text }}>{d.name}</td>
                <td className="px-4 py-3" style={{ color: C.textSec }}>{d.studentId}</td>
                <td className="px-4 py-3" style={{ color: C.textSec }}>{d.course}</td>
                <td className="px-4 py-3" style={{ color: C.textSec }}>{d.prog}</td>
                <td className="px-4 py-3 font-semibold" style={{ color: d.col }}>{d.attendance}%</td>
                <td className="px-4 py-3" style={{ color: C.textSec }}>{d.threshold}%</td>
                <td className="px-4 py-3" style={{ color: C.red }}>-{d.shortfall}%</td>
                <td className="px-4 py-3"><Badge color={d.col} label={d.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ============================================================
   NOTIFICATIONS
============================================================ */
function NotificationsView({ toast }: any) {
  const [rules, setRules] = useState([
    { id: 1, t: "Student Below 80% Threshold", d: "Notify student via email", on: true, color: C.amber, icon: AlertCircle },
    { id: 2, t: "Student Below 75% Threshold", d: "Notify student and admin", on: true, color: C.red, icon: AlertTriangle },
    { id: 3, t: "Student Below 70% Threshold", d: "Critical alert to student and admin", on: true, color: C.red, icon: ShieldAlert },
    { id: 4, t: "Lecturer Inactive 2+ Weeks", d: "Notify admin via email", on: false, color: C.amber, icon: Clock },
    { id: 5, t: "Expired Student Invitation", d: "Notify admin via email", on: true, color: C.blue, icon: Mail },
    { id: 6, t: "Weekly Attendance Summary", d: "Send to admin and lecturers", on: true, color: C.blue, icon: BarChart3 },
    { id: 7, t: "Session Not Ended After 2hrs", d: "Notify the lecturer", on: true, color: C.amber, icon: Clock },
  ]);
  const [email, setEmail] = useState("");

  const log = [
    { type: "Below 75% Alert", to: "k.boateng@knust.edu.gh", at: "12 min ago", ok: true, color: C.red },
    { type: "Weekly Summary", to: "lecturers@knust.edu.gh", at: "3 hrs ago", ok: true, color: C.blue },
    { type: "Below 80% Alert", to: "k.asante@knust.edu.gh", at: "5 hrs ago", ok: true, color: C.amber },
    { type: "Expired Invite", to: "admin@knust.edu.gh", at: "8 hrs ago", ok: true, color: C.blue },
    { type: "Below 70% Critical", to: "k.boateng@knust.edu.gh", at: "1 day ago", ok: false, color: C.red },
    { type: "Session Timeout", to: "a.owusu@knust.edu.gh", at: "1 day ago", ok: true, color: C.amber },
    { type: "Weekly Summary", to: "admin@knust.edu.gh", at: "1 week ago", ok: true, color: C.blue },
    { type: "Below 80% Alert", to: "a.darko@knust.edu.gh", at: "1 week ago", ok: true, color: C.amber },
  ];

  return (
    <div>
      <ScreenHeader title="Notifications & Alerts" sub="Configure automated alerts and view delivery logs" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: C.text }}>Active Alert Rules</h3>
          <div className="space-y-3">
            {rules.map((r) => {
              const Icon = r.icon;
              return (
                <Card key={r.id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0" style={{ background: `${r.color}1A`, color: r.color }}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: C.text }}>{r.t}</div>
                    <div className="text-xs" style={{ color: C.textSec }}>{r.d}</div>
                  </div>
                  <Toggle value={r.on} onChange={(v) => { setRules(rules.map((x) => x.id === r.id ? { ...x, on: v } : x)); toast("success", `Rule ${v ? "enabled" : "disabled"}`); }} />
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: C.text }}>Notification Log</h3>
          <Card className="overflow-hidden">
            <table className="w-full text-sm tbl-resp">
              <thead><tr><TH>Type</TH><TH>Recipient</TH><TH>Sent</TH><TH>Status</TH></tr></thead>
              <tbody>
                {log.map((l, i) => (
                  <tr key={i} style={{ background: i % 2 ? "#1C2640" : C.surface }} className="row-hover">
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-2 text-xs" style={{ color: C.text }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: l.color }} />{l.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: C.textSec }}>{l.to}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: C.textMuted }}>{l.at}</td>
                    <td className="px-4 py-2.5">{l.ok ? <Pill color={C.green} label="Delivered" /> : <Pill color={C.red} label="Failed" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card className="p-4 mt-4">
            <h4 className="text-sm font-semibold" style={{ color: C.text }}>Send Test Email</h4>
            <p className="text-xs mt-0.5 mb-3" style={{ color: C.textSec }}>Verify SMTP is configured correctly</p>
            <div className="flex gap-2">
              <Input value={email} onChange={setEmail} placeholder="recipient@knust.edu.gh" type="email" />
              <Button icon={Send} onClick={() => { if (!email) return toast("error", "Enter an email"); toast("success", "Test email sent"); }}>Send</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SETTINGS
============================================================ */
function SettingsView({ toast }: any) {
  const [tab, setTab] = useState("institution");
  const [showPwd, setShowPwd] = useState(false);

  // institution
  const [instName, setInstName] = useState(INSTITUTION);
  const [adminName, setAdminName] = useState("Kwame Mensah");
  const [adminEmail, setAdminEmail] = useState("admin@knust.edu.gh");

  // session
  const [codeLen, setCodeLen] = useState(6);
  const [expiry, setExpiry] = useState("15");
  const [maxFail, setMaxFail] = useState(3);
  const [autoClose, setAutoClose] = useState(true);
  const [autoHrs, setAutoHrs] = useState(2);

  // face
  const [conf, setConf] = useState(80);
  const [liveness, setLiveness] = useState(true);
  const [fallback, setFallback] = useState(true);

  // smtp
  const [host, setHost] = useState("smtp.knust.edu.gh");
  const [port, setPort] = useState(587);
  const [user, setUser] = useState("noreply@knust.edu.gh");
  const [pwd, setPwd] = useState("••••••••••");
  const [fromName, setFromName] = useState("KNUST Attendance System");
  const [fromEmail, setFromEmail] = useState("noreply@knust.edu.gh");
  const [enc, setEnc] = useState("TLS");

  // audit filter
  const [actionFilter, setActionFilter] = useState("");

  const tabs = [
    { id: "institution", l: "Institution", i: Building2 },
    { id: "session", l: "Session Config", i: Clock },
    { id: "face", l: "Face Recognition", i: UserCheck },
    { id: "smtp", l: "Email / SMTP", i: Mail },
    { id: "audit", l: "Audit Trail", i: FileText },
  ];

  const codePreview = "AX72KCQR".slice(0, codeLen);

  return (
    <div>
      <ScreenHeader title="System Settings" sub="Institution-wide configuration and audit" />

      <div className="flex gap-1 mb-5 p-1 rounded-lg w-fit" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        {tabs.map((t) => {
          const Icon = t.i;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className="px-4 h-9 rounded-md text-sm font-medium flex items-center gap-2 transition-all"
              style={{ background: tab === t.id ? C.raised : "transparent", color: tab === t.id ? C.text : C.textSec }}>
              <Icon size={14} />{t.l}
            </button>
          );
        })}
      </div>

      {tab === "institution" && (
        <Card className="p-6 max-w-3xl">
          <h3 className="text-sm font-semibold mb-4" style={{ color: C.text }}>Institution</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Institution Name" required><Input value={instName} onChange={setInstName} /></Field>
            <Field label="Institution Logo">
              <div className="h-10 rounded-md flex items-center gap-3 px-3" style={{ background: C.bg, border: `1px dashed ${C.borderStrong}` }}>
                <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: `${C.amber}1A` }}><GraduationCap size={13} style={{ color: C.amber }} /></div>
                <span className="text-xs flex-1" style={{ color: C.textSec }}>knust-logo.png · 24 KB</span>
                <button className="text-xs" style={{ color: C.amber }}>Replace</button>
              </div>
            </Field>
          </div>
          <h3 className="text-sm font-semibold mt-6 mb-4" style={{ color: C.text }}>Admin Account</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" required><Input value={adminName} onChange={setAdminName} /></Field>
            <Field label="Email" required><Input value={adminEmail} onChange={setAdminEmail} type="email" /></Field>
          </div>
          <h3 className="text-sm font-semibold mt-6 mb-4" style={{ color: C.text }}>Change Password</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Current Password"><Input type="password" value="" onChange={() => {}} /></Field>
            <Field label="New Password"><Input type="password" value="" onChange={() => {}} /></Field>
            <Field label="Confirm Password"><Input type="password" value="" onChange={() => {}} /></Field>
          </div>
          <div className="mt-6"><Button onClick={() => toast("success", "Settings saved")}>Save Changes</Button></div>
        </Card>
      )}

      {tab === "session" && (
        <Card className="p-6 max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Session Code Length" hint={`Example code: ${codePreview}`}>
              <Input type="number" value={codeLen} onChange={(v: any) => setCodeLen(Math.min(8, Math.max(4, Number(v) || 4)))} />
            </Field>
            <Field label="Default QR Code Expiry">
              <Select value={expiry} onChange={setExpiry}>
                {["5", "10", "15", "20", "30"].map((m) => <option key={m} value={m}>{m} minutes</option>)}
              </Select>
            </Field>
            <Field label="Max Failed Code Attempts">
              <Input type="number" value={maxFail} onChange={(v: any) => setMaxFail(Number(v))} />
            </Field>
            <Field label="Auto-Close After Inactivity">
              <div className="flex items-center gap-3">
                <Toggle value={autoClose} onChange={setAutoClose} />
                <Input type="number" value={autoHrs} onChange={(v: any) => setAutoHrs(Number(v))} />
                <span className="text-xs" style={{ color: C.textSec }}>hours</span>
              </div>
            </Field>
          </div>
          <div className="mt-6"><Button onClick={() => toast("success", "Session config saved")}>Save Changes</Button></div>
        </Card>
      )}

      {tab === "face" && (
        <Card className="p-6 max-w-3xl">
          <Field label="Face Recognition Confidence Threshold" hint="Higher = stricter matching, fewer false positives">
            <div className="flex items-center gap-4">
              <input type="range" min={60} max={99} value={conf} onChange={(e) => setConf(Number(e.target.value))} className="flex-1" />
              <div className="w-20"><Input type="number" value={conf} onChange={(v: any) => setConf(Number(v))} /></div>
            </div>
          </Field>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-md" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
              <div>
                <div className="text-sm font-medium" style={{ color: C.text }}>Liveness Detection</div>
                <div className="text-xs" style={{ color: C.textSec }}>Flags static photos (photos of photos)</div>
              </div>
              <Toggle value={liveness} onChange={setLiveness} />
            </div>
            <div className="flex items-center justify-between p-4 rounded-md" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
              <div>
                <div className="text-sm font-medium" style={{ color: C.text }}>Fallback to QR on Face Failure</div>
                <div className="text-xs" style={{ color: C.textSec }}>Allow QR code if face match fails twice</div>
              </div>
              <Toggle value={fallback} onChange={setFallback} />
            </div>
          </div>
          <div className="mt-6"><Button onClick={() => toast("success", "Face recognition settings saved")}>Save Changes</Button></div>
        </Card>
      )}

      {tab === "smtp" && (
        <Card className="p-6 max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="SMTP Host" required><Input value={host} onChange={setHost} /></Field>
            <Field label="SMTP Port" required><Input type="number" value={port} onChange={(v: any) => setPort(Number(v))} /></Field>
            <Field label="SMTP Username" required><Input value={user} onChange={setUser} /></Field>
            <Field label="SMTP Password" required>
              <div className="relative">
                <Input type={showPwd ? "text" : "password"} value={pwd} onChange={setPwd} />
                <button onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.textSec }}>
                  {showPwd ? <EyeOff size={14} /> : <EyeIcon size={14} />}
                </button>
              </div>
            </Field>
            <Field label="From Name"><Input value={fromName} onChange={setFromName} /></Field>
            <Field label="From Email"><Input type="email" value={fromEmail} onChange={setFromEmail} /></Field>
            <Field label="Encryption">
              <Select value={enc} onChange={setEnc}><option value="TLS">TLS</option><option value="SSL">SSL</option><option value="None">None</option></Select>
            </Field>
          </div>
          <div className="mt-6 flex gap-2">
            <Button variant="secondary" icon={RefreshCw} onClick={() => toast("success", "SMTP connection successful")}>Test Connection</Button>
            <Button onClick={() => toast("success", "SMTP settings saved")}>Save SMTP Settings</Button>
          </div>
        </Card>
      )}

      {tab === "audit" && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="w-56"><Select value={actionFilter} onChange={setActionFilter} placeholder="All Actions">
              {["Manual Attendance Override", "Student Suspended", "Course Created", "Bulk Import", "Lecturer Added", "Report Exported"].map(a => <option key={a} value={a}>{a}</option>)}
            </Select></div>
            <input type="date" className="h-10 px-3 rounded-md text-sm" style={{ background: C.bg, border: `1px solid ${C.borderStrong}`, color: C.text }} />
            <div className="ml-auto flex gap-2">
              <Button variant="secondary" icon={FileText} onClick={() => toast("info", "Exporting PDF…")}>Export PDF</Button>
              <Button variant="secondary" icon={FileSpreadsheet} onClick={() => toast("info", "Exporting Excel…")}>Export Excel</Button>
            </div>
          </div>
          <table className="w-full text-sm tbl-resp">
            <thead><tr><TH>Action</TH><TH>Details</TH><TH>By</TH><TH>Time</TH><TH>IP Address</TH></tr></thead>
            <tbody>
              {auditLog.filter(a => !actionFilter || a.action === actionFilter).map((a, i) => (
                <tr key={i} style={{ background: i % 2 ? "#1C2640" : C.surface }} className="row-hover">
                  <td className="px-4 py-3"><Pill color={C.amber} label={a.action} /></td>
                  <td className="px-4 py-3" style={{ color: C.text }}>{a.details}</td>
                  <td className="px-4 py-3" style={{ color: C.textSec }}>{a.by}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: C.textMuted }}>{a.time}</td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: C.textSec }}>{a.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ============================================================
   SLIDE-OVER ROUTER & FORMS
============================================================ */
function SlideRouter({ slide, setSlide, toast, departments, setDepartments, programmes, setProgrammes, lecturers, setLecturers, courses, setCourses, students, setStudents }: any) {
  if (!slide) return null;
  const close = () => setSlide(null);

  if (slide.type === "department") return <DepartmentForm data={slide.data} onClose={close} onSave={(d: any) => {
    if (slide.data) { setDepartments(departments.map((x: any) => x.id === d.id ? d : x)); toast("success", "Department updated"); }
    else { setDepartments([...departments, { ...d, id: Date.now(), programmes: 0, students: 0 }]); toast("success", "Department created"); }
    close();
  }} />;

  if (slide.type === "programme") return <ProgrammeForm data={slide.data} departments={departments} onClose={close} onSave={(p: any) => {
    if (slide.data) { setProgrammes(programmes.map((x: any) => x.id === p.id ? p : x)); toast("success", "Programme updated"); }
    else { setProgrammes([...programmes, { ...p, id: Date.now(), students: 0 }]); toast("success", "Programme created"); }
    close();
  }} />;

  if (slide.type === "course" || slide.type === "clone-course") return <CourseForm data={slide.type === "clone-course" ? null : slide.data} clone={slide.type === "clone-course" ? slide.data : null} programmes={programmes} lecturers={lecturers} onClose={close} onSave={(c: any) => {
    if (slide.data && slide.type === "course") { setCourses(courses.map((x: any) => x.id === c.id ? c : x)); toast("success", "Course updated"); }
    else { setCourses([...courses, { ...c, id: Date.now(), avg: 0 }]); toast("success", slide.type === "clone-course" ? "Course cloned" : "Course created"); }
    close();
  }} />;

  if (slide.type === "lecturer") return <LecturerForm data={slide.data} departments={departments} onClose={close} onSave={(l: any) => {
    if (slide.data) { setLecturers(lecturers.map((x: any) => x.id === l.id ? l : x)); toast("success", "Lecturer updated"); }
    else { setLecturers([...lecturers, { ...l, id: Date.now(), courses: 0, sessions: 0 }]); toast("success", "Lecturer added · invitation sent"); }
    close();
  }} />;

  if (slide.type === "student") return <StudentForm data={slide.data} programmes={programmes} departments={departments} onClose={close} onSave={(s: any) => {
    if (slide.data) { setStudents(students.map((x: any) => x.id === s.id ? s : x)); toast("success", "Student updated"); }
    else { setStudents([...students, { ...s, id: Date.now(), invitation: "Pending", attendance: 0, status: "active" }]); toast("success", "Student added · invitation sent"); }
    close();
  }} />;

  if (slide.type === "move-level") return <MoveLevelForm data={slide.data} onClose={close} onSave={(level: number) => {
    setStudents(students.map((x: any) => x.id === slide.data.id ? { ...x, level } : x));
    toast("success", "Student moved");
    close();
  }} />;

  if (slide.type === "override") return <OverrideForm data={slide.data} courses={courses} onClose={close} onSave={() => { toast("success", "Override submitted · logged in audit trail"); close(); }} />;

  if (slide.type === "year") return <YearForm onClose={close} onSave={() => { toast("success", "Academic year created"); close(); }} />;

  return null;
}

function FormFooter({ onCancel, onSave, label = "Save" }: any) {
  return (
    <>
      <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      <Button onClick={onSave}>{label}</Button>
    </>
  );
}

function DepartmentForm({ data, onClose, onSave }: any) {
  const [name, setName] = useState(data?.name || "");
  const [code, setCode] = useState(data?.code || "");
  const [faculty, setFaculty] = useState(data?.faculty || "");
  const [active, setActive] = useState(data?.active ?? true);
  const [err, setErr] = useState<any>({});

  const submit = () => {
    const e: any = {};
    if (!name) e.name = "Required";
    if (!code) e.code = "Required";
    setErr(e);
    if (Object.keys(e).length) return;
    onSave({ ...(data || {}), name, code: code.toUpperCase(), faculty, active });
  };

  return (
    <SlideOver open onClose={onClose} title={data ? "Edit Department" : "Add Department"} subtitle="Department details"
      footer={<FormFooter onCancel={onClose} onSave={submit} label={data ? "Save Changes" : "Save Department"} />}>
      <div className="space-y-4">
        <Field label="Department Name" required error={err.name}><Input value={name} onChange={setName} placeholder="e.g. Computer Science" error={err.name} /></Field>
        <Field label="Department Code" required error={err.code} hint="Auto-uppercase, max 5 chars">
          <Input value={code} onChange={(v: string) => setCode(v.toUpperCase())} maxLength={5} placeholder="e.g. DCS" error={err.code} />
        </Field>
        <Field label="Faculty / School"><Input value={faculty} onChange={setFaculty} placeholder="e.g. Faculty of Computing" /></Field>
        <Field label="Status">
          <div className="flex items-center justify-between p-3 rounded-md" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
            <span className="text-sm" style={{ color: C.text }}>{active ? "Active" : "Inactive"}</span>
            <Toggle value={active} onChange={setActive} />
          </div>
        </Field>
      </div>
    </SlideOver>
  );
}

function ProgrammeForm({ data, departments, onClose, onSave }: any) {
  const [name, setName] = useState(data?.name || "");
  const [code, setCode] = useState(data?.code || "");
  const [deptId, setDeptId] = useState(data?.deptId ? String(data.deptId) : "");
  const [duration, setDuration] = useState(data?.duration || 4);
  const [active, setActive] = useState(data?.active ?? true);
  const [err, setErr] = useState<any>({});
  const levels = Array.from({ length: Number(duration) || 0 }, (_, i) => `Level ${(i + 1) * 100}`);

  const submit = () => {
    const e: any = {};
    if (!name) e.name = "Required"; if (!code) e.code = "Required"; if (!deptId) e.deptId = "Required";
    setErr(e); if (Object.keys(e).length) return;
    onSave({ ...(data || {}), name, code: code.toUpperCase(), deptId: Number(deptId), duration: Number(duration), active });
  };

  return (
    <SlideOver open onClose={onClose} title={data ? "Edit Programme" : "Add Programme"} subtitle="Programme details"
      footer={<FormFooter onCancel={onClose} onSave={submit} label={data ? "Save Changes" : "Save Programme"} />}>
      <div className="space-y-4">
        <Field label="Programme Name" required error={err.name}><Input value={name} onChange={setName} placeholder="e.g. BSc Computer Science" error={err.name} /></Field>
        <Field label="Programme Code" required error={err.code}><Input value={code} onChange={(v: string) => setCode(v.toUpperCase())} placeholder="e.g. BSCS" error={err.code} /></Field>
        <Field label="Department" required error={err.deptId}>
          <Select value={deptId} onChange={setDeptId} placeholder="Select department">
            {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </Field>
        <Field label="Duration in Years" required>
          <Input type="number" value={duration} onChange={(v: any) => setDuration(Math.min(6, Math.max(1, Number(v) || 1)))} />
        </Field>
        <Field label="Levels Preview">
          <div className="flex gap-1.5 flex-wrap p-3 rounded-md" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
            {levels.length ? levels.map((l) => <Pill key={l} color={C.blue} label={l} />) : <span className="text-xs" style={{ color: C.textMuted }}>Enter duration above</span>}
          </div>
        </Field>
        <Field label="Status">
          <div className="flex items-center justify-between p-3 rounded-md" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
            <span className="text-sm" style={{ color: C.text }}>{active ? "Active" : "Archived"}</span>
            <Toggle value={active} onChange={setActive} />
          </div>
        </Field>
      </div>
    </SlideOver>
  );
}

function CourseForm({ data, clone, programmes, lecturers, onClose, onSave }: any) {
  const src = data || clone;
  const [title, setTitle] = useState(src?.title || "");
  const [code, setCode] = useState(clone ? `${src.code}-C` : src?.code || "");
  const [programmeId, setProgrammeId] = useState(src?.programmeId ? String(src.programmeId) : "");
  const [level, setLevel] = useState(src?.level ? String(src.level) : "");
  const [semester, setSemester] = useState(src?.semester ? String(src.semester) : "1");
  const [credits, setCredits] = useState(src?.credits || 3);
  const [lecturerId, setLecturerId] = useState(src?.lecturerId ? String(src.lecturerId) : "");
  const [threshold, setThreshold] = useState(src?.threshold || 75);
  const [active, setActive] = useState(src?.active ?? true);
  const [err, setErr] = useState<any>({});

  const programme = programmes.find((p: any) => p.id === Number(programmeId));
  const levels = programme ? Array.from({ length: programme.duration }, (_, i) => (i + 1) * 100) : [];

  const submit = () => {
    const e: any = {};
    if (!title) e.title = "Required"; if (!code) e.code = "Required"; if (!programmeId) e.programmeId = "Required";
    if (!level) e.level = "Required"; if (!lecturerId) e.lecturerId = "Required";
    setErr(e); if (Object.keys(e).length) return;
    onSave({
      ...(data || {}), title, code: code.toUpperCase(),
      programmeId: Number(programmeId), level: Number(level), semester: Number(semester),
      credits: Number(credits), lecturerId: Number(lecturerId), threshold: Number(threshold), active,
    });
  };

  return (
    <SlideOver open onClose={onClose} title={clone ? "Clone Course" : data ? "Edit Course" : "Add Course"} subtitle="Course configuration"
      footer={<FormFooter onCancel={onClose} onSave={submit} label={data ? "Save Changes" : clone ? "Clone Course" : "Create Course"} />}>
      <div className="space-y-4">
        <Field label="Course Title" required error={err.title}><Input value={title} onChange={setTitle} placeholder="e.g. Database Systems" error={err.title} /></Field>
        <Field label="Course Code" required error={err.code}><Input value={code} onChange={(v: string) => setCode(v.toUpperCase())} placeholder="e.g. CS301" error={err.code} /></Field>
        <Field label="Programme" required error={err.programmeId}>
          <Select value={programmeId} onChange={(v: string) => { setProgrammeId(v); setLevel(""); }} placeholder="Select programme">
            {programmes.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Level" required error={err.level}>
            <Select value={level} onChange={setLevel} placeholder="Select">{levels.map((l) => <option key={l} value={l}>Level {l}</option>)}</Select>
          </Field>
          <Field label="Semester" required>
            <Select value={semester} onChange={setSemester}><option value="1">First</option><option value="2">Second</option></Select>
          </Field>
          <Field label="Credit Hours" required>
            <Input type="number" value={credits} onChange={(v: any) => setCredits(Math.min(6, Math.max(1, Number(v))))} />
          </Field>
          <Field label="Threshold %" required>
            <Input type="number" value={threshold} onChange={(v: any) => setThreshold(Math.min(100, Math.max(50, Number(v))))} />
          </Field>
        </div>
        <Field label="Assigned Lecturer" required error={err.lecturerId}>
          <Select value={lecturerId} onChange={setLecturerId} placeholder="Select lecturer">
            {lecturers.map((l: any) => <option key={l.id} value={l.id}>{l.name} ({l.staffId})</option>)}
          </Select>
        </Field>
        <div className="p-3 rounded-md flex gap-2" style={{ background: `${C.blue}10`, border: `1px solid ${C.blue}33` }}>
          <Info size={14} style={{ color: C.blue, flexShrink: 0, marginTop: 2 }} />
          <div className="text-xs" style={{ color: C.textSec }}>All students in this programme and level will be automatically enrolled.</div>
        </div>
        <Field label="Status">
          <div className="flex items-center justify-between p-3 rounded-md" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
            <span className="text-sm" style={{ color: C.text }}>{active ? "Active" : "Inactive"}</span>
            <Toggle value={active} onChange={setActive} />
          </div>
        </Field>
      </div>
    </SlideOver>
  );
}

function LecturerForm({ data, departments, onClose, onSave }: any) {
  const [name, setName] = useState(data?.name || "");
  const [email, setEmail] = useState(data?.email || "");
  const [staffId, setStaffId] = useState(data?.staffId || "");
  const [deptId, setDeptId] = useState(data?.deptId ? String(data.deptId) : "");
  const [phone, setPhone] = useState(data?.phone || "");
  const [active, setActive] = useState(data?.active ?? true);
  const [err, setErr] = useState<any>({});

  const submit = () => {
    const e: any = {};
    if (!name) e.name = "Required"; if (!email) e.email = "Required";
    if (!staffId) e.staffId = "Required"; if (!deptId) e.deptId = "Required";
    setErr(e); if (Object.keys(e).length) return;
    onSave({ ...(data || {}), name, email, staffId, deptId: Number(deptId), phone, active });
  };

  return (
    <SlideOver open onClose={onClose} title={data ? "Edit Lecturer" : "Add Lecturer"} subtitle="Faculty member details"
      footer={<FormFooter onCancel={onClose} onSave={submit} label={data ? "Save Changes" : "Add Lecturer & Send Invite"} />}>
      <div className="space-y-4">
        <Field label="Full Name" required error={err.name}><Input value={name} onChange={setName} placeholder="Dr. Ama Owusu" error={err.name} /></Field>
        <Field label="Official Email" required error={err.email}><Input type="email" value={email} onChange={setEmail} placeholder="a.owusu@knust.edu.gh" error={err.email} /></Field>
        <Field label="Staff ID Number" required error={err.staffId}><Input value={staffId} onChange={setStaffId} placeholder="EMP-001" error={err.staffId} /></Field>
        <Field label="Department" required error={err.deptId}>
          <Select value={deptId} onChange={setDeptId} placeholder="Select department">
            {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </Field>
        <Field label="Phone Number"><Input value={phone} onChange={setPhone} placeholder="+233 24 000 0000" /></Field>
        {!data && (
          <div className="p-3 rounded-md flex gap-2" style={{ background: `${C.blue}10`, border: `1px solid ${C.blue}33` }}>
            <Info size={14} style={{ color: C.blue, flexShrink: 0, marginTop: 2 }} />
            <div className="text-xs" style={{ color: C.textSec }}>An activation email will be sent valid for 72 hours.</div>
          </div>
        )}
        {data && <Field label="Status">
          <div className="flex items-center justify-between p-3 rounded-md" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
            <span className="text-sm" style={{ color: C.text }}>{active ? "Active" : "Suspended"}</span>
            <Toggle value={active} onChange={setActive} />
          </div>
        </Field>}
      </div>
    </SlideOver>
  );
}

function StudentForm({ data, programmes, onClose, onSave }: any) {
  const [name, setName] = useState(data?.name || "");
  const [studentId, setStudentId] = useState(data?.studentId || "");
  const [email, setEmail] = useState(data?.email || "");
  const [programmeId, setProgrammeId] = useState(data?.programmeId ? String(data.programmeId) : "");
  const [level, setLevel] = useState(data?.level ? String(data.level) : "");
  const [semester, setSemester] = useState("1");
  const [err, setErr] = useState<any>({});
  const prog = programmes.find((p: any) => p.id === Number(programmeId));
  const levels = prog ? Array.from({ length: prog.duration }, (_, i) => (i + 1) * 100) : [];

  const submit = () => {
    const e: any = {};
    if (!name) e.name = "Required"; if (!studentId) e.studentId = "Required"; if (!email) e.email = "Required";
    if (!programmeId) e.programmeId = "Required"; if (!level) e.level = "Required";
    setErr(e); if (Object.keys(e).length) return;
    onSave({ ...(data || {}), name, studentId, email, programmeId: Number(programmeId), level: Number(level), semester });
  };

  return (
    <SlideOver open onClose={onClose} title={data ? "Edit Student" : "Add Student"} subtitle="Student registration"
      footer={<FormFooter onCancel={onClose} onSave={submit} label={data ? "Save Changes" : "Add Student & Send Invite"} />}>
      <div className="space-y-4">
        <Field label="Full Name" required error={err.name}><Input value={name} onChange={setName} placeholder="Kwame Asante" error={err.name} /></Field>
        <Field label="Student ID" required error={err.studentId}><Input value={studentId} onChange={setStudentId} placeholder="STU-0001" error={err.studentId} /></Field>
        <Field label="Official Email" required error={err.email}><Input type="email" value={email} onChange={setEmail} placeholder="k.asante@knust.edu.gh" error={err.email} /></Field>
        <Field label="Programme" required error={err.programmeId}>
          <Select value={programmeId} onChange={(v: string) => { setProgrammeId(v); setLevel(""); }} placeholder="Select programme">
            {programmes.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Level" required error={err.level}>
            <Select value={level} onChange={setLevel} placeholder="Select">{levels.map((l) => <option key={l} value={l}>Level {l}</option>)}</Select>
          </Field>
          <Field label="Semester of Entry">
            <Select value={semester} onChange={setSemester}><option value="1">First</option><option value="2">Second</option></Select>
          </Field>
        </div>
        {!data && (
          <div className="p-3 rounded-md flex gap-2" style={{ background: `${C.blue}10`, border: `1px solid ${C.blue}33` }}>
            <Info size={14} style={{ color: C.blue, flexShrink: 0, marginTop: 2 }} />
            <div className="text-xs" style={{ color: C.textSec }}>Registration email valid for 48 hours.</div>
          </div>
        )}
      </div>
    </SlideOver>
  );
}

function MoveLevelForm({ data, onClose, onSave }: any) {
  const [lvl, setLvl] = useState(String(data.level + 100));
  return (
    <SlideOver open onClose={onClose} title="Move Student to New Level" subtitle={data.name}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(Number(lvl))}>Confirm</Button></>}>
      <div className="space-y-4">
        <Field label="Current Level"><Input value={`Level ${data.level}`} onChange={() => {}} /></Field>
        <Field label="New Level" required>
          <Select value={lvl} onChange={setLvl}>{[100, 200, 300, 400].map((l) => <option key={l} value={l}>Level {l}</option>)}</Select>
        </Field>
      </div>
    </SlideOver>
  );
}

function OverrideForm({ data, courses, onClose, onSave }: any) {
  const [courseId, setCourseId] = useState("");
  const [session, setSession] = useState("");
  const [status, setStatus] = useState("Present");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<any>({});
  const submit = () => {
    const e: any = {};
    if (!courseId) e.courseId = "Required"; if (!session) e.session = "Required"; if (!reason) e.reason = "Reason required";
    setErr(e); if (Object.keys(e).length) return;
    onSave();
  };
  return (
    <SlideOver open onClose={onClose} title="Manual Attendance Override" subtitle={data.name}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Submit Override</Button></>}>
      <div className="space-y-4">
        <Field label="Course" required error={err.courseId}>
          <Select value={courseId} onChange={setCourseId} placeholder="Select course">
            {courses.map((c: any) => <option key={c.id} value={c.id}>{c.code} · {c.title}</option>)}
          </Select>
        </Field>
        <Field label="Session" required error={err.session}>
          <Select value={session} onChange={setSession} placeholder="Select session">
            <option value="s1">Today · 10:30 AM</option>
            <option value="s2">Yesterday · 10:30 AM</option>
            <option value="s3">Monday · 10:30 AM</option>
          </Select>
        </Field>
        <Field label="Override Status" required>
          <div className="grid grid-cols-2 gap-2">
            {["Present", "Absent"].map((s) => (
              <button key={s} onClick={() => setStatus(s)} className="h-10 rounded-md text-sm font-medium transition-all"
                style={{ background: status === s ? (s === "Present" ? C.green : C.red) : C.bg, color: status === s ? "#fff" : C.text, border: `1px solid ${status === s ? "transparent" : C.borderStrong}` }}>
                {s}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Reason" required error={err.reason}>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Document the justification for this override…"
            className="w-full p-3 rounded-md text-sm" style={{ background: C.bg, border: `1px solid ${err.reason ? C.red : C.borderStrong}`, color: C.text, resize: "vertical" }} />
        </Field>
        <div className="p-3 rounded-md flex gap-2" style={{ background: `${C.amber}10`, border: `1px solid ${C.amber}33` }}>
          <AlertTriangle size={14} style={{ color: C.amber, flexShrink: 0, marginTop: 2 }} />
          <div className="text-xs" style={{ color: C.textSec }}>This action is logged in the audit trail.</div>
        </div>
      </div>
    </SlideOver>
  );
}

function YearForm({ onClose, onSave }: any) {
  const [year, setYear] = useState("2025/2026");
  const [count, setCount] = useState(2);
  const [active, setActive] = useState(false);
  return (
    <SlideOver open onClose={onClose} title="New Academic Year" subtitle="Configure year and semesters"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={onSave}>Create</Button></>}>
      <div className="space-y-4">
        <Field label="Academic Year" required><Input value={year} onChange={setYear} placeholder="e.g. 2025/2026" /></Field>
        <Field label="Number of Semesters" required>
          <div className="grid grid-cols-2 gap-2">
            {[2, 3].map((n) => (
              <button key={n} onClick={() => setCount(n)} className="h-10 rounded-md text-sm font-medium transition-all"
                style={{ background: count === n ? C.amber : C.bg, color: count === n ? C.bg : C.text, border: `1px solid ${count === n ? "transparent" : C.borderStrong}` }}>{n} Semesters</button>
            ))}
          </div>
        </Field>
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="text-xs font-semibold mb-3" style={{ color: C.text }}>Semester {i + 1}</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Date"><input type="date" className="w-full h-10 px-3 rounded-md text-sm" style={{ background: C.bg, border: `1px solid ${C.borderStrong}`, color: C.text }} /></Field>
              <Field label="End Date"><input type="date" className="w-full h-10 px-3 rounded-md text-sm" style={{ background: C.bg, border: `1px solid ${C.borderStrong}`, color: C.text }} /></Field>
            </div>
          </Card>
        ))}
        <Field label="Set as Active Year">
          <div className="flex items-center justify-between p-3 rounded-md" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
            <span className="text-sm" style={{ color: C.text }}>{active ? "Yes — activate immediately" : "No — create as scheduled"}</span>
            <Toggle value={active} onChange={setActive} />
          </div>
        </Field>
      </div>
    </SlideOver>
  );
}

/* ============================================================
   CONFIRM MODAL
============================================================ */
function ConfirmModal({ title, body, danger, requireType, onConfirm, onClose }: any) {
  const [text, setText] = useState("");
  const ok = !requireType || text === "CONFIRM";
  return (
    <div className="fixed inset-0 z-[55] fade-in flex items-center justify-center p-4" style={{ background: "rgba(7,11,20,0.8)" }}>
      <Card className="w-full max-w-md p-5" style={{ borderTop: `3px solid ${danger ? C.red : C.amber}` }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0" style={{ background: `${danger ? C.red : C.amber}1A`, color: danger ? C.red : C.amber }}>
            <AlertTriangle size={17} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold" style={{ color: C.text }}>{title}</h3>
            <p className="text-sm mt-1" style={{ color: C.textSec }}>{body}</p>
            {requireType && (
              <div className="mt-3"><Input value={text} onChange={setText} placeholder="Type CONFIRM" /></div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? "danger" : "primary"} disabled={!ok} onClick={() => { onConfirm(); onClose(); }}>Confirm</Button>
        </div>
      </Card>
    </div>
  );
}

/* ============================================================
   TOAST
============================================================ */
function Toast({ t }: { t: ToastT }) {
  const map = {
    success: { c: C.green, i: CheckCircle2 },
    error: { c: C.red, i: XCircle },
    info: { c: C.blue, i: Info },
    warning: { c: C.amber, i: AlertTriangle },
  } as const;
  const m = map[t.type];
  const Icon = m.i;
  return (
    <div className="toast-in flex items-start gap-3 px-4 py-3 rounded-md min-w-[280px] max-w-sm"
      style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${m.c}`, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
      <Icon size={16} style={{ color: m.c, marginTop: 1 }} />
      <div className="text-sm" style={{ color: C.text }}>{t.msg}</div>
    </div>
  );
}

/* ============================================================
   LOGIN SCREEN
============================================================ */
function LoginScreen({ onLogin, setup }: { onLogin: (email: string) => void; setup?: Setup }) {
  const DEMO_EMAIL = setup?.adminEmail || "admin@knust.edu.gh";
  const DEMO_PASS = "admin123";
  const accent = setup?.primary || C.amber;
  const [email, setEmail] = useState(DEMO_EMAIL);

  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!email.trim() || !password) { setErr("Enter your email and password."); return; }
    setBusy(true);
    setTimeout(() => {
      if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASS) {
        onLogin(email.trim());
      } else {
        setErr("Invalid credentials. Use the demo account shown below.");
        setBusy(false);
      }
    }, 550);
  };

  const inputStyle: CSSProperties = {
    background: C.bg, color: C.text, border: `1px solid ${C.borderStrong}`,
    borderRadius: 8, height: 42, padding: "0 14px", width: "100%", fontSize: 14,
  };

  return (
    <div className="min-h-screen w-full flex items-stretch" style={{ background: C.bg, color: C.text }}>
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden" style={{ width: "46%", background: `linear-gradient(160deg, ${C.surface} 0%, #0E1626 100%)`, borderRight: `1px solid ${C.border}` }}>
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full" style={{ background: `radial-gradient(circle, ${C.amber}22 0%, transparent 70%)` }} />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full" style={{ background: `radial-gradient(circle, ${C.blue}22 0%, transparent 70%)` }} />
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-md flex items-center justify-center" style={{ background: `${C.amber}1A`, border: `1px solid ${C.amber}33` }}>
            <GraduationCap size={22} style={{ color: C.amber }} />
          </div>
          <div>
            <div className="font-display text-2xl leading-none">{setup?.shortCode || "KNUST"}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] mt-1.5" style={{ color: C.textSec }}>Smart Attendance · Admin</div>
          </div>
        </div>

        <div className="relative">
          <h1 className="font-display text-4xl leading-tight mb-4" style={{ color: C.text }}>
            Run attendance with<br />intelligence and trust.
          </h1>
          <p className="text-sm leading-relaxed max-w-md" style={{ color: C.textSec }}>
            QR sessions, face verification, threshold alerts and institution-wide
            analytics — all in one secure administrative console.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-md">
            {[
              { v: "12,484", l: "Students" },
              { v: "9", l: "Departments" },
              { v: "98.2%", l: "Uptime" },
            ].map((s) => (
              <div key={s.l} className="p-3 rounded-md" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
                <div className="text-lg font-semibold" style={{ color: C.amber }}>{s.v}</div>
                <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: C.textSec }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-[11px]" style={{ color: C.textMuted }}>
          © {new Date().getFullYear()} Kwame Nkrumah University of Science & Technology
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: `${C.amber}1A`, border: `1px solid ${C.amber}33` }}>
              <GraduationCap size={20} style={{ color: C.amber }} />
            </div>
            <div>
              <div className="font-display text-xl leading-none">{setup?.shortCode || "KNUST"}</div>
              <div className="text-[10px] uppercase tracking-[0.14em] mt-1" style={{ color: C.textSec }}>Admin Panel</div>
            </div>
          </div>

          <div className="mb-7">
            <div className="text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: C.amber }}>Sign in</div>
            <h2 className="font-display text-3xl mb-2" style={{ color: C.text }}>Welcome back, Admin</h2>
            <p className="text-sm" style={{ color: C.textSec }}>Access your institution's attendance command center.</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSec }}>Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
                <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@knust.edu.gh" style={{ ...inputStyle, paddingLeft: 38 }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium" style={{ color: C.textSec }}>Password</label>
                <button type="button" onClick={() => alert("Contact IT support to reset your admin password.")} className="text-[11px] font-medium hover:underline" style={{ color: C.amber }}>Forgot password?</button>
              </div>
              <div className="relative">
                <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
                <input type={showPw ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" style={{ ...inputStyle, paddingLeft: 38, paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded inline-flex items-center justify-center hover:bg-white/5" style={{ color: C.textSec }} aria-label="Toggle password visibility">
                  {showPw ? <EyeOff size={15} /> : <EyeIcon size={15} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded" style={{ accentColor: C.amber }} />
              <span className="text-xs" style={{ color: C.textSec }}>Keep me signed in on this device</span>
            </label>

            {err && (
              <div className="flex items-start gap-2 p-3 rounded-md" style={{ background: `${C.red}14`, border: `1px solid ${C.red}33` }}>
                <AlertCircle size={15} style={{ color: C.red, flexShrink: 0, marginTop: 1 }} />
                <div className="text-xs" style={{ color: C.text }}>{err}</div>
              </div>
            )}

            <button type="submit" disabled={busy}
              className={`w-full h-11 rounded-md font-semibold text-sm inline-flex items-center justify-center gap-2 transition ${busy ? "opacity-60 cursor-wait" : "hover:brightness-110"}`}
              style={{ background: C.amber, color: C.bg }}>
              {busy ? (<><RefreshCw size={15} className="animate-spin" /> Signing in…</>) : (<>Sign in to Admin <ArrowRight size={15} /></>)}
            </button>
          </form>

          <div className="mt-6 p-3.5 rounded-md" style={{ background: C.surface, border: `1px dashed ${C.borderStrong}` }}>
            <div className="flex items-center gap-2 mb-1.5">
              <Info size={13} style={{ color: C.amber }} />
              <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.text }}>Demo credentials</div>
            </div>
            <div className="text-[12px] grid grid-cols-[auto,1fr] gap-x-3 gap-y-1" style={{ color: C.textSec }}>
              <span>Email</span><span style={{ color: C.text, fontFamily: "monospace" }}>{DEMO_EMAIL}</span>
              <span>Password</span><span style={{ color: C.text, fontFamily: "monospace" }}>{DEMO_PASS}</span>
            </div>
          </div>

          <div className="text-[11px] text-center mt-8" style={{ color: C.textMuted }}>
            Protected by institutional SSO · Session encrypted end-to-end
          </div>
        </div>
      </div>
    </div>
  );
}


/* ============================================================
   SETUP WIZARD (first-run)
============================================================ */
function SetupWizard({ initial, onComplete }: { initial: Setup; onComplete: (s: Setup) => void }) {
  const [step, setStep] = useState(0);
  const [s, setS] = useState<Setup>(initial);
  const [err, setErr] = useState<string | null>(null);

  const update = <K extends keyof Setup>(k: K, v: Setup[K]) => setS((p) => ({ ...p, [k]: v }));
  const inputStyle: CSSProperties = {
    background: C.bg, color: C.text, border: `1px solid ${C.borderStrong}`,
    borderRadius: 8, height: 42, padding: "0 14px", width: "100%", fontSize: 14,
  };
  const swatches = ["#F59E0B", "#3B82F6", "#10B981", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];

  const onLogoChange = (file: File | null) => {
    if (!file) return;
    if (file.size > 1024 * 1024) { setErr("Logo must be under 1 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => update("logo", reader.result as string);
    reader.readAsDataURL(file);
  };

  const next = () => {
    setErr(null);
    if (step === 0) {
      if (!s.name.trim() || !s.shortCode.trim()) { setErr("Institution name and short code are required."); return; }
      if (s.shortCode.length > 10) { setErr("Short code must be 10 characters or fewer."); return; }
    }
    if (step === 2) {
      if (!s.adminName.trim() || !s.adminEmail.trim()) { setErr("Administrator name and email are required."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.adminEmail)) { setErr("Enter a valid admin email address."); return; }
    }
    if (step === 3) { onComplete(s); return; }
    setStep((x) => x + 1);
  };
  const back = () => { setErr(null); setStep((x) => Math.max(0, x - 1)); };

  const steps = ["Institution", "Branding", "Administrator", "Review"];
  const accent = s.primary;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8" style={{ background: C.bg, color: C.text }}>
      <div className="w-full max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-md flex items-center justify-center overflow-hidden" style={{ background: `${accent}1A`, border: `1px solid ${accent}33` }}>
            {s.logo ? <img src={s.logo} alt="" className="w-full h-full object-cover" /> : <GraduationCap size={22} style={{ color: accent }} />}
          </div>
          <div>
            <div className="font-display text-2xl leading-none">{s.shortCode || "Your Institution"}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] mt-1.5" style={{ color: C.textSec }}>Smart Attendance · First-time setup</div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto">
          {steps.map((label, i) => {
            const active = i === step;
            const done = i < step;
            return (
              <div key={label} className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-2 px-3 h-9 rounded-md"
                  style={{
                    background: active ? `${accent}1F` : done ? `${C.green}14` : C.surface,
                    border: `1px solid ${active ? `${accent}55` : done ? `${C.green}44` : C.border}`,
                    color: active ? C.text : done ? C.green : C.textSec,
                  }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: active ? accent : done ? C.green : C.raised, color: active || done ? C.bg : C.textSec }}>
                    {done ? <Check size={12} /> : i + 1}
                  </div>
                  <span className="text-xs font-semibold">{label}</span>
                </div>
                {i < steps.length - 1 && <ChevronRight size={14} style={{ color: C.textMuted }} />}
              </div>
            );
          })}
        </div>

        <div className="rounded-xl p-6 sm:p-8" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: accent }}>Step 1 of 4</div>
                <h2 className="font-display text-2xl mb-1">Tell us about your institution</h2>
                <p className="text-sm" style={{ color: C.textSec }}>This appears across the admin panel, reports, and notifications.</p>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSec }}>Full institution name *</label>
                <input value={s.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Kwame Nkrumah University of Science & Technology" style={inputStyle} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSec }}>Short code *</label>
                  <input value={s.shortCode} onChange={(e) => update("shortCode", e.target.value.toUpperCase())} placeholder="KNUST" maxLength={10} style={inputStyle} />
                  <div className="text-[10px] mt-1" style={{ color: C.textMuted }}>Shown in the sidebar and on login.</div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSec }}>Tagline</label>
                  <input value={s.tagline} onChange={(e) => update("tagline", e.target.value)} placeholder="Smart Attendance · Admin" style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSec }}>Country</label>
                  <input value={s.country} onChange={(e) => update("country", e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSec }}>Timezone</label>
                  <select value={s.timezone} onChange={(e) => update("timezone", e.target.value)} style={inputStyle as CSSProperties}>
                    {["Africa/Accra","Africa/Lagos","Africa/Nairobi","Africa/Johannesburg","Europe/London","UTC","America/New_York"].map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: accent }}>Step 2 of 4</div>
                <h2 className="font-display text-2xl mb-1">Branding</h2>
                <p className="text-sm" style={{ color: C.textSec }}>Upload a logo and pick an accent color.</p>
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: C.textSec }}>Institution logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
                    style={{ background: `${accent}1A`, border: `1px dashed ${accent}55` }}>
                    {s.logo ? <img src={s.logo} alt="logo" className="w-full h-full object-cover" /> : <ImageIcon size={28} style={{ color: accent }} />}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-3 h-9 rounded-md cursor-pointer text-sm font-semibold"
                      style={{ background: "transparent", color: C.text, border: `1px solid ${C.borderStrong}` }}>
                      <Upload size={14} /> {s.logo ? "Replace logo" : "Upload logo"}
                      <input type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={(e) => onLogoChange(e.target.files?.[0] || null)} />
                    </label>
                    {s.logo && (
                      <button onClick={() => update("logo", null)} className="ml-2 text-xs hover:underline" style={{ color: C.red }}>Remove</button>
                    )}
                    <div className="text-[10px] mt-2" style={{ color: C.textMuted }}>PNG, JPG, or SVG. Max 1 MB. Square works best.</div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: C.textSec }}>Accent color</label>
                <div className="flex flex-wrap gap-2.5">
                  {swatches.map((c) => (
                    <button key={c} onClick={() => update("primary", c)}
                      className="w-9 h-9 rounded-md transition-transform hover:scale-110"
                      style={{ background: c, border: `2px solid ${s.primary === c ? C.text : "transparent"}`, boxShadow: s.primary === c ? `0 0 0 3px ${c}33` : "none" }}
                      aria-label={c} />
                  ))}
                  <label className="w-9 h-9 rounded-md cursor-pointer flex items-center justify-center" style={{ border: `1px dashed ${C.borderStrong}` }} title="Custom color">
                    <Plus size={14} style={{ color: C.textSec }} />
                    <input type="color" value={s.primary} onChange={(e) => update("primary", e.target.value)} className="sr-only" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: accent }}>Step 3 of 4</div>
                <h2 className="font-display text-2xl mb-1">Create the primary administrator</h2>
                <p className="text-sm" style={{ color: C.textSec }}>This account owns institution-wide settings and audit access.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSec }}>Full name *</label>
                  <input value={s.adminName} onChange={(e) => update("adminName", e.target.value)} placeholder="System Admin" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSec }}>Email address *</label>
                  <input type="email" value={s.adminEmail} onChange={(e) => update("adminEmail", e.target.value)} placeholder="admin@knust.edu.gh" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSec }}>Active academic year</label>
                  <input value={s.academicYear} onChange={(e) => update("academicYear", e.target.value)} placeholder="2024/2025" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSec }}>Current semester</label>
                  <select value={s.semester} onChange={(e) => update("semester", e.target.value)} style={inputStyle as CSSProperties}>
                    {["Semester 1", "Semester 2", "Summer Session"].map(x => <option key={x} value={x}>{x}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-md" style={{ background: `${C.blue}10`, border: `1px solid ${C.blue}33` }}>
                <Info size={14} style={{ color: C.blue, flexShrink: 0, marginTop: 2 }} />
                <div className="text-xs" style={{ color: C.textSec }}>
                  Demo password <span className="font-mono" style={{ color: C.text }}>admin123</span> will be assigned. Change it from
                  <span style={{ color: C.text }}> Settings → Security</span> after sign-in.
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: accent }}>Step 4 of 4</div>
                <h2 className="font-display text-2xl mb-1">Review and finish</h2>
                <p className="text-sm" style={{ color: C.textSec }}>You can change any of these later in Settings.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ["Institution", s.name],
                  ["Short code", s.shortCode],
                  ["Tagline", s.tagline || "—"],
                  ["Country", s.country],
                  ["Timezone", s.timezone],
                  ["Accent", s.primary],
                  ["Administrator", `${s.adminName} · ${s.adminEmail}`],
                  ["Active term", `${s.academicYear} · ${s.semester}`],
                ].map(([k, v]) => (
                  <div key={k} className="p-3 rounded-md" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.textMuted }}>{k}</div>
                    <div className="text-sm font-medium truncate" style={{ color: C.text }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {err && (
            <div className="flex items-start gap-2 p-3 rounded-md mt-5" style={{ background: `${C.red}14`, border: `1px solid ${C.red}33` }}>
              <AlertCircle size={15} style={{ color: C.red, flexShrink: 0, marginTop: 1 }} />
              <div className="text-xs" style={{ color: C.text }}>{err}</div>
            </div>
          )}

          <div className="flex items-center justify-between mt-7 pt-5" style={{ borderTop: `1px solid ${C.border}` }}>
            <button onClick={back} disabled={step === 0}
              className={`inline-flex items-center gap-2 px-4 h-10 rounded-md text-sm font-semibold ${step === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/5"}`}
              style={{ color: C.textSec, border: `1px solid ${C.borderStrong}` }}>
              Back
            </button>
            <button onClick={next}
              className="inline-flex items-center gap-2 px-5 h-10 rounded-md text-sm font-semibold hover:brightness-110"
              style={{ background: accent, color: C.bg }}>
              {step === 3 ? (<>Finish setup <Check size={15} /></>) : (<>Continue <ArrowRight size={15} /></>)}
            </button>
          </div>
        </div>

        <div className="text-[11px] text-center mt-6" style={{ color: C.textMuted }}>
          Tip: clear browser storage to re-run this wizard anytime.
        </div>
      </div>
    </div>
  );
}
