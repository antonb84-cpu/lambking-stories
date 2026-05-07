import { Router } from 'express'
import * as c from '../controllers/books.controller.js'
import { validate } from '../middleware/validate.js'
import { basicAuthGuard } from '../middleware/auth.js'
import { writeLimiter } from '../middleware/rateLimit.js'
import { requireClientKey } from '../middleware/clientKey.js'
import { bookParamsSchema, createBookSchema, updateBookSchema } from '../validators/book.schema.js'

const router = Router()

// Public read endpoints. `requireClientKey` validates the X-Client-Key
// header against the CLIENT_KEYS env map — see middleware/clientKey.ts for
// why this isn't an auth boundary. Strict CORS doesn't reach these routes
// because the request carries an X-Client-Key, which the cors() handler in
// app.ts uses as the trigger to switch to the permissive `origin: *`
// policy. When CLIENT_KEYS is empty (local dev / tests), the middleware
// no-ops and the routes behave as before.
router.get('/books', requireClientKey, c.listBooks)
router.get('/book/:id', requireClientKey, validate(bookParamsSchema), c.getBook)

router.post('/books', writeLimiter, basicAuthGuard, validate(createBookSchema), c.createBook)
router.put('/book/:id', writeLimiter, basicAuthGuard, validate(updateBookSchema), c.updateBook)
router.delete('/book/:id', writeLimiter, basicAuthGuard, validate(bookParamsSchema), c.deleteBook)

export default router
