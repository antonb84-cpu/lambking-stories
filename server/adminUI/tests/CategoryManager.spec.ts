import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import CategoryManager from '@/components/organisms/CategoryManager.vue'
import { useCategoryStore } from '@/stores/categories'
import { HIDDEN_CATEGORY } from '@/types'

describe('CategoryManager', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders an icon dropzone on normal chips but not on the reserved one', async () => {
    const store = useCategoryStore()
    store.items = [
      { name: 'Abenteuer', icon: '' },
      { name: HIDDEN_CATEGORY, icon: '' }
    ]

    const w = mount(CategoryManager)
    await flushPromises()

    const chips = w.findAll('.tax-chip')
    expect(chips.length).toBe(2)

    const normal = chips.find((c) => c.text().includes('Abenteuer'))!
    expect(normal.find('.chip-cover').exists()).toBe(true)
    expect(normal.find('.chip-cover-placeholder').exists()).toBe(true)

    const reserved = chips.find((c) => c.text().includes(HIDDEN_CATEGORY))!
    expect(reserved.find('.chip-cover').exists()).toBe(false)
  })

  it('shows the uploaded icon as thumb once set', async () => {
    const store = useCategoryStore()
    store.items = [{ name: 'Abenteuer', icon: 'http://x/uploads/category-icons/a.png' }]

    const w = mount(CategoryManager)
    await flushPromises()

    const img = w.find('.chip-cover-img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toContain('category-icons')
    expect(w.find('.chip-cover').classes()).toContain('has-cover')
  })

  it('posts the file to the icon endpoint on file input', async () => {
    const store = useCategoryStore()
    store.items = [{ name: 'Abenteuer', icon: '' }]

    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({ category: { name: 'Abenteuer', icon: 'http://x/uploads/category-icons/a.png' } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    ) as unknown as typeof fetch
    global.fetch = fetchMock

    const w = mount(CategoryManager)
    await flushPromises()

    const input = w.find('.chip-cover-input')
    const file = new File(['png-bytes'], 'icon.png', { type: 'image/png' })
    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = (fetchMock as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0]!
    expect(String(url)).toContain('/api/categories/Abenteuer/icon')
    expect(init.method).toBe('POST')
    expect(store.items[0]!.icon).toContain('category-icons')
  })
})
