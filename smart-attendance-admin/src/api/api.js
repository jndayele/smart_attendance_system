/**
 * api.js — Central API client for Smart Attendance Admin
 * Backend base URL: http://localhost:8000
 * All requests go to /api/v1/...
 */

const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1`;
const TOKEN_KEY = 'sas_token';

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

/**
 * Makes an HTTP request to the backend.
 * @param {string} path - Endpoint path e.g. '/auth/login'
 * @param {object} options - fetch options override
 * @param {boolean} withAuth - Attach JWT Bearer token (default: false)
 * @returns {Promise<any>} Parsed JSON response
 */
async function request(path, options = {}, withAuth = false) {
  const headers = {
    ...options.headers,
  };

  // Don't set Content-Type for FormData — browser sets it with boundary
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (withAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store', // Prevent stale data across navigation
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    // Extract meaningful error message from backend
    const detail = data?.detail;
    let message = 'An unexpected error occurred.';
    if (typeof detail === 'string') {
      message = detail;
    } else if (Array.isArray(detail) && detail[0]?.msg) {
      message = detail.map((e) => e.msg).join(', ');
    } else if (data?.message) {
      message = data.message;
    }
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Downloads a file from the backend and triggers browser download.
 * @param {string} path - Endpoint path
 * @param {string} filename - Fallback filename
 */
async function downloadFile(path, filename) {
  const headers = {};
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { headers });
  if (!response.ok) {
    let message = 'Failed to download file.';
    try {
      const data = await response.json();
      message = data.detail || message;
    } catch (e) {}
    throw new Error(message);
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get('Content-Disposition');
  let actualFilename = filename;
  if (contentDisposition && contentDisposition.includes('filename=')) {
    const matches = /filename="([^"]+)"/.exec(contentDisposition);
    if (matches != null && matches[1]) { 
      actualFilename = matches[1];
    } else {
      const fallbackMatches = /filename=([^;]+)/.exec(contentDisposition);
      if (fallbackMatches != null && fallbackMatches[1]) {
        actualFilename = fallbackMatches[1];
      }
    }
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = actualFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authAPI = {
  /**
   * Check if the institution has been set up.
   * GET /auth/setup-status
   * Returns: { is_setup: boolean, institution_name: string | null }
   */
  checkSetupStatus() {
    return request('/auth/setup-status', { method: 'GET' });
  },

  /**
   * Submit initial institution setup (multipart/form-data).
   * POST /auth/setup
   * @param {FormData} formData - All setup fields + optional logo file
   * Returns: { message, institution_id, admin_email, setup_complete }
   */
  setup(formData) {
    return request('/auth/setup', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Log in with email and password.
   * POST /auth/login
   * @param {string} email
   * @param {string} password
   * Returns: { access_token, role, user_id, name }
   */
  login(email, password) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Get current authenticated user's profile.
   * GET /auth/me — requires Bearer token
   * Returns: { user_id, email, role, name }
   */
  me() {
    return request('/auth/me', { method: 'GET' }, true);
  },

  /**
   * Request a password reset email.
   * POST /auth/forgot-password
   * @param {string} email
   * Returns: { message }
   */
  forgotPassword(email) {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Reset password using token from email link.
   * POST /auth/reset-password
   * @param {string} token - From URL ?token=xxx
   * @param {string} newPassword
   * Returns: { message }
   */
  resetPassword(token, newPassword) {
    return request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  },
};

// ─── Institution API ──────────────────────────────────────────────────────────

export const institutionAPI = {
  /**
   * Get institution details (logo, shortcode, accent color, etc.)
   * GET /admin/institution/ — requires Bearer token
   * Returns: InstitutionResponse schema
   */
  get() {
    return request('/admin/institution/', { method: 'GET' }, true);
  },

  /**
   * Update institution info and/or logo.
   * Always uses multipart/form-data because the backend uses Form() + File() params.
   * @param {{ name?: string, admin_name?: string, admin_email?: string }} fields
   * @param {File|null} logoFile - optional logo file
   */
  updateInstitution(fields = {}, logoFile = null) {
    const token = getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const fd = new FormData();
    if (fields.name) fd.append('name', fields.name);
    if (fields.admin_name) fd.append('admin_name', fields.admin_name);
    if (fields.admin_email) fd.append('admin_email', fields.admin_email);
    if (logoFile) fd.append('logo', logoFile);

    return fetch(`${BASE_URL}/admin/institution/`, {
      method: 'PATCH',
      headers,  // DO NOT set Content-Type — browser sets it with boundary automatically
      body: fd,
    }).then(async res => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Failed to update institution');
      return data;
    });
  },

  /**
   * Get system settings
   * GET /admin/institution/settings
   */
  getSettings() {
    return request('/admin/institution/settings', { method: 'GET' }, true);
  },

  /**
   * Update system settings (session config + face config)
   * PATCH /admin/institution/settings
   */
  updateSettings(data) {
    return request('/admin/institution/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  },

  /**
   * Get notification settings
   * GET /admin/institution/settings/notifications
   */
  getNotificationSettings() {
    return request('/admin/institution/settings/notifications', { method: 'GET' }, true);
  },

  /**
   * Update notification settings
   * PATCH /admin/institution/settings/notifications
   */
  updateNotificationSettings(data) {
    return request('/admin/institution/settings/notifications', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  },

  /**
   * Change admin password
   * PATCH /admin/institution/admin/password
   */
  changePassword(data) {
    return request('/admin/institution/admin/password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  },

  /**
   * Get audit trail logs
   * GET /admin/institution/audit-trail
   */
  getAuditTrail(params = {}) {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.limit) qs.set('limit', params.limit);
    if (params.action_type) qs.set('action_type', params.action_type);
    const query = qs.toString() ? `?${qs}` : '';
    return request(`/admin/institution/audit-trail${query}`, { method: 'GET' }, true);
  },

  /**
   * Get dashboard statistics
   * GET /admin/institution/dashboard/stats
   * Returns: DashboardStatsResponse
   */
  getDashboardStats() {
    return request('/admin/institution/dashboard/stats', { method: 'GET' }, true);
  },

  /**
   * Get dashboard charts data
   * GET /admin/institution/dashboard/charts
   * Returns: { weekly_attendance_trend, attendance_by_department, present_absent_today, lowest_attendance_courses }
   */
  getDashboardCharts() {
    return request('/admin/institution/dashboard/charts', { method: 'GET' }, true);
  },
};

// ─── Admin API ────────────────────────────────────────────────────────────────

export const departmentsAPI = {
  /**
   * List all departments
   * GET /admin/departments/
   * Returns: { departments, total }
   */
  list(params = {}) {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.limit) qs.set('limit', params.limit);
    if (params.search) qs.set('search', params.search);
    const query = qs.toString() ? `?${qs}` : '';
    return request(`/admin/departments/${query}`, { method: 'GET' }, true);
  },

  /**
   * Create a new department
   * POST /admin/departments/
   */
  create(data) {
    return request('/admin/departments/', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  /**
   * Update a department
   * PATCH /admin/departments/{id}
   */
  update(id, data) {
    return request(`/admin/departments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  },

  /**
   * Delete a department
   * DELETE /admin/departments/{id}
   */
  delete(id) {
    return request(`/admin/departments/${id}`, { method: 'DELETE' }, true);
  },

  /**
   * Activate a department
   * PATCH /admin/departments/{id}/activate
   */
  activate(id) {
    return request(`/admin/departments/${id}/activate`, { method: 'PATCH' }, true);
  },

  /**
   * Deactivate a department
   * PATCH /admin/departments/{id}/deactivate
   */
  deactivate(id) {
    return request(`/admin/departments/${id}/deactivate`, { method: 'PATCH' }, true);
  },
};

export const programmesAPI = {
  /**
   * List all programmes
   * GET /admin/programmes/
   * Returns: { programmes, total }
   */
  list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = qs ? `/admin/programmes/?${qs}` : '/admin/programmes/';
    return request(url, { method: 'GET' }, true);
  },

  /**
   * Create a new programme
   * POST /admin/programmes/
   */
  create(data) {
    return request('/admin/programmes/', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  /**
   * Update a programme
   * PATCH /admin/programmes/{id}
   */
  update(id, data) {
    return request(`/admin/programmes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  },

  /**
   * Delete a programme
   * DELETE /admin/programmes/{id}
   */
  delete(id) {
    return request(`/admin/programmes/${id}`, { method: 'DELETE' }, true);
  },

  /**
   * Deactivate a programme
   * PATCH /admin/programmes/{id}/deactivate
   */
  deactivate(id) {
    return request(`/admin/programmes/${id}/deactivate`, { method: 'PATCH' }, true);
  },
};

export const coursesAPI = {
  /**
   * List all courses
   * GET /admin/courses/
   */
  list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = qs ? `/admin/courses/?${qs}` : '/admin/courses/';
    return request(url, { method: 'GET' }, true);
  },

  /**
   * Create a new course
   * POST /admin/courses/
   */
  create(data) {
    return request('/admin/courses/', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  /**
   * Update a course
   * PATCH /admin/courses/{id}
   */
  update(id, data) {
    return request(`/admin/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  },

  /**
   * Delete a course
   * DELETE /admin/courses/{id}
   */
  delete(id) {
    return request(`/admin/courses/${id}`, { method: 'DELETE' }, true);
  },

  /**
   * Get sessions for a course
   * GET /admin/courses/{id}/sessions
   */
  getSessions(id) {
    return request(`/admin/courses/${id}/sessions`, { method: 'GET' }, true);
  },
};

export const lecturersAPI = {
  /**
   * List all lecturers
   * GET /admin/lecturers/
   */
  list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = qs ? `/admin/lecturers/?${qs}` : '/admin/lecturers/';
    return request(url, { method: 'GET' }, true);
  },

  /** GET /admin/lecturers/{id} */
  get(id) {
    return request(`/admin/lecturers/${id}`, { method: 'GET' }, true);
  },

  /** POST /admin/lecturers/ */
  create(data) {
    return request('/admin/lecturers/', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  /** DELETE /admin/lecturers/{id} */
  delete(id) {
    return request(`/admin/lecturers/${id}`, { method: 'DELETE' }, true);
  },

  /** POST /admin/lecturers/{id}/suspend */
  suspend(id) {
    return request(`/admin/lecturers/${id}/suspend`, { method: 'POST' }, true);
  },

  /** POST /admin/lecturers/{id}/reactivate */
  reactivate(id) {
    return request(`/admin/lecturers/${id}/reactivate`, { method: 'POST' }, true);
  },

  /** POST /admin/lecturers/{id}/reset-password */
  resetPassword(id) {
    return request(`/admin/lecturers/${id}/reset-password`, { method: 'POST' }, true);
  },

  /** POST /admin/lecturers/{id}/resend-activation */
  resendActivation(id) {
    return request(`/admin/lecturers/${id}/resend-activation`, { method: 'POST' }, true);
  },

  /** GET /admin/lecturers/{id}/courses */
  getCourses(id) {
    return request(`/admin/lecturers/${id}/courses`, { method: 'GET' }, true);
  },
};

export const academicYearsAPI = {
  /** GET /admin/academic-years/ */
  list() {
    return request('/admin/academic-years/', { method: 'GET' }, true);
  },

  /** GET /admin/academic-years/active */
  getActive() {
    return request('/admin/academic-years/active', { method: 'GET' }, true);
  },

  /** POST /admin/academic-years/ */
  create(data) {
    return request('/admin/academic-years/', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  /** POST /admin/academic-years/{yearId}/semesters */
  createSemester(yearId, data) {
    return request(`/admin/academic-years/${yearId}/semesters`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  /** PATCH /admin/academic-years/{yearId}/semesters/{semId} */
  updateSemester(yearId, semId, data) {
    return request(`/admin/academic-years/${yearId}/semesters/${semId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  },

  /** POST /admin/academic-years/{yearId}/semesters/{semId}/close */
  closeSemester(yearId, semId) {
    return request(`/admin/academic-years/${yearId}/semesters/${semId}/close`, {
      method: 'POST',
      body: JSON.stringify({ confirm: 'CONFIRM' }),
    }, true);
  },

  /** DELETE /admin/academic-years/{yearId}/semesters/{semId} */
  deleteSemester(yearId, semId) {
    return request(`/admin/academic-years/${yearId}/semesters/${semId}`, { method: 'DELETE' }, true);
  },

  /** DELETE /admin/academic-years/{yearId} */
  deleteYear(yearId) {
    return request(`/admin/academic-years/${yearId}`, { method: 'DELETE' }, true);
  },
};

export const studentsAPI = {
  /** GET /admin/students/ */
  list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = qs ? `/admin/students/?${qs}` : '/admin/students/';
    return request(url, { method: 'GET' }, true);
  },

  /** GET /admin/students/{id} */
  get(id) {
    return request(`/admin/students/${id}`, { method: 'GET' }, true);
  },

  /** POST /admin/students/ */
  create(data) {
    return request('/admin/students/', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  /** POST /admin/students/bulk-import */
  bulkImport(data) {
    return request('/admin/students/bulk-import', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  /** DELETE /admin/students/{id} */
  delete(id) {
    return request(`/admin/students/${id}`, { method: 'DELETE' }, true);
  },

  /** POST /admin/students/{id}/suspend */
  suspend(id) {
    return request(`/admin/students/${id}/suspend`, { method: 'POST' }, true);
  },

  /** POST /admin/students/{id}/reactivate */
  reactivate(id) {
    return request(`/admin/students/${id}/reactivate`, { method: 'POST' }, true);
  },

  /** POST /admin/students/{id}/resend-invitation */
  resendInvitation(id) {
    return request(`/admin/students/${id}/resend-invitation`, { method: 'POST' }, true);
  },

  /** POST /admin/students/{id}/move-level */
  moveLevel(id, newLevel) {
    return request(`/admin/students/${id}/move-level`, {
      method: 'POST',
      body: JSON.stringify({ new_level: newLevel }),
    }, true);
  },

  /** POST /admin/students/attendance/override */
  overrideAttendance(data) {
    return request('/admin/students/attendance/override', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  },

  /** GET /admin/students/levels */
  getLevels() {
    return request('/admin/students/levels', { method: 'GET' }, true);
  },
};

export const reportsAPI = {
  getDefaulters() {
    return request('/admin/reports/defaulters', { method: 'GET' }, true);
  },
  sendThresholdWarnings() {
    return request('/admin/reports/notifications/send-threshold-warnings', { method: 'POST' }, true);
  },
  downloadInstitutionReport(format) {
    const ext = format.toLowerCase();
    // Use fallback name, server Content-Disposition takes precedence
    return downloadFile(`/admin/reports/institution/${ext}`, `institution_attendance.${ext === 'excel' ? 'xlsx' : ext}`);
  },
  downloadDepartmentReport(id, format) {
    const ext = format.toLowerCase();
    return downloadFile(`/admin/reports/department/${id}/${ext}`, `department_attendance.${ext === 'excel' ? 'xlsx' : ext}`);
  },
  downloadCourseReport(id, format) {
    const ext = format.toLowerCase();
    return downloadFile(`/admin/reports/course/${id}/${ext}`, `course_attendance.${ext === 'excel' ? 'xlsx' : ext}`);
  },
  downloadStudentReport(id, format) {
    const ext = format.toLowerCase(); // only pdf is supported for student
    return downloadFile(`/admin/reports/student/${id}/${ext}`, `student_report.${ext}`);
  },
  downloadDefaultersReport(format) {
    const ext = format.toLowerCase();
    return downloadFile(`/admin/reports/defaulters/${ext}`, `defaulters.${ext === 'excel' ? 'xlsx' : ext}`);
  },
  downloadLecturerActivityReport(format) {
    const ext = format.toLowerCase();
    return downloadFile(`/admin/reports/lecturers/activity/${ext}`, `lecturer_activity.${ext === 'excel' ? 'xlsx' : ext}`);
  }
};
