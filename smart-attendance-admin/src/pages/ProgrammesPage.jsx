import React, { useState, useEffect } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import SlideOver from '@/components/ui-custom/SlideOver';
import ConfirmModal from '@/components/ui-custom/ConfirmModal';
import { useToast } from '@/components/ui-custom/ToastProvider';
import { Plus, Pencil, Trash2, GraduationCap, Loader2 } from 'lucide-react';
import { programmesAPI, departmentsAPI } from '@/api/api';
import { useSocketRefresh } from '@/hooks/useSocketRefresh';

const emptyForm = { name: '', code: '', department_id: '', duration_years: 4, status: 'Active' };

export default function ProgrammesPage() {
  const { addToast } = useToast();
  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [slideOpen, setSlideOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deleteModal, setDeleteModal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const urlParams = new URLSearchParams(window.location.search);
  const initialDeptParam = urlParams.get('dept') || '';
  const [filterDept, setFilterDept] = useState(initialDeptParam);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchProgrammes();
  }, [filterDept]);

  const fetchDepartments = async () => {
    try {
      const res = await departmentsAPI.list();
      setDepartments(res.departments || []);
    } catch (err) {
      addToast('Failed to load departments', 'error');
    }
  };

  const fetchProgrammes = async () => {
    try {
      setIsLoading(true);
      const params = {};
      
      // If we filtered by a valid department ID, send it. If it's a code, we might need to look it up 
      // but in the new flow, we use department IDs directly. If URL was /programmes?dept=DCS, 
      // we need to resolve that to an ID. Let's do it if departments are loaded.
      if (filterDept) {
        // Just send as department_id. If filterDept is a code (from old URL), this might fail, 
        // so we should match the code to an ID if possible.
        let deptId = filterDept;
        const matched = departments.find(d => d.code === filterDept || d.id === filterDept);
        if (matched) deptId = matched.id;
        
        params.department_id = deptId;
      }

      const res = await programmesAPI.list(params);
      
      const mapped = res.programmes.map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        department_id: p.department_id,
        dept: p.department_name,
        duration: p.duration_years,
        levels: p.levels || [],
        students: p.student_count || 0,
        status: p.is_active ? 'Active' : 'Inactive'
      }));
      setData(mapped);
    } catch (err) {
      addToast(err.message || 'Failed to fetch programmes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh on socket event (must be after function declarations to avoid TDZ)
  useSocketRefresh(() => fetchProgrammes(), [filterDept]);

  // Whenever departments load, if we had a filterDept that was a code, refetch 
  // so the backend query uses the correct ID.
  useEffect(() => {
    if (departments.length > 0 && filterDept) {
      fetchProgrammes();
    }
  }, [departments]);

  const openAdd = () => { 
    setEditItem(null); 
    setForm({ ...emptyForm, department_id: departments[0]?.id || '' }); 
    setErrors({}); 
    setSlideOpen(true); 
  };
  
  const openEdit = (d) => { 
    setEditItem(d); 
    setForm({ 
      name: d.name, 
      code: d.code, 
      department_id: d.department_id, 
      duration_years: d.duration, 
      status: d.status 
    }); 
    setErrors({}); 
    setSlideOpen(true); 
  };

  const getLevelsArray = (dur) => Array.from({ length: dur }, (_, i) => (i + 1) * 100);

  const handleSave = async () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.code.trim()) e.code = 'Required';
    if (!form.department_id) e.department_id = 'Select a department';
    setErrors(e);
    if (Object.keys(e).length) return;

    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        department_id: form.department_id,
        duration_years: form.duration_years,
        is_active: form.status === 'Active'
      };

      if (editItem) {
        await programmesAPI.update(editItem.id, payload);
        addToast('Programme updated successfully', 'success');
      } else {
        await programmesAPI.create(payload);
        addToast('Programme created successfully', 'success');
      }
      setSlideOpen(false);
      fetchProgrammes();
    } catch (err) {
      addToast(err.message || 'Failed to save programme', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      await programmesAPI.delete(deleteModal.id);
      addToast('Programme deleted', 'success');
      setDeleteModal(null);
      fetchProgrammes();
    } catch (err) {
      addToast(err.message || 'Failed to delete programme', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <TopHeader title="Programmes" breadcrumbs={['Home', 'Programmes']} />
      <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: 'var(--bg-deep)' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <select 
              value={filterDept} 
              onChange={e => setFilterDept(e.target.value)} 
              className="px-3 py-2 rounded-lg text-sm appearance-none outline-none" 
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>
          <button onClick={openAdd} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            <Plus size={16} /> Add Programme
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <Loader2 size={48} className="animate-spin mb-4" style={{ color: 'var(--accent-primary)' }} />
             <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Loading programmes...</p>
          </div>
        ) : data.length === 0 ? (
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
                {data.map((d, i) => (
                  <tr key={d.id} className={`transition-colors hover:bg-white/[0.02] ${i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="px-5 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{d.name}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{d.code}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{d.dept}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{d.duration} years</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {d.levels.map(l => (
                          <span key={l} className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>L{l}</span>
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
                        <button onClick={() => setDeleteModal(d)} className="p-1.5 rounded hover:bg-white/5" style={{ color: 'var(--accent-red)' }}><Trash2 size={14} /></button>
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
            <select 
              value={form.department_id} 
              onChange={e => { setForm(p => ({ ...p, department_id: e.target.value })); setErrors(p => ({ ...p, department_id: '' })); }} 
              className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none outline-none" 
              style={{ backgroundColor: 'var(--bg-deep)', border: errors.department_id ? '1px solid var(--accent-red)' : '1px solid var(--border-input)', color: 'var(--text-primary)' }}
            >
              <option value="" disabled>Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
            </select>
            {errors.department_id && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{errors.department_id}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Duration in Years *</label>
            <input type="number" min={1} max={6} value={form.duration_years} onChange={e => setForm(p => ({ ...p, duration_years: parseInt(e.target.value) || 1 }))} className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
            {form.duration_years > 0 && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Levels: {getLevelsArray(form.duration_years).map(l => 'L'+l).join(', ')}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Status</label>
            <div className="flex gap-3">
              {['Active', 'Inactive'].map(s => (
                <button key={s} onClick={() => setForm(p => ({ ...p, status: s }))} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{
                  backgroundColor: form.status === s ? 'var(--accent-primary)' : 'transparent',
                  color: form.status === s ? 'var(--bg-deep)' : 'var(--text-secondary)',
                  border: form.status === s ? 'none' : '1px solid rgba(255,255,255,0.15)',
                }}>{s}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-8 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={() => setSlideOpen(false)} disabled={isSaving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {editItem ? 'Save Changes' : 'Save Programme'}
          </button>
        </div>
      </SlideOver>

      <ConfirmModal 
        open={!!deleteModal} 
        onClose={() => setDeleteModal(null)} 
        onConfirm={confirmDelete} 
        title="Delete Programme" 
        message={`Are you sure you want to delete "${deleteModal?.name}"? This action cannot be undone.`} 
        confirmText={isDeleting ? 'Deleting...' : 'Delete'} 
        danger 
      />
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