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
  content: BookPage[]
}

export interface BookAudio {
  de?: string
  en?: string
}

export interface BookDTO {
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
  contentCoverImage?: BookAudio
  achievementBadge?: BookAudio
  etsyLink?: BookAudio
  audio: BookAudio
  attachments: string[]
  localizations: Record<Locale, BookLocalization>
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
