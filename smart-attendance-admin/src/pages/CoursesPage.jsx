import React, { useState } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import SlideOver from '@/components/ui-custom/SlideOver';
import { useToast } from '@/components/ui-custom/ToastProvider';
import { Plus, Pencil, Trash2, BookOpen, Search, Info } from 'lucide-react';

const initialCourses = [
  { id: 1, title: 'Database Systems', code: 'CS301', programme: 'BSCS', level: 'L300', semester: 'Sem 1', credits: 3, lecturer: 'Dr. Ama Owusu', threshold: 75, status: 'Active' },
  { id: 2, title: 'Digital Circuits', code: 'EE201', programme: 'BSEE', level: 'L200', semester: 'Sem 1', credits: 3, lecturer: 'Dr. Kofi Asante', threshold: 75, status: 'Active' },
  { id: 3, title: 'Fluid Mechanics', code: 'CE301', programme: 'BSCE', level: 'L300', semester: 'Sem 2', credits: 3, lecturer: 'Prof. Akosua Mensah', threshold: 75, status: 'Active' },
  { id: 4, title: 'Marketing Management', code: 'BA201', programme: 'BBA', level: 'L200', semester: 'Sem 1', credits: 2, lecturer: 'Dr. Yaw Darko', threshold: 70, status: 'Active' },
  { id: 5, title: 'Organic Chemistry', code: 'PH301', programme: 'BSPH', level: 'L300', semester: 'Sem 1', credits: 3, lecturer: 'Dr. Abena Frimpong', threshold: 75, status: 'Active' },
  { id: 6, title: 'Algorithms', code: 'CS401', programme: 'BSCS', level: 'L400', semester: 'Sem 1', credits: 3, lecturer: 'Dr. Kweku Boateng', threshold: 80, status: 'Active' },
];

const progOptions = ['BSCS', 'BSEE', 'BSCE', 'BBA', 'BSPH'];
const levelOptions = ['L100', 'L200', 'L300', 'L400'];
const lecturers = ['Dr. Ama Owusu', 'Dr. Kofi Asante', 'Prof. Akosua Mensah', 'Dr. Yaw Darko', 'Dr. Abena Frimpong', 'Dr. Kweku Boateng'];

export default function CoursesPage() {
  const { addToast } = useToast();
  const [courses, setCourses] = useState(initialCourses);
  const [slideOpen, setSlideOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [fProg, setFProg] = useState('');
  const [fLevel, setFLevel] = useState('');
  const [fSem, setFSem] = useState('');
  const [form, setForm] = useState({ title: '', code: '', programme: 'BSCS', level: 'L100', semester: 'Sem 1', credits: 3, lecturer: '', threshold: 75, status: 'Active' });
  const [errors, setErrors] = useState({});

  const filtered = courses.filter(c => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (fProg && c.programme !== fProg) return false;
    if (fLevel && c.level !== fLevel) return false;
    if (fSem && c.semester !== fSem) return false;
    return true;
  });

  const openAdd = () => { setEditItem(null); setForm({ title: '', code: '', programme: 'BSCS', level: 'L100', semester: 'Sem 1', credits: 3, lecturer: '', threshold: 75, status: 'Active' }); setErrors({}); setSlideOpen(true); };
  const openEdit = (c) => { setEditItem(c); setForm({ title: c.title, code: c.code, programme: c.programme, level: c.level, semester: c.semester, credits: c.credits, lecturer: c.lecturer, threshold: c.threshold, status: c.status }); setErrors({}); setSlideOpen(true); };

  const handleSave = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Required';
    if (!form.code.trim()) e.code = 'Required';
    setErrors(e);
    if (Object.keys(e).length) return;

    if (editItem) {
      setCourses(prev => prev.map(c => c.id === editItem.id ? { ...c, ...form, code: form.code.toUpperCase() } : c));
      addToast('Course updated', 'success');
    } else {
      setCourses(prev => [...prev, { id: Date.now(), ...form, code: form.code.toUpperCase() }]);
      addToast('Course created', 'success');
    }
    setSlideOpen(false);
  };

  const getThresholdColor = (t) => t >= 75 ? '#10B981' : t >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <div className="flex flex-col h-full">
      <TopHeader title="Courses" breadcrumbs={['Home', 'Courses']} />
      <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: 'var(--bg-deep)' }}>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..." className="pl-9 pr-3 py-2 rounded-lg text-sm w-56" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
            </div>
            {[
              { val: fProg, set: setFProg, opts: progOptions, placeholder: 'Programme' },
              { val: fLevel, set: setFLevel, opts: levelOptions, placeholder: 'Level' },
              { val: fSem, set: setFSem, opts: ['Sem 1', 'Sem 2'], placeholder: 'Semester' },
            ].map(f => (
              <select key={f.placeholder} value={f.val} onChange={e => f.set(e.target.value)} className="px-3 py-2 rounded-lg text-sm appearance-none" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                <option value="">{f.placeholder}</option>
                {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ))}
          </div>
          <button onClick={openAdd} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            <Plus size={16} /> Add Course
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BookOpen size={48} style={{ color: 'var(--text-muted)' }} className="mb-4" />
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No courses found</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-raised)' }}>
                    {['Course Title', 'Code', 'Programme', 'Level', 'Semester', 'Credits', 'Lecturer', 'Threshold', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-medium px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={c.id} className={`transition-colors hover:bg-white/[0.02] ${i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{c.title}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{c.code}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{c.programme}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{c.level}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{c.semester}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{c.credits}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{c.lecturer}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${getThresholdColor(c.threshold)}15`, color: getThresholdColor(c.threshold) }}>{c.threshold}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }} /> Active
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}><Pencil size={14} /></button>
                          <button onClick={() => { setCourses(p => p.filter(x => x.id !== c.id)); addToast('Course deleted', 'success'); }} className="p-1.5 rounded hover:bg-white/5" style={{ color: 'var(--accent-red)' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <SlideOver open={slideOpen} onClose={() => setSlideOpen(false)} title={editItem ? 'Edit Course' : 'Add Course'}>
        <div className="space-y-4">
          <SField label="Course Title" value={form.title} onChange={v => { setForm(p => ({ ...p, title: v })); setErrors(p => ({ ...p, title: '' })); }} error={errors.title} required />
          <SField label="Course Code" value={form.code} onChange={v => { setForm(p => ({ ...p, code: v.toUpperCase() })); setErrors(p => ({ ...p, code: '' })); }} error={errors.code} required />
          <div className="grid grid-cols-2 gap-4">
            <SSelect label="Programme" value={form.programme} onChange={v => setForm(p => ({ ...p, programme: v }))} options={progOptions} required />
            <SSelect label="Level / Year" value={form.level} onChange={v => setForm(p => ({ ...p, level: v }))} options={levelOptions} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SSelect label="Semester" value={form.semester} onChange={v => setForm(p => ({ ...p, semester: v }))} options={['Sem 1', 'Sem 2']} required />
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Credit Hours *</label>
              <input type="number" min={1} max={6} value={form.credits} onChange={e => setForm(p => ({ ...p, credits: parseInt(e.target.value) || 1 }))} className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <SSelect label="Assigned Lecturer" value={form.lecturer} onChange={v => setForm(p => ({ ...p, lecturer: v }))} options={lecturers} />
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Min. Attendance Threshold %</label>
            <input type="number" min={50} max={100} value={form.threshold} onChange={e => setForm(p => ({ ...p, threshold: parseInt(e.target.value) || 75 }))} className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-lg" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <Info size={14} className="shrink-0 mt-0.5" style={{ color: '#3B82F6' }} />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>All students in this programme and level will be automatically enrolled.</p>
          </div>
        </div>
        <div className="flex gap-3 mt-8 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={() => setSlideOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>Cancel</button>
          <button onClick={handleSave} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            {editItem ? 'Save Changes' : 'Create Course'}
          </button>
        </div>
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

function SSelect({ label, value, onChange, options, required }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label} {required && <span style={{ color: 'var(--accent-red)' }}>*</span>}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}>
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}