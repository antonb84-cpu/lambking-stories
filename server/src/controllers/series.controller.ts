import type { Request, Response } from 'express'
import { SeriesService } from '../services/SeriesService.js'
import { UploadService } from '../services/UploadService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HttpError } from '../utils/httpError.js'
import { toAbsolute } from '../utils/bookUrls.js'

export const listSeries = asyncHandler(async (_req: Request, res: Response) => {
  const series = await SeriesService.list()
  res.json({ series })
})

export const createSeries = asyncHandler(async (req: Request, res: Response) => {
  const series = await SeriesService.create(req.body)
  res.status(201).json({ series })
})

export const updateSeries = asyncHandler(async (req: Request, res: Response) => {
  const series = await SeriesService.update(req.params.id as string, req.body)
  res.json({ series })
})

// Moves a series to a new display position and renumbers the rest. Answers
// with the whole re-sorted list so the AdminUI can swap its cache wholesale
// instead of reconciling every shifted neighbour itself.
export const reorderSeries = asyncHandler(async (req: Request, res: Response) => {
  const { sortOrder } = req.body as { sortOrder: number }
  const series = await SeriesService.reorder(req.params.id as string, sortOrder)
  res.json({ series })
})

export const deleteSeries = asyncHandler(async (req: Request, res: Response) => {
  await SeriesService.remove(req.params.id as string)
  res.status(204).send()
})

// Atomic upload + persist for the series banner image. Stores the image
// via `UploadService.saveImage`, writes the absolute URL back onto the
// series doc, and returns the updated series so the client can patch its
// local cache with a single request.
export const uploadSeriesCover = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw HttpError.badRequest('image file is required (field name "file")')
  const saved = await UploadService.saveImage(req.file.buffer, req.file.mimetype, 'cover')
  const url = toAbsolute(saved.url)
  const series = await SeriesService.update(req.params.id as string, { coverImage: url })
  res.status(200).json({ series })
})
