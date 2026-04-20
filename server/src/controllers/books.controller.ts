import type { Request, Response } from 'express'
import { BookService } from '../services/BookService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const listBooks = asyncHandler(async (_req: Request, res: Response) => {
  const { books, cacheHit } = await BookService.list()
  res.setHeader('X-Cache', cacheHit ? 'HIT' : 'MISS')
  res.json({ books })
})

export const getBook = asyncHandler(async (req: Request, res: Response) => {
  const { book, cacheHit } = await BookService.getById(req.params.id as string)
  res.setHeader('X-Cache', cacheHit ? 'HIT' : 'MISS')
  res.json({ book })
})

export const createBook = asyncHandler(async (req: Request, res: Response) => {
  const book = await BookService.create(req.body)
  res.status(201).json({ book })
})

export const updateBook = asyncHandler(async (req: Request, res: Response) => {
  const book = await BookService.update(req.params.id as string, req.body)
  res.json({ book })
})

export const deleteBook = asyncHandler(async (req: Request, res: Response) => {
  await BookService.remove(req.params.id as string)
  res.status(204).send()
})
