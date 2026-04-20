import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

process.env.NODE_ENV = 'test'
process.env.LOG_LEVEL = 'error'
process.env.ADMIN_USER = 'admin'
process.env.ADMIN_PASSWORD = 'test-password-123'
process.env.MONGO_URI = 'mongodb://127.0.0.1:0/placeholder'
process.env.REDIS_ENABLED = 'true'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.TRANSLATION_ENABLED = 'false'
process.env.AUDIOBOOKS_DIR = './tests/.tmp/audiobooks'
process.env.UPLOADS_DIR = './tests/.tmp/uploads'
process.env.PUBLIC_BASE_URL = 'http://localhost:4000'

// Redis mock
vi.mock('ioredis', async () => {
  const RedisMock = (await import('ioredis-mock')).default
  return { default: RedisMock, Redis: RedisMock }
})

// Stub out the @huggingface/transformers import so tests don't try to download a model.
vi.mock('@huggingface/transformers', () => ({
  pipeline: async () => async (text: string) => [{ translation_text: `[en] ${text}` }]
}))

let memoryServer: MongoMemoryServer | null = null

beforeAll(async () => {
  memoryServer = await MongoMemoryServer.create()
  process.env.MONGO_URI = memoryServer.getUri()
  const { connectDatabase } = await import('../src/config/db.js')
  await connectDatabase(process.env.MONGO_URI)
})

afterEach(async () => {
  const collections = mongoose.connection.collections
  for (const key of Object.keys(collections)) {
    await collections[key]!.deleteMany({})
  }
  const { CacheService } = await import('../src/services/CacheService.js')
  await CacheService.clearAll()
})

afterAll(async () => {
  await mongoose.disconnect()
  if (memoryServer) await memoryServer.stop()
  const { disconnectRedis } = await import('../src/config/redis.js')
  await disconnectRedis()
})
