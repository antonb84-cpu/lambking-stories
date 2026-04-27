import { z } from 'zod'
import { BOOK_ID_PATTERN } from '../utils/bookId.js'

const pageSchema = z.object({
  page: z.number().int().min(1, 'page must be a positive integer'),
  title: z.string().max(300).default(''),
  text: z.string().min(1, 'text must not be empty')
})

const localizationSchema = z.object({
  title: z.string().trim().min(1, 'title must not be empty').max(300),
  shortDescription: z
    .string()
    .trim()
    .min(1, 'shortDescription must not be empty')
    .max(1000, 'shortDescription must be at most 1000 characters'),
  description: z
    .string()
    .trim()
    .min(1, 'description must not be empty')
    .max(8000, 'description must be at most 8000 characters'),
  content: z.array(pageSchema).min(1, 'content must contain at least one page')
})

const audioSchema = z.object({
  de: z.string().optional().default(''),
  en: z.string().optional().default('')
})

export const createBookSchema = z.object({
  body: z
    .object({
      bookId: z
        .string()
        .regex(BOOK_ID_PATTERN, 'bookId must match pattern <2-letter-prefix>-<volume>-<shortname>'),
      author: z.string().trim().min(1, 'author must not be empty').max(200),
      category: z.string().trim().min(1, 'category must not be empty').max(120),
      bookSeriesId: z.string().trim().min(1, 'bookSeriesId must not be empty'),
      releaseDate: z
        .string()
        .datetime({ message: 'releaseDate must be an ISO 8601 datetime string' })
        .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'releaseDate must be YYYY-MM-DD or ISO datetime')),
      badges: z.array(z.string()).default([]),
      cover: z.string().optional(),
      coverImage: z.string().min(1, 'coverImage is required'),
      previewImage: z.string().min(1, 'previewImage is required'),
      contentCoverImage: audioSchema.default({ de: '', en: '' }),
      achievementBadge: audioSchema.default({ de: '', en: '' }),
      audio: audioSchema.default({ de: '', en: '' }),
      attachments: z.array(z.string()).default([]),
      localizations: z.object({
        de: localizationSchema,
        en: localizationSchema.optional()
      }),
      isPublished: z.boolean().default(true)
    })
    .strict()
})

export const updateBookSchema = z.object({
  body: createBookSchema.shape.body.partial().extend({
    localizations: z
      .object({
        de: localizationSchema.optional(),
        en: localizationSchema.optional()
      })
      .optional()
  }),
  params: z.object({ id: z.string().min(1) })
})

export const bookParamsSchema = z.object({
  params: z.object({ id: z.string().min(1) })
})

export type CreateBookInput = z.infer<typeof createBookSchema>['body']
export type UpdateBookInput = z.infer<typeof updateBookSchema>['body']
