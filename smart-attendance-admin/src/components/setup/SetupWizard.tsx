import React, { useState, type CSSProperties } from "react";
import { GraduationCap, Check, ArrowRight, Image as ImageIcon, ChevronRight, Upload, Plus, Info, AlertCircle } from "lucide-react";
import { C, Setup } from "../AdminApp";

export default function SetupWizard({ initial, onComplete }: { initial: Setup; onComplete: (s: Setup) => void }) {
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
                <input value={s.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. University of Technology" style={inputStyle} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSec }}>Short code *</label>
                  <input value={s.shortCode} onChange={(e) => update("shortCode", e.target.value.toUpperCase())} placeholder="e.g. UOT" maxLength={10} style={inputStyle} />
                  <div className="text-[10px] mt-1" style={{ color: C.textMuted }}>Shown in the sidebar and on login.</div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSec }}>Tagline</label>
                  <input value={s.tagline} onChange={(e) => update("tagline", e.target.value)} placeholder="e.g. Smart Attendance · Admin" style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSec }}>Country</label>
                  <input value={s.country} onChange={(e) => update("country", e.target.value)} placeholder="e.g. Ghana" style={inputStyle} />
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
                  <input value={s.adminName} onChange={(e) => update("adminName", e.target.value)} placeholder="e.g. System Admin" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSec }}>Email address *</label>
                  <input type="email" value={s.adminEmail} onChange={(e) => update("adminEmail", e.target.value)} placeholder="e.g. admin@university.edu" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSec }}>Active academic year</label>
                  <input value={s.academicYear} onChange={(e) => update("academicYear", e.target.value)} placeholder="e.g. 2024/2025" style={inputStyle} />
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
