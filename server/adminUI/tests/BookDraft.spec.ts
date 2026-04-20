import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBookDraftStore } from '@/stores/bookDraft'

describe('useBookDraftStore', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('starts incomplete', () => {
    const s = useBookDraftStore()
    expect(s.isGermanComplete).toBe(false)
  })

  it('becomes complete when all required fields are filled', () => {
    const s = useBookDraftStore()
    s.book.bookId = 'fa-1-apple'
    s.book.author = 'Author'
    s.book.category = 'Früchte'
    s.book.bookSeriesId = 'fruit-agents'
    s.book.releaseDate = '2026-01-15'
    s.book.coverImage = 'http://x/cover.webp'
    s.book.previewImage = 'http://x/preview.webp'
    s.book.audio.de = 'http://x/a.ogg'
    s.activeLocalization.title = 'Der Apfel'
    s.activeLocalization.shortDescription = 'kurz'
    s.activeLocalization.description = 'lang'
    s.activeLocalization.content = [{ page: 1, title: 'S1', text: 'text' }]
    expect(s.isGermanComplete).toBe(true)
  })

  it('switches locale and creates an empty EN localization', () => {
    const s = useBookDraftStore()
    s.setLocale('en')
    expect(s.activeLocale).toBe('en')
    expect(s.book.localizations.en).toBeDefined()
    expect(s.activeLocalization.title).toBe('')
  })
})
