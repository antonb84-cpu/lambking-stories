<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ZBackButton from '@/components/atoms/ZBackButton.vue'
import ZChip from '@/components/atoms/ZChip.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'
import useModels from '@/use/useModels'
import useApiBooks from '@/use/useApiBooks'
import useApiSeries from '@/use/useApiSeries'
import useCatalogNames from '@/use/useCatalogNames'
import { isMobileLandscape, isMobilePortrait } from '@/use/useUser'
import type { ApiBook, Locale } from '@/types/apiBook'
import { pickLocalizedImage } from '@/types/apiBook'
import { onImgFallback, withPlaceholder, PLACEHOLDER_IMAGE } from '@/utils/placeholder'
import { prependBaseUrl } from '@/utils/function'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const { getSeries } = useModels()
const apiBooks = useApiBooks()
const apiSeries = useApiSeries()
const { seriesName } = useCatalogNames()

onMounted(() => {
  void apiBooks.loadAllBooks()
  // Pull the real series records (with editor-uploaded coverImage)
  // alongside the books list so tiles can render the banner instead of
  // falling back to a derived first-book preview.
  void apiSeries.loadAll()
})

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))
const allBooks = computed<ApiBook[]>(() => (apiBooks.state.all ?? []) as ApiBook[])

// Backdrop — a tall artwork for portrait, a wide one for landscape. The swap
// itself happens in CSS (`@media (orientation: …)`); we only feed the
// base-url-corrected `url()` values in as custom properties, because the
// files live in `public/` and a bare `url(…)` inside the SFC style block
// would be resolved by Vite as a bundled asset.
const backdropVars = computed(() => ({
  '--series-bg-portrait': `url(${prependBaseUrl('images/bg/series_portrait.webp')})`,
  '--series-bg-landscape': `url(${prependBaseUrl('images/bg/series_portrait.webp')})`
}))

// Derive series tiles directly from the API books. Series metadata
// (display name + tagline) comes from the static `useModels.getSeries`
// catalog when available; otherwise we fall back to the raw seriesId so
// brand-new series still render without a content migration. The resolved
// German name then passes through `seriesName`, which swaps in the English
// override in EN mode (see useCatalogNames).
interface SeriesTile {
  seriesId: string
  name: string
  subtitle: string
  description: string
  bookCount: number
  coverImage: string
  /** Display position from the AdminUI — lower first. */
  sortOrder: number
}

// A series the editor has never positioned (or one the app knows only from
// its books, with no server record yet) sorts after every positioned one
// rather than jumping to the front.
const UNPOSITIONED = Number.MAX_SAFE_INTEGER

function humaniseId(id: string): string {
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

const seriesList = computed<SeriesTile[]>(() => {
  // touch the reactive series state so the computed re-runs when the
  // API list arrives.
  void apiSeries.state.all
  const groups = new Map<string, ApiBook[]>()
  for (const b of allBooks.value) {
    const sid = b.bookSeriesId || 'misc'
    const arr = groups.get(sid) ?? []
    arr.push(b)
    groups.set(sid, arr)
  }
  const list: SeriesTile[] = []
  for (const [sid, books] of groups) {
    // Prefer the server-side series record (carries `coverImage` from
    // the AdminUI dropzone). Fall back to the hard-coded `useModels`
    // catalogue for display name + description, and finally to the
    // first book's preview so a series without any uploaded banner
    // still renders a thumbnail instead of the bare placeholder.
    const apiMeta = apiSeries.getById(sid)
    const legacyMeta = getSeries(sid)
    const firstBook = books[0]
    list.push({
      seriesId: sid,
      name: seriesName(sid, apiMeta?.name || legacyMeta?.name || humaniseId(sid)),
      subtitle: '',
      description: apiMeta?.description
        || legacyMeta?.description
        || t('app.allBooks.bookCount', books.length),
      bookCount: books.length,
      coverImage: apiMeta?.coverImage
        || legacyMeta?.coverImage
        || (firstBook ? pickLocalizedImage(firstBook.previewImage, lang.value) : '')
        || PLACEHOLDER_IMAGE,
      sortOrder: apiMeta?.sortOrder && apiMeta.sortOrder > 0 ? apiMeta.sortOrder : UNPOSITIONED
    })
  }
  // The tiles are grouped out of the books list, so they arrive in book
  // order — re-sort by the editor's position, falling back to the display
  // name so unpositioned series stay in a stable, readable order.
  return list.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return a.name.localeCompare(b.name)
  })
})

// Filter chips. The "Alle" chip is always present and selected by
// default; the rest are derived from the actual series list so the chip
// row tracks the catalogue without needing manual upkeep.
const ALL_FILTER = '__all__'
const activeFilter = ref<string>(ALL_FILTER)

interface FilterChip {
  id: string
  label: string
}

const filterChips = computed<FilterChip[]>(() => {
  const chips: FilterChip[] = [
    { id: ALL_FILTER, label: t('app.allBooks.filterAll') }
  ]
  for (const s of seriesList.value) chips.push({ id: s.seriesId, label: s.name })
  return chips
})

const filteredSeries = computed<SeriesTile[]>(() =>
  activeFilter.value === ALL_FILTER
    ? seriesList.value
    : seriesList.value.filter((s) => s.seriesId === activeFilter.value)
)

function openSeries(seriesId: string) {
  router.push({ name: 'app-series', params: { seriesId } })
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'app-main' })
}
</script>

<template lang="pug">
  div(
    :class="['serien-page', isMobileLandscape ? 'is-landscape' : '', 'min-h-screen w-full pb-[calc(8rem+env(safe-area-inset-bottom,0px))]']"
    :style="backdropVars"
  )
    //- ===== Header — back · crown · title =====
    header(class="serien-header")
      ZBackButton(variant="flat" class="serien-back" @click="goBack")
      div(class="title-cluster")
        img(
          :src="prependBaseUrl('images/icons/crown_256x256.webp')"
          alt=""
          class="serien-crown"
          decoding="async"
          aria-hidden="true"
        )
        h1(class="serien-title") {{ t('app.allBooks.title') }}

    //- ===== Filter chips (swipable) =====
    div(class="filter-row-wrap")
      div(class="filter-row")
        ZChip(
          v-for="chip in filterChips"
          :key="chip.id"
          clickable
          :selected="chip.id === activeFilter"
          :label="chip.label"
          size="md"
          @click="activeFilter = chip.id"
        )

    //- ===== Series tiles =====
    div(class="serien-content")
      div(
        v-for="series in filteredSeries"
        :key="series.seriesId"
        class="series-tile"
        :class="{'max-h-[180px]': isMobilePortrait, 'max-h-[200px]': isMobileLandscape }"
        @click="openSeries(series.seriesId)"
      )
        //- Cover image fills the entire tile; the text column sits on
        //- top with a parchment-to-transparent gradient bleeding into
        //- the artwork on its right edge.
        img(
          :src="withPlaceholder(series.coverImage)"
          :alt="series.name"
          class="series-tile-img"
          loading="lazy"
          @error="onImgFallback"
        )
        span(class="series-tile-fade")
        div(class="series-tile-text")
          h3(class="series-tile-name") {{ series.name }}
          p(
            v-if="series.subtitle"
            class="series-tile-sub"
          ) {{ series.subtitle }}
          //p(class="series-tile-desc") {{ series.description }}
          div(class="series-tile-count-row")
            span.mr-1(class="series-tile-count") {{ series.bookCount }}
            span(class="text-[12px]") {{ t('app.allBooks.bookLabel', series.bookCount) }}


      div(
        v-if="!filteredSeries.length"
        class="empty-card"
      )
        h3(class="empty-title") {{ t('app.allBooks.emptyTitle') }}
        p(class="empty-sub") {{ t('app.allBooks.emptySub') }}
</template>

<style scoped lang="sass">
$cream-bg: #f3e6c4
$cream-card: #fdf8ed
$navy: #1a2f4a
$brown: #7a6b55
$gold: #d4a83e
$border: #e6d6b5

button
  -webkit-tap-highlight-color: transparent

// The backdrop artwork lives on a viewport-pinned ::before layer instead of
// on the page box: the page scrolls (and is taller than the screen), so a
// plain background would scroll away and be sized against the whole document
// rather than the screen. `cover` keeps it filling the viewport edge-to-edge
// at every aspect ratio, with the beige palette colour underneath as a
// paint-in fallback while the artwork loads.
//
// `position: relative` + `z-index: 0` makes .serien-page its own stacking
// context so the `z-index: -1` layer stays above #app-root's opaque
// background (which would otherwise hide it) while still sitting behind the
// page content.
.serien-page
  position: relative
  z-index: 0
  background: transparent
  color: $navy

.serien-page::before
  content: ''
  position: fixed
  top: 0
  left: 0
  width: 100%
  // Sized instead of `inset: 0` on purpose: during the page-pop-scale route
  // animation the transform on .serien-page turns it into the containing
  // block for this fixed layer, and `bottom: 0` would then stretch the
  // artwork over the full document height and snap back when the animation
  // ends. A viewport-height box looks identical in both states.
  height: 100vh
  height: 100dvh
  z-index: -1
  pointer-events: none
  background-color: $cream-bg
  background-image: var(--series-bg-portrait)
  background-repeat: no-repeat
  background-position: center
  background-size: cover

@media (orientation: landscape)
  .serien-page::before
    background-image: var(--series-bg-landscape)

.serien-header
  position: relative
  padding: max(env(safe-area-inset-top), 0.75rem) 20px 8px
  max-width: 28rem
  margin: 0 auto

// Back button floats over the centred title block so the crown +
// "Serien" stack stays optically centred regardless of side widgets.
.serien-back
  position: absolute
  top: calc(max(env(safe-area-inset-top), 0.75rem))
  left: 12px
  --back-icon-color: #1a2f4a !important

.title-cluster
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 2px

.serien-crown
  width: 28px
  height: auto
  object-fit: contain
  filter: drop-shadow(0 2px 4px rgba(58, 42, 18, 0.3))

.serien-title
  font-size: 24px
  font-weight: 700
  color: $navy
  letter-spacing: -0.01em
  margin: 0
  line-height: 1.1

.filter-row-wrap
  max-width: 28rem
  margin: 0 auto
  padding: 4px 20px 12px

.filter-row
  display: flex
  gap: 8px
  overflow-x: auto
  overflow-y: hidden
  -webkit-overflow-scrolling: touch
  padding-bottom: 4px

  &::-webkit-scrollbar
    display: none

.serien-content
  max-width: 28rem
  margin: 0 auto
  padding: 6px 20px 0
  display: flex
  flex-direction: column
  // Stretch tiles to the full column width. With a definite width the
  // tile's `aspect-ratio: 2.5 / 1` derives the height (~163px at the
  // 28rem cap, under the `max-h-[180px]` clamp), so the cover image
  // fills the card edge-to-edge instead of leaving parchment gaps on
  // either side.
  align-items: stretch
  gap: 14px

// Full-bleed image card. The cover (uploaded via the AdminUI dropzone
// onto `bookSeries.coverImage`) covers the entire tile; the text column
// sits on top with a parchment-to-transparent gradient bleeding into
// the artwork on its right edge so the title still reads cleanly.
.series-tile
  position: relative
  display: block
  background: linear-gradient(160deg, #f3e6c4 0%, #e8d29a 100%)
  border: 1.5px solid $border
  border-radius: 14px
  overflow: hidden
  cursor: pointer
  aspect-ratio: 2.5 / 1
  min-height: 110px
  box-shadow: 0 10px 28px -14px rgba(58, 42, 18, 0.35)
  transition: transform 220ms ease-out, box-shadow 220ms ease-out

  &:hover
    transform: translateY(-3px)
    box-shadow: 0 18px 36px -14px rgba(212, 168, 62, 0.4)

  &:active
    transform: translateY(-1px) scale(0.995)

.series-tile-img
  position: absolute
  inset: 0
  width: 100% !important
  height: 100% !important
  max-width: 100%
  max-height: 100%
  object-fit: cover
  display: block

// Parchment gradient that fades from solid cream on the left (where the
// text sits) into the artwork on the right. Stops are calibrated so the
// title is fully legible while the image is still recognisable.
.series-tile-fade
  position: absolute
  inset: 0
  background: linear-gradient(109deg, #132637 0%, #192e4377 26%, rgba(44, 57, 66, 0.5) 38%, rgba(202, 39, 26, 0.1) 55%)
  //background: linear-gradient(108deg, $cream-bg 0%, #E6D6B5FF 26%, rgba(253, 248, 237, 0.7) 42%, rgba(253, 248, 237, 0) 65%)
  pointer-events: none

.series-tile-text
  position: absolute
  top: 0
  bottom: 0
  left: 0
  width: 55%
  padding: 14px 12px
  display: flex
  flex-direction: column
  justify-content: center
  gap: 5px
  min-width: 0
  z-index: 2

.series-tile-name
  font-size: 18px
  font-weight: 700
  color: white
  margin: 0
  line-height: 1.1
  display: -webkit-box
  -webkit-line-clamp: 2
  -webkit-box-orient: vertical
  overflow: hidden

.series-tile-sub
  font-size: 11px
  font-weight: 700
  color: $gold
  letter-spacing: 0.04em
  margin: 0
  text-transform: uppercase

.series-tile-desc
  font-size: 12px
  color: $brown
  line-height: 1.35
  margin: 0
  display: -webkit-box
  -webkit-line-clamp: 2
  -webkit-box-orient: vertical
  overflow: hidden


.series-tile-count-row
  color: white
  display: inline-flex
  align-items: baseline
  margin-top: 2px

.series-tile-count
  font-size: 12px
  font-weight: 700
  color: $gold

.empty-card
  text-align: center
  background: $cream-card
  border: 1px dashed $border
  border-radius: 18px
  padding: 26px 18px
  color: $brown

.empty-title
  font-size: 16px
  font-weight: 700
  color: $navy
  margin: 0 0 6px

.empty-sub
  font-size: 13px
  margin: 0

// ===== Mobile landscape =====
.is-landscape
  .serien-content
    max-width: 64rem
    display: grid
    // Reset the portrait `align-items: center` so grid cells stretch as
    // before — two tiles per row at full cell height.
    align-items: stretch
    grid-template-columns: 1fr 1fr
    gap: 14px

  .filter-row-wrap, .serien-header
    max-width: 64rem
</style>
