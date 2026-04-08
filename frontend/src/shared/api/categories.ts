import { apiClient } from './client'
import type { Category } from './types'

export function fetchCategories() {
  return apiClient.get<Category[]>('/categories')
}
