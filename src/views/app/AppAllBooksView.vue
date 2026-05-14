<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ZBottomNav from '@/components/atoms/ZBottomNav.vue'
import ZBackButton from '@/components/atoms/ZBackButton.vue'
import ZChip from '@/components/atoms/ZChip.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'
import useModels from '@/use/useModels'
import useApiBooks from '@/use/useApiBooks'
import useAppNav from '@/use/useAppNav'
import { isMobileLandscape } from '@/use/useUser'
import type { ApiBook, Locale } from '@/types/apiBook'
import { pickLocalizedImage } from '@/types/apiBook'
import { onImgFallback, withPlaceholder, PLACEHOLDER_IMAGE } from '@/utils/placeholder'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const { getSeries } = useModels()
const apiBooks = useApiBooks()
const { navItems, activeNav, onNav } = useAppNav(t)

onMounted(() => {
  void apiBooks.loadAllBooks()
})

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))
const allBooks = computed<ApiBook[]>(() => (apiBooks.state.all ?? []) as ApiBook[])

// Derive series tiles directly from the API books. Series metadata
// (display name + tagline) comes from the static `useModels.getSeries`
// catalog when available; otherwise we fall back to the raw seriesId so
// brand-new series still render without a content migration.
interface SeriesTile {
  seriesId: string
  name: string
  subtitle: string
  description: string
  bookCount: number
  coverImage: string
}

function humaniseId(id: string): string {
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

const seriesList = computed<SeriesTile[]>(() => {
  const groups = new Map<string, ApiBook[]>()
  for (const b of allBooks.value) {
    const sid = b.bookSeriesId || 'misc'
    const arr = groups.get(sid) ?? []
    arr.push(b)
    groups.set(sid, arr)
  }
  const list: SeriesTile[] = []
  for (const [sid, books] of groups) {
    const meta = getSeries(sid)
    const firstBook = books[0]
    list.push({
      seriesId: sid,
      name: meta?.name || humaniseId(sid),
      subtitle: '',
      description: meta?.description
        || `${books.length} ${books.length === 1 ? 'Buch' : 'Bücher'}`,
      bookCount: books.length,
      // Until the API ships `bookSeriesCoverImage`, prefer the series'
      // legacy `coverImage` and fall back to the first book's preview so
      // the tile never renders blank against the placeholder.
      coverImage: meta?.coverImage
        || (firstBook ? pickLocalizedImage(firstBook.previewImage, lang.value) : '')
        || PLACEHOLDER_IMAGE
    })
  }
  return list
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
  div(:class="['serien-page', isMobileLandscape ? 'is-landscape' : '', 'min-h-screen w-full pb-32']")
    //- ===== Header — back · crown · title =====
    header(class="serien-header")
      ZBackButton(variant="flat" class="serien-back" @click="goBack")
      div(class="title-cluster")
        img(
          src="/images/icons/crown_256x256.webp"
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
        @click="openSeries(series.seriesId)"
      )
        div(class="series-tile-image")
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
          div
            span.mr-1(class="series-tile-count") {{ series.bookCount }}
            span(class="text-[12px]") {{ series.bookCount === 1 ? 'Buch' : 'Bücher' }}


      div(
        v-if="!filteredSeries.length"
        class="empty-card"
      )
        h3(class="empty-title") {{ t('app.allBooks.emptyTitle') }}
        p(class="empty-sub") {{ t('app.allBooks.emptySub') }}

    ZBottomNav(:items="navItems" :model-value="activeNav" @update:model-value="onNav")
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

.serien-page
  background: radial-gradient(ellipse at top, #faf2dc 0%, #f3e6c4 60%, #e8d29a 100%)
  color: $navy

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
  font-weight: 900
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
  gap: 14px

.series-tile
  position: relative
  display: grid
  grid-template-columns: 1.05fr 1fr
  gap: 0
  align-items: stretch
  background: linear-gradient(180deg, #fdf8ed 0%, #f5e8c2 100%)
  border: 1.5px solid $border
  border-radius: 12px
  overflow: hidden
  cursor: pointer
  min-height: 140px
  box-shadow: 0 10px 28px -14px rgba(58, 42, 18, 0.35)
  transition: transform 220ms ease-out, box-shadow 220ms ease-out

  &:hover
    transform: translateY(-3px)
    box-shadow: 0 18px 36px -14px rgba(212, 168, 62, 0.4)

  &:active
    transform: translateY(-1px) scale(0.995)

.series-tile-text
  order: 1
  padding: 16px 14px 14px
  display: flex
  flex-direction: column
  justify-content: center
  gap: 5px
  min-width: 0

.series-tile-name
  font-size: 18px
  font-weight: 900
  color: $navy
  margin: 0
  line-height: 1.1
  display: -webkit-box
  -webkit-line-clamp: 2
  -webkit-box-orient: vertical
  overflow: hidden

.series-tile-sub
  font-size: 11px
  font-weight: 800
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

.series-tile-count
  font-size: 12px
  font-weight: 900
  color: $gold
  margin-top: 2px

.series-tile-image
  order: 2
  position: relative
  overflow: hidden
  background: linear-gradient(160deg, #f3e6c4 0%, #e8d29a 100%)

.series-tile-img
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover

.series-tile-fade
  position: absolute
  inset: 0
  background: linear-gradient(90deg, rgba(253, 248, 237, 0.55) 0%, rgba(253, 248, 237, 0) 25%, rgba(0, 0, 0, 0.1) 100%)
  pointer-events: none

.empty-card
  text-align: center
  background: $cream-card
  border: 1px dashed $border
  border-radius: 18px
  padding: 26px 18px
  color: $brown

.empty-title
  font-size: 16px
  font-weight: 900
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
    grid-template-columns: 1fr 1fr
    gap: 14px

  .filter-row-wrap, .serien-header
    max-width: 64rem
</style>
