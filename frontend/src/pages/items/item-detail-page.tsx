import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../features/auth/use-auth'
import { createBooking, fetchMyBookings } from '../../shared/api/bookings'
import { fetchItem, hideItem, publishItem } from '../../shared/api/items'
import { createReview, fetchItemReviews } from '../../shared/api/reviews'
import { getErrorMessage } from '../../shared/api/client'
import { Button } from '../../shared/components/button'
import type { Booking, Review } from '../../shared/api/types'

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated, user } = useAuth()

  const { data: item, isLoading, isError } = useQuery({
    queryKey: ['item', id],
    queryFn: () => fetchItem(Number(id)).then((r) => r.data),
    enabled: !!id,
  })

  if (isLoading) return <ItemDetailSkeleton />

  if (isError || !item) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold text-slate-800">Item not found</p>
        <p className="mt-2 text-sm text-slate-500">
          This listing may have been removed or doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Back to listings
        </Link>
      </div>
    )
  }

  const isOwner = user?.userId === item.ownerId

  return (
    <div className="space-y-10">
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* Left column */}
        <div className="space-y-6">
          <ImageGallery images={item.images} title={item.title} />

          <div>
            {item.categoryName && (
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                {item.categoryName}
              </p>
            )}
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              {item.title}
            </h1>
            {item.price != null ? (
              <p className="mt-3 text-2xl font-semibold text-slate-900">
                {item.price.toLocaleString()}{' '}
                <span className="text-base font-normal text-slate-500">{item.currency}</span>
              </p>
            ) : (
              <p className="mt-3 text-base text-slate-500">Price on request</p>
            )}
          </div>

          {item.description && (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Description
              </h2>
              <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
                {item.description}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
              {item.ownerId}
            </div>
            <div>
              <p className="text-xs text-slate-500">Listed by</p>
              <p className="text-sm font-medium text-slate-900">User #{item.ownerId}</p>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div>
          {isOwner ? (
            <OwnerControls itemId={item.id} published={item.published} />
          ) : (
            <BookingForm itemId={item.id} isAuthenticated={isAuthenticated} />
          )}
        </div>
      </div>

      {/* Reviews */}
      <ReviewsSection
        itemId={item.id}
        isAuthenticated={isAuthenticated}
        currentUserId={user?.userId}
      />
    </div>
  )
}

// ─── Image gallery ────────────────────────────────────────────────────────────

function ImageGallery({
  images,
  title,
}: {
  images: { id: number; url: string }[]
  title: string
}) {
  const [active, setActive] = useState(0)

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-400">
        No images
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
        <img src={images[active].url} alt={title} className="h-full w-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition ${
                i === active
                  ? 'border-slate-900'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Reviews section ──────────────────────────────────────────────────────────

function ReviewsSection({
  itemId,
  isAuthenticated,
  currentUserId,
}: {
  itemId: number
  isAuthenticated: boolean
  currentUserId: number | undefined
}) {
  const qc = useQueryClient()

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', 'item', itemId],
    queryFn: () => fetchItemReviews(itemId).then((r) => r.data),
  })

  // Fetch current user's bookings to check for completed ones on this item.
  // Only runs when authenticated — no point fetching otherwise.
  const { data: myBookings = [] } = useQuery({
    queryKey: ['bookings', 'renter'],
    queryFn: () => fetchMyBookings('renter').then((r) => r.data),
    enabled: isAuthenticated,
  })

  // A completed booking for this item that hasn't been reviewed yet.
  const reviewedBookingIds = new Set(reviews.map((r) => r.bookingId))
  const eligibleBooking = myBookings.find(
    (b) => b.itemId === itemId && b.status === 'COMPLETED' && !reviewedBookingIds.has(b.id),
  )

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null

  function handleReviewSubmitted() {
    qc.invalidateQueries({ queryKey: ['reviews', 'item', itemId] })
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Reviews</h2>
        {avgRating && (
          <span className="flex items-center gap-1 text-sm text-slate-600">
            <Stars rating={Math.round(Number(avgRating))} />
            <span className="font-medium">{avgRating}</span>
            <span className="text-slate-400">({reviews.length})</span>
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {eligibleBooking && (
            <ReviewForm
              bookingId={eligibleBooking.id}
              onSubmitted={handleReviewSubmitted}
            />
          )}

          {reviews.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
              No reviews yet.
              {isAuthenticated && !eligibleBooking && (
                <p className="mt-1 text-xs text-slate-400">
                  Complete a booking to leave a review.
                </p>
              )}
            </div>
          ) : (
            reviews.map((review) => (
              <ReviewCard key={review.id} review={review} currentUserId={currentUserId} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function ReviewForm({
  bookingId,
  onSubmitted,
}: {
  bookingId: number
  onSubmitted: () => void
}) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: () => createReview({ bookingId, rating, comment: comment.trim() || undefined }),
    onSuccess: () => {
      onSubmitted()
      setRating(0)
      setComment('')
      setError('')
    },
    onError: (err) => setError(getErrorMessage(err)),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      setError('Please select a rating.')
      return
    }
    setError('')
    mutate()
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="mb-4 text-sm font-semibold text-slate-900">Leave a review</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star picker */}
        <div>
          <p className="mb-2 text-xs font-medium text-slate-600">Rating</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={`text-2xl transition hover:scale-110 ${
                  n <= rating ? 'text-amber-400' : 'text-slate-200 hover:text-amber-200'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Comment <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="How was your experience?"
            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </div>

        {error && <p className="text-xs text-rose-600">{error}</p>}

        <Button type="submit" loading={isPending}>
          {isPending ? 'Submitting...' : 'Submit review'}
        </Button>
      </form>
    </div>
  )
}

function ReviewCard({
  review,
  currentUserId,
}: {
  review: Review
  currentUserId: number | undefined
}) {
  const isOwn = review.authorId === currentUserId

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Stars rating={review.rating} />
          {isOwn && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              Your review
            </span>
          )}
        </div>
        <time className="shrink-0 text-xs text-slate-400">
          {new Date(review.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </time>
      </div>
      {review.comment && (
        <p className="mt-3 text-sm leading-6 text-slate-700">{review.comment}</p>
      )}
    </div>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-sm leading-none">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? 'text-amber-400' : 'text-slate-200'}>
          ★
        </span>
      ))}
    </span>
  )
}

// ─── Booking form ─────────────────────────────────────────────────────────────

function BookingForm({
  itemId,
  isAuthenticated,
}: {
  itemId: number
  isAuthenticated: boolean
}) {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const { mutate, isPending } = useMutation({
    mutationFn: () => createBooking({ itemId, dateFrom, dateTo, renterNote: note || undefined }),
    onSuccess: () => setSubmitted(true),
    onError: (err) => setError(getErrorMessage(err)),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!dateFrom || !dateTo) {
      setError('Please select both dates.')
      return
    }
    if (dateFrom > dateTo) {
      setError('End date must be after start date.')
      return
    }
    mutate()
  }

  if (submitted) {
    return (
      <div className="sticky top-6 rounded-2xl border border-green-200 bg-green-50 p-6">
        <p className="text-sm font-semibold text-green-800">Booking request sent!</p>
        <p className="mt-1 text-sm text-green-700">
          The owner will review your request. You'll see the status in your dashboard.
        </p>
        <Link to="/dashboard" className="mt-4 block">
          <Button className="w-full">Go to dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-base font-semibold text-slate-900">Request booking</h2>

      {!isAuthenticated ? (
        <div className="space-y-2 text-center">
          <p className="mb-4 text-sm text-slate-600">
            You need to be logged in to book this item.
          </p>
          <Link to="/login">
            <Button className="w-full">Login to book</Button>
          </Link>
          <Link to="/register">
            <Button variant="secondary" className="w-full">
              Create account
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">From</label>
            <input
              type="date"
              value={dateFrom}
              min={today}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">To</label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || today}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Note to owner{' '}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Anything the owner should know..."
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
              {error}
            </div>
          )}

          <Button type="submit" loading={isPending} className="w-full">
            {isPending ? 'Sending request...' : 'Request booking'}
          </Button>
        </form>
      )}
    </div>
  )
}

// ─── Owner controls ───────────────────────────────────────────────────────────

function OwnerControls({ itemId, published }: { itemId: number; published: boolean }) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['item', String(itemId)] })

  const publish = useMutation({ mutationFn: () => publishItem(itemId), onSuccess: invalidate })
  const hide = useMutation({ mutationFn: () => hideItem(itemId), onSuccess: invalidate })
  const isActing = publish.isPending || hide.isPending

  return (
    <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
        Your listing
      </p>
      <p className="mb-5 text-sm text-slate-600">
        Status:{' '}
        <span className={published ? 'font-medium text-green-600' : 'font-medium text-amber-600'}>
          {published ? 'Published' : 'Draft — not visible to others'}
        </span>
      </p>
      <div className="space-y-2">
        {published ? (
          <Button
            variant="secondary"
            className="w-full"
            loading={isActing}
            onClick={() => hide.mutate()}
          >
            Unpublish
          </Button>
        ) : (
          <Button
            className="w-full"
            loading={isActing}
            onClick={() => publish.mutate()}
          >
            Publish listing
          </Button>
        )}
        <Link to={`/items/${itemId}/edit`}>
          <Button variant="secondary" className="w-full">
            Edit listing
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="secondary" className="w-full">Go to dashboard</Button>
        </Link>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ItemDetailSkeleton() {
  return (
    <div className="grid animate-pulse gap-10 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <div className="aspect-[4/3] rounded-2xl bg-slate-200" />
        <div className="space-y-3">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="h-7 w-2/3 rounded bg-slate-200" />
          <div className="h-6 w-28 rounded bg-slate-200" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-slate-200" />
          <div className="h-3 w-full rounded bg-slate-200" />
          <div className="h-3 w-3/4 rounded bg-slate-200" />
        </div>
      </div>
      <div className="h-64 rounded-2xl bg-slate-200" />
    </div>
  )
}
