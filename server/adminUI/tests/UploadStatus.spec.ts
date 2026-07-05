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
    // Success state is signalled via the semantic `is-ok` class (scoped
    // CSS handles the green styling) and the filename label.
    expect(w.find('.upload-status').classes()).toContain('is-ok')
    expect(w.find('.label.filename').exists()).toBe(true)
  })

  it('renders error message on failure', () => {
    const w = mount(UploadStatus, { props: { status: { ok: false, message: 'zu groß' } } })
    expect(w.text()).toContain('zu groß')
    // Error state is signalled via the semantic `is-err` class (scoped
    // CSS handles the red styling) and the error label.
    expect(w.find('.upload-status').classes()).toContain('is-err')
    expect(w.find('.label.error').exists()).toBe(true)
  })
})
