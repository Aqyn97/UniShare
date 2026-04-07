export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface AuthTokenResponse {
  token: string
}

export interface RegisterResponse extends AuthTokenResponse {
  message: string
  username: string
  email: string
}

export interface CurrentUser {
  userId: number
  username: string
  email: string | null
  enabled: boolean
  roles: string[]
  permissions: string[]
}

export interface ApiErrorResponse {
  code?: string
  message?: string
  details?: unknown
  error?: string
}
