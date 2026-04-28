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

export interface BookLocalizedString {
  de?: string
  en?: string
}

export interface BookDTO {
  bookId: string
  author: string
  category: string
  bookSeriesId: string
  releaseDate: string
  badges?: string[]
  websiteTags?: string[]
  websitePrice?: string
  coverImage: string
  previewImage: string
  contentCoverImage?: BookLocalizedString
  achievementBadge?: BookLocalizedString
  etsyLink?: BookLocalizedString
  audio?: BookLocalizedString
  localizations: Partial<Record<Locale, BookLocalization>>
  isPublished: boolean
}
