import { BookSeries } from '../models/BookSeries.js'
import { Book } from '../models/Book.js'
import { HttpError } from '../utils/httpError.js'
import { derivePrefix, suggestAlternatives } from '../utils/seriesPrefix.js'
import { slugify } from '../utils/slug.js'
import type { CreateSeriesInput } from '../validators/series.schema.js'

export const SeriesService = {
  async list() {
    return BookSeries.find({}).sort({ name: 1 }).lean().exec()
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
      description: input.description ?? ''
    })
    return doc.toJSON()
  },

  async update(id: string, input: Partial<CreateSeriesInput>) {
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
