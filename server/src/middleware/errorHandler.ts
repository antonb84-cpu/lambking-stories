import type { ErrorRequestHandler, RequestHandler } from 'express'
import { HttpError } from '../utils/httpError.js'
import { logger } from '../config/logger.js'

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(HttpError.notFound('Route not found'))
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof HttpError) {
    if (err.status >= 500) logger.error('server error', { err: err.message, path: req.path })
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {})
      }
    })
    return
  }

  if (err?.name === 'ValidationError') {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: err.message }
    })
    return
  }

  if (err?.code === 11000) {
    res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'Duplicate key',
        details: [{ field: Object.keys(err.keyPattern ?? {})[0] ?? '', message: 'already exists' }]
      }
    })
    return
  }

  logger.error('unhandled error', { err: (err as Error)?.stack ?? err, path: req.path })
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
  })
}
