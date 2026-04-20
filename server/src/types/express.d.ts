import 'express'

declare module 'express-serve-static-core' {
  interface Request {
    adminUser?: string
    requestId?: string
  }
}
