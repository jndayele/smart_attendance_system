export interface InstitutionSetupPayload {
  institution_name: string
  shortcode: string
  tagline: string
  country: string
  timezone: string
  accent_color: string
  admin_name: string
  admin_email: string
  academic_year: string
  current_semester: string
  logo?: File | null
}

export interface SetupStatusResponse {
  is_setup: boolean
  institution_name: string | null
}

export interface SetupResponse {
  message: string
  institution_id: string
  admin_email: string
  setup_complete: boolean
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  role: string
  user_id: string
  name: string
}

export interface ApiError {
  message: string
  status: number
  raw?: any
}
