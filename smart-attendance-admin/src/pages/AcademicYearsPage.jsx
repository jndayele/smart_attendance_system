import React, { useState, useEffect } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import SlideOver from '@/components/ui-custom/SlideOver';
import ConfirmModal from '@/components/ui-custom/ConfirmModal';
import { useToast } from '@/components/ui-custom/ToastProvider';
import { Plus, Calendar, CheckCircle, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { academicYearsAPI } from '@/api/api';
import { useSocketRefresh } from '@/hooks/useSocketRefresh';

// ─── Date-based semester status ───────────────────────────────────────────────
function getSemesterStatus(sem) {
  if (sem.is_closed) return 'Closed';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = sem.start_date ? new Date(sem.start_date) : null;
  const end = sem.end_date ? new Date(sem.end_date) : null;

  if (!start && !end) {
    // No dates set — fall back to is_active flag
    return sem.is_active ? 'Active' : 'Not Configured';
  }
  if (start && end) {
    if (today >= start && today <= end) return 'Active';
    if (today < start) return 'Upcoming';
    return 'Ended';
  }
  return sem.is_active ? 'Active' : 'Upcoming';
}

const STATUS_STYLES = {
  Active:          { bg: 'rgba(16,185,129,0.12)',  color: '#10B981' },
  Upcoming:        { bg: 'rgba(59,130,246,0.12)',  color: '#3B82F6' },
  Closed:          { bg: 'rgba(239,68,68,0.12)',   color: '#EF4444' },
  Ended:           { bg: 'rgba(107,114,128,0.12)', color: '#6B7280' },
  'Not Configured':{ bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES['Not Configured'];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
      {status}
    </span>
  );
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Empty semester form ───────────────────────────────────────────────────────
const emptySem = () => ({ start: '', end: '' });

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function AcademicYearsPage() {
  const { addToast } = useToast();
  const [years, setYears] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Academic Year slide-over
  const [slideOpen, setSlideOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ yearLabel: '', numSems: 2, semesters: [emptySem(), emptySem()], setActive: false });
  const [formErrors, setFormErrors] = useState({});

  // Edit Semester slide-over
  const [editSemSlide, setEditSemSlide] = useState(false);
  const [editSemTarget, setEditSemTarget] = useState(null); // { yearId, sem }
  const [editSemForm, setEditSemForm] = useState({ name: '', start: '', end: '' });
  const [isEditingSem, setIsEditingSem] = useState(false);

  // Close semester confirm modal
  const [closeModal, setCloseModal] = useState(null); // { yearId, semId, semName }
  const [isClosing, setIsClosing] = useState(false);

  // Edit Academic Year slide-over
  const [editYearSlide, setEditYearSlide] = useState(false);
  const [editYearTarget, setEditYearTarget] = useState(null); // full year object
  const [editYearForm, setEditYearForm] = useState({ yearLabel: '', numSems: 2, semesters: [] });
  const [isEditingYear, setIsEditingYear] = useState(false);
  const [editYearErrors, setEditYearErrors] = useState({});

  // Delete Academic Year confirm modal
  const [deleteYearModal, setDeleteYearModal] = useState(null); // year object
  const [isDeletingYear, setIsDeletingYear] = useState(false);

  const fetchYears = async () => {
    try {
      setIsLoading(true);
      const res = await academicYearsAPI.list();
      setYears(res.academic_years || []);
    } catch (err) {
      addToast(err.message || 'Failed to load academic years', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Hooks after declaration to avoid temporal dead zone
  useEffect(() => { fetchYears(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useSocketRefresh(fetchYears);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const activeYear = years.find(y => y.is_active);
  const activeSem = activeYear?.semesters?.find(s => getSemesterStatus(s) === 'Active');

  // ── Create Academic Year ─────────────────────────────────────────────────────
  const openCreate = () => {
    const noYears = years.length === 0;
    setForm({ yearLabel: '', numSems: 2, semesters: [emptySem(), emptySem()], setActive: noYears });
    setFormErrors({});
    setSlideOpen(true);
  };

  const handleNumSemsChange = (n) => {
    const sems = Array.from({ length: n }, (_, i) => form.semesters[i] || emptySem());
    setForm(p => ({ ...p, numSems: n, semesters: sems }));
  };

  const updateSemField = (idx, key, val) => {
    const sems = [...form.semesters];
    sems[idx] = { ...sems[idx], [key]: val };
    setForm(p => ({ ...p, semesters: sems }));
  };

  const handleCreate = async () => {
    const e = {};
    if (!form.yearLabel.trim()) {
      e.yearLabel = 'Required';
    } else if (!/^\d{4}\/\d{4}$/.test(form.yearLabel.trim())) {
      e.yearLabel = 'Format must be YYYY/YYYY';
    } else {
      const [y1, y2] = form.yearLabel.split('/').map(Number);
      if (y2 !== y1 + 1) e.yearLabel = 'Second year must equal first + 1';
    }
    setFormErrors(e);
    if (Object.keys(e).length) return;

    setIsSaving(true);
    try {
      // 1. Create the academic year
      const yearRes = await academicYearsAPI.create({
        year_label: form.yearLabel.trim(),
        set_as_active: form.setActive,
      });
      const yearId = yearRes.id;

      // 2. Create each semester
      const semSlice = form.semesters.slice(0, form.numSems);
      for (let i = 0; i < semSlice.length; i++) {
        const s = semSlice[i];
        await academicYearsAPI.createSemester(yearId, {
          academic_year_id: yearId,
          name: `Semester ${i + 1}`,
          start_date: s.start || null,
          end_date: s.end || null,
        });
      }

      addToast('Academic year created successfully', 'success');
      setSlideOpen(false);
      fetchYears();
    } catch (err) {
      addToast(err.message || 'Failed to create academic year', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Edit Semester ────────────────────────────────────────────────────────────
  const openEditSem = (yearId, sem) => {
    setEditSemTarget({ yearId, semId: sem.id });
    setEditSemForm({
      name: sem.name,
      start: sem.start_date || '',
      end: sem.end_date || '',
    });
    setEditSemSlide(true);
  };

  const handleEditSem = async () => {
    if (!editSemTarget) return;
    setIsEditingSem(true);
    try {
      await academicYearsAPI.updateSemester(editSemTarget.yearId, editSemTarget.semId, {
        name: editSemForm.name,
        start_date: editSemForm.start || null,
        end_date: editSemForm.end || null,
      });
      addToast('Semester updated', 'success');
      setEditSemSlide(false);
      fetchYears();
    } catch (err) {
      addToast(err.message || 'Failed to update semester', 'error');
    } finally {
      setIsEditingSem(false);
    }
  };

  // ── Close Semester ───────────────────────────────────────────────────────────
  const handleClose = async () => {
    if (!closeModal) return;
    setIsClosing(true);
    try {
      await academicYearsAPI.closeSemester(closeModal.yearId, closeModal.semId);
      addToast(`${closeModal.semName} has been closed`, 'success');
      setCloseModal(null);
      fetchYears();
    } catch (err) {
      addToast(err.message || 'Failed to close semester', 'error');
    } finally {
      setIsClosing(false);
    }
  };

  // ── Edit Academic Year ────────────────────────────────────────────────────────
  const openEditYear = (year) => {
    setEditYearTarget(year);
    setEditYearErrors({});
    // Pre-fill form with existing data
    const existingSems = (year.semesters || []).map(s => ({
      id: s.id, // existing semester — will be edited via PATCH
      name: s.name,
      start: s.start_date || '',
      end: s.end_date || '',
      is_closed: s.is_closed,
      isNew: false,
    }));
    setEditYearForm({
      yearLabel: year.year_label,
      numSems: existingSems.length,
      semesters: existingSems,
    });
    setEditYearSlide(true);
  };

  const addSemesterToEdit = () => {
    const currentCount = editYearForm.semesters.length;
    if (currentCount >= 3) { addToast('Maximum 3 semesters per year', 'info'); return; }
    setEditYearForm(p => ({
      ...p,
      semesters: [...p.semesters, { id: null, name: `Semester ${currentCount + 1}`, start: '', end: '', is_closed: false, isNew: true }],
      numSems: currentCount + 1,
    }));
  };

  const removeSemFromEdit = (idx) => {
    const sem = editYearForm.semesters[idx];
    if (!sem.isNew) { addToast('Existing semesters can only be deleted from the semester row actions', 'info'); return; }
    setEditYearForm(p => {
      const updated = [...p.semesters];
      updated.splice(idx, 1);
      return { ...p, semesters: updated, numSems: updated.length };
    });
  };

  const updateEditSemField = (idx, key, val) => {
    setEditYearForm(p => {
      const sems = [...p.semesters];
      sems[idx] = { ...sems[idx], [key]: val };
      return { ...p, semesters: sems };
    });
  };

  const handleEditYear = async () => {
    const e = {};
    if (!editYearForm.yearLabel.trim()) {
      e.yearLabel = 'Required';
    } else if (!/^\d{4}\/\d{4}$/.test(editYearForm.yearLabel.trim())) {
      e.yearLabel = 'Format must be YYYY/YYYY';
    } else {
      const [y1, y2] = editYearForm.yearLabel.split('/').map(Number);
      if (y2 !== y1 + 1) e.yearLabel = 'Second year must equal first + 1';
    }
    setEditYearErrors(e);
    if (Object.keys(e).length) return;

    setIsEditingYear(true);
    try {
      // 1. Update year label if changed
      if (editYearForm.yearLabel !== editYearTarget.year_label) {
        await academicYearsAPI.create({ year_label: editYearForm.yearLabel.trim(), set_as_active: editYearTarget.is_active });
      }

      // 2. Update existing semesters, create new ones
      for (const sem of editYearForm.semesters) {
        if (sem.isNew) {
          await academicYearsAPI.createSemester(editYearTarget.id, {
            academic_year_id: editYearTarget.id,
            name: sem.name,
            start_date: sem.start || null,
            end_date: sem.end || null,
          });
        } else {
          await academicYearsAPI.updateSemester(editYearTarget.id, sem.id, {
            name: sem.name,
            start_date: sem.start || null,
            end_date: sem.end || null,
          });
        }
      }

      addToast('Academic year updated', 'success');
      setEditYearSlide(false);
      fetchYears();
    } catch (err) {
      addToast(err.message || 'Failed to update academic year', 'error');
    } finally {
      setIsEditingYear(false);
    }
  };

  // ── Delete Academic Year ─────────────────────────────────────────────────────
  const handleDeleteYear = async () => {
    if (!deleteYearModal) return;
    setIsDeletingYear(true);
    try {
      await academicYearsAPI.deleteYear(deleteYearModal.id);
      addToast(`${deleteYearModal.year_label} deleted`, 'success');
      setDeleteYearModal(null);
      fetchYears();
    } catch (err) {
      addToast(err.message || 'Failed to delete academic year', 'error');
    } finally {
      setIsDeletingYear(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <TopHeader title="Academic Years & Semesters" breadcrumbs={['Home', 'Academic Years']} />
      <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: 'var(--bg-deep)' }}>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div />
          <button onClick={openCreate} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            <Plus size={16} /> New Academic Year
          </button>
        </div>

        {/* Active year banner */}
        {activeYear && (
          <div className="rounded-xl p-4 mb-6 flex items-center gap-3" style={{ backgroundColor: 'var(--bg-surface)', border: '2px solid var(--accent-primary)' }}>
            <CheckCircle size={18} style={{ color: 'var(--accent-primary)' }} className="shrink-0" />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Current: <strong>{activeYear.year_label}</strong>
              {activeSem ? ` — ${activeSem.name} (Active)` : ' — No active semester'}
            </span>
          </div>
        )}

        {/* Body */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={48} className="animate-spin mb-4" style={{ color: 'var(--accent-primary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading academic years...</p>
          </div>
        ) : years.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Calendar size={48} style={{ color: 'var(--text-muted)' }} className="mb-4" />
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No academic years yet</p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Create your first academic year to get started.</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
              <Plus size={16} /> Create Academic Year
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {years.map(y => (
              <div key={y.id} className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                {/* Year header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Calendar size={17} style={{ color: 'var(--accent-primary)' }} />
                    <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{y.year_label}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{
                      backgroundColor: y.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.06)',
                      color: y.is_active ? '#10B981' : 'var(--text-muted)',
                    }}>
                      {y.is_active ? 'Active Year' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditYear(y)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-secondary)' }}
                    >
                      <Pencil size={12} /> Edit Year
                    </button>
                    {!y.is_active && (
                      <button
                        onClick={() => setDeleteYearModal(y)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ border: '1px solid rgba(239,68,68,0.3)', color: 'var(--accent-red)' }}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Semesters table */}
                {y.semesters && y.semesters.length > 0 ? (
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
                        {y.semesters.map(s => {
                          const status = getSemesterStatus(s);
                          return (
                            <tr key={s.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                              <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</td>
                              <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{formatDate(s.start_date)}</td>
                              <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{formatDate(s.end_date)}</td>
                              <td className="px-4 py-3"><StatusBadge status={status} /></td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {/* Edit button — always available */}
                                  {!s.is_closed && (
                                    <button
                                      onClick={() => openEditSem(y.id, s)}
                                      className="p-1.5 rounded hover:bg-white/5 flex items-center gap-1 text-xs"
                                      style={{ color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    >
                                      <Pencil size={12} /> Edit
                                    </button>
                                  )}
                                  {/* Close button — only for Active semesters */}
                                  {status === 'Active' && (
                                    <button
                                      onClick={() => setCloseModal({ yearId: y.id, semId: s.id, semName: s.name })}
                                      className="text-xs font-medium px-3 py-1 rounded"
                                      style={{ color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.3)' }}
                                    >
                                      Close
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No semesters found for this year.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Create Academic Year SlideOver ─────────────────────────────────── */}
      <SlideOver open={slideOpen} onClose={() => setSlideOpen(false)} title="New Academic Year">
        <div className="space-y-5">
          {/* Year label */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Academic Year <span style={{ color: 'var(--accent-red)' }}>*</span>
            </label>
            <input
              type="text"
              value={form.yearLabel}
              onChange={e => { setForm(p => ({ ...p, yearLabel: e.target.value })); setFormErrors(p => ({ ...p, yearLabel: '' })); }}
              placeholder="e.g. 2025/2026"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-deep)', border: formErrors.yearLabel ? '1px solid var(--accent-red)' : '1px solid var(--border-input)', color: 'var(--text-primary)' }}
            />
            {formErrors.yearLabel && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{formErrors.yearLabel}</p>}
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Format: YYYY/YYYY — e.g. 2025/2026</p>
          </div>

          {/* Number of semesters */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Number of Semesters</label>
            <div className="flex gap-3">
              {[2, 3].map(n => (
                <button key={n} onClick={() => handleNumSemsChange(n)} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{
                  backgroundColor: form.numSems === n ? 'var(--accent-primary)' : 'transparent',
                  color: form.numSems === n ? 'var(--bg-deep)' : 'var(--text-secondary)',
                  border: form.numSems === n ? 'none' : '1px solid rgba(255,255,255,0.15)',
                }}>
                  {n} Semesters
                </button>
              ))}
            </div>
          </div>

          {/* Semester date inputs */}
          {form.semesters.slice(0, form.numSems).map((s, i) => (
            <div key={i} className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-subtle)' }}>
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Semester {i + 1}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Start Date</label>
                  <input
                    type="date"
                    value={s.start}
                    onChange={e => updateSemField(i, 'start', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>End Date</label>
                  <input
                    type="date"
                    value={s.end}
                    onChange={e => updateSemField(i, 'end', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Set as active toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setForm(p => ({ ...p, setActive: !p.setActive }))}
              className="w-10 h-5 rounded-full relative transition-colors"
              style={{ backgroundColor: form.setActive ? 'var(--accent-primary)' : 'var(--bg-raised)' }}
            >
              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: form.setActive ? '22px' : '2px' }} />
            </button>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Set as active year</span>
            {years.length === 0 && <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981' }}>Required for first year</span>}
          </div>
        </div>

        <div className="flex gap-3 mt-8 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={() => setSlideOpen(false)} disabled={isSaving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
            Cancel
          </button>
          <button onClick={handleCreate} disabled={isSaving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            {isSaving && <Loader2 size={15} className="animate-spin" />}
            Create Year
          </button>
        </div>
      </SlideOver>

      {/* ─── Edit Semester SlideOver ─────────────────────────────────────────── */}
      <SlideOver open={editSemSlide} onClose={() => setEditSemSlide(false)} title="Edit Semester">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Semester Name</label>
            <input
              type="text"
              value={editSemForm.name}
              onChange={e => setEditSemForm(p => ({ ...p, name: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Start Date</label>
            <input
              type="date"
              value={editSemForm.start}
              onChange={e => setEditSemForm(p => ({ ...p, start: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>End Date</label>
            <input
              type="date"
              value={editSemForm.end}
              onChange={e => setEditSemForm(p => ({ ...p, end: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
            />
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
              Status is determined automatically based on these dates.
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-8 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={() => setEditSemSlide(false)} disabled={isEditingSem} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
            Cancel
          </button>
          <button onClick={handleEditSem} disabled={isEditingSem} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            {isEditingSem && <Loader2 size={15} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </SlideOver>

      {/* ─── Edit Academic Year SlideOver ─────────────────────────────────── */}
      <SlideOver open={editYearSlide} onClose={() => setEditYearSlide(false)} title="Edit Academic Year">
        <div className="space-y-5">
          {/* Year label */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Academic Year *</label>
            <input
              type="text"
              value={editYearForm.yearLabel}
              onChange={e => { setEditYearForm(p => ({ ...p, yearLabel: e.target.value })); setEditYearErrors(p => ({ ...p, yearLabel: '' })); }}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-deep)', border: editYearErrors.yearLabel ? '1px solid var(--accent-red)' : '1px solid var(--border-input)', color: 'var(--text-primary)' }}
            />
            {editYearErrors.yearLabel && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{editYearErrors.yearLabel}</p>}
          </div>

          {/* Semester list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Semesters ({editYearForm.semesters.length})</label>
              {editYearForm.semesters.length < 3 && (
                <button onClick={addSemesterToEdit} className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--accent-primary)' }}>
                  <Plus size={12} /> Add Semester
                </button>
              )}
            </div>
            <div className="space-y-3">
              {editYearForm.semesters.map((s, i) => (
                <div key={i} className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={s.name}
                        disabled={s.is_closed}
                        onChange={e => updateEditSemField(i, 'name', e.target.value)}
                        className="px-2.5 py-1 rounded text-xs font-semibold outline-none"
                        style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', width: '130px' }}
                      />
                      {s.is_closed && <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>Closed</span>}
                      {s.isNew && <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981' }}>New</span>}
                    </div>
                    {s.isNew && (
                      <button onClick={() => removeSemFromEdit(i)} className="p-1 rounded hover:bg-red-500/10" style={{ color: 'var(--accent-red)' }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Start Date</label>
                      <input
                        type="date"
                        value={s.start}
                        disabled={s.is_closed}
                        onChange={e => updateEditSemField(i, 'start', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none disabled:opacity-50"
                        style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>End Date</label>
                      <input
                        type="date"
                        value={s.end}
                        disabled={s.is_closed}
                        onChange={e => updateEditSemField(i, 'end', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none disabled:opacity-50"
                        style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={() => setEditYearSlide(false)} disabled={isEditingYear} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>Cancel</button>
          <button onClick={handleEditYear} disabled={isEditingYear} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            {isEditingYear && <Loader2 size={15} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </SlideOver>

      {/* ─── Close Semester Confirm ──────────────────────────────────────────── */}
      <ConfirmModal
        open={!!closeModal}
        onClose={() => setCloseModal(null)}
        onConfirm={handleClose}
        title="Close Semester"
        message={`You are about to close "${closeModal?.semName}". This will archive all attendance records for this semester. This action cannot be undone.`}
        confirmText={isClosing ? 'Closing...' : 'Close Semester'}
        danger
      />

      {/* ─── Delete Academic Year Confirm ────────────────────────────────────── */}
      <ConfirmModal
        open={!!deleteYearModal}
        onClose={() => setDeleteYearModal(null)}
        onConfirm={handleDeleteYear}
        title="Delete Academic Year"
        message={`You are about to permanently delete the academic year "${deleteYearModal?.year_label}" and all its semesters. This cannot be undone.`}
        confirmText={isDeletingYear ? 'Deleting...' : 'Delete Year'}
        danger
      />

    </div>
  );
}