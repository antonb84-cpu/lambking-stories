<template>
  <div class="taxonomy-section">
    <div class="tax-head">
      <h3 class="tax-title">Kategorien</h3>
      <span
        class="count-badge has-tooltip"
        :data-tooltip="`Anzahl angelegter Kategorien — derzeit ${store.items.length}`"
        tabindex="0"
      >{{ store.items.length }}</span>
    </div>
    <div class="flex items-stretch gap-1">
      <input
        v-model="name"
        class="glass flex-1"
        placeholder="Neue Kategorie"
        @keydown.enter.prevent="add"
      />
      <XButton label="Hinzufügen" :disabled="busy || !name.trim()" @click="add" />
    </div>

    <div v-if="store.items.length" class="mt-4 flex flex-wrap gap-2">
      <span
        v-for="c in store.items"
        :key="c.name"
        class="tax-chip"
        :class="{ 'is-reserved': isReservedCategory(c.name) }"
      >
        <!--
          Minimal icon dropzone — accepts image drops or click-to-pick.
          Mirrors the SeriesManager cover dropzone, but square (the icon
          renders next to the category name in the app's category list).
          Hidden on the reserved category — it never shows in the app.
        -->
        <label
          v-if="!isReservedCategory(c.name)"
          class="chip-cover is-square has-tooltip"
          :class="iconClassFor(c)"
          :data-tooltip="c.icon ? 'Icon ersetzen (Drop oder Klick)' : 'Icon hochladen (Drop oder Klick)'"
          @dragover.prevent
          @dragenter.prevent="onDragEnter(c.name)"
          @dragleave="onDragLeave(c.name)"
          @drop.prevent="onDrop($event, c.name)"
        >
          <input
            type="file"
            accept="image/*"
            class="chip-cover-input"
            @change="onFileInput($event, c.name)"
          />
          <img
            v-if="c.icon"
            :src="c.icon"
            class="chip-cover-img"
            alt=""
          />
          <span v-else class="chip-cover-placeholder" aria-hidden="true">+</span>
        </label>
        <span class="chip-name">{{ c.name }}</span>
        <span
          class="chip-count has-tooltip"
          :data-tooltip="`${countFor(c.name)} Buch/Bücher in dieser Kategorie`"
          tabindex="0"
        >{{ countFor(c.name) }}</span>
        <span
          v-if="isReservedCategory(c.name)"
          class="chip-lock has-tooltip"
          data-tooltip="Reservierte Kategorie — Bücher hier sind in der App ausgeblendet und können nicht gelöscht werden."
          aria-label="Reserviert"
        >🔒</span>
        <button
          v-else
          class="chip-remove has-tooltip"
          data-tooltip="ALT + Rechtsklick zum PERMANENTEN Löschen (ich hoffe du weißt was du tust!!!)"
          @click.prevent
          @contextmenu.prevent="onRemoveContext($event, c.name)"
          aria-label="Löschen mit ALT + Rechtsklick"
        >×</button>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import XButton from '@/components/atoms/XButton.vue'
import { useCategoryStore } from '@/stores/categories'
import { useToastStore } from '@/stores/toast'
import { isReservedCategory, type BookDTO, type CategoryDTO } from '@/types'

const props = defineProps<{ books?: BookDTO[] }>()

const store = useCategoryStore()
const toast = useToastStore()
const name = ref('')
const busy = ref(false)

const countByCategory = computed<Record<string, number>>(() => {
  const out: Record<string, number> = {}
  for (const b of props.books ?? []) {
    const c = b.category
    if (!c) continue
    out[c] = (out[c] ?? 0) + 1
  }
  return out
})

function countFor(name: string): number {
  return countByCategory.value[name] ?? 0
}

const add = async () => {
  const trimmed = name.value.trim()
  if (!trimmed) return
  busy.value = true
  try {
    await store.add(trimmed)
    toast.success(`Kategorie „${trimmed}" angelegt`)
    name.value = ''
  } catch (err) {
    toast.error((err as Error).message)
  } finally {
    busy.value = false
  }
}

const remove = async (n: string) => {
  try {
    await store.remove(n)
    toast.success(`Kategorie „${n}" gelöscht`)
  } catch (err) {
    toast.error((err as Error).message)
  }
}

const onRemoveContext = (e: MouseEvent, n: string) => {
  if (isReservedCategory(n)) return
  if (e.altKey) remove(n)
}

// ----- Icon dropzone -----
// Per-category transient state, mirroring the SeriesManager cover
// dropzone. `flashMap` drives the green / red border animation right
// after an upload settles; `dragOverMap` lifts the background while a
// file is hovering. `busyMap` blocks double-uploads from rapid drops or
// simultaneous click + drop.
type FlashState = 'success' | 'error' | null
const flashMap = reactive<Record<string, FlashState>>({})
const dragOverMap = reactive<Record<string, boolean>>({})
const busyMap = reactive<Record<string, boolean>>({})

function flash(name: string, state: Exclude<FlashState, null>) {
  flashMap[name] = state
  setTimeout(() => {
    if (flashMap[name] === state) flashMap[name] = null
  }, 1400)
}

function iconClassFor(c: CategoryDTO) {
  return {
    'has-cover': !!c.icon,
    'is-dragover': dragOverMap[c.name],
    'is-success': flashMap[c.name] === 'success',
    'is-error': flashMap[c.name] === 'error',
    'is-busy': busyMap[c.name]
  }
}

function onDragEnter(name: string) {
  dragOverMap[name] = true
}

function onDragLeave(name: string) {
  dragOverMap[name] = false
}

function pickImageFile(list: FileList | null | undefined): File | null {
  if (!list || !list.length) return null
  for (const f of Array.from(list)) {
    if (f.type.startsWith('image/')) return f
  }
  return null
}

async function handleUpload(name: string, file: File | null) {
  if (!file) {
    flash(name, 'error')
    toast.error('Keine Bilddatei erkannt.', 'Upload abgebrochen')
    return
  }
  if (busyMap[name]) return
  busyMap[name] = true
  try {
    await store.uploadIcon(name, file)
    flash(name, 'success')
    toast.success(`Icon für „${name}" gespeichert`)
  } catch (err) {
    flash(name, 'error')
    toast.error((err as Error).message || 'Upload fehlgeschlagen')
  } finally {
    busyMap[name] = false
  }
}

function onDrop(e: DragEvent, name: string) {
  dragOverMap[name] = false
  void handleUpload(name, pickImageFile(e.dataTransfer?.files))
}

function onFileInput(e: Event, name: string) {
  const target = e.target as HTMLInputElement
  void handleUpload(name, pickImageFile(target.files))
  // Reset so the same file can be re-selected immediately after an error
  target.value = ''
}
</script>
