import path from 'node:path'
import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import mime from 'mime-types'
import { env } from '../config/env.js'
import { HttpError } from '../utils/httpError.js'

export type ImageKind = 'cover' | 'preview' | 'content'

const IMAGE_MIME_TO_EXT: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png'
}

const AUDIO_MIME = new Set(['audio/ogg', 'audio/x-ogg', 'application/ogg'])
const PDF_MIME = 'application/pdf'

export const IMAGE_DIR_MAP: Record<ImageKind, string> = {
  cover: 'covers',
  preview: 'previews',
  content: 'content-images'
}

export const MAX_AUDIO_BYTES = 50 * 1024 * 1024
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_PDF_BYTES = 25 * 1024 * 1024

function hashBuffer(buf: Buffer): string {
  return crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16)
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

// Stored values are root-relative (e.g. `/uploads/covers/foo.webp`) so the DB
// is portable across environments; absolutizeBook() prepends PUBLIC_BASE_URL
// at read time.
function relUrl(rel: string): string {
  return '/' + rel.replace(/^\/+/, '')
}

export const UploadService = {
  async saveAudio(buffer: Buffer, mimetype: string, bookId: string, lang: 'de' | 'en') {
    if (!AUDIO_MIME.has(mimetype)) {
      throw HttpError.unsupportedMedia(`audio must be OGG (received ${mimetype})`)
    }
    if (buffer.length > MAX_AUDIO_BYTES) {
      throw HttpError.payloadTooLarge(`audio exceeds ${MAX_AUDIO_BYTES} bytes`)
    }
    const dir = path.resolve(env.AUDIOBOOKS_DIR, lang)
    await ensureDir(dir)
    const filename = `${bookId}.ogg`
    await fs.writeFile(path.join(dir, filename), buffer)
    const rel = `audiobooks/${lang}/${filename}`
    return { url: relUrl(rel), path: rel, size: buffer.length }
  },

  async saveImage(buffer: Buffer, mimetype: string, kind: ImageKind) {
    const ext = IMAGE_MIME_TO_EXT[mimetype]
    if (!ext) {
      throw HttpError.unsupportedMedia(`image must be webp/jpeg/png (received ${mimetype})`)
    }
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw HttpError.payloadTooLarge(`image exceeds ${MAX_IMAGE_BYTES} bytes`)
    }
    const subdir = IMAGE_DIR_MAP[kind]
    const dir = path.resolve(env.UPLOADS_DIR, subdir)
    await ensureDir(dir)
    const name = `${hashBuffer(buffer)}-${Date.now()}.${ext}`
    await fs.writeFile(path.join(dir, name), buffer)
    const rel = `uploads/${subdir}/${name}`
    return { url: relUrl(rel), path: rel, kind }
  },

  async saveAttachment(buffer: Buffer, mimetype: string, originalName: string) {
    if (mimetype !== PDF_MIME) {
      throw HttpError.unsupportedMedia(`attachment must be PDF (received ${mimetype})`)
    }
    if (buffer.length > MAX_PDF_BYTES) {
      throw HttpError.payloadTooLarge(`attachment exceeds ${MAX_PDF_BYTES} bytes`)
    }
    const dir = path.resolve(env.UPLOADS_DIR, 'attachments')
    await ensureDir(dir)
    const safeBase = (path.basename(originalName, path.extname(originalName)) || 'attachment')
      .replace(/[^a-z0-9-_]+/gi, '-')
      .slice(0, 64)
    const ext = mime.extension(mimetype) || 'pdf'
    const filename = `${hashBuffer(buffer)}-${Date.now()}-${safeBase}.${ext}`
    await fs.writeFile(path.join(dir, filename), buffer)
    const rel = `uploads/attachments/${filename}`
    return { url: relUrl(rel), path: rel, filename: safeBase }
  }
}
