import { Router, type RequestHandler } from 'express'
import path from 'node:path'
import fs from 'node:fs'
import express from 'express'
import { basicAuthGuard } from '../middleware/auth.js'

/**
 * Admin UI static hosting. In production, the adminUI build output is copied to
 * /server/public/admin; in dev, the admin UI is served from Vite at :5173 and
 * hitting /admin here falls through to a 404 with a helpful message.
 */
export function adminRouter(): Router {
  const router = Router()
  const adminDist = path.resolve(process.cwd(), 'public/admin')
  const hasBuild = fs.existsSync(path.join(adminDist, 'index.html'))

  router.use('/admin', basicAuthGuard)

  if (hasBuild) {
    router.use('/admin', express.static(adminDist, { fallthrough: true, redirect: false }))
    const spaFallback: RequestHandler = (_req, res) => {
      res.sendFile(path.join(adminDist, 'index.html'))
    }
    router.get('/admin', spaFallback)
    router.get('/admin/{*splat}', spaFallback)
  } else {
    const devMessage: RequestHandler = (_req, res) => {
      res.type('html').send(
        `<!doctype html><meta charset="utf-8"><title>Admin UI not built</title>
         <div style="font-family:system-ui;padding:32px;max-width:640px;margin:40px auto;background:#faf6f0;border-radius:12px;color:#2a2a2a">
           <h1>Admin UI not built</h1>
           <p>Run <code>pnpm --filter little-bible-stories-adminui dev</code> and open <a href="http://localhost:5173">http://localhost:5173</a>,
              or run <code>pnpm --filter little-bible-stories-adminui build</code> and restart the server.</p>
         </div>`
      )
    }
    router.get('/admin', devMessage)
  }

  return router
}
