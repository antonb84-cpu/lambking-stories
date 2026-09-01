import { Router } from 'express'
import * as c from '../controllers/usage.controller.js'
import { basicAuthGuard } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { usageQuerySchema } from '../validators/usage.schema.js'

const router = Router()

// Behind the same basic auth as the admin UI it feeds — the numbers are
// business data, and the route is served from the same origin as /admin so
// the browser reuses the credentials the admin already entered.
router.get('/admin/usage/daily', basicAuthGuard, validate(usageQuerySchema), c.getDailyUsage)

export default router
