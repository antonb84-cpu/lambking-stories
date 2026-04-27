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

  // Static assets for streaming audio and serving uploads.
  //
  // These routes are mounted BEFORE the API CORS gate on purpose. They
  // serve public, unauthenticated read-only assets that need permissive
  // CORS so:
  //   - the AdminUI iPhone preview & the in-app reader can use the badge
  //     image as a CSS `mask-image` (which the browser treats as a canvas
  //     pixel read and therefore requires CORS, unlike a plain `<img>`).
  //   - audio playback can range-request the OGG files from any origin
  //     hosting the player.
  // No cookies / auth flow uses these paths, so `*` is safe and works with
  // the `<audio>` / `<img>` / `<canvas>` "anonymous" credentials mode.
  // Mounting after the strict API cors() would 500 the request for any
  // origin not in CORS_ORIGIN before the static handler runs.
  const audiobooksDir = path.resolve(env.AUDIOBOOKS_DIR)
  const uploadsDir = path.resolve(env.UPLOADS_DIR)
  if (!fs.existsSync(audiobooksDir)) fs.mkdirSync(audiobooksDir, { recursive: true })
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
  const staticCors = (res: import('express').Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  }
  app.use(
    '/audiobooks',
    express.static(audiobooksDir, {
      acceptRanges: true,
      maxAge: '1h',
      setHeaders: (res) => {
        staticCors(res)
        res.setHeader('Accept-Ranges', 'bytes')
      }
    })
  )
  app.use(
    '/uploads',
    express.static(uploadsDir, {
      maxAge: '7d',
      setHeaders: (res) => {
        staticCors(res)
      }
    })
  )

  // Strict CORS for the JSON API only — credentialed requests must come
  // from an allow-listed origin.
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
