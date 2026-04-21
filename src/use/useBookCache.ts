/**
 * Offline-first cache for books: book metadata (JSON) + media blobs (images,
 * audio, attachments) keyed by their absolute URL. Built on IndexedDB so it
 * works unchanged across Electron, the Surge web build, and the future Tauri
 * iOS/Android targets without touching Node fs or Electron IPC.
 *
 * Two object stores:
 *   books   { bookId, updatedDate, book: ApiBook, cachedAt }
 *   blobs   { url, blob, contentType, cachedAt, bookId? }
 *
 * Blobs are returned as `blob:` object URLs the caller can drop straight into
 * <img src>, <audio src>, or <a href>. Object URLs created via `getBlobUrl`
 * live until `releaseBlobUrl` is called — callers that render them in a view
 * should revoke on unmount to avoid leaking during long sessions.
 */
import type { ApiBook } from '@/types/apiBook'

const DB_NAME = 'kanaan-book-cache'
const DB_VERSION = 1
const STORE_BOOKS = 'books'
const STORE_BLOBS = 'blobs'

interface CachedBookRecord {
  bookId: string
  updatedDate: string
  book: ApiBook
  cachedAt: number
}

interface CachedBlobRecord {
  url: string
  blob: Blob
  contentType: string
  cachedAt: number
  bookId?: string
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available in this environment'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_BOOKS)) {
        db.createObjectStore(STORE_BOOKS, { keyPath: 'bookId' })
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        const blobs = db.createObjectStore(STORE_BLOBS, { keyPath: 'url' })
        blobs.createIndex('bookId', 'bookId', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('Failed to open cache DB'))
  })
  return dbPromise
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode)
        const req = fn(transaction.objectStore(store))
        req.onsuccess = () => resolve(req.result as T)
        req.onerror = () => reject(req.error ?? new Error(`IDB op failed on ${store}`))
      })
  )
}

async function getCachedBook(bookId: string): Promise<CachedBookRecord | undefined> {
  try {
    return await tx<CachedBookRecord | undefined>(STORE_BOOKS, 'readonly', (s) =>
      s.get(bookId) as IDBRequest<CachedBookRecord | undefined>
    )
  } catch {
    return undefined
  }
}

async function putCachedBook(book: ApiBook): Promise<void> {
  const rec: CachedBookRecord = {
    bookId: book.bookId,
    updatedDate: book.updatedDate ?? book.updatedAt ?? new Date(0).toISOString(),
    book,
    cachedAt: Date.now()
  }
  try {
    await tx<IDBValidKey>(STORE_BOOKS, 'readwrite', (s) => s.put(rec))
  } catch {
    // best-effort — swallow storage errors (private mode, quota, etc.)
  }
}

async function getCachedBlob(url: string): Promise<CachedBlobRecord | undefined> {
  try {
    return await tx<CachedBlobRecord | undefined>(STORE_BLOBS, 'readonly', (s) =>
      s.get(url) as IDBRequest<CachedBlobRecord | undefined>
    )
  } catch {
    return undefined
  }
}

async function putCachedBlob(url: string, blob: Blob, bookId?: string): Promise<void> {
  const rec: CachedBlobRecord = {
    url,
    blob,
    contentType: blob.type || 'application/octet-stream',
    cachedAt: Date.now(),
    bookId
  }
  try {
    await tx<IDBValidKey>(STORE_BLOBS, 'readwrite', (s) => s.put(rec))
  } catch {
    // ignore — we'll just re-fetch next time
  }
}

async function deleteBlobsForBook(bookId: string): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_BLOBS, 'readwrite')
      const store = transaction.objectStore(STORE_BLOBS)
      const idx = store.index('bookId')
      const req = idx.openCursor(IDBKeyRange.only(bookId))
      req.onsuccess = () => {
        const cursor = req.result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
      req.onerror = () => reject(req.error ?? new Error('Failed to purge blobs'))
    })
  } catch {
    // ignore
  }
}

/**
 * Return a `blob:` object URL for the given absolute URL, fetching and caching
 * the bytes on first miss. On fetch failure falls back to the original URL so
 * the UI still tries to load it directly.
 */
export async function cacheUrlToBlobUrl(url: string, bookId?: string): Promise<string> {
  if (!url) return url
  // Only absolute http(s) URLs are worth caching. Relative paths and blob:
  // URLs are returned as-is.
  if (!/^https?:\/\//i.test(url)) return url
  const hit = await getCachedBlob(url)
  if (hit) return URL.createObjectURL(hit.blob)
  try {
    const res = await fetch(url)
    if (!res.ok) return url
    const blob = await res.blob()
    await putCachedBlob(url, blob, bookId)
    return URL.createObjectURL(blob)
  } catch {
    return url
  }
}

function collectBookUrls(book: ApiBook): string[] {
  const out = new Set<string>()
  const push = (v?: string) => {
    if (v && /^https?:\/\//i.test(v)) out.add(v)
  }
  push(book.coverImage)
  push(book.previewImage)
  push(book.contentCoverImage?.de)
  push(book.contentCoverImage?.en)
  push(book.audio?.de)
  push(book.audio?.en)
  for (const a of book.attachments ?? []) push(a)
  const IMG_RE = /!\[[^\]]*\]\(([^)\s]+)\)|<img[^>]+src=["']([^"']+)["']/gi
  for (const loc of [book.localizations?.de, book.localizations?.en]) {
    for (const page of loc?.content ?? []) {
      const text = page?.text ?? ''
      for (const m of text.matchAll(IMG_RE)) push(m[1] ?? m[2])
    }
  }
  return [...out]
}

export const useBookCache = () => {
  /**
   * Check if the cached copy of `bookId` is up-to-date vs. the freshly fetched
   * `updatedDate`. If stale (or missing), the caller should re-fetch and
   * `save()` it. Returns the cached book on fresh-hit so the caller can skip
   * the network round-trip for blobs entirely.
   */
  async function getIfFresh(bookId: string, remoteUpdatedDate: string): Promise<ApiBook | null> {
    const hit = await getCachedBook(bookId)
    if (!hit) return null
    const localMs = Date.parse(hit.updatedDate)
    const remoteMs = Date.parse(remoteUpdatedDate)
    if (!Number.isFinite(localMs) || !Number.isFinite(remoteMs)) return null
    return localMs >= remoteMs ? hit.book : null
  }

  async function getCached(bookId: string): Promise<ApiBook | null> {
    const hit = await getCachedBook(bookId)
    return hit?.book ?? null
  }

  async function saveBook(book: ApiBook): Promise<void> {
    await putCachedBook(book)
  }

  async function invalidateBookBlobs(bookId: string): Promise<void> {
    await deleteBlobsForBook(bookId)
  }

  /**
   * Background-prefetch every media URL referenced by the book so the reader
   * works offline. Failures are ignored — if the network dies mid-prefetch,
   * the reader falls back to streaming.
   */
  async function prefetchBlobs(book: ApiBook): Promise<void> {
    const urls = collectBookUrls(book)
    await Promise.allSettled(
      urls.map(async (u) => {
        const hit = await getCachedBlob(u)
        if (hit) return
        try {
          const res = await fetch(u)
          if (!res.ok) return
          const blob = await res.blob()
          await putCachedBlob(u, blob, book.bookId)
        } catch {
          // ignore
        }
      })
    )
  }

  async function getBlobUrl(url: string, bookId?: string): Promise<string> {
    return cacheUrlToBlobUrl(url, bookId)
  }

  function releaseBlobUrl(u?: string | null): void {
    if (u && u.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(u)
      } catch {
        // ignore
      }
    }
  }

  return {
    getIfFresh,
    getCached,
    saveBook,
    invalidateBookBlobs,
    prefetchBlobs,
    getBlobUrl,
    releaseBlobUrl
  }
}

export default useBookCache
