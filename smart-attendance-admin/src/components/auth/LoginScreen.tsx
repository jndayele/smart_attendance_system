import React, { useState, type CSSProperties } from "react";
import { GraduationCap, Mail, KeyRound, EyeOff, Eye as EyeIcon, AlertCircle, RefreshCw, ArrowRight, Info } from "lucide-react";
import { C, Setup } from "../AdminApp";

export default function LoginScreen({ onLogin, setup }: { onLogin: (email: string) => void; setup?: Setup }) {
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
