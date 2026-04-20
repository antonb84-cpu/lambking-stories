/**
 * One-shot migration: convert Book.contentCoverImage from a plain string into
 * { de: string, en: string } (so EN can have its own title-bearing cover image).
 *
 * Run with:
 *   pnpm migrate:content-cover-image             # dry run — prints plan, writes nothing
 *   pnpm migrate:content-cover-image -- --apply  # performs the updates
 *
 * Idempotent: already-object values are skipped.
 */
import 'dotenv/config'
import mongoose from 'mongoose'

async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')

  const uri = process.env.MONGO_URI
  if (!uri) {
    console.error('MONGO_URI is required (load via dotenv-cli, e.g. `dotenv -e .env.local -- tsx scripts/...`).')
    process.exit(1)
  }
  const dbName = process.env.MONGO_DB_NAME || 'main_db'

  console.log(`→ ${apply ? 'Applying' : 'Dry-run'} contentCoverImage migration on "${dbName}"`)

  await mongoose.connect(uri, { dbName })
  const db = mongoose.connection.db
  if (!db) throw new Error('No database connection')
  const books = db.collection('books')

  const cursor = books.find({})
  let inspected = 0
  let toMigrate = 0
  let alreadyObject = 0
  let missing = 0
  const ops: { bookId: string; from: unknown; to: { de: string; en: string } }[] = []

  for await (const doc of cursor) {
    inspected++
    const v = (doc as Record<string, unknown>).contentCoverImage
    if (v == null) {
      missing++
      continue
    }
    if (typeof v === 'string') {
      toMigrate++
      ops.push({
        bookId: String((doc as Record<string, unknown>).bookId ?? doc._id),
        from: v,
        to: { de: v, en: '' }
      })
      continue
    }
    if (typeof v === 'object') {
      alreadyObject++
      continue
    }
  }

  console.log(`Inspected: ${inspected}`)
  console.log(`  already object: ${alreadyObject}`)
  console.log(`  null/missing:   ${missing}`)
  console.log(`  need migrate:   ${toMigrate}`)
  for (const op of ops.slice(0, 10)) {
    console.log(`    ${op.bookId}: "${op.from}" → { de: "${op.to.de}", en: "" }`)
  }
  if (ops.length > 10) console.log(`    …and ${ops.length - 10} more`)

  if (!apply) {
    console.log('Dry run — no changes written. Re-run with --apply to commit.')
    await mongoose.disconnect()
    return
  }

  let written = 0
  for (const op of ops) {
    await books.updateOne(
      { bookId: op.bookId },
      { $set: { contentCoverImage: op.to } }
    )
    written++
  }
  console.log(`Migrated ${written} document(s).`)

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
