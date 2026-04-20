import { describe, it, expect } from 'vitest'
import { createBookSchema } from '../src/validators/book.schema.js'
import { buildBookId, isValidBookId, parseBookId } from '../src/utils/bookId.js'
import { derivePrefix, suggestAlternatives } from '../src/utils/seriesPrefix.js'

describe('book validation', () => {
  it('rejects a book missing German localization', () => {
    const result = createBookSchema.safeParse({
      body: {
        bookId: 'fa-1-apple',
        author: 'A',
        category: 'C',
        bookSeriesId: 'fruit-agents',
        releaseDate: '2026-01-15',
        badges: [],
        coverImage: 'x',
        previewImage: 'y',
        audio: {},
        attachments: [],
        localizations: {},
        isPublished: true
      }
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths.some((p) => p.startsWith('body.localizations.de'))).toBe(true)
    }
  })
})

describe('bookId utilities', () => {
  it('validates pattern', () => {
    expect(isValidBookId('fa-1-apple')).toBe(true)
    expect(isValidBookId('fa-4-lemonadestand')).toBe(true)
    expect(isValidBookId('F-1-apple')).toBe(false)
    expect(isValidBookId('fa--apple')).toBe(false)
  })
  it('builds and parses book ids', () => {
    expect(buildBookId('fa', 1, 'Apple')).toBe('fa-1-apple')
    expect(parseBookId('fa-1-apple')).toEqual({ prefix: 'fa', volume: 1, shortName: 'apple' })
  })
})

describe('series prefix derivation', () => {
  it('derives prefix from multi-word name', () => {
    expect(derivePrefix('Fruit Agents')).toBe('fa')
    expect(derivePrefix('Bibel Geschichten')).toBe('bg')
  })
  it('derives prefix from single word', () => {
    expect(derivePrefix('Apostel')).toBe('ap')
  })
  it('suggests alternatives that are not taken', () => {
    const suggestions = suggestAlternatives('fa', new Set(['fa', 'fb']))
    expect(suggestions).not.toContain('fa')
    expect(suggestions).not.toContain('fb')
    expect(suggestions.length).toBeGreaterThan(0)
  })
})
