import { apiClient } from './client'
import type { Item, ItemCreateRequest, ItemUpdateRequest, ItemsQuery, Page } from './types'

export function fetchItems(query: ItemsQuery = {}) {
  return apiClient.get<Page<Item>>('/items', { params: query })
}

export function fetchItem(id: number) {
  return apiClient.get<Item>(`/items/${id}`)
}

export function createItem(data: ItemCreateRequest) {
  return apiClient.post<Item>('/items', data)
}

export function updateItem(id: number, data: ItemUpdateRequest) {
  return apiClient.patch<Item>(`/items/${id}`, data)
}

export function deleteItem(id: number) {
  return apiClient.delete(`/items/${id}`)
}

export function publishItem(id: number) {
  return apiClient.post<Item>(`/items/${id}/publish`)
}

export function hideItem(id: number) {
  return apiClient.post<Item>(`/items/${id}/hide`)
}

export function attachItemImage(id: number, publicId: string, url: string) {
  return apiClient.post<Item[]>(`/items/${id}/images`, { publicId, url })
}

export function deleteItemImage(itemId: number, imageId: number) {
  return apiClient.delete(`/items/${itemId}/images/${imageId}`)
}
