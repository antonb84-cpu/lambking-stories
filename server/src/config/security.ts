import helmet from 'helmet'
import type { RequestHandler } from 'express'
import { env } from './env.js'

export function helmetMiddleware(): RequestHandler {
  return helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ['\'self\''],
        baseUri: ['\'self\''],
        frameAncestors: ['\'none\''],
        objectSrc: ['\'none\''],
        imgSrc: ['\'self\'', 'data:', 'blob:'],
        mediaSrc: ['\'self\'', 'blob:'],
        scriptSrc: ['\'self\''],
        styleSrc: ['\'self\'', '\'unsafe-inline\''],
        connectSrc: ['\'self\'', ...env.CORS_ORIGIN],
        fontSrc: ['\'self\'', 'data:'],
        workerSrc: ['\'self\'', 'blob:'],
        formAction: ['\'self\'']
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false
  })
}
