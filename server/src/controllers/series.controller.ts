import type { Request, Response } from 'express'
import { SeriesService } from '../services/SeriesService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

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

export const deleteSeries = asyncHandler(async (req: Request, res: Response) => {
  await SeriesService.remove(req.params.id as string)
  res.status(204).send()
})
