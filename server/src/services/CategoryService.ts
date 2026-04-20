import { Category } from '../models/Category.js'
import { HttpError } from '../utils/httpError.js'
import type { CreateCategoryInput } from '../validators/category.schema.js'

export const CategoryService = {
  async list() {
    return Category.find({}).sort({ name: 1 }).lean().exec()
  },

  async create(input: CreateCategoryInput) {
    const existing = await Category.findOne({ name: input.name }).lean().exec()
    if (existing) {
      throw HttpError.conflict(`Category "${input.name}" already exists`, [
        { field: 'name', message: 'already exists' }
      ])
    }
    const doc = await Category.create({ name: input.name })
    return doc.toJSON()
  },

  async remove(name: string) {
    const res = await Category.findOneAndDelete({ name }).exec()
    if (!res) throw HttpError.notFound(`Category "${name}" not found`)
    return { deleted: true }
  }
}
