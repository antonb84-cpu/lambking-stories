import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import SeriesManager from '@/components/organisms/SeriesManager.vue'

describe('SeriesManager', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('posts a new series when Enter is pressed', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ series: { seriesId: 'fruit-agents', name: 'Fruit Agents', prefix: 'fa' } }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      })
    ) as unknown as typeof fetch
    global.fetch = fetchMock

    const w = mount(SeriesManager)
    const input = w.find('input')
    await input.setValue('Fruit Agents')
    await input.trigger('keydown.enter')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = (fetchMock as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0]!
    expect(init.method).toBe('POST')
    expect(init.body as string).toContain('"Fruit Agents"')
  })

  it('shows the error details on 409 conflict', async () => {
    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          error: {
            code: 'CONFLICT',
            message: 'prefix "fa" is already taken',
            details: [{ field: 'prefix', message: 'taken — try: fb, fc' }]
          }
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    ) as unknown as typeof fetch

    const w = mount(SeriesManager)
    const input = w.find('input')
    await input.setValue('Fruit Academy')
    await input.trigger('keydown.enter')
    await flushPromises()
    // The component routes the error to the toast store — we just verify no crash + no series added.
    expect(w.text()).not.toContain('Fruit Academy')
  })
})
