import { Router } from 'express'
import * as c from '../controllers/books.controller.js'
import { validate } from '../middleware/validate.js'
import { basicAuthGuard } from '../middleware/auth.js'
import { writeLimiter } from '../middleware/rateLimit.js'
import { bookParamsSchema, createBookSchema, updateBookSchema } from '../validators/book.schema.js'

const router = Router()

router.get('/books', c.listBooks)
router.get('/book/:id', validate(bookParamsSchema), c.getBook)

router.post('/books', writeLimiter, basicAuthGuard, validate(createBookSchema), c.createBook)
router.put('/book/:id', writeLimiter, basicAuthGuard, validate(updateBookSchema), c.updateBook)
router.delete('/book/:id', writeLimiter, basicAuthGuard, validate(bookParamsSchema), c.deleteBook)

export default router
