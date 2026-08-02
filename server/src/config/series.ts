import { BookSeries } from '../models/BookSeries.js'
import { logger } from './logger.js'

/**
 * Give every series a real `sortOrder`.
 *
 * The field was added after the catalogue already existed, so the documents
 * created before it carry no value at all (and a freshly seeded one carries
 * the schema default, 0). Both mean "never ordered". This walks the series
 * in their previous display order — alphabetical by name — and stamps them
 * 1..n, so the first AdminUI visit shows the list exactly as it looked
 * before, just with numbers on it.
 *
 * Idempotent: once every document holds a positive order it does nothing,
 * which is the steady state after the first boot.
 */
export async function ensureSeriesOrder(): Promise<void> {
  const unordered = await BookSeries.countDocuments({
    $or: [{ sortOrder: { $exists: false } }, { sortOrder: { $lte: 0 } }]
  })
  if (!unordered) return

  const all = await BookSeries.find({}, { seriesId: 1, sortOrder: 1, name: 1 })
    .sort({ sortOrder: 1, name: 1 })
    .lean()
    .exec()
  if (!all.length) return

  await BookSeries.bulkWrite(
    all.map((s, i) => ({
      updateOne: {
        filter: { seriesId: s.seriesId },
        update: { $set: { sortOrder: i + 1 } }
      }
    }))
  )
  logger.info('backfilled series sortOrder', { series: all.length, unordered })
}
