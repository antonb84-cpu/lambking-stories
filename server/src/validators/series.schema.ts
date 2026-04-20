import { z } from 'zod'

export const createSeriesSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1, 'name must not be empty').max(200),
      description: z.string().optional(),
      prefix: z
        .string()
        .regex(/^[a-z]{2}$/, 'prefix must be exactly 2 lowercase letters')
        .optional()
    })
    .strict()
})

export const updateSeriesSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(200).optional(),
      description: z.string().optional(),
      prefix: z.string().regex(/^[a-z]{2}$/).optional()
    })
    .strict(),
  params: z.object({ id: z.string().min(1) })
})

export const seriesParamsSchema = z.object({
  params: z.object({ id: z.string().min(1) })
})

export type CreateSeriesInput = z.infer<typeof createSeriesSchema>['body']
