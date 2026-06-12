import { useState, useCallback } from 'react'
import { authApi } from '../services/api'
import type { InstitutionSetupPayload, ApiError } from '../types/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SetupFormData {
  institutionName: string
  shortcode: string
  tagline: string
  country: string
  timezone: string
  logo: File | null
  logoPreview: string | null
  accentColor: string
  adminName: string
  adminEmail: string
  academicYear: string
  currentSemester: string
}

export type SetupFieldErrors = Partial<Record<keyof SetupFormData, string>>

const DEFAULT_FORM: SetupFormData = {
  institutionName: '',
  shortcode: '',
  tagline: '',
  country: '',
  timezone: 'Africa/Accra',
  logo: null,
  logoPreview: null,
  accentColor: '#F59E0B',
  adminName: '',
  adminEmail: '',
  academicYear: '',
  currentSemester: 'Semester 1',
}

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HEX_RE = /^#[0-9A-Fa-f]{6}$/
const YEAR_RE = /^\d{4}\/\d{4}$/

function validateStep1(f: SetupFormData): SetupFieldErrors {
  const errs: SetupFieldErrors = {}
  if (!f.institutionName.trim() || f.institutionName.trim().length < 2)
    errs.institutionName = 'Institution name must be at least 2 characters.'
  const sc = f.shortcode.trim()
  if (!sc || sc.length < 2 || sc.length > 20)
    errs.shortcode = 'Shortcode must be 2–20 characters.'
  if (!f.tagline.trim() || f.tagline.trim().length < 5)
    errs.tagline = 'Tagline must be at least 5 characters.'
  if (!f.country.trim())
    errs.country = 'Country is required.'
  if (!f.timezone.trim())
    errs.timezone = 'Timezone is required.'
  return errs
}

function validateStep2(f: SetupFormData): SetupFieldErrors {
  const errs: SetupFieldErrors = {}
  if (!HEX_RE.test(f.accentColor))
    errs.accentColor = 'Accent color must be a valid hex color (e.g. #F59E0B).'
  if (f.logo) {
    if (f.logo.size > 5 * 1024 * 1024)
      errs.logo = 'Logo must be 5 MB or less.'
    if (!f.logo.type.startsWith('image/'))
      errs.logo = 'Logo must be an image file.'
  }
  return errs
}

function validateStep3(f: SetupFormData): SetupFieldErrors {
  const errs: SetupFieldErrors = {}
  if (!f.adminName.trim() || f.adminName.trim().length < 2)
    errs.adminName = 'Administrator name must be at least 2 characters.'
  if (!EMAIL_RE.test(f.adminEmail.trim()))
    errs.adminEmail = 'Enter a valid email address.'
  if (!YEAR_RE.test(f.academicYear)) {
    errs.academicYear = 'Academic year must be in YYYY/YYYY format.'
  } else {
    const [y1, y2] = f.academicYear.split('/').map(Number)
    if (y2 !== y1 + 1)
      errs.academicYear = 'Second year must be exactly one more than the first.'
    if (y1 < 2000 || y1 > 2100)
      errs.academicYear = 'First year must be between 2000 and 2100.'
  }
  if (f.currentSemester !== 'Semester 1' && f.currentSemester !== 'Semester 2')
    errs.currentSemester = 'Semester must be "Semester 1" or "Semester 2".'
  return errs
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSetup() {
  const [formData, setFormData] = useState<SetupFormData>(DEFAULT_FORM)
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<SetupFieldErrors>({})

  const updateField = useCallback(
    <K extends keyof SetupFormData>(key: K, value: SetupFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }))
      // Clear field-level error on edit
      setErrors((prev) => {
        if (!prev[key]) return prev
        const next = { ...prev }
        delete next[key]
        return next
      })
    },
    []
  )

  const clearError = useCallback(() => setError(null), [])

  const handleLogoUpload = useCallback((file: File | null) => {
    if (!file) {
      setFormData((prev) => ({ ...prev, logo: null, logoPreview: null }))
      return
    }
    const fieldErrors: SetupFieldErrors = {}
    if (!file.type.startsWith('image/')) {
      fieldErrors.logo = 'Logo must be an image file.'
      setErrors((prev) => ({ ...prev, ...fieldErrors }))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      fieldErrors.logo = 'Logo must be 5 MB or less.'
      setErrors((prev) => ({ ...prev, ...fieldErrors }))
      return
    }
    const preview = URL.createObjectURL(file)
    setFormData((prev) => ({ ...prev, logo: file, logoPreview: preview }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.logo
      return next
    })
  }, [])

  const nextStep = useCallback((): boolean => {
    let stepErrors: SetupFieldErrors = {}
    if (currentStep === 1) stepErrors = validateStep1(formData)
    else if (currentStep === 2) stepErrors = validateStep2(formData)
    else if (currentStep === 3) stepErrors = validateStep3(formData)

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return false
    }
    setErrors({})
    setCurrentStep((s) => Math.min(s + 1, 4))
    return true
  }, [currentStep, formData])

  const prevStep = useCallback(() => {
    setErrors({})
    setCurrentStep((s) => Math.max(s - 1, 1))
  }, [])

  const goToStep = useCallback((step: number) => {
    setErrors({})
    setCurrentStep(Math.min(Math.max(step, 1), 4))
  }, [])

  const submitSetup = useCallback(async (): Promise<boolean> => {
    // Re-validate step 3 fields before submitting
    const stepErrors = validateStep3(formData)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return false
    }

    setIsLoading(true)
    setError(null)

    const payload: InstitutionSetupPayload = {
      institution_name: formData.institutionName.trim(),
      shortcode: formData.shortcode.trim().toUpperCase(),
      tagline: formData.tagline.trim(),
      country: formData.country.trim(),
      timezone: formData.timezone,
      accent_color: formData.accentColor,
      admin_name: formData.adminName.trim(),
      admin_email: formData.adminEmail.trim(),
      academic_year: formData.academicYear.trim(),
      current_semester: formData.currentSemester,
      logo: formData.logo,
    }

    try {
      await authApi.setup(payload)
      setIsLoading(false)
      // Navigation to /login?setup=complete is handled by the calling component
      return true
    } catch (err) {
      setIsLoading(false)
      const apiError = err as ApiError
      setError(apiError.message ?? 'Setup failed. Please try again.')
      return false
    }
  }, [formData])

  return {
    formData,
    currentStep,
    isLoading,
    error,
    errors,
    updateField,
    handleLogoUpload,
    nextStep,
    prevStep,
    goToStep,
    submitSetup,
    clearError,
  }
}
