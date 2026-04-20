import { describe, it, expect, beforeEach } from 'vitest'
import { CacheService } from '../src/services/CacheService.js'

describe('CacheService', () => {
  beforeEach(async () => {
    await CacheService.clearAll()
  })

  it('stores and retrieves books list', async () => {
    await CacheService.setBooksList([{ bookId: 'fa-1-apple' }])
    const back = await CacheService.getBooksList<{ bookId: string }[]>()
    expect(back).toEqual([{ bookId: 'fa-1-apple' }])
  })

  it('invalidates specific book + list on write', async () => {
    await CacheService.setBooksList([{ bookId: 'fa-1-apple' }])
    await CacheService.setBook('fa-1-apple', { bookId: 'fa-1-apple' })
    await CacheService.invalidateBooks('fa-1-apple')
    expect(await CacheService.getBooksList()).toBeNull()
    expect(await CacheService.getBook('fa-1-apple')).toBeNull()
  })
})
