import type { Request, Response } from 'express'
import { pingDatabase } from '../config/db.js'
import { pingRedis } from '../config/redis.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const health = asyncHandler(async (_req: Request, res: Response) => {
  const [mongo, redis] = await Promise.all([pingDatabase(), pingRedis()])
  res.json({ ok: mongo, mongo, redis, uptime: process.uptime() })
})
