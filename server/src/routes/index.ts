import { Router } from 'express'
import books from './books.routes.js'
import series from './series.routes.js'
import categories from './categories.routes.js'
import uploads from './uploads.routes.js'
import translate from './translate.routes.js'
import { basicAuthGuard } from '../middleware/auth.js'

const api = Router()
api.use(books)
api.use(series)
api.use(categories)
api.use(uploads)
api.use(translate)

api.get('/admin/session', basicAuthGuard, (req, res) => {
  const user = (req as unknown as { auth?: { user: string } }).auth?.user
  res.json({ ok: true, user })
})

export default api
