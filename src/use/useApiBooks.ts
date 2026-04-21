/**
 * Reactive store of books fetched from the Render API, layered on top of the
 * IndexedDB cache (`useBookCache`). Cache-first: always returns the cached
 * copy if present, then kicks off a network check in the background to
 * refresh the cache when `updatedDate` advances. This is the single source of
 * truth for book content app-side; `useModels` only retains watch-list /
 * last-read / playback state and the (static) series catalogue.
 */
import { reactive, readonly } from 'vue'
import { booksApi } from '@/api/booksApi'
import useBookCache from '@/use/useBookCache'
import type { ApiBook } from '@/types/apiBook'

const state = reactive<{
  byId: Record<string, ApiBook>
  all: ApiBook[] | null
  loading: Record<string, boolean>
  listLoading: boolean
  error: string | null
}>({
  byId: {},
  all: null,
  loading: {},
  listLoading: false,
  error: null
})

const cache = useBookCache()

async function refreshBookInBackground(bookId: string): Promise<void> {
  try {
    const fresh = await booksApi.getById(bookId)
    const cached = await cache.getCached(bookId)
    const cachedMs = cached ? Date.parse(cached.updatedDate) : 0
    const freshMs = Date.parse(fresh.updatedDate)
    if (!cached || !Number.isFinite(cachedMs) || freshMs > cachedMs) {
      await cache.invalidateBookBlobs(bookId)
      await cache.saveBook(fresh)
      state.byId[bookId] = fresh
    }
    void cache.prefetchBlobs(fresh)
  } catch {
    // offline or server hiccup — cached copy stays authoritative
  }
}

async function loadBook(bookId: string): Promise<ApiBook | null> {
  if (state.loading[bookId]) return state.byId[bookId] ?? null
  state.loading[bookId] = true
  try {
    const cached = await cache.getCached(bookId)
    if (cached) {
      state.byId[bookId] = cached
      void refreshBookInBackground(bookId)
      return cached
    }
    const fresh = await booksApi.getById(bookId)
    await cache.saveBook(fresh)
    state.byId[bookId] = fresh
    void cache.prefetchBlobs(fresh)
    return fresh
  } catch (err) {
    state.error = (err as Error).message
    return state.byId[bookId] ?? null
  } finally {
    state.loading[bookId] = false
  }
}

async function loadAllBooks(): Promise<ApiBook[]> {
  if (state.listLoading) return state.all ?? []
  state.listLoading = true
  try {
    const books = await booksApi.list()
    state.all = books
    for (const b of books) {
      state.byId[b.bookId] = b
      void cache.saveBook(b)
    }
    return books
  } catch (err) {
    state.error = (err as Error).message
    return state.all ?? []
  } finally {
    state.listLoading = false
  }
}

function booksOfSeries(seriesId: string): ApiBook[] {
  const list = state.all ?? Object.values(state.byId)
  return list
    .filter((b) => b.bookSeriesId === seriesId)
    .sort((a, b) => (a.bookId < b.bookId ? -1 : a.bookId > b.bookId ? 1 : 0))
}

function nextBookInSeries(book: ApiBook): ApiBook | null {
  const siblings = booksOfSeries(book.bookSeriesId)
  if (!siblings.length) return null
  const idx = siblings.findIndex((b) => b.bookId === book.bookId)
  if (idx < 0 || idx >= siblings.length - 1) return null
  return siblings[idx + 1] ?? null
}

export const useApiBooks = () => {
  return {
    state: readonly(state),
    loadBook,
    loadAllBooks,
    booksOfSeries,
    nextBookInSeries,
    getById: (id: string): ApiBook | null => state.byId[id] ?? null
  }
}

export default useApiBooks
