// Shape returned by the Render API (see server/src/models/Book.ts). URLs are
// absolutized at the API boundary (see server/src/utils/bookUrls.ts) so every
// cover/audio/attachment is a plain https URL by the time it reaches the
// client.

export type Locale = 'de' | 'en'

export interface ApiLocalizedPage {
  page: number
  title: string
  text: string
}

export interface ApiLocalization {
  title: string
  shortDescription: string
  description: string
  content: ApiLocalizedPage[]
}

export interface ApiLocalizedAsset {
  de?: string
  en?: string
}

export interface ApiBook {
  bookId: string
  author: string
  category: string
  bookSeriesId: string
  releaseDate: string
  updatedDate: string
  badges: string[]
  cover?: string
  coverImage: string
  previewImage: string
  contentCoverImage?: ApiLocalizedAsset
  achievementBadge?: ApiLocalizedAsset
  audio?: ApiLocalizedAsset
  attachments?: string[]
  localizations: {
    de: ApiLocalization
    en?: ApiLocalization | null
  }
  isPublished: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ApiBookListResponse {
  books: ApiBook[]
  cacheHit?: boolean
}

export interface ApiBookResponse {
  book: ApiBook
  cacheHit?: boolean
}
