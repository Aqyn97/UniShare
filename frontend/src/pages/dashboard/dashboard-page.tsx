import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/use-auth'
import {
  approveBooking,
  cancelBooking,
  fetchMyBookings,
  rejectBooking,
} from '../../shared/api/bookings'
import { deleteItem, fetchItems, hideItem, publishItem } from '../../shared/api/items'
import { getErrorMessage } from '../../shared/api/client'
import { Button } from '../../shared/components/button'
import type { Booking, BookingStatus, Item } from '../../shared/api/types'

type Tab = 'listings' | 'renter' | 'owner'

export function DashboardPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('listings')

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome back, {user.username}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 w-fit">
        {(
          [
            { key: 'listings', label: 'My listings' },
            { key: 'renter', label: 'My bookings' },
            { key: 'owner', label: 'Incoming requests' },
          ] as { key: Tab; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'listings' && <MyListings userId={user.userId} />}
      {tab === 'renter' && <RenterBookings />}
      {tab === 'owner' && <OwnerBookings />}
    </div>
  )
}

// ─── My Listings ──────────────────────────────────────────────────────────────

function MyListings({ userId }: { userId: number }) {
  const qc = useQueryClient()

  // No ownerId filter on the public API — fetch a large page and filter client-side.
  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-items'],
    queryFn: () => fetchItems({ size: 100 }).then((r) => r.data),
  })

  const items = (data?.content ?? []).filter((item) => item.ownerId === userId)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['my-items'] })

  const publish = useMutation({
    mutationFn: (id: number) => publishItem(id),
    onSuccess: invalidate,
  })

  const hide = useMutation({
    mutationFn: (id: number) => hideItem(id),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteItem(id),
    onSuccess: invalidate,
  })

  if (isLoading) return <SectionSkeleton rows={3} />
  if (isError) return <ErrorBanner message="Failed to load listings." />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {items.length === 0 ? 'No listings yet' : `${items.length} listing${items.length === 1 ? '' : 's'}`}
        </p>
        <Link to="/items/new">
          <Button>+ New listing</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState message="You haven't listed anything yet.">
          <Link to="/items/new">
            <Button>Create your first listing</Button>
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onPublish={() => publish.mutate(item.id)}
              onHide={() => hide.mutate(item.id)}
              onDelete={() => {
                if (confirm(`Delete "${item.title}"? This cannot be undone.`)) {
                  remove.mutate(item.id)
                }
              }}
              isActing={
                publish.isPending || hide.isPending || remove.isPending
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ItemRow({
  item,
  onPublish,
  onHide,
  onDelete,
  isActing,
}: {
  item: Item
  onPublish: () => void
  onHide: () => void
  onDelete: () => void
  isActing: boolean
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      {/* Thumbnail */}
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {item.images[0] ? (
          <img src={item.images[0].url} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            No img
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <Link
          to={`/items/${item.id}`}
          className="block truncate text-sm font-medium text-slate-900 hover:underline"
        >
          {item.title}
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <StatusBadge published={item.published} />
          {item.price != null && (
            <span className="text-xs text-slate-500">
              {item.price.toLocaleString()} {item.currency}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {item.published ? (
          <button
            type="button"
            disabled={isActing}
            onClick={onHide}
            className="text-xs text-slate-500 hover:text-slate-800 disabled:opacity-40"
          >
            Hide
          </button>
        ) : (
          <button
            type="button"
            disabled={isActing}
            onClick={onPublish}
            className="text-xs font-medium text-green-700 hover:text-green-900 disabled:opacity-40"
          >
            Publish
          </button>
        )}
        <span className="text-slate-200">|</span>
        <button
          type="button"
          disabled={isActing}
          onClick={onDelete}
          className="text-xs text-rose-500 hover:text-rose-700 disabled:opacity-40"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

// ─── Renter Bookings ──────────────────────────────────────────────────────────

function RenterBookings() {
  const qc = useQueryClient()

  const { data: bookings = [], isLoading, isError } = useQuery({
    queryKey: ['bookings', 'renter'],
    queryFn: () => fetchMyBookings('renter').then((r) => r.data),
  })

  const cancel = useMutation({
    mutationFn: (id: number) => cancelBooking(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings', 'renter'] }),
  })

  if (isLoading) return <SectionSkeleton rows={3} />
  if (isError) return <ErrorBanner message="Failed to load bookings." />
  if (bookings.length === 0) return <EmptyState message="You haven't booked anything yet." />

  return (
    <div className="space-y-2">
      {bookings.map((booking) => (
        <BookingRow key={booking.id} booking={booking}>
          {canCancel(booking.status) && (
            <button
              type="button"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate(booking.id)}
              className="text-xs text-rose-500 hover:text-rose-700 disabled:opacity-40"
            >
              Cancel
            </button>
          )}
        </BookingRow>
      ))}
    </div>
  )
}

// ─── Owner Bookings ───────────────────────────────────────────────────────────

function OwnerBookings() {
  const qc = useQueryClient()

  const { data: bookings = [], isLoading, isError } = useQuery({
    queryKey: ['bookings', 'owner'],
    queryFn: () => fetchMyBookings('owner').then((r) => r.data),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['bookings', 'owner'] })

  const approve = useMutation({
    mutationFn: (id: number) => approveBooking(id),
    onSuccess: invalidate,
  })

  const reject = useMutation({
    mutationFn: (id: number) => rejectBooking(id),
    onSuccess: invalidate,
  })

  const isActing = approve.isPending || reject.isPending

  if (isLoading) return <SectionSkeleton rows={3} />
  if (isError) return <ErrorBanner message="Failed to load requests." />
  if (bookings.length === 0)
    return <EmptyState message="No incoming booking requests yet." />

  return (
    <div className="space-y-2">
      {bookings.map((booking) => (
        <BookingRow key={booking.id} booking={booking}>
          {booking.status === 'PENDING' && (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isActing}
                onClick={() => approve.mutate(booking.id)}
                className="text-xs font-medium text-green-700 hover:text-green-900 disabled:opacity-40"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={isActing}
                onClick={() => reject.mutate(booking.id)}
                className="text-xs text-rose-500 hover:text-rose-700 disabled:opacity-40"
              >
                Reject
              </button>
            </div>
          )}
        </BookingRow>
      ))}
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function BookingRow({
  booking,
  children,
}: {
  booking: Booking
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="min-w-0 flex-1">
        <Link
          to={`/items/${booking.itemId}`}
          className="text-sm font-medium text-slate-900 hover:underline"
        >
          Item #{booking.itemId}
        </Link>
        <p className="mt-0.5 text-xs text-slate-500">
          {formatDate(booking.dateFrom)} → {formatDate(booking.dateTo)}
        </p>
      </div>
      <BookingBadge status={booking.status} />
      {children && <div className="shrink-0">{children}</div>}
    </div>
  )
}

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        published
          ? 'bg-green-50 text-green-700'
          : 'bg-slate-100 text-slate-500'
      }`}
    >
      {published ? 'Published' : 'Draft'}
    </span>
  )
}

const bookingBadgeStyles: Record<BookingStatus, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  APPROVED: 'bg-blue-50 text-blue-700',
  REJECTED: 'bg-red-50 text-red-600',
  ACTIVE: 'bg-green-50 text-green-700',
  COMPLETED: 'bg-slate-100 text-slate-600',
  CANCELLED: 'bg-slate-100 text-slate-400',
}

function BookingBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${bookingBadgeStyles[status]}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

function EmptyState({
  message,
  children,
}: {
  message: string
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
      <p className="text-sm text-slate-500">{message}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
      {message}
    </div>
  )
}

function SectionSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />
      ))}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function canCancel(status: BookingStatus) {
  return status === 'PENDING' || status === 'APPROVED'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
