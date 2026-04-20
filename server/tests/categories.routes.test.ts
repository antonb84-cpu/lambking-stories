import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { ADMIN_AUTH, createApp } from './helpers.js'

let app: Awaited<ReturnType<typeof createApp>>
beforeEach(async () => {
  app = await createApp()
})

describe('category routes', () => {
  it('creates, lists, and deletes a category', async () => {
    const created = await request(app)
      .post('/api/categories')
      .set('Authorization', ADMIN_AUTH)
      .send({ name: 'Früchte' })
    expect(created.status).toBe(201)

    const list = await request(app).get('/api/categories')
    expect(list.body.categories.map((c: { name: string }) => c.name)).toContain('Früchte')

    const del = await request(app)
      .delete('/api/categories/Früchte')
      .set('Authorization', ADMIN_AUTH)
    expect(del.status).toBe(204)
  })

  it('rejects duplicate category', async () => {
    await request(app).post('/api/categories').set('Authorization', ADMIN_AUTH).send({ name: 'X' })
    const dup = await request(app).post('/api/categories').set('Authorization', ADMIN_AUTH).send({ name: 'X' })
    expect(dup.status).toBe(409)
  })
})
