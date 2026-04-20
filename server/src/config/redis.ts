import Redis, { type Redis as RedisClient } from 'ioredis'
import { env } from './env.js'
import { logger } from './logger.js'

let client: RedisClient | null = null
let lastUnavailableLog = 0

export function getRedis(): RedisClient | null {
  if (!env.REDIS_ENABLED) return null
  if (client) return client

  client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    reconnectOnError: () => true
  })

  client.on('error', (err) => {
    const now = Date.now()
    if (now - lastUnavailableLog > 60_000) {
      lastUnavailableLog = now
      logger.warn('Redis unavailable, degrading to DB-only reads', { err: err.message })
    }
  })
  client.on('connect', () => logger.info('Redis connected'))
  client.on('ready', () => logger.info('Redis ready'))

  client.connect().catch(() => {
  })
  return client
}

export async function pingRedis(): Promise<boolean> {
  const c = getRedis()
  if (!c) return false
  try {
    const res = await c.ping()
    return res === 'PONG'
  } catch {
    return false
  }
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit().catch(() => {
    })
    client = null
  }
}

export function setRedisForTests(mock: RedisClient | null): void {
  client = mock
}
