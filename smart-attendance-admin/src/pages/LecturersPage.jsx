import React, { useState, useEffect } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import { useSocket } from '@/context/SocketContext';
import SlideOver from '@/components/ui-custom/SlideOver';
import ConfirmModal from '@/components/ui-custom/ConfirmModal';
import { useToast } from '@/components/ui-custom/ToastProvider';
import { Plus, Search, BookOpen, Clock, MoreHorizontal, Loader2, KeyRound, Trash2, ShieldOff, ShieldCheck, Mail } from 'lucide-react';
import { lecturersAPI, departmentsAPI } from '@/api/api';

export default function LecturersPage() {
  const { addToast } = useToast();
  const { socket } = useSocket();
  
  // Data state
  const [lecturers, setLecturers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals & UI state
  const [slideOpen, setSlideOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  
  // Details state
  const [detailItem, setDetailItem] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Confirmation Modals
  const [deleteModal, setDeleteModal] = useState(null);
  const [resetModal, setResetModal] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  
  // Add Form
  const emptyForm = { name: '', email: '', staff_id: '', department_id: '', phone: '' };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchInitialData();
    
    if (!socket) return;
    const handleGlobalUpdate = () => {
      fetchInitialData(true);
    };
    
    socket.on('global_update', handleGlobalUpdate);
    return () => socket.off('global_update', handleGlobalUpdate);
  }, [search, filterDept, socket]);

  const fetchInitialData = async (isBackground = false) => {
    try {
      if (!isBackground) setIsLoading(true);
      const params = {};
      if (search) params.search = search;
      if (filterDept) params.department_id = filterDept;

      const [lecRes, deptRes] = await Promise.all([
        lecturersAPI.list(params),
        departmentsAPI.list() // To get department names and options for the form
      ]);
      setLecturers(lecRes.lecturers || []);
      // Only set departments once if we haven't already
      if (departments.length === 0) {
        setDepartments(deptRes.departments || []);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load lecturers', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatus = (l) => {
    if (l.is_suspended) return { label: 'Suspended', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' };
    if (!l.is_verified) return { label: 'Pending', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' };
    if (l.is_active) return { label: 'Active', color: '#10B981', bg: 'rgba(16,185,129,0.1)' };
    return { label: 'Inactive', color: '#6B7280', bg: 'rgba(107,114,128,0.1)' };
  };

  const openAdd = () => { 
    setForm({ ...emptyForm, department_id: departments[0]?.id || '' }); 
    setErrors({}); 
    setSlideOpen(true); 
    setDetailItem(null); 
  };

  const handleSave = async () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    if (!form.staff_id.trim()) e.staff_id = 'Required';
    if (!form.department_id) e.department_id = 'Required';
    setErrors(e);
    if (Object.keys(e).length) return;

    setIsSaving(true);
    try {
      await lecturersAPI.create(form);
      addToast('Lecturer added & invite sent successfully', 'success');
      setSlideOpen(false);
      fetchInitialData();
    } catch (err) {
      addToast(err.message || 'Failed to add lecturer', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const openDetails = async (l) => {
    setDetailItem(l);
    setSlideOpen(false); // Make sure add form is closed
    setIsLoadingDetails(true);
    setDetailData(null);
    try {
      const details = await lecturersAPI.get(l.id);
      setDetailData(details);
    } catch (err) {
      addToast(err.message || 'Failed to load details', 'error');
      setDetailItem(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSuspendToggle = async (l) => {
    setMenuOpen(null);
    try {
      if (l.is_suspended) {
        await lecturersAPI.reactivate(l.id);
        addToast(`${l.name} has been reactivated`, 'success');
      } else {
        await lecturersAPI.suspend(l.id);
        addToast(`${l.name} has been suspended`, 'success');
      }
      fetchInitialData();
      if (detailItem?.id === l.id && detailData) {
        setDetailData(prev => ({ ...prev, is_suspended: !l.is_suspended, is_active: l.is_suspended }));
      }
    } catch (err) {
      addToast(err.message || 'Action failed', 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!resetModal) return;
    setIsActionLoading(true);
    try {
      await lecturersAPI.resetPassword(resetModal.id);
      addToast(`Password reset email sent to ${resetModal.email}`, 'success');
      setResetModal(null);
    } catch (err) {
      addToast(err.message || 'Failed to send reset email', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setIsActionLoading(true);
    try {
      await lecturersAPI.delete(deleteModal.id);
      addToast('Lecturer deleted successfully', 'success');
      setDeleteModal(null);
      if (detailItem?.id === deleteModal.id) setDetailItem(null);
      fetchInitialData();
    } catch (err) {
      addToast(err.message || 'Failed to delete lecturer', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResendActivation = async (l) => {
    setMenuOpen(null);
    try {
      await lecturersAPI.resendActivation(l.id);
      addToast(`Activation email resent to ${l.email}`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to resend activation', 'error');
    }
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

  return (
    <div className="flex flex-col h-full">
      <TopHeader title="Lecturers" breadcrumbs={['Home', 'Lecturers']} />
      <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: 'var(--bg-deep)' }}>
        
        {/* Filters & Actions */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search lecturers..." 
                className="pl-9 pr-3 py-2 rounded-lg text-sm w-56 outline-none" 
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} 
              />
            </div>
            <select 
              value={filterDept} 
              onChange={e => setFilterDept(e.target.value)} 
              className="px-3 py-2 rounded-lg text-sm appearance-none outline-none" 
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
            </select>
          </div>
          <button onClick={openAdd} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            <Plus size={16} /> Add Lecturer
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={48} className="animate-spin mb-4" style={{ color: 'var(--accent-primary)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Loading lecturers...</p>
          </div>
        ) : lecturers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BookOpen size={48} style={{ color: 'var(--text-muted)' }} className="mb-4" />
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No lecturers found</p>
            <button onClick={openAdd} className="px-4 py-2 mt-4 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
              Add First Lecturer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {lecturers.map(l => {
              const status = getStatus(l);
              return (
                <div
                  key={l.id}
                  className="rounded-xl p-5 transition-all hover:-translate-y-0.5 cursor-pointer relative"
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                  onClick={(e) => { if (!e.target.closest('button')) openDetails(l); }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-semibold" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                        {getInitials(l.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{l.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{l.staff_id}</p>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs mt-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                          {l.department_name}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <button onClick={() => setMenuOpen(menuOpen === l.id ? null : l.id)} className="p-1.5 rounded hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
                        <MoreHorizontal size={16} />
                      </button>
                      {menuOpen === l.id && (
                        <div className="absolute right-0 top-8 w-48 rounded-lg py-1 z-10 shadow-xl" style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
                          <button onClick={() => handleSuspendToggle(l)} className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-white/5 transition-colors" style={{ color: 'var(--text-primary)' }}>
                            {l.is_suspended ? <><ShieldCheck size={14} className="text-green-500"/> Reactivate</> : <><ShieldOff size={14} className="text-yellow-500"/> Suspend</>}
                          </button>
                          {!l.is_verified && (
                            <button onClick={() => handleResendActivation(l)} className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-white/5 transition-colors" style={{ color: 'var(--text-primary)' }}>
                              <Mail size={14} className="text-blue-500" /> Resend Invite
                            </button>
                          )}
                          <button onClick={() => { setMenuOpen(null); setResetModal(l); }} className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-white/5 transition-colors" style={{ color: 'var(--text-primary)' }}>
                            <KeyRound size={14} className="text-blue-500" /> Reset Password
                          </button>
                          <button onClick={() => { setMenuOpen(null); setDeleteModal(l); }} className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-red-500/10 transition-colors" style={{ color: 'var(--accent-red)' }}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <BookOpen size={14} /> {l.course_count} Courses
                      </span>
                      <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <Clock size={14} /> {l.session_count} Sessions
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Detail SlideOver ────────────────────────────────────────────── */}
      <SlideOver open={!!detailItem && !slideOpen} onClose={() => setDetailItem(null)} title="Lecturer Details">
        {isLoadingDetails || !detailData ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin mb-4" style={{ color: 'var(--accent-primary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading details...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center p-6 rounded-xl" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-subtle)' }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-semibold mb-3 shadow-lg" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                {getInitials(detailData.name)}
              </div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{detailData.name}</h2>
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{detailData.staff_id} • {detailData.department_name}</p>
              
              <div className="flex gap-2 justify-center">
                <span className="px-2.5 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: getStatus(detailData).bg, color: getStatus(detailData).color }}>
                  {getStatus(detailData).label}
                </span>
                {detailData.phone && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                    {detailData.phone}
                  </span>
                )}
              </div>
              <p className="text-sm mt-3" style={{ color: 'var(--text-primary)' }}>{detailData.email}</p>
            </div>

            {/* Actions Quick Row */}
            <div className="flex gap-2">
              <button onClick={() => handleSuspendToggle(detailData)} className="flex-1 py-2 rounded-lg text-xs font-medium flex justify-center items-center gap-2 transition-colors" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                {detailData.is_suspended ? <><ShieldCheck size={14} className="text-green-500"/> Reactivate</> : <><ShieldOff size={14} className="text-yellow-500"/> Suspend</>}
              </button>
              <button onClick={() => setResetModal(detailData)} className="flex-1 py-2 rounded-lg text-xs font-medium flex justify-center items-center gap-2 transition-colors" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                <KeyRound size={14} className="text-blue-500" /> Reset Pwd
              </button>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <BookOpen size={16} style={{ color: 'var(--accent-primary)' }} /> Assigned Courses
              </h3>
              {detailData.courses && detailData.courses.length > 0 ? (
                <div className="space-y-2">
                  {detailData.courses.map(c => (
                    <div key={c.id} className="p-3 rounded-lg flex justify-between items-center" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-subtle)' }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{c.title}</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.code} • {c.programme_code}</p>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded bg-white/5" style={{ color: 'var(--text-secondary)' }}>
                        L{c.level}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No courses assigned yet.</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Clock size={16} style={{ color: 'var(--accent-primary)' }} /> Recent Sessions
              </h3>
              {detailData.recent_sessions && detailData.recent_sessions.length > 0 ? (
                <div className="space-y-2">
                  {detailData.recent_sessions.map(s => (
                    <div key={s.id} className="p-3 rounded-lg flex justify-between items-center" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-subtle)' }}>
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                          {new Date(s.started_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.location}</p>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                        {s.attendees_count || 0} Attended
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No sessions conducted yet.</p>
              )}
            </div>
          </div>
        )}
      </SlideOver>

      {/* ─── Add Form SlideOver ───────────────────────────────────────────── */}
      <SlideOver open={slideOpen} onClose={() => setSlideOpen(false)} title="Add Lecturer">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full Name *</label>
            <input type="text" value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })); }} className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: 'var(--bg-deep)', border: errors.name ? '1px solid var(--accent-red)' : '1px solid var(--border-input)', color: 'var(--text-primary)' }} placeholder="e.g. Dr. Ama Owusu" />
            {errors.name && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{errors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Official Email *</label>
            <input type="email" value={form.email} onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: '' })); }} className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: 'var(--bg-deep)', border: errors.email ? '1px solid var(--accent-red)' : '1px solid var(--border-input)', color: 'var(--text-primary)' }} placeholder="a.owusu@uni.edu" />
            {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{errors.email}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Staff ID *</label>
              <input type="text" value={form.staff_id} onChange={e => { setForm(p => ({ ...p, staff_id: e.target.value })); setErrors(p => ({ ...p, staff_id: '' })); }} className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: 'var(--bg-deep)', border: errors.staff_id ? '1px solid var(--accent-red)' : '1px solid var(--border-input)', color: 'var(--text-primary)' }} placeholder="EMP-001" />
              {errors.staff_id && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{errors.staff_id}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Phone</label>
              <input type="text" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} placeholder="+233..." />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Department *</label>
            <select value={form.department_id} onChange={e => { setForm(p => ({ ...p, department_id: e.target.value })); setErrors(p => ({ ...p, department_id: '' })); }} className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none outline-none" style={{ backgroundColor: 'var(--bg-deep)', border: errors.department_id ? '1px solid var(--accent-red)' : '1px solid var(--border-input)', color: 'var(--text-primary)' }}>
              <option value="" disabled>Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
            </select>
            {errors.department_id && <p className="text-xs mt-1" style={{ color: 'var(--accent-red)' }}>{errors.department_id}</p>}
          </div>
        </div>

        <div className="flex gap-3 mt-8 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={() => setSlideOpen(false)} disabled={isSaving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            {isSaving && <Loader2 size={15} className="animate-spin" />}
            Send Invite
          </button>
        </div>
      </SlideOver>

      {/* ─── Delete Modal ─────────────────────────────────────────────────── */}
      <ConfirmModal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        title="Delete Lecturer"
        message={`Are you sure you want to delete ${deleteModal?.name}? This action cannot be undone and will fail if they have active courses assigned.`}
        confirmText={isActionLoading ? 'Deleting...' : 'Delete Lecturer'}
        danger
      />

      {/* ─── Reset Password Modal ─────────────────────────────────────────── */}
      <ConfirmModal
        open={!!resetModal}
        onClose={() => setResetModal(null)}
        onConfirm={handleResetPassword}
        title="Reset Password"
        message={`This will send a password reset email to ${resetModal?.email}. Are you sure you want to proceed?`}
        confirmText={isActionLoading ? 'Sending...' : 'Send Reset Email'}
      />
    </div>
  );
}