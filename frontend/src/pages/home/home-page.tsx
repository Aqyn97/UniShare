import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/use-auth'

const features = [
  {
    title: 'Verified student access',
    description: 'UniShare supports secure sign-in so only trusted university members can join the marketplace.',
    icon: 'U',
  },
  {
    title: 'Listings and discovery',
    description: 'Students can publish textbooks, electronics, tools, and other items for short-term campus rentals.',
    icon: 'L',
  },
  {
    title: 'Bookings and trust',
    description: 'The platform is designed for rental requests, booking flows, and ratings that build accountability.',
    icon: 'B',
  },
]

export function HomePage() {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="space-y-10">
      <section className="grid gap-8 rounded-[2rem] bg-slate-900 px-8 py-10 text-white shadow-xl shadow-slate-900/10 md:grid-cols-[1.3fr_0.9fr] md:px-12 md:py-14">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-300">Campus sharing platform</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight md:text-5xl">
            UniShare helps students rent what they need from people they trust.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            UniShare is a secure campus peer-to-peer rental marketplace where students can list, discover,
            and book useful items such as textbooks, calculators, electronics, and tools for short-term use.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Open dashboard
                <span aria-hidden="true">{'->'}</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-slate-800"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-700 bg-white/5 p-6">
          <p className="text-sm font-medium text-slate-300">Community access</p>
          <div className="mt-4 rounded-3xl bg-white p-6 text-slate-950">
            <p className="text-sm text-slate-500">Status</p>
            <p className="mt-1 text-2xl font-semibold">{isAuthenticated ? 'Verified member' : 'Guest visitor'}</p>
            <p className="mt-4 text-sm text-slate-600">
              {user
                ? `Signed in as ${user.username}. You can now access your UniShare dashboard and protected marketplace features.`
                : 'Sign in to explore the secure student marketplace and manage rentals inside the campus community.'}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {features.map(({ title, description, icon }) => (
          <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <span className="text-sm font-semibold text-slate-700">{icon}</span>
            </div>
            <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
