/**
 * One-shot migration: copy documents from the legacy `test` database (the
 * Mongoose default before MONGO_DB_NAME was introduced) into the configured
 * target database (defaults to `main_db`).
 *
 * Run with:
 *   pnpm migrate:test-to-main             # dry run — prints counts, writes nothing
 *   pnpm migrate:test-to-main -- --apply  # performs the upserts
 *   pnpm migrate:test-to-main -- --apply --drop-source  # also drops `test` collections after
 *
 * Idempotent: uses replaceOne({ _id }, doc, { upsert: true }) so re-running the
 * migration with the same data is a no-op.
 */
import 'dotenv/config'
import mongoose from 'mongoose'

const COLLECTIONS = ['books', 'bookseries', 'categories'] as const

async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const dropSource = args.includes('--drop-source')

  const uri = process.env.MONGO_URI
  if (!uri) {
    console.error('MONGO_URI is required (load via dotenv-cli, e.g. `dotenv -e .env.local -- tsx scripts/...`).')
    process.exit(1)
  }
  const target = process.env.MONGO_DB_NAME || 'main_db'
  const source = 'test'

  if (source === target) {
    console.error(`Source and target databases are both "${source}" — nothing to do.`)
    process.exit(1)
  }

  console.log(`→ ${apply ? 'Applying' : 'Dry-run'} migration: ${source}  →  ${target}`)
  if (dropSource && apply) console.log('→ Will drop source collections after copy.')

  await mongoose.connect(uri, { dbName: target })
  const client = mongoose.connection.getClient()
  try {
    const src = client.db(source)
    const dst = client.db(target)

    for (const name of COLLECTIONS) {
      const srcColl = src.collection(name)
      const count = await srcColl.countDocuments()
      if (count === 0) {
        console.log(`  [${name}] source empty — skip`)
        continue
      }

      const docs = await srcColl.find().toArray()
      console.log(`  [${name}] ${docs.length} docs in source`)
      if (!apply) continue

      const dstColl = dst.collection(name)
      let upserts = 0
      for (const doc of docs) {
        const res = await dstColl.replaceOne({ _id: doc._id }, doc, { upsert: true })
        if (res.upsertedCount || res.modifiedCount) upserts += 1
      }
      console.log(`  [${name}] copied → ${upserts} upserted/modified`)

      if (dropSource) {
        await srcColl.drop()
        console.log(`  [${name}] source dropped`)
      }
    }
  } finally {
    await mongoose.disconnect()
  }

  console.log(apply ? '✔ Migration complete.' : '✔ Dry-run complete. Re-run with --apply to write.')
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
