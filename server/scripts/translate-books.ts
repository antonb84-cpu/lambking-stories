/**
 * Batch-translate all books that have a German localization but no English one
 * (or an empty / partially-filled English one). Runs locally against your
 * MongoDB using the Opus-MT Transformers.js pipeline — same model the live
 * `/api/translate` endpoint uses in dev.
 *
 * Why a script: the transformer models are too RAM-heavy to keep resident on
 * the production server. Run this locally on demand after adding new German
 * books; the translated EN localizations persist in the DB, so the remote
 * server never needs the translator installed.
 *
 * Usage:
 *   pnpm translate:books                     # dry run — lists what would change
 *   pnpm translate:books -- --apply          # writes translations to Mongo
 *   pnpm translate:books -- --apply --book-id=fa-1-apple   # one specific book
 *   pnpm translate:books -- --apply --force  # re-translate even if EN already exists
 *
 * Requires @huggingface/transformers (optionalDependency). Install with:
 *   pnpm install --include=optional
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { Book } from '../src/models/Book.js'
import { TranslationService } from '../src/services/TranslationService.js'

interface Page {
  page: number
  title?: string
  text: string
}

interface Localization {
  title: string
  shortDescription: string
  description: string
  content: Page[]
}

function isEnComplete(en: Partial<Localization> | null | undefined): boolean {
  if (!en) return false
  if (!en.title || !en.shortDescription || !en.description) return false
  if (!en.content || en.content.length === 0) return false
  return en.content.every((p) => typeof p.text === 'string' && p.text.trim().length > 0)
}

async function translateLocalization(de: Localization): Promise<Localization> {
  const [title, shortDescription, description] = await Promise.all([
    TranslationService.translateText('de', 'en', de.title),
    TranslationService.translateText('de', 'en', de.shortDescription),
    TranslationService.translateText('de', 'en', de.description)
  ])
  const content: Page[] = []
  for (const p of de.content) {
    const [t, text] = await Promise.all([
      p.title ? TranslationService.translateText('de', 'en', p.title) : Promise.resolve(''),
      TranslationService.translateText('de', 'en', p.text)
    ])
    content.push({ page: p.page, title: t, text })
  }
  return { title, shortDescription, description, content }
}

async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const force = args.includes('--force')
  const bookIdArg = args.find((a) => a.startsWith('--book-id='))?.split('=')[1]

  const uri = process.env.MONGO_URI
  if (!uri) {
    console.error('MONGO_URI is required (load via `dotenv -e .env.local`).')
    process.exit(1)
  }
  const dbName = process.env.MONGO_DB_NAME || 'main_db'

  if (!process.env.TRANSLATION_ENABLED) process.env.TRANSLATION_ENABLED = 'true'
  if (!TranslationService.isEnabled()) {
    console.error('TRANSLATION_ENABLED must be true for this script. Set it in .env.local.')
    process.exit(1)
  }

  console.log(`→ ${apply ? 'Applying' : 'Dry-run'} batch translation on "${dbName}"`)
  if (bookIdArg) console.log(`→ Filter: bookId=${bookIdArg}`)
  if (force) console.log('→ Force: re-translating even books with existing EN content')

  await mongoose.connect(uri, { dbName })

  const filter: Record<string, unknown> = {}
  if (bookIdArg) filter.bookId = bookIdArg
  const books = await Book.find(filter).lean()
  console.log(`Inspected: ${books.length} book(s)`)

  const todo = books.filter((b) => {
    const de = (b as { localizations: { de?: Localization; en?: Localization } }).localizations.de
    const en = (b as { localizations: { de?: Localization; en?: Localization } }).localizations.en
    if (!de || !de.title) return false
    return force || !isEnComplete(en)
  })
  console.log(`To translate: ${todo.length} book(s)`)
  for (const b of todo) {
    console.log(`  - ${b.bookId}  (DE: "${b.localizations.de?.title}")`)
  }

  if (!apply) {
    console.log('Dry run — no writes. Re-run with --apply to commit.')
    await mongoose.disconnect()
    return
  }

  let written = 0
  for (const b of todo) {
    const de = b.localizations.de as unknown as Localization
    console.log(`\n→ ${b.bookId}: translating…`)
    const started = Date.now()
    try {
      const en = await translateLocalization(de)
      await Book.updateOne(
        { bookId: b.bookId },
        { $set: { 'localizations.en': en, updatedDate: new Date() } }
      )
      written++
      console.log(`  ✓ "${en.title}" (${Math.round((Date.now() - started) / 1000)}s)`)
    } catch (err) {
      console.error(`  ✗ failed: ${(err as Error).message}`)
    }
  }

  console.log(`\nTranslated ${written}/${todo.length} book(s).`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
