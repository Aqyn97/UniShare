export function AdminPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Admin route</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Admin placeholder</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          This page is intentionally simple. Its main job in the MVP is to prove that permission-based
          routing works and that only users with admin-level permissions can open this area.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Users</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Pending UI</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Wire this to `/admin/users` for ban and unban actions.</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Items</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Pending UI</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Wire this to `/admin/items` and the hide action later.</p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Stats</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Pending UI</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Wire this to `/admin/stats` when dashboard cards are ready.</p>
        </article>
      </section>
    </div>
  )
}
