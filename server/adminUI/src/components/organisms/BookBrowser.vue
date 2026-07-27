<template>
  <div class="bb-card glass card !p-3 flex items-center gap-3">
    <Search class="w-4 h-4 text-stone-500 flex-shrink-0" />
    <div ref="rootEl" class="bb-root flex items-stretch flex-1 gap-1">
      <div class="bb-combo">
        <input
          ref="inputEl"
          v-model="query"
          class="glass w-full bb-input"
          :class="{ 'has-clear': showClear }"
          :placeholder="selected ? '' : 'Buch suchen oder neu anlegen…'"
          @focus="open = true"
          @click="open = true"
          @input="open = true"
          @keydown.escape="closePanel"
          @keydown.down.prevent="open = true"
        />
        <button
          v-if="showClear"
          type="button"
          class="bb-clear"
          title="Auswahl löschen"
          aria-label="Auswahl löschen"
          @mousedown.prevent
          @click.stop="onClear"
        >×
        </button>

        <div v-if="open" class="bb-panel">
          <div v-if="!filteredGroups.length" class="bb-empty">Keine Treffer</div>
          <template v-for="g in filteredGroups" :key="g.key">
            <div class="bb-group-header">
              <ChevronDown class="bb-folder-icon" />
              <span class="bb-group-name">{{ g.label }}</span>
              <span class="bb-group-count">{{ g.books.length }}</span>
            </div>
            <button
              v-for="b in g.books"
              :key="b.bookId"
              type="button"
              class="bb-item"
              :class="{
                'bb-item-active': b.bookId === selected,
                'bb-item-hidden': isHidden(b)
              }"
              :title="isHidden(b) ? `Kategorie „${HIDDEN_CATEGORY}“ — in der App ausgeblendet` : undefined"
              @mousedown.prevent
              @click="onPick(b.bookId)"
            >
              <span class="bb-item-id">{{ b.bookId }}</span>
              <span class="bb-item-title">— {{ titleOf(b) }}</span>
            </button>
          </template>
        </div>
      </div>
      <XButton label="Neu" @click="onNew" />
      <button
        type="button"
        class="bb-delete-btn"
        :disabled="!selected"
        @click="emit('delete')"
      >Löschen
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import XButton from '@/components/atoms/XButton.vue'
import { ChevronDown, Search } from 'lucide-vue-next'
import { HIDDEN_CATEGORY, type BookDTO, type SeriesDTO } from '@/types'

const props = defineProps<{
  books: BookDTO[]
  series: SeriesDTO[]
  selected: string
}>()
const emit = defineEmits<{ select: [bookId: string]; delete: [] }>()

const NO_SERIES_KEY = '__none__'

const rootEl = ref<HTMLDivElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const open = ref(false)
const query = ref('')

function titleOf(b: BookDTO): string {
  return b.localizations.de?.title ?? b.localizations.en?.title ?? '(ohne Titel)'
}

function labelOf(b: BookDTO): string {
  return `${b.bookId} — ${titleOf(b)}`
}

// Books parked in the reserved "NO SHOW" category are filtered out of the
// public Book app (`?all=true` is what brings them back into this list), so
// the dropdown flags them red — otherwise a parked book is indistinguishable
// from a live one here.
function isHidden(b: BookDTO): boolean {
  return b.category === HIDDEN_CATEGORY
}

const selectedBook = computed(() =>
  props.books.find((b) => b.bookId === props.selected) ?? null
)

const showClear = computed(() => !!props.selected || !!query.value)

watch(
  () => [props.selected, props.books] as const,
  () => {
    if (selectedBook.value) query.value = labelOf(selectedBook.value)
    else if (!open.value) query.value = ''
  },
  { immediate: true }
)

// Natural-order collator: "fa-2" < "fa-10" instead of lexical "fa-10" < "fa-2".
const naturalCollator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' })

const allGroups = computed(() => {
  const seriesMap = new Map<string, { key: string; label: string; books: BookDTO[] }>()
  for (const s of props.series) {
    seriesMap.set(s.seriesId, {
      key: s.seriesId,
      label: `${s.name} (${s.prefix})`,
      books: []
    })
  }
  const noSeries: { key: string; label: string; books: BookDTO[] } = {
    key: NO_SERIES_KEY,
    label: 'Ohne Buchreihe',
    books: []
  }
  for (const b of props.books) {
    const bucket = b.bookSeriesId && seriesMap.get(b.bookSeriesId)
    if (bucket) bucket.books.push(b)
    else noSeries.books.push(b)
  }
  const ordered = Array.from(seriesMap.values())
    .filter((g) => g.books.length)
    .sort((a, b) => naturalCollator.compare(a.label, b.label))
  if (noSeries.books.length) ordered.push(noSeries)
  for (const g of ordered) {
    g.books.sort((a, b) => naturalCollator.compare(a.bookId, b.bookId))
  }
  return ordered
})

const filteredGroups = computed(() => {
  const q = query.value.trim().toLowerCase()
  // When the input still shows the selected book's full label, treat the
  // dropdown as "browse mode" — don't filter down to the single match,
  // show the whole catalogue so the user can pick a different one.
  const matchesSelected = selectedBook.value && query.value === labelOf(selectedBook.value)
  if (!q || matchesSelected) return allGroups.value
  return allGroups.value
    .map((g) => ({
      ...g,
      books: g.books.filter(
        (b) =>
          b.bookId.toLowerCase().includes(q) ||
          titleOf(b).toLowerCase().includes(q)
      )
    }))
    .filter((g) => g.books.length)
})

function onPick(bookId: string) {
  emit('select', bookId)
  open.value = false
  inputEl.value?.blur()
}

function onNew() {
  emit('select', '')
  query.value = ''
  open.value = false
}

function onClear() {
  query.value = ''
  emit('select', '')
  inputEl.value?.focus()
  open.value = true
}

function closePanel() {
  open.value = false
  inputEl.value?.blur()
}

function onDocMouseDown(e: MouseEvent) {
  if (!open.value) return
  if (rootEl.value && !rootEl.value.contains(e.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('mousedown', onDocMouseDown))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocMouseDown))
</script>

<style scoped>
/* Sibling .glass cards each spawn a stacking context (backdrop-filter), so
 * the dropdown panel needs its host card lifted above them — otherwise
 * later siblings paint over the floating list. */
.bb-card {
  position: relative;
  z-index: 60;
}

.bb-root {
  position: relative;
}

.bb-combo {
  position: relative;
  flex: 1;
  min-width: 0;
}

.bb-input.has-clear {
  padding-right: 32px;
}

.bb-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.06);
  color: #5d6d7e;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}

.bb-clear:hover {
  background: rgba(231, 76, 60, 0.92);
  color: #fff;
}

.bb-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 50;
  max-height: 360px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  border: 1px solid rgba(210, 170, 110, 0.4);
  border-radius: 14px;
  box-shadow: 0 14px 40px -16px rgba(120, 90, 50, 0.35);
  padding: 6px 4px;
}

.bb-empty {
  padding: 14px 12px;
  text-align: center;
  color: #78716c;
  font-size: 0.88rem;
}

.bb-group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px 4px;
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #8a6d3b;
}

.bb-folder-icon {
  width: 12px;
  height: 12px;
}

.bb-group-name {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bb-group-count {
  font-size: 0.7rem;
  font-weight: 700;
  color: #a08458;
  background: rgba(210, 170, 110, 0.18);
  padding: 1px 7px;
  border-radius: 999px;
}

.bb-item {
  width: 100%;
  text-align: left;
  display: flex;
  gap: 6px;
  align-items: baseline;
  padding: 7px 10px 7px 22px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 0.88rem;
  color: #1c1917;
  cursor: pointer;
  font: inherit;
}

.bb-item:hover {
  background: rgba(52, 152, 219, 0.1);
}

.bb-item-active {
  background: rgba(52, 152, 219, 0.18);
  font-weight: 700;
}

/* "NO SHOW" books — red row so parked entries stand out from live ones.
 * Declared after .bb-item:hover / .bb-item-active (equal specificity) so the
 * red wins in every combination; the active+hover pair carries an extra
 * class and outranks the plain hidden hover on its own. */
.bb-item-hidden {
  background: rgba(214, 48, 49, 0.14);
  color: #8e1f1f;
}

.bb-item-hidden:hover {
  background: rgba(214, 48, 49, 0.24);
}

.bb-item-hidden.bb-item-active,
.bb-item-hidden.bb-item-active:hover {
  background: rgba(214, 48, 49, 0.34);
}

.bb-item-id {
  font-family: 'Nunito', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  color: #2471a3;
  flex-shrink: 0;
}

/* The blue id clashes with the red row — retint it to match. */
.bb-item-hidden .bb-item-id {
  color: #b02828;
}

.bb-item-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bb-delete-btn {
  font: inherit;
  font-weight: 700;
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid #a82a2a;
  background: linear-gradient(140deg, #d83a3a 0%, #b02828 100%);
  color: #ffffff;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
  box-shadow: 0 4px 12px -4px rgba(176, 40, 40, 0.55);
  user-select: none;
}

.bb-delete-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px -6px rgba(176, 40, 40, 0.65);
}

.bb-delete-btn:active:not(:disabled) {
  transform: translateY(0);
}

.bb-delete-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
