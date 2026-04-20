import { vi } from 'vitest'

// Mock fetch by default — individual tests override as needed.
global.fetch = vi.fn(async () =>
  new Response(JSON.stringify({ books: [], series: [], categories: [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
) as unknown as typeof fetch

// jsdom doesn't implement matchMedia; some components may query it indirectly.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (q: string) => ({
    matches: false,
    media: q,
    addListener: () => {
    },
    removeListener: () => {
    },
    addEventListener: () => {
    },
    removeEventListener: () => {
    },
    dispatchEvent: () => false,
    onchange: null
  })
})

// crypto.randomUUID is available in Node 19+/jsdom recent; fall back just in case.
if (!('randomUUID' in crypto)) {
  ;(crypto as unknown as { randomUUID: () => string }).randomUUID = () =>
    Math.random().toString(36).slice(2) + Date.now().toString(36)
}
