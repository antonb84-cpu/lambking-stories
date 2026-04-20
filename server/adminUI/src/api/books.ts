import { apiClient } from './client'
import type { BookDTO } from '@/types'

export const booksApi = {
  list: () => apiClient.get<{ books: BookDTO[] }>('/api/books').then((r) => r.books),
  get: (id: string) => apiClient.get<{ book: BookDTO }>(`/api/book/${encodeURIComponent(id)}`).then((r) => r.book),
  create: (book: BookDTO) => apiClient.post<{ book: BookDTO }>('/api/books', book).then((r) => r.book),
  update: (id: string, patch: Partial<BookDTO>) =>
    apiClient.put<{ book: BookDTO }>(`/api/book/${encodeURIComponent(id)}`, patch).then((r) => r.book),
  remove: (id: string) => apiClient.del<void>(`/api/book/${encodeURIComponent(id)}`)
}
