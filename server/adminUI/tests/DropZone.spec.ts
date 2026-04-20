import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import DropZone from '@/components/molecules/DropZone.vue'

describe('DropZone', () => {
  it('calls onFile when a file is dropped', async () => {
    let received: File | null = null
    const w = mount(DropZone, {
      props: {
        label: 'Audio',
        accept: 'audio/ogg',
        kind: 'audio',
        onFile: (f: File) => {
          received = f
        }
      }
    })
    const file = new File(['x'], 'apple.ogg', { type: 'audio/ogg' })
    const dataTransfer = { files: [file] }
    await w.find('.drop-zone').trigger('drop', { dataTransfer })
    await flushPromises()
    expect(received).not.toBeNull()
    expect(received!.name).toBe('apple.ogg')
  })

  it('maintains fixed height so layout does not shift', () => {
    const w = mount(DropZone, {
      props: {
        label: 'Audio',
        accept: 'audio/ogg',
        kind: 'audio',
        onFile: () => {
        }
      }
    })
    const el = w.find('.drop-zone').element as HTMLElement
    expect(el.className).toContain('min-h-[220px]')
  })

  it('renders error status when provided', () => {
    const w = mount(DropZone, {
      props: {
        label: 'Audio',
        accept: 'audio/ogg',
        kind: 'audio',
        status: { ok: false, message: 'zu groß' },
        onFile: () => {
        }
      }
    })
    expect(w.text()).toContain('zu groß')
  })
})
