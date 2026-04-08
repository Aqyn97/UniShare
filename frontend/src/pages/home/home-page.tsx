import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCategories } from '../../shared/api/categories'
import { fetchItems } from '../../shared/api/items'
import type { Item } from '../../shared/api/types'
import { useAuth } from '../../features/auth/use-auth'

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

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="grid gap-8 rounded-[2rem] bg-slate-900 px-8 py-10 text-white shadow-xl shadow-slate-900/10 md:grid-cols-[1.3fr_0.9fr] md:px-12 md:py-14">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-300">
            Campus sharing platform
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight md:text-5xl">
            Rent what you need from people you trust.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            Textbooks, electronics, tools — borrow from fellow students for a fraction of the price.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Open dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Get started
                </Link>
                <Link
                  to="/login"
                  className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-slate-800"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-700 bg-white/5 p-6">
          <p className="text-sm font-medium text-slate-300">Community access</p>
          <div className="mt-4 rounded-3xl bg-white p-6 text-slate-950">
            <p className="text-sm text-slate-500">Status</p>
            <p className="mt-1 text-2xl font-semibold">
              {isAuthenticated ? 'Verified member' : 'Guest visitor'}
            </p>
            <p className="mt-4 text-sm text-slate-600">
              {user
                ? `Signed in as ${user.username}. Browse listings and start booking.`
                : 'Sign in to book items and list your own.'}
            </p>
          </div>
        </div>
      </section>

      {/* Search + filters */}
      <div className="space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search items..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                selectedCategory === null
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
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
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results count */}
      {!isLoading && !isError && itemsData && (
        <p className="text-sm text-slate-500">
          {itemsData.totalElements === 0
            ? 'No items found'
            : `${itemsData.totalElements} item${itemsData.totalElements === 1 ? '' : 's'} found`}
        </p>
      )}

      {/* Items grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-white shadow-sm">
              <div className="aspect-[4/3] rounded-t-2xl bg-slate-200" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-1/3 rounded bg-slate-200" />
                <div className="h-4 w-3/4 rounded bg-slate-200" />
                <div className="h-4 w-1/4 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center text-sm text-red-600">
          Failed to load items. Please try again.
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
          <p className="text-slate-500">No items found.</p>
          {(debouncedSearch || selectedCategory) && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setDebouncedSearch('')
                setSelectedCategory(null)
              }}
              className="mt-3 text-sm font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function ItemCard({ item }: { item: Item }) {
  const image = item.images[0]

  return (
    <Link
      to={`/items/${item.id}`}
      className="group rounded-2xl bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-[4/3] overflow-hidden rounded-t-2xl bg-slate-100">
        {image ? (
          <img
            src={image.url}
            alt={item.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300 text-sm">
            No image
          </div>
        )}
      </div>
      <div className="p-4">
        {item.categoryName && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
            {item.categoryName}
          </p>
        )}
        <p className="text-sm font-semibold text-slate-900 line-clamp-2">{item.title}</p>
        {item.price != null ? (
          <p className="mt-2 text-sm font-medium text-slate-700">
            {item.price.toLocaleString()} {item.currency}
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-400">Price on request</p>
        )}
      </div>
    </Link>
  )
}
