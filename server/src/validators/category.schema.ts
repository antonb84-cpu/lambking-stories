import { z } from 'zod'

export const createCategorySchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1, 'name must not be empty').max(120)
    })
    .strict()
})

export const categoryParamsSchema = z.object({
  params: z.object({ name: z.string().min(1) })
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body']
