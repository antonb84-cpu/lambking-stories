import { Router } from 'express'
import * as c from '../controllers/health.controller.js'

const router = Router()
router.get('/healthz', c.health)
export default router
