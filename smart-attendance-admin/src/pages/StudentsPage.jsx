import React, { useState, useEffect } from 'react';
import TopHeader from '@/components/layout/TopHeader';
import SlideOver from '@/components/ui-custom/SlideOver';
import { useToast } from '@/components/ui-custom/ToastProvider';
import { Plus, Search, Upload, Pencil, Trash2, Eye, RotateCcw, Info, AlertTriangle, CheckCircle, Clock, X, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsAPI, departmentsAPI, programmesAPI, coursesAPI } from '../api/api';
import Papa from 'papaparse';
import { useSocket } from '@/context/SocketContext';

export default function StudentsPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  // Invalidate all student-related queries whenever the backend pushes an update
  useEffect(() => {
    if (!socket) return;
    const refresh = () => queryClient.invalidateQueries();
    socket.on('global_update', refresh);
    return () => socket.off('global_update', refresh);
  }, [socket, queryClient]);

  // ----- Filters (must come before useQuery that depends on them) -----
  const [search, setSearch] = useState('');
  const [fProg, setFProg] = useState('');
  const [fLevel, setFLevel] = useState('');

  // ----- Queries -----
  const { data: deptsRes } = useQuery({ queryKey: ['departments'], queryFn: () => departmentsAPI.list() });
  const { data: progsRes } = useQuery({ queryKey: ['programmes'], queryFn: () => programmesAPI.list() });
  const { data: levelsRes } = useQuery({ queryKey: ['studentLevels'], queryFn: () => studentsAPI.getLevels() });
  const { data: studentsRes, isLoading } = useQuery({
    queryKey: ['students', search, fProg, fLevel],
    queryFn: () => {
      const params = {};
      if (search) params.search = search;
      if (fProg) params.programme_id = fProg;
      if (fLevel) params.level = parseInt(fLevel, 10);
      return studentsAPI.list(params);
    },
    keepPreviousData: true,
  });

  const departments = deptsRes?.departments || [];
  const programmes = progsRes?.programmes || [];
  const students = studentsRes?.students || [];

  // Levels: use programme.levels when a programme is selected in the form;
  // for the filter dropdown use the union across all programmes (same as CoursesPage)
  const allLevels = Array.from(new Set(programmes.flatMap(p => p.levels || []))).sort((a, b) => a - b);
  // Fallback: use the /levels endpoint if no programme levels are present
  const backendLevels = levelsRes?.levels || [100, 200, 300, 400, 500, 600];
  const filterLevels = allLevels.length > 0 ? allLevels : backendLevels;

  // ----- State -----
  const [slideOpen, setSlideOpen] = useState(false);
  const [slideType, setSlideType] = useState('add');
  const [profileItem, setProfileItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // student to confirm delete

  // Bulk Import state
  const [bulkStep, setBulkStep] = useState(0);
  const [bulkData, setBulkData] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [bulkStats, setBulkStats] = useState({ created: 0, failed: 0 });

  // Forms
  const [form, setForm] = useState({ name: '', sid: '', email: '', dept: '', programme: '', level: '', semEntry: '1' });
  const [overrideForm, setOverrideForm] = useState({ course: '', session: '', status: 'present', reason: '' });
  const [errors, setErrors] = useState({});

  // ── Cascading form derived data ──────────────────────────────────────────────
  // Programmes filtered by the currently selected department in the add form
  const formProgrammes = form.dept
    ? programmes.filter(p => p.department_id === form.dept)
    : programmes;

  // Levels for the currently selected programme
  const selectedProgramme = programmes.find(p => p.id === form.programme);
  const formLevels = selectedProgramme
    ? (selectedProgramme.levels || backendLevels)
    : backendLevels;

  // Semesters: each year of study has 2 semesters, so max semester = duration_years * 2.
  // But "semester of entry" is typically just 1 or 2 (which semester in year 1 the student joined).
  // We keep it as Sem 1 / Sem 2 always — this is correct academically.
  const formSemesters = [1, 2];

  // ----- Dynamic Queries (Details & Sessions) -----
  const { data: studentDetailsRes, isLoading: detailsLoading } = useQuery({
    queryKey: ['studentDetails', profileItem?.id],
    queryFn: () => studentsAPI.get(profileItem.id),
    enabled: !!profileItem && (slideType === 'profile' || slideType === 'override')
  });
  const studentDetails = studentDetailsRes || null;

  const { data: sessionsRes } = useQuery({
    queryKey: ['courseSessions', overrideForm.course],
    queryFn: () => coursesAPI.getSessions(overrideForm.course),
    enabled: !!overrideForm.course && slideType === 'override'
  });
  const sessions = sessionsRes?.sessions || [];

  // ----- Mutations -----
  const addMutation = useMutation({
    mutationFn: studentsAPI.create,
    onSuccess: () => {
      addToast('Student added & invite sent', 'success');
      queryClient.invalidateQueries(['students']);
      setSlideOpen(false);
    },
    onError: (err) => addToast(err.message || 'Failed to add student', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: studentsAPI.delete,
    onSuccess: () => {
      addToast('Student removed', 'success');
      queryClient.invalidateQueries(['students']);
    },
    onError: (err) => addToast(err.message || 'Failed to delete student', 'error')
  });

  const overrideMutation = useMutation({
    mutationFn: studentsAPI.overrideAttendance,
    onSuccess: () => {
      addToast('Attendance override submitted', 'success');
      queryClient.invalidateQueries(['studentDetails', profileItem?.id]);
      queryClient.invalidateQueries(['students']);
      setSlideOpen(false);
    },
    onError: (err) => addToast(err.message || 'Override failed', 'error')
  });

  const bulkMutation = useMutation({
    mutationFn: studentsAPI.bulkImport,
    onSuccess: (data) => {
      setBulkStats({ created: data.total_created, failed: data.total_failed });
      setBulkErrors(data.errors || []);
      setBulkStep(3);
      queryClient.invalidateQueries(['students']);
    },
    onError: (err) => addToast(err.message || 'Bulk import failed', 'error')
  });

  const resendMutation = useMutation({
    mutationFn: studentsAPI.resendInvitation,
    onSuccess: () => addToast('Invite resent', 'success'),
    onError: (err) => addToast(err.message || 'Failed to resend invite', 'error')
  });


  // ----- Filtering (client-side safety net) -----
  const filtered = students.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.student_id.toLowerCase().includes(search.toLowerCase())) return false;
    if (fProg && s.programme_id !== fProg) return false;
    if (fLevel && s.level !== parseInt(fLevel, 10)) return false;
    return true;
  });

  // ----- Handlers -----
  const openAdd = () => { 
    setSlideType('add');
    const firstDept = departments[0];
    const deptProgs = firstDept
      ? programmes.filter(p => p.department_id === firstDept.id)
      : programmes;
    const firstProg = deptProgs[0];
    const firstLevel = firstProg?.levels?.[0]?.toString() || backendLevels[0]?.toString() || '100';
    setForm({ 
      name: '', sid: '', email: '', 
      dept: firstDept?.id || '', 
      programme: firstProg?.id || '', 
      level: firstLevel, 
      semEntry: '1' 
    }); 
    setErrors({}); 
    setSlideOpen(true); 
  };
  
  const openBulk = () => { setSlideType('bulk'); setBulkStep(1); setSlideOpen(true); };
  
  const openOverride = (s) => { 
    setSlideType('override'); 
    setOverrideForm({ course: '', session: '', status: 'present', reason: '' }); 
    setProfileItem(s); 
    setSlideOpen(true); 
  };
  
  const openProfile = (s) => { setSlideType('profile'); setProfileItem(s); setSlideOpen(true); };

  const handleAddStudent = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.sid.trim()) e.sid = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    if (!form.dept) e.dept = 'Required';
    if (!form.programme) e.programme = 'Required';
    setErrors(e);
    if (Object.keys(e).length) return;

    addMutation.mutate({
      name: form.name,
      student_id: form.sid,
      email: form.email,
      department_id: form.dept,
      programme_id: form.programme,
      level: parseInt(form.level, 10),
      semester_of_entry: parseInt(form.semEntry, 10)
    });
  };

  const handleOverrideSubmit = () => {
    if (!overrideForm.course || !overrideForm.session || !overrideForm.reason.trim()) {
      addToast('Please fill all required fields', 'error');
      return;
    }
    if (overrideForm.reason.trim().length < 10) {
      addToast('Reason must be at least 10 characters', 'error');
      return;
    }
    overrideMutation.mutate({
      student_id: profileItem.id,
      session_id: overrideForm.session,
      status: overrideForm.status,
      reason: overrideForm.reason
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        const mapped = [];
        const errs = [];
        rows.forEach((r, i) => {
          if (!r.email) errs.push(`Row ${i+2}: Missing email`);
          if (!r.student_id) errs.push(`Row ${i+2}: Missing student ID`);
          mapped.push({
            name: r.name || r.Name || '',
            student_id: r.student_id || r['Student ID'] || r.studentID || '',
            email: r.email || r.Email || '',
            department_code: r.department_code || r.department || r.Department || '',
            programme_code: r.programme_code || r.programme || r.Programme || '',
            level: parseInt(r.level || r.Level, 10) || 100,
            semester_of_entry: parseInt(r.semester || r.Semester, 10) || 1
          });
        });
        setBulkData(mapped);
        setBulkErrors(errs);
        setBulkStep(2);
      }
    });
  };

  const handleConfirmImport = () => {
    bulkMutation.mutate({ students: bulkData });
  };

  // ----- UI Helpers -----
  const getInvBadge = (inv) => {
    const map = { 
      'registered': { color: '#10B981', icon: CheckCircle }, 
      'pending': { color: '#F59E0B', icon: Clock }, 
      'expired': { color: '#EF4444', icon: X } 
    };
    const m = map[inv?.toLowerCase()] || map['pending'];
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs capitalize" style={{ backgroundColor: `${m.color}15`, color: m.color }}>
        <m.icon size={12} /> {inv || 'Pending'}
      </span>
    );
  };

  const getAttColor = (att) => {
    if (att === null || att === undefined) return 'var(--text-muted)';
    if (att >= 75) return '#10B981';
    if (att >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

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
              <option value="">All Programmes</option>
              {programmes.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <select value={fLevel} onChange={e => setFLevel(e.target.value)} className="px-3 py-2 rounded-lg text-sm appearance-none" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
              <option value="">All Levels</option>
              {filterLevels.map(o => <option key={o} value={o}>L{o}</option>)}
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
                {isLoading ? (
                  <tr><td colSpan={9} className="text-center py-8"><Loader2 className="animate-spin mx-auto" style={{ color: 'var(--text-muted)' }} /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No students found.</td></tr>
                ) : filtered.map((s, i) => (
                  <tr key={s.id} className={`transition-colors hover:bg-white/[0.02] ${i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                          {getInitials(s.name)}
                        </div>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.student_id}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.programme_name}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>L{s.level}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.email}</td>
                    <td className="px-4 py-3">
                      {s.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }} /> Active
                        </span>
                      ) : (
                         <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#EF4444' }} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{getInvBadge(s.invitation_status)}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium" style={{ color: getAttColor(s.attendance_avg) }}>
                        {s.attendance_avg !== null && s.attendance_avg !== undefined ? `${s.attendance_avg}%` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openProfile(s)} className="p-1.5 rounded hover:bg-white/5" style={{ color: 'var(--text-secondary)' }} title="View Profile"><Eye size={14} /></button>
                        <button onClick={() => openOverride(s)} className="p-1.5 rounded hover:bg-white/5" style={{ color: 'var(--accent-primary)' }} title="Override"><Pencil size={14} /></button>
                        {s.invitation_status === 'expired' && (
                          <button onClick={() => resendMutation.mutate(s.id)} className="p-1.5 rounded hover:bg-white/5" style={{ color: '#F59E0B' }} title="Resend Invite"><RotateCcw size={14} /></button>
                        )}
                        <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded hover:bg-white/5" style={{ color: 'var(--accent-red)' }} title="Delete"><Trash2 size={14} /></button>
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
              <select value={form.dept} onChange={e => {
                const deptId = e.target.value;
                // Reset programme/level when dept changes
                const deptProgs = programmes.filter(p => p.department_id === deptId);
                const firstProg = deptProgs[0];
                const firstLevel = firstProg?.levels?.[0]?.toString() || backendLevels[0]?.toString() || '100';
                setForm(p => ({ ...p, dept: deptId, programme: firstProg?.id || '', level: firstLevel, semEntry: '1' }));
                setErrors(p => ({ ...p, dept: '', programme: '' }));
              }} className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none" style={{ backgroundColor: 'var(--bg-deep)', border: errors.dept ? '1px solid var(--accent-red)' : '1px solid var(--border-input)', color: 'var(--text-primary)' }}>
                <option value="">Select...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Programme *</label>
              <select value={form.programme} onChange={e => {
                const pId = e.target.value;
                const prog = programmes.find(p => p.id === pId);
                const firstLevel = prog?.levels?.[0]?.toString() || backendLevels[0]?.toString() || '100';
                setForm(p => ({ ...p, programme: pId, level: firstLevel, semEntry: '1' }));
                setErrors(p => ({ ...p, programme: '' }));
              }} className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none" style={{ backgroundColor: 'var(--bg-deep)', border: errors.programme ? '1px solid var(--accent-red)' : '1px solid var(--border-input)', color: 'var(--text-primary)' }}>
                <option value="">Select...</option>
                {formProgrammes.length > 0
                  ? formProgrammes.map(o => <option key={o.id} value={o.id}>{o.name}</option>)
                  : <option disabled value="">No programmes in this department</option>
                }
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Level / Year *</label>
              <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}>
                {formLevels.map(l => <option key={l} value={l}>L{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Semester of Entry</label>
              <select value={form.semEntry} onChange={e => setForm(p => ({ ...p, semEntry: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}>
                {formSemesters.map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
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
          <button onClick={handleAddStudent} disabled={addMutation.isPending} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold flex justify-center items-center" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            {addMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Add Student & Send Invite'}
          </button>
        </div>
      </SlideOver>

      {/* Bulk Import slide-over */}
      <SlideOver open={slideOpen && slideType === 'bulk'} onClose={() => setSlideOpen(false)} title="Bulk Import Students">
        {bulkStep === 1 && (
          <div className="space-y-4">
            <div className="relative rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.02] transition-colors" style={{ border: '2px dashed var(--border-input)', backgroundColor: 'var(--bg-deep)' }}>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              <Upload size={32} style={{ color: 'var(--text-muted)' }} className="mb-3" />
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Click or Drop your CSV here</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>CSV header: name, student_id, email, department, programme, level, semester</p>
            </div>
          </div>
        )}
        {bulkStep === 2 && (
          <div className="space-y-4">
            <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: 'var(--accent-green)' }}>{bulkData.length} total rows parsed</span>
                {bulkErrors.length > 0 && <span className="text-sm font-medium" style={{ color: 'var(--accent-red)' }}>{bulkErrors.length} errors</span>}
              </div>
              {bulkErrors.length > 0 ? (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {bulkErrors.map((err, i) => <p key={i} className="text-xs" style={{ color: 'var(--accent-red)' }}>{err}</p>)}
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--accent-green)' }}>Ready to import.</p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setBulkStep(1)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>Back</button>
              <button onClick={handleConfirmImport} disabled={bulkMutation.isPending} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold flex justify-center items-center" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                {bulkMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Import'}
              </button>
            </div>
          </div>
        )}
        {bulkStep === 3 && (
          <div className="text-center py-8">
            <CheckCircle size={48} style={{ color: 'var(--accent-green)' }} className="mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Import Complete</p>
            <p className="text-sm mb-1" style={{ color: 'var(--accent-green)' }}>{bulkStats.created} students created</p>
            {bulkStats.failed > 0 && <p className="text-sm mb-4" style={{ color: 'var(--accent-red)' }}>{bulkStats.failed} failed</p>}
            {bulkErrors.length > 0 && (
              <div className="mt-4 text-left p-3 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400 max-h-32 overflow-y-auto">
                {bulkErrors.map((e, i) => <div key={i}>{JSON.stringify(e)}</div>)}
              </div>
            )}
          </div>
        )}
      </SlideOver>

      {/* Override slide-over */}
      <SlideOver open={slideOpen && slideType === 'override'} onClose={() => setSlideOpen(false)} title="Manual Attendance Override" subtitle={profileItem?.name}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Select Course *</label>
            <select value={overrideForm.course} onChange={e => setOverrideForm(p => ({ ...p, course: e.target.value, session: '' }))} className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}>
              <option value="">Select...</option>
              {studentDetails?.enrolled_courses?.map(c => (
                <option key={c.course_id} value={c.course_id}>{c.course_code} — {c.course_title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Select Session *</label>
            <select value={overrideForm.session} onChange={e => setOverrideForm(p => ({ ...p, session: e.target.value }))} disabled={!overrideForm.course} className="w-full px-3.5 py-2.5 rounded-lg text-sm appearance-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}>
              <option value="">Select...</option>
              {sessions?.map(s => (
                <option key={s.id} value={s.id}>{new Date(s.date).toLocaleDateString()} — {new Date(s.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Override Status</label>
            <div className="flex gap-3">
              {['present', 'absent'].map(s => (
                <button key={s} onClick={() => setOverrideForm(p => ({ ...p, status: s }))} className="px-4 py-2 rounded-lg text-sm font-medium capitalize" style={{
                  backgroundColor: overrideForm.status === s ? (s === 'present' ? '#10B981' : '#EF4444') : 'transparent',
                  color: overrideForm.status === s ? '#fff' : 'var(--text-secondary)',
                  border: overrideForm.status === s ? 'none' : '1px solid rgba(255,255,255,0.15)',
                }}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Reason *</label>
            <textarea value={overrideForm.reason} onChange={e => setOverrideForm(p => ({ ...p, reason: e.target.value }))} rows={3} placeholder="Provide justification..." className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none resize-none" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-lg" style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>This action is logged in the audit trail.</p>
          </div>
        </div>
        <div className="flex gap-3 mt-8 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={() => setSlideOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}>Cancel</button>
          <button onClick={handleOverrideSubmit} disabled={overrideMutation.isPending} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold flex justify-center items-center" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
            {overrideMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Submit Override'}
          </button>
        </div>
      </SlideOver>

      {/* Profile slide-over */}
      <SlideOver open={slideOpen && slideType === 'profile'} onClose={() => setSlideOpen(false)} title={profileItem?.name} subtitle={`${profileItem?.student_id} · ${profileItem?.programme_name} · L${profileItem?.level}`}>
        {detailsLoading ? (
           <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted" /></div>
        ) : studentDetails && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-semibold" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-deep)' }}>
                {getInitials(studentDetails.name)}
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{studentDetails.name}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{studentDetails.email}</p>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Enrolled Courses</h4>
              <div className="space-y-3">
                {studentDetails.enrolled_courses?.length === 0 && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No courses enrolled.</p>}
                {studentDetails.enrolled_courses?.map((c, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{c.course_code} — {c.course_title}</span>
                      <span className="text-xs font-medium" style={{ color: getAttColor(c.attendance_pct) }}>{c.attendance_pct.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-deep)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(c.attendance_pct, 100)}%`, backgroundColor: getAttColor(c.attendance_pct) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Account Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Registration Date</span><span style={{ color: 'var(--text-primary)' }}>{formatDate(studentDetails.created_at)}</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Last Login</span><span style={{ color: 'var(--text-primary)' }}>{formatDate(studentDetails.last_login)}</span></div>
              </div>
            </div>
          </div>
        )}\n      </SlideOver>

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
                <Trash2 size={18} style={{ color: '#EF4444' }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Delete Student</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{deleteTarget.name}</span>
              {' '}({deleteTarget.student_id})? All attendance records will also be removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium"
                style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                style={{ backgroundColor: '#EF4444', color: '#fff' }}
              >
                {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <><Trash2 size={14} /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
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