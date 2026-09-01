import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GAME_USER_UUID } from '@/utils/constants'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * `getUserUuid` memoises both the Tauri check and the id, so every case needs
 * a freshly imported module rather than a second call into the old one.
 */
async function freshModules(inTauri: boolean) {
  vi.resetModules()
  if (inTauri) vi.stubGlobal('isTauri', true)
  return {
    uuid: await import('@/use/useUserUuid'),
    headers: await import('@/api/apiHeaders')
  }
}

/**
 * Node 22 ships its own experimental Web Storage, which shadows jsdom's here
 * and doesn't implement the full `Storage` surface. The app survives that
 * (every access is wrapped in try/catch), but the test needs a predictable
 * store, so it supplies its own.
 */
let store: Record<string, string>

beforeEach(() => {
  store = {}
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v
    },
    removeItem: (k: string) => {
      delete store[k]
    },
    clear: () => {
      store = {}
    }
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getUserUuid', () => {
  it('mints and persists an id inside the Tauri app', async () => {
    const { uuid } = await freshModules(true)
    const id = uuid.getUserUuid()
    expect(id).toMatch(UUID_PATTERN)
    expect(store[GAME_USER_UUID]).toBe(id)
    // Stable within a session…
    expect(uuid.getUserUuid()).toBe(id)
  })

  it('reuses the stored id across launches', async () => {
    const stored = '11111111-2222-4333-8444-555555555555'
    store[GAME_USER_UUID] = stored
    const { uuid } = await freshModules(true)
    expect(uuid.getUserUuid()).toBe(stored)
  })

  it('replaces a corrupted stored value', async () => {
    store[GAME_USER_UUID] = 'not-a-uuid'
    const { uuid } = await freshModules(true)
    expect(uuid.getUserUuid()).toMatch(UUID_PATTERN)
  })

  it('returns nothing outside the Tauri app, and stores nothing', async () => {
    const { uuid } = await freshModules(false)
    expect(uuid.getUserUuid()).toBe('')
    // The web and Electron builds must not even create an id — an unused id
    // in localStorage would start counting the moment the gate regressed.
    expect(store[GAME_USER_UUID]).toBeUndefined()
  })
})

describe('buildApiHeaders', () => {
  it('sends X-User-Uuid from the Tauri app', async () => {
    const { headers } = await freshModules(true)
    const built = headers.buildApiHeaders() as Record<string, string>
    expect(built['X-User-Uuid']).toMatch(UUID_PATTERN)
  })

  it('omits X-User-Uuid everywhere else', async () => {
    const { headers } = await freshModules(false)
    const built = headers.buildApiHeaders() as Record<string, string>
    expect(built).not.toHaveProperty('X-User-Uuid')
    expect(built.accept).toBe('application/json')
  })

  it('honours an explicit userUuid override', async () => {
    const { headers } = await freshModules(false)
    const built = headers.buildApiHeaders(undefined, {
      userUuid: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    }) as Record<string, string>
    expect(built['X-User-Uuid']).toBe('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee')
  })

  it('treats an empty userUuid as "send this request untracked"', async () => {
    const { headers } = await freshModules(true)
    const built = headers.buildApiHeaders(undefined, { userUuid: '' }) as Record<string, string>
    expect(built).not.toHaveProperty('X-User-Uuid')
  })

  it('keeps caller-supplied headers', async () => {
    const { headers } = await freshModules(false)
    const built = headers.buildApiHeaders({ 'X-Test': '1' }) as Record<string, string>
    expect(built['X-Test']).toBe('1')
  })
})
