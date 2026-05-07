import type { RequestHandler } from 'express'
import { env } from '../config/env.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /**
       * Human-readable name of the client that authenticated with a valid
       * `X-Client-Key` header (e.g. `tauri`, `pages`, `adminui`). Set by
       * the `requireClientKey` middleware; absent on unkeyed routes.
       */
      client?: string
    }
  }
}

/**
 * Gate handler for the public read endpoints (`GET /api/books`,
 * `GET /api/book/:id`).
 *
 * Reads `X-Client-Key`, looks it up in the `CLIENT_KEYS` env map, and:
 *   - sets `req.client` to the matching client name on success
 *   - 401s with a `MISSING_CLIENT_KEY` / `INVALID_CLIENT_KEY` error code
 *     when the header is absent / unknown
 *
 * If the env map is empty (the default), the middleware is a no-op so local
 * dev and the existing test suite keep working without provisioning keys.
 * Once `CLIENT_KEYS` is populated in prod, every public read MUST carry a
 * valid key.
 *
 * NOTE: keys baked into public clients aren't secret (the APK / GitHub
 * Pages bundle expose them). This middleware exists for attribution + CORS
 * bypass, not as an auth boundary — pair it with the per-IP rate limiter
 * for any real abuse mitigation.
 */
export const requireClientKey: RequestHandler = (req, res, next) => {
  // Empty keymap → feature disabled (local dev / tests). Letting the route
  // through preserves the legacy behaviour without forcing every contributor
  // to plumb keys into their .env.local.
  if (env.CLIENT_KEYS.size === 0) return next()

  const raw = req.header('x-client-key')
  if (!raw) {
    res.status(401).json({
      error: { code: 'MISSING_CLIENT_KEY', message: 'X-Client-Key header is required.' }
    })
    return
  }
  const name = env.CLIENT_KEYS.get(raw.trim())
  if (!name) {
    res.status(401).json({
      error: { code: 'INVALID_CLIENT_KEY', message: 'Unknown client key.' }
    })
    return
  }
  req.client = name
  next()
}
