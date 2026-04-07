import clsx from 'clsx'
import type { ReactNode } from 'react'
import { Link, NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AdminRoute, ProtectedRoute } from './features/auth/route-guards'
import { useAuth } from './features/auth/use-auth'
import { AdminPage } from './pages/admin/admin-page'
import { LoginPage } from './pages/auth/login-page'
import { RegisterPage } from './pages/auth/register-page'
import { DashboardPage } from './pages/dashboard/dashboard-page'
import { HomePage } from './pages/home/home-page'
import { NotFoundPage } from './pages/not-found/not-found-page'

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  clsx(
    'rounded-full px-4 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/15'
      : 'text-slate-600 hover:bg-white hover:text-slate-950',
  )

function RootLayout() {
  const { isAdmin, isAuthenticated, isLoading, logout, user } = useAuth()

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
              PM
            </div>
            <div>
              <p className="text-sm font-semibold">PM Project</p>
              <p className="text-xs text-slate-500">React + Tailwind MVP</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 rounded-full bg-slate-100 p-1 md:flex">
            <NavLink to="/" className={navLinkClassName}>
              Home
            </NavLink>
            <NavLink to="/dashboard" className={navLinkClassName}>
              Dashboard
            </NavLink>
            {isAdmin ? (
              <NavLink to="/admin" className={navLinkClassName}>
                Admin
              </NavLink>
            ) : null}
          </nav>

          <div className="flex items-center gap-3">
            {isLoading ? (
              <span className="text-sm text-slate-500">Loading session...</span>
            ) : isAuthenticated && user ? (
              <>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="text-xs text-slate-500">{user.email ?? 'No email provided'}</p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-slate-900/15 transition hover:bg-slate-800"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}

function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className="py-16 text-center text-slate-500">Checking session...</div>
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route
          path="login"
          element={
            <GuestOnlyRoute>
              <LoginPage />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="register"
          element={
            <GuestOnlyRoute>
              <RegisterPage />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
