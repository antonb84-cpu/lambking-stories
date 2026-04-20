import { slugify } from './slug.js'

export const BOOK_ID_PATTERN = /^[a-z]{2}-\d+-[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isValidBookId(id: string): boolean {
  return BOOK_ID_PATTERN.test(id)
}

export function buildBookId(prefix: string, volume: number, shortName: string): string {
  const p = prefix.toLowerCase().trim()
  const n = slugify(shortName).replace(/-/g, '')
  if (!/^[a-z]{2}$/.test(p)) throw new Error('prefix must be exactly 2 lowercase letters')
  if (!Number.isInteger(volume) || volume < 1) throw new Error('volume must be a positive integer')
  if (!n) throw new Error('shortName must contain at least one alphanumeric character')
  return `${p}-${volume}-${n}`
}

export function parseBookId(id: string):
  | { prefix: string; volume: number; shortName: string }
  | null {
  const match = /^([a-z]{2})-(\d+)-([a-z0-9-]+)$/.exec(id)
  if (!match) return null
  return { prefix: match[1]!, volume: Number(match[2]), shortName: match[3]! }
}
