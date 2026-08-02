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

describe('series display order', () => {
  // Creates the given series in order and returns their ids.
  async function seed(names: string[]): Promise<string[]> {
    const ids: string[] = []
    for (const name of names) {
      const res = await request(app)
        .post('/api/book-series')
        .set('Authorization', ADMIN_AUTH)
        .send({ name })
      expect(res.status).toBe(201)
      ids.push(res.body.series.seriesId as string)
    }
    return ids
  }

  const order = (body: { series: Array<{ seriesId: string; sortOrder: number }> }) =>
    body.series.map((s) => `${s.sortOrder}:${s.seriesId}`)

  it('assigns each new series the next free position', async () => {
    await seed(['Alpha Reihe', 'Beta Reihe', 'Gamma Reihe'])
    const list = await request(app).get('/api/book-series')
    expect(order(list.body)).toEqual(['1:alpha-reihe', '2:beta-reihe', '3:gamma-reihe'])
  })

  it('moves a series to the requested position and renumbers the rest', async () => {
    await seed(['Alpha Reihe', 'Beta Reihe', 'Gamma Reihe'])
    const res = await request(app)
      .put('/api/book-series/gamma-reihe/order')
      .set('Authorization', ADMIN_AUTH)
      .send({ sortOrder: 1 })
    expect(res.status).toBe(200)
    expect(order(res.body)).toEqual(['1:gamma-reihe', '2:alpha-reihe', '3:beta-reihe'])

    // …and it survives the round trip rather than only living in the response.
    const list = await request(app).get('/api/book-series')
    expect(order(list.body)).toEqual(['1:gamma-reihe', '2:alpha-reihe', '3:beta-reihe'])
  })

  it('clamps a position past the end to last', async () => {
    await seed(['Alpha Reihe', 'Beta Reihe', 'Gamma Reihe'])
    const res = await request(app)
      .put('/api/book-series/alpha-reihe/order')
      .set('Authorization', ADMIN_AUTH)
      .send({ sortOrder: 99 })
    expect(res.status).toBe(200)
    expect(order(res.body)).toEqual(['1:beta-reihe', '2:gamma-reihe', '3:alpha-reihe'])
  })

  it('rejects a non-positive position', async () => {
    await seed(['Alpha Reihe'])
    const res = await request(app)
      .put('/api/book-series/alpha-reihe/order')
      .set('Authorization', ADMIN_AUTH)
      .send({ sortOrder: 0 })
    expect(res.status).toBe(400)
    expect(res.body.error.details[0].field).toBe('sortOrder')
  })

  it('404s for an unknown series', async () => {
    const res = await request(app)
      .put('/api/book-series/does-not-exist/order')
      .set('Authorization', ADMIN_AUTH)
      .send({ sortOrder: 1 })
    expect(res.status).toBe(404)
  })

  it('rejects unauthenticated reorder', async () => {
    await seed(['Alpha Reihe'])
    const res = await request(app).put('/api/book-series/alpha-reihe/order').send({ sortOrder: 1 })
    expect(res.status).toBe(401)
  })
})
