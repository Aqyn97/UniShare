import { createContext } from 'react'
import type { CurrentUser, LoginRequest, RegisterRequest } from '../../shared/api/types'

export interface AuthContextValue {
  user: CurrentUser | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  login: (payload: LoginRequest) => Promise<void>
  register: (payload: RegisterRequest) => Promise<void>
  logout: () => void
  refreshCurrentUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
