import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/use-auth'

function StatCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper: string
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{helper}</p>
    </article>
  )
}

export function DashboardPage() {
  const { isAdmin, user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Protected route</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Hello, {user.username}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          This dashboard proves the session flow works end to end: token storage, current user hydration,
          protected navigation, and permission-aware rendering.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="User ID"
          value={String(user.userId)}
          helper="Returned by the backend /auth/me endpoint and used as the current identity anchor."
        />
        <StatCard
          label="Roles"
          value={user.roles.join(', ') || 'None'}
          helper="Roles are useful for future dashboard sections, admin menus, and feature visibility."
        />
        <StatCard
          label="Permissions"
          value={String(user.permissions.length)}
          helper="The frontend currently checks permission flags to unlock admin-only routes."
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Available next steps</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>Add item catalog pages wired to `GET /items`.</li>
            <li>Build booking flows on top of the existing booking status lifecycle.</li>
            <li>Connect review and image management screens after that.</li>
          </ul>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Quick links</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Back home
            </Link>
            {isAdmin ? (
              <Link
                to="/admin"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Open admin area
              </Link>
            ) : null}
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">Resolved permissions</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {user.permissions.map((permission) => (
            <span
              key={permission}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
            >
              {permission}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}
