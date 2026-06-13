import React, { useState } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import SlideOver from '@/components/ui-custom/SlideOver';
import ConfirmModal from '@/components/ui-custom/ConfirmModal';
import { useToast } from '@/components/ui-custom/ToastProvider';
import { useAppConfig } from '@/context/AppContext';
import { Plus, Calendar, CheckCircle } from 'lucide-react';

const initialYears = [
  {
    id: 1, year: '2024/2025', status: 'Active',
    semesters: [
      { name: 'Semester 1', start: '2024-09-01', end: '2025-01-15', status: 'Active' },
      { name: 'Semester 2', start: '2025-02-01', end: '2025-06-15', status: 'Upcoming' },
    ],
  },
  {
    id: 2, year: '2023/2024', status: 'Archived',
    semesters: [
      { name: 'Semester 1', start: '2023-09-01', end: '2024-01-15', status: 'Closed' },
      { name: 'Semester 2', start: '2024-02-01', end: '2024-06-15', status: 'Closed' },
    ],
  },
];

export default function AcademicYearsPage() {
  const { config } = useAppConfig();
  const { addToast } = useToast();
  const [years, setYears] = useState(initialYears);
  const [slideOpen, setSlideOpen] = useState(false);
  const [closeModal, setCloseModal] = useState(null);
  const [form, setForm] = useState({ year: '', numSems: 2, semesters: [{ start: '', end: '' }, { start: '', end: '' }], setActive: false });

  const activeYear = years.find(y => y.status === 'Active');

  const openAdd = () => {
    setForm({ year: '', numSems: 2, semesters: [{ start: '', end: '' }, { start: '', end: '' }], setActive: false });
    setSlideOpen(true);
  };

  const handleCreate = () => {
    if (!form.year.trim()) { addToast('Please enter academic year', 'error'); return; }
    const newYear = {
      id: Date.now(),
      year: form.year,
      status: form.setActive ? 'Active' : 'Upcoming',
      semesters: form.semesters.slice(0, form.numSems).map((s, i) => ({
        name: `Semester ${i + 1}`,
        start: s.start || '-',
        end: s.end || '-',
        status: form.setActive && i === 0 ? 'Active' : 'Upcoming',
      })),
    };
    if (form.setActive) {
      setYears(prev => prev.map(y => ({ ...y, status: y.status === 'Active' ? 'Archived' : y.status })));
    }
    setYears(prev => [...prev, newYear]);
    addToast('Academic year created', 'success');
    setSlideOpen(false);
  };

  const handleCloseSemester = () => {
    setYears(prev => prev.map(y => ({
      ...y,
      semesters: y.semesters.map(s => s === closeModal ? { ...s, status: 'Closed' } : s),
    })));
    addToast('Semester closed', 'success');
    setCloseModal(null);
  };

  return (
    <div className="flex flex-col h-full">
      <TopHeader title="Academic Years & Semesters" breadcrumbs={['Home', 'Academic Years']} />
      <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: 'var(--bg-deep)' }}>
        <div className="flex items-center justify-between mb-6">
          <div />
          <button onClick={openAdd} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            <Plus size={16} /> New Academic Year
          </button>
        </div>

        {/* Active year banner */}
        {activeYear && (
          <div className="rounded-xl p-5 mb-6 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-surface)', border: '2px solid var(--accent-primary)' }}>
            <div className="flex items-center gap-3">
              <CheckCircle size={20} style={{ color: 'var(--accent-primary)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Current: {activeYear.year} — {activeYear.semesters.find(s => s.status === 'Active')?.name || 'No active semester'} (Active)
              </span>
            </div>
          </div>
        )}

        {/* Year cards */}
        <div className="space-y-4">
          {years.map(y => (
            <div key={y.id} className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
                  <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{y.year}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs" style={{
                    backgroundColor: y.status === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.06)',
                    color: y.status === 'Active' ? '#10B981' : 'var(--text-muted)',
                  }}>{y.status}</span>
                </div>
              </div>
              <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-raised)' }}>
                      {['Semester', 'Start Date', 'End Date', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left text-xs font-medium px-4 py-2.5" style={{ color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {y.semesters.map((s, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</td>
                        <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>{s.start}</td>
                        <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>{s.end}</td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs" style={{
                            backgroundColor: s.status === 'Active' ? 'rgba(16,185,129,0.1)' : s.status === 'Closed' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                            color: s.status === 'Active' ? '#10B981' : s.status === 'Closed' ? '#EF4444' : '#3B82F6',
                          }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.status === 'Active' ? '#10B981' : s.status === 'Closed' ? '#EF4444' : '#3B82F6' }} />
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {s.status === 'Active' && (
                            <button onClick={() => setCloseModal(s)} className="text-xs font-medium px-3 py-1 rounded" style={{ color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.3)' }}>
                              Close
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      <SlideOver open={slideOpen} onClose={() => setSlideOpen(false)} title="New Academic Year">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Academic Year *</label>
            <input type="text" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} placeholder="e.g. 2025/2026" className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Number of Semesters</label>
            <div className="flex gap-3">
              {[2, 3].map(n => (
                <button key={n} onClick={() => {
                  const sems = Array.from({ length: n }, () => ({ start: '', end: '' }));
                  setForm(p => ({ ...p, numSems: n, semesters: sems }));
                }} className="px-4 py-2 rounded-lg text-sm font-medium" style={{
                  backgroundColor: form.numSems === n ? 'var(--accent-primary)' : 'transparent',
                  color: form.numSems === n ? 'var(--bg-deep)' : 'var(--text-secondary)',
                  border: form.numSems === n ? 'none' : '1px solid rgba(255,255,255,0.15)',
                }}>{n} Semesters</button>
              ))}
            </div>
          </div>
          {form.semesters.slice(0, form.numSems).map((s, i) => (
            <div key={i} className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-subtle)' }}>
              <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Semester {i + 1}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Start Date</label>
                  <input type="date" value={s.start} onChange={e => { const sems = [...form.semesters]; sems[i] = { ...sems[i], start: e.target.value }; setForm(p => ({ ...p, semesters: sems })); }} className="w-full px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>End Date</label>
                  <input type="date" value={s.end} onChange={e => { const sems = [...form.semesters]; sems[i] = { ...sems[i], end: e.target.value }; setForm(p => ({ ...p, semesters: sems })); }} className="w-full px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <button onClick={() => setForm(p => ({ ...p, setActive: !p.setActive }))} className="w-10 h-5 rounded-full relative transition-colors" style={{ backgroundColor: form.setActive ? 'var(--accent-primary)' : 'var(--bg-raised)' }}>
              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: form.setActive ? '22px' : '2px' }} />
            </button>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Set as active year</span>
          </div>
        </div>
        <div className="flex gap-3 mt-8 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={() => setSlideOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>Cancel</button>
          <button onClick={handleCreate} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>Create</button>
        </div>
      </SlideOver>

      <ConfirmModal open={!!closeModal} onClose={() => setCloseModal(null)} onConfirm={handleCloseSemester} title="Close Semester" message="Closing this semester will archive all attendance data for this period. This cannot be undone. Type CONFIRM to proceed." confirmText="Close Semester" danger requireType />
    </div>
  );
}