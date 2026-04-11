import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../features/auth/use-auth'
import { fetchCategories } from '../../shared/api/categories'
import { attachItemImage, deleteItemImage, fetchItem, updateItem } from '../../shared/api/items'
import { uploadImageToCloudinary } from '../../shared/api/uploads'
import { getErrorMessage } from '../../shared/api/client'
import { Button } from '../../shared/components/button'
import type { Item, ItemImage } from '../../shared/api/types'

const MAX_IMAGES = 3

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
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-slate-700 underline underline-offset-2">
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
        <Link to={`/items/${item.id}`} className="mt-6 inline-block text-sm font-medium text-slate-700 underline underline-offset-2">
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
  const [uploadStatus, setUploadStatus] = useState('')
  const [saved, setSaved] = useState(false)

  // Existing images — track deletions locally until saved
  const [existingImages, setExistingImages] = useState<ItemImage[]>(item.images)
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([])

  // New images to add
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalImages = existingImages.length + newFiles.length
  const canAddMore = totalImages < MAX_IMAGES

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchCategories().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const { mutateAsync: doUpdate, isPending: isUpdating } = useMutation({
    mutationFn: () =>
      updateItem(item.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        price: price ? Number(price) : undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        currency,
      }),
  })

  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => navigate(`/items/${item.id}`), 1500)
    return () => clearTimeout(timer)
  }, [saved, item.id, navigate])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const remaining = MAX_IMAGES - existingImages.length
    const files = Array.from(e.target.files ?? []).slice(0, remaining)
    setNewFiles(files)
    setNewPreviews(files.map((f) => URL.createObjectURL(f)))
    e.target.value = ''
  }

  function removeExistingImage(imageId: number) {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId))
    setDeletedImageIds((prev) => [...prev, imageId])
  }

  function removeNewImage(index: number) {
    URL.revokeObjectURL(newPreviews[index])
    setNewFiles((prev) => prev.filter((_, i) => i !== index))
    setNewPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  function validate() {
    const next: Record<string, string> = {}
    if (!title.trim()) next.title = 'Title is required.'
    if (!price) next.price = 'Price is required.'
    else if (Number(price) < 0) next.price = 'Price cannot be negative.'
    if (!categoryId) next.categoryId = 'Please select a category.'
    return next
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError('')

    const next = validate()
    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }
    setErrors({})

    try {
      await doUpdate()
      qc.invalidateQueries({ queryKey: ['item', String(item.id)] })

      // Delete removed images
      for (const imageId of deletedImageIds) {
        try {
          await deleteItemImage(item.id, imageId)
        } catch {
          // Non-fatal
        }
      }

      // Upload and attach new images
      if (newFiles.length > 0) {
        for (let i = 0; i < newFiles.length; i++) {
          setUploadStatus(`Uploading photo ${i + 1} of ${newFiles.length}...`)
          try {
            const { publicId, url } = await uploadImageToCloudinary(newFiles[i])
            await attachItemImage(item.id, publicId, url)
          } catch {
            // Non-fatal
          }
        }
        setUploadStatus('')
      }

      setSaved(true)
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      setUploadStatus('')
    }
  }

  const isBusy = isUpdating || uploadStatus !== ''

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Edit listing</h1>
        <p className="mt-1 text-sm text-slate-500">Update your listing details and photos.</p>
      </div>

      {saved && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Saved! Redirecting to listing...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Photos <span className="font-normal text-slate-400">(up to {MAX_IMAGES})</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {/* Existing images */}
            {existingImages.map((img) => (
              <div key={img.id} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(img.id)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100"
                >
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-800">
                    Remove
                  </span>
                </button>
              </div>
            ))}

            {/* New image previews */}
            {newPreviews.map((src, i) => (
              <div key={`new-${i}`} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-blue-200 bg-slate-100">
                <img src={src} alt="" className="h-full w-full object-cover" />
                <div className="absolute top-1 right-1 rounded-full bg-blue-500 px-1.5 py-0.5 text-xs text-white">
                  New
                </div>
                <button
                  type="button"
                  onClick={() => removeNewImage(i)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100"
                >
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-800">
                    Remove
                  </span>
                </button>
              </div>
            ))}

            {/* Add button */}
            {canAddMore && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-600"
              >
                <span className="text-xl leading-none">+</span>
                <span className="text-xs">Add photo</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

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
        <div className="grid grid-cols-[1fr_140px] gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Price per day <span className="text-rose-500">*</span>
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
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass(false)}>
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
            disabled={categoriesLoading}
            className={inputClass(!!errors.categoryId)}
          >
            <option value="">{categoriesLoading ? 'Loading categories...' : 'Select a category'}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {errors.categoryId && <FieldError>{errors.categoryId}</FieldError>}
        </div>

        {submitError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        )}

        {uploadStatus && (
          <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            {uploadStatus}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" loading={isBusy} disabled={saved}>
            {isUpdating ? 'Saving...' : uploadStatus ? 'Uploading...' : 'Save changes'}
          </Button>
          <Link to={`/items/${item.id}`} className="text-sm text-slate-500 transition hover:text-slate-700">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

function inputClass(hasError: boolean) {
  return [
    'w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 outline-none transition',
    'placeholder:text-slate-400 focus:ring-2 focus:ring-slate-100 disabled:opacity-50',
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
    <div className="mx-auto max-w-2xl animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-6 w-32 rounded bg-slate-200" />
        <div className="h-4 w-56 rounded bg-slate-200" />
      </div>
      <div className="flex gap-3">
        {[1, 2].map((i) => <div key={i} className="h-24 w-24 rounded-xl bg-slate-200" />)}
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
