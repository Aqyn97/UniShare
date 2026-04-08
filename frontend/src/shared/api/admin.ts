import { apiClient } from './client'
import type { Booking, BookingStatus } from './types'

export interface AdminUser {
  userId: number
  username: string
  email: string | null
  enabled: boolean
  roles: string[]
}

export interface AdminItem {
  id: number
  ownerId: number
  ownerUsername: string
  categoryName: string | null
  title: string
  price: number | null
  currency: string
  published: boolean
  createdAt: string
}

export interface AdminStats {
  usersCount: number
  itemsCount: number
  bookingsCount: number
  reviewsCount: number
  averageRating: number | null
}

export function fetchAdminStats() {
  return apiClient.get<AdminStats>('/admin/stats')
}

export function fetchAdminUsers() {
  return apiClient.get<AdminUser[]>('/admin/users')
}

export function banUser(id: number) {
  return apiClient.patch<AdminUser>(`/admin/users/${id}/ban`)
}

export function unbanUser(id: number) {
  return apiClient.patch<AdminUser>(`/admin/users/${id}/unban`)
}

export function fetchAdminItems() {
  return apiClient.get<AdminItem[]>('/admin/items')
}

export function hideAdminItem(id: number) {
  return apiClient.patch(`/admin/items/${id}/hide`)
}

export function fetchAdminBookings() {
  return apiClient.get<Booking[]>('/admin/bookings')
}
