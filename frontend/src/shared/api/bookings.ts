import { apiClient } from './client'
import type { Booking, BookingCreateRequest } from './types'

export function createBooking(data: BookingCreateRequest) {
  return apiClient.post<Booking>('/bookings', data)
}

export function fetchMyBookings(role: 'renter' | 'owner' = 'renter') {
  return apiClient.get<Booking[]>('/bookings', { params: { role } })
}

export function fetchBooking(id: number) {
  return apiClient.get<Booking>(`/bookings/${id}`)
}

export function approveBooking(id: number) {
  return apiClient.post<Booking>(`/bookings/${id}/approve`)
}

export function rejectBooking(id: number) {
  return apiClient.post<Booking>(`/bookings/${id}/reject`)
}

export function handoverBooking(id: number) {
  return apiClient.post<Booking>(`/bookings/${id}/handover`)
}

export function returnBooking(id: number) {
  return apiClient.post<Booking>(`/bookings/${id}/return`)
}

export function cancelBooking(id: number) {
  return apiClient.post<Booking>(`/bookings/${id}/cancel`)
}
