import type { ApiBook, ApiBookListResponse, ApiBookResponse } from '@/types/apiBook'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'https://lbs-be.onrender.com')
  .replace(/\/+$/, '')

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { accept: 'application/json', ...(init?.headers ?? {}) }
  })
  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText} on ${path}`)
  }
  return (await res.json()) as T
}

export const booksApi = {
  apiBase: API_BASE,

  async list(): Promise<ApiBook[]> {
    const data = await request<ApiBookListResponse>('/api/books')
    return data.books ?? []
  },

  async getById(bookId: string): Promise<ApiBook> {
    const data = await request<ApiBookResponse>(`/api/book/${encodeURIComponent(bookId)}`)
    return data.book
  }
}
