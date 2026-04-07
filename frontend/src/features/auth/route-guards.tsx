import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './use-auth'

function GuardFallback({ message }: { message: string }) {
  return <div className="py-16 text-center text-slate-500">{message}</div>
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <GuardFallback message="Loading protected page..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <GuardFallback message="Checking access..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
