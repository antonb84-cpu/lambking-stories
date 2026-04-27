import { z } from 'zod'

export const audioUploadQuery = z.object({
  query: z.object({
    bookId: z.string().regex(/^[a-z]{2}-\d+-[a-z0-9-]+$/, 'bookId query param required'),
    lang: z.enum(['de', 'en'])
  })
})

export const imageUploadQuery = z.object({
  query: z.object({
    kind: z.enum(['cover', 'preview', 'content', 'achievement']),
    bookId: z.string().optional()
  })
})
