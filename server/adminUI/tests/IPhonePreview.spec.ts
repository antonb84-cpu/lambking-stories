import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import IPhonePreview from '@/components/organisms/IPhonePreview.vue'
import type { BookPage } from '@/types'

const pages: BookPage[] = [
  { page: 1, title: 'Seite 1', text: 'Text der ersten Seite.' },
  { page: 2, title: 'Seite 2', text: 'Text der zweiten Seite.' }
]

describe('IPhonePreview', () => {
  it('renders the first page by default', () => {
    const w = mount(IPhonePreview, { props: { pages } })
    expect(w.text()).toContain('Seite 1')
    expect(w.text()).toContain('Text der ersten Seite.')
  })

  it('advances to the next page on swipe-left gesture', async () => {
    const w = mount(IPhonePreview, { props: { pages } })
    const screen = w.find('.screen')
    await screen.trigger('mousedown', { clientX: 200 })
    await screen.trigger('mousemove', { clientX: 50 })
    await screen.trigger('mouseup')
    expect(w.text()).toContain('Seite 2')
  })

  it('jumps to a specific page via the pager dots', async () => {
    const w = mount(IPhonePreview, { props: { pages } })
    const dots = w.findAll('.pager button')
    await dots[1]!.trigger('click')
    expect(w.text()).toContain('Seite 2')
  })
})
