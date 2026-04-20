/**
 * Rewrite a host prefix in every string field of every document in every
 * collection. Handles top-level URL fields (coverImage, audio.de, …) and
 * embedded URLs inside HTML content strings (e.g. `<img src="…">` emitted by
 * the TipTap editor).
 *
 * Usage:
 *   pnpm migrate:rewrite-upload-urls -- --from=http://localhost:4000 --to=https://lbs-be.onrender.com
 *   pnpm migrate:rewrite-upload-urls -- --from=http://localhost:4000 --to=https://lbs-be.onrender.com --apply
 *   pnpm migrate:rewrite-upload-urls -- --from=https://lbs-be.onrender.com --to=   # strip host, leave relative
 *
 * Dry-run by default. Idempotent: running twice with the same args is a no-op
 * (nothing matches after the first pass).
 */
import 'dotenv/config'
import mongoose from 'mongoose'

function arg(name: string): string | undefined {
  const prefix = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : undefined
}

function rewriteStrings(value: unknown, from: string, to: string, stats: {
  scanned: number;
  changed: number
}): unknown {
  if (typeof value === 'string') {
    stats.scanned++
    if (value.includes(from)) {
      stats.changed++
      return value.split(from).join(to)
    }
    return value
  }
  if (Array.isArray(value)) {
    return value.map((v) => rewriteStrings(v, from, to, stats))
  }
  if (value && typeof value === 'object' && !(value instanceof Date) && !((value as {
    _bsontype?: string
  })._bsontype)) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = rewriteStrings(v, from, to, stats)
    }
    return out
  }
  return value
}

function diffChangedFields(before: unknown, after: unknown, path = '', out: {
  path: string;
  from: string;
  to: string
}[] = []): typeof out {
  if (typeof before === 'string' && typeof after === 'string') {
    if (before !== after) out.push({ path, from: before, to: after })
    return out
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    for (let i = 0; i < before.length; i++) diffChangedFields(before[i], after[i], `${path}[${i}]`, out)
    return out
  }
  if (before && after && typeof before === 'object' && typeof after === 'object') {
    for (const k of Object.keys(before as Record<string, unknown>)) {
      diffChangedFields((before as Record<string, unknown>)[k], (after as Record<string, unknown>)[k], path ? `${path}.${k}` : k, out)
    }
  }
  return out
}

async function main() {
  const from = arg('from')
  const to = arg('to') ?? ''
  const apply = process.argv.includes('--apply')

  if (!from) {
    console.error('Missing required --from=<prefix> (e.g. --from=http://localhost:4000)')
    process.exit(1)
  }
  if (from === to) {
    console.error('--from and --to are identical; nothing to do.')
    process.exit(1)
  }

  const uri = process.env.MONGO_URI
  if (!uri) {
    console.error('MONGO_URI is required (load via dotenv-cli).')
    process.exit(1)
  }
  const dbName = process.env.MONGO_DB_NAME || 'main_db'

  console.log(`→ ${apply ? 'APPLYING' : 'Dry-run'} rewrite on "${dbName}"`)
  console.log(`  from: ${JSON.stringify(from)}`)
  console.log(`  to:   ${JSON.stringify(to)}`)

  await mongoose.connect(uri, { dbName })
  const db = mongoose.connection.db
  if (!db) throw new Error('No database connection')

  const collections = await db.listCollections().toArray()
  let totalInspected = 0
  let totalChanged = 0
  let totalFieldChanges = 0
  const sampleChanges: { collection: string; _id: unknown; path: string; from: string; to: string }[] = []

  for (const { name } of collections) {
    if (name.startsWith('system.')) continue
    const coll = db.collection(name)
    const cursor = coll.find({})
    let collInspected = 0
    let collChanged = 0
    for await (const doc of cursor) {
      collInspected++
      totalInspected++
      const stats = { scanned: 0, changed: 0 }
      const rewritten = rewriteStrings(doc, from, to, stats) as Record<string, unknown>
      if (stats.changed === 0) continue
      collChanged++
      totalChanged++
      totalFieldChanges += stats.changed
      const diff = diffChangedFields(doc, rewritten)
      for (const d of diff.slice(0, 3)) {
        sampleChanges.push({
          collection: name,
          _id: doc._id,
          path: d.path,
          from: d.from.slice(0, 80),
          to: d.to.slice(0, 80)
        })
      }
      if (apply) {
        const { _id, ...rest } = rewritten as { _id: unknown }
        await coll.replaceOne({ _id: doc._id }, rest)
      }
    }
    console.log(`  ${name}: ${collInspected} docs inspected, ${collChanged} with changes`)
  }

  console.log('')
  console.log(`Total: ${totalInspected} docs inspected, ${totalChanged} mutated, ${totalFieldChanges} string fields rewritten`)
  if (sampleChanges.length) {
    console.log('Sample changes (first 20):')
    for (const c of sampleChanges.slice(0, 20)) {
      console.log(`  [${c.collection} ${c._id}] ${c.path}`)
      console.log(`    − ${c.from}`)
      console.log(`    + ${c.to}`)
    }
  }
  if (!apply) console.log('\nDry run — no changes written. Re-run with --apply to commit.')

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
