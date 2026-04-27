import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { BookDTO, BookLocalization, Locale } from '@/types'

function emptyLocalization(): BookLocalization {
  return { title: '', shortDescription: '', description: '', content: [] }
}

function emptyBook(): BookDTO {
  return {
    bookId: '',
    author: 'Anton Bernt',
    category: '',
    bookSeriesId: '',
    releaseDate: new Date().toISOString().slice(0, 10),
    badges: [],
    cover: '',
    coverImage: '',
    previewImage: '',
    contentCoverImage: { de: '', en: '' },
    achievementBadge: { de: '', en: '' },
    etsyLink: { de: '', en: '' },
    audio: { de: '', en: '' },
    attachments: [],
    localizations: { de: emptyLocalization() },
    isPublished: true
  }
}

export const useBookDraftStore = defineStore('bookDraft', () => {
  const book = ref<BookDTO>(emptyBook())
  const activeLocale = ref<Locale>('de')
  const isEditingExisting = ref(false)
  const uploadStatus = ref<Record<string, { ok: boolean; message?: string; filename?: string } | null>>({
    audio: null,
    cover: null,
    preview: null,
    contentCover: null,
    achievementBadgeDe: null,
    achievementBadgeEn: null
  })

  const setLocale = (l: Locale) => {
    if (!book.value.localizations[l]) book.value.localizations[l] = emptyLocalization()
    activeLocale.value = l
  }

  const activeLocalization = computed<BookLocalization>({
    get() {
      const l = book.value.localizations[activeLocale.value]
      if (!l) {
        const empty = emptyLocalization()
        book.value.localizations[activeLocale.value] = empty
        return empty
      }
      return l
    },
    set(v: BookLocalization) {
      book.value.localizations[activeLocale.value] = v
    }
  })

  const reset = () => {
    book.value = emptyBook()
    activeLocale.value = 'de'
    isEditingExisting.value = false
    uploadStatus.value = {
      audio: null,
      cover: null,
      preview: null,
      contentCoverDe: null,
      contentCoverEn: null,
      achievementBadgeDe: null,
      achievementBadgeEn: null
    }
  }

  const load = (b: BookDTO) => {
    book.value = JSON.parse(JSON.stringify(b)) as BookDTO
    if (!book.value.localizations.de) book.value.localizations.de = emptyLocalization()
    activeLocale.value = 'de'
    isEditingExisting.value = true
  }

  const missingFields = computed<{ label: string; anchor: string }[]>(() => {
    const b = book.value
    const de = b.localizations.de
    const m: { label: string; anchor: string }[] = []
    if (!b.bookId) m.push({ label: 'Book-ID', anchor: 'field-bookId' })
    if (!b.author) m.push({ label: 'Autor', anchor: 'field-author' })
    if (!b.category) m.push({ label: 'Kategorie', anchor: 'field-category' })
    if (!b.bookSeriesId) m.push({ label: 'Buchreihe', anchor: 'field-bookSeries' })
    if (!b.releaseDate) m.push({ label: 'Erscheinungsdatum', anchor: 'field-releaseDate' })
    if (!b.coverImage) m.push({ label: 'Cover-Bild', anchor: 'field-cover' })
    if (!b.previewImage) m.push({ label: 'Preview-Bild', anchor: 'field-preview' })
    if (!b.audio?.de) m.push({ label: 'Audio (DE)', anchor: 'field-audio' })
    if (!de?.title) m.push({ label: 'Titel (DE)', anchor: 'field-title' })
    if (!de?.shortDescription) m.push({ label: 'Kurzbeschreibung (DE)', anchor: 'field-shortDescription' })
    if (!de?.description) m.push({ label: 'Beschreibung (DE)', anchor: 'field-description' })
    if (!de?.content?.length) m.push({ label: 'Seiten (DE)', anchor: 'field-content' })
    return m
  })

  const missingAnchors = computed(() => new Set(missingFields.value.map((m) => m.anchor)))

  const isGermanComplete = computed(() => missingFields.value.length === 0)

  return {
    book,
    activeLocale,
    activeLocalization,
    isEditingExisting,
    uploadStatus,
    isGermanComplete,
    missingFields,
    missingAnchors,
    setLocale,
    reset,
    load
  }
})
