import { BookSeries } from '../models/BookSeries.js'
import { Book } from '../models/Book.js'
import { HttpError } from '../utils/httpError.js'
import { derivePrefix, suggestAlternatives } from '../utils/seriesPrefix.js'
import { slugify } from '../utils/slug.js'
import type { CreateSeriesInput } from '../validators/series.schema.js'

// Next free display position — one past the highest in use, so a series
// created without an explicit order lands at the end of the list.
async function nextSortOrder(): Promise<number> {
  const top = await BookSeries.findOne({}, { sortOrder: 1 })
    .sort({ sortOrder: -1 })
    .lean()
    .exec()
  const max = typeof top?.sortOrder === 'number' ? top.sortOrder : 0
  return max + 1
}

// Name is the tie-breaker everywhere so the order stays stable while some
// documents still sit at 0 (pre-backfill, or a legacy insert).
const DISPLAY_SORT = { sortOrder: 1, name: 1 } as const

export const SeriesService = {
  async list() {
    return BookSeries.find({}).sort(DISPLAY_SORT).lean().exec()
  },

  async create(input: CreateSeriesInput) {
    const seriesId = slugify(input.name)
    if (!seriesId) {
      throw HttpError.validation('name could not be converted to a valid series id', [
        { field: 'name', message: 'must contain at least one alphanumeric character' }
      ])
    }

    const seriesIdTaken = await BookSeries.exists({ seriesId })
    if (seriesIdTaken) {
      throw HttpError.conflict(`series "${seriesId}" already exists`, [
        { field: 'name', message: 'already exists' }
      ])
    }

    let prefix = input.prefix ?? derivePrefix(input.name)
    const prefixTaken = await BookSeries.exists({ prefix })
    if (prefixTaken) {
      const all = await BookSeries.find({}, { prefix: 1 }).lean().exec()
      const taken = new Set(all.map((s) => s.prefix))
      const suggestions = suggestAlternatives(prefix, taken)
      throw HttpError.conflict(`prefix "${prefix}" is already taken`, [
        { field: 'prefix', message: `taken — try: ${suggestions.join(', ')}` }
      ])
    }

    const doc = await BookSeries.create({
      seriesId,
      name: input.name,
      prefix,
      description: input.description ?? '',
      // Optional on create — the editor picks the position afterwards via
      // the SeriesManager dropdown; until then the newest series sorts last.
      sortOrder: input.sortOrder ?? (await nextSortOrder())
    })
    return doc.toJSON()
  },

  /**
   * Move a series to 1-based display position `position` and renumber the
   * whole catalogue 1..n so the result has no gaps and no ties. Positions
   * outside the list clamp to its ends, which is what a stale dropdown
   * (rendered before another series was deleted) would send.
   *
   * Returns the full re-sorted list — the caller replaces its cache with
   * it rather than guessing how the other positions shifted.
   */
  async reorder(id: string, position: number) {
    const all = await BookSeries.find({}, { seriesId: 1, sortOrder: 1, name: 1 })
      .sort(DISPLAY_SORT)
      .lean()
      .exec()
    const from = all.findIndex((s) => s.seriesId === id)
    if (from < 0) throw HttpError.notFound(`Series "${id}" not found`)

    const to = Math.min(Math.max(Math.round(position), 1), all.length) - 1
    const [moved] = all.splice(from, 1)
    if (moved) all.splice(to, 0, moved)

    await BookSeries.bulkWrite(
      all.map((s, i) => ({
        updateOne: {
          filter: { seriesId: s.seriesId },
          update: { $set: { sortOrder: i + 1 } }
        }
      }))
    )
    return BookSeries.find({}).sort(DISPLAY_SORT).lean().exec()
  },

  async update(id: string, input: Partial<CreateSeriesInput> & { coverImage?: string }) {
    const doc = await BookSeries.findOneAndUpdate({ seriesId: id }, input, {
      new: true,
      runValidators: true
    }).exec()
    if (!doc) throw HttpError.notFound(`Series "${id}" not found`)
    return doc.toJSON()
  },

  async remove(id: string) {
    const inUse = await Book.exists({ bookSeriesId: id })
    if (inUse) {
      throw HttpError.conflict(`Series "${id}" is referenced by existing books`, [
        { field: 'seriesId', message: 'remove referencing books first' }
      ])
    }
    const res = await BookSeries.findOneAndDelete({ seriesId: id }).exec()
    if (!res) throw HttpError.notFound(`Series "${id}" not found`)
    return { deleted: true }
  }
}
