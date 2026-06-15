import React, { useState, useEffect } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import SlideOver from '@/components/ui-custom/SlideOver';
import ConfirmModal from '@/components/ui-custom/ConfirmModal';
import { useToast } from '@/components/ui-custom/ToastProvider';
import { Plus, Pencil, Trash2, BookOpen, Search, Info, Loader2 } from 'lucide-react';
import { coursesAPI, programmesAPI, lecturersAPI, academicYearsAPI } from '@/api/api';

const emptyForm = { title: '', code: '', programme_id: '', level: '100', semester_id: '', semester_number: 1, credits: 3, lecturer_id: '', threshold: 75, status: 'Active' };

export default function CoursesPage() {
  const { addToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [allSemesters, setAllSemesters] = useState([]); // flat list: { id, name, yearLabel }
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [slideOpen, setSlideOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [search, setSearch] = useState('');
  const [fProg, setFProg] = useState('');
  const [fLevel, setFLevel] = useState('');
  const [fSem, setFSem] = useState('');
  
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fProg, fLevel, fSem, search]);

  const fetchPrerequisites = async () => {
    try {
      const [progRes, lecRes, yearRes] = await Promise.all([
        programmesAPI.list(),
        lecturersAPI.list(),
        academicYearsAPI.list(),
      ]);
      setProgrammes(progRes.programmes || []);
      setLecturers(lecRes.lecturers || []);
      // Build flat list of all semesters across all years
      const sems = [];
      for (const yr of (yearRes.academic_years || [])) {
        for (const s of (yr.semesters || [])) {
          sems.push({ id: s.id, name: s.name, yearLabel: yr.year_label, number: s.is_active ? 1 : 2 });
        }
      }
      setAllSemesters(sems);
    } catch (err) {
      addToast('Failed to load prerequisites', 'error');
    }
  };

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (search) params.search = search;
      if (fProg) params.programme_id = fProg;
      if (fLevel) params.level = parseInt(fLevel, 10);
      if (fSem) params.semester_id = fSem; // send semester UUID to backend
      
      const data = await coursesAPI.list(params);
      
      const items = data.courses.map(c => ({
        id: c.id,
        title: c.title,
        code: c.code,
        programme_id: c.programme_id,
        programme: c.programme_code || c.programme_name,
        level: `L${c.level}`,
        levelRaw: c.level,
        semester_id: c.semester_id,
        semester_number: c.semester_number,
        semester: c.semester_id
          ? (allSemesters.find(s => s.id === c.semester_id)?.name || `Sem ${c.semester_number}`)
          : `Sem ${c.semester_number}`,
        credits: c.credit_hours,
        lecturer_id: c.lecturer_id,
        lecturer: c.lecturer_name || 'Unassigned',
        threshold: c.threshold_pct,
        status: c.is_active ? 'Active' : 'Inactive'
      }));

      setCourses(items);
    } catch (err) {
      addToast(err.message || 'Failed to fetch courses', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique levels across all programmes for the filter
  const allLevels = Array.from(new Set(programmes.flatMap(p => p.levels || []))).sort((a, b) => a - b);

  // Derive levels for the selected programme in the form
  const selectedProgramme = programmes.find(p => p.id === form.programme_id);
  const formLevels = selectedProgramme ? (selectedProgramme.levels || []) : [];

  const openAdd = () => { 
    setEditItem(null); 
    const firstProg = programmes[0];
    const firstLevel = firstProg?.levels?.[0]?.toString() || '100';
    const firstSem = allSemesters[0];
    setForm({ 
      ...emptyForm, 
      programme_id: firstProg?.id || '', 
      level: firstLevel,
      semester_id: firstSem?.id || '',
      semester_number: 1,
    }); 
    setErrors({}); 
    setSlideOpen(true); 
  };

  const openEdit = (c) => { 
    setEditItem(c); 
    setForm({ 
      title: c.title, 
      code: c.code, 
      programme_id: c.programme_id, 
      level: c.levelRaw.toString(), 
      semester_id: c.semester_id || '',
      semester_number: c.semester_number, 
      credits: c.credits, 
      lecturer_id: c.lecturer_id || '', 
      threshold: c.threshold, 
      status: c.status 
    }); 
    setErrors({}); 
    setSlideOpen(true); 
  };

  const handleSave = async () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Required';
    if (!form.code.trim()) e.code = 'Required';
    if (!form.programme_id) e.programme_id = 'Required';
    setErrors(e);
    if (Object.keys(e).length) return;

    setIsSaving(true);
    try {
      const selectedSem = allSemesters.find(s => s.id === form.semester_id);
      const payload = {
        title: form.title.trim(),
        code: form.code.trim().toUpperCase(),
        programme_id: form.programme_id,
        level: parseInt(form.level, 10),
        semester_id: form.semester_id || null,
        semester_number: selectedSem ? (allSemesters.indexOf(selectedSem) % 2) + 1 : form.semester_number,
        credit_hours: form.credits,
        threshold_pct: form.threshold,
        lecturer_id: form.lecturer_id || null,
        is_active: form.status === 'Active'
      };

      if (editItem) {
        await coursesAPI.update(editItem.id, payload);
        addToast('Course updated successfully', 'success');
      } else {
        await coursesAPI.create(payload);
        addToast('Course created successfully', 'success');
      }
      setSlideOpen(false);
      fetchCourses();
    } catch (err) {
      addToast(err.message || 'Failed to save course', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      await coursesAPI.delete(deleteModal.id);
      addToast('Course deleted', 'success');
      setDeleteModal(null);
      fetchCourses();
    } catch (err) {
      addToast(err.message || 'Failed to delete course', 'error');
    } finally {
      setIsDeleting(false);
    }
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
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..." className="pl-9 pr-3 py-2 rounded-lg text-sm w-56 outline-none" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
            </div>
            
            <select value={fProg} onChange={e => setFProg(e.target.value)} className="px-3 py-2 rounded-lg text-sm appearance-none outline-none" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
              <option value="">All Programmes</option>
              {programmes.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
            </select>

            <select value={fLevel} onChange={e => setFLevel(e.target.value)} className="px-3 py-2 rounded-lg text-sm appearance-none outline-none" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
              <option value="">All Levels</option>
              {allLevels.map(l => <option key={l} value={l}>L{l}</option>)}
            </select>

            <select value={fSem} onChange={e => setFSem(e.target.value)} className="px-3 py-2 rounded-lg text-sm appearance-none outline-none" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
              <option value="">All Semesters</option>
              {allSemesters.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.yearLabel})</option>
              ))}
            </select>
          </div>
          <button onClick={openAdd} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            <Plus size={16} /> Add Course
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={48} className="animate-spin mb-4" style={{ color: 'var(--accent-primary)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
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
                  {courses.map((c, i) => (
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
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: c.status === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.06)', color: c.status === 'Active' ? '#10B981' : 'var(--text-muted)' }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.status === 'Active' ? '#10B981' : 'var(--text-muted)' }} /> {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}><Pencil size={14} /></button>
                          <button onClick={() => setDeleteModal(c)} className="p-1.5 rounded hover:bg-white/5" style={{ color: 'var(--accent-red)' }}><Trash2 size={14} /></button>
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
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Programme *</label>
              <select 
                value={form.programme_id} 
                onChange={e => { 
                  const pId = e.target.value;
                  const prog = programmes.find(p => p.id === pId);
                  let newLevel = form.level;
                  if (prog && prog.levels && prog.levels.length > 0) {
                    if (!prog.levels.includes(parseInt(newLevel, 10))) {
                      newLevel = prog.levels[0].toString();
                    }
                  }
                  setForm(p => ({ ...p, programme_id: pId, level: newLevel })); 
                  setErrors(p => ({ ...p, programme_id: '' })); 
                }} 
                className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none outline-none" 
                style={{ backgroundColor: 'var(--bg-deep)', border: errors.programme_id ? '1px solid var(--accent-red)' : '1px solid var(--border-input)', color: 'var(--text-primary)' }}
              >
                <option value="" disabled>Select...</option>
                {programmes.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
              </select>
              {errors.programme_id && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{errors.programme_id}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Level / Year *</label>
              <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none outline-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}>
                {formLevels.map(l => <option key={l} value={l}>L{l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Semester *</label>
              <select 
                value={form.semester_id} 
                onChange={e => {
                  const sem = allSemesters.find(s => s.id === e.target.value);
                  setForm(p => ({ ...p, semester_id: e.target.value, semester_number: sem?.number || 1 }));
                }} 
                className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none outline-none" 
                style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
              >
                <option value="" disabled>Select semester...</option>
                {allSemesters.map(s => (
                  <option key={s.id} value={s.id}>{s.name} — {s.yearLabel}</option>
                ))}
              </select>
              {allSemesters.length === 0 && (
                <p className="text-xs mt-1" style={{ color: '#F59E0B' }}>No semesters found. Create an Academic Year first.</p>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Credit Hours *</label>
              <input type="number" min={1} max={6} value={form.credits} onChange={e => setForm(p => ({ ...p, credits: parseInt(e.target.value) || 1 }))} className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Assigned Lecturer</label>
            <select value={form.lecturer_id} onChange={e => setForm(p => ({ ...p, lecturer_id: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none outline-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}>
              <option value="">Unassigned</option>
              {lecturers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

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
          <button onClick={() => setSlideOpen(false)} disabled={isSaving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {editItem ? 'Save Changes' : 'Create Course'}
          </button>
        </div>
      </SlideOver>

      <ConfirmModal 
        open={!!deleteModal} 
        onClose={() => setDeleteModal(null)} 
        onConfirm={confirmDelete} 
        title="Delete Course" 
        message={`Are you sure you want to delete "${deleteModal?.title}"? This action cannot be undone.`} 
        confirmText={isDeleting ? 'Deleting...' : 'Delete'} 
        danger 
      />
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