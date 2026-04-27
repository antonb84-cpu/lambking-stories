<template>
  <div class="attachments-editor">
    <!-- Add buttons. Each one spawns an attachment row pre-typed for the
         right kind of upload (image for coloring, PDF for download). -->
    <div class="add-row">
      <XButton label="+ Ausmal-Bild" @click="addColoring" />
      <XButton label="+ PDF zum Download" @click="addDownload" />
    </div>

    <div v-if="modelValue.length" class="attachments-list">
      <div
        v-for="(att, i) in modelValue"
        :key="`att-${i}`"
        class="attachment-card"
      >
        <div class="att-head">
          <span class="att-type" :class="att.type">
            {{ att.type === 'coloring' ? 'Ausmal-Bild' : 'PDF' }}
          </span>
          <button
            type="button"
            class="att-remove"
            aria-label="Anhang entfernen"
            @click="remove(i)"
          >×
          </button>
        </div>
        <div class="att-grid">
          <DropZone
            :label="att.type === 'coloring' ? 'Ausmal-Datei' : 'PDF-Datei'"
            :accept="att.type === 'coloring' ? 'image/webp,image/jpeg,image/png,application/pdf' : 'application/pdf'"
            :kind="dataKind(att)"
            :hint="att.type === 'coloring' ? 'Bild oder PDF · max 25 MB' : '.pdf · max 25 MB'"
            subhint="Pflichtfeld"
            :preview-url="dataPreview(att)"
            :status="dataStatus[i]"
            :on-file="(file) => uploadData(i, file)"
          />
          <DropZone
            label="Vorschau-Bild"
            accept="image/webp,image/jpeg,image/png"
            kind="image"
            hint="1:1 · max 1 MB · optional"
            subhint="Wird auf der Detailseite als Kachel gezeigt"
            :preview-url="att.previewImage || undefined"
            :status="previewStatus[i]"
            :on-file="(file) => uploadPreview(i, file)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import DropZone from '@/components/molecules/DropZone.vue'
import XButton from '@/components/atoms/XButton.vue'
import { uploadsApi } from '@/api/uploads'
import { useToastStore } from '@/stores/toast'
import { ApiClientError } from '@/api/client'
import type { BookAttachment } from '@/types'

const props = defineProps<{ modelValue: BookAttachment[] }>()
const emit = defineEmits<{ 'update:modelValue': [v: BookAttachment[]] }>()

const toast = useToastStore()

type UploadStatus = { ok: boolean; filename?: string; message?: string } | null

// Per-row status maps. Using parallel arrays keyed by index keeps the editor
// re-orderable later without losing UI state, and the indices live alongside
// the attachment index they track.
const dataStatus = ref<UploadStatus[]>([])
const previewStatus = ref<UploadStatus[]>([])

watch(
  () => props.modelValue.length,
  (n) => {
    while (dataStatus.value.length < n) dataStatus.value.push(null)
    while (previewStatus.value.length < n) previewStatus.value.push(null)
    if (dataStatus.value.length > n) dataStatus.value.length = n
    if (previewStatus.value.length > n) previewStatus.value.length = n
  },
  { immediate: true }
)

function commit(next: BookAttachment[]) {
  emit('update:modelValue', next)
}

function addColoring() {
  commit([...props.modelValue, { previewImage: '', data: '', type: 'coloring' }])
  dataStatus.value.push(null)
  previewStatus.value.push(null)
}

function addDownload() {
  commit([...props.modelValue, { previewImage: '', data: '', type: 'download' }])
  dataStatus.value.push(null)
  previewStatus.value.push(null)
}

function remove(i: number) {
  const next = props.modelValue.slice()
  next.splice(i, 1)
  dataStatus.value.splice(i, 1)
  previewStatus.value.splice(i, 1)
  commit(next)
}

function explainErr(err: unknown): string {
  if (err instanceof ApiClientError && err.details?.length) {
    return err.details.map((d) => `${d.field}: ${d.message}`).join(' — ')
  }
  return (err as Error).message || 'Upload fehlgeschlagen'
}

// Coloring attachments support both raster artwork (jpg/png/webp) and PDF
// downloads, since plenty of free coloring sheets on the web ship as PDF.
// We dispatch by MIME at upload time: images go through the image endpoint
// (size-limited, content directory); PDFs go through the attachment endpoint
// (PDF-validated, attachment directory). Download attachments stay PDF-only.
function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
}

async function uploadData(i: number, file: File) {
  const att = props.modelValue[i]
  if (!att) return
  try {
    let url: string
    if (att.type === 'coloring') {
      url = isPdfFile(file)
        ? (await uploadsApi.attachment(file)).url
        : (await uploadsApi.image(file, 'content')).url
    } else {
      url = (await uploadsApi.attachment(file)).url
    }
    const next = props.modelValue.slice()
    next[i] = { ...att, data: url }
    commit(next)
    dataStatus.value[i] = { ok: true, filename: file.name }
  } catch (err) {
    dataStatus.value[i] = { ok: false, message: explainErr(err) }
    toast.error(explainErr(err))
  }
}

// PDF urls can't render as `<img>` previews — DropZone uses the URL extension
// to swap to the PDF icon, so we hand it the right `kind` and skip the
// preview-url for PDFs (the file-icon glyph is more honest than a broken
// thumbnail).
function isPdfUrl(url?: string): boolean {
  return !!url && /\.pdf(?:\?.*)?$/i.test(url)
}

function dataKind(att: BookAttachment): 'image' | 'pdf' {
  if (att.type === 'download') return 'pdf'
  return isPdfUrl(att.data) ? 'pdf' : 'image'
}

function dataPreview(att: BookAttachment): string | undefined {
  if (!att.data) return undefined
  if (att.type === 'coloring' && isPdfUrl(att.data)) return undefined
  if (att.type === 'download') return undefined
  return att.data
}

async function uploadPreview(i: number, file: File) {
  const att = props.modelValue[i]
  if (!att) return
  try {
    const { url } = await uploadsApi.image(file, 'content')
    const next = props.modelValue.slice()
    next[i] = { ...att, previewImage: url }
    commit(next)
    previewStatus.value[i] = { ok: true, filename: file.name }
  } catch (err) {
    previewStatus.value[i] = { ok: false, message: explainErr(err) }
    toast.error(explainErr(err))
  }
}
</script>

<style scoped>
.attachments-editor {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.add-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.attachment-card {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(190, 140, 80, 0.22);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset, 0 6px 16px -10px rgba(120, 90, 50, 0.18);
  padding: 14px;
}

.att-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.att-type {
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 999px;
  color: #fff;
}

.att-type.coloring {
  background: linear-gradient(140deg, #f59e0b 0%, #ea580c 100%);
}

.att-type.download {
  background: linear-gradient(140deg, #5dade2 0%, #2980b9 100%);
}

.att-remove {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: rgba(120, 80, 50, 0.6);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: background 140ms ease, color 140ms ease;
}

.att-remove:hover {
  background: rgba(225, 90, 90, 0.12);
  color: #b83535;
}

.att-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 720px) {
  .att-grid {
    grid-template-columns: 1fr;
  }
}
</style>
