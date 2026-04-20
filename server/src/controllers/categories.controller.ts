import type { Request, Response } from 'express'
import { CategoryService } from '../services/CategoryService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

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
