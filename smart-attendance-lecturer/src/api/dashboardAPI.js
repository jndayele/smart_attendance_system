const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

async function authRequest(endpoint) {
  const token = localStorage.getItem('lecturer_token');
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    let msg = 'Request failed';
    try { msg = (await res.json()).detail || msg; } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardAPI = {
  getDashboard() {
    return authRequest('/lecturer/dashboard/');
  },
  getStats() {
    return authRequest('/lecturer/dashboard/stats');
  },
};

// ── Sessions ─────────────────────────────────────────────────────────────────

export const sessionsAPI = {
  getHistory({ courseId, dateFrom, dateTo, status, page = 1, limit = 100 } = {}) {
    const params = new URLSearchParams();
    if (courseId) params.set('course_id', courseId);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo)   params.set('date_to',   dateTo);
    if (status)   params.set('status',    status);
    params.set('page',  String(page));
    params.set('limit', String(limit));
    return authRequest(`/lecturer/sessions/history?${params.toString()}`);
  },
  
  bulkOverrideAttendance(sessionId, { student_ids, status, reason }) {
    const token = localStorage.getItem('lecturer_token');
    return fetch(`${API_BASE_URL}/lecturer/sessions/${sessionId}/attendance/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ student_ids, status, reason })
    }).then(async res => {
      if (!res.ok) {
        let msg = 'Bulk override failed';
        try { msg = (await res.json()).detail || msg; } catch (_) {}
        throw new Error(msg);
      }
      return res.json();
    });
  }
};
// ── Active Sessions ───────────────────────────────────────────────────────────

export const activeSessionAPI = {
  /** Fetch lecturer QR preferences + admin default expiry */
  getPreferences() {
    return authRequest('/lecturer/profile/preferences');
  },

  /** Create + start a new session. Returns ActiveSessionResponse with qr_image_base64. */
  createSession({ course_id, label, qr_expiry_minutes, session_date }) {
    const token = localStorage.getItem('lecturer_token');
    return fetch(`${API_BASE_URL}/lecturer/sessions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ course_id, label, qr_expiry_minutes, session_date }),
    }).then(async res => {
      if (!res.ok) {
        let msg = 'Failed to create session';
        try { msg = (await res.json()).detail || msg; } catch (_) {}
        throw new Error(msg);
      }
      return res.json();
    });
  },

  /** Poll the current active session state (QR, checked-in students, expiry). */
  getActiveSession(courseId) {
    const qs = courseId ? `?course_id=${courseId}` : '';
    return authRequest(`/lecturer/sessions/active${qs}`);
  },

  /** Refresh the QR code for an active session. Returns QRRefreshResponse. */
  refreshQR(sessionId) {
    const token = localStorage.getItem('lecturer_token');
    return fetch(`${API_BASE_URL}/lecturer/sessions/${sessionId}/refresh-qr`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    }).then(async res => {
      if (!res.ok) {
        let msg = 'Failed to refresh QR';
        try { msg = (await res.json()).detail || msg; } catch (_) {}
        throw new Error(msg);
      }
      return res.json();
    });
  },

  /** End the session. Returns SessionEndResponse with full attendance breakdown. */
  endSession(sessionId) {
    const token = localStorage.getItem('lecturer_token');
    return fetch(`${API_BASE_URL}/lecturer/sessions/${sessionId}/end`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    }).then(async res => {
      if (!res.ok) {
        let msg = 'Failed to end session';
        try { msg = (await res.json()).detail || msg; } catch (_) {}
        throw new Error(msg);
      }
      return res.json();
    });
  },
};

// ── Courses ──────────────────────────────────────────────────────────────────

export const coursesAPI = {
  bulkSendWarnings(courseId, { student_ids }) {
    const token = localStorage.getItem('lecturer_token');
    return fetch(`${API_BASE_URL}/lecturer/courses/${courseId}/students/bulk-warn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ student_ids })
    }).then(async res => {
      if (!res.ok) {
        let msg = 'Failed to send warnings';
        try { msg = (await res.json()).detail || msg; } catch (_) {}
        throw new Error(msg);
      }
      return res.json();
    });
  },

  getMyCourses({ search, isActive, page = 1, limit = 50 } = {}) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (isActive !== undefined) params.set('is_active', isActive);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return authRequest(`/lecturer/courses/?${params.toString()}`);
  },
  
  getCourseDetail(courseId) {
    return authRequest(`/lecturer/courses/${courseId}`);
  },
  
  getCourseStudents(courseId, { search, status, page = 1, limit = 50 } = {}) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return authRequest(`/lecturer/courses/${courseId}/students?${params.toString()}`);
  },
  
  getStudentAttendance(courseId, studentId) {
    return authRequest(`/lecturer/courses/${courseId}/students/${studentId}/attendance`);
  }
};

// ── Reports ──────────────────────────────────────────────────────────────────

export const reportsAPI = {
  getOverview() {
    return authRequest('/lecturer/reports/overview');
  },
  
  getDefaulters(courseId) {
    const qs = courseId && courseId !== 'all' ? `?course_id=${courseId}` : '';
    return authRequest(`/lecturer/reports/defaulters${qs}`);
  },
  
  async downloadCourseReport(courseId, format = 'pdf') {
    return this._downloadFile(`/lecturer/reports/course/${courseId}/${format}`, `course_report.${format === 'excel' ? 'xlsx' : 'pdf'}`);
  },
  
  async downloadStudentReport(courseId, studentId, format = 'pdf') {
    return this._downloadFile(`/lecturer/reports/course/${courseId}/student/${studentId}/export?format=${format}`, `student_${studentId}_report.${format === 'excel' ? 'xlsx' : 'pdf'}`);
  },
  
  async downloadDefaultersReport(courseId, format = 'pdf') {
    const qs = `?format=${format}${courseId && courseId !== 'all' ? `&course_id=${courseId}` : ''}`;
    return this._downloadFile(`/lecturer/reports/defaulters/export${qs}`, `defaulters_report.${format === 'excel' ? 'xlsx' : 'pdf'}`);
  },

  async _downloadFile(path, defaultFilename) {
    const token = localStorage.getItem('lecturer_token');
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    });
    if (!res.ok) throw new Error('Failed to download report');
    
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
};
