import { useMutation, useQuery } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCategories } from '../../shared/api/categories'
import { attachItemImage, createItem } from '../../shared/api/items'
import { uploadImageToCloudinary } from '../../shared/api/uploads'
import { getErrorMessage } from '../../shared/api/client'
import { Button } from '../../shared/components/button'

const MAX_IMAGES = 3

export function CreateItemPage() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [currency, setCurrency] = useState('KZT')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploadWarning, setUploadWarning] = useState('')

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchCategories().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const { mutateAsync: doCreateItem, isPending: isCreating } = useMutation({
    mutationFn: () =>
      createItem({
        title: title.trim(),
        description: description.trim() || undefined,
        price: price ? Number(price) : undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        currency,
      }),
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_IMAGES)
    setSelectedFiles(files)
    setPreviews(files.map((f) => URL.createObjectURL(f)))
    e.target.value = ''
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(previews[index])
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
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
      const item = await doCreateItem()
      const itemId = item.data.id

      if (selectedFiles.length > 0) {
        let failedCount = 0
        for (let i = 0; i < selectedFiles.length; i++) {
          setUploadStatus(`Uploading photo ${i + 1} of ${selectedFiles.length}...`)
          try {
            const { publicId, url } = await uploadImageToCloudinary(selectedFiles[i])
            await attachItemImage(itemId, publicId, url)
          } catch {
            failedCount++
          }
        }
        setUploadStatus('')
        if (failedCount > 0) {
          setUploadWarning(`${failedCount} photo${failedCount > 1 ? 's' : ''} could not be uploaded (check Cloudinary configuration). The listing was saved.`)
        }
      }

      navigate(`/items/${itemId}`)
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      setUploadStatus('')
    }
  }

  const isBusy = isCreating || uploadStatus !== ''

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create a listing</h1>
        <p className="mt-1 text-sm text-slate-500">
          List something you own so fellow students can rent it. Saved as a draft — publish when ready.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Photos <span className="font-normal text-slate-400">(up to {MAX_IMAGES})</span>
          </label>

          <div className="flex flex-wrap gap-3">
            {previews.map((src, i) => (
              <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100"
                >
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-800">
                    Remove
                  </span>
                </button>
              </div>
            ))}

            {previews.length < MAX_IMAGES && (
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
          <p className="mt-2 text-xs text-slate-400">JPG, PNG or WebP. Each photo up to 10 MB.</p>
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
            disabled={categoriesLoading}
            className={inputClass(!!errors.categoryId)}
          >
            <option value="">
              {categoriesLoading ? 'Loading categories...' : 'Select a category'}
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {categories.length === 0 && !categoriesLoading && (
            <p className="mt-1.5 text-xs text-slate-400">
              No categories available. You can still create the listing without one.
            </p>
          )}
          {errors.categoryId && <FieldError>{errors.categoryId}</FieldError>}
        </div>

        {/* Errors */}
        {submitError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        )}

        {uploadWarning && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {uploadWarning}
          </div>
        )}

        {/* Upload status */}
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
          <Button type="submit" loading={isBusy}>
            {isCreating ? 'Creating...' : uploadStatus ? 'Uploading...' : 'Save listing'}
          </Button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-slate-500 transition hover:text-slate-700"
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
    'placeholder:text-slate-400 focus:ring-2 focus:ring-slate-100 disabled:opacity-50',
    hasError
      ? 'border-rose-300 focus:border-rose-400'
      : 'border-slate-200 focus:border-slate-400',
  ].join(' ')
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs text-rose-600">{children}</p>
}
