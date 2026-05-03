import type { Request, Response } from 'express'
import { UploadService, type ImageKind } from '../services/UploadService.js'
import { BookService } from '../services/BookService.js'
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

export const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  const url = String(req.query.url || '')
  if (!url) throw HttpError.badRequest('url query parameter is required')
  // Refuse to delete if any book page anywhere still references the URL —
  // a user may have copied the image into another page or another book,
  // or simply still be holding an unsaved draft that points at it.
  const stillReferenced = await BookService.isContentImageReferenced(url)
  if (stillReferenced) {
    res.status(200).json({ deleted: false, reason: 'still-referenced' })
    return
  }
  const result = await UploadService.deleteContentImage(url)
  res.status(200).json(result)
})
