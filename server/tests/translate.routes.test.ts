import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { ADMIN_AUTH, createApp } from './helpers.js'

let app: Awaited<ReturnType<typeof createApp>>
beforeEach(async () => {
  app = await createApp()
})

describe('translate route', () => {
  it('returns 403 when TRANSLATION_ENABLED=false', async () => {
    const res = await request(app)
      .post('/api/translate')
      .set('Authorization', ADMIN_AUTH)
      .send({ from: 'de', to: 'en', strings: { title: 'Der Apfel' } })
    expect(res.status).toBe(403)
  })

  it('rejects invalid payload (from === to)', async () => {
    const res = await request(app)
      .post('/api/translate')
      .set('Authorization', ADMIN_AUTH)
      .send({ from: 'de', to: 'de', strings: { title: 'x' } })
    expect(res.status).toBe(400)
  })
})
