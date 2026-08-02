import { Router } from 'express'
import * as c from '../controllers/series.controller.js'
import { validate } from '../middleware/validate.js'
import { basicAuthGuard } from '../middleware/auth.js'
import { writeLimiter } from '../middleware/rateLimit.js'
import { imageUpload } from '../middleware/upload.js'
import {
  createSeriesSchema,
  reorderSeriesSchema,
  seriesParamsSchema,
  updateSeriesSchema
} from '../validators/series.schema.js'

const router = Router()

router.get('/book-series', c.listSeries)
router.post('/book-series', writeLimiter, basicAuthGuard, validate(createSeriesSchema), c.createSeries)
router.put('/book-series/:id', writeLimiter, basicAuthGuard, validate(updateSeriesSchema), c.updateSeries)
// Display position. Separate from the generic update because it rewrites
// every other series' `sortOrder` as well.
router.put(
  '/book-series/:id/order',
  writeLimiter,
  basicAuthGuard,
  validate(reorderSeriesSchema),
  c.reorderSeries
)
router.delete('/book-series/:id', writeLimiter, basicAuthGuard, validate(seriesParamsSchema), c.deleteSeries)
// Atomic cover upload — multer handles the multipart body, the
// controller saves the image + writes the URL onto the series in one
// shot. Skip the JSON validator because the body is multipart, not JSON.
router.post(
  '/book-series/:id/cover',
  writeLimiter,
  basicAuthGuard,
  imageUpload.single('file'),
  c.uploadSeriesCover
)

export default router
