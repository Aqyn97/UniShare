import { apiClient } from './client'
import type {
  ApiMessageResponse,
  AuthTokenResponse,
  CurrentUser,
  EmailRequest,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
} from './types'

export function loginRequest(payload: LoginRequest) {
  return apiClient.post<AuthTokenResponse>('/auth/login', payload)
}

export function registerRequest(payload: RegisterRequest) {
  return apiClient.post<RegisterResponse>('/auth/register', payload)
}

export function verifyEmailRequest(token: string) {
  return apiClient.post<ApiMessageResponse>(`/auth/verify-email?token=${encodeURIComponent(token)}`)
}

export function resendVerificationRequest(payload: EmailRequest) {
  return apiClient.post<ApiMessageResponse>('/auth/resend-verification', payload)
}

export function forgotPasswordRequest(payload: EmailRequest) {
  return apiClient.post<ApiMessageResponse>('/auth/forgot-password', payload)
}

export function resetPasswordRequest(payload: ResetPasswordRequest) {
  return apiClient.post<ApiMessageResponse>('/auth/reset-password', payload)
}

export function fetchCurrentUser() {
  return apiClient.get<CurrentUser>('/auth/me')
}
