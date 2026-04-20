import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { ADMIN_AUTH, createApp } from './helpers.js'

let app: Awaited<ReturnType<typeof createApp>>
beforeEach(async () => {
  app = await createApp()
})

describe('series routes', () => {
  it('creates a series with auto-derived prefix and lists it', async () => {
    const res = await request(app)
      .post('/api/book-series')
      .set('Authorization', ADMIN_AUTH)
      .send({ name: 'Fruit Agents' })
    expect(res.status).toBe(201)
    expect(res.body.series.prefix).toBe('fa')
    expect(res.body.series.seriesId).toBe('fruit-agents')

    const list = await request(app).get('/api/book-series')
    expect(list.body.series).toHaveLength(1)
  })

  it('returns 409 with alternative prefixes when prefix collides', async () => {
    await request(app).post('/api/book-series').set('Authorization', ADMIN_AUTH).send({ name: 'Fruit Agents' })
    const res = await request(app)
      .post('/api/book-series')
      .set('Authorization', ADMIN_AUTH)
      .send({ name: 'Fruit Academy' })
    expect(res.status).toBe(409)
    expect(res.body.error.details[0].field).toBe('prefix')
    expect(res.body.error.details[0].message).toMatch(/try:/)
  })

  it('rejects unauthenticated create', async () => {
    const res = await request(app).post('/api/book-series').send({ name: 'X' })
    expect(res.status).toBe(401)
  })
})
