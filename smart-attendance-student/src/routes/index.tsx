import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  LayoutDashboard, BookOpen, CheckSquare, ClipboardList, UserCircle,
  Bell, ArrowLeft, Eye, EyeOff, Lock, Camera, ScanFace, QrCode,
  CheckCircle2, XCircle, AlertTriangle, Clock, Info, LogOut, Search,
  Mail, ShieldCheck, Upload, X, ChevronRight, Loader2, Radio,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KNUST Smart Attendance — Student Portal" },
      { name: "description", content: "Mark attendance via QR or face scan, track your courses, and stay above threshold." },
    ],
  }),
  component: StudentApp,
});

/* ============================== THEME ============================== */
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

/* ============================== DATA ============================== */
const STUDENT = {
  name: "Kwame Asante", id: "STU-0001", initials: "KA",
  email: "kwame.asante@st.knust.edu.gh",
  programme: "BSc Computer Science", level: "Level 300",
  department: "Computer Science", semester: "Semester 1",
  year: "2024/2025", since: "September 2024",
};

const COURSES = [
  { code: "CS301", title: "Database Systems", level: "Level 300", sem: "Sem 1", credits: 3, lecturer: "Dr. Ama Owusu", present: 18, total: 24, threshold: 75, color: C.amber },
  { code: "CS401", title: "Algorithms", level: "Level 400", sem: "Sem 1", credits: 3, lecturer: "Dr. Kweku Boateng", present: 20, total: 24, threshold: 80, color: C.blue },
  { code: "CS201", title: "Data Structures", level: "Level 200", sem: "Sem 1", credits: 3, lecturer: "Dr. Ama Owusu", present: 12, total: 20, threshold: 75, color: C.purple },
];

const RECENT = [
  { course: "Database Systems", code: "CS301", method: "face", date: "Jun 4", status: "present" },
  { course: "Algorithms", code: "CS401", method: "qr", date: "Jun 3", status: "present" },
  { course: "Data Structures", code: "CS201", method: null, date: "Jun 1", status: "absent" },
  { course: "Database Systems", code: "CS301", method: "qr", date: "May 28", status: "present" },
  { course: "Algorithms", code: "CS401", method: "face", date: "May 27", status: "present" },
];

const CS301_SESSIONS = [
  { label: "Week 9 Lecture", date: "Jun 4", day: "Wed", time: "10:14 AM", method: "face", status: "present" },
  { label: "Week 8 Lecture", date: "May 28", day: "Wed", time: "10:02 AM", method: "qr", status: "present" },
  { label: "Week 7 Lecture", date: "May 21", day: "Wed", time: null, method: null, status: "absent" },
  { label: "Week 6 Lecture", date: "May 14", day: "Wed", time: "09:58 AM", method: "face", status: "present" },
  { label: "Week 5 Lecture", date: "May 7", day: "Wed", time: "10:21 AM", method: "qr", status: "present" },
  { label: "Week 4 Lecture", date: "Apr 30", day: "Wed", time: null, method: null, status: "absent" },
  { label: "Week 3 Lecture", date: "Apr 23", day: "Wed", time: "10:05 AM", method: "face", status: "present" },
  { label: "Week 2 Lecture", date: "Apr 16", day: "Wed", time: "09:55 AM", method: "face", status: "present" },
  { label: "Week 1 Lecture", date: "Apr 9", day: "Wed", time: "10:18 AM", method: "qr", status: "present" },
  { label: "Intro", date: "Apr 2", day: "Wed", time: null, method: null, status: "absent" },
  { label: "Orientation", date: "Mar 26", day: "Wed", time: "10:00 AM", method: "qr", status: "override" },
  { label: "Pre-semester", date: "Mar 19", day: "Wed", time: "09:50 AM", method: "face", status: "present" },
];

const SCHEDULE = [
  { day: "Mon", time: "10:00 AM", code: "CS301", title: "Database Systems", room: "LT4", color: C.amber, today: false },
  { day: "Tue", time: "2:00 PM", code: "CS401", title: "Algorithms", room: "LT2", color: C.blue, today: false },
  { day: "Wed", time: "10:00 AM", code: "CS201", title: "Data Structures", room: "LT1", color: C.purple, today: true },
];

const VALID_CODE = "AX72KC";

/* ============================== HELPERS ============================== */
const pct = (p: number, t: number) => Math.round((p / t) * 100);
const statusOf = (p: number, t: number, threshold: number) => {
  const v = pct(p, t);
  if (v < threshold) return "defaulter";
  if (v - threshold < 5) return "atrisk";
  return "good";
};
const colorOf = (p: number, t: number, threshold: number) => {
  const s = statusOf(p, t, threshold);
  return s === "good" ? C.green : s === "atrisk" ? C.amber : C.red;
};
const fmtTimer = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function Sk({ h = 16, w = "100%", className = "", circle }: { h?: number | string; w?: number | string; className?: string; circle?: boolean }) {
  return (
    <div className={`shimmer ${circle ? "rounded-full" : "rounded-lg"} ${className}`}
      style={{ height: h, width: w, minWidth: typeof w === "number" ? w : undefined, flexShrink: 0 }} />
  );
}

/* ============================== SKELETONS ============================== */
function DashboardSkeleton({ sessionLive }: { sessionLive: boolean }) {
  return (
    <div className="space-y-6 fadeIn">
      <div className="space-y-2">
        <Sk h={32} w={200} />
        <Sk h={16} w={180} />
      </div>
      {sessionLive && (
        <div className="rounded-xl p-5 space-y-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2">
            <Sk h={10} w={10} circle />
            <Sk h={14} w={110} />
          </div>
          <Sk h={28} w="60%" />
          <Sk h={16} w="40%" />
          <Sk h={16} w={140} />
          <Sk h={44} w="100%" />
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-xl p-4 space-y-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <Sk h={12} w={90} />
            <div className="flex items-baseline gap-2">
              <Sk h={32} w={50} />
              <Sk h={14} w={60} />
            </div>
          </div>
        ))}
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <Sk h={20} w={100} />
          <Sk h={16} w={70} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl p-5 space-y-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex justify-between"><Sk h={14} w={60} /><Sk h={18} w={50} /></div>
              <Sk h={22} w="80%" />
              <div className="flex gap-1">{[1, 2].map(j => <Sk key={j} h={16} w={50} />)}</div>
              <Sk h={8} w="100%" />
              <Sk h={32} w={50} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <Sk h={20} w={130} className="mb-3" />
        <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="p-4 flex items-center gap-3" style={{ borderBottom: i < 5 ? `1px solid ${C.border}` : undefined }}>
              <Sk h={36} w={36} />
              <div className="flex-1 space-y-1.5">
                <Sk h={14} w="50%" />
                <Sk h={12} w="30%" />
              </div>
              <Sk h={20} w={70} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <Sk h={20} w={160} className="mb-3" />
        <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 flex items-center gap-3" style={{ borderBottom: i < 3 ? `1px solid ${C.border}` : undefined }}>
              <div className="flex-1 space-y-1.5">
                <Sk h={14} w="60%" />
                <Sk h={12} w="40%" />
              </div>
              <Sk h={20} w={60} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CoursesSkeleton() {
  return (
    <div className="space-y-5 fadeIn">
      <div className="space-y-2">
        <Sk h={32} w={180} />
        <Sk h={16} w={300} />
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Sk h={48} w="100%" />
        <Sk h={48} w={160} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <Sk h={4} w="100%" />
            <div className="p-5 space-y-3">
              <Sk h={20} w={80} />
              <Sk h={18} w="70%" />
              <div className="flex gap-1">{[1, 2, 3].map(j => <Sk key={j} h={16} w={60} />)}</div>
              <div className="flex items-center gap-4 pt-2">
                <Sk h={84} w={84} circle />
                <div className="flex-1 space-y-2">
                  <Sk h={14} w="80%" />
                  <Sk h={20} w={90} />
                  <Sk h={12} w={100} />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Sk h={36} w={100} />
                <Sk h={36} w={120} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CourseDetailSkeleton() {
  return (
    <div className="space-y-5 fadeIn">
      <Sk h={16} w={140} />
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sk h={32} w={250} />
          <Sk h={20} w={60} />
        </div>
        <Sk h={16} w={200} />
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div className="p-5 flex flex-col md:flex-row gap-5 items-center md:items-stretch">
          <div className="flex items-center gap-4 flex-1">
            <Sk h={100} w={100} circle />
            <div className="space-y-2">
              <Sk h={20} w={90} />
              <Sk h={14} w={120} />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-3 flex-1 w-full">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-lg p-3 space-y-2" style={{ background: C.raised }}>
                <Sk h={12} w={50} />
                <Sk h={22} w={40} />
              </div>
            ))}
          </div>
        </div>
        <div className="px-5 pb-5">
          <Sk h={8} w="100%" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3].map(i => <Sk key={i} h={28} w={70} />)}
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div className="hidden md:block">
          <div className="flex gap-4 px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
            {[1, 2, 3, 4, 5, 6].map(i => <Sk key={i} h={14} w={i === 1 ? 20 : 80} />)}
          </div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex gap-4 px-4 py-3 items-center" style={{ borderBottom: i < 5 ? `1px solid ${C.border}` : undefined }}>
              <Sk h={14} w={20} />
              <Sk h={14} w="30%" />
              <Sk h={14} w="20%" />
              <Sk h={14} w="15%" />
              <Sk h={14} w="15%" />
              <Sk h={20} w={70} />
            </div>
          ))}
        </div>
        <div className="md:hidden divide-y" style={{ borderColor: C.border }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="p-4 space-y-2">
              <div className="flex justify-between"><Sk h={16} w={80} /><Sk h={20} w={60} /></div>
              <Sk h={14} w="50%" />
              <Sk h={12} w="70%" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div className="p-5 space-y-4">
          <Sk h={18} w={200} />
          <Sk h={240} w="100%" />
        </div>
      </div>
    </div>
  );
}

function HistorySkeleton() {
  return <CoursesSkeleton />;
}

function ProfileSkeleton() {
  return (
    <div className="space-y-5 fadeIn">
      <Sk h={32} w={160} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <div className="rounded-xl overflow-hidden p-5 text-center space-y-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <Sk h={80} w={80} circle className="mx-auto" />
            <Sk h={12} w={80} className="mx-auto" />
            <Sk h={24} w={180} className="mx-auto" />
            <Sk h={14} w={120} className="mx-auto" />
            <Sk h={14} w={220} className="mx-auto" />
            <div className="my-4 h-px" style={{ background: C.border }} />
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="flex justify-between"><Sk h={12} w={80} /><Sk h={12} w={40} /></div>)}
            </div>
            <Sk h={20} w={60} className="mx-auto" />
            <Sk h={12} w={140} className="mx-auto" />
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <div className="flex gap-1 p-2 overflow-x-auto" style={{ borderBottom: `1px solid ${C.border}` }}>
              {[1, 2, 3, 4].map(i => <Sk key={i} h={36} w={110} />)}
            </div>
            <div className="p-5 space-y-4">
              <Sk h={18} w={140} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4, 5, 6].map(i => <Sk key={i} h={48} w="100%" />)}
              </div>
              <Sk h={40} w={120} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarkSkeleton() {
  return (
    <div className="min-h-screen flex flex-col fadeIn" style={{ background: C.bg }}>
      <div className="flex-1 flex flex-col items-center justify-start md:justify-center p-4 md:p-8">
        <div className="w-full space-y-4" style={{ maxWidth: 560 }}>
          <div className="flex items-center justify-between mb-6">
            <Sk h={16} w={60} />
            <Sk h={14} w={180} />
            <Sk h={16} w={24} />
          </div>
          <Sk h={4} w="100%" />
          <div className="py-8 text-center space-y-4">
            <Sk h={96} w={96} circle className="mx-auto" />
            <Sk h={28} w="70%" className="mx-auto" />
            <Sk h={16} w="50%" className="mx-auto" />
            <div className="rounded-xl p-4 space-y-2 mx-auto" style={{ maxWidth: 320, background: C.surface, border: `1px solid ${C.border}` }}>
              <Sk h={20} w="80%" className="mx-auto" />
              <Sk h={14} w="60%" className="mx-auto" />
              <Sk h={14} w={120} className="mx-auto" />
              <Sk h={40} w={100} className="mx-auto" />
            </div>
            <Sk h={44} w="100%" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== TOAST ============================== */
type Toast = { id: number; type: "success" | "error" | "info" | "warning"; msg: string };
let toastId = 0;

/* ============================== APP ============================== */
type View = "auth" | "dashboard" | "courses" | "mark" | "history" | "profile" | "courseDetail";
type AuthScreen = "login" | "register" | "expired";
type AttStep = "notify" | "code" | "method" | "face" | "qr" | "success" | "already_marked" | "locked";

function StudentApp() {
  const [view, setView] = useState<View>("auth");
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");
  const [attStep, setAttStep] = useState<AttStep>("notify");
  const [attMethod, setAttMethod] = useState<"face" | "qr">("face");
  const [sessionLive, setSessionLive] = useState(true);
  const [sessionTime, setSessionTime] = useState(14 * 60 + 23);
  const [activeCourse, setActiveCourse] = useState(COURSES[0]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!sessionLive) return;
    const i = setInterval(() => setSessionTime(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(i);
  }, [sessionLive]);

  useEffect(() => {
    if (view === "auth") { setIsReady(true); return; }
    setIsReady(false);
    const t = setTimeout(() => setIsReady(true), 800);
    return () => clearTimeout(t);
  }, [view]);

  const toast = (type: Toast["type"], msg: string) => {
    const id = ++toastId;
    setToasts(t => [...t.slice(-2), { id, type, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };

  const goMark = () => {
    setAttStep("notify");
    setView("mark");
  };

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <GlobalStyles />

      {view === "auth" && (
        <AuthFlow
          screen={authScreen}
          setScreen={setAuthScreen}
          onEnter={() => setView("dashboard")}
          toast={toast}
        />
      )}

      {view !== "auth" && view !== "mark" && (
        <AppShell
          view={view}
          setView={setView}
          sessionLive={sessionLive}
          onLogout={() => setConfirmLogout(true)}
        >
          {!isReady ? (
            view === "dashboard" ? <DashboardSkeleton sessionLive={sessionLive} /> :
            view === "courses" ? <CoursesSkeleton /> :
            view === "courseDetail" ? <CourseDetailSkeleton /> :
            view === "history" ? <HistorySkeleton /> :
            view === "profile" ? <ProfileSkeleton /> :
            null
          ) : (
            <>
              {view === "dashboard" && (
                <Dashboard
                  sessionLive={sessionLive}
                  sessionTime={sessionTime}
                  onMark={goMark}
                  onCourse={(c: typeof COURSES[number]) => { setActiveCourse(c); setView("courseDetail"); }}
                  onAll={() => setView("courses")}
                />
              )}
              {view === "courses" && (
                <CoursesList
                  onCourse={(c: typeof COURSES[number]) => { setActiveCourse(c); setView("courseDetail"); }}
                  toast={toast}
                />
              )}
              {view === "courseDetail" && (
                <CourseDetail course={activeCourse} onBack={() => setView("courses")} />
              )}
              {view === "history" && (
                <CoursesList
                  onCourse={(c: typeof COURSES[number]) => { setActiveCourse(c); setView("courseDetail"); }}
                  toast={toast}
                  titleOverride="Attendance History"
                  subtitleOverride="Pick a course to view its session records"
                />
              )}
              {view === "profile" && <Profile toast={toast} />}
            </>
          )}
        </AppShell>
      )}

      {view === "mark" && (
        !isReady ? <MarkSkeleton /> : (
          <MarkFlow
            step={attStep}
            setStep={setAttStep}
            method={attMethod}
            setMethod={setAttMethod}
            sessionTime={sessionTime}
            onExit={() => setView("dashboard")}
            toast={toast}
          />
        )
      )}

      <ToastStack toasts={toasts} />

      {confirmLogout && (
        <ConfirmModal
          title="Sign out?"
          body="You'll need to sign in again to mark attendance."
          confirmLabel="Sign out"
          danger
          onCancel={() => setConfirmLogout(false)}
          onConfirm={() => {
            setConfirmLogout(false);
            setView("auth");
            setAuthScreen("login");
            toast("info", "You have been signed out.");
          }}
        />
      )}
    </div>
  );
}

/* ============================== GLOBAL STYLES ============================== */
function GlobalStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:wght@700&display=swap');
      html, body { background: ${C.bg}; }
      * { -webkit-tap-highlight-color: transparent; }
      .pf { font-family: 'Playfair Display', serif; }
      .scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
      .scrollbar::-webkit-scrollbar-thumb { background: ${C.raised}; border-radius: 3px; }
      @keyframes pulseDot { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .5; transform: scale(1.3); } }
      .pulseDot { animation: pulseDot 1.4s ease-in-out infinite; }
      @keyframes pulseRing { 0% { box-shadow: 0 0 0 0 rgba(245,158,11,.5); } 70% { box-shadow: 0 0 0 18px rgba(245,158,11,0); } 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); } }
      .pulseRing { animation: pulseRing 1.8s infinite; }
      @keyframes shake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-8px); } 40%,80% { transform: translateX(8px); } }
      .shake { animation: shake .4s ease; }
      @keyframes sweep { 0% { top: 0; } 100% { top: 100%; } }
      .sweep { animation: sweep 2s linear infinite; }
      @keyframes drawCheck { 0% { stroke-dashoffset: 100; } 100% { stroke-dashoffset: 0; } }
      .drawCheck { stroke-dasharray: 100; animation: drawCheck .7s ease-out forwards; }
      @keyframes confetti { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-120px) scale(0); opacity: 0; } }
      .confetti span { position: absolute; width: 6px; height: 6px; border-radius: 50%; animation: confetti 1.4s ease-out forwards; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      .fadeIn { animation: fadeIn .25s ease-out; }
      @keyframes shimmerMove { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      .shimmer { background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%); background-size: 200% 100%; animation: shimmerMove 1.5s infinite linear; }
      @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      .slideUp { animation: slideUp .25s ease-out; }
      input::placeholder { color: ${C.textMuted}; }
    `}} />
  );
}

/* ============================== AUTH ============================== */
function AuthFlow({ screen, setScreen, onEnter, toast }: any) {
  return (
    <div style={{ minHeight: "100vh" }} className="flex flex-col items-center justify-center px-4 py-8">
      <div className="text-center mb-8">
        <div className="pf" style={{ fontSize: 32, color: C.text }}>KNUST</div>
        <div className="text-sm mt-1" style={{ color: C.textSec }}>
          Smart Attendance System — Student Portal
        </div>
      </div>
      {screen === "login" && <Login setScreen={setScreen} onEnter={onEnter} toast={toast} />}
      {screen === "register" && <Register setScreen={setScreen} onEnter={onEnter} toast={toast} />}
      {screen === "expired" && <Expired setScreen={setScreen} />}
    </div>
  );
}

function Login({ setScreen, onEnter, toast }: any) {
  const [showPw, setShowPw] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockSecs, setLockSecs] = useState(0);
  const locked = lockSecs > 0;

  useEffect(() => {
    if (!locked) return;
    const i = setInterval(() => setLockSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(i);
  }, [locked]);

  const trySignIn = () => {
    if (locked) return;
    const n = attempts + 1;
    setAttempts(n);
    if (n >= 5) setLockSecs(15 * 60);
  };

  return (
    <div className="w-full" style={{ maxWidth: 420 }}>
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold">Welcome back</h2>
          <p className="text-sm mt-1" style={{ color: C.textSec }}>Sign in to your student account</p>

          {attempts > 0 && attempts < 5 && (
            <Banner type="error" className="mt-4">
              Incorrect email or password. {5 - attempts} attempts remaining before lockout.
            </Banner>
          )}
          {locked && (
            <Banner type="error" className="mt-4">
              Account locked. Too many failed attempts. Unlocks in {fmtTimer(lockSecs)}.
            </Banner>
          )}

          <div className="mt-5 space-y-4">
            <Field label="Student Email">
              <input type="email" placeholder="student@knust.edu.gh" className="w-full"
                style={inputStyle} />
            </Field>
            <Field label="Password" right={
              <button onClick={() => setForgot(v => !v)} className="text-xs font-medium" style={{ color: C.amber }}>
                Forgot Password?
              </button>
            }>
              <div className="relative">
                <input type={showPw ? "text" : "password"} placeholder="••••••••"
                  className="w-full pr-10" style={inputStyle} />
                <button onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: C.textSec }}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            {forgot && (
              <div className="rounded-lg p-4 fadeIn" style={{ background: C.raised, border: `1px solid ${C.border}` }}>
                {!forgotSent ? (
                  <>
                    <div className="text-sm font-medium mb-2">Enter your registered email address</div>
                    <input type="email" placeholder="student@knust.edu.gh" className="w-full mb-3" style={inputStyle} />
                    <Btn primary block onClick={() => setForgotSent(true)}>Send Reset Link</Btn>
                  </>
                ) : (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={20} style={{ color: C.green, flexShrink: 0, marginTop: 2 }} />
                    <div className="text-sm">
                      A password reset link has been sent to your email.
                      <div className="text-xs mt-1" style={{ color: C.textSec }}>Link expires in 30 minutes.</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Btn primary block onClick={trySignIn} disabled={locked}>Sign In</Btn>
          </div>

          <p className="text-xs text-center mt-4" style={{ color: C.textSec }}>
            New student? Check your email for your registration link.
          </p>
        </div>
      </Card>

      <div className="mt-4 space-y-2">
        <Btn ghost block onClick={onEnter}>→ Enter as Kwame Asante (Demo)</Btn>
        <Btn ghost block onClick={() => setScreen("register")}>→ View Registration Screen</Btn>
        <Btn ghost block onClick={() => setScreen("expired")}>→ View Expired Link Screen</Btn>
      </div>
    </div>
  );
}

function Register({ setScreen, onEnter, toast }: any) {
  const [step, setStep] = useState(1);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [faceOk, setFaceOk] = useState(false);
  const [secs, setSecs] = useState(3);

  const reqs = {
    len: pw.length >= 8,
    num: /\d/.test(pw),
    sym: /[!@#$%^&*(),.?":{}|<>]/.test(pw),
    match: pw.length > 0 && pw === pw2,
  };
  const allOk = Object.values(reqs).every(Boolean);
  const strength = [reqs.len, reqs.num, reqs.sym, pw.length >= 12].filter(Boolean).length;
  const strLabels = ["Weak", "Fair", "Strong", "Very strong"];
  const strColors = [C.red, C.amber, C.blue, C.green];

  useEffect(() => {
    if (step !== 3) return;
    const i = setInterval(() => setSecs(s => {
      if (s <= 1) { clearInterval(i); onEnter(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(i);
  }, [step]);

  const handlePhoto = () => {
    setPhoto("preview");
    setFaceOk(false);
  };
  const completeReg = () => {
    if (!photo) return;
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setFaceOk(true);
      setTimeout(() => setStep(3), 800);
    }, 1800);
  };

  return (
    <div className="w-full" style={{ maxWidth: 560 }}>
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3].map((n, i) => (
          <div key={n} className="flex items-center gap-2">
            <div className="flex items-center justify-center font-semibold text-sm rounded-full"
              style={{
                width: 32, height: 32,
                background: step > n ? C.green : step === n ? C.amber : C.raised,
                color: step >= n ? "#0F1623" : C.textSec,
              }}>
              {step > n ? <CheckCircle2 size={16} /> : n}
            </div>
            {i < 2 && <div style={{ width: 40, height: 2, background: step > n ? C.green : C.raised }} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold">Complete Your Registration</h2>
            <p className="text-sm mt-1" style={{ color: C.textSec }}>
              You've been enrolled at KNUST. Set your password to get started.
            </p>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ["Full Name", "Kwame Asante"], ["Student ID", "STU-0001"],
                ["Email", "kwame.asante@st.knust.edu.gh"],
                ["Programme", "BSc Computer Science | Level 300"],
              ].map(([l, v]) => (
                <div key={l}>
                  <div className="text-xs mb-1" style={{ color: C.textSec }}>{l}</div>
                  <div className="rounded-lg px-3 py-2.5 flex items-center justify-between text-sm"
                    style={{ background: C.raised, border: `1px solid ${C.border}`, color: C.textSec }}>
                    <span>{v}</span><Lock size={14} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-4">
              <Field label="New Password">
                <input type="password" value={pw} onChange={e => setPw(e.target.value)}
                  className="w-full" style={inputStyle} placeholder="Create a strong password" />
                {pw && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map(i => (
                        <div key={i} className="flex-1 h-1 rounded-full"
                          style={{ background: i < strength ? strColors[strength - 1] : C.raised }} />
                      ))}
                    </div>
                    <div className="text-xs mt-1" style={{ color: strength > 0 ? strColors[strength - 1] : C.textMuted }}>
                      {strength > 0 ? strLabels[strength - 1] : "Too weak"}
                    </div>
                  </div>
                )}
              </Field>
              <Field label="Confirm Password">
                <input type="password" value={pw2} onChange={e => setPw2(e.target.value)}
                  className="w-full" style={inputStyle} placeholder="Re-enter password" />
              </Field>
              <div className="rounded-lg p-3 space-y-1.5" style={{ background: C.raised }}>
                {[
                  ["At least 8 characters", reqs.len],
                  ["At least one number", reqs.num],
                  ["At least one special character (!@#$%...)", reqs.sym],
                  ["Passwords match", reqs.match],
                ].map(([t, ok]) => (
                  <div key={t as string} className="flex items-center gap-2 text-xs"
                    style={{ color: ok ? C.green : C.textSec }}>
                    {ok ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 rounded-full border" style={{ borderColor: C.textMuted }} />}
                    {t}
                  </div>
                ))}
              </div>
              <Btn primary block disabled={!allOk} onClick={() => setStep(2)}>
                Continue to Face Photo →
              </Btn>
              <button onClick={() => setScreen("login")} className="w-full text-xs" style={{ color: C.textSec }}>
                ← Back to login
              </button>
            </div>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold">Upload Your Face Photo</h2>
            <p className="text-sm mt-1" style={{ color: C.textSec }}>
              This photo will be used to verify your identity during attendance.
            </p>
            <div className="mt-4 rounded-lg p-3 text-xs space-y-1"
              style={{ background: "rgba(59,130,246,0.1)", border: `1px solid rgba(59,130,246,0.3)`, color: C.text }}>
              <div className="flex items-center gap-2 font-medium mb-1" style={{ color: C.blue }}>
                <Info size={14} />Photo requirements
              </div>
              {[
                "Clear frontal view, no obstructions",
                "Good lighting — not too dark or washed out",
                "Only your face visible",
                "Minimum 300×300 pixels",
              ].map(t => <div key={t}>✓ {t}</div>)}
            </div>

            <div className="mt-4">
              {!photo ? (
                <button onClick={handlePhoto}
                  className="w-full rounded-lg flex flex-col items-center justify-center py-10 px-4 transition"
                  style={{ background: C.raised, border: `2px dashed ${C.borderStrong}` }}>
                  <Camera size={32} style={{ color: C.amber }} />
                  <div className="mt-2 text-sm font-medium">Drag & drop your photo here</div>
                  <div className="text-xs" style={{ color: C.textSec }}>or click to browse files</div>
                  <div className="text-xs mt-2" style={{ color: C.textMuted }}>Accepted: JPG, PNG — Max 5MB</div>
                </button>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <div className="rounded-xl" style={{
                      width: 200, height: 200, background: `linear-gradient(135deg, ${C.purple}, ${C.blue})`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, color: "#fff", fontWeight: 600,
                    }}>{STUDENT.initials}</div>
                    <button onClick={() => setPhoto(null)}
                      className="absolute top-2 right-2 rounded-full p-1.5"
                      style={{ background: C.red, color: "#fff" }}>
                      <X size={14} />
                    </button>
                  </div>
                  {processing && (
                    <div className="mt-4 flex items-center gap-2 text-sm">
                      <Loader2 size={16} className="animate-spin" style={{ color: C.amber }} />
                      <div>
                        <div>Analysing your photo...</div>
                        <div className="text-xs" style={{ color: C.textSec }}>Detecting face and extracting encoding.</div>
                      </div>
                    </div>
                  )}
                  {faceOk && (
                    <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: C.green }}>
                      <CheckCircle2 size={16} /> Face detected successfully!
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 space-y-2">
              <Btn primary block disabled={!photo || processing} onClick={completeReg}>
                Complete Registration
              </Btn>
              <button onClick={() => setStep(1)} className="w-full text-xs" style={{ color: C.textSec }}>
                ← Back
              </button>
            </div>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <div className="p-8 text-center">
            <SuccessCheck />
            <h2 className="text-2xl font-semibold mt-4">You're all set, Kwame! 🎉</h2>
            <p className="text-sm mt-1" style={{ color: C.textSec }}>
              Your account is ready. You've been enrolled in 3 courses.
            </p>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {COURSES.map(c => (
                <div key={c.code} className="rounded-lg p-3 text-left"
                  style={{ background: C.raised, border: `1px solid ${C.border}` }}>
                  <div className="text-xs font-semibold" style={{ color: c.color }}>{c.code}</div>
                  <div className="text-sm font-medium mt-0.5">{c.title}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 text-xs" style={{ color: C.textSec }}>
              Redirecting to your dashboard in {secs} second{secs !== 1 && "s"}...
            </div>
            <div className="mt-4">
              <Btn primary block onClick={onEnter}>Go to Dashboard Now</Btn>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function Expired({ setScreen }: any) {
  return (
    <Card>
      <div className="p-8 text-center" style={{ maxWidth: 440 }}>
        <div className="mx-auto rounded-full flex items-center justify-center" style={{
          width: 72, height: 72, background: "rgba(239,68,68,0.15)",
        }}>
          <AlertTriangle size={36} style={{ color: C.red }} />
        </div>
        <h2 className="text-xl font-semibold mt-4">Registration Link Expired</h2>
        <p className="text-sm mt-2" style={{ color: C.textSec }}>
          This link was valid for 48 hours and has now expired.
        </p>
        <p className="text-sm mt-2" style={{ color: C.textSec }}>
          Please contact your institution admin to receive a new registration link.
        </p>
        <div className="mt-4 rounded-lg p-3 text-xs" style={{ background: C.raised, color: C.textSec }}>
          Name: Kwame Asante | Student ID: STU-0001
        </div>
        <div className="mt-5">
          <Btn ghost block onClick={() => setScreen("login")}>← Back to Login</Btn>
        </div>
      </div>
    </Card>
  );
}

/* ============================== APP SHELL ============================== */
const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "courses", label: "My Courses", icon: BookOpen },
  { key: "mark", label: "Mark Attendance", icon: CheckSquare },
  { key: "history", label: "History", icon: ClipboardList },
  { key: "profile", label: "Profile", icon: UserCircle },
];

function AppShell({ view, setView, sessionLive, onLogout, children }: any) {
  const goNav = (k: string) => {
    if (k === "mark") setView("mark");
    else setView(k);
  };

  return (
    <div className="flex" style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-30"
        style={{
          width: 240, background: C.surface, borderRight: `1px solid ${C.border}`,
        }}>
        <div className="hidden lg:block px-5 pt-5 pb-4">
          <div className="pf text-2xl">KNUST</div>
          <div className="text-xs" style={{ color: C.textSec }}>Student Portal</div>
        </div>
        <div className="lg:hidden flex justify-center pt-5 pb-2">
          <div className="pf text-lg">K</div>
        </div>
        <nav className="flex-1 px-2 py-2 space-y-1">
          {NAV.map(n => {
            const Active = view === n.key || (view === "courseDetail" && n.key === "courses");
            return (
              <button key={n.key} onClick={() => goNav(n.key)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition"
                style={{
                  background: Active ? "rgba(245,158,11,0.12)" : "transparent",
                  color: Active ? C.amber : C.textSec,
                  fontWeight: Active ? 600 : 500,
                  justifyContent: "flex-start",
                }}>
                <span className="relative">
                  <n.icon size={18} />
                  {n.key === "mark" && sessionLive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full pulseDot"
                      style={{ background: C.amber }} />
                  )}
                </span>
                <span className="hidden lg:inline">{n.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-3 hidden lg:block" style={{ borderTop: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-3 rounded-lg p-2"
            style={{ background: C.raised }}>
            <div className="rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
              style={{ width: 36, height: 36, background: C.green, color: "#fff" }}>
              KA
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{STUDENT.name}</div>
              <div className="text-[10px] truncate" style={{ color: C.textSec }}>
                BSc CS • Level 300
              </div>
            </div>
            <button onClick={onLogout} style={{ color: C.textSec }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
        <div className="lg:hidden p-3 flex justify-center" style={{ borderTop: `1px solid ${C.border}` }}>
          <button onClick={onLogout} style={{ color: C.textSec }}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Top header (mobile) */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4"
        style={{ height: 56, background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ width: 36 }} />
        <div className="pf text-lg">KNUST</div>
        <button className="relative" style={{ color: C.textSec }}>
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 rounded-full text-[10px] font-semibold flex items-center justify-center"
            style={{ width: 16, height: 16, background: C.red, color: "#fff" }}>2</span>
        </button>
      </header>

      {/* Top header (desktop) */}
      <header className="hidden md:flex fixed top-0 right-0 z-20 items-center justify-end px-6"
        style={{
          left: 0, paddingLeft: 240 + 24, height: 64,
          background: C.surface, borderBottom: `1px solid ${C.border}`,
        }}>
        <button className="relative mr-4" style={{ color: C.textSec }}>
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 rounded-full text-[10px] font-semibold flex items-center justify-center"
            style={{ width: 16, height: 16, background: C.red, color: "#fff" }}>2</span>
        </button>
      </header>

      <main className="flex-1 w-full"
        style={{ paddingLeft: 0 }}>
        <div className="md:ml-[240px]">
          <div className="pt-[72px] md:pt-[88px] pb-24 md:pb-10 px-4 md:px-8 max-w-[1280px] mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around"
        style={{ height: 64, background: C.surface, borderTop: `1px solid ${C.border}` }}>
        {NAV.map(n => {
          const Active = view === n.key || (view === "courseDetail" && n.key === "courses");
          return (
            <button key={n.key} onClick={() => goNav(n.key)}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
              style={{ color: Active ? C.amber : C.textSec, fontWeight: Active ? 600 : 500 }}>
              <span className="relative">
                <n.icon size={20} fill={Active ? C.amber : "none"} />
                {n.key === "mark" && sessionLive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full pulseDot"
                    style={{ background: C.amber }} />
                )}
              </span>
              <span className="text-[10px]">{n.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ============================== DASHBOARD ============================== */
function Dashboard({ sessionLive, sessionTime, onMark, onCourse, onAll }: any) {
  const overall = pct(
    COURSES.reduce((a, c) => a + c.present, 0),
    COURSES.reduce((a, c) => a + c.total, 0),
  );
  const present = COURSES.reduce((a, c) => a + c.present, 0);
  const total = COURSES.reduce((a, c) => a + c.total, 0);
  const atRisk = COURSES.filter(c => statusOf(c.present, c.total, c.threshold) !== "good").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold">Hello, Kwame 👋</h1>
        <p className="text-sm mt-1" style={{ color: C.textSec }}>
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {sessionLive && (
        <div className="rounded-xl p-5 fadeIn"
          style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))",
            border: `1px solid ${C.amber}`,
          }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full pulseDot" style={{ background: C.amber }} />
            <span className="text-xs font-semibold tracking-wider" style={{ color: C.amber }}>LIVE SESSION</span>
          </div>
          <div className="text-sm" style={{ color: C.textSec }}>Your lecturer has started an attendance session for</div>
          <div className="text-xl md:text-2xl font-semibold mt-1">Database Systems — CS301</div>
          <div className="text-sm mt-0.5" style={{ color: C.textSec }}>Dr. Ama Owusu</div>
          <div className="text-sm mt-3" style={{ color: C.textSec }}>
            Session closes in: <span className="font-mono font-semibold" style={{ color: sessionTime < 120 ? C.red : C.amber }}>
              {fmtTimer(sessionTime)}
            </span>
          </div>
          <div className="mt-4">
            <Btn primary block onClick={onMark}>Mark My Attendance Now →</Btn>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard color={C.blue} label="Enrolled Courses" value="3" unit="Courses" />
        <StatCard color={C.amber} label="Overall Attendance" value={`${overall}%`} unit="Average" />
        <StatCard color={C.green} label="Sessions Attended" value={`${present}`} unit={`of ${total}`} />
        <StatCard color={C.red} label="At-Risk Courses" value={`${atRisk}`} unit={atRisk === 1 ? "Course" : "Courses"} />
      </div>

      {/* My Courses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">My Courses</h2>
          <button onClick={onAll} className="text-sm font-medium" style={{ color: C.amber }}>View All →</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {COURSES.map(c => <CourseCard key={c.code} course={c} onClick={() => onCourse(c)} />)}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
        <Card>
          <div className="divide-y" style={{ borderColor: C.border }}>
            {RECENT.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <MethodIcon method={r.method} status={r.status} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{r.course}</div>
                    <div className="text-xs" style={{ color: C.textSec }}>
                      {r.code} • {r.method === "face" ? "Face Scan" : r.method === "qr" ? "QR Code" : "—"} • {r.date}
                    </div>
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Schedule */}
      <div>
        <h2 className="text-lg font-semibold mb-3">This Week's Classes</h2>
        <Card>
          <div className="divide-y" style={{ borderColor: C.border }}>
            {SCHEDULE.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-4" style={{ borderLeft: `3px solid ${s.color}` }}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{s.title} <span style={{ color: C.textSec }}>({s.code})</span></div>
                  <div className="text-xs mt-0.5" style={{ color: C.textSec }}>
                    {s.day} {s.time} • Room {s.room}
                  </div>
                </div>
                {s.today && (
                  <span className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ background: "rgba(16,185,129,0.15)", color: C.green }}>
                    Attend
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ color, label, value, unit }: any) {
  return (
    <div className="rounded-xl p-4 transition hover:scale-[1.01]"
      style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderTop: `3px solid ${color}`,
      }}>
      <div className="text-xs" style={{ color: C.textSec }}>{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <div className="text-2xl font-semibold">{value}</div>
        <div className="text-xs" style={{ color: C.textSec }}>{unit}</div>
      </div>
    </div>
  );
}

function CourseCard({ course, onClick }: any) {
  const p = pct(course.present, course.total);
  const c = colorOf(course.present, course.total, course.threshold);
  const s = statusOf(course.present, course.total, course.threshold);
  const need = Math.max(0, Math.ceil((course.threshold * course.total - p * course.total / 100) / (100 - course.threshold) * (100 - course.threshold) / 100));
  const sessionsNeeded = (() => {
    let extra = 0, pres = course.present, tot = course.total;
    while (pct(pres, tot) < course.threshold && extra < 50) { pres++; tot++; extra++; }
    return extra;
  })();

  return (
    <div className="rounded-xl p-5 transition cursor-pointer hover:-translate-y-0.5"
      onClick={onClick}
      style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold" style={{ color: course.color }}>{course.code}</div>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: C.raised, color: C.textSec }}>
          {course.sem}
        </span>
      </div>
      <div className="text-lg font-semibold mt-1">{course.title}</div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <Tag>{course.level}</Tag>
        <Tag>BSc CS</Tag>
      </div>
      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <div className="text-4xl font-semibold" style={{ color: c }}>{p}%</div>
          <StatusBadge status={s} />
        </div>
        <div className="mt-3 relative h-2 rounded-full" style={{ background: C.raised }}>
          <div className="absolute inset-y-0 left-0 rounded-full transition-all"
            style={{ width: `${p}%`, background: c }} />
          <div className="absolute inset-y-[-3px]" style={{ left: `${course.threshold}%`, borderLeft: `2px dashed ${C.textSec}`, height: 14 }} />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-xs" style={{ color: C.textSec }}>
          <span>{course.present} of {course.total} sessions</span>
          <span>Min: {course.threshold}%</span>
        </div>
      </div>
      {s === "defaulter" && (
        <div className="mt-3 rounded-lg p-2.5 text-xs flex items-start gap-2"
          style={{ background: "rgba(239,68,68,0.1)", color: C.red, border: `1px solid rgba(239,68,68,0.2)` }}>
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          You need to attend {sessionsNeeded} more session{sessionsNeeded !== 1 && "s"} to reach {course.threshold}%
        </div>
      )}
      <button className="mt-3 text-xs font-medium flex items-center gap-1" style={{ color: C.amber }}>
        View Details <ChevronRight size={12} />
      </button>
    </div>
  );
}

/* ============================== COURSES LIST ============================== */
function CoursesList({ onCourse, toast, titleOverride, subtitleOverride }: any) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "good" | "atrisk" | "defaulter">("all");
  const list = COURSES.filter(c => {
    const matchQ = (c.title + c.code).toLowerCase().includes(q.toLowerCase());
    const s = statusOf(c.present, c.total, c.threshold);
    return matchQ && (filter === "all" || s === filter);
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold">{titleOverride || "My Courses"}</h1>
        <p className="text-sm mt-1" style={{ color: C.textSec }}>
          {subtitleOverride || "2024/2025 — Semester 1 | BSc Computer Science, Level 300"}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textSec }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search courses..."
            className="w-full pl-9" style={inputStyle} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value as any)}
          style={{ ...inputStyle, paddingRight: 24 }}>
          <option value="all">All statuses</option>
          <option value="good">Good Standing</option>
          <option value="atrisk">At Risk</option>
          <option value="defaulter">Defaulter</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(c => <DetailedCourseCard key={c.code} course={c} onClick={() => onCourse(c)} onContact={() => toast("info", `Email sent to ${c.lecturer}`)} />)}
      </div>
    </div>
  );
}

function DetailedCourseCard({ course, onClick, onContact }: any) {
  const p = pct(course.present, course.total);
  const c = colorOf(course.present, course.total, course.threshold);
  const s = statusOf(course.present, course.total, course.threshold);
  return (
    <div className="rounded-xl overflow-hidden transition hover:-translate-y-0.5"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div style={{ height: 4, background: course.color }} />
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold" style={{ color: course.color }}>{course.code}</div>
            <div className="text-base font-semibold">{course.title}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <Tag>{course.level}</Tag><Tag>{course.sem}</Tag><Tag>{course.credits} credits</Tag>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <Ring percent={p} color={c} size={84} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{course.present} of {course.total} sessions attended</div>
            <div className="mt-1.5"><StatusBadge status={s} /></div>
            <div className="text-xs mt-1.5" style={{ color: C.textSec }}>Min required: {course.threshold}%</div>
          </div>
        </div>
        {s === "defaulter" && (
          <Banner type="error" className="mt-3 text-xs">
            <AlertTriangle size={12} className="inline mr-1" />
            Below threshold — missing more classes may result in disqualification.
          </Banner>
        )}
        {s === "atrisk" && (
          <Banner type="warning" className="mt-3 text-xs">
            <AlertTriangle size={12} className="inline mr-1" />
            You're close to the minimum threshold. Don't miss class!
          </Banner>
        )}
        <div className="flex gap-2 mt-4">
          <Btn ghost onClick={onClick}>View History</Btn>
          <Btn ghost onClick={(e: any) => { e.stopPropagation(); onContact(); }}>Contact Lecturer</Btn>
        </div>
      </div>
    </div>
  );
}

/* ============================== COURSE DETAIL ============================== */
function CourseDetail({ course, onBack }: any) {
  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "absent">("all");
  const p = pct(course.present, course.total);
  const c = colorOf(course.present, course.total, course.threshold);
  const s = statusOf(course.present, course.total, course.threshold);
  const records = course.code === "CS301" ? CS301_SESSIONS : CS301_SESSIONS.slice(0, 8);
  const filtered = records.filter(r => {
    if (statusFilter === "all") return true;
    if (statusFilter === "present") return r.status !== "absent";
    return r.status === "absent";
  });

  const chartData = useMemo(() => {
    let pres = 0, tot = 0;
    return [...records].reverse().map((r, i) => {
      tot++;
      if (r.status !== "absent") pres++;
      return { name: `S${i + 1}`, label: r.label, pct: pct(pres, tot), pres, tot };
    });
  }, [records]);

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-sm" style={{ color: C.textSec }}>
        <ArrowLeft size={16} /> Back to courses
      </button>
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-semibold">{course.title}</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: C.raised, color: course.color }}>{course.code}</span>
        </div>
        <p className="text-sm mt-1" style={{ color: C.textSec }}>{course.lecturer} • {course.level}</p>
      </div>

      <Card>
        <div className="p-5 flex flex-col md:flex-row gap-5 items-center md:items-stretch">
          <div className="flex items-center gap-4 flex-1">
            <Ring percent={p} color={c} size={100} />
            <div>
              <StatusBadge status={s} />
              <div className="text-sm mt-2" style={{ color: C.textSec }}>{course.present} of {course.total} sessions</div>
            </div>
          </div>
          <div className="w-px hidden md:block" style={{ background: C.border }} />
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-3 flex-1">
            <MiniStat color={C.green} label="Present" value={course.present} />
            <MiniStat color={C.red} label="Absent" value={course.total - course.present} />
            <MiniStat color={C.textSec} label="Total" value={course.total} />
            <MiniStat color={C.amber} label="Threshold" value={`${course.threshold}%`} />
          </div>
        </div>
        <div className="px-5 pb-5">
          <div className="relative h-2 rounded-full" style={{ background: C.raised }}>
            <div className="absolute inset-y-0 left-0 rounded-full transition-all"
              style={{ width: `${p}%`, background: c }} />
            <div className="absolute inset-y-[-3px]"
              style={{ left: `${course.threshold}%`, borderLeft: `2px dashed ${C.amber}`, height: 14 }} />
          </div>
        </div>
      </Card>

      {s === "defaulter" && (
        <Banner type="error">
          <AlertTriangle size={16} className="inline mr-2" />
          You are below the minimum attendance threshold of {course.threshold}%. You are currently at {p}%. Attend the next 3 sessions to recover.
        </Banner>
      )}
      {s === "atrisk" && (
        <Banner type="warning">
          <AlertTriangle size={16} className="inline mr-2" />
          You are approaching the minimum threshold. Missing 2 more sessions will put you below {course.threshold}%.
        </Banner>
      )}
      {s === "good" && (
        <Banner type="success">
          <CheckCircle2 size={16} className="inline mr-2" />
          You are in good standing. Keep it up!
        </Banner>
      )}

      <div className="flex flex-wrap gap-2">
        {(["all", "present", "absent"] as const).map(f => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className="text-xs font-medium px-3 py-1.5 rounded-full transition"
            style={{
              background: statusFilter === f ? C.amber : C.surface,
              color: statusFilter === f ? "#0F1623" : C.textSec,
              border: `1px solid ${statusFilter === f ? C.amber : C.border}`,
            }}>
            {f === "all" ? "All" : f === "present" ? "Present" : "Absent"}
          </button>
        ))}
      </div>

      {/* Records — table on desktop, cards on mobile */}
      <Card>
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.textSec }}>
                <th className="text-left px-4 py-3 font-medium">#</th>
                <th className="text-left px-4 py-3 font-medium">Session</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Check-in</th>
                <th className="text-left px-4 py-3 font-medium">Method</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}
                  className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3" style={{ color: C.textSec }}>{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{r.label}</td>
                  <td className="px-4 py-3" style={{ color: C.textSec }}>{r.date} ({r.day})</td>
                  <td className="px-4 py-3" style={{ color: C.textSec }}>{r.time || "—"}</td>
                  <td className="px-4 py-3"><MethodLabel method={r.method} /></td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden divide-y" style={{ borderColor: C.border }}>
          {filtered.map((r, i) => (
            <div key={i} className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">{r.date}</span>
                <StatusBadge status={r.status} />
              </div>
              <div className="text-sm">{r.label}</div>
              <div className="text-xs mt-1.5">
                {r.status === "absent"
                  ? <span style={{ color: C.red }}>Not checked in</span>
                  : <span style={{ color: C.textSec }}>{r.time} • <MethodLabel inline method={r.method} /></span>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Chart */}
      <Card>
        <div className="p-5">
          <h3 className="text-base font-semibold mb-4">Your Attendance Timeline</h3>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke={C.textSec} fontSize={11} />
                <YAxis stroke={C.textSec} fontSize={11} domain={[0, 100]} />
                <Tooltip content={({ active, payload }: any) => active && payload?.[0] ? (
                  <div className="rounded-lg p-2 text-xs"
                    style={{ background: C.raised, border: `1px solid ${C.border}`, color: C.text }}>
                    <div className="font-semibold">{payload[0].payload.label}</div>
                    <div style={{ color: C.textSec }}>
                      {payload[0].payload.pres}/{payload[0].payload.tot} attended ({payload[0].payload.pct}%)
                    </div>
                  </div>
                ) : null} />
                <ReferenceLine y={course.threshold} stroke={C.amber} strokeDasharray="4 4" label={{ value: `Min ${course.threshold}%`, fill: C.amber, fontSize: 11, position: "right" }} />
                <Line type="monotone" dataKey="pct" stroke={c} strokeWidth={2.5} dot={{ fill: c, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </div>
  );
}

function MiniStat({ color, label, value }: any) {
  return (
    <div className="rounded-lg p-3" style={{ background: C.raised }}>
      <div className="text-xs" style={{ color: C.textSec }}>{label}</div>
      <div className="text-lg font-semibold mt-0.5" style={{ color }}>{value}</div>
    </div>
  );
}

/* ============================== MARK FLOW ============================== */
function MarkFlow({ step, setStep, method, setMethod, sessionTime, onExit, toast }: any) {
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [codeErr, setCodeErr] = useState(false);
  const [codeAttempts, setCodeAttempts] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [shake, setShake] = useState(false);
  const [oldPct] = useState(75);
  const [newPct] = useState(79);

  const goBack = () => {
    if (step === "code") setStep("notify");
    else if (step === "method") setStep("code");
    else if (step === "face" || step === "qr") setStep("method");
    else onExit();
  };

  const submitCode = (full: string) => {
    if (full.toUpperCase() === VALID_CODE) {
      setStep("method");
      setCode(Array(6).fill(""));
      setCodeErr(false);
      setCodeAttempts(0);
    } else {
      setShake(true);
      setCodeErr(true);
      const n = codeAttempts + 1;
      setCodeAttempts(n);
      setTimeout(() => {
        setShake(false);
        setCode(Array(6).fill(""));
        inputs.current[0]?.focus();
        if (n >= 3) setStep("locked");
      }, 500);
    }
  };

  const setBox = (i: number, v: string) => {
    if (v.length > 1) {
      // paste
      const chars = v.toUpperCase().slice(0, 6).split("");
      const next = [...code];
      chars.forEach((c, idx) => { if (idx < 6) next[idx] = c; });
      setCode(next);
      setCodeErr(false);
      if (next.every(x => x)) submitCode(next.join(""));
      else inputs.current[Math.min(chars.length, 5)]?.focus();
      return;
    }
    const next = [...code];
    next[i] = v.toUpperCase();
    setCode(next);
    setCodeErr(false);
    if (v && i < 5) inputs.current[i + 1]?.focus();
    if (next.every(x => x)) submitCode(next.join(""));
  };

  const handleKey = (i: number, e: any) => {
    if (e.key === "Backspace" && !code[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.bg }}>
      {step !== "success" && step !== "already_marked" && step !== "locked" && (
        <header className="flex items-center px-4 md:px-8" style={{
          height: 56, borderBottom: `1px solid ${C.border}`, background: C.surface,
        }}>
          <button onClick={goBack} className="flex items-center gap-2 text-sm" style={{ color: C.textSec }}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 text-center text-sm font-medium">
            {step === "notify" && "Attendance"}
            {step === "code" && "Step 1 of 3 — Verify Presence"}
            {step === "method" && "Step 2 of 3 — Choose Method"}
            {step === "face" && "Step 3 of 3 — Face Verification"}
            {step === "qr" && "Step 3 of 3 — Scan QR Code"}
          </div>
          <div style={{ width: 24 }} />
        </header>
      )}

      {(step === "code" || step === "method" || step === "face" || step === "qr") && (
        <div className="h-1" style={{ background: C.surface }}>
          <div className="h-full transition-all" style={{
            width: step === "code" ? "33%" : step === "method" ? "66%" : "100%",
            background: step === "face" ? C.purple : step === "qr" ? C.blue : C.amber,
          }} />
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-start md:justify-center p-4 md:p-8">
        <div className="w-full" style={{ maxWidth: 560 }}>

          {step === "notify" && (
            <div className="text-center py-6 fadeIn">
              <div className="mx-auto rounded-full flex items-center justify-center pulseRing"
                style={{ width: 96, height: 96, background: "rgba(245,158,11,0.15)" }}>
                <Radio size={44} style={{ color: C.amber }} />
              </div>
              <h1 className="text-2xl font-semibold mt-5">Attendance Session Active!</h1>
              <div className="mt-4 inline-block rounded-xl p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="text-lg font-semibold">Database Systems — CS301</div>
                <div className="text-sm mt-0.5" style={{ color: C.textSec }}>Dr. Ama Owusu</div>
                <div className="text-xs mt-2" style={{ color: C.textSec }}>Started 10 minutes ago</div>
                <div className="text-xs mt-3" style={{ color: C.textSec }}>Closes in</div>
                <div className="font-mono text-4xl font-semibold mt-1"
                  style={{ color: sessionTime < 120 ? C.red : C.amber }}>
                  {fmtTimer(sessionTime)}
                </div>
              </div>
              <div className="mt-5 rounded-lg p-3 text-xs flex items-start gap-2"
                style={{ background: "rgba(59,130,246,0.1)", color: C.text, border: `1px solid rgba(59,130,246,0.2)` }}>
                <Info size={16} style={{ color: C.blue, flexShrink: 0 }} />
                <span style={{ color: C.textSec }}>
                  Make sure you are physically present in the classroom before proceeding.
                </span>
              </div>
              <div className="mt-5 space-y-2">
                <Btn primary block onClick={() => setStep("code")}>Proceed to Mark Attendance →</Btn>
                <Btn ghost block onClick={onExit}>Not Now</Btn>
              </div>
            </div>
          )}

          {step === "code" && (
            <div className="text-center py-6 fadeIn">
              <div className="mx-auto rounded-full flex items-center justify-center"
                style={{ width: 72, height: 72, background: "rgba(245,158,11,0.15)" }}>
                <Lock size={32} style={{ color: C.amber }} />
              </div>
              <h1 className="text-2xl font-semibold mt-4">Enter Session Code</h1>
              <p className="text-sm mt-2 italic" style={{ color: C.textSec, maxWidth: 380, margin: "8px auto 0" }}>
                Your lecturer has announced a 6-character code. Enter it below to confirm you are physically present in the classroom.
              </p>

              <div className={`mt-6 flex justify-center gap-2 ${shake ? "shake" : ""}`}>
                {code.map((ch, i) => (
                  <input key={i} ref={el => { inputs.current[i] = el; }}
                    value={ch} maxLength={6}
                    onChange={e => setBox(i, e.target.value)}
                    onKeyDown={e => handleKey(i, e)}
                    onFocus={e => e.target.select()}
                    inputMode="text" autoCapitalize="characters"
                    className="text-center font-mono text-2xl font-semibold rounded-lg"
                    style={{
                      width: 48, height: 60,
                      background: C.bg,
                      border: `2px solid ${codeErr ? C.red : C.borderStrong}`,
                      color: C.amber,
                    }} />
                ))}
              </div>

              {codeErr && (
                <div className="mt-3 text-sm" style={{ color: C.red }}>
                  Incorrect code. {3 - codeAttempts} attempt{3 - codeAttempts !== 1 && "s"} remaining.
                </div>
              )}
              <div className="mt-6 text-xs" style={{ color: C.textSec }}>
                Forgot the code? Ask your lecturer to announce it again.
              </div>
              <div className="mt-2 text-xs" style={{ color: C.textMuted }}>
                Hint (demo): {VALID_CODE}
              </div>
            </div>
          )}

          {step === "method" && (
            <div className="py-6 fadeIn">
              <div className="text-center">
                <h1 className="text-2xl font-semibold">How would you like to mark attendance?</h1>
                <p className="text-sm mt-2" style={{ color: C.textSec }}>Both methods are equally valid.</p>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <MethodCard
                  color={C.purple} icon={ScanFace} title="Scan My Face"
                  desc="Use your front camera to verify your identity"
                  pros={["Quick and hands-free", "No need to point at screen"]}
                  badge={{ label: "Recommended", color: C.green }}
                  onClick={() => { setMethod("face"); setStep("face"); }}
                />
                <MethodCard
                  color={C.blue} icon={QrCode} title="Scan QR Code"
                  desc="Point your camera at the QR code on the projector"
                  pros={["Works if camera has issues", "Reliable fallback option"]}
                  badge={{ label: "Fallback Option", color: C.blue }}
                  onClick={() => { setMethod("qr"); setStep("qr"); }}
                />
              </div>
            </div>
          )}

          {step === "face" && <FaceScan setStep={setStep} switchToQr={() => setStep("qr")} />}
          {step === "qr" && <QrScan setStep={setStep} switchToFace={() => setStep("face")} />}

          {step === "success" && (
            <div className="text-center py-6 fadeIn">
              <div className="relative inline-block">
                <SuccessCheck />
                <div className="confetti absolute inset-0 pointer-events-none">
                  {[C.amber, C.green, C.blue, C.purple, C.red, C.green, C.amber, C.blue].map((c, i) => (
                    <span key={i} style={{
                      background: c,
                      left: `${20 + i * 8}%`, top: "50%",
                      animationDelay: `${i * 0.1}s`,
                    }} />
                  ))}
                </div>
              </div>
              <h1 className="text-3xl font-semibold mt-4">Attendance Marked!</h1>
              <p className="text-sm mt-2" style={{ color: C.textSec }}>
                You're confirmed present for this session.
              </p>
              <Card className="mt-5 text-left">
                <div className="p-4 space-y-2 text-sm">
                  <Row label="Course">Database Systems — CS301</Row>
                  <Row label="Session">Week 9 Lecture</Row>
                  <Row label="Date">Wednesday, 4 June 2025</Row>
                  <Row label="Time">10:14 AM</Row>
                  <Row label="Method"><MethodLabel inline method={method} /></Row>
                </div>
              </Card>
              <div className="mt-5 rounded-xl p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="text-xs" style={{ color: C.textSec }}>Updated attendance</div>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-sm line-through" style={{ color: C.textMuted }}>{oldPct}%</span>
                  <span className="text-3xl font-semibold" style={{ color: C.green }}>{newPct}%</span>
                  <StatusBadge status="good" />
                </div>
                <div className="mt-3 relative h-2 rounded-full" style={{ background: C.raised }}>
                  <div className="rounded-full transition-all" style={{ width: `${newPct}%`, height: "100%", background: C.green }} />
                </div>
              </div>
              <Banner type="warning" className="mt-4 text-xs text-left">
                You're now at {newPct}%. Keep attending to stay above 75%.
              </Banner>
              <div className="mt-5 space-y-2">
                <Btn primary block onClick={onExit}>Return to Dashboard</Btn>
                <Btn ghost block onClick={onExit}>View My Attendance →</Btn>
              </div>
            </div>
          )}

          {step === "already_marked" && (
            <div className="text-center py-6 fadeIn">
              <div className="mx-auto rounded-full flex items-center justify-center"
                style={{ width: 80, height: 80, background: "rgba(59,130,246,0.15)" }}>
                <Info size={40} style={{ color: C.blue }} />
              </div>
              <h1 className="text-2xl font-semibold mt-4">Already Checked In</h1>
              <p className="text-sm mt-2" style={{ color: C.textSec }}>
                You've already marked attendance for this session.
              </p>
              <Card className="mt-5 text-left">
                <div className="p-4 space-y-2 text-sm">
                  <Row label="Course">Database Systems — CS301</Row>
                  <Row label="Checked in">10:02 AM</Row>
                  <Row label="Method"><MethodLabel inline method={method} /></Row>
                </div>
              </Card>
              <div className="mt-5">
                <Btn primary block onClick={onExit}>Return to Dashboard</Btn>
              </div>
            </div>
          )}

          {step === "locked" && (
            <div className="text-center py-6 fadeIn">
              <div className="mx-auto rounded-full flex items-center justify-center"
                style={{ width: 80, height: 80, background: "rgba(239,68,68,0.15)" }}>
                <Lock size={36} style={{ color: C.red }} />
              </div>
              <h1 className="text-2xl font-semibold mt-4">You have been locked out of this session</h1>
              <p className="text-sm mt-2" style={{ color: C.textSec }}>
                3 incorrect attempts. You can no longer mark attendance for this session.
              </p>
              <p className="text-xs mt-2" style={{ color: C.textSec }}>
                If this was a mistake, speak to your lecturer directly.
              </p>
              <div className="mt-5">
                <Btn primary block onClick={onExit}>Return to Dashboard</Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MethodCard({ color, icon: Icon, title, desc, pros, badge, onClick }: any) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      className="text-left rounded-xl p-5 transition"
      style={{
        background: hover ? `${color}10` : C.surface,
        border: `2px solid ${hover ? color : C.border}`,
        boxShadow: hover ? `0 0 20px ${color}30` : "none",
      }}>
      <div className="flex items-center justify-between mb-3">
        <div className="rounded-xl flex items-center justify-center"
          style={{ width: 56, height: 56, background: `${color}20` }}>
          <Icon size={28} style={{ color }} />
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded-full"
          style={{ background: `${badge.color}20`, color: badge.color }}>
          {badge.label}
        </span>
      </div>
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-sm mt-1" style={{ color: C.textSec }}>{desc}</div>
      <div className="mt-3 space-y-1">
        {pros.map((p: string) => (
          <div key={p} className="text-xs flex items-center gap-2" style={{ color: C.textSec }}>
            <CheckCircle2 size={12} style={{ color }} /> {p}
          </div>
        ))}
      </div>
    </button>
  );
}

function FaceScan({ setStep, switchToQr }: any) {
  const [phase, setPhase] = useState<"perm" | "scan" | "detected" | "processing" | "fail">("perm");
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!allowed) return;
    setPhase("scan");
    const t1 = setTimeout(() => setPhase("detected"), 2000);
    const t2 = setTimeout(() => setPhase("processing"), 3000);
    const t3 = setTimeout(() => {
      // 60% success for demo, but force success first time
      setStep("success");
    }, 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [allowed]);

  const ovalColor = phase === "detected" || phase === "processing" ? C.green : C.text;

  return (
    <div className="fadeIn">
      <div className="relative mx-auto overflow-hidden rounded-xl"
        style={{
          background: "#000", aspectRatio: "16/9",
          maxWidth: 520, border: `1px solid ${C.border}`,
        }}>
        {phase === "perm" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <Camera size={40} style={{ color: C.purple }} />
            <div className="text-base font-semibold mt-3" style={{ color: C.text }}>Camera Access Required</div>
            <div className="text-xs mt-1" style={{ color: C.textSec }}>Please allow camera access to use face scan</div>
            <div className="mt-4 w-full space-y-2" style={{ maxWidth: 280 }}>
              <Btn primary block onClick={() => setAllowed(true)}>Allow Camera Access</Btn>
              <Btn ghost block onClick={switchToQr}>Switch to QR Code Instead</Btn>
            </div>
          </div>
        ) : (
          <>
            {/* corner brackets */}
            {[
              { top: 12, left: 12, borderTop: 2, borderLeft: 2 },
              { top: 12, right: 12, borderTop: 2, borderRight: 2 },
              { bottom: 12, left: 12, borderBottom: 2, borderLeft: 2 },
              { bottom: 12, right: 12, borderBottom: 2, borderRight: 2 },
            ].map((s, i) => (
              <div key={i} className="absolute" style={{
                ...s, width: 24, height: 24,
                borderStyle: "solid", borderColor: ovalColor,
              }} />
            ))}
            {/* oval */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden"
              style={{
                width: "55%", aspectRatio: "3/4",
                border: `2px dashed ${ovalColor}`,
                borderRadius: "50%",
                boxShadow: phase === "detected" || phase === "processing" ? `0 0 24px ${C.green}` : "none",
              }}>
              {phase === "scan" && (
                <div className="absolute left-0 right-0 sweep" style={{
                  height: 2, background: C.purple, boxShadow: `0 0 8px ${C.purple}`,
                }} />
              )}
            </div>
            {phase === "processing" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-center">
                  <Loader2 size={32} className="animate-spin mx-auto" style={{ color: C.purple }} />
                  <div className="text-sm mt-2" style={{ color: C.text }}>Verifying identity...</div>
                  <div className="text-xs mt-1" style={{ color: C.textSec }}>
                    Comparing with your registered face encoding
                  </div>
                </div>
              </div>
            )}
            <div className="absolute bottom-3 left-0 right-0 text-center text-xs px-4" style={{ color: C.text }}>
              {phase === "scan" && (
                <>
                  <div className="font-semibold">Position your face inside the frame</div>
                  <div style={{ color: C.textSec }}>Hold still — detecting your face...</div>
                </>
              )}
              {phase === "detected" && (
                <div className="font-semibold" style={{ color: C.green }}>Face detected! Hold still...</div>
              )}
            </div>
          </>
        )}
      </div>
      <div className="mt-4 max-w-[520px] mx-auto space-y-2">
        <Btn ghost block onClick={switchToQr}>Switch to QR Code</Btn>
      </div>
    </div>
  );
}

function QrScan({ setStep, switchToFace }: any) {
  const [phase, setPhase] = useState<"perm" | "scan" | "processing">("perm");
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!allowed) return;
    setPhase("scan");
    const t1 = setTimeout(() => setPhase("processing"), 3000);
    const t2 = setTimeout(() => setStep("success"), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [allowed]);

  return (
    <div className="fadeIn">
      <div className="relative mx-auto overflow-hidden rounded-xl"
        style={{
          background: "#000", aspectRatio: "1/1",
          maxWidth: 420, border: `1px solid ${C.border}`,
        }}>
        {phase === "perm" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <QrCode size={40} style={{ color: C.blue }} />
            <div className="text-base font-semibold mt-3" style={{ color: C.text }}>Camera Access Required</div>
            <div className="mt-4 w-full space-y-2" style={{ maxWidth: 280 }}>
              <Btn primary block onClick={() => setAllowed(true)}>Allow Camera Access</Btn>
              <Btn ghost block onClick={switchToFace}>Switch to Face Scan</Btn>
            </div>
          </div>
        ) : (
          <>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ width: "70%", aspectRatio: "1/1" }}>
              {[
                { top: 0, left: 0, borderTop: 3, borderLeft: 3 },
                { top: 0, right: 0, borderTop: 3, borderRight: 3 },
                { bottom: 0, left: 0, borderBottom: 3, borderLeft: 3 },
                { bottom: 0, right: 0, borderBottom: 3, borderRight: 3 },
              ].map((s, i) => (
                <div key={i} className="absolute" style={{
                  ...s, width: 32, height: 32, borderStyle: "solid", borderColor: "#fff",
                }} />
              ))}
              {phase === "scan" && (
                <div className="absolute left-0 right-0 sweep" style={{
                  height: 2, background: C.blue, boxShadow: `0 0 8px ${C.blue}`,
                }} />
              )}
            </div>
            {phase === "processing" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-center">
                  <Loader2 size={32} className="animate-spin mx-auto" style={{ color: C.blue }} />
                  <div className="text-sm mt-2" style={{ color: C.text }}>Validating QR Code...</div>
                </div>
              </div>
            )}
            <div className="absolute bottom-3 left-0 right-0 text-center text-xs px-4" style={{ color: C.text }}>
              {phase === "scan" && (
                <>
                  <div className="font-semibold">Point your camera at the QR code on the projector</div>
                  <div style={{ color: C.textSec }}>Make sure the QR code is fully visible in the frame</div>
                </>
              )}
            </div>
          </>
        )}
      </div>
      {phase === "scan" && (
        <div className="mt-3 rounded-lg p-3 text-xs flex gap-2 max-w-[420px] mx-auto"
          style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.textSec }}>
          <span>💡</span>
          <span>Move closer if the QR code appears small, or ask your lecturer to zoom in on the projector.</span>
        </div>
      )}
      <div className="mt-4 max-w-[420px] mx-auto">
        <Btn ghost block onClick={switchToFace}>Switch to Face Scan</Btn>
      </div>
    </div>
  );
}

/* ============================== PROFILE ============================== */
function Profile({ toast }: any) {
  const [tab, setTab] = useState<"personal" | "security" | "face" | "notif">("personal");
  const overall = pct(
    COURSES.reduce((a, c) => a + c.present, 0),
    COURSES.reduce((a, c) => a + c.total, 0),
  );

  return (
    <div className="space-y-5">
      <h1 className="text-2xl md:text-3xl font-semibold">My Profile</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-5 text-center">
              <div className="rounded-full mx-auto flex items-center justify-center font-semibold"
                style={{ width: 80, height: 80, background: C.green, color: "#fff", fontSize: 28 }}>
                KA
              </div>
              <button className="text-xs mt-2" style={{ color: C.amber }} onClick={() => setTab("face")}>
                Update Photo
              </button>
              <div className="pf text-xl mt-3">{STUDENT.name}</div>
              <div className="text-xs mt-0.5" style={{ color: C.textSec }}>{STUDENT.id}</div>
              <div className="text-xs mt-1 flex items-center justify-center gap-1" style={{ color: C.textSec }}>
                {STUDENT.email}
                <span className="inline-flex items-center justify-center rounded-full" style={{ width: 14, height: 14, background: C.green }}>
                  <CheckCircle2 size={10} color="#fff" />
                </span>
              </div>
              <div className="mt-3 text-xs space-y-0.5" style={{ color: C.textSec }}>
                <div>{STUDENT.programme}</div>
                <div>{STUDENT.level} • {STUDENT.semester}</div>
                <div>{STUDENT.department}</div>
              </div>
              <div className="my-4 h-px" style={{ background: C.border }} />
              <div className="space-y-2 text-left">
                <div className="flex justify-between text-xs"><span style={{ color: C.textSec }}>Overall Average</span><span style={{ color: C.amber, fontWeight: 600 }}>{overall}%</span></div>
                <div className="flex justify-between text-xs"><span style={{ color: C.textSec }}>Courses Enrolled</span><span>3</span></div>
                <div className="flex justify-between text-xs"><span style={{ color: C.textSec }}>Sessions Attended</span><span>34 of 46</span></div>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="text-xs font-semibold px-2 py-1 rounded-full"
                  style={{ background: "rgba(16,185,129,0.15)", color: C.green }}>Active</span>
              </div>
              <div className="text-xs mt-2" style={{ color: C.textMuted }}>Member since {STUDENT.since}</div>
            </div>
          </Card>
        </div>

        {/* Right */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex gap-1 p-2 overflow-x-auto scrollbar" style={{ borderBottom: `1px solid ${C.border}` }}>
              {[
                ["personal", "Personal Info"],
                ["security", "Security"],
                ["face", "Face Photo"],
                ["notif", "Notifications"],
              ].map(([k, l]) => (
                <button key={k} onClick={() => setTab(k as any)}
                  className="px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition"
                  style={{
                    background: tab === k ? "rgba(245,158,11,0.12)" : "transparent",
                    color: tab === k ? C.amber : C.textSec,
                  }}>{l}</button>
              ))}
            </div>

            <div className="p-5">
              {tab === "personal" && <PersonalTab toast={toast} />}
              {tab === "security" && <SecurityTab toast={toast} />}
              {tab === "face" && <FaceTab toast={toast} />}
              {tab === "notif" && <NotifTab toast={toast} />}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PersonalTab({ toast }: any) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-3">Editable</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Display Name"><input className="w-full" style={inputStyle} defaultValue="Kwame Asante" /></Field>
          <Field label="Phone Number"><input className="w-full" style={inputStyle} placeholder="+233..." /></Field>
        </div>
      </div>
      <div>
        <h3 className="text-base font-semibold mb-3">Managed by admin</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            ["Full Name", STUDENT.name], ["Student ID", STUDENT.id],
            ["Email", STUDENT.email], ["Programme", STUDENT.programme],
            ["Level", STUDENT.level], ["Department", STUDENT.department],
          ].map(([l, v]) => (
            <div key={l}>
              <div className="text-xs mb-1" style={{ color: C.textSec }}>{l}</div>
              <div className="rounded-lg px-3 py-2.5 flex items-center justify-between text-sm"
                style={{ background: C.raised, color: C.textSec }}>
                <span className="truncate">{v}</span><Lock size={14} className="flex-shrink-0 ml-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs" style={{ color: C.textSec }}>
        Personal details are managed by your institution admin. Contact admin to update your name or email.
      </p>
      <Btn primary onClick={() => toast("success", "Changes saved successfully.")}>Save Changes</Btn>
    </div>
  );
}

function SecurityTab({ toast }: any) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const reqs = {
    len: pw.length >= 8,
    num: /\d/.test(pw),
    sym: /[!@#$%^&*(),.?":{}|<>]/.test(pw),
    match: pw.length > 0 && pw === pw2,
  };
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-3">Change Password</h3>
        <div className="space-y-3">
          <Field label="Current Password"><input type="password" className="w-full" style={inputStyle} /></Field>
          <Field label="New Password"><input type="password" value={pw} onChange={e => setPw(e.target.value)} className="w-full" style={inputStyle} /></Field>
          <Field label="Confirm New Password"><input type="password" value={pw2} onChange={e => setPw2(e.target.value)} className="w-full" style={inputStyle} /></Field>
          <div className="rounded-lg p-3 space-y-1.5" style={{ background: C.raised }}>
            {[
              ["At least 8 characters", reqs.len],
              ["At least one number", reqs.num],
              ["At least one special character", reqs.sym],
              ["Passwords match", reqs.match],
            ].map(([t, ok]) => (
              <div key={t as string} className="flex items-center gap-2 text-xs"
                style={{ color: ok ? C.green : C.textSec }}>
                {ok ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 rounded-full border" style={{ borderColor: C.textMuted }} />}
                {t}
              </div>
            ))}
          </div>
          <Btn primary onClick={() => toast("success", "Password updated successfully.")}>Update Password</Btn>
        </div>
      </div>
      <div>
        <h3 className="text-base font-semibold mb-2">Last Login</h3>
        <div className="rounded-lg p-3 text-sm" style={{ background: C.raised }}>
          <div>Today at 9:14 AM</div>
          <div className="text-xs mt-1" style={{ color: C.textSec }}>Chrome browser, Ghana</div>
          <div className="text-xs mt-2" style={{ color: C.red }}>Not you? Change your password immediately.</div>
        </div>
      </div>
    </div>
  );
}

function FaceTab({ toast }: any) {
  const [confirm, setConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Update Your Face Photo</h3>
        <p className="text-sm" style={{ color: C.textSec }}>Used for face recognition during attendance marking.</p>
      </div>
      <div className="rounded-lg p-3 flex items-start gap-3"
        style={{ background: "rgba(16,185,129,0.1)", border: `1px solid rgba(16,185,129,0.2)` }}>
        <CheckCircle2 size={20} style={{ color: C.green }} />
        <div className="text-sm">
          <div style={{ color: C.green, fontWeight: 600 }}>Face encoding registered</div>
          <div className="text-xs mt-0.5" style={{ color: C.textSec }}>Last updated: September 2024</div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
        <div className="rounded-xl flex items-center justify-center" style={{
          width: 200, height: 200, background: `linear-gradient(135deg, ${C.purple}, ${C.blue})`,
          color: "#fff", fontSize: 56, fontWeight: 600,
        }}>KA</div>
        <div className="flex-1 space-y-2">
          <div className="rounded-lg p-3 text-xs space-y-1"
            style={{ background: "rgba(59,130,246,0.1)", border: `1px solid rgba(59,130,246,0.2)` }}>
            <div className="font-semibold" style={{ color: C.blue }}>Photo requirements</div>
            <div style={{ color: C.textSec }}>✓ Clear frontal view, no obstructions</div>
            <div style={{ color: C.textSec }}>✓ Good lighting</div>
            <div style={{ color: C.textSec }}>✓ Only your face visible</div>
            <div style={{ color: C.textSec }}>✓ Minimum 300×300 pixels</div>
          </div>
          <Banner type="warning" className="text-xs">
            Updating your face photo will replace your current encoding. You may not be able to use face scan until processing completes (usually under 1 minute).
          </Banner>
          <Btn primary onClick={() => setConfirm(true)}>Update Face Photo</Btn>
        </div>
      </div>
      {confirm && (
        <ConfirmModal
          title="Replace your face encoding?"
          body="Your current encoding will be removed and a new one generated. Face scan may be unavailable briefly."
          confirmLabel="Replace"
          danger
          onCancel={() => setConfirm(false)}
          onConfirm={() => {
            setConfirm(false);
            setProcessing(true);
            setTimeout(() => {
              setProcessing(false);
              toast("success", "Face photo updated and encoding refreshed.");
            }, 1800);
          }}
        />
      )}
      {processing && (
        <div className="flex items-center gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" style={{ color: C.amber }} />
          Analysing photo... extracting encoding.
        </div>
      )}
    </div>
  );
}

function NotifTab({ toast }: any) {
  const [prefs, setPrefs] = useState({
    drop80: true, drop75: true, start: true, ending: true, weekly: false,
  });
  const items = [
    { key: "drop80", title: "My attendance drops below 80%", desc: "Early warning when you approach threshold" },
    { key: "drop75", title: "My attendance drops below 75%", desc: "Critical alert when you cross threshold", locked: true },
    { key: "start", title: "A new attendance session starts", desc: "Get notified when lecturer opens a session" },
    { key: "ending", title: "A session is ending soon", desc: "Reminder before a live session closes" },
    { key: "weekly", title: "Weekly attendance summary every Monday", desc: "Recap of the previous week" },
  ];
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Email Notification Preferences</h3>
      <div className="space-y-3">
        {items.map(it => {
          const v = (prefs as any)[it.key];
          return (
            <div key={it.key} className="rounded-lg p-3 flex items-start gap-3"
              style={{ background: C.raised }}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium flex items-center gap-2">
                  {it.title}
                  {it.locked && <Lock size={12} style={{ color: C.textSec }} />}
                </div>
                <div className="text-xs mt-0.5" style={{ color: C.textSec }}>{it.desc}</div>
                {it.locked && (
                  <div className="text-[11px] mt-1" style={{ color: C.textMuted }}>Required by institution policy</div>
                )}
              </div>
              <button onClick={() => !it.locked && setPrefs(p => ({ ...p, [it.key]: !v }))}
                className="relative rounded-full transition flex-shrink-0"
                style={{
                  width: 40, height: 22, background: v ? C.amber : C.borderStrong,
                  opacity: it.locked ? 0.7 : 1, cursor: it.locked ? "not-allowed" : "pointer",
                }}>
                <span className="absolute top-0.5 rounded-full transition-all" style={{
                  width: 18, height: 18, background: "#fff",
                  left: v ? 20 : 2,
                }} />
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-xs" style={{ color: C.textSec }}>
        Critical threshold alerts cannot be disabled as per institution policy.
      </p>
      <Btn primary onClick={() => toast("success", "Preferences saved.")}>Save Preferences</Btn>
    </div>
  );
}

/* ============================== ATOMS ============================== */
const inputStyle: React.CSSProperties = {
  background: C.bg, border: `1px solid ${C.borderStrong}`, borderRadius: 8,
  padding: "12px 14px", color: C.text, outline: "none",
  fontSize: 14, minHeight: 48, fontFamily: "inherit",
};

function Card({ children, className = "" }: any) {
  return (
    <div className={`rounded-xl overflow-hidden ${className}`}
      style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      {children}
    </div>
  );
}

function Btn({ children, primary, ghost, danger, block, disabled, onClick }: any) {
  let style: React.CSSProperties = {
    padding: "10px 16px", borderRadius: 8, fontWeight: 600, fontSize: 14,
    transition: "all .15s ease", cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1, minHeight: 44,
    fontFamily: "inherit",
  };
  if (primary) style = { ...style, background: C.amber, color: "#0F1623" };
  else if (danger) style = { ...style, background: C.red, color: "#fff" };
  else if (ghost) style = { ...style, background: "transparent", color: C.textSec };
  else style = { ...style, background: "transparent", color: C.text, border: `1px solid ${C.borderStrong}` };
  return (
    <button onClick={onClick} disabled={disabled} style={style}
      className={`${block ? "w-full" : ""} hover:opacity-90`}>
      {children}
    </button>
  );
}

function Field({ label, right, children }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium" style={{ color: C.textSec }}>{label}</label>
        {right}
      </div>
      {children}
    </div>
  );
}

function Banner({ type, children, className = "" }: any) {
  const map: any = {
    success: { bg: "rgba(16,185,129,0.1)", bd: "rgba(16,185,129,0.3)", fg: C.green },
    error: { bg: "rgba(239,68,68,0.1)", bd: "rgba(239,68,68,0.3)", fg: C.red },
    warning: { bg: "rgba(245,158,11,0.1)", bd: "rgba(245,158,11,0.3)", fg: C.amber },
    info: { bg: "rgba(59,130,246,0.1)", bd: "rgba(59,130,246,0.3)", fg: C.blue },
  };
  const m = map[type];
  return (
    <div className={`rounded-lg px-3 py-2.5 text-sm ${className}`}
      style={{ background: m.bg, border: `1px solid ${m.bd}`, color: m.fg }}>
      {children}
    </div>
  );
}

function Tag({ children }: any) {
  return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
    style={{ background: C.raised, color: C.textSec }}>{children}</span>;
}

function StatusBadge({ status }: any) {
  const map: any = {
    present: { bg: "rgba(16,185,129,0.15)", fg: C.green, dot: C.green, label: "Present" },
    absent: { bg: "rgba(239,68,68,0.15)", fg: C.red, dot: C.red, label: "Absent" },
    override: { bg: "rgba(245,158,11,0.15)", fg: C.amber, dot: C.amber, label: "Override" },
    good: { bg: "rgba(16,185,129,0.15)", fg: C.green, dot: C.green, label: "Good Standing" },
    atrisk: { bg: "rgba(245,158,11,0.15)", fg: C.amber, dot: C.amber, label: "At Risk" },
    defaulter: { bg: "rgba(239,68,68,0.15)", fg: C.red, dot: C.red, label: "Defaulter" },
  };
  const m = map[status] || map.present;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full"
      style={{ background: m.bg, color: m.fg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}

function MethodIcon({ method, status }: any) {
  if (status === "absent") {
    return (
      <div className="rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ width: 36, height: 36, background: "rgba(239,68,68,0.15)" }}>
        <XCircle size={18} style={{ color: C.red }} />
      </div>
    );
  }
  const isFace = method === "face";
  const color = isFace ? C.purple : C.blue;
  const Icon = isFace ? ScanFace : QrCode;
  return (
    <div className="rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ width: 36, height: 36, background: `${color}25` }}>
      <Icon size={18} style={{ color }} />
    </div>
  );
}

function MethodLabel({ method, inline }: any) {
  if (!method) return <span style={{ color: C.textMuted }}>—</span>;
  const isFace = method === "face";
  const color = isFace ? C.purple : C.blue;
  const Icon = isFace ? ScanFace : QrCode;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${inline ? "" : ""}`}
      style={{ color }}>
      <Icon size={14} /> {isFace ? "Face Scan" : "QR Code"}
    </span>
  );
}

function Ring({ percent, color, size = 80 }: any) {
  const r = (size - 8) / 2;
  const cir = 2 * Math.PI * r;
  const off = cir - (percent / 100) * cir;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.raised} strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={cir} strokeDashoffset={off} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset .6s ease" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-semibold"
        style={{ color, fontSize: size * 0.22 }}>{percent}%</div>
    </div>
  );
}

function Row({ label, children }: any) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span style={{ color: C.textSec }}>{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

function SuccessCheck() {
  return (
    <div className="mx-auto rounded-full flex items-center justify-center"
      style={{ width: 96, height: 96, background: "rgba(16,185,129,0.15)" }}>
      <svg width={56} height={56} viewBox="0 0 52 52">
        <circle cx="26" cy="26" r="24" fill="none" stroke={C.green} strokeWidth={3}
          strokeDasharray={152} className="drawCheck" />
        <path d="M14 27 L23 36 L40 18" fill="none" stroke={C.green} strokeWidth={4}
          strokeLinecap="round" strokeLinejoin="round"
          className="drawCheck" style={{ animationDelay: ".3s" }} />
      </svg>
    </div>
  );
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  const map: any = {
    success: { bg: "rgba(16,185,129,0.95)", icon: CheckCircle2 },
    error: { bg: "rgba(239,68,68,0.95)", icon: XCircle },
    info: { bg: "rgba(59,130,246,0.95)", icon: Info },
    warning: { bg: "rgba(245,158,11,0.95)", icon: AlertTriangle },
  };
  return (
    <div className="fixed z-50 bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm space-y-2 pointer-events-none">
      {toasts.map(t => {
        const m = map[t.type];
        const Icon = m.icon;
        return (
          <div key={t.id} className="rounded-lg px-3 py-2.5 flex items-center gap-2 text-sm font-medium fadeIn shadow-xl pointer-events-auto"
            style={{ background: m.bg, color: "#fff" }}>
            <Icon size={18} /> {t.msg}
          </div>
        );
      })}
    </div>
  );
}

function ConfirmModal({ title, body, confirmLabel, danger, onCancel, onConfirm }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60"
      onClick={onCancel}>
      <div onClick={e => e.stopPropagation()}
        className="w-full md:max-w-md rounded-t-2xl md:rounded-2xl slideUp md:fadeIn"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div className="md:hidden flex justify-center pt-2">
          <div className="w-10 h-1 rounded-full" style={{ background: C.borderStrong }} />
        </div>
        <div className="p-5">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm mt-1" style={{ color: C.textSec }}>{body}</p>
          <div className="mt-5 flex gap-2 justify-end">
            <Btn ghost onClick={onCancel}>Cancel</Btn>
            {danger ? <Btn danger onClick={onConfirm}>{confirmLabel}</Btn> : <Btn primary onClick={onConfirm}>{confirmLabel}</Btn>}
          </div>
        </div>
      </div>
    </div>
  );
}
