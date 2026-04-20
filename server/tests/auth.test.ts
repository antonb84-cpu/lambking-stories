import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { ADMIN_AUTH, createApp } from './helpers.js'

let app: Awaited<ReturnType<typeof createApp>>
beforeEach(async () => {
  app = await createApp()
})

describe('auth', () => {
  it('rejects /admin without credentials', async () => {
    const res = await request(app).get('/admin')
    expect(res.status).toBe(401)
    expect(res.headers['www-authenticate']).toMatch(/Basic/)
  })

  it('allows /admin with correct credentials', async () => {
    const res = await request(app).get('/admin').set('Authorization', ADMIN_AUTH)
    // No admin build in test → dev fallback page, but status is 200.
    expect(res.status).toBe(200)
  })

  it('rejects with incorrect credentials', async () => {
    const bad = 'Basic ' + Buffer.from('admin:wrong-password').toString('base64')
    const res = await request(app).get('/admin').set('Authorization', bad)
    expect(res.status).toBe(401)
  })
})
