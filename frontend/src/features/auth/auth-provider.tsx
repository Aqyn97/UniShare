import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchCurrentUser, loginRequest, registerRequest } from '../../shared/api/auth'
import type { CurrentUser, LoginRequest, RegisterRequest, RegisterResponse } from '../../shared/api/types'
import { AuthContext, type AuthContextValue } from './auth-context'
import { clearStoredToken, getStoredToken, setStoredToken } from './storage'

function hasAdminPermissions(user: CurrentUser | null) {
  if (!user) {
    return false
  }

  return user.permissions.includes('MANAGE_SYSTEM') || user.permissions.includes('MANAGE_CONTENT')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    clearStoredToken()
    setToken(null)
    setUser(null)
    setIsLoading(false)
  }, [])

  const refreshCurrentUser = useCallback(async () => {
    const activeToken = getStoredToken()

    if (!activeToken) {
      setUser(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const { data } = await fetchCurrentUser()
      setUser(data)
    } catch {
      clearStoredToken()
      setToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshCurrentUser()
  }, [token, refreshCurrentUser])

  useEffect(() => {
    const handleUnauthorized = () => {
      logout()
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [logout])

  const login = useCallback(async (payload: LoginRequest) => {
    const { data } = await loginRequest(payload)
    setStoredToken(data.token)
    setToken(data.token)
  }, [])

  const register = useCallback(async (payload: RegisterRequest): Promise<RegisterResponse> => {
    const { data } = await registerRequest(payload)
    return data
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isAdmin: hasAdminPermissions(user),
      isLoading,
      login,
      register,
      logout,
      refreshCurrentUser,
    }),
    [isLoading, login, logout, refreshCurrentUser, register, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
