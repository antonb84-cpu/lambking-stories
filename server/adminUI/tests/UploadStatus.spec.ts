import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UploadStatus from '@/components/molecules/UploadStatus.vue'

describe('UploadStatus', () => {
  it('renders hint when no status', () => {
    const w = mount(UploadStatus, { props: { status: null, hint: 'bitte auswählen' } })
    expect(w.text()).toContain('bitte auswählen')
  })

  it('renders filename with check on success', () => {
    const w = mount(UploadStatus, { props: { status: { ok: true, filename: 'apple.ogg' } } })
    expect(w.text()).toContain('apple.ogg')
    expect(w.html()).toContain('text-emerald')
  })

  it('renders error message on failure', () => {
    const w = mount(UploadStatus, { props: { status: { ok: false, message: 'zu groß' } } })
    expect(w.text()).toContain('zu groß')
    expect(w.html()).toContain('text-rose')
  })
})
