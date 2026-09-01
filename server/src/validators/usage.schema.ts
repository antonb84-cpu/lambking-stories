import { z } from 'zod'

export const usageQuerySchema = z.object({
  query: z.object({
    // Presets only — the dashboard's filter row offers exactly these, and a
    // free-form day count would let a caller ask for an unbounded scan.
    range: z.enum(['7', '30', '90', '365', 'all']).default('30')
  })
})

export type UsageRangeQuery = z.infer<typeof usageQuerySchema>['query']
