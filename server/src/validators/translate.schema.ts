import { z } from 'zod'

export const translateSchema = z.object({
  body: z
    .object({
      from: z.enum(['de', 'en']),
      to: z.enum(['de', 'en']),
      strings: z.record(z.string(), z.string())
    })
    .strict()
    .refine((v) => v.from !== v.to, { message: 'from and to must differ', path: ['to'] })
})

export type TranslateInput = z.infer<typeof translateSchema>['body']
