export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface EmailRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}

export interface AuthTokenResponse {
  token: string
}

export interface ApiMessageResponse {
  message: string
  email?: string
}

export interface RegisterResponse extends ApiMessageResponse {
  requiresEmailVerification: boolean
}

export interface CurrentUser {
  userId: number
  username: string
  email: string | null
  emailVerified: boolean
  enabled: boolean
  roles: string[]
  permissions: string[]
}

export interface ApiErrorResponse {
  code?: string
  message?: string
  details?: unknown
  error?: string
}

// Pagination wrapper from Spring Data
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number // current page (0-indexed)
  size: number
  last: boolean
}

export interface Category {
  id: number
  name: string
}

export interface ItemImage {
  id: number
  publicId: string
  url: string
}

export interface Item {
  id: number
  ownerId: number
  categoryId: number | null
  categoryName: string | null
  title: string
  description: string | null
  price: number | null
  currency: string
  published: boolean
  createdAt: string
  updatedAt: string
  images: ItemImage[]
}

export interface ItemCreateRequest {
  categoryId?: number
  title: string
  description?: string
  price?: number
  currency?: string
}

export interface ItemUpdateRequest {
  categoryId?: number
  title?: string
  description?: string
  price?: number
  currency?: string
}

export interface ItemsQuery {
  q?: string
  categoryId?: number
  ownerId?: number
  minPrice?: number
  maxPrice?: number
  published?: boolean
  page?: number
  size?: number
}

export type BookingStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'

export interface Booking {
  id: number
  itemId: number
  renterId: number
  ownerId: number
  dateFrom: string
  dateTo: string
  status: BookingStatus
  totalPrice: number | null
  renterNote: string | null
  createdAt: string
  updatedAt: string
}

export interface BookingCreateRequest {
  itemId: number
  dateFrom: string
  dateTo: string
  renterNote?: string
}

export interface Review {
  id: number
  bookingId: number
  itemId: number
  authorId: number
  targetUserId: number
  rating: number
  comment: string | null
  createdAt: string
}

export interface ReviewCreateRequest {
  bookingId: number
  rating: number
  comment?: string
}
