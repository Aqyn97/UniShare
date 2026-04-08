import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  banUser,
  fetchAdminBookings,
  fetchAdminItems,
  fetchAdminStats,
  fetchAdminUsers,
  hideAdminItem,
  unbanUser,
} from '../../shared/api/admin'
import { getErrorMessage } from '../../shared/api/client'
import { Button } from '../../shared/components/button'
import type { BookingStatus } from '../../shared/api/types'
import type { AdminItem, AdminUser } from '../../shared/api/admin'

export function AdminPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Admin panel</h1>
        <p className="mt-1 text-sm text-slate-500">Manage users, listings, and view platform stats.</p>
      </div>

      <StatsSection />
      <UsersSection />
      <ItemsSection />
      <BookingsSection />
    </div>
  )
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function StatsSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => fetchAdminStats().then((r) => r.data),
  })

  return (
    <section>
      <h2 className="mb-4 text-base font-semibold text-slate-700">Overview</h2>
      {isError ? (
        <ErrorBanner message="Failed to load stats." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Users" value={isLoading ? '—' : String(data!.usersCount)} />
          <StatCard label="Items" value={isLoading ? '—' : String(data!.itemsCount)} />
          <StatCard label="Bookings" value={isLoading ? '—' : String(data!.bookingsCount)} />
          <StatCard label="Reviews" value={isLoading ? '—' : String(data!.reviewsCount)} />
          <StatCard
            label="Avg. rating"
            value={
              isLoading
                ? '—'
                : data!.averageRating != null
                ? `${data!.averageRating.toFixed(1)} ★`
                : 'N/A'
            }
          />
        </div>
      )}
    </section>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  )
}

// ─── Users ────────────────────────────────────────────────────────────────────

function UsersSection() {
  const qc = useQueryClient()

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => fetchAdminUsers().then((r) => r.data),
  })

  const ban = useMutation({
    mutationFn: (id: number) => banUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  const unban = useMutation({
    mutationFn: (id: number) => unbanUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  const isActing = ban.isPending || unban.isPending

  return (
    <section>
      <h2 className="mb-4 text-base font-semibold text-slate-700">
        Users
        {!isLoading && !isError && (
          <span className="ml-2 font-normal text-slate-400">({users.length})</span>
        )}
      </h2>

      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : isError ? (
        <ErrorBanner message="Failed to load users." />
      ) : users.length === 0 ? (
        <EmptyState message="No users found." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {users.map((user, i) => (
            <UserRow
              key={user.userId}
              user={user}
              isLast={i === users.length - 1}
              onBan={() => ban.mutate(user.userId)}
              onUnban={() => unban.mutate(user.userId)}
              isActing={isActing}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function UserRow({
  user,
  isLast,
  onBan,
  onUnban,
  isActing,
}: {
  user: AdminUser
  isLast: boolean
  onBan: () => void
  onUnban: () => void
  isActing: boolean
}) {
  return (
    <div
      className={`flex items-center gap-4 px-5 py-3.5 ${!isLast ? 'border-b border-slate-100' : ''}`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
        {user.username.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{user.username}</p>
        <p className="truncate text-xs text-slate-400">{user.email ?? 'No email'}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          user.enabled ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
        }`}
      >
        {user.enabled ? 'Active' : 'Banned'}
      </span>
      {user.enabled ? (
        <button
          type="button"
          disabled={isActing}
          onClick={onBan}
          className="shrink-0 text-xs text-rose-500 hover:text-rose-700 disabled:opacity-40"
        >
          Ban
        </button>
      ) : (
        <button
          type="button"
          disabled={isActing}
          onClick={onUnban}
          className="shrink-0 text-xs font-medium text-green-700 hover:text-green-900 disabled:opacity-40"
        >
          Unban
        </button>
      )}
    </div>
  )
}

// ─── Items ────────────────────────────────────────────────────────────────────

function ItemsSection() {
  const qc = useQueryClient()

  const { data: items = [], isLoading, isError } = useQuery({
    queryKey: ['admin', 'items'],
    queryFn: () => fetchAdminItems().then((r) => r.data),
  })

  const hide = useMutation({
    mutationFn: (id: number) => hideAdminItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'items'] }),
  })

  return (
    <section>
      <h2 className="mb-4 text-base font-semibold text-slate-700">
        Items
        {!isLoading && !isError && (
          <span className="ml-2 font-normal text-slate-400">({items.length})</span>
        )}
      </h2>

      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : isError ? (
        <ErrorBanner message="Failed to load items." />
      ) : items.length === 0 ? (
        <EmptyState message="No items found." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {items.map((item, i) => (
            <ItemRow
              key={item.id}
              item={item}
              isLast={i === items.length - 1}
              onHide={() => hide.mutate(item.id)}
              isActing={hide.isPending}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function ItemRow({
  item,
  isLast,
  onHide,
  isActing,
}: {
  item: AdminItem
  isLast: boolean
  onHide: () => void
  isActing: boolean
}) {
  return (
    <div
      className={`flex items-center gap-4 px-5 py-3.5 ${!isLast ? 'border-b border-slate-100' : ''}`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
        <p className="text-xs text-slate-400">
          by {item.ownerUsername}
          {item.categoryName ? ` · ${item.categoryName}` : ''}
          {item.price != null ? ` · ${item.price.toLocaleString()} ${item.currency}` : ''}
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          item.published ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {item.published ? 'Published' : 'Hidden'}
      </span>
      {item.published && (
        <button
          type="button"
          disabled={isActing}
          onClick={onHide}
          className="shrink-0 text-xs text-rose-500 hover:text-rose-700 disabled:opacity-40"
        >
          Hide
        </button>
      )}
    </div>
  )
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

function BookingsSection() {
  const { data: bookings = [], isLoading, isError } = useQuery({
    queryKey: ['admin', 'bookings'],
    queryFn: () => fetchAdminBookings().then((r) => r.data),
  })

  return (
    <section>
      <h2 className="mb-4 text-base font-semibold text-slate-700">
        Bookings
        {!isLoading && !isError && (
          <span className="ml-2 font-normal text-slate-400">({bookings.length})</span>
        )}
      </h2>

      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : isError ? (
        <ErrorBanner message="Failed to load bookings." />
      ) : bookings.length === 0 ? (
        <EmptyState message="No bookings yet." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {bookings.map((booking, i) => (
            <div
              key={booking.id}
              className={`flex items-center gap-4 px-5 py-3.5 ${
                i < bookings.length - 1 ? 'border-b border-slate-100' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">
                  Item #{booking.itemId}
                </p>
                <p className="text-xs text-slate-400">
                  Renter #{booking.renterId} · {formatDate(booking.dateFrom)} →{' '}
                  {formatDate(booking.dateTo)}
                </p>
              </div>
              <BookingBadge status={booking.status} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ─── Shared ───────────────────────────────────────────────────────────────────

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
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${bookingBadgeStyles[status]}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`flex items-center gap-4 px-5 py-3.5 ${i < rows - 1 ? 'border-b border-slate-100' : ''}`}
        >
          <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
      {message}
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}
