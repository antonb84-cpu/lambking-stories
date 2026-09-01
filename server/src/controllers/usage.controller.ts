import type { Request, Response } from 'express'
import { UsageService, type UsageRange } from '../services/UsageService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const getDailyUsage = asyncHandler(async (req: Request, res: Response) => {
  const range = (req.query.range as UsageRange | undefined) ?? '30'
  res.json(await UsageService.report(range))
})
