import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AttachmentsList from '@/components/molecules/AttachmentsList.vue'

describe('AttachmentsList', () => {
  it('renders an item per attachment', () => {
    const w = mount(AttachmentsList, {
      props: { items: ['http://x/uploads/attachments/foo.pdf', 'http://x/uploads/attachments/bar.pdf'] }
    })
    expect(w.findAll('a').length).toBe(2)
    expect(w.text()).toContain('foo.pdf')
  })

  it('emits remove when × clicked', async () => {
    const w = mount(AttachmentsList, { props: { items: ['http://x/a.pdf'] } })
    await w.find('button').trigger('click')
    expect(w.emitted('remove')![0]).toEqual([0])
  })

  it('produces layout (is visible) only when items exist — creating layout shift by design', () => {
    const empty = mount(AttachmentsList, { props: { items: [] } })
    expect(empty.html()).not.toContain('attachment-card')
    const filled = mount(AttachmentsList, { props: { items: ['http://x/a.pdf'] } })
    expect(filled.html()).toContain('attachment-card')
  })
})
