import { Router } from 'express'
import * as c from '../controllers/categories.controller.js'
import { validate } from '../middleware/validate.js'
import { basicAuthGuard } from '../middleware/auth.js'
import { writeLimiter } from '../middleware/rateLimit.js'
import { imageUpload } from '../middleware/upload.js'
import { categoryParamsSchema, createCategorySchema } from '../validators/category.schema.js'

const router = Router()

router.get('/categories', c.listCategories)
router.post('/categories', writeLimiter, basicAuthGuard, validate(createCategorySchema), c.createCategory)
router.delete('/categories/:name', writeLimiter, basicAuthGuard, validate(categoryParamsSchema), c.deleteCategory)
// Atomic icon upload — multer handles the multipart body, the
// controller saves the image + writes the URL onto the category in one
// shot. Skip the JSON validator because the body is multipart, not JSON.
router.post(
  '/categories/:name/icon',
  writeLimiter,
  basicAuthGuard,
  imageUpload.single('file'),
  c.uploadCategoryIcon
)

export default router
