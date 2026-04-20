import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { ADMIN_AUTH, createApp, sampleBook } from './helpers.js'

let app: Awaited<ReturnType<typeof createApp>>
beforeEach(async () => {
  app = await createApp()
})

describe('books routes', () => {
  it('rejects unauthenticated POST with 401', async () => {
    const res = await request(app).post('/api/books').send(sampleBook())
    expect(res.status).toBe(401)
  })

  it('rejects invalid payload with per-field details', async () => {
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', ADMIN_AUTH)
      .send({ ...sampleBook(), bookId: 'not-valid', coverImage: '' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    const fields = res.body.error.details.map((d: { field: string }) => d.field)
    expect(fields).toContain('bookId')
    expect(fields).toContain('coverImage')
  })

  it('creates, fetches, lists (cached on 2nd call), updates, and deletes a book', async () => {
    const created = await request(app).post('/api/books').set('Authorization', ADMIN_AUTH).send(sampleBook())
    expect(created.status).toBe(201)
    expect(created.body.book.bookId).toBe('fa-1-apple')

    const list1 = await request(app).get('/api/books')
    expect(list1.status).toBe(200)
    expect(list1.headers['x-cache']).toBe('MISS')
    expect(list1.body.books).toHaveLength(1)

    const list2 = await request(app).get('/api/books')
    expect(list2.headers['x-cache']).toBe('HIT')

    const one = await request(app).get('/api/book/fa-1-apple')
    expect(one.status).toBe(200)
    expect(one.body.book.bookId).toBe('fa-1-apple')

    const updated = await request(app)
      .put('/api/book/fa-1-apple')
      .set('Authorization', ADMIN_AUTH)
      .send({ author: 'Updated Author' })
    expect(updated.status).toBe(200)
    expect(updated.body.book.author).toBe('Updated Author')

    // Cache should be invalidated after update
    const listAfterUpdate = await request(app).get('/api/books')
    expect(listAfterUpdate.headers['x-cache']).toBe('MISS')

    const del = await request(app).delete('/api/book/fa-1-apple').set('Authorization', ADMIN_AUTH)
    expect(del.status).toBe(204)

    const after = await request(app).get('/api/book/fa-1-apple')
    expect(after.status).toBe(404)
  })

  it('rejects duplicate bookId with 409', async () => {
    await request(app).post('/api/books').set('Authorization', ADMIN_AUTH).send(sampleBook())
    const dup = await request(app).post('/api/books').set('Authorization', ADMIN_AUTH).send(sampleBook())
    expect(dup.status).toBe(409)
    expect(dup.body.error.code).toBe('CONFLICT')
  })
})
