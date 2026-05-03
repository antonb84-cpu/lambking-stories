import path from 'node:path'
import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import mime from 'mime-types'
import { env } from '../config/env.js'
import { HttpError } from '../utils/httpError.js'

export type ImageKind = 'cover' | 'preview' | 'content' | 'achievement'

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
  content: 'content-images',
  achievement: 'achievement-badges'
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

// Accept either a fully-qualified URL or a stored relative path; strip the
// leading slash so we can join it with UPLOADS_DIR safely.
export function stripUploadPrefix(value: string): string | null {
  if (!value) return null
  let s = value
  // Strip scheme + host so callers can pass either store-relative or
  // absolutized URLs (the admin UI receives the absolutized form).
  s = s.replace(/^https?:\/\/[^/]+/i, '')
  s = s.replace(/^\/+/, '')
  if (!s.startsWith('uploads/')) return null
  return s
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

  // Delete a content image file from disk after callers have already
  // verified that no document still references the URL. Returns whether the
  // file was unlinked, or `notFound` when nothing was on disk to begin with
  // (idempotent — repeated removal of the same URL is fine).
  async deleteContentImage(url: string): Promise<{ deleted: boolean; reason?: string }> {
    const rel = stripUploadPrefix(url)
    if (!rel) return { deleted: false, reason: 'invalid-url' }
    // Only allow deleting from the content-images bucket. Covers, previews,
    // achievement badges, and audio files are managed via the book record
    // and must NOT be deleted via this endpoint.
    const contentSubdir = IMAGE_DIR_MAP.content
    const expectedPrefix = `uploads/${contentSubdir}/`
    if (!rel.startsWith(expectedPrefix)) return { deleted: false, reason: 'wrong-bucket' }
    const filename = rel.slice(expectedPrefix.length)
    if (!filename || filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      return { deleted: false, reason: 'invalid-filename' }
    }
    const abs = path.resolve(env.UPLOADS_DIR, contentSubdir, filename)
    try {
      await fs.unlink(abs)
      return { deleted: true }
    } catch (err) {
      const e = err as NodeJS.ErrnoException
      if (e.code === 'ENOENT') return { deleted: false, reason: 'not-found' }
      throw err
    }
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
