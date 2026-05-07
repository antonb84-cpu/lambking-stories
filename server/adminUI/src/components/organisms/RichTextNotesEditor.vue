<template>
  <div class="glass card !p-1 overflow-hidden">
    <div class="editor-toolbar">
      <div class="tool-group">
        <button
          type="button"
          class="toolbar-btn"
          :class="{ active: isBold }"
          @click="toggleBold"
        >B
        </button>
        <button
          type="button"
          class="toolbar-btn italic"
          :class="{ active: isItalic }"
          @click="toggleItalic"
        >I
        </button>
        <span class="tool-sep" />
        <button
          type="button"
          class="toolbar-btn"
          title="Neuer Absatz"
          @click="insertParagraph"
        >¶
        </button>
        <span class="tool-sep" />
        <button
          type="button"
          class="toolbar-btn"
          :class="{ active: isBulletList }"
          @click="toggleBulletList"
        >• Liste
        </button>
        <button
          type="button"
          class="toolbar-btn"
          :class="{ active: isOrderedList }"
          @click="toggleOrderedList"
        >1. Liste
        </button>
        <span class="tool-sep" />
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
          data-tooltip="Markierten Text mit <vcenter>…</vcenter> umschließen — der Block wird vertikal in der Seitenmitte zentriert."
          @click="wrapSelectionInVCenter"
        >↕ Mitte
        </button>
        <span class="tool-sep" />
        <FontSizePicker
          :model-value="activeFontSize"
          @apply="applyFontSize"
          @clear="clearFontSize"
        />
      </div>
    </div>
    <div class="p-3">
      <editor-content :editor="editor" class="prose-wrap" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { cleanMarkdown } from '@/utils/markdownToHtml'
import FontSizePicker from '@/components/molecules/FontSizePicker.vue'
import { applyFsMarksFromText, FontSize } from '@/composables/useFontSizeMark'
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [v: string] }>()

const editor = useEditor({
  extensions: [
    // Disable headings — this editor is for short prose + lists only.
    StarterKit.configure({ heading: false }),
    // FontSize mark: per-selection font-size override that round-trips
    // through markdown as `<fs size="N">…</fs>` literal text.
    FontSize,
    // `html: false` keeps `<center>…</center>` (and other HTML the admin
    // types) as plain text on parse, so the round-trip preserves the tags
    // for the downstream markdownToHtml renderer.
    Markdown.configure({ html: false })
  ],
  content: cleanMarkdown(props.modelValue || ''),
  onCreate: ({ editor }) => applyFsMarksFromText(editor as any),
  onUpdate: ({ editor }) => {
    // Strip CommonMark hard-break backslashes so the saved markdown stays
    // clean and never re-renders as a literal "\" on reload.
    const raw = editor.storage.markdown?.getMarkdown?.() ?? editor.getText()
    emit('update:modelValue', cleanMarkdown(raw))
  }
})

onBeforeUnmount(() => editor.value?.destroy())

watch(
  () => props.modelValue,
  (next) => {
    if (!editor.value) return
    const incoming = cleanMarkdown(next ?? '')
    const cur = cleanMarkdown(editor.value.storage.markdown?.getMarkdown?.() ?? '')
    if (cur === incoming) return
    editor.value.commands.setContent(incoming)
    applyFsMarksFromText(editor.value)
  }
)

const isBold = computed(() => editor.value?.isActive('bold') ?? false)
const isItalic = computed(() => editor.value?.isActive('italic') ?? false)
const isBulletList = computed(() => editor.value?.isActive('bulletList') ?? false)
const isOrderedList = computed(() => editor.value?.isActive('orderedList') ?? false)

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
  editor.value?.chain().focus().unsetFontSize().run()
}

const toggleBold = () => editor.value?.chain().focus().toggleBold().run()
const toggleItalic = () => editor.value?.chain().focus().toggleItalic().run()
const toggleBulletList = () => editor.value?.chain().focus().toggleBulletList().run()
const toggleOrderedList = () => editor.value?.chain().focus().toggleOrderedList().run()

// `splitBlock` ends the current paragraph and starts a new one — same effect
// as pressing Enter, exposed as a button so the editor surfaces "real-book
// paragraph" as a deliberate action rather than a hidden keystroke.
const insertParagraph = () => editor.value?.chain().focus().setNode('paragraph').splitBlock().run()

// Wrap the current selection in `<center>…</center>` / `<vcenter>…</vcenter>`
// tags. Same block-aware strategy as the page-content RichTextEditor —
// see the comment there. Single-block selections wrap inline; multi-block
// selections insert the tags as their own paragraphs around the
// selection so the inner block structure (paragraphs, lists) survives.
const wrapSelectionWithTag = (tag: 'center' | 'vcenter') => {
  const e = editor.value
  if (!e) return
  const { from, to, empty } = e.state.selection
  if (empty) return

  const $from = e.state.doc.resolve(from)
  const $to = e.state.doc.resolve(to)

  if ($from.sameParent($to)) {
    e.chain()
      .focus()
      .insertContentAt(to, [{ type: 'text', text: `</${tag}>` }])
      .insertContentAt(from, [{ type: 'text', text: `<${tag}>` }])
      .run()
    return
  }

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
</script>

<style scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.42);
}

.tool-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
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
  font-weight: 600;
  color: #44403c;
  background: transparent;
  transition: background 140ms ease, color 140ms ease;
}

.toolbar-btn.italic {
  font-style: italic;
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

.prose-wrap :deep(.ProseMirror) {
  min-height: 140px;
  outline: none;
}

/* Real-book-style paragraph spacing: a small top margin between paragraphs
 * gives the visual breath the user asked for, without shouting like a
 * heading. Lists keep tight spacing so they read as a single unit. */
.prose-wrap :deep(.ProseMirror p) {
  margin: 0.45em 0 0;
}

.prose-wrap :deep(.ProseMirror p:first-child) {
  margin-top: 0;
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

.prose-wrap :deep(.ProseMirror strong) {
  font-weight: 700;
}

.prose-wrap :deep(.ProseMirror em) {
  font-style: italic;
}
</style>
