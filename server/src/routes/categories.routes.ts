import { Router } from 'express'
import * as c from '../controllers/categories.controller.js'
import { validate } from '../middleware/validate.js'
import { basicAuthGuard } from '../middleware/auth.js'
import { writeLimiter } from '../middleware/rateLimit.js'
import { categoryParamsSchema, createCategorySchema } from '../validators/category.schema.js'

const router = Router()

router.get('/categories', c.listCategories)
router.post('/categories', writeLimiter, basicAuthGuard, validate(createCategorySchema), c.createCategory)
router.delete('/categories/:name', writeLimiter, basicAuthGuard, validate(categoryParamsSchema), c.deleteCategory)

export default router
