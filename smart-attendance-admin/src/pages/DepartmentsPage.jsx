import React, { useState, useEffect } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import SlideOver from '@/components/ui-custom/SlideOver';
import ConfirmModal from '@/components/ui-custom/ConfirmModal';
import { useToast } from '@/components/ui-custom/ToastProvider';
import { Plus, Pencil, Trash2, Eye, Building2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { departmentsAPI } from '@/api/api';

const emptyForm = { name: '', code: '', faculty: '', status: 'Active' };

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [depts, setDepts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [slideOpen, setSlideOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deleteModal, setDeleteModal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    fetchDepts();
  }, []);

  const fetchDepts = async () => {
    try {
      setIsLoading(true);
      const data = await departmentsAPI.list();
      // Map backend fields to frontend state
      const mapped = data.departments.map(d => ({
        id: d.id,
        name: d.name,
        code: d.code,
        faculty: d.faculty || '',
        programmes: d.programme_count || 0,
        students: d.student_count || 0,
        status: d.is_active ? 'Active' : 'Inactive'
      }));
      setDepts(mapped);
    } catch (err) {
      addToast(err.message || 'Failed to fetch departments', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setErrors({}); setSlideOpen(true); };
  const openEdit = (d) => { setEditItem(d); setForm({ name: d.name, code: d.code, faculty: d.faculty, status: d.status }); setErrors({}); setSlideOpen(true); };

  const handleSave = async () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.code.trim()) e.code = 'Required';
    else if (form.code.length > 10) e.code = 'Max 10 characters';
    setErrors(e);
    if (Object.keys(e).length) return;

    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        faculty: form.faculty.trim() || null,
        is_active: form.status === 'Active'
      };

      if (editItem) {
        await departmentsAPI.update(editItem.id, payload);
        addToast('Department updated successfully', 'success');
      } else {
        await departmentsAPI.create(payload);
        addToast('Department created successfully', 'success');
      }
      setSlideOpen(false);
      fetchDepts(); // Refresh list
    } catch (err) {
      addToast(err.message || 'Failed to save department', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (d) => {
    if (d.programmes > 0) { addToast('Cannot delete department with active programmes', 'error'); return; }
    setDeleteModal(d);
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      await departmentsAPI.delete(deleteModal.id);
      addToast('Department deleted', 'success');
      setDeleteModal(null);
      fetchDepts();
    } catch (err) {
      addToast(err.message || 'Failed to delete department', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleStatus = async (d) => {
    try {
      if (d.status === 'Active') {
        await departmentsAPI.deactivate(d.id);
        addToast('Department deactivated', 'success');
      } else {
        await departmentsAPI.activate(d.id);
        addToast('Department activated', 'success');
      }
      fetchDepts();
    } catch (err) {
      addToast(err.message || 'Failed to toggle status', 'error');
    }
  };

  const handleSort = (col) => {
    if (sortCol === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }
    else { setSortCol(col); setSortDir('asc'); }
  };

  const sorted = [...depts].sort((a, b) => {
    if (!sortCol) return 0;
    const av = a[sortCol], bv = b[sortCol];
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const active = depts.filter(d => d.status === 'Active').length;
  const inactive = depts.length - active;

  return (
    <div className="flex flex-col h-full">
      <TopHeader title="Departments" breadcrumbs={['Home', 'Departments']} />
      <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: 'var(--bg-deep)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>Total: {depts.length}</span>
            <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981' }}>Active: {active}</span>
            <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>Inactive: {inactive}</span>
          </div>
          <button onClick={openAdd} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            <Plus size={16} /> Add Department
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={48} className="animate-spin mb-4" style={{ color: 'var(--accent-primary)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Loading departments...</p>
          </div>
        ) : depts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Building2 size={48} style={{ color: 'var(--text-muted)' }} className="mb-4" />
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No departments yet</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Create your first department to get started.</p>
            <button onClick={openAdd} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
              <Plus size={14} className="inline mr-1" /> Add Department
            </button>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-raised)' }}>
                  {[
                    { key: 'name', label: 'Department Name' },
                    { key: 'code', label: 'Code' },
                    { key: 'faculty', label: 'Faculty/School' },
                    { key: 'programmes', label: 'Programmes' },
                    { key: 'students', label: 'Students' },
                    { key: 'status', label: 'Status' },
                    { key: null, label: 'Actions' },
                  ].map(h => (
                    <th
                      key={h.label}
                      onClick={() => h.key && handleSort(h.key)}
                      className={`text-left text-xs font-medium px-5 py-3 ${h.key ? 'cursor-pointer select-none' : ''}`}
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {h.label} {sortCol === h.key && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((d, i) => (
                  <tr key={d.id} className={`transition-colors hover:bg-white/[0.02] ${i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="px-5 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{d.name}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{d.code}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{d.faculty}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{d.programmes}</td>
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
                        <button onClick={() => openEdit(d)} className="p-1.5 rounded hover:bg-white/5" style={{ color: 'var(--text-secondary)' }} title="Edit"><Pencil size={14} /></button>
                        <button onClick={() => toggleStatus(d)} className="p-1.5 rounded hover:bg-white/5 text-xs" style={{ color: 'var(--accent-primary)' }} title="Toggle status">
                          {d.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => navigate(`/programmes?dept=${d.id}`)} className="p-1.5 rounded hover:bg-white/5" style={{ color: 'var(--text-secondary)' }} title="View Programmes"><Eye size={14} /></button>
                        <button onClick={() => handleDelete(d)} disabled={d.programmes > 0} className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30" style={{ color: 'var(--accent-red)' }} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SlideOver open={slideOpen} onClose={() => setSlideOpen(false)} title={editItem ? 'Edit Department' : 'Add Department'}>
        <div className="space-y-4">
          <FieldInput label="Department Name" value={form.name} onChange={v => { setForm(p => ({ ...p, name: v })); setErrors(p => ({ ...p, name: '' })); }} error={errors.name} required />
          <FieldInput label="Department Code" value={form.code} onChange={v => { setForm(p => ({ ...p, code: v.toUpperCase() })); setErrors(p => ({ ...p, code: '' })); }} error={errors.code} helper="Max 10 characters, auto-uppercase" required />
          <FieldInput label="Faculty / School" value={form.faculty} onChange={v => setForm(p => ({ ...p, faculty: v }))} />
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
          <button onClick={handleSave} disabled={isSaving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {editItem ? 'Save Changes' : 'Save Department'}
          </button>
        </div>
      </SlideOver>

      <ConfirmModal 
        open={!!deleteModal} 
        onClose={() => setDeleteModal(null)} 
        onConfirm={confirmDelete} 
        title="Delete Department" 
        message={`Are you sure you want to delete "${deleteModal?.name}"? This action cannot be undone.`} 
        confirmText={isDeleting ? 'Deleting...' : 'Delete'} 
        danger 
      />
    </div>
  );
}

function FieldInput({ label, value, onChange, error, helper, required }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {label} {required && <span style={{ color: 'var(--accent-red)' }}>*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all"
        style={{ backgroundColor: 'var(--bg-deep)', border: error ? '1px solid var(--accent-red)' : '1px solid var(--border-input)', color: 'var(--text-primary)' }}
        onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--accent-red)' : 'var(--border-input)'}
      />
      {error && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{error}</p>}
      {helper && !error && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{helper}</p>}
    </div>
  );
}