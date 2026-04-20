import type { Locale } from '../types/book.types.js'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

/**
 * Opus-MT pair: smaller (~300 MB each, q8 ~80 MB) and far more memory-friendly
 * than NLLB-200-distilled-600M, which can fail with `bad allocation` under
 * ONNX Runtime on constrained hosts. Quality for DE↔EN is on par or better.
 */
const MODEL_FOR: Record<`${Locale}-${Locale}`, string> = {
  'de-en': 'Xenova/opus-mt-de-en',
  'en-de': 'Xenova/opus-mt-en-de',
  'de-de': '',
  'en-en': ''
}

type TranslatorFn = (text: string) => Promise<Array<{ translation_text: string }>>

const cache: Partial<Record<`${Locale}-${Locale}`, TranslatorFn>> = {}
const loading: Partial<Record<`${Locale}-${Locale}`, Promise<TranslatorFn>>> = {}

async function getTranslator(from: Locale, to: Locale): Promise<TranslatorFn> {
  const key = `${from}-${to}` as `${Locale}-${Locale}`
  const cached = cache[key]
  if (cached) return cached
  const pending = loading[key]
  if (pending) return pending

  const modelId = MODEL_FOR[key]
  if (!modelId) throw new Error(`No translation model configured for ${key}`)

  if (env.HF_HOME) process.env.HF_HOME = env.HF_HOME

  loading[key] = (async () => {
    logger.info('loading translation model', { model: modelId, dtype: env.TRANSLATION_DTYPE })
    let mod: {
      pipeline: (
        task: string,
        model: string,
        options?: { dtype?: string }
      ) => Promise<TranslatorFn>
    }
    try {
      mod = (await import('@huggingface/transformers')) as unknown as typeof mod
    } catch (err) {
      throw new Error(
        '@huggingface/transformers is not installed on this host. ' +
        'Set TRANSLATION_ENABLED=false to disable, or run `pnpm install --include=optional` locally. ' +
        `Original error: ${(err as Error).message}`
      )
    }
    const pipe = await mod.pipeline('translation', modelId, { dtype: env.TRANSLATION_DTYPE })
    logger.info('translation model ready', { model: modelId })
    cache[key] = pipe
    return pipe
  })()
  return loading[key]!
}

/**
 * Opus-MT chokes on long / markdown-heavy input (512-token limit, unknown
 * tokens for `![alt](url)` etc.). Split each text into paragraph-size chunks
 * before translating and pass image tags through untouched.
 */
const IMAGE_LINE = /^!\[[^\]]*\]\([^)\s]+\)\s*$/
const MAX_CHARS_PER_CHUNK = 800

function splitForTranslation(text: string): string[] {
  const paragraphs = text.split(/\n{2,}/)
  const chunks: string[] = []
  for (const para of paragraphs) {
    if (!para.trim()) {
      chunks.push('')
      continue
    }
    if (para.length <= MAX_CHARS_PER_CHUNK) {
      chunks.push(para)
      continue
    }
    // Sentence-split long paragraphs on `.`, `!`, `?` followed by whitespace.
    let buf = ''
    for (const sentence of para.split(/(?<=[.!?])\s+/)) {
      if ((buf + ' ' + sentence).length > MAX_CHARS_PER_CHUNK && buf) {
        chunks.push(buf)
        buf = sentence
      } else {
        buf = buf ? `${buf} ${sentence}` : sentence
      }
    }
    if (buf) chunks.push(buf)
  }
  return chunks
}

async function translatePreservingStructure(
  pipe: TranslatorFn,
  text: string
): Promise<string> {
  const chunks = splitForTranslation(text)
  const translated = await Promise.all(
    chunks.map(async (chunk) => {
      const trimmed = chunk.trim()
      if (!trimmed) return chunk
      if (IMAGE_LINE.test(trimmed)) return chunk
      const out = await pipe(chunk)
      return out?.[0]?.translation_text ?? chunk
    })
  )
  return translated.join('\n\n')
}

export const TranslationService = {
  isEnabled(): boolean {
    return env.TRANSLATION_ENABLED
  },

  /**
   * Fire-and-forget preload for both directions so the first user request
   * doesn't pay the model download + ONNX init cost.
   */
  warmup(): void {
    if (!env.TRANSLATION_ENABLED) {
      logger.info('translation disabled (TRANSLATION_ENABLED=false) — skipping warmup')
      return
    }
    void getTranslator('de', 'en').catch((err) => {
      logger.error('warmup de→en failed', { err: (err as Error).message })
    })
    void getTranslator('en', 'de').catch((err) => {
      logger.error('warmup en→de failed', { err: (err as Error).message })
    })
  },

  async translateText(from: Locale, to: Locale, text: string): Promise<string> {
    if (from === to) return text
    if (!text.trim()) return text
    const pipe = await getTranslator(from, to)
    return translatePreservingStructure(pipe, text)
  },

  async translateBatch(
    from: Locale,
    to: Locale,
    strings: Record<string, string>
  ): Promise<Record<string, string>> {
    const out: Record<string, string> = {}
    for (const [key, value] of Object.entries(strings)) {
      try {
        out[key] = await this.translateText(from, to, value)
      } catch (err) {
        logger.error('translation failed', { key, err: (err as Error).message })
        out[key] = value
      }
    }
    return out
  }
}
