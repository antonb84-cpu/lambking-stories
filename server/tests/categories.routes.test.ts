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

  it('uploads an icon onto a category and lists it back', async () => {
    await request(app)
      .post('/api/categories')
      .set('Authorization', ADMIN_AUTH)
      .send({ name: 'Abenteuer' })

    // Tiny valid PNG (1×1 transparent pixel).
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    )
    const uploaded = await request(app)
      .post('/api/categories/Abenteuer/icon')
      .set('Authorization', ADMIN_AUTH)
      .attach('file', png, { filename: 'icon.png', contentType: 'image/png' })
    expect(uploaded.status).toBe(200)
    expect(uploaded.body.category.icon).toContain('/uploads/category-icons/')

    const list = await request(app).get('/api/categories')
    const cat = list.body.categories.find((c: { name: string }) => c.name === 'Abenteuer')
    expect(cat.icon).toContain('/uploads/category-icons/')
  })

  it('rejects icon upload without auth', async () => {
    await request(app)
      .post('/api/categories')
      .set('Authorization', ADMIN_AUTH)
      .send({ name: 'Secure' })
    const res = await request(app)
      .post('/api/categories/Secure/icon')
      .attach('file', Buffer.from('x'), { filename: 'icon.png', contentType: 'image/png' })
    expect(res.status).toBe(401)
  })

  it('404s icon upload for unknown category', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    )
    const res = await request(app)
      .post('/api/categories/Nope/icon')
      .set('Authorization', ADMIN_AUTH)
      .attach('file', png, { filename: 'icon.png', contentType: 'image/png' })
    expect(res.status).toBe(404)
  })
})
