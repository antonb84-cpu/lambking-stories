/**
 * Recently opened / edited books.
 *
 * Content work is rarely one-and-done: the same handful of books gets
 * reopened over and over while art, audio and translations trickle in. The
 * book dropdown therefore pins the most recent ones to the top, and this
 * module is the shared, localStorage-backed history behind that list.
 *
 * State lives at module scope (not inside the composable) so every caller —
 * the dashboard that records a visit and the browser that renders it — sees
 * the same ref. Persistence means the shortcut survives the page reloads
 * that punctuate an editing session.
 *
 * More ids are kept than are displayed: a deleted or filtered-out book would
 * otherwise burn one of the visible slots until it's pushed out naturally.
 */
import { ref } from 'vue'

const STORAGE_KEY = 'adminui.recentBooks'

/** How many entries the dropdown pins to the top. */
export const RECENT_LIMIT = 4

/** How many ids are remembered, so deleted books don't eat visible slots. */
const HISTORY_LIMIT = 16

function read(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === 'string' && !!x).slice(0, HISTORY_LIMIT)
  } catch {
    return []
  }
}

const recentBookIds = ref<string[]>(read())

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentBookIds.value))
  } catch {
    /* private mode / quota — the in-memory list still works for this session */
  }
}

export function useRecentBooks() {
  /** Move `bookId` to the front of the history. Call on open and on save. */
  function touchBook(bookId: string) {
    if (!bookId) return
    recentBookIds.value = [
      bookId,
      ...recentBookIds.value.filter((id) => id !== bookId)
    ].slice(0, HISTORY_LIMIT)
    persist()
  }

  /** Drop a deleted book so it can't resurface after an id gets reused. */
  function forgetBook(bookId: string) {
    if (!recentBookIds.value.includes(bookId)) return
    recentBookIds.value = recentBookIds.value.filter((id) => id !== bookId)
    persist()
  }

  return { recentBookIds, touchBook, forgetBook }
}
