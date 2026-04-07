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
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">UniShare dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Welcome, {user.username}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          This area is the personal workspace for managing listings, rental activity, and account access inside
          the campus marketplace.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Member ID"
          value={String(user.userId)}
          helper="Your unique UniShare account identifier used to keep marketplace activity linked to the right user."
        />
        <StatCard
          label="Roles"
          value={user.roles.join(', ') || 'None'}
          helper="Roles control which marketplace sections and moderation tools are available to your account."
        />
        <StatCard
          label="Access rules"
          value={String(user.permissions.length)}
          helper="Permission flags define which protected UniShare actions and admin screens can be opened."
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Platform goals</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>Manage personal item listings for books, electronics, tools, and other useful resources.</li>
            <li>Track rental requests and booking activity between students.</li>
            <li>Support reviews and ratings that improve trust within the university community.</li>
          </ul>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Quick links</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Back to home
            </Link>
            {isAdmin ? (
              <Link
                to="/admin"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Open admin panel
              </Link>
            ) : null}
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">Account permissions</h2>
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
