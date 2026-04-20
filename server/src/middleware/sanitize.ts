import type { RequestHandler } from 'express'

function sanitizeObject(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(sanitizeObject)
  const out: Record<string, unknown> = {}
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (key.startsWith('$')) continue
    out[key] = sanitizeObject(v)
  }
  return out
}

/**
 * Strip MongoDB operator keys ($gt, $where, etc.) from request bodies and params
 * to prevent NoSQL injection. Dotted keys are kept — Zod schemas shape every
 * payload before any DB call, so they can't be misinterpreted as nested paths.
 */
export const mongoSanitize: RequestHandler = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body)
  }
  if (req.params && typeof req.params === 'object') {
    for (const k of Object.keys(req.params)) {
      const v = req.params[k]
      if (typeof v === 'string' && (v.startsWith('$') || v.includes('..'))) {
        req.params[k] = ''
      }
    }
  }
  next()
}
