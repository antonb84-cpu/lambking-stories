import { Category } from '../models/Category.js'
import { logger } from './logger.js'

// Books in this category are filtered out of the public books listing so the
// Book app never shows them. Used to "park" a book without deleting it.
export const HIDDEN_CATEGORY = 'NO SHOW'

// Reserved names cannot be deleted from the AdminUI / category endpoint.
export const RESERVED_CATEGORIES: readonly string[] = [HIDDEN_CATEGORY]

export function isReservedCategory(name: string): boolean {
  return RESERVED_CATEGORIES.includes(name)
}

export async function ensureReservedCategories(): Promise<void> {
  for (const name of RESERVED_CATEGORIES) {
    const existing = await Category.findOne({ name }).lean().exec()
    if (!existing) {
      await Category.create({ name })
      logger.info('seeded reserved category', { name })
    }
  }
}
