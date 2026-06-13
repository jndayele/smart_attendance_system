import React, { useState } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import SlideOver from '@/components/ui-custom/SlideOver';
import { useToast } from '@/components/ui-custom/ToastProvider';
import { Plus, Pencil, Trash2, GraduationCap } from 'lucide-react';

const deptOptions = ['DCS', 'DEE', 'DCE', 'DBA', 'DPH'];

const initialData = [
  { id: 1, name: 'BSc Computer Science', code: 'BSCS', dept: 'DCS', duration: 4, students: 312, status: 'Active' },
  { id: 2, name: 'BSc Electrical Engineering', code: 'BSEE', dept: 'DEE', duration: 4, students: 245, status: 'Active' },
  { id: 3, name: 'BSc Civil Engineering', code: 'BSCE', dept: 'DCE', duration: 4, students: 198, status: 'Active' },
  { id: 4, name: 'BBA Business Administration', code: 'BBA', dept: 'DBA', duration: 3, students: 178, status: 'Active' },
  { id: 5, name: 'BSc Pharmacy', code: 'BSPH', dept: 'DPH', duration: 4, students: 103, status: 'Active' },
];

const emptyForm = { name: '', code: '', dept: 'DCS', duration: 4, status: 'Active' };

export default function ProgrammesPage() {
  const { addToast } = useToast();
  const [data, setData] = useState(initialData);
  const [slideOpen, setSlideOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [filterDept, setFilterDept] = useState('');

  const urlParams = new URLSearchParams(window.location.search);
  const deptParam = urlParams.get('dept');

  const filtered = data.filter(d => {
    const dept = filterDept || deptParam;
    return dept ? d.dept === dept : true;
  });

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setErrors({}); setSlideOpen(true); };
  const openEdit = (d) => { setEditItem(d); setForm({ name: d.name, code: d.code, dept: d.dept, duration: d.duration, status: d.status }); setErrors({}); setSlideOpen(true); };

  const getLevels = (dur) => Array.from({ length: dur }, (_, i) => `L${(i + 1) * 100}`);

  const handleSave = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.code.trim()) e.code = 'Required';
    setErrors(e);
    if (Object.keys(e).length) return;

    if (editItem) {
      setData(prev => prev.map(d => d.id === editItem.id ? { ...d, ...form, code: form.code.toUpperCase() } : d));
      addToast('Programme updated', 'success');
    } else {
      setData(prev => [...prev, { id: Date.now(), ...form, code: form.code.toUpperCase(), students: 0 }]);
      addToast('Programme created', 'success');
    }
    setSlideOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      <TopHeader title="Programmes" breadcrumbs={['Home', 'Programmes']} />
      <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: 'var(--bg-deep)' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <select value={filterDept || deptParam || ''} onChange={e => setFilterDept(e.target.value)} className="px-3 py-2 rounded-lg text-sm appearance-none" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
              <option value="">All Departments</option>
              {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button onClick={openAdd} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            <Plus size={16} /> Add Programme
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <GraduationCap size={48} style={{ color: 'var(--text-muted)' }} className="mb-4" />
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No programmes found</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Create a programme to get started.</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-raised)' }}>
                  {['Programme', 'Code', 'Department', 'Duration', 'Levels', 'Students', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-medium px-5 py-3" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={d.id} className={`transition-colors hover:bg-white/[0.02] ${i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="px-5 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{d.name}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{d.code}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{d.dept}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{d.duration} years</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {getLevels(d.duration).map(l => (
                          <span key={l} className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>{l}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{d.students}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs" style={{
                        backgroundColor: d.status === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.06)',
                        color: d.status === 'Active' ? '#10B981' : 'var(--text-muted)',
                      }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.status === 'Active' ? '#10B981' : 'var(--text-muted)' }} />
                        {d.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(d)} className="p-1.5 rounded hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}><Pencil size={14} /></button>
                        <button onClick={() => { setData(p => p.filter(x => x.id !== d.id)); addToast('Programme deleted', 'success'); }} className="p-1.5 rounded hover:bg-white/5" style={{ color: 'var(--accent-red)' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SlideOver open={slideOpen} onClose={() => setSlideOpen(false)} title={editItem ? 'Edit Programme' : 'Add Programme'}>
        <div className="space-y-4">
          <FormField label="Programme Name" value={form.name} onChange={v => { setForm(p => ({ ...p, name: v })); setErrors(p => ({ ...p, name: '' })); }} error={errors.name} required />
          <FormField label="Programme Code" value={form.code} onChange={v => { setForm(p => ({ ...p, code: v.toUpperCase() })); setErrors(p => ({ ...p, code: '' })); }} error={errors.code} required />
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Department *</label>
            <select value={form.dept} onChange={e => setForm(p => ({ ...p, dept: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}>
              {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Duration in Years *</label>
            <input type="number" min={1} max={6} value={form.duration} onChange={e => setForm(p => ({ ...p, duration: parseInt(e.target.value) || 1 }))} className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
            {form.duration > 0 && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Levels: {getLevels(form.duration).join(', ')}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-3 mt-8 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={() => setSlideOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>Cancel</button>
          <button onClick={handleSave} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            {editItem ? 'Save Changes' : 'Save Programme'}
          </button>
        </div>
      </SlideOver>
    </div>
  );
}

function FormField({ label, value, onChange, error, required }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label} {required && <span style={{ color: 'var(--accent-red)' }}>*</span>}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: 'var(--bg-deep)', border: error ? '1px solid var(--accent-red)' : '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
      {error && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{error}</p>}
    </div>
  );
}