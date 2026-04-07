export function AdminPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Campus moderation</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">UniShare admin panel</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          This area is intended for campus administrators who monitor users, listings, and marketplace safety
          across the university community.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Users</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Moderation module</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Review student accounts, handle reports, and support safe peer-to-peer rentals.</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Listings</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Catalog oversight</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Monitor published items and keep the marketplace relevant, safe, and campus-focused.</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Analytics</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Platform insights</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Track usage, bookings, and trust signals as UniShare grows across the university.</p>
        </article>
      </section>
    </div>
  )
}
