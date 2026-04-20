import type { Request, Response } from 'express'
import { TranslationService } from '../services/TranslationService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HttpError } from '../utils/httpError.js'
import type { TranslateInput } from '../validators/translate.schema.js'

export const translate = asyncHandler(async (req: Request, res: Response) => {
  if (!TranslationService.isEnabled()) {
    throw HttpError.forbidden('Translation is disabled on this server')
  }
  const body = req.body as TranslateInput
  const translations = await TranslationService.translateBatch(body.from, body.to, body.strings)
  res.json({ from: body.from, to: body.to, translations })
})
