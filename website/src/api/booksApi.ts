import type { BookDTO } from '@/types/book'
import { runtime } from '@/config/runtime'

interface ListResponse {
  books: BookDTO[]
}

export async function fetchBooks(): Promise<BookDTO[]> {
  const res = await fetch(`${runtime.apiBaseUrl}/api/books`, {
    headers: { Accept: 'application/json' }
  })
  if (!res.ok) {
    throw new Error(`Books request failed: ${res.status} ${res.statusText}`)
  }
  const data: ListResponse = await res.json()
  return data.books ?? []
}
