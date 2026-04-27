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

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [v: string] }>()

const editor = useEditor({
  extensions: [
    // Disable headings — this editor is for short prose + lists only.
    StarterKit.configure({ heading: false }),
    Markdown
  ],
  content: cleanMarkdown(props.modelValue || ''),
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
  }
)

const isBold = computed(() => editor.value?.isActive('bold') ?? false)
const isItalic = computed(() => editor.value?.isActive('italic') ?? false)
const isBulletList = computed(() => editor.value?.isActive('bulletList') ?? false)
const isOrderedList = computed(() => editor.value?.isActive('orderedList') ?? false)

const toggleBold = () => editor.value?.chain().focus().toggleBold().run()
const toggleItalic = () => editor.value?.chain().focus().toggleItalic().run()
const toggleBulletList = () => editor.value?.chain().focus().toggleBulletList().run()
const toggleOrderedList = () => editor.value?.chain().focus().toggleOrderedList().run()

// `splitBlock` ends the current paragraph and starts a new one — same effect
// as pressing Enter, exposed as a button so the editor surfaces "real-book
// paragraph" as a deliberate action rather than a hidden keystroke.
const insertParagraph = () => editor.value?.chain().focus().setNode('paragraph').splitBlock().run()
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
