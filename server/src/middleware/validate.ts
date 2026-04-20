import type { RequestHandler } from 'express'
import type { ZodTypeAny, z } from 'zod'
import { HttpError, type ErrorDetail } from '../utils/httpError.js'

export function validate(schema: ZodTypeAny): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params
    })
    if (!result.success) {
      const details: ErrorDetail[] = (result.error as z.ZodError).issues.map((i) => ({
        field: i.path.slice(1).join('.') || i.path.join('.') || '(root)',
        message: i.message
      }))
      return next(HttpError.validation('Request validation failed', details))
    }
    const parsed = result.data as { body?: unknown; query?: unknown; params?: unknown }
    if (parsed.body !== undefined) req.body = parsed.body
    if (parsed.query !== undefined) {
      Object.assign(req.query as Record<string, unknown>, parsed.query as Record<string, unknown>)
    }
    if (parsed.params !== undefined) {
      Object.assign(req.params as Record<string, unknown>, parsed.params as Record<string, unknown>)
    }
    next()
  }
}
