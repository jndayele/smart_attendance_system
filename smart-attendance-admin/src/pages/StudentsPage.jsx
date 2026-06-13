import React, { useState } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import SlideOver from '@/components/ui-custom/SlideOver';
import { useToast } from '@/components/ui-custom/ToastProvider';
import { Plus, Search, Upload, Download, Pencil, Trash2, Eye, UserCheck, RotateCcw, Info, AlertTriangle, CheckCircle, Clock, X, FileText } from 'lucide-react';

const initialStudents = [
  { id: 1, name: 'Kwame Asante', sid: 'STU-0001', programme: 'BSCS', level: 'L300', email: 'k.asante@stu.edu', status: 'Active', invitation: 'Registered', attendance: 68 },
  { id: 2, name: 'Ama Boateng', sid: 'STU-0002', programme: 'BSCS', level: 'L300', email: 'a.boateng@stu.edu', status: 'Active', invitation: 'Registered', attendance: 82 },
  { id: 3, name: 'Kofi Mensah', sid: 'STU-0003', programme: 'BSEE', level: 'L200', email: 'k.mensah@stu.edu', status: 'Active', invitation: 'Pending', attendance: null },
  { id: 4, name: 'Akua Darko', sid: 'STU-0004', programme: 'BBA', level: 'L200', email: 'a.darko@stu.edu', status: 'Active', invitation: 'Registered', attendance: 71 },
  { id: 5, name: 'Yaw Frimpong', sid: 'STU-0005', programme: 'BSPH', level: 'L300', email: 'y.frimpong@stu.edu', status: 'Active', invitation: 'Expired', attendance: null },
  { id: 6, name: 'Abena Owusu', sid: 'STU-0006', programme: 'BSCE', level: 'L300', email: 'a.owusu@stu.edu', status: 'Active', invitation: 'Registered', attendance: 90 },
  { id: 7, name: 'Kweku Boateng', sid: 'STU-0007', programme: 'BSCS', level: 'L400', email: 'k.boateng@stu.edu', status: 'Active', invitation: 'Registered', attendance: 55 },
  { id: 8, name: 'Adwoa Asiedu', sid: 'STU-0008', programme: 'BBA', level: 'L200', email: 'a.asiedu@stu.edu', status: 'Active', invitation: 'Registered', attendance: 74 },
];

const progOptions = ['BSCS', 'BSEE', 'BSCE', 'BBA', 'BSPH'];
const levelOptions = ['L100', 'L200', 'L300', 'L400'];
const deptOptions = ['DCS', 'DEE', 'DCE', 'DBA', 'DPH'];

export default function StudentsPage() {
  const { addToast } = useToast();
  const [students, setStudents] = useState(initialStudents);
  const [slideOpen, setSlideOpen] = useState(false);
  const [slideType, setSlideType] = useState('add');
  const [profileItem, setProfileItem] = useState(null);
  const [bulkStep, setBulkStep] = useState(0);
  const [search, setSearch] = useState('');
  const [fProg, setFProg] = useState('');
  const [fLevel, setFLevel] = useState('');
  const [form, setForm] = useState({ name: '', sid: '', email: '', dept: 'DCS', programme: 'BSCS', level: 'L100', semEntry: 'Semester 1' });
  const [overrideForm, setOverrideForm] = useState({ course: '', session: '', status: 'Present', reason: '' });
  const [errors, setErrors] = useState({});

  const filtered = students.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.sid.toLowerCase().includes(search.toLowerCase())) return false;
    if (fProg && s.programme !== fProg) return false;
    if (fLevel && s.level !== fLevel) return false;
    return true;
  });

  const openAdd = () => { setSlideType('add'); setForm({ name: '', sid: '', email: '', dept: 'DCS', programme: 'BSCS', level: 'L100', semEntry: 'Semester 1' }); setErrors({}); setSlideOpen(true); };
  const openBulk = () => { setSlideType('bulk'); setBulkStep(1); setSlideOpen(true); };
  const openOverride = (s) => { setSlideType('override'); setOverrideForm({ course: '', session: '', status: 'Present', reason: '' }); setProfileItem(s); setSlideOpen(true); };
  const openProfile = (s) => { setSlideType('profile'); setProfileItem(s); setSlideOpen(true); };

  const handleAddStudent = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.sid.trim()) e.sid = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    setErrors(e);
    if (Object.keys(e).length) return;
    setStudents(prev => [...prev, { id: Date.now(), name: form.name, sid: form.sid, programme: form.programme, level: form.level, email: form.email, status: 'Active', invitation: 'Pending', attendance: null }]);
    addToast('Student added & invite sent', 'success');
    setSlideOpen(false);
  };

  const getInvBadge = (inv) => {
    const map = { Registered: { color: '#10B981', icon: CheckCircle }, Pending: { color: '#F59E0B', icon: Clock }, Expired: { color: '#EF4444', icon: X } };
    const m = map[inv];
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: `${m.color}15`, color: m.color }}>
        <m.icon size={12} /> {inv}
      </span>
    );
  };

  const getAttColor = (att) => {
    if (att === null) return 'var(--text-muted)';
    if (att >= 75) return '#10B981';
    if (att >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col h-full">
      <TopHeader title="Students" breadcrumbs={['Home', 'Students']} />
      <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: 'var(--bg-deep)' }}>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or ID..." className="pl-9 pr-3 py-2 rounded-lg text-sm w-56" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
            </div>
            <select value={fProg} onChange={e => setFProg(e.target.value)} className="px-3 py-2 rounded-lg text-sm appearance-none" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
              <option value="">Programme</option>
              {progOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <select value={fLevel} onChange={e => setFLevel(e.target.value)} className="px-3 py-2 rounded-lg text-sm appearance-none" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
              <option value="">Level</option>
              {levelOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={openBulk} className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
              <Upload size={14} /> Bulk Import
            </button>
            <button onClick={openAdd} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
              <Plus size={16} /> Add Student
            </button>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-raised)' }}>
                  {['Name', 'Student ID', 'Programme', 'Level', 'Email', 'Status', 'Invitation', 'Attendance', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-medium px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} className={`transition-colors hover:bg-white/[0.02] ${i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                          {getInitials(s.name)}
                        </div>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.sid}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.programme}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.level}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }} /> Active
                      </span>
                    </td>
                    <td className="px-4 py-3">{getInvBadge(s.invitation)}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium" style={{ color: getAttColor(s.attendance) }}>
                        {s.attendance !== null ? `${s.attendance}%` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openProfile(s)} className="p-1.5 rounded hover:bg-white/5" style={{ color: 'var(--text-secondary)' }} title="View Profile"><Eye size={14} /></button>
                        <button onClick={() => openOverride(s)} className="p-1.5 rounded hover:bg-white/5" style={{ color: 'var(--accent-primary)' }} title="Override"><Pencil size={14} /></button>
                        {s.invitation === 'Expired' && (
                          <button onClick={() => addToast('Invite resent', 'success')} className="p-1.5 rounded hover:bg-white/5" style={{ color: '#F59E0B' }} title="Resend Invite"><RotateCcw size={14} /></button>
                        )}
                        <button onClick={() => { setStudents(p => p.filter(x => x.id !== s.id)); addToast('Student removed', 'success'); }} className="p-1.5 rounded hover:bg-white/5" style={{ color: 'var(--accent-red)' }} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Student slide-over */}
      <SlideOver open={slideOpen && slideType === 'add'} onClose={() => setSlideOpen(false)} title="Add Student" subtitle="Register a new student">
        <div className="space-y-4">
          <SField label="Full Name" value={form.name} onChange={v => { setForm(p => ({ ...p, name: v })); setErrors(p => ({ ...p, name: '' })); }} error={errors.name} required />
          <SField label="Student ID Number" value={form.sid} onChange={v => { setForm(p => ({ ...p, sid: v })); setErrors(p => ({ ...p, sid: '' })); }} error={errors.sid} required />
          <SField label="Official Email" value={form.email} onChange={v => { setForm(p => ({ ...p, email: v })); setErrors(p => ({ ...p, email: '' })); }} error={errors.email} required />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Department *</label>
              <select value={form.dept} onChange={e => setForm(p => ({ ...p, dept: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}>
                {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Programme *</label>
              <select value={form.programme} onChange={e => setForm(p => ({ ...p, programme: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}>
                {progOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Level / Year *</label>
              <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}>
                {levelOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Semester of Entry</label>
              <select value={form.semEntry} onChange={e => setForm(p => ({ ...p, semEntry: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}>
                <option>Semester 1</option><option>Semester 2</option>
              </select>
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-lg" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <Info size={14} className="shrink-0 mt-0.5" style={{ color: '#3B82F6' }} />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Student will receive a registration email valid for 48 hours.</p>
          </div>
        </div>
        <div className="flex gap-3 mt-8 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={() => setSlideOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>Cancel</button>
          <button onClick={handleAddStudent} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>Add Student & Send Invite</button>
        </div>
      </SlideOver>

      {/* Bulk Import slide-over */}
      <SlideOver open={slideOpen && slideType === 'bulk'} onClose={() => setSlideOpen(false)} title="Bulk Import Students">
        {bulkStep === 1 && (
          <div className="space-y-4">
            <div className="rounded-xl p-8 flex flex-col items-center justify-center" style={{ border: '2px dashed var(--border-input)', backgroundColor: 'var(--bg-deep)' }}>
              <Upload size={32} style={{ color: 'var(--text-muted)' }} className="mb-3" />
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Drop your file here</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>CSV or Excel files accepted</p>
            </div>
            <button className="w-full px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
              <Download size={14} /> Download Template
            </button>
            <button onClick={() => setBulkStep(2)} className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>Next</button>
          </div>
        )}
        {bulkStep === 2 && (
          <div className="space-y-4">
            <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: 'var(--accent-green)' }}>142 valid rows</span>
                <span className="text-sm font-medium" style={{ color: 'var(--accent-red)' }}>3 errors</span>
              </div>
              <div className="space-y-1">
                <p className="text-xs" style={{ color: 'var(--accent-red)' }}>Row 14: Missing email address</p>
                <p className="text-xs" style={{ color: 'var(--accent-red)' }}>Row 67: Invalid student ID format</p>
                <p className="text-xs" style={{ color: 'var(--accent-red)' }}>Row 98: Duplicate entry</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setBulkStep(1)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>Back</button>
              <button onClick={() => setBulkStep(3)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>Confirm Import</button>
            </div>
          </div>
        )}
        {bulkStep === 3 && (
          <div className="text-center py-8">
            <CheckCircle size={48} style={{ color: 'var(--accent-green)' }} className="mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Import Complete</p>
            <p className="text-sm mb-1" style={{ color: 'var(--accent-green)' }}>142 students created</p>
            <p className="text-sm mb-4" style={{ color: 'var(--accent-red)' }}>3 failed</p>
            <button className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 mx-auto" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
              <FileText size={14} /> Download Error Log
            </button>
          </div>
        )}
      </SlideOver>

      {/* Override slide-over */}
      <SlideOver open={slideOpen && slideType === 'override'} onClose={() => setSlideOpen(false)} title="Manual Attendance Override" subtitle={profileItem?.name}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Select Course *</label>
            <select value={overrideForm.course} onChange={e => setOverrideForm(p => ({ ...p, course: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}>
              <option value="">Select...</option>
              <option value="CS301">CS301 — Database Systems</option>
              <option value="CS401">CS401 — Algorithms</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Select Session *</label>
            <select value={overrideForm.session} onChange={e => setOverrideForm(p => ({ ...p, session: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}>
              <option value="">Select...</option>
              <option value="s1">Dec 18 — 10:00 AM</option>
              <option value="s2">Dec 17 — 2:00 PM</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Override Status</label>
            <div className="flex gap-3">
              {['Present', 'Absent'].map(s => (
                <button key={s} onClick={() => setOverrideForm(p => ({ ...p, status: s }))} className="px-4 py-2 rounded-lg text-sm font-medium" style={{
                  backgroundColor: overrideForm.status === s ? (s === 'Present' ? '#10B981' : '#EF4444') : 'transparent',
                  color: overrideForm.status === s ? '#fff' : 'var(--text-secondary)',
                  border: overrideForm.status === s ? 'none' : '1px solid rgba(255,255,255,0.15)',
                }}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Reason *</label>
            <textarea value={overrideForm.reason} onChange={e => setOverrideForm(p => ({ ...p, reason: e.target.value }))} rows={3} className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none resize-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-lg" style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>This action is logged in the audit trail.</p>
          </div>
        </div>
        <div className="flex gap-3 mt-8 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={() => setSlideOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>Cancel</button>
          <button onClick={() => { addToast('Attendance override submitted', 'success'); setSlideOpen(false); }} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>Submit Override</button>
        </div>
      </SlideOver>

      {/* Profile slide-over */}
      <SlideOver open={slideOpen && slideType === 'profile'} onClose={() => setSlideOpen(false)} title={profileItem?.name} subtitle={`${profileItem?.sid} · ${profileItem?.programme} · ${profileItem?.level}`}>
        {profileItem && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-semibold" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                {getInitials(profileItem.name)}
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{profileItem.name}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{profileItem.email}</p>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Enrolled Courses</h4>
              <div className="space-y-3">
                {[
                  { name: 'CS301 — Database Systems', att: 68 },
                  { name: 'CS401 — Algorithms', att: 55 },
                  { name: 'CS302 — Software Engineering', att: 82 },
                ].map((c, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                      <span className="text-xs font-medium" style={{ color: getAttColor(c.att) }}>{c.att}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-deep)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${c.att}%`, backgroundColor: getAttColor(c.att) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Account Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Registration</span><span style={{ color: 'var(--text-primary)' }}>Sep 12, 2024</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Last Login</span><span style={{ color: 'var(--text-primary)' }}>Today, 9:15 AM</span></div>
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}

function SField({ label, value, onChange, error, required }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label} {required && <span style={{ color: 'var(--accent-red)' }}>*</span>}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: 'var(--bg-deep)', border: error ? '1px solid var(--accent-red)' : '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
      {error && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{error}</p>}
    </div>
  );
}