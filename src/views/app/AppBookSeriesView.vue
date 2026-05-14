<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ZBottomNav from '@/components/atoms/ZBottomNav.vue'
import ZBackButton from '@/components/atoms/ZBackButton.vue'
import ZBadge from '@/components/atoms/ZBadge.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'
import useModels from '@/use/useModels'
import useApiBooks from '@/use/useApiBooks'
import useApiSeries from '@/use/useApiSeries'
import useReadingProgress from '@/use/useReadingProgress'
import useAppNav from '@/use/useAppNav'
import { isMobileLandscape } from '@/use/useUser'
import type { ApiBook, Locale } from '@/types/apiBook'
import { pickLocalizedImage } from '@/types/apiBook'
import { onImgFallback, withPlaceholder, PLACEHOLDER_IMAGE } from '@/utils/placeholder'

const { t, locale } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()
const { getSeries } = useModels()
const apiBooks = useApiBooks()
const apiSeries = useApiSeries()
const { getPct } = useReadingProgress()
const { navItems, activeNav, onNav } = useAppNav(t)

onMounted(() => {
  void apiBooks.loadAllBooks()
  // Fetch the live series records so the hero pulls the
  // editor-uploaded `coverImage` instead of falling back to the first
  // book's preview.
  void apiSeries.loadAll()
})

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))
const seriesId = computed(() => String(route.params.seriesId))

const seriesMeta = computed(() => getSeries(seriesId.value))

const books = computed<ApiBook[]>(() => {
  void apiBooks.state.all
  return apiBooks.booksOfSeries(seriesId.value)
})

function localizedTitle(book: ApiBook): string {
  return book.localizations?.[lang.value]?.title || book.localizations?.de?.title || ''
}

function pageCount(book: ApiBook): number {
  return book.localizations?.[lang.value]?.content?.length
    || book.localizations?.de?.content?.length
    || 0
}

function progressPct(book: ApiBook): number {
  return getPct(book.bookId, pageCount(book))
}

function isNew(iso: string) {
  return Date.now() - new Date(iso).getTime() < 1000 * 60 * 60 * 24 * 90
}

function isComingSoon(book: ApiBook): boolean {
  return new Date(book.releaseDate).getTime() > Date.now() || pageCount(book) === 0
}

function bandLabel(idx: number): string {
  return t('app.bookSeries.bandLabel', { n: idx + 1 })
}

// Hero image source priority:
//   1. The server-side series record (carries the cover uploaded via
//      the AdminUI dropzone).
//   2. The hard-coded `useModels` catalogue.
//   3. The first book's preview as a graceful fallback.
//   4. The shared placeholder.
const heroImage = computed<string>(() => {
  void apiSeries.state.all
  const apiMeta = apiSeries.getById(seriesId.value)
  if (apiMeta?.coverImage) return apiMeta.coverImage
  const meta = seriesMeta.value
  if (meta?.coverImage) return meta.coverImage
  const first = books.value[0]
  if (first) return pickLocalizedImage(first.previewImage, lang.value)
  return PLACEHOLDER_IMAGE
})

const description = computed<string>(() => {
  return seriesMeta.value?.description
    || ''
})

const seriesTitle = computed<string>(() => seriesMeta.value?.name || '')

function openBook(bookId: string) {
  router.push({ name: 'app-book', params: { bookId } })
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'app-all-books' })
}
</script>

<template lang="pug">
  div(:class="['series-detail-page', isMobileLandscape ? 'is-landscape' : '', 'min-h-screen w-full pb-32']")
    //- ===== Hero image with back arrow (stretched series cover) =====
    div(class="hero")
      img(
        :src="withPlaceholder(heroImage)"
        :alt="seriesTitle"
        class="hero-img"
        loading="eager"
        @error="onImgFallback"
      )
      span(class="hero-fade")
      ZBackButton(
        variant="floating"
        :size="40"
        class="hero-back"
        @click="goBack"
      )

      //- Title + tagline floating on the lower portion of the hero
      div(class="hero-title-block")
        h1(class="hero-title") {{ seriesTitle }}
        p(
          v-if="seriesMeta?.description"
          class="hero-subtitle"
        ) Im Auftrag des Königs

      ////- Decorative crown crest top-right
      //span(class="hero-crest")
      //  ZIconography(name="crown" :size="38")

    div(class="content")
      p(class="series-desc") {{ description }}

      h3(class="section-title") {{ t('app.bookSeries.books') }}

      div(class="book-grid")
        div(
          v-for="(book, idx) in books"
          :key="book.bookId"
          class="book-card"
          :class="{ 'is-soon': isComingSoon(book) }"
          @click="openBook(book.bookId)"
        )
          div(class="book-card-img-wrap")
            img(
              :src="withPlaceholder(pickLocalizedImage(book.previewImage, lang))"
              :alt="localizedTitle(book)"
              class="book-card-img"
              loading="lazy"
              @error="onImgFallback"
            )
            ZBadge(
              v-if="isNew(book.releaseDate) && !isComingSoon(book)"
              variant="hot"
              size="sm"
              position="top-left"
              :label="t('app.bookSeries.new').toUpperCase()"
            )
          div(class="book-card-meta")
            //span(class="book-card-band") {{ bandLabel(idx) }}
            h4(class="book-card-title") {{ localizedTitle(book) }}
            div(
              v-if="!isComingSoon(book) && progressPct(book) > 0"
              class="book-card-progress"
            )
              div(class="book-card-progress-track")
                div(
                  class="book-card-progress-fill"
                  :style="{ width: Math.round(progressPct(book) * 100) + '%' }"
                )
              span(class="book-card-progress-label") {{ Math.round(progressPct(book) * 100) }} %
            span(
              v-else-if="isComingSoon(book)"
              class="book-card-soon"
            ) {{ t('app.bookSeries.comingSoon') }}
            span(
              v-else-if="isNew(book.releaseDate)"
              class="book-card-new-tag"
            ) {{ t('app.bookSeries.new') }}

      div(
        v-if="!books.length"
        class="empty-card"
      ) Noch keine Bücher in dieser Serie.

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

.series-detail-page
  background: radial-gradient(ellipse at top, #faf2dc 0%, #f3e6c4 60%, #e8d29a 100%)
  color: $navy

.hero
  position: relative
  width: 100%
  max-height: 320px
  aspect-ratio: 4 / 3
  overflow: hidden
  background: linear-gradient(160deg, #f3e6c4 0%, #c89030 100%)

.hero-img
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover
  object-position: center

.hero-fade
  position: absolute
  inset: 0
  background: linear-gradient(180deg, rgba(20, 14, 6, 0) 40%, rgba(20, 14, 6, 0.55) 100%)
  pointer-events: none

.hero-back
  position: absolute
  top: calc(env(safe-area-inset-top, 0px) + 12px)
  left: 12px
  width: 40px
  height: 40px
  border-radius: 999px
  background-color: rgba(255, 255, 255, 0.85)
  border: 1.5px solid rgba(230, 214, 181, 0.6)
  color: $navy
  display: inline-flex
  align-items: center
  justify-content: center
  cursor: pointer
  box-shadow: 0 6px 14px -6px rgba(0, 0, 0, 0.35)
  transition: transform 150ms ease-out, background-color 150ms ease-out

  &:hover
    background-color: #ffffff
    transform: translateY(-1px)

  &:active
    transform: scale(0.94)

.hero-crest
  position: absolute
  top: calc(env(safe-area-inset-top, 0px) + 12px)
  right: 14px
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.35))

.hero-title-block
  position: absolute
  left: 50%
  transform: translateX(-50%)
  bottom: 14px
  text-align: center
  width: calc(100% - 40px)

.hero-title
  font-size: 26px
  font-weight: 900
  color: #ffffff
  margin: 0
  letter-spacing: -0.005em
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.55)

.hero-subtitle
  font-size: 13px
  color: #fbf1d6
  margin-top: 4px
  font-weight: 700
  letter-spacing: 0.01em
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5)

.content
  max-width: 28rem
  margin: 0 auto
  padding: 14px 20px 0
  display: flex
  flex-direction: column
  gap: 14px

.series-desc
  font-size: 14px
  line-height: 1.5
  color: $navy
  text-align: center
  margin: 0
  padding: 0 4px

.section-title
  font-size: 16px
  font-weight: 900
  color: $navy
  margin: 4px 0 0
  letter-spacing: -0.005em

// `minmax(0, …)` lets the columns shrink past their min-content size so
// long German titles can wrap inside the card instead of forcing the
// row to overflow horizontally. Capping each track at 30% keeps the
// three-up layout strictly inside the viewport.
// Three equal-width tracks. `minmax(0, 1fr)` lets long German titles
// wrap inside the card without forcing the row to overflow horizontally.
.book-grid
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 8px

.book-card
  position: relative
  display: flex
  flex-direction: column
  gap: 6px
  cursor: pointer
  background: $cream-card
  border: 1px solid $border
  border-radius: 14px
  padding: 6px 6px 10px
  min-width: 0
  width: 100%
  box-shadow: 0 6px 16px -10px rgba(58, 42, 18, 0.3)
  transition: transform 180ms ease-out, box-shadow 180ms ease-out

  &:hover
    transform: translateY(-3px)
    box-shadow: 0 12px 22px -10px rgba(212, 168, 62, 0.4)

  &:active
    transform: scale(0.98)

  &.is-soon
    .book-card-img-wrap
      filter: grayscale(0.85)
      opacity: 0.75

// Image well sized to the actual book-cover aspect (3:4 portrait). The
// `padding-bottom: 133.333%` trick is the legacy bulletproof way to lock
// a box's height to a percentage of its width — it computes BEFORE any
// `aspect-ratio` support is required, so cache-busted older builds,
// quirky browser engines (looking at you, Tauri WebView), and the few
// platforms that still don't honour `aspect-ratio` on grid items all
// render the well at the right size. `aspect-ratio` stays as a hint for
// future stylesheets but is no longer load-bearing.
.book-card-img-wrap
  position: relative
  display: block
  width: 100%
  height: 0
  padding-bottom: 133.333%
  aspect-ratio: 3 / 4
  border-radius: 10px
  overflow: hidden
  background: linear-gradient(160deg, #f3e6c4 0%, #e8d29a 100%)
  border: 1px solid $border

.book-card-img
  position: absolute
  inset: 0
  width: 100% !important
  height: 100% !important
  max-width: 100%
  max-height: 100%
  object-fit: cover
  display: block

.book-card-meta
  display: flex
  flex-direction: column
  align-items: center
  gap: 2px
  padding: 4px 2px 0
  text-align: center

.book-card-band
  font-size: 12px
  font-weight: 900
  color: $navy
  letter-spacing: 0.01em
  line-height: 1.15

.book-card-title
  font-size: 11px
  font-weight: 800
  color: $navy
  margin: 0
  line-height: 1.2
  display: -webkit-box
  -webkit-line-clamp: 2
  -webkit-box-orient: vertical
  overflow: hidden

.book-card-progress
  display: flex
  align-items: center
  gap: 6px
  margin-top: 6px
  width: 100%

.book-card-progress-track
  flex: 1
  height: 6px
  background: rgba(0, 0, 0, 0.08)
  border-radius: 999px
  overflow: hidden

.book-card-progress-fill
  height: 100%
  background: linear-gradient(90deg, #4a7332 0%, #6da045 100%)
  border-radius: inherit

.book-card-progress-label
  font-size: 10px
  font-weight: 900
  color: #4a7332
  font-variant-numeric: tabular-nums

.book-card-soon, .book-card-new-tag
  font-size: 11px
  font-weight: 800
  color: $brown
  margin-top: 4px

.book-card-new-tag
  color: $gold

.empty-card
  text-align: center
  background: $cream-card
  border: 1px dashed $border
  border-radius: 18px
  padding: 28px 18px
  color: $brown
  font-size: 14px

// ===== Mobile landscape =====
.is-landscape
  .hero
    max-height: 220px
    aspect-ratio: 16 / 6

  .content
    max-width: 64rem
    grid-template-columns: 1fr 1fr

  .book-grid
    grid-template-columns: repeat(4, 1fr)
</style>
