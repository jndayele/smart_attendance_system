const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

async function request(endpoint, options = {}, requireAuth = false) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (requireAuth) {
    const token = localStorage.getItem('lecturer_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const data = await response.json();
      errorMsg = data.detail || errorMsg;
    } catch (e) {
      // JSON parse failed
    }
    throw new Error(errorMsg);
  }
  
  return response.json();
}

export const authAPI = {
  activateLecturer(token, password) {
    return request('/auth/activate-lecturer', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  login(email, password) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  forgotPassword(email) {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword(token, newPassword) {
    return request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  },
  
  getMe() {
    return request('/auth/me', { method: 'GET' }, true);
  },

  getPublicSettings() {
    return request('/auth/setup-status', { method: 'GET' });
  }
};

export const profileAPI = {
  getProfile() {
    return request('/lecturer/profile', { method: 'GET' }, true);
  },
  
  changePassword(currentPassword, newPassword) {
    return request('/lecturer/profile/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    }, true);
  },

  getNotificationPreferences() {
    return request('/lecturer/profile/notification-preferences', { method: 'GET' }, true);
  },

  updateNotificationPreferences(prefs) {
    return request('/lecturer/profile/notification-preferences', {
      method: 'PATCH',
      body: JSON.stringify(prefs),
    }, true);
  },

  getGeneralPreferences() {
    return request('/lecturer/profile/preferences', { method: 'GET' }, true);
  },

  updateGeneralPreferences(prefs) {
    return request('/lecturer/profile/preferences', {
      method: 'PATCH',
      body: JSON.stringify(prefs),
    }, true);
  }
};
