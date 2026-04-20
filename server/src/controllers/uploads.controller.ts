import type { Request, Response } from 'express'
import { UploadService, type ImageKind } from '../services/UploadService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HttpError } from '../utils/httpError.js'
import { toAbsolute } from '../utils/bookUrls.js'

export const uploadAudio = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw HttpError.badRequest('audio file is required (field name "file")')
  const { bookId, lang } = req.query as { bookId: string; lang: 'de' | 'en' }
  const out = await UploadService.saveAudio(req.file.buffer, req.file.mimetype, bookId, lang)
  res.status(201).json({ ...out, url: toAbsolute(out.url) })
})

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw HttpError.badRequest('image file is required (field name "file")')
  const { kind } = req.query as { kind: ImageKind }
  const out = await UploadService.saveImage(req.file.buffer, req.file.mimetype, kind)
  res.status(201).json({ ...out, url: toAbsolute(out.url) })
})

export const uploadAttachment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw HttpError.badRequest('PDF file is required (field name "file")')
  const out = await UploadService.saveAttachment(req.file.buffer, req.file.mimetype, req.file.originalname)
  res.status(201).json({ ...out, url: toAbsolute(out.url) })
})
