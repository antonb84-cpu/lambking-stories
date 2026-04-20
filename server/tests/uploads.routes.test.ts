import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { ADMIN_AUTH, createApp } from './helpers.js'

let app: Awaited<ReturnType<typeof createApp>>
beforeEach(async () => {
  app = await createApp()
})

describe('upload routes', () => {
  it('uploads an OGG audio file and returns a URL', async () => {
    const fakeOgg = Buffer.from([0x4f, 0x67, 0x67, 0x53, 0, 0, 0, 0])
    const res = await request(app)
      .post('/api/audiobooks?bookId=fa-1-apple&lang=de')
      .set('Authorization', ADMIN_AUTH)
      .attach('file', fakeOgg, { filename: 'test.ogg', contentType: 'audio/ogg' })
    expect(res.status).toBe(201)
    expect(res.body.url).toMatch(/\/audiobooks\/de\/fa-1-apple\.ogg$/)
  })

  it('rejects non-OGG audio upload', async () => {
    const buf = Buffer.from('not really audio')
    const res = await request(app)
      .post('/api/audiobooks?bookId=fa-1-apple&lang=de')
      .set('Authorization', ADMIN_AUTH)
      .attach('file', buf, { filename: 'x.mp3', contentType: 'audio/mpeg' })
    expect(res.status).toBe(415)
  })

  it('uploads an image (webp)', async () => {
    const buf = Buffer.from('RIFF....WEBPVP8 ')
    const res = await request(app)
      .post('/api/images?kind=cover')
      .set('Authorization', ADMIN_AUTH)
      .attach('file', buf, { filename: 'cover.webp', contentType: 'image/webp' })
    expect(res.status).toBe(201)
    expect(res.body.url).toMatch(/\/uploads\/covers\/.+\.webp$/)
  })

  it('uploads a PDF attachment', async () => {
    const buf = Buffer.from('%PDF-1.4 fake pdf content')
    const res = await request(app)
      .post('/api/attachments')
      .set('Authorization', ADMIN_AUTH)
      .attach('file', buf, { filename: 'doc.pdf', contentType: 'application/pdf' })
    expect(res.status).toBe(201)
    expect(res.body.url).toMatch(/\/uploads\/attachments\/.+\.pdf$/)
  })
})
