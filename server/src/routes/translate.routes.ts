import { Router } from 'express'
import * as c from '../controllers/translate.controller.js'
import { validate } from '../middleware/validate.js'
import { basicAuthGuard } from '../middleware/auth.js'
import { writeLimiter } from '../middleware/rateLimit.js'
import { translateSchema } from '../validators/translate.schema.js'

const router = Router()

router.post('/translate', writeLimiter, basicAuthGuard, validate(translateSchema), c.translate)

export default router
