import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from './helpers.js'

let app: Awaited<ReturnType<typeof createApp>>
beforeEach(async () => {
  app = await createApp()
})

describe('health', () => {
  it('reports mongo ok', async () => {
    const res = await request(app).get('/healthz')
    expect(res.status).toBe(200)
    expect(res.body.mongo).toBe(true)
  })
})
