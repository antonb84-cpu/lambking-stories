<template>
  <div class="glass card !p-1 overflow-hidden">
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
        <span class="tool-sep" />
        <button type="button" class="toolbar-btn" @click="insertChapterBreak">📖 Kapitel</button>
        <button type="button" class="toolbar-btn" @click="pickImage">🖼️ Bild</button>
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
    <div v-else class="p-3">
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
import { EditorContent, useEditor } from '@tiptap/vue-3'
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

const props = defineProps<{ modelValue: BookPage[] }>()
const emit = defineEmits<{ 'update:modelValue': [pages: BookPage[]] }>()

const toast = useToastStore()
const markdownMode = ref(false)
const markdown = ref('')
const imgInput = ref<HTMLInputElement | null>(null)

const editor = useEditor({
  extensions: [StarterKit, Image.configure({ inline: false }), CharacterCount, Markdown],
  content: pagesToHtml(props.modelValue),
  onUpdate: ({ editor }) => {
    // `tiptap-markdown` writes hard-break `\` at line ends (CommonMark).
    // Normalising to plain newlines keeps the saved data clean and stops
    // the literal backslash from leaking back into the editor on reload.
    const raw = editor.storage.markdown?.getMarkdown?.() ?? editor.getText()
    const md = cleanMarkdown(raw)
    markdown.value = md
    const pages = detectChapters(md)
    emit('update:modelValue', pages)
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
    editor.value.commands.setContent(pagesToHtml(next))
    markdown.value = pagesToMarkdown(next)
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

// `splitBlock` ends the current paragraph and starts a new one — exposed as
// a button so the toolbar offers "real-book paragraph" as a deliberate
// action alongside lists and emphasis.
const insertParagraph = () => editor.value?.chain().focus().setNode('paragraph').splitBlock().run()

const onMarkdownInput = () => {
  const pages = detectChapters(markdown.value)
  emit('update:modelValue', pages)
}

const insertChapterBreak = () => {
  const pageNumber = (props.modelValue.length ?? 0) + 1
  editor.value?.chain().focus().insertContent(`\n\n## Kapitel ${pageNumber}\n\n`).run()
}

const pickImage = () => imgInput.value?.click()
const onImage = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const { url } = await uploadsApi.image(file, 'content')
    editor.value?.chain().focus().setImage({ src: url, alt: file.name }).run()
    toast.success('Bild hochgeladen')
  } catch (err) {
    toast.error((err as Error).message)
  } finally {
    ;(e.target as HTMLInputElement).value = ''
  }
}

function pagesToHtml(pages: BookPage[]): string {
  if (!pages.length) return ''
  return pages
    .map((p) => {
      const text = cleanMarkdown(p.text)
      return `<h2 data-page="${p.page}">${escapeHtml(p.title)}</h2><p>${escapeHtml(text).replace(/\n/g, '<br/>')}</p>`
    })
    .join('')
}

function pagesToMarkdown(pages: BookPage[]): string {
  return pages.map((p) => `## ${p.title}\n\n${cleanMarkdown(p.text)}`).join('\n\n')
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)
}
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
  font-weight: 600;
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
  font-weight: 600;
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
  max-width: 100%;
  border-radius: 12px;
  margin: 0.5rem 0;
}
</style>
