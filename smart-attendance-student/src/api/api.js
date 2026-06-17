const API_BASE = 'http://localhost:8000/api/v1';

export function getToken() {
  return localStorage.getItem('student_token');
}

export function setToken(token) {
  localStorage.setItem('student_token', token);
}

export function clearToken() {
  localStorage.removeItem('student_token');
}

async function request(endpoint, options = {}, requireAuth = true) {
  const headers = {
    ...options.headers,
  };

  // Only set application/json if we are not sending FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (requireAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch (e) {
    if (!response.ok) {
      throw new Error('Network error or invalid JSON response');
    }
  }

  if (!response.ok) {
    const message = data?.detail || data?.message || 'API Error';
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return data;
}

export const authAPI = {
  checkSetupStatus() {
    return request('/auth/setup-status', { method: 'GET' }, false);
  },
  validateStudentInvitation(token) {
    return request(`/auth/validate-student-invitation?token=${token}`, { method: 'GET' }, false);
  },
  registerStudent(formData) {
    // Note: formData should contain token, password, and face_photo
    return request('/auth/register-student', {
      method: 'POST',
      body: formData,
    }, false);
  },
  login(email, password) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false);
  },
  getMe() {
    return request('/auth/me', { method: 'GET' }, true);
  },
  forgotPassword(email) {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, false);
  }
};
