import type { ReactNode } from 'react'

interface AuthCardProps {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthCard({ eyebrow, title, description, children, footer }: AuthCardProps) {
  return (
    <section className="relative mx-auto max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-slate-100 via-white to-white"
        aria-hidden="true"
      />

      <div className="relative">
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        </div>

        {children}

        {footer ? <div className="mt-6 text-sm text-slate-600">{footer}</div> : null}
      </div>
    </section>
  )
}
