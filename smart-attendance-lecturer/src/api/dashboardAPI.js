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
  /** GET /api/v1/lecturer/dashboard/ — full payload */
  getDashboard() {
    return authRequest('/lecturer/dashboard/');
  },
  /** GET /api/v1/lecturer/dashboard/stats — lightweight stats only */
  getStats() {
    return authRequest('/lecturer/dashboard/stats');
  },
};

// ── Sessions ─────────────────────────────────────────────────────────────────

export const sessionsAPI = {
  /**
   * GET /api/v1/lecturer/sessions/history
   * Returns { grouped_by_course[], sessions[], total, page }
   * Supports optional filters: course_id, date_from, date_to, status
   */
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
};

// ── Courses (for filter dropdown) ────────────────────────────────────────────

export const coursesAPI = {
  /** GET /api/v1/lecturer/courses/ — list of lecturer's courses */
  getMyCourses() {
    return authRequest('/lecturer/courses/');
  },
};
