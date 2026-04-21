/**
 * Restore a JSON(.gz) backup produced by the nightly BackupService.
 *
 * Usage:
 *   pnpm restore:backup -- --file=./backup.json.gz              # dry-run
 *   pnpm restore:backup -- --file=./backup.json.gz --apply      # write to DB
 *   pnpm restore:backup -- --file=./backup.json.gz --apply --drop
 *
 * Semantics:
 *   - Without --drop: each document is upserted by `_id`, so running against a
 *     populated DB merges rather than wiping.
 *   - With --drop: the target collection is dropped before the restore (safest
 *     for a true point-in-time rollback, lossy for anything created after the
 *     snapshot).
 *
 * The file may be either raw JSON or gzipped JSON (`.json.gz`); both are
 * auto-detected from the gzip magic bytes.
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { gunzipSync } from 'node:zlib'
import mongoose from 'mongoose'
import { EJSON } from 'bson'

function arg(name: string): string | undefined {
  const prefix = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : undefined
}

function readDump(filePath: string): { collections: Record<string, unknown[]>; dbName?: string; generatedAt?: string } {
  const abs = path.resolve(filePath)
  if (!fs.existsSync(abs)) {
    console.error(`File not found: ${abs}`)
    process.exit(1)
  }
  let buf = fs.readFileSync(abs)
  if (buf[0] === 0x1f && buf[1] === 0x8b) buf = gunzipSync(buf)
  const parsed = EJSON.parse(buf.toString('utf8')) as {
    collections?: Record<string, unknown[]>
    dbName?: string
    generatedAt?: string
  }
  if (!parsed.collections || typeof parsed.collections !== 'object') {
    console.error('Backup file does not contain a `collections` object')
    process.exit(1)
  }
  return { collections: parsed.collections, dbName: parsed.dbName, generatedAt: parsed.generatedAt }
}

async function main() {
  const file = arg('file')
  const apply = process.argv.includes('--apply')
  const drop = process.argv.includes('--drop')
  const only = arg('only')?.split(',').map((s) => s.trim()).filter(Boolean)

  if (!file) {
    console.error('Missing required --file=<path>')
    process.exit(1)
  }

  const uri = process.env.MONGO_URI
  if (!uri) {
    console.error('MONGO_URI is required (load via dotenv-cli).')
    process.exit(1)
  }
  const dbName = process.env.MONGO_DB_NAME || 'main_db'

  const dump = readDump(file)
  console.log(`→ ${apply ? 'APPLYING' : 'Dry-run'} restore into "${dbName}"`)
  if (dump.dbName) console.log(`  source db:    ${dump.dbName}`)
  if (dump.generatedAt) console.log(`  generated:    ${dump.generatedAt}`)
  console.log(`  drop-first:   ${drop ? 'yes' : 'no (upsert by _id)'}`)

  await mongoose.connect(uri, { dbName })
  const db = mongoose.connection.db
  if (!db) throw new Error('No database connection')

  const collNames = Object.keys(dump.collections).filter((n) => (only ? only.includes(n) : true))
  for (const name of collNames) {
    const docs = dump.collections[name] as { _id?: unknown }[]
    console.log(`  ${name}: ${docs.length} docs`)
    if (!apply) continue

    const coll = db.collection(name)
    if (drop) {
      try {
        await coll.drop()
      } catch {
        // collection may not exist yet
      }
      if (docs.length) await coll.insertMany(docs as never[], { ordered: false })
      continue
    }

    for (const doc of docs) {
      if (!doc._id) {
        await coll.insertOne(doc as never)
        continue
      }
      const { _id, ...rest } = doc as Record<string, unknown>
      await coll.replaceOne({ _id }, rest as never, { upsert: true })
    }
  }

  if (!apply) console.log('\nDry run — no changes written. Re-run with --apply.')

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
