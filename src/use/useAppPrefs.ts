/**
 * Tiny IndexedDB-backed key-value store for cross-session app preferences
 * (layout choices, sort order, last-opened tab, …).
 *
 * Sits next to `useBookCache` and `useUserDb` but stays generic so any
 * view can persist a small JSON-serialisable value without touching a
 * domain-specific schema. Errors (private mode, quota, missing IDB) are
 * swallowed — preferences are best-effort, never load-bearing.
 */
const DB_NAME = 'kanaan-app-prefs'
const DB_VERSION = 1
const STORE = 'prefs'

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
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('Failed to open prefs DB'))
  })
  return dbPromise
}

export async function getPref<T>(key: string): Promise<T | undefined> {
  try {
    const db = await openDb()
    return await new Promise<T | undefined>((resolve, reject) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
      req.onsuccess = () => resolve((req.result as { value?: T } | undefined)?.value)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return undefined
  }
}

export async function setPref<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const req = db
        .transaction(STORE, 'readwrite')
        .objectStore(STORE)
        .put({ key, value })
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch {
    // best-effort persistence
  }
}
