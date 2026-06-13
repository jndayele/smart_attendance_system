import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppConfig } from '@/context/AppContext';
import { authAPI } from '@/api/api';
import { GraduationCap, Check, ChevronRight, Upload, Plus, Info, AlertTriangle, Pencil, Loader2 } from 'lucide-react';

const TIMEZONES = [
  'Africa/Accra',
  'Africa/Lagos',
  'Africa/Cairo',
  'Africa/Nairobi',
  'Africa/Johannesburg',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

// Display labels for the dropdown (keeps the raw tz value clean for the backend)
const TIMEZONE_LABELS = {
  'Africa/Accra': 'Africa/Accra (GMT+0)',
  'Africa/Lagos': 'Africa/Lagos (GMT+1)',
  'Africa/Cairo': 'Africa/Cairo (GMT+2)',
  'Africa/Nairobi': 'Africa/Nairobi (GMT+3)',
  'Africa/Johannesburg': 'Africa/Johannesburg (GMT+2)',
  'Europe/London': 'Europe/London (GMT+0)',
  'Europe/Paris': 'Europe/Paris (GMT+1)',
  'Europe/Berlin': 'Europe/Berlin (GMT+1)',
  'America/New_York': 'America/New_York (GMT-5)',
  'America/Chicago': 'America/Chicago (GMT-6)',
  'America/Denver': 'America/Denver (GMT-7)',
  'America/Los_Angeles': 'America/Los_Angeles (GMT-8)',
  'Asia/Dubai': 'Asia/Dubai (GMT+4)',
  'Asia/Kolkata': 'Asia/Kolkata (GMT+5:30)',
  'Asia/Singapore': 'Asia/Singapore (GMT+8)',
  'Asia/Tokyo': 'Asia/Tokyo (GMT+9)',
  'Australia/Sydney': 'Australia/Sydney (GMT+11)',
};

const COLOR_PRESETS = [
  '#F59E0B', '#3B82F6', '#10B981', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
];

export default function SetupPage() {
  const navigate = useNavigate();
  const { setupComplete } = useAppConfig();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);
  const logoFileRef = useRef(null); // holds the actual File object for upload
  const [customHex, setCustomHex] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const [form, setForm] = useState({
    institutionName: '',
    shortCode: '',
    tagline: '',
    country: '',
    timezone: 'Africa/Accra',
    logoUrl: '',      // preview data-URL only
    accentColor: '#F59E0B',
    adminName: '',
    adminEmail: '',
    academicYear: '',
    currentSemester: 'Semester 1',
  });

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validateStep = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.institutionName.trim()) e.institutionName = 'Required';
      if (!form.shortCode.trim()) e.shortCode = 'Required';
      else if (form.shortCode.length < 2 || form.shortCode.length > 20) e.shortCode = '2–20 characters';
      if (!form.tagline.trim()) e.tagline = 'Required';
      if (!form.country.trim()) e.country = 'Required';
      if (!form.timezone) e.timezone = 'Required';
    } else if (s === 3) {
      if (!form.adminName.trim()) e.adminName = 'Required';
      if (!form.adminEmail.trim()) e.adminEmail = 'Required';
      else if (!/\S+@\S+\.\S+/.test(form.adminEmail)) e.adminEmail = 'Invalid email';
      if (!form.academicYear.trim()) e.academicYear = 'Required';
      else {
        const match = form.academicYear.match(/^(\d{4})\/(\d{4})$/);
        if (!match) e.academicYear = 'Format: YYYY/YYYY';
        else if (parseInt(match[2]) !== parseInt(match[1]) + 1) e.academicYear = 'Second year must equal first + 1';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (!validateStep(step)) return;
    setStep(prev => prev + 1);
  };

  const handleFinish = async () => {
    setSubmitError('');
    setLoading(true);

    try {
      // Build multipart FormData — backend expects Form fields not JSON
      const formData = new FormData();
      formData.append('institution_name', form.institutionName.trim());
      formData.append('shortcode', form.shortCode.trim().toUpperCase());
      formData.append('tagline', form.tagline.trim());
      formData.append('country', form.country.trim());
      formData.append('timezone', form.timezone);           // raw tz identifier
      formData.append('accent_color', form.accentColor);
      formData.append('admin_name', form.adminName.trim());
      formData.append('admin_email', form.adminEmail.trim().toLowerCase());
      formData.append('academic_year', form.academicYear.trim());
      formData.append('current_semester', form.currentSemester);

      // Attach logo file if selected
      if (logoFileRef.current) {
        formData.append('logo', logoFileRef.current);
      }

      await authAPI.setup(formData);

      // Mark setup done in context, then redirect to login
      setupComplete();
      navigate('/login');
    } catch (err) {
      setSubmitError(err.message || 'Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErrors({ logo: 'Max 5 MB' }); return; }
    logoFileRef.current = file; // keep File object for FormData
    const reader = new FileReader();
    reader.onload = (ev) => updateField('logoUrl', ev.target.result); // preview only
    reader.readAsDataURL(file);
  };

  const handlePreviewColor = () => {
    document.documentElement.style.setProperty('--accent-primary', form.accentColor);
  };

  const displayShortCode = step >= 2 ? form.shortCode : '';



  const steps = [
    { num: 1, label: 'Institution' },
    { num: 2, label: 'Branding' },
    { num: 3, label: 'Administrator' },
    { num: 4, label: 'Review' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10" style={{ backgroundColor: 'var(--bg-deep)' }}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <GraduationCap size={28} style={{ color: 'var(--accent-primary)' }} />
          <span className="font-heading text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {displayShortCode || <span style={{ color: 'var(--text-muted)' }}>Your Institution</span>}
          </span>
        </div>
        <p className="text-[10px] font-semibold tracking-[0.25em] uppercase" style={{ color: 'var(--text-muted)' }}>
          Smart Attendance · First-Time Setup
        </p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <React.Fragment key={s.num}>
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{
                  backgroundColor: step > s.num ? 'var(--accent-green)' : step === s.num ? 'var(--accent-primary)' : 'transparent',
                  border: step >= s.num ? 'none' : '1px solid var(--text-muted)',
                  color: step > s.num ? '#fff' : step === s.num ? 'var(--bg-deep)' : 'var(--text-muted)',
                }}
              >
                {step > s.num ? <Check size={14} /> : s.num}
              </div>
              <span className="text-xs font-medium hidden sm:inline" style={{ color: step >= s.num ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl rounded-xl p-8" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--accent-primary)' }}>
          Step {step} of 4
        </p>

        {step === 1 && (
          <>
            <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Tell us about your institution</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>This appears across the admin panel, reports, and notifications.</p>
            <div className="space-y-4">
              <InputField label="Full institution name" name="institutionName" placeholder="e.g. University of Technology" required form={form} errors={errors} updateField={updateField} />
              <div className="flex gap-4">
                <InputField label="Short code" name="shortCode" placeholder="e.g. UOT" helper="2–20 characters · shown in the sidebar and on login." half required form={form} errors={errors} updateField={updateField} />
                <InputField label="Tagline" name="tagline" placeholder="e.g. Excellence in Education" half required form={form} errors={errors} updateField={updateField} />
              </div>
              <div className="flex gap-4">
                <InputField label="Country" name="country" placeholder="e.g. Ghana" half required form={form} errors={errors} updateField={updateField} />
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Timezone <span style={{ color: 'var(--accent-red)' }}>*</span>
                  </label>
                  <select
                    value={form.timezone}
                    onChange={e => updateField('timezone', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none appearance-none"
                    style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz} value={tz}>{TIMEZONE_LABELS[tz] || tz}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Branding</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Upload a logo and pick an accent color for the admin panel.</p>

            {/* Logo upload */}
            <div className="mb-8">
              <label className="block text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Institution Logo</label>
              <div className="flex items-center gap-5">
                <div
                  className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                  style={{ border: '2px dashed var(--border-input)', backgroundColor: 'var(--bg-deep)' }}
                >
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Upload size={24} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>
                <div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors hover:bg-white/5"
                    style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}
                  >
                    <Upload size={14} /> Upload logo
                  </button>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>PNG, JPG, or SVG. Max 5 MB. Square works best.</p>
                  {errors.logo && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{errors.logo}</p>}
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
                </div>
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Accent Color</label>
              <div className="flex items-center gap-3 flex-wrap mb-4">
                {COLOR_PRESETS.map(color => (
                  <button
                    key={color}
                    onClick={() => updateField('accentColor', color)}
                    className="w-11 h-11 rounded-full transition-transform hover:scale-110 relative"
                    style={{ backgroundColor: color, border: form.accentColor === color ? '3px solid var(--text-primary)' : '3px solid transparent' }}
                  >
                    {form.accentColor === color && <Check size={16} className="absolute inset-0 m-auto" style={{ color: '#fff' }} />}
                  </button>
                ))}
                <button
                  onClick={() => setShowCustom(!showCustom)}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ border: '2px dashed var(--border-input)' }}
                >
                  <Plus size={16} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
              {showCustom && (
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="text"
                    value={customHex}
                    onChange={e => setCustomHex(e.target.value)}
                    placeholder="#RRGGBB"
                    className="w-32 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                  />
                  <button
                    onClick={() => { if (/^#[0-9A-Fa-f]{6}$/.test(customHex)) updateField('accentColor', customHex); }}
                    className="px-3 py-2 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}
                  >
                    Apply
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: form.accentColor }} />
                <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>{form.accentColor}</span>
                <button
                  onClick={handlePreviewColor}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}
                >
                  Preview
                </button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Create the primary administrator</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>This account owns institution-wide settings and audit access.</p>
            <div className="space-y-4">
              <div className="flex gap-4">
                <InputField label="Full name" name="adminName" placeholder="e.g. System Admin" half required form={form} errors={errors} updateField={updateField} />
                <InputField label="Email address" name="adminEmail" placeholder="e.g. admin@university.edu" half required form={form} errors={errors} updateField={updateField} />
              </div>
              <div className="flex gap-4">
                <InputField label="Active academic year" name="academicYear" placeholder="e.g. 2024/2025" helper="Format: YYYY/YYYY · second year must equal first + 1" half required form={form} errors={errors} updateField={updateField} />
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Current semester <span style={{ color: 'var(--accent-red)' }}>*</span>
                  </label>
                  <select
                    value={form.currentSemester}
                    onChange={e => updateField('currentSemester', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none appearance-none"
                    style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                  >
                    <option>Semester 1</option>
                    <option>Semester 2</option>
                  </select>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Info size={18} className="shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  An email containing your auto-generated password will be sent to the email address above once setup is complete. Please double-check your email address before proceeding.
                </p>
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Review and finish</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>You can change any of these later in Settings.</p>
            <div className="space-y-4">
              <ReviewCard title="Institution Details" onEdit={() => setStep(1)} items={[
                ['Name', form.institutionName],
                ['Short Code', form.shortCode.toUpperCase()],
                ['Tagline', form.tagline],
                ['Country', form.country],
                ['Timezone', TIMEZONE_LABELS[form.timezone] || form.timezone],
              ]} />
              <ReviewCard title="Branding" onEdit={() => setStep(2)} items={[
                ['Logo', form.logoUrl ? 'Uploaded ✓' : 'No logo uploaded'],
                ['Accent Color', form.accentColor],
              ]} colorPreview={form.accentColor} logoPreview={form.logoUrl} />
              <ReviewCard title="Administrator" onEdit={() => setStep(3)} items={[
                ['Name', form.adminName],
                ['Email', form.adminEmail],
                ['Academic Year', form.academicYear],
                ['Semester', form.currentSemester],
              ]} />
              <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Your auto-generated admin password will be emailed to <strong style={{ color: 'var(--text-primary)' }}>{form.adminEmail}</strong>. Make sure this address is correct before finishing setup.
                </p>
              </div>
              {submitError && (
                <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <p className="text-sm" style={{ color: 'var(--accent-red)' }}>{submitError}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer buttons */}
        <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1 || loading}
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30"
            style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}
          >
            Back
          </button>
          {step < 4 ? (
            <button
              onClick={handleContinue}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-60"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Setting up...</>
              ) : (
                <>Finish Setup <ChevronRight size={16} /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ title, onEdit, items, colorPreview, logoPreview }) {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{title}</h4>
        <button onClick={onEdit} className="text-xs font-medium flex items-center gap-1 hover:underline" style={{ color: 'var(--accent-primary)' }}>
          <Pencil size={12} /> Edit
        </button>
      </div>
      <div className="space-y-2">
        {items.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</span>
            <div className="flex items-center gap-2">
              {label === 'Accent Color' && colorPreview && <div className="w-4 h-4 rounded" style={{ backgroundColor: colorPreview }} />}
              {label === 'Logo' && logoPreview && <img src={logoPreview} alt="Logo" className="w-6 h-6 rounded object-cover" />}
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InputField({ label, name, placeholder, helper, half, type = 'text', required, form, errors, updateField }) {
  return (
    <div className={half ? 'flex-1' : 'w-full'}>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {label} {required && <span style={{ color: 'var(--accent-red)' }}>*</span>}
      </label>
      <input
        type={type}
        value={form[name]}
        onChange={e => updateField(name, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all"
        style={{
          backgroundColor: 'var(--bg-deep)',
          border: errors[name] ? '1px solid var(--accent-red)' : '1px solid var(--border-input)',
          color: 'var(--text-primary)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
        onBlur={e => e.target.style.borderColor = errors[name] ? 'var(--accent-red)' : 'var(--border-input)'}
      />
      {errors[name] && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{errors[name]}</p>}
      {helper && !errors[name] && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{helper}</p>}
    </div>
  );
}