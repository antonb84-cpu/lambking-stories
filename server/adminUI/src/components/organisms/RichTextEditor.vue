<template>
  <div class="glass card !p-1" :class="{ 'is-drop-active': isDropActive }">
    <div class="editor-toolbar">
      <div class="tool-group">
        <button type="button" class="toolbar-btn" :class="{ active: isBold }"
                @click="editor?.chain().focus().toggleBold().run()">B
        </button>
        <button type="button" class="toolbar-btn italic" :class="{ active: isItalic }"
                @click="editor?.chain().focus().toggleItalic().run()">I
        </button>
        <span class="tool-sep" />
        <button type="button" class="toolbar-btn" title="Neuer Absatz" @click="insertParagraph">¶</button>
        <button type="button" class="toolbar-btn" :class="{ active: isBulletList }"
                @click="editor?.chain().focus().toggleBulletList().run()">• Liste
        </button>
        <button type="button" class="toolbar-btn" :class="{ active: isOrderedList }"
                @click="editor?.chain().focus().toggleOrderedList().run()">1. Liste
        </button>
        <span class="tool-sep" />
        <button type="button" class="toolbar-btn" :class="{ active: isH1 }"
                @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()">H1
        </button>
        <button type="button" class="toolbar-btn" :class="{ active: isH2 }"
                @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()">H2
        </button>
        <button
          type="button"
          class="toolbar-btn has-tooltip tooltip-below"
          data-tooltip="Markierten Text mit <center>…</center> umschließen — wird im iPhone-Previewer und im BookReader horizontal zentriert dargestellt. Markiere zuerst Text, dann klicken."
          @click="wrapSelectionInCenter"
        >⌳ Mitte
        </button>
        <button
          type="button"
          class="toolbar-btn has-tooltip tooltip-below"
          data-tooltip="Markierten Text mit <vcenter>…</vcenter> umschließen — der Block wird im iPhone-Previewer und im BookReader vertikal in der Seitenmitte zentriert. Markiere zuerst Text, dann klicken."
          @click="wrapSelectionInVCenter"
        >↕ Mitte
        </button>
        <button
          type="button"
          class="toolbar-btn has-tooltip tooltip-below"
          data-tooltip="Aktuelle Seite vollständig vertikal zentrieren — wickelt den gesamten Inhalt der Seite, in der der Cursor steht, in einen <vcenter>-Block."
          @click="wrapCurrentPageInVCenter"
        >↕ Seite
        </button>
        <span class="tool-sep" />
        <FontSizePicker
          :model-value="activeFontSize"
          @apply="applyFontSize"
          @clear="clearFontSize"
        />
        <span class="tool-sep" />
        <button
          type="button"
          class="toolbar-btn has-tooltip tooltip-below"
          data-tooltip='Neue Seite einfügen — oder im Text "## Titel" (Seite mit Titel) bzw. "##" (leere neue Seite) am Zeilenanfang schreiben'
          @click="insertChapterBreak"
        >📖 Kapitel
        </button>
        <button
          type="button"
          class="toolbar-btn has-tooltip tooltip-below"
          data-tooltip="Bild einfügen — oder Shift+Strg+Rechtsklick im Editor (Bild landet an der Cursorposition) · Drag&Drop vom Datei-Explorer in den Editor funktioniert auch"
          @click="pickImage"
        >🖼️ Bild
        </button>
        <input ref="imgInput" type="file" accept="image/webp,image/jpeg,image/png" class="editor-file-input"
               @change="onImage" />
      </div>
      <div class="tool-spacer" />
      <!--      <label class="markdown-toggle" :class="{ active: markdownMode }">-->
      <!--        <span class="md-label">Markdown</span>-->
      <!--        <XSwitch v-model="markdownMode" />-->
      <!--      </label>-->
    </div>

    <div v-if="markdownMode" class="p-3">
      <textarea
        v-model="markdown"
        class="glass w-full min-h-[260px] font-mono text-sm"
        @input="onMarkdownInput"
      />
    </div>
    <div
      v-else
      class="p-3 editor-dropzone"
      @dragenter.prevent="onEditorDragEnter"
      @dragover.prevent="onEditorDragOver"
      @dragleave.prevent="onEditorDragLeave"
      @drop.prevent="onEditorDrop"
      @contextmenu="onEditorContextMenu"
    >
      <editor-content :editor="editor" class="prose-wrap" />
    </div>

    <div class="editor-footer">
      <span class="stat-pill">
        <FileText class="w-3.5 h-3.5 opacity-70" />
        <strong>{{ pageCount }}</strong>
        <span>{{ pageCount === 1 ? 'Seite' : 'Seiten' }} erkannt</span>
      </span>
      <span class="stat-pill">
        <Type class="w-3.5 h-3.5 opacity-70" />
        <strong>{{ characters }}</strong>
        <span>Zeichen</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { EditorContent, useEditor, VueNodeViewRenderer } from '@tiptap/vue-3'
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import CharacterCount from '@tiptap/extension-character-count'
import { Markdown } from 'tiptap-markdown'
import XSwitch from '@/components/atoms/XSwitch.vue'
import { FileText, Type } from 'lucide-vue-next'
import { detectChapters } from '@/composables/useChapterDetector'
import { uploadsApi } from '@/api/uploads'
import { useToastStore } from '@/stores/toast'
import { cleanMarkdown } from '@/utils/markdownToHtml'
import type { BookPage } from '@/types'
import EditorImageNode from './EditorImageNode.vue'
import FontSizePicker from '@/components/molecules/FontSizePicker.vue'
import { applyFsMarksFromText, FontSize } from '@/composables/useFontSizeMark'

const props = defineProps<{ modelValue: BookPage[] }>()
const emit = defineEmits<{
  'update:modelValue': [pages: BookPage[]]
  'image-removed': [url: string]
}>()

const toast = useToastStore()
const markdownMode = ref(false)
const markdown = ref('')
const imgInput = ref<HTMLInputElement | null>(null)
const isDropActive = ref(false)

// `pendingDeleteAtCaret` toggles the next file-pick between insert-at-cursor
// (Shift+Ctrl+right-click) vs the toolbar button's normal "insert wherever
// the editor currently has focus" behaviour. The position is captured from
// the `contextmenu` event so a long upload doesn't lose the original click
// location even if the user moves the mouse.
const insertAtPos = ref<number | null>(null)

// Custom image NodeView with a 300px-capped preview and a hover-trash button
// that records the URL for server-side cleanup on save.
//
// IMPORTANT: tiptap-markdown's MarkdownSerializer reads `extensionStorage.image
// .markdown.serialize` to know how to write an image as `![alt](url)`. By
// extending Image we replace the storage entirely, so we must put the
// serializer back on or every save round-trip would re-escape `[` and `]`
// (one extra `\` per cycle, compounding across inserts).
//
// `draggable: false` on the schema (combined with `draggable="false"` on the
// NodeView wrapper) disables ProseMirror's drag plugin for this node, which
// previously raced with the browser's native HTML5 drag of `<img>` and
// produced spurious duplicate inserts on internal reordering attempts.
const ImagePreview = Image.extend({
  name: 'image',
  draggable: false,
  addStorage() {
    return {
      pendingDeletes: new Set<string>(),
      markdown: {
        serialize(state: any, node: any) {
          const alt = String(node.attrs.alt ?? '')
          const src = String(node.attrs.src ?? '')
          // `state.esc` is correct for the alt/src text — escapes only what
          // markdown-it requires inside `![...](...)`. Block images need a
          // `closeBlock` so the next paragraph starts on its own line.
          state.write(`![${state.esc(alt)}](${state.esc(src)})`)
          state.closeBlock(node)
        },
        parse: {}
      }
    }
  },
  addNodeView() {
    return VueNodeViewRenderer(EditorImageNode)
  }
}).configure({ inline: false })

// Splitting an h2 (chapter break) mid-line would otherwise leave both halves
// as h2 — and detectChapters would then read the second half as a brand-new
// page. Demoting the lower half to h1 keeps it inside the same page as a
// regular header title. End-of-line Enter is left to ProseMirror's default
// (which already inserts a paragraph below).
const ChapterHeadingSplit = Extension.create({
  name: 'chapterHeadingSplit',
  priority: 1000,
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { $from, empty } = this.editor.state.selection
        if (!empty) return false
        if ($from.parent.type.name !== 'heading') return false
        if ($from.parent.attrs.level !== 2) return false
        if ($from.parentOffset === $from.parent.content.size) return false
        return this.editor.chain().splitBlock().setNode('heading', { level: 1 }).run()
      }
    }
  }
})

const editor = useEditor({
  // `Markdown.configure({ html: false })`: keep `<center>…</center>` (and any
  // other HTML the admin types) as plain text instead of letting markdown-it
  // parse it as raw HTML. The text round-trips unchanged through
  // prosemirror-markdown's serializer (it doesn't escape `<`/`>`), so the
  // saved markdown contains literal `<center>` tags. The downstream
  // `markdownToHtml` post-process turns them into centered spans for the
  // iPhone preview + BookReader.
  extensions: [StarterKit, ImagePreview, CharacterCount, FontSize, Markdown.configure({ html: false }), ChapterHeadingSplit],
  // Seed the editor with markdown, not HTML — tiptap-markdown's setContent
  // override parses string input through markdown-it so `![alt](url)` lands
  // as a real Image node. The previous HTML-wrapped form turned every
  // image into a literal text node on reload.
  content: pagesToMarkdown(props.modelValue),
  editorProps: {
    handleDrop: () => {
      // Files are handled by the wrapper's @drop listener (which has access
      // to the upload API + caret position). Returning true here prevents
      // ProseMirror from treating an image file drop as a no-op insertion.
      return false
    }
  },
  // Initial markdown lands in the editor with literal `<fs size="N">…</fs>`
  // text (markdown-it can't parse our custom tag with `html: false`); the
  // post-process converts each occurrence into a real fontSize mark so the
  // styling shows up in the editor immediately.
  onCreate: ({ editor }) => applyFsMarksFromText(editor as any),
  onUpdate: ({ editor }) => {
    // `tiptap-markdown` writes hard-break `\` at line ends (CommonMark).
    // Normalising to plain newlines keeps the saved data clean and stops
    // the literal backslash from leaking back into the editor on reload.
    const raw = editor.storage.markdown?.getMarkdown?.() ?? editor.getText()
    const md = cleanMarkdown(raw)
    markdown.value = md
    const pages = detectChapters(md)
    emit('update:modelValue', pages)
    // Drain any pending image deletions captured by EditorImageNode and
    // bubble them up so the BookForm can dispatch server-side cleanups
    // after a successful save.
    const storage = editor.storage.image as { pendingDeletes?: Set<string> } | undefined
    if (storage?.pendingDeletes && storage.pendingDeletes.size) {
      for (const url of storage.pendingDeletes) emit('image-removed', url)
      storage.pendingDeletes.clear()
    }
  }
})

onBeforeUnmount(() => editor.value?.destroy())

watch(
  () => props.modelValue,
  (next) => {
    if (!editor.value) return
    const md = editor.value.storage.markdown?.getMarkdown?.() ?? ''
    const detected = detectChapters(md)
    if (JSON.stringify(detected) === JSON.stringify(next)) return
    if (!next.length) {
      editor.value.commands.setContent('')
      markdown.value = ''
      return
    }
    // Use the markdown form for the round-trip so images stay as real Image
    // nodes. Wrapping in HTML (`<p>![alt](url)</p>`) re-enters the editor as
    // a plain text node and the next serialize escapes the brackets, causing
    // each save cycle to add another backslash to every prior image.
    const nextMd = pagesToMarkdown(next)
    editor.value.commands.setContent(nextMd)
    applyFsMarksFromText(editor.value)
    markdown.value = nextMd
  }
)

const isBold = computed(() => editor.value?.isActive('bold') ?? false)
const isItalic = computed(() => editor.value?.isActive('italic') ?? false)
const isH1 = computed(() => editor.value?.isActive('heading', { level: 1 }) ?? false)
const isH2 = computed(() => editor.value?.isActive('heading', { level: 2 }) ?? false)
const isBulletList = computed(() => editor.value?.isActive('bulletList') ?? false)
const isOrderedList = computed(() => editor.value?.isActive('orderedList') ?? false)
const characters = computed(() => editor.value?.storage.characterCount?.characters() ?? 0)
const pageCount = computed(() => props.modelValue.length)

// Font-size of the current selection. Returns null when the mark is absent
// or when the selection straddles different sizes (TipTap reports the
// mark as inactive in that case, which is the right "mixed" affordance).
const activeFontSize = computed<number | null>(() => {
  const e = editor.value
  if (!e) return null
  const attrs = e.getAttributes('fontSize')
  const n = Number(attrs?.size)
  return Number.isFinite(n) && n > 0 ? n : null
})

function applyFontSize(size: number) {
  const e = editor.value
  if (!e) return
  if (e.state.selection.empty) {
    toast.error('Bitte zuerst Text markieren, dessen Größe geändert werden soll.')
    return
  }
  e.chain().focus().setFontSize(size).run()
}

function clearFontSize() {
  const e = editor.value
  if (!e) return
  e.chain().focus().unsetFontSize().run()
}

// `splitBlock` ends the current paragraph and starts a new one — exposed as
// a button so the toolbar offers "real-book paragraph" as a deliberate
// action alongside lists and emphasis.
const insertParagraph = () => editor.value?.chain().focus().setNode('paragraph').splitBlock().run()

const onMarkdownInput = () => {
  const pages = detectChapters(markdown.value)
  emit('update:modelValue', pages)
}

const insertChapterBreak = () => {
  const e = editor.value
  if (!e) return
  const pageNumber = (props.modelValue.length ?? 0) + 1
  // Append a real H2 heading + empty paragraph at the END of the document
  // (rather than inserting a markdown string at the cursor — `insertContent`
  // doesn't parse markdown, so the previous code inserted literal text
  // `## Kapitel N` that only became a heading after the next save round-
  // trip, leaving the editor visually broken in between).
  const docEnd = e.state.doc.content.size
  e.chain()
    .focus()
    .setTextSelection(docEnd)
    .insertContent([
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: `Kapitel ${pageNumber}` }]
      },
      { type: 'paragraph' }
    ])
    .run()
}

// Wrap the current selection in `<center>…</center>` tags that survive
// the prosemirror-markdown round-trip (default text escape doesn't touch
// `<` / `>`) and that `markdownToHtml` rewrites into either a block-level
// `<div class="rt-center">` (when the tags sit on their own lines) or an
// inline `<span class="rt-center">` (when they're glued to a heading
// line). The wrap strategy switches on whether the selection spans
// multiple top-level blocks:
//
//   - Single block (selection lives inside one paragraph/heading): insert
//     the tags inline at `from` / `to`, preserving the inner text.
//   - Multiple blocks (e.g. two headings selected together): insert the
//     opening tag in its OWN paragraph immediately before the first
//     selected block and the closing tag in its OWN paragraph
//     immediately after the last selected block. The selected headings /
//     paragraphs in between stay as-is so their block structure (and
//     therefore their `# `/`## ` markdown prefixes) survives the round-
//     trip — the previous flatten-to-text approach merged them into one
//     paragraph, which destroyed all heading information.
const wrapSelectionWithTag = (tag: 'center' | 'vcenter') => {
  const e = editor.value
  if (!e) return
  const { from, to, empty } = e.state.selection
  if (empty) {
    toast.error(
      tag === 'vcenter'
        ? 'Bitte zuerst Text markieren, der vertikal zentriert werden soll.'
        : 'Bitte zuerst Text markieren, der zentriert werden soll.'
    )
    return
  }

  const $from = e.state.doc.resolve(from)
  const $to = e.state.doc.resolve(to)

  // Heuristic: the selection is "single-block" when both endpoints share
  // the same parent node (so they live in the same paragraph / heading /
  // list item). Anything else is multi-block and gets the line-aligned
  // wrapper so block structure survives.
  const sameParent = $from.sameParent($to)

  if (sameParent) {
    // Insert closing tag first (at the higher position) so the lower
    // `from` index isn't shifted before the second insert.
    e.chain()
      .focus()
      .insertContentAt(to, [{ type: 'text', text: `</${tag}>` }])
      .insertContentAt(from, [{ type: 'text', text: `<${tag}>` }])
      .run()
    return
  }

  // Multi-block: anchor the wrappers to the boundaries of the topmost
  // block that contains each endpoint. `before(1)` / `after(1)` resolve
  // to positions in the doc just outside those blocks, which is where a
  // freshly-inserted paragraph slots in cleanly.
  const blockStart = $from.before(1)
  const blockEnd = $to.after(1)

  e.chain()
    .focus()
    .insertContentAt(blockEnd, [
      { type: 'paragraph', content: [{ type: 'text', text: `</${tag}>` }] }
    ])
    .insertContentAt(blockStart, [
      { type: 'paragraph', content: [{ type: 'text', text: `<${tag}>` }] }
    ])
    .run()
}

const wrapSelectionInCenter = () => wrapSelectionWithTag('center')
const wrapSelectionInVCenter = () => wrapSelectionWithTag('vcenter')

// Wrap the page (delimited by `## …` headings, just like `detectChapters`)
// where the cursor sits in `<vcenter>…</vcenter>`. Operates on the editor's
// markdown serialisation so we can locate the chapter boundaries in
// markdown space, slice them apart, and rebuild the document with the page
// fully wrapped.
const wrapCurrentPageInVCenter = () => {
  const e = editor.value
  if (!e) return
  const md = e.storage.markdown?.getMarkdown?.() as string | undefined
  if (typeof md !== 'string' || !md.length) {
    toast.error('Die Seite ist leer — bitte zuerst Inhalt einfügen.')
    return
  }
  // Caret position in markdown space ≈ caret position in textContent. We
  // look up the current page by walking the heading lines (`## …`) and
  // matching the heading whose body contains the caret-equivalent offset.
  const caretText = e.state.doc.textBetween(0, e.state.selection.from, '\n', ' ')
  const lines = md.split('\n')
  const pageStartLines: number[] = []
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i] ?? '')) pageStartLines.push(i)
  }
  if (!pageStartLines.length) {
    // No chapter splits — wrap the whole document.
    if (md.includes('<vcenter>')) {
      toast.info('Seite ist bereits vertikal zentriert.')
      return
    }
    e.chain().focus().setContent(`<vcenter>\n${md}\n</vcenter>`).run()
    applyFsMarksFromText(e)
    return
  }
  // Find the page index that contains the caret. We approximate by counting
  // characters in each lines[i] — same line-by-line walk the renderer uses.
  let charCount = 0
  let activePageIdx = 0
  for (let i = 0; i < lines.length; i++) {
    const lineLen = (lines[i]?.length ?? 0) + 1
    if (caretText.length <= charCount + lineLen) {
      // caret sits in line i — find which page bracket it belongs to
      activePageIdx = pageStartLines.findIndex((s, k) => {
        const next = pageStartLines[k + 1] ?? Infinity
        return s <= i && i < next
      })
      if (activePageIdx === -1) activePageIdx = pageStartLines.length - 1
      break
    }
    charCount += lineLen
  }
  const startLine = pageStartLines[activePageIdx]!
  const endLine = pageStartLines[activePageIdx + 1] ?? lines.length
  const pageLines = lines.slice(startLine, endLine)
  if (pageLines.some((l) => l.includes('<vcenter>'))) {
    toast.error('Seite ist bereits vertikal zentriert.')
    return
  }
  // Wrap everything after the heading (line 0 of the slice) in vcenter so
  // the chapter title still flows above the centered block, mirroring the
  // BookReader's title + body separation.
  const heading = pageLines[0]!
  const bodyLines = pageLines.slice(1).join('\n').replace(/^\n+|\n+$/g, '')
  const wrapped = `${heading}\n\n<vcenter>\n${bodyLines}\n</vcenter>`
  const before = lines.slice(0, startLine).join('\n')
  const after = lines.slice(endLine).join('\n')
  const next = [before, wrapped, after].filter((s) => s.length).join('\n\n')
  e.chain().focus().setContent(next).run()
  applyFsMarksFromText(e)
}

const pickImage = () => {
  insertAtPos.value = null
  imgInput.value?.click()
}

// Insert position helper — `setImage` would replace the block under the
// caret (chapter heading, prior image, etc.), so we always anchor the new
// image to the position immediately *after* whichever top-level block the
// caret/drop landed in. That way the image lands on its own fresh line and
// we never destroy existing content.
function insertAfterBlock(targetPos: number): number {
  const e = editor.value
  if (!e) return 0
  const docSize = e.state.doc.content.size
  const safePos = Math.min(Math.max(0, targetPos), docSize)
  const $pos = e.state.doc.resolve(safePos)
  if ($pos.depth < 1) return docSize
  return $pos.after(1)
}

async function uploadAndInsert(file: File, posOverride: number | null) {
  try {
    const { url } = await uploadsApi.image(file, 'content')
    const e = editor.value
    if (!e) return
    const targetPos = posOverride != null ? posOverride : e.state.selection.from
    const insertPos = insertAfterBlock(targetPos)
    e.chain()
      .focus()
      .insertContentAt(insertPos, [
        { type: 'image', attrs: { src: url, alt: file.name } }
      ])
      .run()
    toast.success('Bild hochgeladen')
  } catch (err) {
    toast.error((err as Error).message)
  }
}

const onImage = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  const pos = insertAtPos.value
  insertAtPos.value = null
  input.value = ''
  if (!file) return
  await uploadAndInsert(file, pos)
}

function posFromEvent(e: { clientX: number; clientY: number }): number | null {
  const view = editor.value?.view
  if (!view) return null
  // posAtCoords relies on document.elementFromPoint which is missing under
  // some test environments (jsdom). Defensive try/catch keeps the shortcut
  // and drop handlers usable even when coordinate lookup fails — we just
  // fall through to the editor's current selection.
  try {
    const coords = view.posAtCoords({ left: e.clientX, top: e.clientY })
    return coords?.pos ?? null
  } catch {
    return null
  }
}

function onEditorContextMenu(e: MouseEvent) {
  // Shift+Ctrl+right-click → insert image at the click point.
  if (!(e.shiftKey && e.ctrlKey)) return
  e.preventDefault()
  insertAtPos.value = posFromEvent(e)
  imgInput.value?.click()
}

let dragLeaveTimer: ReturnType<typeof setTimeout> | null = null

function hasFiles(e: DragEvent): boolean {
  const types = e.dataTransfer?.types
  if (!types) return false
  for (let i = 0; i < types.length; i++) if (types[i] === 'Files') return true
  return false
}

function onEditorDragEnter(e: DragEvent) {
  if (!hasFiles(e)) return
  if (dragLeaveTimer) {
    clearTimeout(dragLeaveTimer)
    dragLeaveTimer = null
  }
  isDropActive.value = true
}

function onEditorDragOver(e: DragEvent) {
  if (!hasFiles(e)) return
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
  isDropActive.value = true
}

function onEditorDragLeave() {
  // Leaves fire when crossing internal boundaries — debounce so the glow
  // doesn't flicker as the cursor moves between child nodes.
  if (dragLeaveTimer) clearTimeout(dragLeaveTimer)
  dragLeaveTimer = setTimeout(() => {
    isDropActive.value = false
    dragLeaveTimer = null
  }, 80)
}

async function onEditorDrop(e: DragEvent) {
  isDropActive.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast.error('Nur Bilder können in den Editor gezogen werden.')
    return
  }
  const pos = posFromEvent(e)
  await uploadAndInsert(file, pos)
}

function pagesToMarkdown(pages: BookPage[]): string {
  return pages.map((p) => `## ${p.title}\n\n${cleanMarkdown(p.text)}`).join('\n\n')
}
</script>

<style scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.85);
  /* Pin the toolbar to the top of the viewport while the page editor
   * scrolls past, so formatting buttons stay one click away even on
   * very long page bodies. `z-index: 5` keeps the toolbar above the
   * editor content but below the global server-banner (z-index: 50). */
  position: sticky;
  top: 0;
  z-index: 5;
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 6px 14px -10px rgba(20, 60, 100, 0.25);
}

.tool-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.tool-spacer {
  flex: 1;
}

.tool-sep {
  width: 1px;
  height: 18px;
  background: rgba(140, 110, 80, 0.25);
  margin: 0 4px;
}

.toolbar-btn {
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #44403c;
  background: transparent;
  transition: background 140ms ease, color 140ms ease;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.75);
  color: #1c1917;
}

.toolbar-btn.active {
  background: linear-gradient(140deg, #5dade2 0%, #2980b9 100%);
  color: #fff;
  box-shadow: 0 4px 10px -4px rgba(41, 128, 185, 0.55);
}

.markdown-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 2px 4px 2px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(52, 152, 219, 0.25);
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease;
  margin-left: auto;
}

.markdown-toggle:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(52, 152, 219, 0.5);
}

.markdown-toggle.active {
  background: rgba(52, 152, 219, 0.12);
  border-color: rgba(52, 152, 219, 0.55);
}

.markdown-toggle .md-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #2471a3;
}

/* Trim the XSwitch glass chrome inside the pill */
.markdown-toggle :deep(.glass.switch) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 4px 0 !important;
}

.editor-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
  opacity: 0;
  pointer-events: none;
}

.editor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.32);
}

.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(52, 152, 219, 0.2);
  font-size: 11.5px;
  color: #4b5f75;
  line-height: 1;
}

.stat-pill strong {
  font-weight: 700;
  color: #2471a3;
}

.prose-wrap :deep(.ProseMirror) {
  min-height: 240px;
  outline: none;
}

.prose-wrap :deep(.ProseMirror h1) {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0.5rem 0;
}

.prose-wrap :deep(.ProseMirror h2) {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
}

.prose-wrap :deep(.ProseMirror h2::before) {
  content: '📖';
  position: absolute;
  left: 0;
  top: 0;
}

.prose-wrap :deep(.ProseMirror p) {
  margin: 0.25rem 0;
}

.prose-wrap :deep(.ProseMirror ul),
.prose-wrap :deep(.ProseMirror ol) {
  padding-left: 1.4em;
  margin: 0.4em 0;
}

.prose-wrap :deep(.ProseMirror ul) {
  list-style: disc;
}

.prose-wrap :deep(.ProseMirror ol) {
  list-style: decimal;
}

.prose-wrap :deep(.ProseMirror li) {
  margin: 0.15em 0;
}

.prose-wrap :deep(.ProseMirror li > p) {
  margin: 0;
}

.prose-wrap :deep(.ProseMirror img) {
  max-width: 200px;
  max-height: 200px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 12px;
  margin: 0.5rem 0;
}

/* Highlight the editor body when a file is dragged over it so the user
 * knows the entire editor is a valid drop zone. The glow scales with the
 * editor border-radius so it matches the glass card chrome. */
.editor-dropzone {
  position: relative;
  transition: box-shadow 160ms ease, background 160ms ease;
  border-radius: 14px;
}

.is-drop-active .editor-dropzone {
  background: rgba(214, 234, 248, 0.55);
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.55) inset,
  0 0 18px 4px rgba(93, 173, 226, 0.45),
  0 0 32px 6px rgba(52, 152, 219, 0.35);
  animation: editor-drop-glow 1.6s ease-in-out infinite;
}

@keyframes editor-drop-glow {
  0%, 100% {
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.55) inset,
    0 0 18px 4px rgba(93, 173, 226, 0.45),
    0 0 32px 6px rgba(52, 152, 219, 0.35);
  }
  50% {
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.75) inset,
    0 0 22px 6px rgba(93, 173, 226, 0.6),
    0 0 38px 10px rgba(52, 152, 219, 0.45);
  }
}
</style>
