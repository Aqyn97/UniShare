import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../features/auth/use-auth'
import { fetchCategories } from '../../shared/api/categories'
import { fetchItem, updateItem } from '../../shared/api/items'
import { getErrorMessage } from '../../shared/api/client'
import { Button } from '../../shared/components/button'
import type { Item } from '../../shared/api/types'

export function EditItemPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  const { data: item, isLoading, isError } = useQuery({
    queryKey: ['item', id],
    queryFn: () => fetchItem(Number(id)).then((r) => r.data),
    enabled: !!id,
  })

  if (isLoading) return <FormSkeleton />

  if (isError || !item) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold text-slate-800">Item not found</p>
        <p className="mt-2 text-sm text-slate-500">This listing may have been removed.</p>
        <Link
          to="/"
          className="mt-6 inline-block text-sm font-medium text-slate-700 underline underline-offset-2"
        >
          Back to listings
        </Link>
      </div>
    )
  }

  if (user?.userId !== item.ownerId) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold text-slate-800">Access denied</p>
        <p className="mt-2 text-sm text-slate-500">You can only edit your own listings.</p>
        <Link
          to={`/items/${item.id}`}
          className="mt-6 inline-block text-sm font-medium text-slate-700 underline underline-offset-2"
        >
          View listing
        </Link>
      </div>
    )
  }

  return <EditItemForm item={item} />
}

// ─── Form ─────────────────────────────────────────────────────────────────────

function EditItemForm({ item }: { item: Item }) {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [title, setTitle] = useState(item.title)
  const [description, setDescription] = useState(item.description ?? '')
  const [price, setPrice] = useState(item.price != null ? String(item.price) : '')
  const [categoryId, setCategoryId] = useState(item.categoryId != null ? String(item.categoryId) : '')
  const [currency, setCurrency] = useState(item.currency)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [saved, setSaved] = useState(false)

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchCategories().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      updateItem(item.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        price: price ? Number(price) : undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        currency,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['item', String(item.id)] })
      setSaved(true)
    },
    onError: (err) => setSubmitError(getErrorMessage(err)),
  })

  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => navigate(`/items/${item.id}`), 1500)
    return () => clearTimeout(timer)
  }, [saved, item.id, navigate])

  function validate() {
    const next: Record<string, string> = {}
    if (!title.trim()) next.title = 'Title is required.'
    if (!price) next.price = 'Price is required.'
    else if (Number(price) < 0) next.price = 'Price cannot be negative.'
    if (!categoryId) next.categoryId = 'Please select a category.'
    return next
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError('')
    const next = validate()
    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }
    setErrors({})
    mutate()
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Edit listing</h1>
        <p className="mt-1 text-sm text-slate-500">
          Update your listing details below.
        </p>
      </div>

      {saved && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Saved! Redirecting to listing...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="e.g. Calculus textbook, 5th edition"
            className={inputClass(!!errors.title)}
          />
          {errors.title && <FieldError>{errors.title}</FieldError>}
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Description <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Condition, edition, what's included..."
            className={`${inputClass(false)} resize-none`}
          />
        </div>

        {/* Price + Currency */}
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Price <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="any"
              placeholder="0"
              className={inputClass(!!errors.price)}
            />
            {errors.price && <FieldError>{errors.price}</FieldError>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={inputClass(false)}
            >
              <option value="KZT">KZT</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Category <span className="text-rose-500">*</span>
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass(!!errors.categoryId)}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <FieldError>{errors.categoryId}</FieldError>}
        </div>

        {submitError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" loading={isPending} disabled={saved}>
            {isPending ? 'Saving...' : 'Save changes'}
          </Button>
          <Link
            to={`/items/${item.id}`}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inputClass(hasError: boolean) {
  return [
    'w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 outline-none transition',
    'placeholder:text-slate-400 focus:ring-2 focus:ring-slate-100',
    hasError
      ? 'border-rose-300 focus:border-rose-400'
      : 'border-slate-200 focus:border-slate-400',
  ].join(' ')
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs text-rose-600">{children}</p>
}

function FormSkeleton() {
  return (
    <div className="mx-auto max-w-xl animate-pulse space-y-5">
      <div className="space-y-2">
        <div className="h-6 w-32 rounded bg-slate-200" />
        <div className="h-4 w-48 rounded bg-slate-200" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-3 w-20 rounded bg-slate-200" />
          <div className="h-10 w-full rounded-xl bg-slate-200" />
        </div>
      ))}
    </div>
  )
}
