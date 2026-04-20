import { getRedis } from '../config/redis.js'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

const BOOKS_LIST_KEY = 'books:all'
const bookKey = (id: string) => `book:${id}`

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    logger.debug('cache op failed', { err: (err as Error).message })
    return fallback
  }
}

export const CacheService = {
  async getBooksList<T>(): Promise<T | null> {
    const r = getRedis()
    if (!r) return null
    const raw = await safe(() => r.get(BOOKS_LIST_KEY), null as string | null)
    return raw ? (JSON.parse(raw) as T) : null
  },

  async setBooksList<T>(data: T): Promise<void> {
    const r = getRedis()
    if (!r) return
    await safe(() => r.set(BOOKS_LIST_KEY, JSON.stringify(data), 'EX', env.CACHE_TTL_SECONDS), undefined)
  },

  async getBook<T>(id: string): Promise<T | null> {
    const r = getRedis()
    if (!r) return null
    const raw = await safe(() => r.get(bookKey(id)), null as string | null)
    return raw ? (JSON.parse(raw) as T) : null
  },

  async setBook<T>(id: string, data: T): Promise<void> {
    const r = getRedis()
    if (!r) return
    await safe(() => r.set(bookKey(id), JSON.stringify(data), 'EX', env.CACHE_TTL_SECONDS), undefined)
  },

  async invalidateBooks(id?: string): Promise<void> {
    const r = getRedis()
    if (!r) return
    const keys = [BOOKS_LIST_KEY]
    if (id) keys.push(bookKey(id))
    await safe(() => r.del(...keys), 0)
  },

  async clearAll(): Promise<void> {
    const r = getRedis()
    if (!r) return
    await safe(() => r.flushdb(), 'OK')
  }
}
