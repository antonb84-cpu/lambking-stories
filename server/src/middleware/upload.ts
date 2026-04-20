import multer from 'multer'
import { MAX_AUDIO_BYTES, MAX_IMAGE_BYTES, MAX_PDF_BYTES } from '../services/UploadService.js'

const storage = multer.memoryStorage()

export const audioUpload = multer({
  storage,
  limits: { fileSize: MAX_AUDIO_BYTES, files: 1 }
})

export const imageUpload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 }
})

export const pdfUpload = multer({
  storage,
  limits: { fileSize: MAX_PDF_BYTES, files: 1 }
})
