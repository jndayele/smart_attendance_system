import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import {
  LayoutDashboard, BookOpen, Radio, History, BarChart3, Bell, UserCircle,
  LogOut, Menu, X, Eye, EyeOff, Lock, Check, ChevronDown, ChevronRight,
  Users, Clock, TrendingUp, Search, Mail, Edit3, MoreVertical, Trash2,
  RefreshCw, Info, QrCode, ScanFace, CheckCircle2, XCircle, AlertTriangle,
  Download, FileText, FileSpreadsheet, ArrowLeft, Plus, Home, Calendar,
  Shield, Settings, Camera, ChevronLeft, Zap, Activity,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend, Cell,
} from "recharts";

/* ============================ THEME ============================ */
const C = {
  bg: "#0F1623",
  surface: "#1A2236",
  raised: "#212D42",
  border: "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.15)",
  inputBorder: "rgba(255,255,255,0.12)",
  text: "#F0F4FF",
  text2: "#8B9DC3",
  muted: "#4A5C80",
  amber: "#F59E0B",
  green: "#10B981",
  red: "#EF4444",
  blue: "#3B82F6",
  purple: "#8B5CF6",
};

const FONT = "'DM Sans', sans-serif";

/* ============================ DATA ============================ */
const LECTURER = {
  name: "Dr. Ama Owusu",
  initials: "AO",
  title: "Senior Lecturer",
  dept: "Computer Science",
  staffId: "EMP-001",
  email: "ama.owusu@knust.edu.gh",
  since: "September 2022",
};

const COURSES = [
  { id: "cs301", code: "CS301", title: "Database Systems", prog: "BSc CS", level: "Level 300", sem: "Sem 1", credits: 3, students: 94, threshold: 75, sessions: 12, avg: 78.4, color: C.amber, atRisk: 3, status: "Active" },
  { id: "cs401", code: "CS401", title: "Algorithms", prog: "BSc CS", level: "Level 400", sem: "Sem 1", credits: 3, students: 67, threshold: 80, sessions: 14, avg: 81.2, color: C.blue, atRisk: 2, status: "Active" },
  { id: "cs201", code: "CS201", title: "Data Structures", prog: "BSc CS", level: "Level 200", sem: "Sem 1", credits: 3, students: 126, threshold: 75, sessions: 10, avg: 72.1, color: C.purple, atRisk: 3, status: "Active" },
];

const STUDENTS = [
  { id: "STU-0001", name: "Kwame Asante", present: 18, total: 24, pct: 75, email: "kwame.asante@st.knust.edu.gh" },
  { id: "STU-0002", name: "Ama Boateng", present: 22, total: 24, pct: 91, email: "ama.boateng@st.knust.edu.gh" },
  { id: "STU-0003", name: "Kofi Mensah", present: 14, total: 24, pct: 58, email: "kofi.mensah@st.knust.edu.gh" },
  { id: "STU-0004", name: "Akua Darko", present: 19, total: 24, pct: 79, email: "akua.darko@st.knust.edu.gh" },
  { id: "STU-0005", name: "Yaw Frimpong", present: 16, total: 24, pct: 66, email: "yaw.frimpong@st.knust.edu.gh" },
  { id: "STU-0006", name: "Abena Owusu", present: 23, total: 24, pct: 95, email: "abena.owusu@st.knust.edu.gh" },
  { id: "STU-0007", name: "Kweku Boateng", present: 13, total: 24, pct: 54, email: "kweku.boateng@st.knust.edu.gh" },
  { id: "STU-0008", name: "Adwoa Asiedu", present: 18, total: 24, pct: 75, email: "adwoa.asiedu@st.knust.edu.gh" },
  { id: "STU-0009", name: "Fiifi Andoh", present: 17, total: 24, pct: 70, email: "fiifi.andoh@st.knust.edu.gh" },
  { id: "STU-0010", name: "Nana Osei", present: 20, total: 24, pct: 83, email: "nana.osei@st.knust.edu.gh" },
];

const RECENT_SESSIONS = [
  { label: "Week 8 Lecture", date: "Jun 4, 2025", day: "04", month: "JUN", time: "10:00 AM", present: 78, total: 94, rate: 83, status: "Completed", face: 62, qr: 16, course: "Database Systems", code: "CS301" },
  { label: "Week 7 Lecture", date: "May 28, 2025", day: "28", month: "MAY", time: "10:00 AM", present: 71, total: 94, rate: 75.5, status: "Completed", face: 55, qr: 16, course: "Database Systems", code: "CS301" },
  { label: "Week 6 Lecture", date: "May 21, 2025", day: "21", month: "MAY", time: "10:00 AM", present: 65, total: 94, rate: 69.1, status: "Completed", face: 50, qr: 15, course: "Database Systems", code: "CS301" },
  { label: "Week 5 Lecture", date: "May 14, 2025", day: "14", month: "MAY", time: "10:00 AM", present: 82, total: 94, rate: 87.2, status: "Completed", face: 68, qr: 14, course: "Database Systems", code: "CS301" },
  { label: "Week 4 Lecture", date: "May 7, 2025", day: "07", month: "MAY", time: "10:00 AM", present: 79, total: 94, rate: 84, status: "Completed", face: 60, qr: 19, course: "Database Systems", code: "CS301" },
];

const CS401_SESSIONS = [
  { label: "Week 8 Lecture", date: "Jun 3, 2025", day: "03", month: "JUN", time: "2:00 PM", present: 56, total: 67, rate: 83.6, status: "Completed", face: 44, qr: 12, course: "Algorithms", code: "CS401" },
  { label: "Week 7 Lecture", date: "May 27, 2025", day: "27", month: "MAY", time: "2:00 PM", present: 51, total: 67, rate: 76.1, status: "Completed", face: 40, qr: 11, course: "Algorithms", code: "CS401" },
];

const CHART_SESSIONS = [
  { name: "Wk 1", label: "Week 1", date: "Apr 9", pct: 88, present: 83, total: 94 },
  { name: "Wk 2", label: "Week 2", date: "Apr 16", pct: 81, present: 76, total: 94 },
  { name: "Wk 3", label: "Week 3", date: "Apr 23", pct: 73, present: 69, total: 94 },
  { name: "Wk 4", label: "Week 4", date: "May 7", pct: 84, present: 79, total: 94 },
  { name: "Wk 5", label: "Week 5", date: "May 14", pct: 87, present: 82, total: 94 },
  { name: "Wk 6", label: "Week 6", date: "May 21", pct: 69, present: 65, total: 94 },
  { name: "Wk 7", label: "Week 7", date: "May 28", pct: 76, present: 71, total: 94 },
  { name: "Wk 8", label: "Week 8", date: "Jun 4", pct: 83, present: 78, total: 94 },
];

const WEEKLY_TREND = [
  { name: "Wk 1", CS301: 88, CS401: 84, CS201: 75 },
  { name: "Wk 2", CS301: 81, CS401: 86, CS201: 71 },
  { name: "Wk 3", CS301: 73, CS401: 82, CS201: 69 },
  { name: "Wk 4", CS301: 84, CS401: 80, CS201: 74 },
  { name: "Wk 5", CS301: 87, CS401: 83, CS201: 72 },
  { name: "Wk 6", CS301: 69, CS401: 78, CS201: 68 },
  { name: "Wk 7", CS301: 76, CS401: 85, CS201: 73 },
  { name: "Wk 8", CS301: 83, CS401: 84, CS201: 70 },
];

const NOTIFICATIONS = [
  { id: 1, type: "threshold_alert", title: "Attendance Alert", desc: "Kofi Mensah's attendance dropped to 58% in CS301", time: "2h ago", unread: true },
  { id: 2, type: "session_reminder", title: "Open Session", desc: "Your CS201 session from Monday is still open", time: "3h ago", unread: true },
  { id: 3, type: "weekly_summary", title: "Weekly Summary", desc: "Avg attendance 79.3% across all courses", time: "Yesterday", unread: true },
  { id: 4, type: "threshold_alert", title: "Attendance Alert", desc: "Kweku Boateng dropped to 54% in CS301", time: "2 days ago", unread: true },
  { id: 5, type: "session_completed", title: "Session Completed", desc: "Session for CS301 Week 8 completed — 78/94 present", time: "2 days ago", unread: false },
  { id: 6, type: "session_completed", title: "Session Completed", desc: "Session for CS401 Week 8 completed — 56/67 present", time: "2 days ago", unread: false },
  { id: 7, type: "weekly_summary", title: "Weekly Summary", desc: "Last week's avg attendance was 80.1%", time: "1 week ago", unread: false },
  { id: 8, type: "system", title: "System Update", desc: "New semester 2024/2025 activated by admin", time: "1 week ago", unread: false },
  { id: 9, type: "threshold_alert", title: "Attendance Alert", desc: "Yaw Frimpong is approaching the threshold in CS301", time: "1 week ago", unread: false },
  { id: 10, type: "session_completed", title: "Session Completed", desc: "Session for CS201 Week 7 completed — 89/126 present", time: "2 weeks ago", unread: false },
  { id: 11, type: "session_reminder", title: "Reminder", desc: "Don't forget to export last month's reports", time: "2 weeks ago", unread: false },
  { id: 12, type: "system", title: "System", desc: "Your profile was reviewed by the admin", time: "3 weeks ago", unread: false },
];

const NOTIF_META = {
  threshold_alert: { color: C.red, icon: AlertTriangle },
  session_reminder: { color: C.amber, icon: Clock },
  session_completed: { color: C.green, icon: CheckCircle2 },
  weekly_summary: { color: C.blue, icon: BarChart3 },
  system: { color: C.purple, icon: Settings },
};

const SIM_NAMES = [
  "Kwame Asante", "Ama Boateng", "Kofi Mensah", "Akua Darko", "Yaw Frimpong",
  "Abena Owusu", "Kweku Boateng", "Adwoa Asiedu", "Fiifi Andoh", "Nana Osei",
  "Esi Quaye", "Kojo Anane", "Afia Mensah", "Yaa Asantewaa", "Kobby Lartey",
];

/* ============================ HELPERS ============================ */
const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const rateColor = (p: number, t = 75) => (p >= t ? C.green : p >= t - 15 ? C.amber : C.red);
const studentStatus = (s: any, t = 75) => {
  if (s.pct >= t) return { label: "Good Standing", color: C.green, key: "above" };
  if (s.pct >= t - 5) return { label: "At Risk", color: C.amber, key: "approaching" };
  return { label: "Defaulter", color: C.red, key: "below" };
};

/* ============================ TOAST ============================ */
type Toast = { id: number; type: "success" | "error" | "info" | "warning"; msg: string };
const ToastCtx = createContext<(t: Toast["type"], m: string) => void>(() => {});
const useToast = () => useContext(ToastCtx);

const TOAST_COLOR = { success: C.green, error: C.red, info: C.blue, warning: C.amber };
const TOAST_ICON = { success: CheckCircle2, error: XCircle, info: Info, warning: AlertTriangle };

function ToastHost({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed z-[200] flex flex-col gap-2 bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 w-[90vw] max-w-sm md:w-80">
      {toasts.map((t) => {
        const Icon = TOAST_ICON[t.type];
        return (
          <div key={t.id} className="flex items-center gap-3 rounded-lg px-4 py-3 animate-[slideUp_.25s_ease]"
            style={{ background: C.raised, border: `1px solid ${C.border}`, borderLeft: `3px solid ${TOAST_COLOR[t.type]}` }}>
            <Icon size={18} style={{ color: TOAST_COLOR[t.type], flexShrink: 0 }} />
            <span className="text-sm" style={{ color: C.text }}>{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ============================ PRIMITIVES ============================ */
function Btn({ variant = "primary", children, className = "", ...p }: any) {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all duration-200 px-4 min-h-[44px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: C.amber, color: C.bg },
    secondary: { background: "transparent", color: C.text, border: `1px solid ${C.borderStrong}` },
    danger: { background: C.red, color: "#fff" },
    success: { background: C.green, color: "#fff" },
    ghost: { background: "transparent", color: C.text2 },
  };
  return (
    <button {...p} className={`${base} ${className}`} style={{ ...styles[variant], ...(p.style || {}) }}>
      {children}
    </button>
  );
}

function Card({ children, className = "", top, hover, style }: any) {
  return (
    <div className={`rounded-[10px] ${hover ? "lec-hover-card" : ""} ${className}`}
      style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: top ? `3px solid ${top}` : undefined, ...style }}>
      {children}
    </div>
  );
}

function Badge({ color, children }: any) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: `${color}1A`, color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {children}
    </span>
  );
}

function Avatar({ name, size = 36, bg = C.blue }: any) {
  return (
    <div className="flex items-center justify-center rounded-full font-semibold flex-shrink-0"
      style={{ width: size, height: size, background: `${bg}`, color: "#fff", fontSize: size * 0.38 }}>
      {initials(name)}
    </div>
  );
}

function Input({ icon: Icon, ...p }: any) {
  return (
    <div className="relative">
      {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />}
      <input {...p}
        className={`w-full rounded-lg min-h-[44px] text-sm outline-none transition-colors lec-input ${Icon ? "pl-9 pr-3" : "px-3"} ${p.className || ""}`}
        style={{ background: C.bg, border: `1px solid ${C.inputBorder}`, color: C.text, ...(p.style || {}) }} />
    </div>
  );
}

function ProgressBar({ pct, color, h = 8 }: any) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ background: C.bg, height: h }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  );
}

function Ring({ pct, color, size = 56, stroke = 5, label }: any) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.bg} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .6s ease" }} />
      </svg>
      <span className="absolute text-xs font-semibold" style={{ color }}>{label ?? `${Math.round(pct)}%`}</span>
    </div>
  );
}

/* ============================ MODALS / SHEETS ============================ */
function Backdrop({ onClick }: any) {
  return <div className="fixed inset-0 z-[150]" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClick} />;
}

function ConfirmModal({ open, title, message, confirmLabel = "Confirm", variant = "danger", onConfirm, onClose }: any) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <Backdrop onClick={onClose} />
      <div className="fixed z-[160] left-0 right-0 bottom-0 md:left-1/2 md:top-1/2 md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2 md:w-[440px] animate-[slideUp_.25s_ease]">
        <div className="rounded-t-2xl md:rounded-[10px] p-6" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="md:hidden mx-auto w-10 h-1 rounded-full mb-4" style={{ background: C.muted }} />
          <h3 className="text-lg font-semibold" style={{ color: C.text }}>{title}</h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: C.text2 }}>{message}</p>
          <div className="mt-6 flex gap-3">
            <Btn variant="secondary" className="flex-1" onClick={onClose}>Cancel</Btn>
            <Btn variant={variant} className="flex-1" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Btn>
          </div>
        </div>
      </div>
    </>
  );
}

function SlideOver({ open, title, onClose, children }: any) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <Backdrop onClick={onClose} />
      <div className="fixed z-[160] left-0 right-0 bottom-0 max-h-[85vh] md:max-h-none md:left-auto md:top-0 md:bottom-0 md:right-0 md:w-[440px] flex flex-col rounded-t-2xl md:rounded-none animate-[slideUp_.3s_ease] md:animate-[slideLeft_.3s_ease]"
        style={{ background: C.surface, borderLeft: `1px solid ${C.border}` }}>
        <div className="md:hidden mx-auto w-10 h-1 rounded-full mt-3" style={{ background: C.muted }} />
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: C.border }}>
          <h3 className="font-semibold" style={{ color: C.text }}>{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg" style={{ color: C.text2 }}><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-4 flex-1">{children}</div>
      </div>
    </>
  );
}

/* ============================ NAV CONFIG ============================ */
const NAV = [
  { group: "MAIN", items: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "courses", label: "My Courses", icon: BookOpen },
  ]},
  { group: "SESSIONS", items: [
    { id: "session", label: "Active Session", icon: Radio, live: true },
    { id: "history", label: "Session History", icon: History },
  ]},
  { group: "REPORTS", items: [
    { id: "reports", label: "Attendance Reports", icon: BarChart3 },
  ]},
  { group: "ACCOUNT", items: [
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "profile", label: "Profile & Settings", icon: UserCircle },
  ]},
];

const BOTTOM_NAV = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "session", label: "Sessions", icon: Radio },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "profile", label: "Profile", icon: UserCircle },
];

/* ============================ MAIN ============================ */
export default function LecturerModule() {
  const [authed, setAuthed] = useState(false);
  const [showActivation, setShowActivation] = useState(false);
  const [view, setView] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [unread, setUnread] = useState(4);
  const [sessionLive, setSessionLive] = useState(false);
  const [liveCourse, setLiveCourse] = useState<any>(null);
  const [sessionState, setSessionState] = useState<"config" | "active" | "ended">("config");
  const [detailCourse, setDetailCourse] = useState<any>(null);
  const [confirm, setConfirm] = useState<any>(null);

  const toastId = useRef(0);
  const pushToast = useCallback((type: Toast["type"], msg: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, type, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  const go = (v: string) => { setLoading(true); setView(v); setDrawer(false); window.scrollTo(0, 0); };

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [loading, view]);

  if (!authed) {
    return (
      <ToastCtx.Provider value={pushToast}>
        <GlobalStyle />
        {showActivation
          ? <Activation onDone={() => { setAuthed(true); setView("dashboard"); }} onLogin={() => setShowActivation(false)} push={pushToast} />
          : <Login onLogin={() => { setAuthed(true); setView("dashboard"); }} onActivation={() => setShowActivation(true)} push={pushToast} />}
        <ToastHost toasts={toasts} />
      </ToastCtx.Provider>
    );
  }

  const openCourse = (c: any) => { setDetailCourse(c); go("courseDetail"); };
  const startSession = (c: any) => { setLiveCourse(c); setSessionState("config"); go("session"); };
  const goLive = () => { setSessionLive(true); setSessionState("active"); };
  const endSession = () => { setSessionState("ended"); setSessionLive(false); };

  return (
    <ToastCtx.Provider value={pushToast}>
      <GlobalStyle />
      <div className="min-h-screen flex" style={{ background: C.bg, fontFamily: FONT, color: C.text }}>
        {/* SIDEBAR (tablet icon-only / desktop full) */}
        <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 z-40 w-16 lg:w-60 border-r"
          style={{ background: C.surface, borderColor: C.border }}>
          <Sidebar view={view} go={go} sessionLive={sessionLive} unread={unread}
            onLogout={() => setConfirm({ title: "Log out?", message: "You will be returned to the login screen.", confirmLabel: "Log out", variant: "danger", onConfirm: () => { setAuthed(false); setShowActivation(false); } })} />
        </aside>

        {/* MOBILE DRAWER */}
        {drawer && (
          <>
            <div className="fixed inset-0 z-[90] md:hidden" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setDrawer(false)} />
            <aside className="fixed inset-y-0 left-0 z-[95] w-[80%] max-w-xs md:hidden flex flex-col animate-[slideLeftIn_.25s_ease]"
              style={{ background: C.surface, borderRight: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: C.border }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 22, color: C.text }}>KNUST</span>
                <button onClick={() => setDrawer(false)} style={{ color: C.text2 }}><X size={20} /></button>
              </div>
              <Sidebar view={view} go={go} sessionLive={sessionLive} unread={unread} forceLabels
                onLogout={() => { setDrawer(false); setConfirm({ title: "Log out?", message: "You will be returned to the login screen.", confirmLabel: "Log out", variant: "danger", onConfirm: () => { setAuthed(false); setShowActivation(false); } }); }} />
            </aside>
          </>
        )}

        {/* MAIN */}
        <div className="flex-1 flex flex-col md:ml-16 lg:ml-60 min-w-0">
          {/* HEADER */}
          <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 lg:px-6 border-b"
            style={{ background: `${C.bg}E6`, backdropFilter: "blur(8px)", borderColor: C.border }}>
            <button className="md:hidden p-2 rounded-lg -ml-2" style={{ color: C.text }} onClick={() => setDrawer(true)}><Menu size={22} /></button>
            <span className="md:hidden absolute left-1/2 -translate-x-1/2" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 20 }}>KNUST</span>
            <div className="hidden md:block min-w-0">
              <HeaderTitle view={view} detailCourse={detailCourse} />
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden lg:block text-sm" style={{ color: C.text2 }}>{new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</span>
              <button className="relative p-2 rounded-lg" style={{ color: C.text2 }} onClick={() => go("notifications")}>
                <Bell size={20} />
                {unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ background: C.amber, color: C.bg }}>{unread}</span>}
              </button>
            </div>
          </header>

          {/* CONTENT */}
          <main className="flex-1 p-4 lg:p-6 pb-24 md:pb-6 overflow-x-hidden">
            {loading ? <PageSkeleton view={view} /> : (
              <>
                {view === "dashboard" && <Dashboard go={go} startSession={startSession} openCourse={openCourse} sessionLive={sessionLive} liveCourse={liveCourse} />}
                {view === "courses" && <CoursesList openCourse={openCourse} startSession={startSession} push={pushToast} />}
                {view === "courseDetail" && detailCourse && <CourseDetail course={detailCourse} back={() => go("courses")} startSession={startSession} push={pushToast} setConfirm={setConfirm} />}
                {view === "session" && <SessionFlow state={sessionState} setState={setSessionState} course={liveCourse} go={go} goLive={goLive} endSession={() => setConfirm({ title: "End this session?", message: "This will finalise attendance for all 94 students. Students not checked in will be marked Absent.", confirmLabel: "End Session", variant: "danger", onConfirm: endSession })} push={pushToast} sessionLive={sessionLive} startSession={startSession} />}
                {view === "history" && <SessionHistory push={pushToast} setConfirm={setConfirm} />}
                {view === "reports" && <Reports push={pushToast} />}
                {view === "notifications" && <Notifications push={pushToast} clearUnread={() => setUnread(0)} setUnread={setUnread} go={go} />}
                {view === "profile" && <Profile push={pushToast} />}
              </>
            )}
          </main>
        </div>

        {/* BOTTOM NAV (mobile) */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 flex border-t" style={{ background: C.surface, borderColor: C.border }}>
          {BOTTOM_NAV.map((b) => {
            const active = view === b.id || (b.id === "session" && view === "session");
            return (
              <button key={b.id} onClick={() => go(b.id)} className="flex-1 flex flex-col items-center justify-center gap-1 relative">
                {b.id === "session" && sessionLive && <span className="absolute top-2 right-1/2 translate-x-3 w-2 h-2 rounded-full lec-pulse" style={{ background: C.green }} />}
                <b.icon size={22} style={{ color: active ? C.amber : C.muted }} fill={active ? C.amber : "none"} strokeWidth={active ? 2 : 1.8} />
                <span className="text-[10px] font-medium" style={{ color: active ? C.amber : C.muted }}>{b.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      <ConfirmModal open={!!confirm} {...(confirm || {})} onClose={() => setConfirm(null)} />
      <ToastHost toasts={toasts} />
    </ToastCtx.Provider>
  );
}

function HeaderTitle({ view, detailCourse }: any) {
  const map: Record<string, string> = {
    dashboard: "Dashboard", courses: "My Courses", session: "Attendance Session",
    history: "Session History", reports: "Attendance Reports", notifications: "Notifications", profile: "Profile & Settings",
  };
  if (view === "courseDetail" && detailCourse) return <h1 className="text-lg font-semibold truncate" style={{ color: C.text }}>{detailCourse.title}</h1>;
  return <h1 className="text-lg font-semibold" style={{ color: C.text }}>{map[view]}</h1>;
}

/* ============================ SIDEBAR ============================ */
function Sidebar({ view, go, sessionLive, unread, onLogout, forceLabels }: any) {
  const lbl = forceLabels ? "block" : "hidden lg:block";
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {!forceLabels && (
        <div className="h-16 flex items-center px-3 lg:px-5 border-b flex-shrink-0" style={{ borderColor: C.border }}>
          <div className="hidden lg:block">
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 24, color: C.text, lineHeight: 1 }}>KNUST</div>
            <div className="text-xs mt-0.5" style={{ color: C.text2 }}>Lecturer Portal</div>
          </div>
          <div className="lg:hidden mx-auto" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 20, color: C.amber }}>K</div>
        </div>
      )}
      <nav className="flex-1 py-4 px-2 lg:px-3 space-y-5">
        {NAV.map((sec) => (
          <div key={sec.group}>
            <div className={`px-2 mb-2 text-[10px] font-semibold tracking-wider ${lbl}`} style={{ color: C.muted }}>{sec.group}</div>
            <div className="space-y-1">
              {sec.items.map((it) => {
                const active = view === it.id || (it.id === "session" && view === "session");
                return (
                  <button key={it.id} onClick={() => go(it.id)} title={it.label}
                    className="w-full flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm transition-all relative"
                    style={{ background: active ? `${C.amber}14` : "transparent", color: active ? C.amber : C.text2, borderLeft: active ? `3px solid ${C.amber}` : "3px solid transparent" }}>
                    <span className="relative flex-shrink-0">
                      <it.icon size={19} />
                      {it.live && sessionLive && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full lec-pulse" style={{ background: C.green }} />}
                      {it.id === "notifications" && unread > 0 && <span className={`absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center ${forceLabels ? "" : "lg:hidden"}`} style={{ background: C.amber, color: C.bg }}>{unread}</span>}
                    </span>
                    <span className={`flex-1 text-left ${lbl}`}>{it.label}</span>
                    {it.id === "notifications" && unread > 0 && <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${lbl}`} style={{ background: C.amber, color: C.bg }}>{unread}</span>}
                    {it.live && sessionLive && <span className={`w-2 h-2 rounded-full lec-pulse ${lbl}`} style={{ background: C.green }} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      {/* footer */}
      <div className="p-2 lg:p-3 border-t flex-shrink-0" style={{ borderColor: C.border }}>
        <div className="flex items-center gap-3 rounded-lg p-2" style={{ background: C.raised }}>
          <Avatar name={LECTURER.name} size={36} bg={C.blue} />
          <div className={`min-w-0 flex-1 ${lbl}`}>
            <div className="text-sm font-medium truncate" style={{ color: C.text }}>{LECTURER.name}</div>
            <div className="text-xs truncate" style={{ color: C.text2 }}>{LECTURER.dept}</div>
          </div>
          <button onClick={onLogout} className={`p-1.5 rounded-lg ${lbl}`} style={{ color: C.text2 }} title="Logout"><LogOut size={16} /></button>
        </div>
      </div>
    </div>
  );
}

/* ============================ LOGIN ============================ */
function AuthShell({ children }: any) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ background: C.bg, fontFamily: FONT }}>
      <div className="text-center mb-8">
        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 32, color: C.text }}>KNUST</div>
        <div className="text-sm mt-1" style={{ color: C.text2 }}>Smart Attendance System — Lecturer Portal</div>
      </div>
      {children}
    </div>
  );
}

function Login({ onLogin, onActivation, push }: any) {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockLeft, setLockLeft] = useState(0);
  const [forgot, setForgot] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => setLockLeft((s) => { if (s <= 1) { setLocked(false); setAttempts(0); clearInterval(t); return 0; } return s - 1; }), 1000);
    return () => clearInterval(t);
  }, [locked]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const signIn = () => {
    if (locked) return;
    const next = attempts + 1;
    setAttempts(next);
    if (next >= 3) { setLocked(true); setLockLeft(15 * 60); }
  };

  return (
    <AuthShell>
      <Card className="w-full max-w-[440px] p-6 sm:p-8">
        <h2 className="text-xl font-semibold" style={{ color: C.text }}>Welcome back</h2>
        <p className="text-sm mt-1 mb-6" style={{ color: C.text2 }}>Sign in to your lecturer account</p>

        {locked && (
          <div className="mb-4 rounded-lg p-3 text-sm" style={{ background: `${C.red}14`, border: `1px solid ${C.red}40`, color: C.red }}>
            <div className="font-semibold flex items-center gap-2"><Lock size={15} /> Account locked</div>
            <div className="mt-1">Too many failed attempts. Try again in <span className="font-mono font-bold">{fmt(lockLeft)}</span></div>
          </div>
        )}
        {!locked && attempts > 0 && (
          <div className="mb-4 rounded-lg p-3 text-sm flex items-center gap-2" style={{ background: `${C.red}14`, border: `1px solid ${C.red}40`, color: C.red }}>
            <AlertTriangle size={15} /> Invalid email or password. {3 - attempts} attempt{3 - attempts !== 1 ? "s" : ""} remaining.
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: C.text2 }}>Email Address</label>
            <Input icon={Mail} type="email" placeholder="staff@knust.edu.gh" value={email} onChange={(e: any) => setEmail(e.target.value)} disabled={locked} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium" style={{ color: C.text2 }}>Password</label>
              <button className="text-sm font-medium" style={{ color: C.amber }} onClick={() => setForgot(!forgot)}>Forgot Password?</button>
            </div>
            <div className="relative">
              <Input icon={Lock} type={show ? "text" : "password"} placeholder="••••••••" value={pwd} onChange={(e: any) => setPwd(e.target.value)} disabled={locked} />
              <button className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} onClick={() => setShow(!show)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>

          {forgot && (
            <div className="rounded-lg p-4 animate-[fadeIn_.2s_ease]" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
              {resetSent ? (
                <div className="flex items-center gap-2 text-sm" style={{ color: C.green }}><CheckCircle2 size={16} /> Reset link sent! Check your email.</div>
              ) : (
                <>
                  <p className="text-sm mb-3" style={{ color: C.text2 }}>Enter your email to receive a reset link</p>
                  <Input icon={Mail} type="email" placeholder="staff@knust.edu.gh" />
                  <Btn className="w-full mt-3" onClick={() => { setResetSent(true); push("success", "Reset link sent"); }}>Send Reset Link</Btn>
                </>
              )}
            </div>
          )}

          <Btn className="w-full" onClick={signIn} disabled={locked}>Sign In</Btn>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: C.text2 }}>Don't have an account? Contact your institution admin.</p>
        <Btn variant="ghost" className="w-full mt-4" onClick={onLogin}>Enter as Dr. Ama Owusu (Demo)</Btn>
      </Card>
      <Btn variant="ghost" className="mt-4" onClick={onActivation}>View Activation Screen</Btn>
    </AuthShell>
  );
}

/* ============================ ACTIVATION ============================ */
function Activation({ onDone, onLogin, push }: any) {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [success, setSuccess] = useState(false);
  const [expired] = useState(false);

  const checks = {
    len: pwd.length >= 8,
    num: /\d/.test(pwd),
    sp: /[^A-Za-z0-9]/.test(pwd),
  };
  const score = Object.values(checks).filter(Boolean).length + (pwd.length >= 12 ? 1 : 0);
  const strength = pwd.length === 0 ? null : score <= 1 ? { l: "Weak", c: C.red, w: 25 } : score === 2 ? { l: "Fair", c: C.amber, w: 50 } : score === 3 ? { l: "Strong", c: C.blue, w: 75 } : { l: "Very Strong", c: C.green, w: 100 };
  const valid = checks.len && checks.num && checks.sp && pwd === confirm;

  const activate = () => { setSuccess(true); push("success", "Account activated!"); setTimeout(onDone, 2000); };

  if (expired) {
    return (
      <AuthShell>
        <Card className="w-full max-w-[440px] p-8 text-center" style={{ borderColor: `${C.red}40` }}>
          <XCircle size={48} className="mx-auto" style={{ color: C.red }} />
          <h2 className="text-xl font-semibold mt-4" style={{ color: C.text }}>Activation Link Expired</h2>
          <p className="text-sm mt-2" style={{ color: C.text2 }}>This activation link is no longer valid. Contact your admin for a new link.</p>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Card className="w-full max-w-[440px] p-6 sm:p-8">
        <h2 className="text-xl font-semibold" style={{ color: C.text }}>Activate Your Account</h2>
        <p className="text-sm mt-1 mb-6" style={{ color: C.text2 }}>You've been added as a lecturer. Set your password to get started.</p>

        {success && (
          <div className="mb-4 rounded-lg p-3 text-sm flex items-center gap-2" style={{ background: `${C.green}14`, border: `1px solid ${C.green}40`, color: C.green }}>
            <CheckCircle2 size={16} /> Account activated! Redirecting to dashboard…
          </div>
        )}

        <div className="space-y-4">
          {[{ l: "Name", v: LECTURER.name }, { l: "Email", v: "ama.owusu@knust.edu.gh" }].map((f) => (
            <div key={f.l}>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: C.text2 }}>{f.l}</label>
              <div className="relative">
                <input readOnly value={f.v} className="w-full rounded-lg min-h-[44px] px-3 pr-9 text-sm outline-none" style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.muted }} />
                <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
              </div>
            </div>
          ))}

          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: C.text2 }}>New Password</label>
            <div className="relative">
              <Input icon={Lock} type={show ? "text" : "password"} value={pwd} onChange={(e: any) => setPwd(e.target.value)} placeholder="Create a password" />
              <button className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} onClick={() => setShow(!show)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
            {strength && (
              <div className="mt-2">
                <ProgressBar pct={strength.w} color={strength.c} h={5} />
                <div className="text-xs mt-1" style={{ color: strength.c }}>{strength.l}</div>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: C.text2 }}>Confirm Password</label>
            <Input icon={Lock} type={show ? "text" : "password"} value={confirm} onChange={(e: any) => setConfirm(e.target.value)} placeholder="Re-enter password" />
            {confirm && pwd !== confirm && <div className="text-xs mt-1" style={{ color: C.red }}>Passwords do not match</div>}
          </div>

          <div className="space-y-1.5 rounded-lg p-3" style={{ background: C.bg }}>
            {[{ k: checks.len, t: "At least 8 characters" }, { k: checks.num, t: "At least one number" }, { k: checks.sp, t: "At least one special character" }].map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs" style={{ color: r.k ? C.green : C.muted }}>
                <Check size={14} style={{ opacity: r.k ? 1 : 0.4 }} /> {r.t}
              </div>
            ))}
          </div>

          <Btn className="w-full" disabled={!valid} onClick={activate}>Activate Account</Btn>
        </div>
        <Btn variant="ghost" className="w-full mt-4" onClick={onLogin}>Back to Login</Btn>
      </Card>
    </AuthShell>
  );
}

/* ============================ DASHBOARD ============================ */
function StatCard({ top, label, value, sub, icon: Icon }: any) {
  return (
    <Card top={top} hover className="p-4 lec-stat">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-2xl sm:text-3xl font-semibold" style={{ color: C.text }}>{value}</div>
          <div className="text-xs sm:text-sm mt-1" style={{ color: C.text2 }}>{label}</div>
        </div>
        <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${top}14` }}><Icon size={18} style={{ color: top }} /></div>
      </div>
      {sub && <div className="text-xs mt-2" style={{ color: C.muted }}>{sub}</div>}
    </Card>
  );
}

function Dashboard({ go, startSession, openCourse, sessionLive, liveCourse }: any) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: C.text }}>Good morning, Dr. Owusu 👋</h1>
          <p className="text-sm" style={{ color: C.text2 }}>Here's what's happening across your courses today.</p>
        </div>
      </div>

      {/* alert banner */}
      <button onClick={() => go("reports")} className="w-full text-left flex items-center gap-3 rounded-lg p-3 sm:p-4"
        style={{ background: `${C.amber}14`, border: `1px solid ${C.amber}40` }}>
        <AlertTriangle size={18} style={{ color: C.amber, flexShrink: 0 }} />
        <span className="text-sm flex-1" style={{ color: C.text }}>3 students in your courses are below the attendance threshold.</span>
        <span className="text-sm font-medium hidden sm:inline" style={{ color: C.amber }}>View at-risk students →</span>
      </button>

      {/* stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard top={C.blue} label="My Courses" value="3" sub="Active Courses" icon={BookOpen} />
        <StatCard top={C.amber} label="Total Students" value="287" sub="Enrolled" icon={Users} />
        <StatCard top={C.green} label="Sessions This Week" value="5" sub="Sessions" icon={Activity} />
        <StatCard top={C.red} label="At-Risk Students" value="8" sub="Below threshold" icon={AlertTriangle} />
      </div>

      {/* course cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold" style={{ color: C.text }}>My Courses</h2>
          <button className="text-sm font-medium" style={{ color: C.amber }} onClick={() => go("courses")}>View All →</button>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {COURSES.map((c) => {
            const live = sessionLive && liveCourse?.id === c.id;
            return (
              <Card key={c.id} hover className="overflow-hidden lec-course">
                <div style={{ height: 4, background: c.color }} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg" style={{ color: C.text }}>{c.title}</h3>
                    {live && <span className="lec-pulse text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1" style={{ background: `${C.green}1A`, color: C.green }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: C.green }} />LIVE</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Pill text={c.code} /><Pill text={c.prog} /><Pill text={c.level} />
                  </div>
                  <div className="text-xs mt-2" style={{ color: C.muted }}>{c.sem} · 2024/2025</div>

                  <div className="flex items-center gap-3 mt-4 text-xs" style={{ color: C.text2 }}>
                    <span className="flex items-center gap-1"><Users size={13} /> {c.students}</span>
                    <span className="flex items-center gap-1"><Clock size={13} /> {c.sessions}</span>
                    <span className="flex items-center gap-1"><TrendingUp size={13} /> {c.avg}%</span>
                  </div>

                  <div className="mt-3">
                    <ProgressBar pct={c.avg} color={rateColor(c.avg, c.threshold)} />
                  </div>
                  {c.atRisk > 0 && <div className="text-xs mt-2" style={{ color: C.red }}>{c.atRisk} students below threshold</div>}

                  <div className="flex gap-2 mt-4">
                    {live ? (
                      <Btn variant="success" className="flex-1" onClick={() => startSession(c)}><Radio size={15} /> View Session</Btn>
                    ) : (
                      <Btn className="flex-1" onClick={() => startSession(c)}><Plus size={15} /> Start Session</Btn>
                    )}
                    <Btn variant="secondary" className="flex-1" onClick={() => openCourse(c)}>View Course</Btn>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* two panels */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: C.text }}>Recent Sessions</h2>
            <button className="text-sm" style={{ color: C.amber }} onClick={() => go("history")}>View All →</button>
          </div>
          {/* desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr style={{ color: C.muted }}>
                {["Course", "Date", "Present", "Rate", "Status"].map((h) => <th key={h} className="text-left font-medium pb-2 px-2">{h}</th>)}
              </tr></thead>
              <tbody>
                {RECENT_SESSIONS.map((s, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: C.border }}>
                    <td className="py-3 px-2" style={{ color: C.text }}>{s.code}</td>
                    <td className="py-3 px-2" style={{ color: C.text2 }}>{s.date}</td>
                    <td className="py-3 px-2" style={{ color: C.text2 }}>{s.present}/{s.total}</td>
                    <td className="py-3 px-2 font-medium" style={{ color: rateColor(s.rate) }}>{s.rate}%</td>
                    <td className="py-3 px-2"><Badge color={C.green}>Completed</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* mobile cards */}
          <div className="sm:hidden space-y-2">
            {RECENT_SESSIONS.map((s, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: C.bg }}>
                <div className="flex justify-between"><span className="font-medium text-sm" style={{ color: C.text }}>{s.code} · {s.label}</span><Badge color={C.green}>Done</Badge></div>
                <div className="flex justify-between mt-2 text-xs" style={{ color: C.text2 }}><span>{s.date}</span><span>{s.present}/{s.total} · <span style={{ color: rateColor(s.rate) }}>{s.rate}%</span></span></div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold mb-4" style={{ color: C.text }}>Students at Risk</h2>
          <div className="space-y-2">
            {STUDENTS.filter((s) => s.pct < 72).slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg p-2" style={{ background: C.bg }}>
                <Avatar name={s.name} size={32} bg={C.purple} />
                <div className="min-w-0 flex-1"><div className="text-sm truncate" style={{ color: C.text }}>{s.name}</div><div className="text-xs" style={{ color: C.muted }}>CS301</div></div>
                <span className="text-sm font-bold" style={{ color: C.red }}>{s.pct}%</span>
              </div>
            ))}
          </div>
          <button className="text-sm mt-3" style={{ color: C.amber }} onClick={() => go("reports")}>View all 8 →</button>
        </Card>
      </div>

      {/* quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { l: "Start New Session", c: C.amber, icon: Plus, fn: () => startSession(COURSES[0]) },
          { l: "View Reports", c: C.blue, icon: BarChart3, fn: () => go("reports") },
          { l: "Export Attendance", c: C.green, icon: Download, fn: () => go("reports") },
          { l: "View All Students", c: C.purple, icon: Users, fn: () => openCourse(COURSES[0]) },
        ].map((a) => (
          <button key={a.l} onClick={a.fn} className="lec-hover-card">
            <Card hover className="p-4 flex flex-col items-center gap-2 text-center h-full justify-center">
              <div className="p-3 rounded-xl" style={{ background: `${a.c}14` }}><a.icon size={22} style={{ color: a.c }} /></div>
              <span className="text-sm font-medium" style={{ color: C.text }}>{a.l}</span>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}

function Pill({ text }: any) {
  return <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: C.raised, color: C.text2 }}>{text}</span>;
}

/* ============================ COURSES LIST ============================ */
function CoursesList({ openCourse, startSession, push }: any) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const list = COURSES.filter((c) => (status === "All" || c.status === status) && (c.title.toLowerCase().includes(q.toLowerCase()) || c.code.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: C.text }}>My Courses</h1>
        <p className="text-sm" style={{ color: C.text2 }}>2024/2025 — Semester 1</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1"><Input icon={Search} placeholder="Search by course name…" value={q} onChange={(e: any) => setQ(e.target.value)} /></div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg min-h-[44px] px-3 text-sm outline-none" style={{ background: C.bg, border: `1px solid ${C.inputBorder}`, color: C.text }}>
          {["All", "Active", "Inactive"].map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>
      <div className="text-xs" style={{ color: C.muted }}>{list.length} result{list.length !== 1 ? "s" : ""} found</div>

      {list.length === 0 ? (
        <Card className="p-10 text-center"><p style={{ color: C.text2 }}>No courses match your search. <button style={{ color: C.amber }} onClick={() => { setQ(""); setStatus("All"); }}>Clear filters</button></p></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((c) => {
            const above = Math.round(c.students * c.avg / 100);
            const below = c.students - above;
            return (
              <Card key={c.id} hover className="overflow-hidden lec-course">
                <div style={{ height: 4, background: c.color }} />
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <span className="text-xl font-bold" style={{ color: C.amber }}>{c.code}</span>
                    <Badge color={C.green}>{c.status}</Badge>
                  </div>
                  <h3 className="text-lg font-semibold mt-1" style={{ fontFamily: "'Playfair Display', serif", color: C.text }}>{c.title}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-2"><Pill text={c.prog} /><Pill text={c.level} /><Pill text={c.sem} /><Pill text={`${c.credits} credits`} /></div>
                  <div className="my-3 border-t" style={{ borderColor: C.border }} />
                  <div className="flex items-center gap-2 text-sm" style={{ color: C.text2 }}><Avatar name={LECTURER.name} size={26} bg={C.blue} /> {LECTURER.name}</div>

                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    {[{ v: c.students, l: "Enrolled" }, { v: c.sessions, l: "Sessions" }, { v: `${c.avg}%`, l: "Avg" }].map((s) => (
                      <div key={s.l} className="rounded-lg py-2" style={{ background: C.bg }}><div className="font-semibold" style={{ color: C.text }}>{s.v}</div><div className="text-[11px]" style={{ color: C.muted }}>{s.l}</div></div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span style={{ color: C.text2 }}>Threshold</span><span className="font-medium" style={{ color: C.amber }}>Min: {c.threshold}%</span>
                  </div>
                  <div className="mt-2 flex h-2 rounded-full overflow-hidden">
                    <div style={{ width: `${above / c.students * 100}%`, background: C.green }} />
                    <div style={{ width: `${below / c.students * 100}%`, background: C.red }} />
                  </div>
                  <div className="flex justify-between text-[11px] mt-1"><span style={{ color: C.green }}>{above} above</span><span style={{ color: C.red }}>{below} below</span></div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Btn className="flex-1 min-w-[120px]" onClick={() => openCourse(c)}>Open Course →</Btn>
                    <Btn variant="secondary" onClick={() => startSession(c)}><Plus size={15} /></Btn>
                    <Btn variant="secondary" onClick={() => push("success", "Report exported")}><Download size={15} /></Btn>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================ COURSE DETAIL ============================ */
function CourseDetail({ course, back, startSession, push, setConfirm }: any) {
  const [tab, setTab] = useState("students");
  const tabs = [{ id: "students", l: "Students" }, { id: "sessions", l: "Sessions" }, { id: "reports", l: "Reports" }];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <button onClick={back} className="flex items-center gap-1.5 text-sm" style={{ color: C.text2 }}><ArrowLeft size={16} /> Back to Courses</button>
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl sm:text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: C.text }}>{course.title}</h1>
        <span className="text-sm font-bold px-2 py-1 rounded-md" style={{ background: `${C.amber}1A`, color: C.amber }}>{course.code}</span>
        <Badge color={C.green}>{course.status}</Badge>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: C.text2 }}>
        <span>{course.prog}</span><span>·</span><span>{course.level}</span><span>·</span><span>{course.sem}</span><span>·</span><span>{course.credits} Credit Hours</span><span>·</span><span style={{ color: C.amber }}>Min Threshold: {course.threshold}%</span>
      </div>

      {/* tabs */}
      <div className="sticky top-16 z-20 flex gap-1 border-b -mx-4 px-4 lg:mx-0 lg:px-0" style={{ background: C.bg, borderColor: C.border }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-3 text-sm font-medium relative transition-colors"
            style={{ color: tab === t.id ? C.amber : C.text2 }}>
            {t.l}
            {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: C.amber }} />}
          </button>
        ))}
      </div>

      <div key={tab} className="animate-[fadeIn_.2s_ease]">
        {tab === "students" && <StudentsTab course={course} push={push} />}
        {tab === "sessions" && <SessionsTab course={course} startSession={startSession} push={push} setConfirm={setConfirm} />}
        {tab === "reports" && <Reports scoped={course} push={push} />}
      </div>
    </div>
  );
}

function StudentsTab({ course, push }: any) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [sel, setSel] = useState<any>(null);
  const above = STUDENTS.filter((s) => s.pct >= course.threshold).length;
  const below = STUDENTS.length - above;

  let list = STUDENTS.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.id.toLowerCase().includes(q.toLowerCase()));
  if (filter === "Above Threshold") list = list.filter((s) => s.pct >= course.threshold);
  if (filter === "Below Threshold") list = list.filter((s) => s.pct < course.threshold);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard top={C.blue} label="Total Enrolled" value={course.students} icon={Users} />
        <StatCard top={C.green} label="Above Threshold" value={`${above}`} icon={CheckCircle2} />
        <StatCard top={C.red} label="Below Threshold" value={`${below}`} icon={AlertTriangle} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1"><Input icon={Search} placeholder="Search by name or ID…" value={q} onChange={(e: any) => setQ(e.target.value)} /></div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg min-h-[44px] px-3 text-sm outline-none" style={{ background: C.bg, border: `1px solid ${C.inputBorder}`, color: C.text }}>
          {["All", "Above Threshold", "Below Threshold", "Absent Today"].map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>

      {/* desktop table */}
      <Card className="hidden lg:block overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr style={{ color: C.muted }} className="border-b" >
            {["Student", "ID", "Attendance", "Present", "Status", "Actions"].map((h) => <th key={h} className="text-left font-medium p-3" style={{ borderColor: C.border }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {list.map((s) => {
              const st = studentStatus(s, course.threshold);
              return (
                <tr key={s.id} onClick={() => setSel(s)} className="border-t cursor-pointer lec-row" style={{ borderColor: C.border }}>
                  <td className="p-3"><div className="flex items-center gap-2"><Avatar name={s.name} size={30} bg={C.blue} /><span style={{ color: C.text }}>{s.name}</span></div></td>
                  <td className="p-3" style={{ color: C.text2 }}>{s.id}</td>
                  <td className="p-3"><div className="flex items-center gap-2"><Ring pct={s.pct} color={st.color} size={34} stroke={4} /></div></td>
                  <td className="p-3" style={{ color: C.text2 }}>{s.present}/{s.total}</td>
                  <td className="p-3"><Badge color={st.color}>{st.label}</Badge></td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-lg lec-icon-btn" onClick={() => setSel(s)} title="View"><Eye size={15} style={{ color: C.text2 }} /></button>
                      <button className="p-1.5 rounded-lg lec-icon-btn" onClick={() => push("info", "Manual override opened")} title="Edit"><Edit3 size={15} style={{ color: C.text2 }} /></button>
                      <button className="p-1.5 rounded-lg lec-icon-btn" onClick={() => push("warning", `Warning email sent to ${s.name}`)} title="Email"><Mail size={15} style={{ color: C.amber }} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* mobile cards */}
      <div className="lg:hidden space-y-3">
        {list.map((s) => {
          const st = studentStatus(s, course.threshold);
          return (
            <Card key={s.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Avatar name={s.name} size={36} bg={C.blue} /><div><div className="text-sm font-medium" style={{ color: C.text }}>{s.name}</div><div className="text-xs" style={{ color: C.muted }}>{s.id}</div></div></div>
                <span className="text-xl font-bold" style={{ color: st.color }}>{s.pct}%</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <Badge color={st.color}>{st.label}</Badge>
                <span className="text-xs" style={{ color: C.text2 }}>Present: {s.present}/{s.total}</span>
              </div>
              <Btn variant="secondary" className="w-full mt-3" onClick={() => setSel(s)}>View Details</Btn>
            </Card>
          );
        })}
      </div>
      {list.length === 0 && <Card className="p-8 text-center"><p style={{ color: C.text2 }}>No students match your search.</p></Card>}

      <SlideOver open={!!sel} title="Student Details" onClose={() => setSel(null)}>
        {sel && <StudentDetail s={sel} course={course} push={push} />}
      </SlideOver>
    </div>
  );
}

function StudentDetail({ s, course, push }: any) {
  const st = studentStatus(s, course.threshold);
  const history = [
    { date: "Jun 4, 2025", label: "Week 8 Lecture", time: "10:02 AM", method: "face", status: "Present" },
    { date: "May 28, 2025", label: "Week 7 Lecture", time: "10:05 AM", method: "qr", status: "Present" },
    { date: "May 21, 2025", label: "Week 6 Lecture", time: "—", method: "—", status: "Absent" },
    { date: "May 14, 2025", label: "Week 5 Lecture", time: "10:01 AM", method: "face", status: "Present" },
    { date: "May 7, 2025", label: "Week 4 Lecture", time: "10:08 AM", method: "qr", status: "Present" },
  ];
  return (
    <div>
      <div className="flex flex-col items-center text-center pb-4 border-b" style={{ borderColor: C.border }}>
        <Avatar name={s.name} size={72} bg={C.blue} />
        <h3 className="text-lg font-semibold mt-3" style={{ color: C.text }}>{s.name}</h3>
        <div className="text-sm" style={{ color: C.text2 }}>{s.id} · {course.prog} · {course.level}</div>
        <div className="mt-3 text-4xl font-bold" style={{ color: st.color }}>{s.pct}%</div>
        <div className="text-xs" style={{ color: C.muted }}>Overall attendance · {course.code}</div>
        <div className="mt-2"><Badge color={st.color}>{st.label}</Badge></div>
      </div>
      <h4 className="text-sm font-semibold mt-4 mb-2" style={{ color: C.text }}>Attendance History</h4>
      <div className="space-y-2">
        {history.map((h, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg p-3" style={{ background: C.bg }}>
            <div className="flex-1 min-w-0"><div className="text-sm" style={{ color: C.text }}>{h.label}</div><div className="text-xs" style={{ color: C.muted }}>{h.date} · {h.time}</div></div>
            {h.method === "face" && <ScanFace size={16} style={{ color: C.blue }} />}
            {h.method === "qr" && <QrCode size={16} style={{ color: C.amber }} />}
            <Badge color={h.status === "Present" ? C.green : C.red}>{h.status}</Badge>
          </div>
        ))}
      </div>
      <Btn variant="secondary" className="w-full mt-4" onClick={() => push("info", "Manual override saved")}><Edit3 size={15} /> Manual Override</Btn>
    </div>
  );
}

function SessionsTab({ course, startSession, push, setConfirm }: any) {
  const [sel, setSel] = useState<any>(null);
  const [menu, setMenu] = useState<number | null>(null);
  const sessions = course.code === "CS401" ? CS401_SESSIONS : RECENT_SESSIONS;
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Btn onClick={() => startSession(course)}><Plus size={16} /> Start New Session</Btn>
      </div>
      <div className="space-y-3">
        {sessions.map((s, i) => (
          <Card key={i} hover className="p-4 lec-session-card">
            <div className="flex gap-4">
              <div className="flex flex-col items-center justify-center rounded-lg px-3 py-2 flex-shrink-0" style={{ background: `${C.amber}14`, minWidth: 56 }}>
                <span className="text-xl font-bold" style={{ color: C.amber }}>{s.day}</span>
                <span className="text-[10px] font-semibold" style={{ color: C.amber }}>{s.month}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold" style={{ color: C.text }}>{s.label}</div>
                <div className="text-xs" style={{ color: C.muted }}>{s.time} — 11:30 AM</div>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                  <span style={{ color: C.green }}>✓ {s.present} Present</span>
                  <span style={{ color: C.red }}>✗ {s.total - s.present} Absent</span>
                  <span style={{ color: rateColor(s.rate) }}>{s.rate}% Rate</span>
                </div>
                <div className="text-xs mt-1" style={{ color: C.muted }}>{s.face} via Face Scan, {s.qr} via QR Code</div>
              </div>
              <div className="flex flex-col items-end gap-2 relative">
                <Badge color={C.green}>Completed</Badge>
                <button onClick={() => setMenu(menu === i ? null : i)} className="p-1.5 rounded-lg lec-icon-btn"><MoreVertical size={16} style={{ color: C.text2 }} /></button>
                {menu === i && (
                  <div className="absolute right-0 top-10 z-20 w-44 rounded-lg py-1 shadow-xl" style={{ background: C.raised, border: `1px solid ${C.border}` }} onMouseLeave={() => setMenu(null)}>
                    <button className="w-full text-left px-3 py-2 text-sm lec-row" style={{ color: C.text }} onClick={() => { setSel(s); setMenu(null); }}>View Details</button>
                    <button className="w-full text-left px-3 py-2 text-sm lec-row" style={{ color: C.text }} onClick={() => { setSel(s); setMenu(null); }}>Edit Override</button>
                    <button className="w-full text-left px-3 py-2 text-sm" style={{ color: C.muted, cursor: "not-allowed" }} title="Cannot delete — attendance recorded" disabled>Delete Session</button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <SlideOver open={!!sel} title="Session Details" onClose={() => setSel(null)}>
        {sel && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold" style={{ color: C.text }}>{sel.label}</h3>
              <div className="text-sm" style={{ color: C.text2 }}>{sel.date} · {sel.time} · {course.code}</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg py-2" style={{ background: C.bg }}><div className="font-semibold" style={{ color: C.green }}>{sel.present}</div><div className="text-[11px]" style={{ color: C.muted }}>Present</div></div>
              <div className="rounded-lg py-2" style={{ background: C.bg }}><div className="font-semibold" style={{ color: C.red }}>{sel.total - sel.present}</div><div className="text-[11px]" style={{ color: C.muted }}>Absent</div></div>
              <div className="rounded-lg py-2" style={{ background: C.bg }}><div className="font-semibold" style={{ color: C.amber }}>{sel.rate}%</div><div className="text-[11px]" style={{ color: C.muted }}>Rate</div></div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2" style={{ color: C.text }}>Attendance</h4>
              <div className="space-y-2">
                {STUDENTS.slice(0, 6).map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2 rounded-lg p-2" style={{ background: C.bg }}>
                    <Avatar name={s.name} size={28} bg={C.blue} />
                    <span className="text-sm flex-1 truncate" style={{ color: C.text }}>{s.name}</span>
                    {i % 4 === 2 ? <Badge color={C.red}>Absent</Badge> : (i % 2 ? <QrCode size={15} style={{ color: C.amber }} /> : <ScanFace size={15} style={{ color: C.blue }} />)}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg p-3" style={{ background: `${C.amber}10`, border: `1px solid ${C.amber}30` }}>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: C.text }}><Edit3 size={14} /> Manual Override</h4>
              <select className="w-full rounded-lg min-h-[40px] px-2 text-sm mb-2" style={{ background: C.bg, border: `1px solid ${C.inputBorder}`, color: C.text }}>
                {STUDENTS.map((s) => <option key={s.id}>{s.name}</option>)}
              </select>
              <div className="flex gap-2 mb-2">
                <Btn variant="success" className="flex-1">Present</Btn>
                <Btn variant="danger" className="flex-1">Absent</Btn>
              </div>
              <textarea placeholder="Reason (required)…" className="w-full rounded-lg p-2 text-sm outline-none" rows={2} style={{ background: C.bg, border: `1px solid ${C.inputBorder}`, color: C.text }} />
              <div className="text-[11px] my-2 flex items-center gap-1" style={{ color: C.amber }}><Info size={12} /> All overrides are logged in the audit trail</div>
              <Btn className="w-full" onClick={() => { push("success", "Override submitted"); }}>Submit Override</Btn>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}

/* ============================ SESSION FLOW ============================ */
function SessionFlow({ state, setState, course, go, goLive, endSession, push, sessionLive, startSession }: any) {
  const c = course || COURSES[0];
  if (!course && !sessionLive) {
    // entered via nav with no active session
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <Radio size={48} className="mx-auto" style={{ color: C.muted }} />
        <h2 className="text-xl font-semibold mt-4" style={{ color: C.text }}>No Active Session</h2>
        <p className="text-sm mt-2 mb-6" style={{ color: C.text2 }}>Start a new attendance session for one of your courses.</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {COURSES.map((cc) => (
            <Card key={cc.id} hover className="p-4 text-center cursor-pointer" onClick={() => startSession(cc)}>
              <div className="text-sm font-bold" style={{ color: C.amber }}>{cc.code}</div>
              <div className="text-sm mt-1" style={{ color: C.text }}>{cc.title}</div>
              <Btn className="w-full mt-3" onClick={(e: any) => { e.stopPropagation(); startSession(cc); }}><Plus size={14} /> Start</Btn>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  if (state === "config") return <SessionConfig course={c} go={go} goLive={goLive} push={push} />;
  if (state === "active") return <SessionActive course={c} endSession={endSession} push={push} />;
  return <SessionEnded course={c} go={go} setState={setState} push={push} />;
}

function SessionConfig({ course, go, goLive, push }: any) {
  const [expiry, setExpiry] = useState(15);
  const [sel, setSel] = useState(course.id);
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-1" style={{ color: C.text }}>Start Attendance Session</h2>
        <p className="text-sm mb-6" style={{ color: C.text2 }}>Configure and go live in seconds.</p>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: C.text2 }}>Course</label>
            <select value={sel} onChange={(e) => setSel(e.target.value)} className="w-full rounded-lg min-h-[44px] px-3 text-sm outline-none" style={{ background: C.bg, border: `1px solid ${C.inputBorder}`, color: C.text }}>
              {COURSES.map((c) => <option key={c.id} value={c.id}>{c.title} — {c.code}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: C.text2 }}>Session Label / Title (optional)</label>
            <Input placeholder="e.g. Week 5 Lecture — Introduction to SQL" defaultValue="Week 9 Lecture" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium mb-1.5 block" style={{ color: C.text2 }}>Date</label><Input icon={Calendar} type="date" defaultValue="2025-06-07" /></div>
            <div><label className="text-sm font-medium mb-1.5 block" style={{ color: C.text2 }}>Time</label><Input icon={Clock} type="time" defaultValue="10:00" /></div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: C.text2 }}>QR Code Expiry Duration</label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 15, 20, 30].map((m) => (
                <button key={m} onClick={() => setExpiry(m)} className="rounded-lg min-h-[44px] text-sm font-medium transition-all"
                  style={{ background: expiry === m ? C.amber : C.bg, color: expiry === m ? C.bg : C.text2, border: `1px solid ${expiry === m ? C.amber : C.inputBorder}` }}>{m} min</button>
              ))}
            </div>
          </div>
          <div className="rounded-lg p-3 flex gap-3" style={{ background: `${C.blue}10`, border: `1px solid ${C.blue}30` }}>
            <Info size={18} style={{ color: C.blue, flexShrink: 0 }} />
            <p className="text-xs leading-relaxed" style={{ color: C.text2 }}>A unique QR code and 6-character verification code will be generated. Display the QR code on your projector and announce the verification code verbally to students.</p>
          </div>
          <div className="flex gap-3">
            <Btn variant="ghost" className="flex-1" onClick={() => go("dashboard")}>Cancel</Btn>
            <Btn className="flex-1" onClick={() => { goLive(); push("success", "Session is now live!"); }}><Zap size={16} /> Create Session & Go Live</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SessionActive({ course, endSession, push }: any) {
  const TOTAL = 94;
  const [qrLeft, setQrLeft] = useState(15 * 60);
  const [duration, setDuration] = useState(0);
  const [checkedIn, setCheckedIn] = useState<any[]>([]);
  const [showAbsent, setShowAbsent] = useState(false);
  const [refreshConfirm, setRefreshConfirm] = useState(false);
  const usedNames = useRef(new Set<string>());

  useEffect(() => {
    const t = setInterval(() => { setQrLeft((s) => (s > 0 ? s - 1 : 0)); setDuration((d) => d + 1); }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (checkedIn.length >= 47) return;
    const delay = 2500 + Math.random() * 1500;
    const t = setTimeout(() => {
      const avail = SIM_NAMES.filter((n) => !usedNames.current.has(n));
      const name = avail.length ? avail[Math.floor(Math.random() * avail.length)] : `Student ${checkedIn.length + 1}`;
      usedNames.current.add(name);
      const method = Math.random() > 0.3 ? "face" : "qr";
      const entry = { name, method, time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) };
      setCheckedIn((p) => [entry, ...p]);
      push("success", `${name} checked in via ${method === "face" ? "Face Scan" : "QR Code"}`);
    }, delay);
    return () => clearTimeout(t);
  }, [checkedIn, push]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const durFmt = `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  const low = qrLeft < 120;
  const pct = Math.round(checkedIn.length / TOTAL * 100);

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <span className="lec-pulse text-sm font-semibold px-3 py-1.5 rounded-full flex items-center gap-2" style={{ background: `${C.green}1A`, color: C.green }}><span className="w-2 h-2 rounded-full" style={{ background: C.green }} /> SESSION LIVE</span>
        <span className="font-semibold" style={{ color: C.text }}>Week 9 Lecture</span>
        <span className="text-sm" style={{ color: C.text2 }}>· {course.title} {course.code}</span>
      </div>
      <div className="text-sm mb-5" style={{ color: low ? C.red : C.text2 }}>Session ends in: <span className="font-mono font-bold">{fmt(qrLeft)}</span></div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* LEFT */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-6 flex flex-col items-center" style={{ background: "#fff" }}>
            <QrPattern size={typeof window !== "undefined" && window.innerWidth < 768 ? 240 : 280} />
            <div className={`mt-4 font-mono text-2xl font-bold ${low ? "lec-pulse" : ""}`} style={{ color: low ? C.red : C.amber }}>Expires in: {fmt(qrLeft)}</div>
            <Btn variant="secondary" className="mt-3" style={{ color: "#0F1623", borderColor: "rgba(0,0,0,0.15)" }} onClick={() => setRefreshConfirm(true)}><RefreshCw size={15} /> Refresh QR Code</Btn>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold" style={{ color: C.text }}>Verification Code</h3>
              <span className="group relative" title="Announce this code verbally. Only those physically present will know it.">
                <Info size={15} style={{ color: C.muted }} />
              </span>
            </div>
            <div className="flex gap-2 justify-center">
              {"AX72KC".split("").map((ch, i) => (
                <div key={i} className="flex items-center justify-center rounded-lg font-mono text-2xl font-bold" style={{ width: 48, height: 56, background: C.bg, border: `1px solid ${C.amber}40`, color: C.amber }}>{ch}</div>
              ))}
            </div>
            <p className="text-xs text-center mt-3" style={{ color: C.muted }}>Students must enter this before scanning</p>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: C.text }}>Checked In</h3>
              <Ring pct={pct} color={C.green} size={64} stroke={6} label={`${checkedIn.length}/${TOTAL}`} />
            </div>
            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 360 }}>
              {checkedIn.length === 0 && <p className="text-sm text-center py-6" style={{ color: C.muted }}>Waiting for students to check in…</p>}
              {checkedIn.map((e, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg p-2 animate-[fadeIn_.4s_ease]" style={{ background: C.bg }}>
                  <Avatar name={e.name} size={32} bg={e.method === "face" ? C.blue : C.amber} />
                  <span className="text-sm flex-1 truncate" style={{ color: C.text }}>{e.name}</span>
                  {e.method === "face" ? <ScanFace size={15} style={{ color: C.blue }} /> : <QrCode size={15} style={{ color: C.amber }} />}
                  <span className="text-xs" style={{ color: C.muted }}>{e.time}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAbsent(!showAbsent)} className="w-full text-left text-sm mt-3 flex items-center gap-1" style={{ color: C.text2 }}>
              <ChevronRight size={14} className="transition-transform" style={{ transform: showAbsent ? "rotate(90deg)" : "none" }} /> {TOTAL - checkedIn.length} students not yet checked in
            </button>
            {showAbsent && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {Array.from({ length: Math.min(TOTAL - checkedIn.length, 8) }).map((_, i) => (
                  <div key={i} className="text-xs px-2 py-1.5 rounded" style={{ background: C.bg, color: C.muted }}>Pending student #{i + 1}</div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <ProgressBar pct={pct} color={C.green} />
              <div className="text-xs mt-1.5" style={{ color: C.text2 }}>{checkedIn.length} of {TOTAL} students checked in ({pct}%)</div>
            </div>
          </Card>
        </div>
      </div>

      {/* bottom bar */}
      <div className="fixed bottom-0 md:left-16 lg:left-60 left-0 right-0 z-30 flex items-center justify-between px-4 lg:px-6 py-3 border-t" style={{ background: C.surface, borderColor: C.border }}>
        <span className="text-sm" style={{ color: C.text2 }}>Session running: <span className="font-mono font-semibold" style={{ color: C.text }}>{durFmt}</span></span>
        <Btn variant="danger" onClick={endSession}><XCircle size={16} /> End Session</Btn>
      </div>

      <ConfirmModal open={refreshConfirm} title="Refresh QR Code?" message="Generate a new QR code for this session? The current code will stop working." confirmLabel="Refresh" variant="primary" onConfirm={() => { setQrLeft(15 * 60); push("info", "QR code refreshed"); }} onClose={() => setRefreshConfirm(false)} />
    </div>
  );
}

function QrPattern({ size = 280 }: any) {
  const n = 21;
  const cells = [];
  for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) {
    const finder = (r < 7 && col < 7) || (r < 7 && col >= n - 7) || (r >= n - 7 && col < 7);
    const on = finder ? ((r === 0 || r === 6 || col === 0 || col === 6 || (r >= 2 && r <= 4 && col >= 2 && col <= 4)) ) : (Math.random() > 0.5);
    if (on) cells.push(<rect key={`${r}-${col}`} x={col * (size / n)} y={r * (size / n)} width={size / n} height={size / n} fill="#000" />);
  }
  return <svg width={size} height={size} style={{ display: "block" }}>{cells}</svg>;
}

function SessionEnded({ course, go, setState, push }: any) {
  const [tab, setTab] = useState("present");
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="text-center py-6">
        <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center animate-[scaleIn_.4s_ease]" style={{ background: `${C.green}1A` }}>
          <CheckCircle2 size={48} style={{ color: C.green }} />
        </div>
        <h2 className="text-2xl font-semibold mt-4" style={{ color: C.text }}>Session Ended Successfully</h2>
        <p className="text-sm mt-1" style={{ color: C.text2 }}>{course.title} {course.code} · Week 9 Lecture</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard top={C.green} label="Present" value="78" sub="students" icon={CheckCircle2} />
        <StatCard top={C.red} label="Absent" value="16" sub="students" icon={XCircle} />
        <StatCard top={C.amber} label="Rate" value="82.9%" sub="attendance" icon={BarChart3} />
        <StatCard top={C.blue} label="Duration" value="1h 23m" sub="session length" icon={Clock} />
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3" style={{ color: C.text }}>Method Breakdown</h3>
        <div className="flex h-8 rounded-lg overflow-hidden text-xs font-medium">
          <div className="flex items-center justify-center" style={{ width: "79.5%", background: C.blue, color: "#fff" }}>62 Face Scan (79.5%)</div>
          <div className="flex items-center justify-center" style={{ width: "20.5%", background: C.amber, color: C.bg }}>16 QR</div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex gap-1 border-b mb-3" style={{ borderColor: C.border }}>
          {[{ id: "present", l: "Present" }, { id: "absent", l: "Absent" }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2 text-sm font-medium relative" style={{ color: tab === t.id ? C.amber : C.text2 }}>
              {t.l}{tab === t.id && <span className="absolute bottom-0 inset-x-0 h-0.5" style={{ background: C.amber }} />}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {STUDENTS.slice(0, 6).map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 rounded-lg p-2" style={{ background: C.bg }}>
              <Avatar name={s.name} size={30} bg={C.blue} />
              <div className="flex-1 min-w-0"><div className="text-sm" style={{ color: C.text }}>{s.name}</div><div className="text-xs" style={{ color: C.muted }}>{s.id}</div></div>
              {tab === "present" ? (
                <><span className="text-xs" style={{ color: C.text2 }}>10:0{i} AM</span>{i % 2 ? <QrCode size={15} style={{ color: C.amber }} /> : <ScanFace size={15} style={{ color: C.blue }} />}</>
              ) : (
                <span className="text-xs" style={{ color: C.text2 }}>{course.prog} · {course.level}</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Btn variant="secondary" className="flex-1 min-w-[140px]" onClick={() => push("success", "PDF exported")}><FileText size={15} /> Export PDF</Btn>
        <Btn variant="secondary" className="flex-1 min-w-[140px]" onClick={() => push("success", "Excel exported")}><FileSpreadsheet size={15} /> Export Excel</Btn>
        <Btn variant="secondary" className="flex-1 min-w-[140px]" onClick={() => go("courseDetail")}>Back to Course</Btn>
        <Btn className="flex-1 min-w-[140px]" onClick={() => setState("config")}><Plus size={15} /> Start Another</Btn>
      </div>
    </div>
  );
}

/* ============================ SESSION HISTORY ============================ */
function SessionHistory({ push, setConfirm }: any) {
  const [open, setOpen] = useState<Record<string, boolean>>({ cs301: true, cs401: true, cs201: false });
  const [q, setQ] = useState("");
  const groups = [
    { id: "cs301", name: "Database Systems — CS301", avg: 78.4, sessions: RECENT_SESSIONS },
    { id: "cs401", name: "Algorithms — CS401", avg: 81.2, sessions: CS401_SESSIONS },
    { id: "cs201", name: "Data Structures — CS201", avg: 72.1, sessions: RECENT_SESSIONS.slice(0, 3) },
  ];
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: C.text }}>Session History</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="sm:col-span-2 lg:col-span-2 flex flex-col sm:flex-row gap-3">
          <div className="flex-1"><Input icon={Search} placeholder="Search by session label…" value={q} onChange={(e: any) => setQ(e.target.value)} /></div>
          <select className="rounded-lg min-h-[44px] px-3 text-sm outline-none" style={{ background: C.bg, border: `1px solid ${C.inputBorder}`, color: C.text }}>
            {["All Courses", "CS301", "CS401", "CS201"].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard top={C.amber} label="Total Sessions" value="34" icon={History} />
        <StatCard top={C.green} label="Total Present" value="2,847" icon={Users} />
        <StatCard top={C.blue} label="Avg Rate" value="79.3%" icon={BarChart3} />
      </div>

      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.id}>
            <button onClick={() => setOpen({ ...open, [g.id]: !open[g.id] })} className="w-full flex items-center justify-between rounded-lg p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2">
                <ChevronDown size={18} className="transition-transform" style={{ color: C.text2, transform: open[g.id] ? "none" : "rotate(-90deg)" }} />
                <span className="font-medium text-sm" style={{ color: C.text }}>{g.name}</span>
                <span className="text-xs" style={{ color: C.muted }}>({g.sessions.length} sessions)</span>
              </div>
              <Badge color={rateColor(g.avg)}>{g.avg}% avg</Badge>
            </button>
            {open[g.id] && (
              <div className="mt-2 space-y-2 pl-2">
                {g.sessions.filter((s) => s.label.toLowerCase().includes(q.toLowerCase())).map((s, i) => (
                  <Card key={i} hover className="p-3 lec-session-card">
                    <div className="flex gap-3 items-center">
                      <div className="flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5 flex-shrink-0" style={{ background: `${C.amber}14` }}>
                        <span className="text-lg font-bold" style={{ color: C.amber }}>{s.day}</span><span className="text-[9px]" style={{ color: C.amber }}>{s.month}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium" style={{ color: C.text }}>{s.code} · {s.label}</div>
                        <div className="flex flex-wrap gap-2 text-xs mt-0.5" style={{ color: C.text2 }}><span style={{ color: C.green }}>{s.present} present</span><span style={{ color: rateColor(s.rate) }}>{s.rate}%</span></div>
                      </div>
                      <Badge color={C.green}>Completed</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================ REPORTS ============================ */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg p-3 text-xs" style={{ background: C.raised, border: `1px solid ${C.border}` }}>
      <div className="font-semibold mb-1" style={{ color: C.text }}>{d.label || label}</div>
      {d.date && <div style={{ color: C.muted }}>{d.date}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || p.stroke }}>{p.name}: {p.value}%{d.present ? ` (${d.present}/${d.total})` : ""}</div>
      ))}
    </div>
  );
}

function Reports({ scoped, push }: any) {
  const [bulk, setBulk] = useState<string[]>([]);
  const [crs, setCrs] = useState(scoped?.code || "CS301");
  const defaulters = STUDENTS.filter((s) => s.pct < 75).map((s) => ({ ...s, course: "CS301", threshold: 75, shortfall: 75 - s.pct, last: s.pct < 60 ? "18 days ago" : "5 days ago", lastColor: s.pct < 60 ? C.red : C.amber }));

  const toggle = (id: string) => setBulk((b) => b.includes(id) ? b.filter((x) => x !== id) : [...b, id]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {!scoped && (
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: C.text }}>Attendance Reports</h1>
          <p className="text-sm" style={{ color: C.text2 }}>2024/2025 — Semester 1</p>
        </div>
      )}

      {/* export reports */}
      {!scoped && (
        <div className="grid lg:grid-cols-3 gap-4">
          {[
            { t: "Course Attendance Report", d: "Full attendance record for a specific course", sel: ["CS301", "CS401", "CS201"], btns: ["PDF", "Excel"] },
            { t: "Per-Student Report", d: "Individual attendance history across all sessions", search: true, btns: ["PDF"] },
            { t: "Defaulters Report", d: "All students below the attendance threshold", sel: ["All Courses", "CS301", "CS401", "CS201"], btns: ["PDF", "Excel"] },
          ].map((r) => (
            <Card key={r.t} className="p-4 flex flex-col">
              <h3 className="font-semibold" style={{ color: C.text }}>{r.t}</h3>
              <p className="text-xs mt-1 mb-3 flex-1" style={{ color: C.text2 }}>{r.d}</p>
              {r.sel && <select className="w-full rounded-lg min-h-[40px] px-2 text-sm mb-3" style={{ background: C.bg, border: `1px solid ${C.inputBorder}`, color: C.text }}>{r.sel.map((o) => <option key={o}>{o}</option>)}</select>}
              {r.search && <Input icon={Search} placeholder="Search student…" className="mb-3" />}
              <div className="flex gap-2">
                {r.btns.includes("PDF") && <Btn variant="secondary" className="flex-1" onClick={() => push("success", "PDF exported")}><FileText size={14} /> PDF</Btn>}
                {r.btns.includes("Excel") && <Btn variant="secondary" className="flex-1" onClick={() => push("success", "Excel exported")}><FileSpreadsheet size={14} /> Excel</Btn>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* chart 1 */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h3 className="font-semibold text-sm" style={{ color: C.text }}>Attendance Rate Per Session — {scoped ? `${scoped.title} (${scoped.code})` : "Database Systems (CS301)"}</h3>
          {!scoped && <select value={crs} onChange={(e) => setCrs(e.target.value)} className="rounded-lg min-h-[38px] px-2 text-sm" style={{ background: C.bg, border: `1px solid ${C.inputBorder}`, color: C.text }}>{["CS301", "CS401", "CS201"].map((o) => <option key={o}>{o}</option>)}</select>}
        </div>
        <div className="overflow-x-auto"><div style={{ minWidth: 480 }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={CHART_SESSIONS}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="name" stroke={C.muted} fontSize={12} tickLine={false} />
              <YAxis stroke={C.muted} fontSize={12} domain={[0, 100]} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <ReferenceLine y={75} stroke={C.amber} strokeDasharray="5 5" label={{ value: "Threshold 75%", fill: C.amber, fontSize: 10, position: "right" }} />
              <Bar dataKey="pct" name="Attendance" radius={[4, 4, 0, 0]}>
                {CHART_SESSIONS.map((d, i) => <Cell key={i} fill={rateColor(d.pct)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div></div>
      </Card>

      {/* chart 2 */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-4" style={{ color: C.text }}>Weekly Attendance Trend — All Courses</h3>
        <div className="overflow-x-auto"><div style={{ minWidth: 480 }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={WEEKLY_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="name" stroke={C.muted} fontSize={12} tickLine={false} />
              <YAxis stroke={C.muted} fontSize={12} domain={[60, 100]} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="CS301" stroke={C.amber} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="CS401" stroke={C.blue} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="CS201" stroke={C.purple} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div></div>
      </Card>

      {/* defaulters */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: C.text }}>At-Risk Students <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${C.red}1A`, color: C.red }}>{defaulters.length}</span></h3>
          <select className="rounded-lg min-h-[38px] px-2 text-sm" style={{ background: C.bg, border: `1px solid ${C.inputBorder}`, color: C.text }}>{["All Courses", "CS301", "CS401", "CS201"].map((o) => <option key={o}>{o}</option>)}</select>
        </div>

        {bulk.length > 0 && (
          <div className="flex items-center justify-between rounded-lg p-3 mb-3" style={{ background: `${C.amber}10`, border: `1px solid ${C.amber}30` }}>
            <span className="text-sm" style={{ color: C.text }}>{bulk.length} student{bulk.length !== 1 ? "s" : ""} selected</span>
            <Btn onClick={() => { push("success", `Warning emails sent to ${bulk.length}`); setBulk([]); }}><Mail size={14} /> Send Warning Emails to All</Btn>
          </div>
        )}

        {/* desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{ color: C.muted }}>
              <th className="p-2"></th>{["Student", "ID", "Course", "Current %", "Threshold", "Shortfall", "Last Check-In", "Actions"].map((h) => <th key={h} className="text-left font-medium p-2">{h}</th>)}
            </tr></thead>
            <tbody>
              {defaulters.map((d) => (
                <tr key={d.id} className="border-t" style={{ borderColor: C.border }}>
                  <td className="p-2"><input type="checkbox" checked={bulk.includes(d.id)} onChange={() => toggle(d.id)} /></td>
                  <td className="p-2" style={{ color: C.text }}>{d.name}</td>
                  <td className="p-2" style={{ color: C.text2 }}>{d.id}</td>
                  <td className="p-2" style={{ color: C.text2 }}>{d.course}</td>
                  <td className="p-2 font-medium" style={{ color: C.red }}>{d.pct}%</td>
                  <td className="p-2" style={{ color: C.text2 }}>{d.threshold}%</td>
                  <td className="p-2 font-medium" style={{ color: C.red }}>-{d.shortfall}%</td>
                  <td className="p-2" style={{ color: d.lastColor }}>{d.last}</td>
                  <td className="p-2"><div className="flex gap-1">
                    <button className="p-1.5 rounded lec-icon-btn" onClick={() => push("warning", `Warning sent to ${d.name}`)} title="Send Warning"><Mail size={14} style={{ color: C.amber }} /></button>
                    <button className="p-1.5 rounded lec-icon-btn" onClick={() => push("info", "History opened")} title="View History"><Eye size={14} style={{ color: C.text2 }} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* mobile */}
        <div className="lg:hidden space-y-3">
          {defaulters.map((d) => (
            <div key={d.id} className="rounded-lg p-3" style={{ background: C.bg }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><input type="checkbox" checked={bulk.includes(d.id)} onChange={() => toggle(d.id)} /><div><div className="text-sm font-medium" style={{ color: C.text }}>{d.name}</div><div className="text-xs" style={{ color: C.muted }}>{d.id} · {d.course}</div></div></div>
                <span className="text-lg font-bold" style={{ color: C.red }}>{d.pct}%</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span style={{ color: C.red }}>Shortfall -{d.shortfall}%</span>
                <span style={{ color: d.lastColor }}>Last: {d.last}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <Btn variant="secondary" className="flex-1" onClick={() => push("warning", `Warning sent to ${d.name}`)}><Mail size={14} /> Warn</Btn>
                <Btn variant="secondary" className="flex-1" onClick={() => push("info", "History opened")}><Eye size={14} /> History</Btn>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ============================ NOTIFICATIONS ============================ */
function Notifications({ push, clearUnread, setUnread, go }: any) {
  const [items, setItems] = useState(NOTIFICATIONS);
  const [tab, setTab] = useState("All");
  const [prefs, setPrefs] = useState([
    { t: "A student falls below threshold", on: true },
    { t: "A session has not been closed after 2 hours", on: true },
    { t: "Weekly attendance summary every Monday", on: true },
    { t: "New student enrolled in my course", on: false },
  ]);

  const filtered = items.filter((n) => {
    if (tab === "Unread") return n.unread;
    if (tab === "Alerts") return n.type === "threshold_alert";
    if (tab === "Reminders") return n.type === "session_reminder";
    return true;
  });

  const markRead = (id: number) => { setItems((p) => p.map((n) => n.id === id ? { ...n, unread: false } : n)); setUnread((u: number) => Math.max(0, u - 1)); };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: C.text }}>Notifications</h1>
        <Btn variant="ghost" onClick={() => { setItems((p) => p.map((n) => ({ ...n, unread: false }))); clearUnread(); push("success", "All marked as read"); }}>Mark All Read</Btn>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {["All", "Unread", "Alerts", "Reminders"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap" style={{ background: tab === t ? C.amber : C.surface, color: tab === t ? C.bg : C.text2, border: `1px solid ${tab === t ? C.amber : C.border}` }}>{t}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center"><Bell size={40} className="mx-auto" style={{ color: C.muted }} /><p className="mt-3" style={{ color: C.text2 }}>You're all caught up! No new notifications.</p></Card>
      ) : (
        <Card className="overflow-hidden">
          {filtered.map((n, i) => {
            const m = NOTIF_META[n.type as keyof typeof NOTIF_META];
            return (
              <button key={n.id} onClick={() => { markRead(n.id); push("info", "Opening related screen"); }} className={`w-full text-left flex items-start gap-3 p-4 lec-row ${i > 0 ? "border-t" : ""}`}
                style={{ borderColor: C.border, background: n.unread ? `${C.amber}08` : "transparent" }}>
                <div className="p-2 rounded-full flex-shrink-0" style={{ background: `${m.color}1A` }}><m.icon size={16} style={{ color: m.color }} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: C.text }}>{n.title}</div>
                  <div className="text-sm" style={{ color: C.text2 }}>{n.desc}</div>
                  <div className="text-xs mt-1" style={{ color: C.muted }}>{n.time}</div>
                </div>
                {n.unread && <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: C.amber }} />}
              </button>
            );
          })}
        </Card>
      )}

      <Card className="p-4">
        <h3 className="font-semibold mb-1" style={{ color: C.text }}>Notification Preferences</h3>
        <p className="text-sm mb-3" style={{ color: C.text2 }}>Email me when…</p>
        <div className="space-y-1">
          {prefs.map((p, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-t first:border-t-0" style={{ borderColor: C.border }}>
              <span className="text-sm pr-3" style={{ color: C.text }}>{p.t}</span>
              <Toggle on={p.on} onChange={() => setPrefs((pr) => pr.map((x, j) => j === i ? { ...x, on: !x.on } : x))} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Toggle({ on, onChange }: any) {
  return (
    <button onClick={onChange} className="relative rounded-full transition-colors flex-shrink-0" style={{ width: 44, height: 24, background: on ? C.green : C.raised }}>
      <span className="absolute top-0.5 rounded-full bg-white transition-all" style={{ width: 20, height: 20, left: on ? 22 : 2 }} />
    </button>
  );
}

/* ============================ PROFILE ============================ */
function Profile({ push }: any) {
  const [tab, setTab] = useState("info");
  const tabs = [{ id: "info", l: "Personal Info" }, { id: "security", l: "Security" }, { id: "notif", l: "Notifications" }, { id: "prefs", l: "Preferences" }];
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: C.text }}>Profile & Settings</h1>
      <div className="grid lg:grid-cols-3 gap-5">
        {/* left */}
        <Card className="p-5 h-fit">
          <div className="flex flex-col items-center text-center">
            <Avatar name={LECTURER.name} size={80} bg={C.amber} />
            <Btn variant="ghost" className="mt-2" onClick={() => push("info", "Upload photo")}><Camera size={14} /> Change Photo</Btn>
            <h3 className="text-lg font-semibold mt-1" style={{ color: C.text }}>{LECTURER.name}</h3>
            <div className="text-sm" style={{ color: C.text2 }}>{LECTURER.title}</div>
            <div className="text-sm" style={{ color: C.muted }}>{LECTURER.dept}</div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <Row k="Staff ID" v={LECTURER.staffId} />
            <Row k="Email" v={<span className="flex items-center gap-1">{LECTURER.email} <CheckCircle2 size={13} style={{ color: C.green }} /></span>} />
            <Row k="Member since" v={LECTURER.since} />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            {[{ v: 3, l: "Courses" }, { v: 34, l: "Sessions" }, { v: 287, l: "Students" }].map((s) => (
              <div key={s.l} className="rounded-lg py-2" style={{ background: C.bg }}><div className="font-semibold" style={{ color: C.text }}>{s.v}</div><div className="text-[11px]" style={{ color: C.muted }}>{s.l}</div></div>
            ))}
          </div>
        </Card>

        {/* right */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex gap-1 border-b mb-4 overflow-x-auto" style={{ borderColor: C.border }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className="px-3 py-2 text-sm font-medium relative whitespace-nowrap" style={{ color: tab === t.id ? C.amber : C.text2 }}>
                {t.l}{tab === t.id && <span className="absolute bottom-0 inset-x-0 h-0.5" style={{ background: C.amber }} />}
              </button>
            ))}
          </div>

          <div key={tab} className="animate-[fadeIn_.2s_ease]">
            {tab === "info" && (
              <div className="space-y-4">
                <Field label="Full Name"><Input defaultValue={LECTURER.name} /></Field>
                <Field label="Display Name / Title"><Input defaultValue="Dr." /></Field>
                <Field label="Phone Number (optional)"><Input placeholder="+233 ..." /></Field>
                <Field label="Department"><LockedInput value={LECTURER.dept} /></Field>
                <Field label="Email" hint="Email can only be changed by your institution admin"><LockedInput value={LECTURER.email} /></Field>
                <Btn onClick={() => push("success", "Changes saved")}>Save Changes</Btn>
              </div>
            )}
            {tab === "security" && <SecurityTab push={push} />}
            {tab === "notif" && (
              <div className="space-y-1">
                {["A student falls below threshold", "A session has not been closed after 2 hours", "Weekly attendance summary every Monday", "New student enrolled in my course"].map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-t first:border-t-0" style={{ borderColor: C.border }}>
                    <span className="text-sm pr-3" style={{ color: C.text }}>{t}</span><Toggle on={i < 3} onChange={() => push("success", "Preference updated")} />
                  </div>
                ))}
              </div>
            )}
            {tab === "prefs" && (
              <div className="space-y-4">
                <Field label="Timezone"><select className="w-full rounded-lg min-h-[44px] px-3 text-sm" style={{ background: C.bg, border: `1px solid ${C.inputBorder}`, color: C.text }}><option>Africa/Accra (GMT)</option><option>UTC</option></select></Field>
                <Field label="Default QR Expiry for my sessions">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm" style={{ color: C.text }}><input type="radio" name="qr" defaultChecked /> Use Admin Default (15 min)</label>
                    <label className="flex items-center gap-2 text-sm" style={{ color: C.text }}><input type="radio" name="qr" /> Custom: <input type="number" defaultValue={20} className="w-16 rounded-lg min-h-[36px] px-2 text-sm" style={{ background: C.bg, border: `1px solid ${C.inputBorder}`, color: C.text }} /> min</label>
                  </div>
                </Field>
                <Field label="Date Format"><select className="w-full rounded-lg min-h-[44px] px-3 text-sm" style={{ background: C.bg, border: `1px solid ${C.inputBorder}`, color: C.text }}><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option></select></Field>
                <Btn onClick={() => push("success", "Preferences saved")}>Save Preferences</Btn>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SecurityTab({ push }: any) {
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const checks = { len: pwd.length >= 8, num: /\d/.test(pwd), sp: /[^A-Za-z0-9]/.test(pwd) };
  const score = Object.values(checks).filter(Boolean).length;
  const strength = pwd.length === 0 ? null : score <= 1 ? { l: "Weak", c: C.red, w: 33 } : score === 2 ? { l: "Fair", c: C.amber, w: 66 } : { l: "Strong", c: C.green, w: 100 };
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold mb-3" style={{ color: C.text }}>Change Password</h3>
        <div className="space-y-4">
          <Field label="Current Password">
            <div className="relative"><Input icon={Lock} type={show ? "text" : "password"} placeholder="••••••••" /><button className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} onClick={() => setShow(!show)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
          </Field>
          <Field label="New Password">
            <Input icon={Lock} type={show ? "text" : "password"} value={pwd} onChange={(e: any) => setPwd(e.target.value)} placeholder="New password" />
            {strength && <div className="mt-2"><ProgressBar pct={strength.w} color={strength.c} h={5} /><div className="text-xs mt-1" style={{ color: strength.c }}>{strength.l}</div></div>}
          </Field>
          <Field label="Confirm New Password"><Input icon={Lock} type={show ? "text" : "password"} placeholder="Confirm password" /></Field>
          <div className="space-y-1.5 rounded-lg p-3" style={{ background: C.bg }}>
            {[{ k: checks.len, t: "At least 8 characters" }, { k: checks.num, t: "At least one number" }, { k: checks.sp, t: "At least one special character" }].map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs" style={{ color: r.k ? C.green : C.muted }}><Check size={14} style={{ opacity: r.k ? 1 : 0.4 }} /> {r.t}</div>
            ))}
          </div>
          <Btn onClick={() => push("success", "Password updated")}>Update Password</Btn>
        </div>
      </div>
      <div className="rounded-lg p-4" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
        <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: C.text }}><Shield size={15} /> Login Activity</h4>
        <p className="text-sm mt-2" style={{ color: C.text2 }}>Last login: Today at 9:14 AM from Chrome, Ghana</p>
        <p className="text-xs mt-1" style={{ color: C.amber }}>If you don't recognize this activity, change your password immediately.</p>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: any) {
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block" style={{ color: C.text2 }}>{label}</label>
      {children}
      {hint && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: C.muted }}><Info size={11} /> {hint}</p>}
    </div>
  );
}
function LockedInput({ value }: any) {
  return <div className="relative"><input readOnly value={value} className="w-full rounded-lg min-h-[44px] px-3 pr-9 text-sm outline-none" style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.muted }} /><Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} /></div>;
}
function Row({ k, v }: any) {
  return <div className="flex justify-between gap-3"><span style={{ color: C.muted }}>{k}</span><span className="text-right" style={{ color: C.text }}>{v}</span></div>;
}

/* ============================ SKELETON LOADER ============================ */
function Sk({ w = "100%", h = 14, r = 8, className = "", style }: any) {
  return <div className={`lec-sk ${className}`} style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

function SkCard({ children, className = "" }: any) {
  return (
    <div className={`rounded-[10px] p-5 ${className}`} style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      {children}
    </div>
  );
}

function PageSkeleton({ view }: { view: string }) {
  if (view === "dashboard") {
    return (
      <div className="animate-[fadeIn_.2s_ease] space-y-6">
        <div className="space-y-2"><Sk w="60%" h={26} /><Sk w="40%" h={14} /></div>
        <Sk h={56} r={10} />
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkCard key={i}><Sk w={40} h={32} /><Sk w="70%" h={12} className="mt-3" /><Sk w="50%" h={10} className="mt-2" /></SkCard>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <SkCard key={i}>
              <Sk w="55%" h={18} /><Sk w="35%" h={12} className="mt-2" />
              <Sk h={8} r={4} className="mt-4" />
              <div className="flex gap-2 mt-4"><Sk w="50%" h={44} r={10} /><Sk w="50%" h={44} r={10} /></div>
            </SkCard>
          ))}
        </div>
      </div>
    );
  }
  if (view === "session") {
    return (
      <div className="max-w-2xl mx-auto animate-[fadeIn_.2s_ease]">
        <div className="text-center mb-6 flex flex-col items-center gap-3"><Sk w={48} h={48} r={24} /><Sk w={220} h={22} /><Sk w={280} h={12} /></div>
        <div className="grid sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkCard key={i} className="text-center flex flex-col items-center gap-2"><Sk w={60} h={14} /><Sk w="80%" h={12} /><Sk h={44} r={10} className="mt-2" /></SkCard>
          ))}
        </div>
      </div>
    );
  }
  if (view === "reports") {
    return (
      <div className="animate-[fadeIn_.2s_ease] space-y-6">
        <Sk w="45%" h={22} />
        <SkCard><Sk w="30%" h={16} /><Sk h={240} r={10} className="mt-4" /></SkCard>
        <SkCard><Sk w="30%" h={16} /><Sk h={240} r={10} className="mt-4" /></SkCard>
      </div>
    );
  }
  if (view === "courses") {
    return (
      <div className="animate-[fadeIn_.2s_ease] space-y-6">
        <Sk h={44} r={10} />
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkCard key={i}>
              <div className="flex justify-between"><Sk w="50%" h={18} /><Sk w={60} h={20} r={10} /></div>
              <Sk w="40%" h={12} className="mt-3" />
              <Sk h={8} r={4} className="mt-4" />
              <div className="flex gap-2 mt-4"><Sk w="60%" h={44} r={10} /><Sk w={44} h={44} r={10} /><Sk w={44} h={44} r={10} /></div>
            </SkCard>
          ))}
        </div>
      </div>
    );
  }
  if (view === "notifications") {
    return (
      <div className="max-w-3xl mx-auto animate-[fadeIn_.2s_ease] space-y-3">
        <Sk w="40%" h={22} className="mb-4" />
        {Array.from({ length: 6 }).map((_, i) => (
          <SkCard key={i} className="flex gap-3 items-start">
            <Sk w={36} h={36} r={18} />
            <div className="flex-1 space-y-2"><Sk w="50%" h={14} /><Sk w="85%" h={12} /></div>
          </SkCard>
        ))}
      </div>
    );
  }
  if (view === "profile") {
    return (
      <div className="max-w-3xl mx-auto animate-[fadeIn_.2s_ease] space-y-6">
        <SkCard className="flex items-center gap-4"><Sk w={72} h={72} r={36} /><div className="flex-1 space-y-2"><Sk w="50%" h={18} /><Sk w="35%" h={12} /></div></SkCard>
        <SkCard className="space-y-4">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="flex justify-between"><Sk w="30%" h={12} /><Sk w="40%" h={12} /></div>))}</SkCard>
      </div>
    );
  }
  // generic (courseDetail, history, fallback)
  return (
    <div className="animate-[fadeIn_.2s_ease] space-y-6">
      <Sk w="45%" h={22} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <SkCard key={i}><Sk w={40} h={28} /><Sk w="70%" h={12} className="mt-3" /></SkCard>)}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <SkCard key={i} className="flex items-center gap-4"><Sk w={48} h={48} r={10} /><div className="flex-1 space-y-2"><Sk w="40%" h={14} /><Sk w="70%" h={12} /></div></SkCard>
      ))}
    </div>
  );
}


function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:wght@700&display=swap');
      * { -webkit-tap-highlight-color: transparent; }
      body { font-family: ${FONT}; }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-thumb { background: ${C.raised}; border-radius: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      .lec-input:focus { border-color: ${C.amber} !important; }
      .lec-hover-card { transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease; }
      .lec-course:hover { transform: translateY(-3px); border-color: ${C.amber}66; box-shadow: 0 8px 24px -8px ${C.amber}33; }
      .lec-stat:hover { background: ${C.raised}; }
      .lec-session-card { transition: border-left-color .2s ease, transform .2s ease; border-left: 3px solid transparent; }
      .lec-session-card:hover { border-left-color: ${C.amber}; }
      .lec-row { transition: background .15s ease; }
      .lec-row:hover { background: ${C.raised}; }
      .lec-icon-btn { transition: background .15s ease; }
      .lec-icon-btn:hover { background: ${C.raised}; }
      .lec-pulse { animation: lecPulse 1.6s ease-in-out infinite; }
      .lec-sk { position: relative; overflow: hidden; background: ${C.raised}; }
      .lec-sk::after { content: ''; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent); animation: lecShimmer 1.5s ease-in-out infinite; }
      @keyframes lecShimmer { 100% { transform: translateX(100%); } }
      @keyframes lecPulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: .7; } }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
      @keyframes slideLeftIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
      select option { background: ${C.surface}; color: ${C.text}; }
    `}</style>
  );
}
