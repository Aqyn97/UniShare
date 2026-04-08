import { apiClient } from './client'
import type { Review, ReviewCreateRequest } from './types'

export function fetchItemReviews(itemId: number) {
  return apiClient.get<Review[]>(`/items/${itemId}/reviews`)
}

export function createReview(data: ReviewCreateRequest) {
  return apiClient.post<Review>('/reviews', data)
}
