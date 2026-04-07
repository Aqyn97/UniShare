import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Page not found</h1>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        This UniShare page does not exist or has not been added yet.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Return to home
      </Link>
    </div>
  )
}
