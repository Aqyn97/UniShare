import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../features/auth/use-auth'
import { createBooking, fetchMyBookings } from '../../shared/api/bookings'
import { getErrorMessage } from '../../shared/api/client'
import { fetchItem, fetchItemAvailability, hideItem, publishItem } from '../../shared/api/items'
import { createReview, fetchItemReviews } from '../../shared/api/reviews'
import type { AvailabilityWindow, Review } from '../../shared/api/types'
import { Button } from '../../shared/components/button'

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
          This listing may have been removed or doesn&apos;t exist.
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
  const ownerName = item.ownerUsername?.trim() || `User #${item.ownerId}`
  const ownerBadge = ownerName.slice(0, 2).toUpperCase()

  return (
    <div className="space-y-10">
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
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
            {item.ratingAvg != null && item.ratingCount > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <Stars rating={Math.round(item.ratingAvg)} />
                <span className="font-medium text-slate-900">{item.ratingAvg.toFixed(1)}</span>
                <span className="text-slate-400">({item.ratingCount} reviews)</span>
              </div>
            )}
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
              {ownerBadge}
            </div>
            <div>
              <p className="text-xs text-slate-500">Listed by</p>
              <p className="text-sm font-medium text-slate-900">{ownerName}</p>
            </div>
          </div>
        </div>

        <div>
          {isOwner ? (
            <OwnerControls itemId={item.id} published={item.published} />
          ) : (
            <BookingForm itemId={item.id} isAuthenticated={isAuthenticated} />
          )}
        </div>
      </div>

      <ReviewsSection
        itemId={item.id}
        ownerId={item.ownerId}
        ratingAvg={item.ratingAvg}
        ratingCount={item.ratingCount}
        isAuthenticated={isAuthenticated}
        currentUserId={user?.userId}
      />
    </div>
  )
}

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

function ReviewsSection({
  itemId,
  ownerId,
  ratingAvg,
  ratingCount,
  isAuthenticated,
  currentUserId,
}: {
  itemId: number
  ownerId: number
  ratingAvg: number | null
  ratingCount: number
  isAuthenticated: boolean
  currentUserId: number | undefined
}) {
  const qc = useQueryClient()

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', 'item', itemId],
    queryFn: () => fetchItemReviews(itemId).then((r) => r.data),
  })

  const { data: myBookings = [] } = useQuery({
    queryKey: ['bookings', 'renter'],
    queryFn: () => fetchMyBookings('renter').then((r) => r.data),
    enabled: isAuthenticated,
  })

  const hasOwnReview =
    currentUserId != null && reviews.some((review) => review.authorId === currentUserId)
  const hasCompletedBooking =
    currentUserId != null &&
    myBookings.some((booking) => booking.itemId === itemId && booking.status === 'COMPLETED')
  const canReview =
    isAuthenticated &&
    currentUserId != null &&
    currentUserId !== ownerId &&
    hasCompletedBooking &&
    !hasOwnReview
  const avgRating = ratingAvg != null ? ratingAvg.toFixed(1) : null
  const reviewsTotal = ratingCount || reviews.length

  function handleReviewSubmitted() {
    qc.invalidateQueries({ queryKey: ['reviews', 'item', itemId] })
    qc.invalidateQueries({ queryKey: ['item', String(itemId)] })
    qc.invalidateQueries({ queryKey: ['items'] })
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Reviews</h2>
        {avgRating && (
          <span className="flex items-center gap-1 text-sm text-slate-600">
            <Stars rating={Math.round(Number(avgRating))} />
            <span className="font-medium">{avgRating}</span>
            <span className="text-slate-400">({reviewsTotal})</span>
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
          {canReview && <ReviewForm itemId={itemId} onSubmitted={handleReviewSubmitted} />}

          {!isAuthenticated && (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">
              <Link to="/login" className="font-medium text-slate-900 underline underline-offset-2">
                Log in
              </Link>{' '}
              to leave a review for this item.
            </div>
          )}

          {isAuthenticated && currentUserId === ownerId && (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">
              You cannot leave a review for your own item.
            </div>
          )}

          {isAuthenticated && currentUserId !== ownerId && !hasCompletedBooking && (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">
              Only users who completed a booking for this item can leave a review.
            </div>
          )}

          {isAuthenticated && hasOwnReview && (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">
              You have already left a review for this item.
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
              No reviews yet.
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
  itemId,
  onSubmitted,
}: {
  itemId: number
  onSubmitted: () => void
}) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: () => createReview({ itemId, rating, comment: comment.trim() || undefined }),
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
                {'★'}
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
        <div>
          <div className="flex items-center gap-2">
            <Stars rating={review.rating} />
            {isOwn && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                Your review
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {review.authorUsername?.trim() || `User #${review.authorId}`}
          </p>
        </div>
        <time className="shrink-0 text-xs text-slate-400">
          {new Date(review.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </time>
      </div>
      {review.comment && <p className="mt-3 text-sm leading-6 text-slate-700">{review.comment}</p>}
    </div>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-sm leading-none">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? 'text-amber-400' : 'text-slate-200'}>
          {'★'}
        </span>
      ))}
    </span>
  )
}

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
  const [openField, setOpenField] = useState<'from' | 'to' | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()))

  const today = new Date().toISOString().split('T')[0]
  const { data: availability = [] } = useQuery({
    queryKey: ['item-availability', itemId],
    queryFn: () => fetchItemAvailability(itemId).then((r) => r.data),
  })
  const upcomingAvailability = availability.filter((window) => window.endDate >= today)
  const toMinDate = dateFrom ? toIsoDate(addDays(parseIsoDate(dateFrom), 1)) : today

  const { mutate, isPending } = useMutation({
    mutationFn: () => createBooking({ itemId, dateFrom, dateTo, renterNote: note || undefined }),
    onSuccess: () => setSubmitted(true),
    onError: (err) => setError(getErrorMessage(err)),
  })

  function openCalendar(field: 'from' | 'to') {
    const baseValue = field === 'from' ? dateFrom : dateTo || dateFrom
    setCalendarMonth(startOfMonth(baseValue ? parseIsoDate(baseValue) : parseIsoDate(today)))
    setOpenField(field)
  }

  function handleFromSelect(nextDate: string) {
    setDateFrom(nextDate)
    if (dateTo && dateTo <= nextDate) {
      setDateTo('')
    }
    setOpenField(null)
  }

  function handleToSelect(nextDate: string) {
    setDateTo(nextDate)
    setOpenField(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!dateFrom || !dateTo) {
      setError('Please select both dates.')
      return
    }
    if (dateFrom >= dateTo) {
      setError('End date must be after start date.')
      return
    }
    if (hasDateOverlap(dateFrom, dateTo, upcomingAvailability)) {
      setError('Selected dates overlap with already booked dates.')
      return
    }
    mutate()
  }

  if (submitted) {
    return (
      <div className="sticky top-6 rounded-2xl border border-green-200 bg-green-50 p-6">
        <p className="text-sm font-semibold text-green-800">Booking request sent!</p>
        <p className="mt-1 text-sm text-green-700">
          The owner will review your request. You&apos;ll see the status in your dashboard.
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
          <CalendarField
            label="From"
            value={dateFrom}
            placeholder="Select start date"
            isOpen={openField === 'from'}
            month={calendarMonth}
            onOpen={() => openCalendar('from')}
            onClose={() => setOpenField(null)}
            onMonthChange={setCalendarMonth}
            onSelect={handleFromSelect}
            minDate={today}
            unavailableWindows={upcomingAvailability}
          />
          <CalendarField
            label="To"
            value={dateTo}
            placeholder="Select end date"
            isOpen={openField === 'to'}
            month={calendarMonth}
            onOpen={() => openCalendar('to')}
            onClose={() => setOpenField(null)}
            onMonthChange={setCalendarMonth}
            onSelect={handleToSelect}
            minDate={toMinDate}
            unavailableWindows={upcomingAvailability}
            startDate={dateFrom || undefined}
          />
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Note to owner <span className="font-normal text-slate-400">(optional)</span>
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
          {published ? 'Published' : 'Draft - not visible to others'}
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
          <Button className="w-full" loading={isActing} onClick={() => publish.mutate()}>
            Publish listing
          </Button>
        )}
        <Link to={`/items/${itemId}/edit`}>
          <Button variant="secondary" className="w-full">
            Edit listing
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="secondary" className="w-full">
            Go to dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}

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

function hasDateOverlap(dateFrom: string, dateTo: string, windows: AvailabilityWindow[]) {
  return windows.some((window) => dateFrom <= window.endDate && dateTo >= window.startDate)
}

function CalendarField({
  label,
  value,
  placeholder,
  isOpen,
  month,
  onOpen,
  onClose,
  onMonthChange,
  onSelect,
  minDate,
  unavailableWindows,
  startDate,
}: {
  label: string
  value: string
  placeholder: string
  isOpen: boolean
  month: Date
  onOpen: () => void
  onClose: () => void
  onMonthChange: (month: Date) => void
  onSelect: (value: string) => void
  minDate: string
  unavailableWindows: AvailabilityWindow[]
  startDate?: string
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose()
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  return (
    <div ref={ref} className="relative">
      <label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      >
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>
          {value ? formatCalendarInputValue(value) : placeholder}
        </span>
        <span className="text-slate-500">
          <CalendarIcon />
        </span>
      </button>

      {isOpen && (
        <CalendarPopover
          month={month}
          value={value || undefined}
          minDate={minDate}
          unavailableWindows={unavailableWindows}
          onMonthChange={onMonthChange}
          onSelect={onSelect}
          startDate={startDate}
        />
      )}
    </div>
  )
}

function CalendarPopover({
  month,
  value,
  minDate,
  unavailableWindows,
  onMonthChange,
  onSelect,
  startDate,
}: {
  month: Date
  value?: string
  minDate: string
  unavailableWindows: AvailabilityWindow[]
  onMonthChange: (month: Date) => void
  onSelect: (value: string) => void
  startDate?: string
}) {
  const monthDays = getCalendarDays(month)

  return (
    <div className="absolute left-0 z-30 mt-2 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, -1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-slate-900">
          {month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </p>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          ›
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthDays.map((day) => {
          const iso = toIsoDate(day)
          const isOutsideMonth = day.getMonth() !== month.getMonth()
          const isSelected = value === iso
          const isToday = iso === toIsoDate(new Date())
          const isBooked =
            isDateBooked(iso, unavailableWindows) ||
            Boolean(startDate && hasDateOverlap(startDate, iso, unavailableWindows))
          const isDisabled = iso < minDate || isBooked

          return (
            <button
              key={iso}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(iso)}
              className={[
                'relative h-10 rounded-xl text-sm transition',
                isSelected && 'bg-slate-900 font-semibold text-white',
                !isSelected && !isDisabled && 'text-slate-900 hover:bg-slate-100',
                isOutsideMonth && !isSelected && 'text-slate-300',
                isDisabled && !isSelected && 'cursor-not-allowed text-slate-300',
                isBooked && !isSelected && 'bg-rose-50 text-rose-400',
                isToday && !isSelected && !isDisabled && 'ring-1 ring-slate-300',
              ]
                .filter(Boolean)
                .join(' ')}
              title={isBooked ? 'Booked date' : undefined}
            >
              <span className={isBooked ? 'line-through' : undefined}>{day.getDate()}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-100 ring-1 ring-rose-200" />
          Booked
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-900" />
          Selected
        </span>
      </div>
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  )
}

function getCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const firstWeekday = (firstDay.getDay() + 6) % 7
  const start = addDays(firstDay, -firstWeekday)

  return Array.from({ length: 42 }, (_, index) => addDays(start, index))
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatCalendarInputValue(value: string) {
  const [year, month, day] = value.split('-')
  return `${day}.${month}.${year}`
}

function isDateBooked(date: string, windows: AvailabilityWindow[]) {
  return windows.some((window) => date >= window.startDate && date <= window.endDate)
}
