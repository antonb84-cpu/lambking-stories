import type { RequestHandler } from 'express'
import { env } from '../config/env.js'
import { UsageService } from '../services/UsageService.js'

/**
 * `X-User-Uuid` must look like a UUID. The header is attacker-controlled, so
 * without a shape check anyone could write arbitrary strings into the
 * activity collection and inflate the dashboard (or blow up its cardinality).
 * A wrong-shaped header is ignored, never rejected — tracking is a
 * side-effect of the request, not a gate on it.
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Anonymous daily-active-user tracking.
 *
 * The Tauri app (Android / iOS) sends the UUID it keeps in localStorage on
 * every API call; this middleware turns that into at most one row per user per
 * day (see `UsageService.recordActivity`). The web and Electron builds send no
 * id, so the dashboard counts mobile installs only. That gate lives
 * client-side: it is a runtime check inside the app, which the server cannot
 * reproduce from a request alone.
 *
 * Deliberately fire-and-forget: `next()` runs immediately and the Mongo write
 * is never awaited, so a slow or broken tracking write can't add latency to —
 * or fail — a book fetch.
 */
export const usageTracking: RequestHandler = (req, _res, next) => {
  if (!env.USAGE_TRACKING_ENABLED) return next()

  const raw = req.header('x-user-uuid')
  if (raw) {
    const userUuid = raw.trim().toLowerCase()
    if (UUID_PATTERN.test(userUuid)) {
      // Resolve the client name from the key map here rather than reading
      // `req.client`: `requireClientKey` runs on the route, which is further
      // down the stack than this middleware.
      const client = env.CLIENT_KEYS.get(req.header('x-client-key')?.trim() ?? '') ?? ''
      void UsageService.recordActivity(userUuid, client)
    }
  }
  next()
}
