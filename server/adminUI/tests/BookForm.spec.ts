import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import BookForm from '@/components/organisms/BookForm.vue'
import { useBookDraftStore } from '@/stores/bookDraft'

// Mock the Tiptap-heavy editor — it needs contenteditable which jsdom supports but the
// model hook is not the focus of this spec.
vi.mock('@/components/organisms/RichTextEditor.vue', () => ({
  default: { template: '<div class="mock-editor" />' }
}))

describe('BookForm submit gating', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('disables the submit button when German side is incomplete', () => {
    const w = mount(BookForm)
    const buttons = w.findAll('button')
    const submit = buttons.find((b) => b.text().match(/Speichern|Aktualisieren/))!
    expect(submit.attributes('disabled')).toBeDefined()
  })

  it('enables the submit button once German side is complete', async () => {
    const draft = useBookDraftStore()
    draft.book.bookId = 'fa-1-apple'
    draft.book.author = 'A'
    draft.book.category = 'Früchte'
    draft.book.bookSeriesId = 'fruit-agents'
    draft.book.releaseDate = '2026-01-15'
    draft.book.coverImage = 'http://x/c.webp'
    draft.book.previewImage = 'http://x/p.webp'
    draft.book.audio.de = 'http://x/a.ogg'
    draft.activeLocalization.title = 'Der Apfel'
    draft.activeLocalization.shortDescription = 's'
    draft.activeLocalization.description = 'l'
    draft.activeLocalization.content = [{ page: 1, title: 'S1', text: 'text' }]

    const w = mount(BookForm)
    await w.vm.$nextTick()
    const submit = w.findAll('button').find((b) => b.text().match(/Speichern|Aktualisieren/))!
    expect(submit.attributes('disabled')).toBeUndefined()
  })
})
