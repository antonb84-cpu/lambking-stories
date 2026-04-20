import { Router } from 'express'
import * as c from '../controllers/series.controller.js'
import { validate } from '../middleware/validate.js'
import { basicAuthGuard } from '../middleware/auth.js'
import { writeLimiter } from '../middleware/rateLimit.js'
import { createSeriesSchema, seriesParamsSchema, updateSeriesSchema } from '../validators/series.schema.js'

const router = Router()

router.get('/book-series', c.listSeries)
router.post('/book-series', writeLimiter, basicAuthGuard, validate(createSeriesSchema), c.createSeries)
router.put('/book-series/:id', writeLimiter, basicAuthGuard, validate(updateSeriesSchema), c.updateSeries)
router.delete('/book-series/:id', writeLimiter, basicAuthGuard, validate(seriesParamsSchema), c.deleteSeries)

export default router
