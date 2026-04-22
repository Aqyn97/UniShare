import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AuthCardProps {
  eyebrow: string
  title: string
  description: string
  footer?: ReactNode
  children: ReactNode
}

export function AuthCard({ eyebrow, title, description, footer, children }: AuthCardProps) {
  return (
    <div className="mx-auto max-w-md py-8">
      <div className="mb-6 flex justify-center">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
            US
          </div>
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{eyebrow}</p>
        <h1 className="mb-2 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mb-7 text-sm leading-6 text-slate-500">{description}</p>

        {children}

        {footer && (
          <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>
        )}
      </div>
    </div>
  )
}
