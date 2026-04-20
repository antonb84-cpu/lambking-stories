import express, { type Express } from 'express'
import path from 'node:path'
import fs from 'node:fs'
import cors from 'cors'
import compression from 'compression'
import * as Sentry from '@sentry/node'

import { env } from './config/env.js'
import { mongoSanitize } from './middleware/sanitize.js'
import { helmetMiddleware } from './config/security.js'
import { requestLogger } from './middleware/requestLogger.js'
import { readLimiter } from './middleware/rateLimit.js'
import apiRouter from './routes/index.js'
import healthRouter from './routes/health.routes.js'
import { adminRouter } from './routes/admin.routes.js'
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js'

export function createApp(): Express {
  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  app.use(helmetMiddleware())
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true)
        if (env.CORS_ORIGIN.includes(origin)) return cb(null, true)
        return cb(new Error(`Origin ${origin} not allowed by CORS`))
      },
      credentials: true
    })
  )
  app.use(compression())
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true, limit: '1mb' }))
  app.use(mongoSanitize)
  app.use(requestLogger)

  // Static assets for streaming audio and serving uploads.
  const audiobooksDir = path.resolve(env.AUDIOBOOKS_DIR)
  const uploadsDir = path.resolve(env.UPLOADS_DIR)
  if (!fs.existsSync(audiobooksDir)) fs.mkdirSync(audiobooksDir, { recursive: true })
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
  app.use(
    '/audiobooks',
    express.static(audiobooksDir, {
      acceptRanges: true,
      maxAge: '1h',
      setHeaders: (res) => {
        res.setHeader('Accept-Ranges', 'bytes')
      }
    })
  )
  app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }))

  // Health
  app.use(healthRouter)

  // API with public-read rate limit as baseline; writes have their own strict limiter.
  app.use('/api', readLimiter, apiRouter)

  // Admin UI
  app.use(adminRouter())

  // 404 + error handler (must be last). Sentry's Express handler must run before
  // our error handler so exceptions are captured before being formatted away.
  app.use(notFoundHandler)
  if (env.SENTRY_DSN) Sentry.setupExpressErrorHandler(app)
  app.use(errorHandler)

  return app
}
