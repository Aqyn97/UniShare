import type { ReactNode } from 'react'
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
import type { AdminBooking, AdminItem, AdminStats, AdminUser } from '../../shared/api/admin'
import { BookingBadge } from '../../shared/components/booking-badge'
import { formatDate } from '../../shared/utils/format'

const BOOKING_STATUS_ORDER = ['PENDING', 'APPROVED', 'ACTIVE', 'COMPLETED', 'REJECTED', 'CANCELLED'] as const

const BOOKING_STATUS_LABELS: Record<(typeof BOOKING_STATUS_ORDER)[number], string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

const BOOKING_STATUS_COLORS: Record<(typeof BOOKING_STATUS_ORDER)[number], string> = {
  PENDING: 'bg-amber-400',
  APPROVED: 'bg-sky-400',
  ACTIVE: 'bg-violet-400',
  COMPLETED: 'bg-emerald-400',
  REJECTED: 'bg-rose-400',
  CANCELLED: 'bg-slate-400',
}

export function AdminPage() {
  const qc = useQueryClient()

  const statsQuery = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => fetchAdminStats().then((r) => r.data),
  })

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => fetchAdminUsers().then((r) => r.data),
  })

  const itemsQuery = useQuery({
    queryKey: ['admin', 'items'],
    queryFn: () => fetchAdminItems().then((r) => r.data),
  })

  const bookingsQuery = useQuery({
    queryKey: ['admin', 'bookings'],
    queryFn: () => fetchAdminBookings().then((r) => r.data),
  })

  const ban = useMutation({
    mutationFn: (id: number) => banUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  const unban = useMutation({
    mutationFn: (id: number) => unbanUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  const hide = useMutation({
    mutationFn: (id: number) => hideAdminItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'items'] }),
  })

  const stats = statsQuery.data
  const users = usersQuery.data ?? []
  const items = itemsQuery.data ?? []
  const bookings = bookingsQuery.data ?? []

  const activeUsers = users.filter((user) => user.enabled).length
  const bannedUsers = users.length - activeUsers
  const publishedItems = items.filter((item) => item.published).length
  const hiddenItems = items.length - publishedItems
  const completedBookings = bookings.filter((booking) => booking.status === 'COMPLETED').length
  const pendingBookings = bookings.filter((booking) => booking.status === 'PENDING').length
  const grossVolume = bookings.reduce((sum, booking) => sum + (booking.totalPrice ?? 0), 0)
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)
  const topRatedItems = [...items]
    .filter((item) => item.ratingAvg != null && item.ratingCount > 0)
    .sort((a, b) => {
      if ((b.ratingAvg ?? 0) !== (a.ratingAvg ?? 0)) {
        return (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0)
      }
      return b.ratingCount - a.ratingCount
    })
    .slice(0, 5)
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
  const bookingStatusCounts = BOOKING_STATUS_ORDER.map((status) => ({
    status,
    label: BOOKING_STATUS_LABELS[status],
    color: BOOKING_STATUS_COLORS[status],
    count: bookings.filter((booking) => booking.status === status).length,
  }))
  const activityBars = buildActivityBars(bookings)
  const dataErrors = [statsQuery.isError, usersQuery.isError, itemsQuery.isError, bookingsQuery.isError].some(Boolean)

  return (
    <div className="space-y-8">
      <HeroPanel
        stats={stats}
        isLoading={statsQuery.isLoading}
        activeUsers={activeUsers}
        publishedItems={publishedItems}
        completedBookings={completedBookings}
      />

      {dataErrors && (
        <ErrorBanner message="Some admin data failed to load. The dashboard may be incomplete until you refresh." />
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Users"
          value={statsQuery.isLoading ? '...' : formatCompactNumber(stats?.usersCount ?? 0)}
          tone="slate"
          detail={`${activeUsers} active / ${bannedUsers} banned`}
        />
        <MetricCard
          title="Listings"
          value={itemsQuery.isLoading ? '...' : formatCompactNumber(stats?.itemsCount ?? items.length)}
          tone="sky"
          detail={`${publishedItems} published / ${hiddenItems} hidden`}
        />
        <MetricCard
          title="Bookings"
          value={bookingsQuery.isLoading ? '...' : formatCompactNumber(stats?.bookingsCount ?? bookings.length)}
          tone="emerald"
          detail={`${pendingBookings} pending / ${completedBookings} completed`}
        />
        <MetricCard
          title="Reviews"
          value={statsQuery.isLoading ? '...' : formatCompactNumber(stats?.reviewsCount ?? 0)}
          tone="amber"
          detail={
            stats?.averageRating != null
              ? `${stats.averageRating.toFixed(1)} avg trust score`
              : 'No ratings yet'
          }
        />
        <MetricCard
          title="Gross Volume"
          value={bookingsQuery.isLoading ? '...' : formatCurrency(grossVolume)}
          tone="violet"
          detail="Total booking volume across all statuses"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <SectionShell
            title="Marketplace Health"
            description="Fast signal on user quality, listing visibility and booking pipeline."
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <RatioPanel
                title="User base"
                total={users.length}
                primaryLabel="Active"
                primaryValue={activeUsers}
                secondaryLabel="Banned"
                secondaryValue={bannedUsers}
                accentClass="bg-emerald-500"
              />
              <RatioPanel
                title="Listing visibility"
                total={items.length}
                primaryLabel="Published"
                primaryValue={publishedItems}
                secondaryLabel="Hidden"
                secondaryValue={hiddenItems}
                accentClass="bg-sky-500"
              />
              <RatioPanel
                title="Booking outcomes"
                total={bookings.length}
                primaryLabel="Completed"
                primaryValue={completedBookings}
                secondaryLabel="Pending"
                secondaryValue={pendingBookings}
                accentClass="bg-violet-500"
              />
            </div>
          </SectionShell>

          <SectionShell
            title="Booking Flow"
            description="Distribution of current booking states across the platform."
          >
            <div className="space-y-4">
              <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                {bookingStatusCounts.map((entry) => (
                  <div
                    key={entry.status}
                    className={entry.color}
                    style={{
                      width: `${getShare(entry.count, bookings.length)}%`,
                      minWidth: entry.count > 0 ? '10px' : '0',
                    }}
                  />
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {bookingStatusCounts.map((entry) => (
                  <div key={entry.status} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${entry.color}`} />
                      <p className="text-sm font-medium text-slate-800">{entry.label}</p>
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{entry.count}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {bookings.length === 0 ? '0%' : `${getShare(entry.count, bookings.length).toFixed(1)}% of all bookings`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </SectionShell>
        </div>

        <div className="space-y-5">
          <SectionShell
            title="7-Day Activity"
            description="New bookings created each day."
          >
            <div className="flex h-44 items-end gap-3">
              {activityBars.map((bar) => (
                <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">{bar.count}</span>
                  <div className="flex h-32 w-full items-end rounded-2xl bg-slate-100 p-1.5">
                    <div
                      className="w-full rounded-xl bg-gradient-to-t from-slate-900 via-sky-600 to-cyan-400"
                      style={{ height: `${bar.height}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{bar.label}</span>
                </div>
              ))}
            </div>
          </SectionShell>

          <SectionShell
            title="Top Rated Listings"
            description="Best reviewed items currently visible in the marketplace."
          >
            {topRatedItems.length === 0 ? (
              <EmptyState message="No rated items yet." compact />
            ) : (
              <div className="space-y-3">
                {topRatedItems.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.ownerUsername} {item.categoryName ? `| ${item.categoryName}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {item.ratingAvg?.toFixed(1)} / 5
                        </p>
                        <p className="text-xs text-slate-500">{item.ratingCount} reviews</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionShell>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <SectionShell
          title="User Management"
          description="Newest accounts, role visibility and moderation actions."
        >
          {usersQuery.isLoading ? (
            <TableSkeleton rows={5} />
          ) : users.length === 0 ? (
            <EmptyState message="No users found." />
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <UserCard
                  key={user.userId}
                  user={user}
                  onBan={() => ban.mutate(user.userId)}
                  onUnban={() => unban.mutate(user.userId)}
                  isActing={ban.isPending || unban.isPending}
                />
              ))}
              {users.length > recentUsers.length && (
                <p className="px-1 text-xs text-slate-400">
                  Showing {recentUsers.length} latest users out of {users.length}.
                </p>
              )}
            </div>
          )}
        </SectionShell>

        <SectionShell
          title="Recent Booking Activity"
          description="Latest booking events entering the system."
        >
          {bookingsQuery.isLoading ? (
            <TableSkeleton rows={5} />
          ) : recentBookings.length === 0 ? (
            <EmptyState message="No bookings yet." />
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <RecentBookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </SectionShell>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <SectionShell
          title="Listings Control"
          description="Publication status, pricing and trust signals across the catalog."
        >
          {itemsQuery.isLoading ? (
            <ItemGridSkeleton />
          ) : items.length === 0 ? (
            <EmptyState message="No items found." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {items
                .slice()
                .sort((a, b) => Number(b.published) - Number(a.published))
                .slice(0, 6)
                .map((item) => (
                  <ItemAdminCard
                    key={item.id}
                    item={item}
                    onHide={() => hide.mutate(item.id)}
                    isActing={hide.isPending}
                  />
                ))}
            </div>
          )}
        </SectionShell>

        <SectionShell
          title="Bookings Ledger"
          description="Compact operational view of booking windows and owners."
        >
          {bookingsQuery.isLoading ? (
            <TableSkeleton rows={6} />
          ) : bookings.length === 0 ? (
            <EmptyState message="No bookings yet." />
          ) : (
            <div className="space-y-3">
              {bookings
                .slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 8)
                .map((booking) => (
                  <BookingLedgerRow key={booking.id} booking={booking} />
                ))}
            </div>
          )}
        </SectionShell>
      </section>
    </div>
  )
}

function HeroPanel({
  stats,
  isLoading,
  activeUsers,
  publishedItems,
  completedBookings,
}: {
  stats: AdminStats | undefined
  isLoading: boolean
  activeUsers: number
  publishedItems: number
  completedBookings: number
}) {
  return (
    <section className="relative overflow-hidden rounded-[32px] bg-slate-950 px-6 py-7 text-white md:px-8 md:py-9">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(125,211,252,0.22),_transparent_36%),radial-gradient(circle_at_bottom_left,_rgba(52,211,153,0.18),_transparent_28%)]" />
      <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.04),transparent)] lg:block" />
      <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.32em] text-sky-200/75">
            Admin Control Center
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Marketplace operations in one view.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Monitor growth, trust, listing visibility and booking flow without leaving the panel.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <HeroChip label="Active users" value={isLoading ? '...' : formatCompactNumber(activeUsers)} />
            <HeroChip label="Published listings" value={isLoading ? '...' : formatCompactNumber(publishedItems)} />
            <HeroChip label="Completed bookings" value={isLoading ? '...' : formatCompactNumber(completedBookings)} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <HeroStat
            label="Platform scale"
            value={isLoading ? '...' : formatCompactNumber((stats?.usersCount ?? 0) + (stats?.itemsCount ?? 0))}
            hint="Users + listings combined"
          />
          <HeroStat
            label="Trust score"
            value={
              isLoading ? '...' : stats?.averageRating != null ? `${stats.averageRating.toFixed(1)} / 5` : 'No data'
            }
            hint="Average review rating"
          />
          <HeroStat
            label="Review volume"
            value={isLoading ? '...' : formatCompactNumber(stats?.reviewsCount ?? 0)}
            hint="All-time marketplace reviews"
          />
        </div>
      </div>
    </section>
  )
}

function HeroChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
      <span className="text-xs text-slate-300">{label}</span>
      <span className="ml-2 text-sm font-semibold text-white">{value}</span>
    </div>
  )
}

function HeroStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  )
}

function MetricCard({
  title,
  value,
  detail,
  tone,
}: {
  title: string
  value: string
  detail: string
  tone: 'slate' | 'sky' | 'emerald' | 'amber' | 'violet'
}) {
  const toneClass =
    {
      slate: 'from-slate-950 via-slate-900 to-slate-800',
      sky: 'from-sky-950 via-sky-900 to-cyan-800',
      emerald: 'from-emerald-950 via-emerald-900 to-teal-800',
      amber: 'from-amber-950 via-amber-900 to-orange-800',
      violet: 'from-violet-950 via-violet-900 to-fuchsia-800',
    }[tone]

  return (
    <div className={`overflow-hidden rounded-[28px] bg-gradient-to-br ${toneClass} p-[1px] shadow-sm`}>
      <div className="rounded-[27px] bg-white/96 px-5 py-5 backdrop-blur">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">{title}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
        <p className="mt-2 text-sm text-slate-500">{detail}</p>
      </div>
    </div>
  )
}

function SectionShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 md:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  )
}

function RatioPanel({
  title,
  total,
  primaryLabel,
  primaryValue,
  secondaryLabel,
  secondaryValue,
  accentClass,
}: {
  title: string
  total: number
  primaryLabel: string
  primaryValue: number
  secondaryLabel: string
  secondaryValue: number
  accentClass: string
}) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <span className="text-xs text-slate-400">{formatCompactNumber(total)} total</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
        <div
          className={`h-full rounded-full ${accentClass}`}
          style={{ width: `${getShare(primaryValue, total)}%` }}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{primaryLabel}</p>
          <p className="mt-1 text-xl font-semibold text-slate-950">{primaryValue}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{secondaryLabel}</p>
          <p className="mt-1 text-xl font-semibold text-slate-950">{secondaryValue}</p>
        </div>
      </div>
    </div>
  )
}

function UserCard({
  user,
  onBan,
  onUnban,
  isActing,
}: {
  user: AdminUser
  onBan: () => void
  onUnban: () => void
  isActing: boolean
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">{user.username}</p>
              <p className="truncate text-xs text-slate-500">{user.email ?? 'No email'}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill tone={user.enabled ? 'green' : 'rose'}>{user.enabled ? 'Active' : 'Banned'}</Pill>
            {user.roles.map((role) => (
              <Pill key={role} tone="slate">
                {role}
              </Pill>
            ))}
          </div>
        </div>
        {user.enabled ? (
          <ActionButton onClick={onBan} disabled={isActing} tone="danger">
            Ban
          </ActionButton>
        ) : (
          <ActionButton onClick={onUnban} disabled={isActing} tone="success">
            Unban
          </ActionButton>
        )}
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <InfoMetric label="Joined" value={formatDateTime(user.createdAt)} />
        <InfoMetric
          label="Rating"
          value={user.ratingAvg != null ? `${user.ratingAvg.toFixed(1)} / 5` : 'No reviews'}
        />
        <InfoMetric label="Review count" value={String(user.ratingCount ?? 0)} />
      </div>
    </div>
  )
}

function ItemAdminCard({
  item,
  onHide,
  isActing,
}: {
  item: AdminItem
  onHide: () => void
  isActing: boolean
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">{item.title}</p>
          <p className="mt-1 text-xs text-slate-500">
            {item.ownerUsername}
            {item.categoryName ? ` | ${item.categoryName}` : ''}
          </p>
        </div>
        <Pill tone={item.published ? 'green' : 'slate'}>
          {item.published ? 'Published' : 'Hidden'}
        </Pill>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <InfoMetric
          label="Price"
          value={item.price != null ? `${item.price.toLocaleString()} ${item.currency}` : 'On request'}
        />
        <InfoMetric
          label="Rating"
          value={item.ratingAvg != null ? `${item.ratingAvg.toFixed(1)} (${item.ratingCount})` : 'No reviews'}
        />
        <InfoMetric label="Created" value={formatDate(item.createdAt)} />
        <InfoMetric label="Updated" value={formatDate(item.updatedAt)} />
      </div>

      {item.description && (
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{item.description}</p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-slate-400">Listing #{item.id}</span>
        {item.published && (
          <ActionButton onClick={onHide} disabled={isActing} tone="danger">
            Hide listing
          </ActionButton>
        )}
      </div>
    </div>
  )
}

function RecentBookingCard({ booking }: { booking: AdminBooking }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">
            {booking.itemTitle ?? `Item #${booking.itemId}`}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {booking.renterUsername ?? `User #${booking.renterId}`} {'->'}{' '}
            {booking.ownerUsername ?? `User #${booking.ownerId}`}
          </p>
        </div>
        <BookingBadge status={booking.status} />
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <InfoMetric label="Window" value={`${formatDate(booking.dateFrom)} - ${formatDate(booking.dateTo)}`} />
        <InfoMetric label="Created" value={formatDateTime(booking.createdAt)} />
      </div>
    </div>
  )
}

function BookingLedgerRow({ booking }: { booking: AdminBooking }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">
            {booking.itemTitle ?? `Item #${booking.itemId}`}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {booking.renterUsername ?? `Renter #${booking.renterId}`} {'->'}{' '}
            {booking.ownerUsername ?? `Owner #${booking.ownerId}`}
          </p>
        </div>
        <BookingBadge status={booking.status} />
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <InfoMetric label="Dates" value={`${formatDate(booking.dateFrom)} - ${formatDate(booking.dateTo)}`} />
        <InfoMetric
          label="Total"
          value={booking.totalPrice != null ? formatCurrency(booking.totalPrice) : 'N/A'}
        />
        <InfoMetric label="Created" value={formatDateTime(booking.createdAt)} />
      </div>
    </div>
  )
}

function InfoMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  )
}

function Pill({
  children,
  tone,
}: {
  children: ReactNode
  tone: 'slate' | 'green' | 'rose'
}) {
  const toneClass =
    {
      slate: 'bg-slate-200 text-slate-700',
      green: 'bg-emerald-100 text-emerald-800',
      rose: 'bg-rose-100 text-rose-700',
    }[tone]

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${toneClass}`}>
      {children}
    </span>
  )
}

function ActionButton({
  children,
  onClick,
  disabled,
  tone,
}: {
  children: ReactNode
  onClick: () => void
  disabled: boolean
  tone: 'danger' | 'success'
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-rose-200 bg-white text-rose-600 hover:bg-rose-50'
      : 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${toneClass}`}
    >
      {children}
    </button>
  )
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="h-10 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-10 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-10 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ItemGridSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-3 w-1/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="h-10 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-10 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-10 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-10 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message, compact = false }: { message: string; compact?: boolean }) {
  return (
    <div
      className={`rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-500 ${
        compact ? 'px-5 py-8' : 'px-6 py-12'
      }`}
    >
      {message}
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {message}
    </div>
  )
}

function buildActivityBars(bookings: AdminBooking[]) {
  const bars = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))
    const key = date.toISOString().slice(0, 10)
    const label = date.toLocaleDateString('en-GB', { weekday: 'short' })
    const count = bookings.filter((booking) => booking.createdAt.slice(0, 10) === key).length
    return { key, label, count }
  })

  const maxCount = Math.max(...bars.map((bar) => bar.count), 1)

  return bars.map((bar) => ({
    ...bar,
    height: Math.max((bar.count / maxCount) * 100, bar.count > 0 ? 12 : 6),
  }))
}

function getShare(part: number, total: number) {
  if (total <= 0) return 0
  return (part / total) * 100
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function formatCurrency(value: number) {
  return `${Math.round(value).toLocaleString()} KZT`
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
