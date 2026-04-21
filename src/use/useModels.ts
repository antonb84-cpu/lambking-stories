import { computed, ref } from 'vue'
import { prependBaseUrl } from '@/utils/function'

// ---------------------------------------------------------------------------
// Legacy helper kept for existing call sites (tests, useAssets, useMatch...)
// ---------------------------------------------------------------------------
export const modelImgPath = (id: string) => {
  return prependBaseUrl(`images/models/${id}_256x256.webp`)
}

// ---------------------------------------------------------------------------
// Story / book data model
// ---------------------------------------------------------------------------
export interface BookAudio {
  en: string
  de: string
}

export interface PlaybackState {
  time?: number
  page?: number
  audioSrc?: string
  updatedAt?: number
}

export interface Page {
  page: number
  title: string
  text: string
}

export interface Book {
  id: string
  title: string
  author: string
  releaseDate: string // ISO 8601
  badges: string[]
  shortDescription: string
  description: string
  content: Page[]
  audio: BookAudio
  // optional cover gradient (CSS) - placeholder visual
  cover?: string
  coverImage?: string
  previewImage?: string
}

export interface BookSeries {
  id: string
  name: string
  description: string
  bookIds: string[]
  cover?: string
  coverImage?: string
}

// ----- Books ---------------------------------------------------------------
// Book content now comes from the API (see useApiBooks). The legacy in-memory
// catalogue is retained as an empty array so the few legacy lookups
// (`getBook`, `lastReadBook`, etc.) keep returning undefined safely until
// every consumer is migrated.
export const BOOKS: Book[] = []

// ----- Series --------------------------------------------------------------
export const BOOK_SERIES: BookSeries[] = [
  {
    id: 'fruit-agents',
    name: 'Fruit Agents',
    description: 'Five sweet stories about the fruits of the Bible — and the friends who carried them.',
    bookIds: ['fa-1-piece', 'fa-2-lemon', 'fa-3-grape', 'fa-4-pomegranate', 'fa-5-olive'],
    cover: 'linear-gradient(135deg, #F1C40F 0%, #E67E22 100%)',
    coverImage: prependBaseUrl('images/fruit-agents/cover-fruit-agents_1024x1024.jpeg')
  }
]

// ---------------------------------------------------------------------------
// Persistent reactive state — watch list & last-read book
// ---------------------------------------------------------------------------
const LS_WATCH_LIST = 'kanaan.watchList'
const LS_LAST_READ = 'kanaan.lastReadId'
const LS_PLAYBACK = 'kanaan.playback'

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const watchListIds = ref<string[]>(readJSON<string[]>(LS_WATCH_LIST, []))
const lastReadId = ref<string | null>(readJSON<string | null>(LS_LAST_READ, null))
const playbackStates = ref<Record<string, PlaybackState>>(readJSON<Record<string, PlaybackState>>(LS_PLAYBACK, {}))

function persistWatchList() {
  try {
    localStorage.setItem(LS_WATCH_LIST, JSON.stringify(watchListIds.value))
  } catch {
  }
}

function persistLastRead() {
  try {
    localStorage.setItem(LS_LAST_READ, JSON.stringify(lastReadId.value))
  } catch {
  }
}

function persistPlayback() {
  try {
    localStorage.setItem(LS_PLAYBACK, JSON.stringify(playbackStates.value))
  } catch {
  }
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------
const useModels = () => {
  const getBook = (id: string): Book | undefined => BOOKS.find(b => b.id === id)
  const getSeries = (id: string): BookSeries | undefined => BOOK_SERIES.find(s => s.id === id)
  const getBooksOfSeries = (id: string): Book[] => {
    const series = getSeries(id)
    if (!series) return []
    return series.bookIds.map(bid => getBook(bid)).filter(Boolean) as Book[]
  }
  const getSeriesOfBook = (bookId: string): BookSeries | undefined => {
    return BOOK_SERIES.find(s => s.bookIds.includes(bookId))
  }

  // Watch list ----------------------------------------------------------
  const isInWatchList = (bookId: string) => watchListIds.value.includes(bookId)
  const addToWatchList = (bookId: string) => {
    if (!isInWatchList(bookId)) {
      watchListIds.value = [...watchListIds.value, bookId]
      persistWatchList()
    }
  }
  const removeFromWatchList = (bookId: string) => {
    watchListIds.value = watchListIds.value.filter(id => id !== bookId)
    persistWatchList()
  }
  const toggleWatchList = (bookId: string) => {
    isInWatchList(bookId) ? removeFromWatchList(bookId) : addToWatchList(bookId)
  }
  const watchListBooks = computed<Book[]>(() =>
    watchListIds.value.map(id => getBook(id)).filter(Boolean) as Book[]
  )

  // Last read -----------------------------------------------------------
  const setLastRead = (bookId: string) => {
    lastReadId.value = bookId
    persistLastRead()
  }
  const lastReadBook = computed<Book | null>(() =>
    lastReadId.value ? getBook(lastReadId.value) ?? null : null
  )

  // Playback state ------------------------------------------------------
  const getPlaybackState = (bookId: string): PlaybackState | undefined =>
    playbackStates.value[bookId]
  const setPlaybackState = (bookId: string, state: PlaybackState) => {
    playbackStates.value = {
      ...playbackStates.value,
      [bookId]: { ...playbackStates.value[bookId], ...state, updatedAt: Date.now() }
    }
    persistPlayback()
  }
  const clearPlaybackState = (bookId: string) => {
    const next = { ...playbackStates.value }
    delete next[bookId]
    playbackStates.value = next
    persistPlayback()
  }

  // Stubs kept for `useUser.resetGameProgress` compatibility ------------
  const getStartCollection = () => []
  const saveCollection = (_collection: any) => {
  }

  return {
    modelImgPath,
    BOOKS,
    BOOK_SERIES,
    getBook,
    getSeries,
    getBooksOfSeries,
    getSeriesOfBook,
    // watch list
    watchListIds,
    watchListBooks,
    isInWatchList,
    addToWatchList,
    removeFromWatchList,
    toggleWatchList,
    // last read
    lastReadId,
    lastReadBook,
    setLastRead,
    // playback state
    getPlaybackState,
    setPlaybackState,
    clearPlaybackState,
    // legacy stubs
    getStartCollection,
    saveCollection
  }
}

export default useModels
