import mongoose from 'mongoose'
import { gzipSync } from 'node:zlib'
import { EJSON } from 'bson'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

export interface BackupDump {
  schemaVersion: 1
  generatedAt: string
  dbName: string
  collections: Record<string, unknown[]>
  counts: Record<string, number>
}

export interface BackupArtifact {
  filename: string
  buffer: Buffer
  rawBytes: number
  gzippedBytes: number
  counts: Record<string, number>
  generatedAt: string
}

async function dumpAll(): Promise<BackupDump> {
  const db = mongoose.connection.db
  if (!db) throw new Error('MongoDB is not connected; cannot run backup')

  const collections = await db.listCollections().toArray()
  const out: Record<string, unknown[]> = {}
  const counts: Record<string, number> = {}

  for (const { name } of collections) {
    if (name.startsWith('system.')) continue
    const docs = await db.collection(name).find({}).toArray()
    out[name] = docs
    counts[name] = docs.length
  }

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    dbName: env.MONGO_DB_NAME,
    collections: out,
    counts
  }
}

function stamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    '-' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes())
  )
}

export const BackupService = {
  async createArtifact(): Promise<BackupArtifact> {
    const dump = await dumpAll()
    // EJSON preserves ObjectId / Date / Decimal128 types so restore is
    // faithful. `relaxed: false` keeps `$oid` / `$date` wrappers so a plain
    // Mongo driver restore re-hydrates them.
    const json = EJSON.stringify(dump, { relaxed: false })
    const raw = Buffer.from(json, 'utf8')
    const gz = gzipSync(raw, { level: 9 })
    const when = new Date()
    const filename = `${env.MONGO_DB_NAME}-backup-${stamp(when)}.json.gz`
    logger.info('backup artifact built', {
      filename,
      rawBytes: raw.byteLength,
      gzippedBytes: gz.byteLength,
      counts: dump.counts
    })
    return {
      filename,
      buffer: gz,
      rawBytes: raw.byteLength,
      gzippedBytes: gz.byteLength,
      counts: dump.counts,
      generatedAt: dump.generatedAt
    }
  }
}
