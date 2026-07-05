import type { Request, Response } from 'express'
import { CategoryService } from '../services/CategoryService.js'
import { UploadService } from '../services/UploadService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HttpError } from '../utils/httpError.js'
import { toAbsolute } from '../utils/bookUrls.js'

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await CategoryService.list()
  res.json({ categories })
})

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await CategoryService.create(req.body)
  res.status(201).json({ category })
})

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await CategoryService.remove(req.params.name as string)
  res.status(204).send()
})

// Atomic upload + persist for the category icon — mirrors
// `uploadSeriesCover`. Stores the image via `UploadService.saveImage`,
// writes the absolute URL back onto the category doc, and returns the
// updated category so the client can patch its local cache with a
// single request.
export const uploadCategoryIcon = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw HttpError.badRequest('image file is required (field name "file")')
  const saved = await UploadService.saveImage(req.file.buffer, req.file.mimetype, 'category-icon')
  const url = toAbsolute(saved.url)
  const category = await CategoryService.update(req.params.name as string, { icon: url })
  res.status(200).json({ category })
})
