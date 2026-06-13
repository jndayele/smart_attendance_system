import React, { useState } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import SlideOver from '@/components/ui-custom/SlideOver';
import { useToast } from '@/components/ui-custom/ToastProvider';
import { Plus, Search, BookOpen, Clock, MoreHorizontal, Pencil, Trash2, ShieldOff, ShieldCheck, KeyRound, Info } from 'lucide-react';

const initialLecturers = [
  { id: 1, name: 'Dr. Ama Owusu', staffId: 'EMP-001', dept: 'DCS', status: 'Active', courses: 3, sessions: 24, email: 'a.owusu@uni.edu' },
  { id: 2, name: 'Dr. Kofi Asante', staffId: 'EMP-002', dept: 'DEE', status: 'Active', courses: 2, sessions: 18, email: 'k.asante@uni.edu' },
  { id: 3, name: 'Prof. Akosua Mensah', staffId: 'EMP-003', dept: 'DCE', status: 'Active', courses: 2, sessions: 20, email: 'a.mensah@uni.edu' },
  { id: 4, name: 'Dr. Yaw Darko', staffId: 'EMP-004', dept: 'DBA', status: 'Active', courses: 2, sessions: 15, email: 'y.darko@uni.edu' },
  { id: 5, name: 'Dr. Abena Frimpong', staffId: 'EMP-005', dept: 'DPH', status: 'Suspended', courses: 1, sessions: 8, email: 'a.frimpong@uni.edu' },
  { id: 6, name: 'Dr. Kweku Boateng', staffId: 'EMP-006', dept: 'DCS', status: 'Active', courses: 2, sessions: 22, email: 'k.boateng@uni.edu' },
];

const deptOptions = ['DCS', 'DEE', 'DCE', 'DBA', 'DPH'];

export default function LecturersPage() {
  const { addToast } = useToast();
  const [lecturers, setLecturers] = useState(initialLecturers);
  const [slideOpen, setSlideOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [menuOpen, setMenuOpen] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', staffId: '', dept: 'DCS', phone: '' });
  const [errors, setErrors] = useState({});

  const filtered = lecturers.filter(l => {
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.staffId.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterDept && l.dept !== filterDept) return false;
    return true;
  });

  const openAdd = () => { setForm({ name: '', email: '', staffId: '', dept: 'DCS', phone: '' }); setErrors({}); setSlideOpen(true); setDetailItem(null); };

  const handleSave = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    if (!form.staffId.trim()) e.staffId = 'Required';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLecturers(prev => [...prev, { id: Date.now(), name: form.name, staffId: form.staffId, dept: form.dept, status: 'Active', courses: 0, sessions: 0, email: form.email }]);
    addToast('Lecturer added & invite sent', 'success');
    setSlideOpen(false);
  };

  const toggleStatus = (l) => {
    setLecturers(prev => prev.map(x => x.id === l.id ? { ...x, status: x.status === 'Active' ? 'Suspended' : 'Active' } : x));
    addToast(`${l.name} ${l.status === 'Active' ? 'suspended' : 'reactivated'}`, 'success');
  };

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col h-full">
      <TopHeader title="Lecturers" breadcrumbs={['Home', 'Lecturers']} />
      <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: 'var(--bg-deep)' }}>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search lecturers..." className="pl-9 pr-3 py-2 rounded-lg text-sm w-56" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
            </div>
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="px-3 py-2 rounded-lg text-sm appearance-none" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
              <option value="">All Departments</option>
              {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button onClick={openAdd} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            <Plus size={16} /> Add Lecturer
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(l => (
            <div
              key={l.id}
              className="rounded-xl p-5 transition-all hover:-translate-y-0.5 cursor-pointer relative"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
              onClick={(e) => { if (!e.target.closest('button')) { setDetailItem(l); setSlideOpen(false); } }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-semibold" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                    {getInitials(l.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{l.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{l.staffId}</p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs mt-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>{l.dept}</span>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setMenuOpen(menuOpen === l.id ? null : l.id)} className="p-1.5 rounded hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
                    <MoreHorizontal size={16} />
                  </button>
                  {menuOpen === l.id && (
                    <div className="absolute right-0 top-8 w-44 rounded-lg py-1 z-10 shadow-xl" style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
                      {[
                        { label: l.status === 'Active' ? 'Suspend' : 'Reactivate', icon: l.status === 'Active' ? ShieldOff : ShieldCheck, action: () => toggleStatus(l) },
                        { label: 'Reset Password', icon: KeyRound, action: () => addToast('Password reset email sent', 'info') },
                        { label: 'Delete', icon: Trash2, action: () => { setLecturers(p => p.filter(x => x.id !== l.id)); addToast('Lecturer removed', 'success'); }, danger: true },
                      ].map(m => (
                        <button key={m.label} onClick={() => { m.action(); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 text-left" style={{ color: m.danger ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                          <m.icon size={14} /> {m.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1"><BookOpen size={12} /> {l.courses} Courses</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {l.sessions} Sessions</span>
              </div>
              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs" style={{
                  backgroundColor: l.status === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: l.status === 'Active' ? '#10B981' : '#EF4444',
                }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: l.status === 'Active' ? '#10B981' : '#EF4444' }} />
                  {l.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Lecturer slide-over */}
      <SlideOver open={slideOpen} onClose={() => setSlideOpen(false)} title="Add Lecturer" subtitle="Invite a new lecturer to the system">
        <div className="space-y-4">
          <LField label="Full Name" value={form.name} onChange={v => { setForm(p => ({ ...p, name: v })); setErrors(p => ({ ...p, name: '' })); }} error={errors.name} required />
          <LField label="Official Email" value={form.email} onChange={v => { setForm(p => ({ ...p, email: v })); setErrors(p => ({ ...p, email: '' })); }} error={errors.email} required />
          <LField label="Staff ID Number" value={form.staffId} onChange={v => { setForm(p => ({ ...p, staffId: v })); setErrors(p => ({ ...p, staffId: '' })); }} error={errors.staffId} required />
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Department *</label>
            <select value={form.dept} onChange={e => setForm(p => ({ ...p, dept: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}>
              {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <LField label="Phone Number" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
          <div className="flex items-start gap-2.5 p-3 rounded-lg" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <Info size={14} className="shrink-0 mt-0.5" style={{ color: '#3B82F6' }} />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>An activation email will be sent to the lecturer with a link valid for 72 hours.</p>
          </div>
        </div>
        <div className="flex gap-3 mt-8 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={() => setSlideOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>Cancel</button>
          <button onClick={handleSave} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>Add Lecturer & Send Invite</button>
        </div>
      </SlideOver>

      {/* Detail panel */}
      <SlideOver open={!!detailItem} onClose={() => setDetailItem(null)} title={detailItem?.name} subtitle={`${detailItem?.staffId} · ${detailItem?.dept}`}>
        {detailItem && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-semibold" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                {getInitials(detailItem.name)}
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{detailItem.name}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{detailItem.email}</p>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs mt-1" style={{
                  backgroundColor: detailItem.status === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: detailItem.status === 'Active' ? '#10B981' : '#EF4444',
                }}>{detailItem.status}</span>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Assigned Courses</h4>
              <div className="space-y-2">
                {['CS301 — Database Systems (82%)', 'CS401 — Algorithms (76%)', 'CS201 — Data Structures (88%)'].slice(0, detailItem.courses).map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-subtle)' }}>
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{c.split('(')[0]}</span>
                    <span className="text-xs font-medium" style={{ color: 'var(--accent-primary)' }}>{c.match(/\(([^)]+)\)/)?.[1]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Recent Sessions</h4>
              <div className="space-y-2">
                {['Today, 10:00 AM — CS301', 'Yesterday, 2:00 PM — CS401', 'Dec 15, 9:00 AM — CS301', 'Dec 14, 11:00 AM — CS401', 'Dec 13, 10:00 AM — CS201'].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}

function LField({ label, value, onChange, error, required }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label} {required && <span style={{ color: 'var(--accent-red)' }}>*</span>}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: 'var(--bg-deep)', border: error ? '1px solid var(--accent-red)' : '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
      {error && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{error}</p>}
    </div>
  );
}