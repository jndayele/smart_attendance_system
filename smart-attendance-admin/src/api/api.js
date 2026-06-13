/**
 * api.js — Central API client for Smart Attendance Admin
 * Backend base URL: http://localhost:8000
 * All requests go to /api/v1/...
 */

const BASE_URL = 'http://localhost:8000/api/v1';
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
};
