import mongoose from 'mongoose'
import { env } from './env.js'
import { logger } from './logger.js'

export async function connectDatabase(uri: string = env.MONGO_URI): Promise<void> {
  mongoose.connection.on('connected', () => logger.info('MongoDB connected'))
  mongoose.connection.on('error', (err) => logger.error('MongoDB error', { err }))
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'))

  await mongoose.connect(uri, {
    dbName: env.MONGO_DB_NAME,
    serverSelectionTimeoutMS: 10_000,
    autoIndex: env.NODE_ENV !== 'production'
  })
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect()
}

export async function pingDatabase(): Promise<boolean> {
  try {
    const state = mongoose.connection.readyState
    if (state !== 1) return false
    if (!mongoose.connection.db) return false
    await mongoose.connection.db.admin().ping()
    return true
  } catch {
    return false
  }
}
