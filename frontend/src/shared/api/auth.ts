import { apiClient } from './client'
import type {
  AuthTokenResponse,
  CurrentUser,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
} from './types'

export function loginRequest(payload: LoginRequest) {
  return apiClient.post<AuthTokenResponse>('/auth/login', payload)
}

export function registerRequest(payload: RegisterRequest) {
  return apiClient.post<RegisterResponse>('/auth/register', payload)
}

export function fetchCurrentUser() {
  return apiClient.get<CurrentUser>('/auth/me')
}
