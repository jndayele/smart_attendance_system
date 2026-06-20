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
