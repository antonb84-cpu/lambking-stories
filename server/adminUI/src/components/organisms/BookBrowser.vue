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
            <button
              type="button"
              class="bb-group-header"
              :class="{ 'bb-group-header-recent': g.isRecent }"
              :aria-expanded="isExpanded(g.key)"
              :disabled="!!activeQuery"
              :title="activeQuery
                ? 'Während der Suche sind alle Gruppen offen'
                : (isExpanded(g.key) ? 'Gruppe zuklappen' : 'Gruppe aufklappen')"
              @mousedown.prevent
              @click.stop="toggleGroup(g.key)"
            >
              <ChevronDown
                class="bb-folder-icon"
                :class="{ 'is-collapsed': !isExpanded(g.key) }"
              />
              <span class="bb-group-name">{{ g.label }}</span>
              <span class="bb-group-count">{{ g.books.length }}</span>
            </button>
            <button
              v-for="b in (isExpanded(g.key) ? g.books : [])"
              :key="`${g.key}:${b.bookId}`"
              type="button"
              class="bb-item"
              :class="{
                'bb-item-recent': g.isRecent,
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
import { RECENT_LIMIT, useRecentBooks } from '@/composables/useRecentBooks'
import { HIDDEN_CATEGORY, type BookDTO, type SeriesDTO } from '@/types'

const props = defineProps<{
  books: BookDTO[]
  series: SeriesDTO[]
  selected: string
}>()
const emit = defineEmits<{ select: [bookId: string]; delete: [] }>()

const NO_SERIES_KEY = '__none__'
const RECENT_KEY = '__recent__'
const EXPANDED_STORAGE_KEY = 'adminui.bookBrowser.expandedGroups'

interface BookGroup {
  key: string
  label: string
  books: BookDTO[]
  // The pinned "recently edited" pseudo-group. Its books are duplicates of
  // entries further down the list, so it needs its own row styling and a
  // composite :key.
  isRecent?: boolean
}

const { recentBookIds } = useRecentBooks()

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

const seriesGroups = computed<BookGroup[]>(() => {
  const seriesMap = new Map<string, BookGroup>()
  for (const s of props.series) {
    seriesMap.set(s.seriesId, {
      key: s.seriesId,
      label: `${s.name} (${s.prefix})`,
      books: []
    })
  }
  const noSeries: BookGroup = {
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

// Shortcut back to what the user was last working on. Kept in history order
// (most recent first), not sorted, and capped at RECENT_LIMIT — ids whose
// book no longer exists are simply skipped, which is why the history itself
// remembers more than it shows.
const recentGroup = computed<BookGroup | null>(() => {
  const byId = new Map(props.books.map((b) => [b.bookId, b]))
  const books = recentBookIds.value
    .map((id) => byId.get(id))
    .filter((b): b is BookDTO => !!b)
    .slice(0, RECENT_LIMIT)
  if (!books.length) return null
  return { key: RECENT_KEY, label: 'Zuletzt bearbeitet', books, isRecent: true }
})

const allGroups = computed<BookGroup[]>(() =>
  recentGroup.value ? [recentGroup.value, ...seriesGroups.value] : seriesGroups.value
)

// The search term, or '' when the dropdown is in "browse mode": while the
// input still shows the selected book's full label we don't filter down to
// that single match — the whole catalogue stays visible so the user can pick
// a different book.
const activeQuery = computed(() => {
  const q = query.value.trim().toLowerCase()
  const matchesSelected = selectedBook.value && query.value === labelOf(selectedBook.value)
  return !q || matchesSelected ? '' : q
})

const filteredGroups = computed<BookGroup[]>(() => {
  const q = activeQuery.value
  if (!q) return allGroups.value
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

// ---- Fold / unfold -------------------------------------------------------
// Expanded keys are stored (rather than collapsed ones) so a fresh admin
// starts with every series folded — a compact index of the catalogue — with
// only the recent shortcut open. The set survives reloads because the fold
// pattern mirrors how a user works: one or two series at a time.
function readExpanded(): Set<string> {
  try {
    const raw = localStorage.getItem(EXPANDED_STORAGE_KEY)
    if (!raw) return new Set([RECENT_KEY])
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set([RECENT_KEY])
    return new Set(parsed.filter((x): x is string => typeof x === 'string'))
  } catch {
    return new Set([RECENT_KEY])
  }
}

const expandedKeys = ref<Set<string>>(readExpanded())

function persistExpanded() {
  try {
    localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify([...expandedKeys.value]))
  } catch {
    /* private mode / quota — folding still works for this session */
  }
}

// A search hit inside a folded group would be invisible, so an active query
// overrides the fold state entirely (standard tree-search behaviour).
function isExpanded(key: string): boolean {
  return !!activeQuery.value || expandedKeys.value.has(key)
}

function toggleGroup(key: string) {
  // Folding is the *alternative* to searching — with a query active the
  // matches decide what's visible, so the headers are inert (and rendered
  // disabled) rather than silently writing a state nothing reflects.
  if (activeQuery.value) return
  const next = new Set(expandedKeys.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expandedKeys.value = next
  persistExpanded()
}

// Opening the dropdown unfolds whichever series holds the current book, so
// the user always sees where they are in the catalogue.
watch(open, (isOpen) => {
  if (!isOpen) return
  const groupKey = seriesGroups.value.find((g) =>
    g.books.some((b) => b.bookId === props.selected)
  )?.key
  if (!groupKey || expandedKeys.value.has(groupKey)) return
  expandedKeys.value = new Set(expandedKeys.value).add(groupKey)
  persistExpanded()
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
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px 6px;
  border: none;
  background: transparent;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  font: inherit;
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #8a6d3b;
  transition: background 120ms ease;
}

.bb-group-header:hover:not(:disabled) {
  background: rgba(210, 170, 110, 0.16);
}

/* During a search the matches decide visibility, so folding is off. */
.bb-group-header:disabled {
  cursor: default;
}

/* The pinned shortcut list — same blue accent as its rows below. */
.bb-group-header-recent {
  color: #2471a3;
}

.bb-folder-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  transition: transform 160ms ease;
}

.bb-folder-icon.is-collapsed {
  transform: rotate(-90deg);
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

/* Pinned "recently edited" rows — lightblue so the shortcut block reads as
 * one unit and is distinguishable at a glance from the catalogue below.
 * Declared after :hover / .bb-item-active but before .bb-item-hidden: the
 * red "NO SHOW" warning has to keep outranking the convenience tint. */
.bb-item-recent {
  background: rgba(133, 193, 233, 0.4);
}

.bb-item-recent:hover {
  background: rgba(133, 193, 233, 0.6);
}

.bb-item-recent.bb-item-active,
.bb-item-recent.bb-item-active:hover {
  background: rgba(52, 152, 219, 0.42);
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
