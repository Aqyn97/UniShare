import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCategories } from '../../shared/api/categories'
import { fetchItems } from '../../shared/api/items'
import { useAuth } from '../../features/auth/use-auth'
import type { Item } from '../../shared/api/types'

export function HomePage() {
  const { isAuthenticated, user } = useAuth()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setDebouncedSearch(value), 400)
  }

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchCategories().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const { data: itemsData, isLoading, isError } = useQuery({
    queryKey: ['items', { q: debouncedSearch, categoryId: selectedCategory }],
    queryFn: () =>
      fetchItems({
        q: debouncedSearch || undefined,
        categoryId: selectedCategory ?? undefined,
        published: true,
        size: 24,
      }).then((r) => r.data),
  })

  const categories = categoriesData ?? []
  const items = itemsData?.content ?? []
  const hasFilters = !!(debouncedSearch || selectedCategory)

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-12 text-white md:px-14 md:py-16">
        {/* Subtle background pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        <div className="relative grid gap-8 md:grid-cols-[1fr_auto]">
          <div className="max-w-lg">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              <span className="text-xs font-medium text-slate-300">Campus marketplace</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Rent what you need.<br />
              <span className="text-slate-400">List what you don't.</span>
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-400">
              Textbooks, electronics, tools — borrow from fellow students for a fraction of the price. No middleman, just your campus community.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/items/new"
                    className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    + List an item
                  </Link>
                  <Link
                    to="/dashboard"
                    className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    My dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    Get started free
                  </Link>
                  <Link
                    to="/login"
                    className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Status card */}
          <div className="hidden md:flex md:items-center">
            <div className="w-64 rounded-2xl border border-white/10 bg-white/5 p-5">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{user.username}</p>
                      <p className="text-xs text-slate-400">Verified member</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                      <span className="text-xs text-slate-400">Status</span>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-green-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Active
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                      <span className="text-xs text-slate-400">Permissions</span>
                      <span className="text-xs font-medium text-white">{user.permissions.length}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Why join?</p>
                  <ul className="mt-3 space-y-2.5">
                    {['Browse & book items', 'List your own items', 'Leave reviews', 'Campus-only trust'].map((item) => (
                      <li key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                        <span className="text-green-400">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/register"
                    className="mt-4 block w-full rounded-xl bg-white py-2 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    Join for free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search for textbooks, electronics, tools..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              selectedCategory === null
                ? 'bg-slate-900 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      {!isLoading && !isError && itemsData && itemsData.totalElements > 0 && (
        <p className="text-sm text-slate-500">
          {itemsData.totalElements} listing{itemsData.totalElements === 1 ? '' : 's'} available
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="aspect-[4/3] bg-slate-200" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-1/3 rounded-full bg-slate-200" />
                <div className="h-4 w-3/4 rounded-full bg-slate-200" />
                <div className="h-5 w-1/4 rounded-full bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center text-sm text-red-600">
          Failed to load listings. Please try again.
        </div>
      ) : items.length === 0 ? (
        <EmptyState hasFilters={hasFilters} isAuthenticated={isAuthenticated} onClear={() => {
          setSearch('')
          setDebouncedSearch('')
          setSelectedCategory(null)
        }} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => <ItemCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  )
}

// ─── Item card ────────────────────────────────────────────────────────────────

function ItemCard({ item }: { item: Item }) {
  const image = item.images[0]

  return (
    <Link
      to={`/items/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        {image ? (
          <img
            src={image.url}
            alt={item.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-300">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">No photo</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {item.categoryName && (
          <span className="mb-2 inline-block self-start rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {item.categoryName}
          </span>
        )}
        <p className="flex-1 text-sm font-semibold leading-5 text-slate-900 line-clamp-2">
          {item.title}
        </p>
        {item.price != null ? (
          <p className="mt-3 text-base font-bold text-slate-900">
            {item.price.toLocaleString()}
            <span className="ml-1 text-xs font-normal text-slate-400">{item.currency} / day</span>
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-400">Price on request</p>
        )}
        <p className="mt-2 text-xs text-slate-400">by {item.ownerUsername}</p>
      </div>
    </Link>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  hasFilters,
  isAuthenticated,
  onClear,
}: {
  hasFilters: boolean
  isAuthenticated: boolean
  onClear: () => void
}) {
  if (hasFilters) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-slate-700">No results found</p>
        <p className="mt-1 text-sm text-slate-400">Try adjusting your search or filters.</p>
        <button
          type="button"
          onClick={onClear}
          className="mt-4 text-sm font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
        >
          Clear filters
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-20 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 2.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
        </svg>
      </div>
      <p className="text-base font-semibold text-slate-700">No listings yet</p>
      <p className="mt-1 text-sm text-slate-400">
        {isAuthenticated
          ? 'Be the first to list something on campus!'
          : 'Join to browse listings when students start sharing.'}
      </p>
      {isAuthenticated ? (
        <Link
          to="/items/new"
          className="mt-5 inline-block rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Create the first listing
        </Link>
      ) : (
        <Link
          to="/register"
          className="mt-5 inline-block rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Join UniShare
        </Link>
      )}
    </div>
  )
}
