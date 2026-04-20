import { Router } from 'express'
import * as c from '../controllers/uploads.controller.js'
import { validate } from '../middleware/validate.js'
import { basicAuthGuard } from '../middleware/auth.js'
import { writeLimiter } from '../middleware/rateLimit.js'
import { audioUpload, imageUpload, pdfUpload } from '../middleware/upload.js'
import { audioUploadQuery, imageUploadQuery } from '../validators/upload.schema.js'

const router = Router()

router.post(
  '/audiobooks',
  writeLimiter,
  basicAuthGuard,
  validate(audioUploadQuery),
  audioUpload.single('file'),
  c.uploadAudio
)

router.post(
  '/images',
  writeLimiter,
  basicAuthGuard,
  validate(imageUploadQuery),
  imageUpload.single('file'),
  c.uploadImage
)

router.post('/attachments', writeLimiter, basicAuthGuard, pdfUpload.single('file'), c.uploadAttachment)

export default router
