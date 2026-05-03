import type { BookDTO } from '@/types/book'
import { runtime } from '@/config/runtime'
import { enqueueServerRetry, markServerDown } from '@/composables/useServerStatus'

interface ListResponse {
  books: BookDTO[]
}

const OFFLINE_STATUSES = new Set([502, 503, 504])

async function performFetchBooks(): Promise<BookDTO[]> {
  const res = await fetch(`${runtime.apiBaseUrl}/api/books`, {
    headers: { Accept: 'application/json' }
  })
  if (OFFLINE_STATUSES.has(res.status)) {
    const err = new Error(`offline:${res.status}`) as Error & { __offline: true }
    err.__offline = true
    throw err
  }
  if (!res.ok) {
    throw new Error(`Books request failed: ${res.status} ${res.statusText}`)
  }
  const data: ListResponse = await res.json()
  return data.books ?? []
}

export async function fetchBooks(): Promise<BookDTO[]> {
  try {
    return await performFetchBooks()
  } catch (err) {
    const offline =
      (err as Error & { __offline?: true })?.__offline === true || err instanceof TypeError
    if (!offline) throw err
    // Park the request until /healthz comes back; the caller's await
    // simply pauses on this promise instead of propagating the error.
    markServerDown()
    return new Promise<BookDTO[]>((resolve, reject) => {
      enqueueServerRetry(async () => {
        try {
          resolve(await performFetchBooks())
        } catch (retryErr) {
          reject(retryErr)
        }
      })
    })
  }
}
