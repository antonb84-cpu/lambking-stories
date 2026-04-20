import basicAuth from 'express-basic-auth'
import type { RequestHandler } from 'express'
import { env } from '../config/env.js'

export const basicAuthGuard: RequestHandler = basicAuth({
  users: { [env.ADMIN_USER]: env.ADMIN_PASSWORD },
  challenge: true,
  realm: 'Little Bible Stories Admin',
  unauthorizedResponse: () => ({
    error: {
      code: 'UNAUTHORIZED',
      message: 'Valid admin credentials required'
    }
  })
})
