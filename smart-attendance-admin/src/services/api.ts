import type {
  InstitutionSetupPayload,
  SetupStatusResponse,
  SetupResponse,
  LoginPayload,
  LoginResponse,
  ApiError,
} from '../types/api'

const BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getToken(): string | null {
  return localStorage.getItem('smart_attendance_token')
}

function normalizeError(body: any): string {
  if (!body) return 'An unexpected error occurred.'
  if (typeof body.detail === 'string') return body.detail
  if (Array.isArray(body.detail)) {
    return body.detail
      .map((e: { loc?: string[]; msg?: string }) => {
        const field = e.loc ? e.loc[e.loc.length - 1] : 'field'
        return `${field}: ${e.msg ?? 'invalid'}`
      })
      .join(', ')
  }
  return body.message ?? body.error ?? 'An unexpected error occurred.'
}

async function request<T = any>(
  path: string,
  options: RequestInit & { headers?: Record<string, string> } = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`

  const headers: Record<string, string> = { ...(options.headers ?? {}) }

  // Attach bearer token if present
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // If the body is a string (JSON), set Content-Type — for FormData let the
  // browser handle the multipart boundary automatically.
  if (typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(url, { ...options, headers })

  // 401 — clear auth and redirect
  if (response.status === 401) {
    localStorage.removeItem('smart_attendance_token')
    localStorage.removeItem('smart_attendance_user')
    window.location.href = '/login'
    // Throw to abort execution; redirect is async so this prevents further
    // processing of the stale response.
    const err: ApiError = { message: 'Session expired. Please log in again.', status: 401 }
    return Promise.reject(err)
  }

  // Parse response body (always attempt JSON)
  let body: any
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    try { body = await response.json() } catch { body = null }
  } else {
    body = null
  }

  if (!response.ok) {
    const message = normalizeError(body)
    const err: ApiError = { message, status: response.status, raw: body }
    return Promise.reject(err)
  }

  return body as T
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export const authApi = {
  checkSetupStatus: (): Promise<SetupStatusResponse> =>
    request<SetupStatusResponse>('/auth/setup-status', { method: 'GET' }),

  setup: (payload: InstitutionSetupPayload): Promise<SetupResponse> => {
    const formData = new FormData()
    formData.append('institution_name', payload.institution_name)
    formData.append('shortcode', payload.shortcode.toUpperCase())
    formData.append('tagline', payload.tagline)
    formData.append('country', payload.country)
    formData.append('timezone', payload.timezone)
    formData.append('accent_color', payload.accent_color)
    formData.append('admin_name', payload.admin_name)
    formData.append('admin_email', payload.admin_email)
    formData.append('academic_year', payload.academic_year)
    formData.append('current_semester', payload.current_semester)
    if (payload.logo instanceof File) {
      formData.append('logo', payload.logo)
    }
    return request<SetupResponse>('/auth/setup', { method: 'POST', body: formData })
  },

  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    })
    localStorage.setItem('smart_attendance_token', response.access_token)
    localStorage.setItem(
      'smart_attendance_user',
      JSON.stringify({
        user_id: response.user_id,
        role: response.role,
        name: response.name,
      })
    )
    return response
  },

  logout: (): void => {
    localStorage.removeItem('smart_attendance_token')
    localStorage.removeItem('smart_attendance_user')
  },

  forgotPassword: (email: string): Promise<{ message: string }> =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: { 'Content-Type': 'application/json' },
    }),

  resetPassword: (
    token: string,
    new_password: string
  ): Promise<{ message: string }> =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password }),
      headers: { 'Content-Type': 'application/json' },
    }),

  getMe: () => request('/auth/me', { method: 'GET' }),

  isAuthenticated: (): boolean =>
    !!localStorage.getItem('smart_attendance_token'),

  getCurrentUser: () => {
    const user = localStorage.getItem('smart_attendance_user')
    return user ? JSON.parse(user) : null
  },
}
