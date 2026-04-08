import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCategories } from '../../shared/api/categories'
import { createItem } from '../../shared/api/items'
import { getErrorMessage } from '../../shared/api/client'
import { Button } from '../../shared/components/button'

export function CreateItemPage() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [currency, setCurrency] = useState('KZT')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchCategories().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      createItem({
        title: title.trim(),
        description: description.trim() || undefined,
        price: price ? Number(price) : undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        currency,
      }),
    onSuccess: (res) => navigate(`/items/${res.data.id}`),
    onError: (err) => setSubmitError(getErrorMessage(err)),
  })

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
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">New listing</h1>
        <p className="mt-1 text-sm text-slate-500">
          Fill in the details below. You can publish it after saving.
        </p>
      </div>

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
            Description <span className="text-slate-400 font-normal">(optional)</span>
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
          <Button type="submit" loading={isPending}>
            {isPending ? 'Saving...' : 'Save listing'}
          </Button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

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
