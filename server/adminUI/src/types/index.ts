export type Locale = 'de' | 'en'

export interface BookPage {
  page: number
  title: string
  text: string
}

export interface BookLocalization {
  title: string
  shortDescription: string
  description: string
  contentNotes?: string
  content: BookPage[]
}

export interface BookAudio {
  de?: string
  en?: string
}

export type BookAttachmentType = 'coloring' | 'download'

export interface BookAttachment {
  previewImage?: string
  data?: string
  type: BookAttachmentType
}

export function normalizeAttachment(value: unknown): BookAttachment {
  if (typeof value === 'string') {
    return { previewImage: '', data: value, type: 'download' }
  }
  if (value && typeof value === 'object') {
    const v = value as { previewImage?: unknown; data?: unknown; type?: unknown }
    return {
      previewImage: typeof v.previewImage === 'string' ? v.previewImage : '',
      data: typeof v.data === 'string' ? v.data : '',
      type: v.type === 'coloring' ? 'coloring' : 'download'
    }
  }
  return { previewImage: '', data: '', type: 'download' }
}

export interface BookDTO {
  bookId: string
  author: string
  category: string
  bookSeriesId: string
  releaseDate: string
  updatedDate?: string
  badges: string[]
  websiteTags: string[]
  websitePrice: string
  cover?: string
  coverImage: string
  previewImage: string
  contentCoverImage?: BookAudio
  achievementBadge?: BookAudio
  etsyLink?: BookAudio
  audio: BookAudio
  attachments: BookAttachment[]
  localizations: Partial<Record<Locale, BookLocalization>>
  isPublished: boolean
}

export interface SeriesDTO {
  seriesId: string
  name: string
  prefix: string
  description?: string
}

export interface CategoryDTO {
  name: string
}

// Books in this category are filtered out of the public Book app listing.
// The category itself is seeded server-side and cannot be deleted.
export const HIDDEN_CATEGORY = 'NO SHOW'
export const RESERVED_CATEGORIES: readonly string[] = [HIDDEN_CATEGORY]

export function isReservedCategory(name: string): boolean {
  return RESERVED_CATEGORIES.includes(name)
}
