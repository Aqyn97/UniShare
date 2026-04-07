import axios from 'axios'
import type { AxiosError } from 'axios'
import { getStoredToken } from '../../features/auth/storage'
import type { ApiErrorResponse } from './types'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? '/api'

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()

  if (token) {
    config.headers = config.headers ?? {}
    config.headers['x-session'] = token
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }

    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      'Request failed'
    )
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unexpected error'
}
