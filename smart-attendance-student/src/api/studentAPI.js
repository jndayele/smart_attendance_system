import { getToken } from './api';

const API_BASE = 'http://localhost:8000/api/v1';

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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

export const studentAPI = {
  getDashboardData() {
    return request('/student/dashboard/');
  },
  
  getAttendanceTrend() {
    return request('/student/dashboard/attendance-trend');
  },
  
  getLiveSession() {
    return request('/student/dashboard/live-session');
  },
  
  verifySessionCode(sessionId, code) {
    return request('/student/attendance/verify-code', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, code }),
    });
  },
  
  markAttendanceFace(sessionId, faceImageFile) {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('face_image', faceImageFile);
    
    return request('/student/attendance/mark/face', {
      method: 'POST',
      body: formData,
    });
  },
  
  markAttendanceQR(sessionId, qrData) {
    return request('/student/attendance/mark/qr', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, qr_data: qrData }),
    });
  },

  getHistory(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.course_id && params.course_id !== 'all') queryParams.append('course_id', params.course_id);
    if (params.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const queryString = queryParams.toString();
    return request(`/student/attendance/history${queryString ? `?${queryString}` : ''}`);
  },

  getCourseDetails(courseId) {
    return request(`/student/courses/${courseId}`);
  },

  getCourses(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const queryString = queryParams.toString();
    return request(`/student/courses/${queryString ? `?${queryString}` : ''}`);
  }
};
