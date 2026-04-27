import { apiClient } from './client'
import type { BookDTO } from '@/types'

export const booksApi = {
  // `?all=true` includes books in the reserved "NO SHOW" category, which the
  // public Book app filters out. The AdminUI needs the full list.
  list: () => apiClient.get<{ books: BookDTO[] }>('/api/books?all=true').then((r) => r.books),
  get: (id: string) => apiClient.get<{ book: BookDTO }>(`/api/book/${encodeURIComponent(id)}`).then((r) => r.book),
  create: (book: BookDTO) => apiClient.post<{ book: BookDTO }>('/api/books', book).then((r) => r.book),
  update: (id: string, patch: Partial<BookDTO>) =>
    apiClient.put<{ book: BookDTO }>(`/api/book/${encodeURIComponent(id)}`, patch).then((r) => r.book),
  remove: (id: string) => apiClient.del<void>(`/api/book/${encodeURIComponent(id)}`)
}
