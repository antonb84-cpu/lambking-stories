import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import RichTextEditor from '@/components/organisms/RichTextEditor.vue'

// Tiptap drives a contenteditable element through ProseMirror; jsdom's
// minimal contenteditable support is enough for everything we assert here
// (doc shape, markdown output, command effects). We avoid asserting on
// rendered NodeView DOM because Vue's NodeViewRenderer is async-mounted.

vi.mock('@/api/uploads', () => ({
  uploadsApi: {
    image: vi.fn(async (_file: File, _kind: string) => ({
      url: '/uploads/content-images/abc-1.jpg',
      path: 'uploads/content-images/abc-1.jpg',
      kind: 'content'
    }))
  }
}))

interface EditorWrapperVm {
  editor: { getHTML: () => string; storage: { markdown: { getMarkdown: () => string } } }
}

function mountEditor(initialPages: Array<{ page: number; title: string; text: string }>) {
  return mount(RichTextEditor, {
    props: {
      modelValue: initialPages,
      'onUpdate:modelValue': () => {
        /* explicit no-op so v-model works without parent */
      }
    }
  })
}

async function readyEditor<T extends { vm: unknown }>(w: T): Promise<EditorWrapperVm> {
  // useEditor inside Tiptap is async — it resolves on the first nextTick after
  // mount. Two flushes are enough on jsdom to get a fully-initialised editor.
  await flushPromises()
  await flushPromises()
  return w.vm as unknown as EditorWrapperVm
}

// Centralised reset — every test starts with a clean Pinia + zeroed mocks.
beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('RichTextEditor — image markdown round-trip', () => {

  it('parses markdown image syntax in the initial content as an Image node', async () => {
    const w = mountEditor([
      { page: 1, title: 'Seite 1', text: '![cover.jpg](https://example.com/uploads/content-images/x.jpg)' }
    ])
    const vm = await readyEditor(w)
    const html = vm.editor.getHTML()
    // The custom NodeView wraps the <img> in our editor-image-frame; on
    // jsdom the inner DOM may be empty (Vue NodeViewRenderer mounts async),
    // but the schema-level `<img>` markup must be present.
    expect(html).toMatch(/<img[^>]+src="https:\/\/example\.com\/uploads\/content-images\/x\.jpg"/)
    w.unmount()
  })

  it('serializes images back to markdown without escaping brackets', async () => {
    const w = mountEditor([
      { page: 1, title: 'Seite 1', text: '![placeholder.webp](/uploads/content-images/p.webp)' }
    ])
    const vm = await readyEditor(w)
    const md = vm.editor.storage.markdown.getMarkdown()
    // The fix: tiptap-markdown's image serializer must produce `![alt](url)`
    // — *not* `!\[alt\](url)`. A regression here would re-introduce the
    // backslash-compounding bug the user hit before.
    expect(md).toContain('![placeholder.webp](/uploads/content-images/p.webp)')
    expect(md).not.toMatch(/!\\\[/)
    w.unmount()
  })

  it('survives multiple round-trips without compounding escapes', async () => {
    const w = mountEditor([
      { page: 1, title: 'Seite 1', text: '![a.jpg](https://example.com/a.jpg)' }
    ])
    const vm = await readyEditor(w)

    // Three explicit serialize cycles. The schema sits in between, so this
    // exercises the same path the watcher takes when the user types.
    const md1 = vm.editor.storage.markdown.getMarkdown()
    const md2 = vm.editor.storage.markdown.getMarkdown()
    const md3 = vm.editor.storage.markdown.getMarkdown()
    expect(md1).toEqual(md2)
    expect(md2).toEqual(md3)
    expect(md1).not.toMatch(/\\\[/)
    w.unmount()
  })
})

describe('RichTextEditor — image NodeView guards against drag duplication', () => {
  it('emits image-removed when an image is removed from the doc', async () => {
    const w = mountEditor([
      { page: 1, title: 'Seite 1', text: '![remove-me.png](/uploads/content-images/r.png)' }
    ])
    const vm = await readyEditor(w) as unknown as {
      editor: {
        commands: { setContent: (md: string, emitUpdate?: boolean) => boolean }
        storage: { image?: { pendingDeletes?: Set<string> } }
      }
    }
    // Seed the pending-deletes set the way EditorImageNode.onDelete would.
    // Falls through with non-null assertions because the test's prerequisite
    // is that the image extension and its storage exist after a successful
    // mount — if either is missing the test should fail loudly here, not
    // produce a confusing "no events emitted" diagnosis later.
    const imageStorage = vm.editor.storage.image
    expect(imageStorage).toBeDefined()
    expect(imageStorage!.pendingDeletes).toBeInstanceOf(Set)
    imageStorage!.pendingDeletes!.add('/uploads/content-images/r.png')
    // setContent defaults to emitUpdate=false; pass true so the editor's
    // onUpdate runs and drains pendingDeletes the way it would on a real
    // user edit.
    vm.editor.commands.setContent('## Seite 1\n\nplain content', true)
    await flushPromises()

    const events = w.emitted('image-removed') ?? []
    expect(events.length).toBeGreaterThanOrEqual(1)
    expect(events[0]).toEqual(['/uploads/content-images/r.png'])
    w.unmount()
  })
})

// jsdom doesn't ship DataTransfer or a proper DragEvent constructor, and
// faking them precisely isn't worth it — every code path we want to test
// only inspects `dataTransfer.files` + `dataTransfer.types`. So we hand-roll
// a CustomEvent-shaped "drop" with a minimal dataTransfer literal attached.
function makeDropEvent(files: File[]): Event {
  const dt = {
    files,
    types: files.length ? ['Files'] : [],
    dropEffect: 'none',
    effectAllowed: 'all',
    getData: () => '',
    setData: () => undefined,
    clearData: () => undefined
  }
  const event = new Event('drop', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', { value: dt })
  Object.defineProperty(event, 'clientX', { value: 10 })
  Object.defineProperty(event, 'clientY', { value: 10 })
  return event
}

describe('RichTextEditor — drop handling', () => {
  it('ignores drops that have no files (internal drags)', async () => {
    const w = mountEditor([{ page: 1, title: 'Seite 1', text: 'Lorem' }])
    await readyEditor(w)
    const dropZone = w.find('.editor-dropzone')
    expect(dropZone.exists()).toBe(true)

    dropZone.element.dispatchEvent(makeDropEvent([]))
    await flushPromises()

    const { uploadsApi } = await import('@/api/uploads')
    expect(vi.mocked(uploadsApi.image)).not.toHaveBeenCalled()
    w.unmount()
  })

  it('uploads + inserts when an image file is dropped', async () => {
    const w = mountEditor([{ page: 1, title: 'Seite 1', text: 'Lorem' }])
    const vm = await readyEditor(w)

    const dropZone = w.find('.editor-dropzone')
    const file = new File(['x'], 'dropped.png', { type: 'image/png' })
    dropZone.element.dispatchEvent(makeDropEvent([file]))
    await flushPromises()
    await flushPromises()

    const { uploadsApi } = await import('@/api/uploads')
    expect(vi.mocked(uploadsApi.image)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(uploadsApi.image).mock.calls[0]?.[1]).toBe('content')

    // Markdown should now contain the uploaded image alongside the existing
    // text — the prior block must NOT be replaced (regression from the
    // earlier "setImage replaced the block under the caret" bug).
    const md = vm.editor.storage.markdown.getMarkdown()
    expect(md).toContain('Lorem')
    expect(md).toContain('![dropped.png](/uploads/content-images/abc-1.jpg)')
    w.unmount()
  })

  it('rejects non-image file drops without uploading', async () => {
    const w = mountEditor([{ page: 1, title: 'Seite 1', text: 'Lorem' }])
    await readyEditor(w)
    const dropZone = w.find('.editor-dropzone')

    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' })
    dropZone.element.dispatchEvent(makeDropEvent([file]))
    await flushPromises()

    const { uploadsApi } = await import('@/api/uploads')
    expect(vi.mocked(uploadsApi.image)).not.toHaveBeenCalled()
    w.unmount()
  })
})

describe('RichTextEditor — Shift+Ctrl+right-click shortcut', () => {
  it('opens the file picker only when both Shift and Ctrl are held', async () => {
    const w = mountEditor([{ page: 1, title: 'Seite 1', text: 'Lorem' }])
    await readyEditor(w)
    const dropZone = w.find('.editor-dropzone')
    const fileInput = w.find('input[type="file"]').element as HTMLInputElement
    const clickSpy = vi.spyOn(fileInput, 'click').mockImplementation(() => {
      /* don't actually open a picker in jsdom */
    })

    // Plain right-click — must NOT trigger the picker.
    const plain = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    dropZone.element.dispatchEvent(plain)
    expect(clickSpy).not.toHaveBeenCalled()

    // Shift+Ctrl+right-click — picker should open.
    const shortcut = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      shiftKey: true,
      ctrlKey: true,
      clientX: 10,
      clientY: 10
    })
    dropZone.element.dispatchEvent(shortcut)
    expect(clickSpy).toHaveBeenCalledTimes(1)

    w.unmount()
  })
})
