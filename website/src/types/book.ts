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

// Image asset that may be a plain URL string (legacy) or a localized
// `{ de, en }` map. Use `pickLocalizedImage` to resolve to a concrete URL.
export type LocalizedImage = string | BookLocalizedString

export function pickLocalizedImage(
  value: LocalizedImage | undefined,
  locale: Locale = 'de'
): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value[locale] || value.de || value.en || ''
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
  // coverImage is optional now — admin UI hides its upload slot and the
  // server schema no longer requires it. Older books still in the DB may
  // have a value; we leave the field declared so consumers can read it,
  // but every "cover" surface in the website has switched to previewImage.
  coverImage?: LocalizedImage
  previewImage: LocalizedImage
  contentCoverImage?: BookLocalizedString
  achievementBadge?: BookLocalizedString
  etsyLink?: BookLocalizedString
  audio?: BookLocalizedString
  localizations: Partial<Record<Locale, BookLocalization>>
  isPublished: boolean
  // Mongoose `timestamps: true` writes these on the server. ISO string
  // after JSON-encoding. Optional because legacy rows imported before
  // the timestamps option was enabled may not have one.
  createdAt?: string
  updatedAt?: string
}
