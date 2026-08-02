<template>
  <div class="taxonomy-section">
    <div class="tax-head">
      <h3 class="tax-title">Buchreihen</h3>
      <span
        class="count-badge has-tooltip"
        :data-tooltip="`Anzahl angelegter Buchreihen — derzeit ${store.items.length}`"
        tabindex="0"
      >{{ store.items.length }}</span>
    </div>
    <div class="flex items-stretch gap-1">
      <input
        v-model="name"
        class="glass flex-1 basis-[33%] mr-2"
        placeholder='Reihenname (z. B. „Fruit Agents")'
        @keydown.enter.prevent="add"
      />
      <input
        v-model="prefix"
        class="glass basis-[33%] w-16 text-center"
        placeholder="fa"
        maxlength="2"
      />
      <XButton class="basis-[33%]" label="Hinzufügen" :disabled="busy || !name.trim()" @click="add" />
    </div>

    <div v-if="store.items.length" class="mt-4 flex flex-wrap gap-2">
      <span
        v-for="s in store.items"
        :key="s.seriesId"
        class="tax-chip"
      >
        <span class="chip-prefix">{{ s.prefix }}</span>
        <!--
          Display position. Lower sorts first, both here and on the app's
          Serien page. Picking a number moves this series to that slot and
          the server renumbers the rest, so the options are always the
          contiguous run 1…n with no gaps to reason about.
        -->
        <select
          class="chip-order has-tooltip"
          :class="{ 'is-busy': orderBusyMap[s.seriesId] }"
          :value="positionOf(s)"
          :disabled="orderBusyMap[s.seriesId]"
          :data-tooltip="`Reihenfolge — ${positionOf(s)} von ${store.items.length}. Kleinere Zahl erscheint weiter oben.`"
          :aria-label="`Reihenfolge von ${s.name}`"
          @click.stop
          @change="onOrderChange($event, s)"
        >
          <option v-for="n in store.items.length" :key="n" :value="n">{{ n }}</option>
        </select>
        <!--
          Minimal cover dropzone — accepts image drops or click-to-pick.
          Empty state shows a tiny placeholder thumb; once a coverImage is
          present the thumb is replaced with the uploaded preview and a
          green border. On upload failure the border flashes red and then
          decays back to the default state.
        -->
        <label
          class="chip-cover has-tooltip"
          :class="coverClassFor(s)"
          :data-tooltip="s.coverImage ? 'Cover-Bild ersetzen (Drop oder Klick)' : 'Cover-Bild hochladen (Drop oder Klick)'"
          @dragover.prevent
          @dragenter.prevent="onDragEnter(s.seriesId)"
          @dragleave="onDragLeave(s.seriesId)"
          @drop.prevent="onDrop($event, s.seriesId)"
        >
          <input
            type="file"
            accept="image/*"
            class="chip-cover-input"
            @change="onFileInput($event, s.seriesId)"
          />
          <img
            v-if="s.coverImage"
            :src="s.coverImage"
            class="chip-cover-img"
            alt=""
          />
          <span v-else class="chip-cover-placeholder" aria-hidden="true">+</span>
        </label>
        <span class="chip-name">{{ s.name }}</span>
        <span
          class="chip-count has-tooltip"
          :data-tooltip="`${countFor(s.seriesId)} Buch/Bücher in dieser Reihe`"
          tabindex="0"
        >{{ countFor(s.seriesId) }}</span>
        <button
          class="chip-remove has-tooltip"
          data-tooltip="ALT + Rechtsklick zum PERMANENTEN Löschen (ich hoffe du weißt was du tust!!!)"
          @click.prevent
          @contextmenu.prevent="onRemoveContext($event, s.seriesId)"
          aria-label="Löschen mit ALT + Rechtsklick"
        >×</button>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import XButton from '@/components/atoms/XButton.vue'
import { useSeriesStore } from '@/stores/series'
import { useToastStore } from '@/stores/toast'
import { ApiClientError } from '@/api/client'
import type { BookDTO, SeriesDTO } from '@/types'

const props = defineProps<{ books?: BookDTO[] }>()

const store = useSeriesStore()
const toast = useToastStore()

const name = ref('')
const prefix = ref('')
const busy = ref(false)

// Pre-bucket the book list by seriesId once per books-array change so the
// per-chip count lookup stays O(1) even with hundreds of books.
const countBySeries = computed<Record<string, number>>(() => {
  const out: Record<string, number> = {}
  for (const b of props.books ?? []) {
    const id = b.bookSeriesId
    if (!id) continue
    out[id] = (out[id] ?? 0) + 1
  }
  return out
})

function countFor(seriesId: string): number {
  return countBySeries.value[seriesId] ?? 0
}

const add = async () => {
  if (!name.value.trim()) return
  busy.value = true
  try {
    const created = await store.add(name.value.trim(), prefix.value || undefined)
    toast.success(`Reihe „${created.name}" angelegt (Prefix: ${created.prefix})`)
    name.value = ''
    prefix.value = ''
  } catch (err) {
    if (err instanceof ApiClientError && err.details?.length) {
      toast.error(err.details.map((d) => `${d.field}: ${d.message}`).join(' — '), 'Konflikt')
    } else {
      toast.error((err as Error).message)
    }
  } finally {
    busy.value = false
  }
}

const remove = async (id: string) => {
  try {
    await store.remove(id)
    toast.success(`Reihe gelöscht`)
  } catch (err) {
    toast.error((err as Error).message)
  }
}

const onRemoveContext = (e: MouseEvent, id: string) => {
  if (e.altKey) remove(id)
}

// ----- Display order -----
// The list is rendered in server order, so a chip's position in `items` is
// its authoritative slot — `sortOrder` is only the fallback for a record
// the backfill hasn't reached yet (a series created against an older
// server build).
const orderBusyMap = reactive<Record<string, boolean>>({})

function positionOf(s: SeriesDTO): number {
  const idx = store.items.findIndex((it) => it.seriesId === s.seriesId)
  if (idx >= 0) return idx + 1
  return s.sortOrder && s.sortOrder > 0 ? s.sortOrder : 1
}

async function onOrderChange(e: Event, s: SeriesDTO) {
  const select = e.target as HTMLSelectElement
  const next = Number(select.value)
  const current = positionOf(s)
  if (!Number.isFinite(next) || next === current) return
  if (orderBusyMap[s.seriesId]) return
  orderBusyMap[s.seriesId] = true
  try {
    await store.setOrder(s.seriesId, next)
    toast.success(`„${s.name}" auf Position ${next} verschoben`)
  } catch (err) {
    // Snap the control back to the position the server still holds.
    select.value = String(current)
    toast.error((err as Error).message || 'Reihenfolge konnte nicht gespeichert werden')
  } finally {
    orderBusyMap[s.seriesId] = false
  }
}

// ----- Cover-image dropzone -----
// Per-series transient state. `flashMap` drives the green / red border
// animation right after an upload settles; `dragOverMap` lifts the
// background while a file is hovering. `busyMap` blocks double-uploads
// from rapid drops or simultaneous click + drop.
type FlashState = 'success' | 'error' | null
const flashMap = reactive<Record<string, FlashState>>({})
const dragOverMap = reactive<Record<string, boolean>>({})
const busyMap = reactive<Record<string, boolean>>({})

function flash(seriesId: string, state: Exclude<FlashState, null>) {
  flashMap[seriesId] = state
  setTimeout(() => {
    if (flashMap[seriesId] === state) flashMap[seriesId] = null
  }, 1400)
}

function coverClassFor(s: SeriesDTO) {
  return {
    'has-cover': !!s.coverImage,
    'is-dragover': dragOverMap[s.seriesId],
    'is-success': flashMap[s.seriesId] === 'success',
    'is-error': flashMap[s.seriesId] === 'error',
    'is-busy': busyMap[s.seriesId]
  }
}

function onDragEnter(seriesId: string) {
  dragOverMap[seriesId] = true
}

function onDragLeave(seriesId: string) {
  dragOverMap[seriesId] = false
}

function pickImageFile(list: FileList | null | undefined): File | null {
  if (!list || !list.length) return null
  for (const f of Array.from(list)) {
    if (f.type.startsWith('image/')) return f
  }
  return null
}

async function handleUpload(seriesId: string, file: File | null) {
  if (!file) {
    flash(seriesId, 'error')
    toast.error('Keine Bilddatei erkannt.', 'Upload abgebrochen')
    return
  }
  if (busyMap[seriesId]) return
  busyMap[seriesId] = true
  try {
    await store.uploadCover(seriesId, file)
    flash(seriesId, 'success')
    toast.success(`Cover für „${seriesId}" gespeichert`)
  } catch (err) {
    flash(seriesId, 'error')
    toast.error((err as Error).message || 'Upload fehlgeschlagen')
  } finally {
    busyMap[seriesId] = false
  }
}

function onDrop(e: DragEvent, seriesId: string) {
  dragOverMap[seriesId] = false
  void handleUpload(seriesId, pickImageFile(e.dataTransfer?.files))
}

function onFileInput(e: Event, seriesId: string) {
  const target = e.target as HTMLInputElement
  void handleUpload(seriesId, pickImageFile(target.files))
  // Reset so the same file can be re-selected immediately after an error
  target.value = ''
}
</script>
