<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ZBottomNav from '@/components/atoms/ZBottomNav.vue'
import ZButton from '@/components/atoms/ZButton.vue'
import ZBadge from '@/components/atoms/ZBadge.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'
import AvatarPickerModal from '@/components/molecules/AvatarPickerModal.vue'
import useModels from '@/use/useModels'
import useApiBooks from '@/use/useApiBooks'
import useReadingProgress from '@/use/useReadingProgress'
import useAppNav from '@/use/useAppNav'
import useAvatar, { onAvatarFallback } from '@/use/useAvatar'
import { isMobileLandscape, isMobilePortrait } from '@/use/useUser'
import type { ApiBook, Locale } from '@/types/apiBook'
import { pickLocalizedImage } from '@/types/apiBook'
import { onImgFallback, withPlaceholder } from '@/utils/placeholder'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const { lastReadId, getSeriesOfBook } = useModels()
const apiBooks = useApiBooks()
const { getPct } = useReadingProgress()
const { navItems, activeNav, onNav } = useAppNav(t)
const { avatarSrc } = useAvatar()

const searchQuery = ref('')

onMounted(() => {
  void apiBooks.loadAllBooks()
})

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))

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

function currentPage(book: ApiBook): number {
  const total = pageCount(book)
  return Math.max(1, Math.round(progressPct(book) * total))
}

function openBook(bookId: string) {
  router.push({ name: 'app-book', params: { bookId } })
}

function openReader(bookId: string) {
  router.push({ name: 'app-reader', params: { bookId } })
}

// Deep-link into the BookDetail view's audio player. The detail view
// auto-switches into listen mode when it sees the `mode=listen` query.
function openListen(bookId: string) {
  router.push({ name: 'app-book', params: { bookId }, query: { mode: 'listen' } })
}

function openAllNew() {
  router.push({ name: 'app-all-new-books' })
}

function openAllSeries() {
  router.push({ name: 'app-all-books' })
}

const allBooks = computed<ApiBook[]>(() => (apiBooks.state.all ?? []) as ApiBook[])

const lastReadBook = computed<ApiBook | null>(() =>
  lastReadId.value ? apiBooks.getById(lastReadId.value) : null
)

const THREE_MONTHS_MS = 1000 * 60 * 60 * 24 * 90

// "Neu in der Bibliothek" — books published in the last 3 months. The
// design shows a swipable horizontal row of full-height portrait covers.
const newReleases = computed<ApiBook[]>(() => {
  const now = Date.now()
  return allBooks.value
    .filter((b) => now - new Date(b.releaseDate).getTime() < THREE_MONTHS_MS)
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
})

// "Demnächst" — placeholder bucket for upcoming books. Until the API
// exposes an explicit `comingSoon` flag we surface unreleased books or
// fall back to the oldest entries so the row never collapses.
const upcomingBooks = computed<ApiBook[]>(() => {
  const now = Date.now()
  return allBooks.value
    .filter((b) => new Date(b.releaseDate).getTime() > now)
    .slice(0, 6)
})

// Continue-reading hero gating: only show when we have something to resume
const showContinueReading = computed(() => !!lastReadBook.value)

// Greeting line. The design shows a personalised salute — until we have a
// real "name" field we fall back to the i18n default.
const greeting = computed(() => t('app.main.hello'))

const avatarOpen = ref(false)

function openAvatarPicker() {
  avatarOpen.value = true
}

function closeAvatarPicker() {
  avatarOpen.value = false
}

const layoutClass = computed(() => {
  if (isMobileLandscape.value) return 'is-landscape'
  if (isMobilePortrait.value) return 'is-portrait'
  return 'is-default'
})

const ENABLE_MISSION_OF_DAY = false
</script>

<template lang="pug">
  div(:class="['app-main', layoutClass, 'min-h-screen w-full pb-32']")
    //- ===== Header bar — centered crown + banner; bell · avatar pinned to the right =====
    header(class="main-header")
      div(class="main-header-inner")
        //- Brand: stacked crown over LambKing banner, centered
        div(class="brand-stack")
          img(
            src="/images/icons/crown_256x256.webp"
            alt="LambKing"
            class="brand-crown"
            decoding="async"
          )
          img(
            src="/images/logo/banner_500x116.webp"
            alt="LambKing Stories"
            class="brand-banner -ml-8"
            decoding="async"
          )

        //- Right-aligned actions — anchored absolutely so they don't
        //- push the centered brand stack off-axis.
        div(class="header-actions")
          button(
            type="button"
            class="header-icon-btn"
            aria-label="Notifications"
          )
            ZIconography(name="bell" :size="22")
          button(
            type="button"
            class="header-avatar-btn"
            :aria-label="t('app.profile.chooseAvatar')"
            @click="openAvatarPicker"
          )
            img(
              :src="avatarSrc"
              alt="Profile"
              class="header-avatar-img"
              @error="onAvatarFallback"
            )

        //- Greeting headline
        div(class="greeting-block")
          h1(class="greeting-title") {{ greeting }}
          p(class="greeting-sub") {{ t('app.main.subtitle') }}

        //- Search field
        label(class="search-field")
          ZIconography(name="search" :size="18")
          input(
            type="text"
            v-model="searchQuery"
            :placeholder="t('app.main.searchPlaceholder')"
            class="search-input"
            autocomplete="off"
          )

    div(class="main-content")
      //- ===== Continue reading hero =====
      section(v-if="showContinueReading && lastReadBook" class="continue-section")
        div(class="continue-card")
          div(class="continue-row")
            //- Full-height portrait preview (3:4, height is the limit)
            div(
              class="continue-thumb"
              @click="openBook(lastReadBook.bookId)"
            )
              img(
                :src="withPlaceholder(pickLocalizedImage(lastReadBook.previewImage, lang))"
                :alt="localizedTitle(lastReadBook)"
                class="continue-thumb-img"
                loading="lazy"
                @error="onImgFallback"
              )
            div(class="continue-meta")
              //- Badge sits in its own row above the cover/title so it never
              //- overlaps the heading on narrow viewports.
              div(class="continue-badge-row mb-0")
                ZBadge(
                  variant="hot"
                  position="static"
                  size="md"
                  class="continue-badge"
                  :label="t('app.main.newReleased')"
                )
              span(class="continue-series") {{ getSeriesOfBook(lastReadBook.bookId)?.name }}
              h2(class="continue-title") {{ localizedTitle(lastReadBook) }}
              span(
                v-if="pageCount(lastReadBook) > 0"
                class="continue-page"
              ) {{ t('app.main.page', { n: currentPage(lastReadBook), total: pageCount(lastReadBook) }) }}
              div(class="continue-cta")
                ZButton(type="primary" icon="book" size="sm" @click="openReader(lastReadBook.bookId)") {{ t('app.bookDetail.readMyself') }}
                ZButton(
                  type="secondary"
                  icon="volume"
                  size="sm"
                  @click="openListen(lastReadBook.bookId)"
                ) {{ t('app.bookDetail.listen') }}

      //- ===== Weiterlesen (saved progress) =====
      section(
        v-if="lastReadBook && progressPct(lastReadBook) > 0"
        class="resume-section"
      )
        h3(class="section-title") Weiterlesen
        div(
          class="resume-card"
          @click="openReader(lastReadBook.bookId)"
        )
          //- Full-height 3:4 preview — height is the limit so the image is
          //- never cropped. Background fills the side slack with parchment.
          div(class="resume-thumb")
            img(
              :src="withPlaceholder(pickLocalizedImage(lastReadBook.previewImage, lang))"
              :alt="localizedTitle(lastReadBook)"
              class="resume-thumb-img"
              loading="lazy"
              @error="onImgFallback"
            )
          div(class="resume-meta")
            span(class="resume-title") {{ localizedTitle(lastReadBook) }}
            span(class="resume-page") {{ t('app.main.page', { n: currentPage(lastReadBook), total: pageCount(lastReadBook) }) }}
            div(class="resume-progress-row")
              div(class="resume-progress-track")
                div(
                  class="resume-progress-fill"
                  :style="{ width: Math.round(progressPct(lastReadBook) * 100) + '%' }"
                )
              span(class="resume-progress-pct") {{ Math.round(progressPct(lastReadBook) * 100) }}%
            div(class="resume-cta-row")
              ZButton(type="primary" icon="none" size="sm" @click.stop="openReader(lastReadBook.bookId)") {{ t('app.main.continue') }}

      //- ===== Neu in der Bibliothek =====
      section(v-if="newReleases.length" class="new-section")
        div(class="section-head")
          h3(class="section-title") {{ t('app.main.newInLibrary') }}
          button(
            type="button"
            class="see-all-link"
            @click="openAllNew"
          )
            span {{ t('app.main.seeAll') }}
            ZIconography(name="chevron-right" :size="14")

        div(class="new-row")
          div(
            v-for="book in newReleases"
            :key="book.bookId"
            class="new-tile"
            @click="openBook(book.bookId)"
          )
            div(class="new-tile-img-wrap")
              img(
                :src="withPlaceholder(pickLocalizedImage(book.previewImage, lang))"
                :alt="localizedTitle(book)"
                class="new-tile-img"
                loading="lazy"
                @error="onImgFallback"
              )
              //ZBadge(
              //  variant="new"
              //  size="sm"
              //  position="top-left"
              //  :label="t('app.bookSeries.new').toUpperCase()"
              //)
            span(class="new-tile-title") {{ localizedTitle(book) }}

      //- ===== Demnächst =====
      section(v-if="upcomingBooks.length" class="upcoming-section")
        div(class="section-head")
          h3(class="section-title") {{ t('app.main.upcoming') }}
          button(
            type="button"
            class="see-all-link"
            @click="openAllSeries"
          )
            span {{ t('app.main.seeAll') }}
            ZIconography(name="chevron-right" :size="14")

        div(class="upcoming-row")
          div(
            v-for="book in upcomingBooks"
            :key="book.bookId"
            class="upcoming-tile"
            @click="openBook(book.bookId)"
          )
            div(class="upcoming-tile-img-wrap")
              img(
                :src="withPlaceholder(pickLocalizedImage(book.previewImage, lang))"
                :alt="localizedTitle(book)"
                class="upcoming-tile-img"
                loading="lazy"
                @error="onImgFallback"
              )
            span(class="upcoming-tile-title") {{ localizedTitle(book) }}

      //- ===== Mission of the Day — built but hidden until gamification
      //-       lands. Flip ENABLE_MISSION_OF_DAY to true once ready. =====
      section(v-if="ENABLE_MISSION_OF_DAY" class="mission-section")
        div(class="mission-card")
          div(class="mission-text")
            div(class="mission-eyebrow")
              ZIconography(name="star" :size="14")
              span {{ t('app.main.missionOfDay') }}
            p(class="mission-body") {{ t('app.main.missionSub') }}
            ZButton(type="secondary" icon="none" size="sm") {{ t('app.main.missionDone') }}
          div(class="mission-crest")
            ZIconography(name="crown" :size="78")

    ZBottomNav(:items="navItems" :model-value="activeNav" @update:model-value="onNav")

    AvatarPickerModal(:open="avatarOpen" @close="closeAvatarPicker")
</template>

<style scoped lang="sass">
$cream-bg: #f3e6c4
$cream-card: #fdf8ed
$cream-card-soft: #faf2dc
$navy: #1a2f4a
$navy-dark: #142a47
$gold: #d4a83e
$brown: #7a6b55
$border: #e6d6b5

button
  -webkit-tap-highlight-color: transparent

.app-main
  background: radial-gradient(ellipse at top, #faf2dc 0%, #f3e6c4 60%, #e8d29a 100%)
  color: $navy

// ===== Header =====
.main-header
  position: relative
  padding-top: max(env(safe-area-inset-top), 0.75rem)
  padding-bottom: 12px

.main-header-inner
  position: relative
  max-width: 28rem
  margin: 0 auto
  padding: 0 20px

// Crown + banner stacked, centered. Reserves enough vertical room so
// the absolutely-positioned actions on the right don't crowd the brand.
.brand-stack
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 2px

.brand-crown
  width: 44px
  height: auto
  object-fit: contain
  filter: drop-shadow(0 3px 6px rgba(58, 42, 18, 0.3))

.brand-banner
  width: 168px
  max-width: 60vw
  height: auto
  object-fit: contain
  filter: drop-shadow(0 2px 4px rgba(58, 42, 18, 0.2))

// Pinned to the top-right of the header so the centered brand stack
// keeps its true horizontal centre even when one icon is hidden.
.header-actions
  position: absolute
  top: 0
  right: 20px
  display: flex
  align-items: center
  gap: 8px

.header-icon-btn
  width: 38px
  height: 38px
  border-radius: 999px
  background-color: rgba(255, 255, 255, 0.6)
  border: 1px solid $border
  color: $navy
  display: inline-flex
  align-items: center
  justify-content: center
  cursor: pointer
  transition: transform 150ms ease-out, background-color 150ms ease-out

  &:hover
    background-color: #ffffff
    transform: translateY(-1px)

  &:active
    transform: scale(0.95)

.header-avatar-btn
  width: 42px
  height: 42px
  border-radius: 999px
  overflow: hidden
  border: 2.5px solid $gold
  background: linear-gradient(160deg, #f3e6c4 0%, #e8d29a 100%)
  cursor: pointer
  box-shadow: 0 4px 12px -4px rgba(212, 168, 62, 0.5)
  transition: transform 160ms ease-out, box-shadow 160ms ease-out
  padding: 0

  &:hover
    transform: translateY(-1px) scale(1.04)
    box-shadow: 0 8px 18px -6px rgba(212, 168, 62, 0.6)

  &:active
    transform: scale(0.95)

.header-avatar-img
  width: 100%
  height: 100%
  object-fit: cover

// ===== Greeting =====
.greeting-block
  margin-top: 14px
  text-align: center

.greeting-title
  font-size: 26px
  font-weight: 900
  color: $navy
  letter-spacing: -0.01em
  line-height: 1.1

.greeting-sub
  margin-top: 4px
  font-size: 13px
  color: $brown

// ===== Search =====
.search-field
  margin-top: 14px
  display: flex
  align-items: center
  gap: 10px
  padding: 12px 16px
  background-color: $cream-card
  border: 1px solid $border
  border-radius: 14px
  box-shadow: 0 2px 6px -2px rgba(58, 42, 18, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)
  color: $brown

.search-input
  flex: 1
  background: transparent
  border: none
  outline: none
  font-size: 14px
  color: $navy
  font-family: inherit

  &::placeholder
    color: $brown
    font-weight: 500

// ===== Layout container =====
.main-content
  max-width: 28rem
  margin: 0 auto
  padding: 0 20px

.section-head
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px
  margin-bottom: 10px

.section-title
  font-size: 17px
  font-weight: 900
  color: $navy
  letter-spacing: -0.005em

.see-all-link
  display: inline-flex
  align-items: center
  gap: 4px
  font-size: 12px
  font-weight: 800
  color: $navy
  background: transparent
  border: none
  cursor: pointer
  padding: 0
  transition: transform 150ms ease-out, color 150ms ease-out

  &:hover
    color: $gold
    transform: translateX(2px)

  &:active
    transform: scale(0.96)

// ===== Continue / Hero card =====
.continue-section
  margin-top: 16px

.continue-card
  position: relative
  background: linear-gradient(180deg, #233a5e 0%, #11283a 100%)
  border-radius: 10px
  padding: 6px
  box-shadow: 0 14px 32px -14px rgba(10, 26, 48, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.1)
  overflow: hidden

// Badge gets its own row so it never overlaps the title on narrow
// viewports. Aligned to the start of the card so the cover/title row
// below reads as the primary content.
.continue-badge-row
  display: flex
  justify-content: flex-start

// "NEU ERSCHIENEN" tag — tighter corners + darker wine red so it sits
// against the navy hero rather than blending into the rounded card.
:deep(.continue-badge)
  border-radius: 6px
  background: linear-gradient(180deg, #a93d2e 0%, #7a2a1f 100%)
  border-color: #4a160e
  box-shadow: 0 3px 0 -1px #4a160e, 0 6px 14px -4px rgba(74, 22, 14, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.18)

.continue-row
  display: flex
  align-items: stretch
  gap: 14px

.continue-thumb
  flex: 0 0 auto
  width: 110px
  aspect-ratio: 3 / 4
  border-radius: 8px
  overflow: hidden
  background: linear-gradient(160deg, #f3e6c4 0%, #e8d29a 100%)
  cursor: pointer
  box-shadow: 0 6px 18px -6px rgba(0, 0, 0, 0.45)
  transition: transform 180ms ease-out

  &:hover
    transform: translateY(-2px) scale(1.02)

.continue-thumb-img
  width: 100%
  height: 100%
  object-fit: cover

.continue-meta
  flex: 1
  min-width: 0
  display: flex
  flex-direction: column
  gap: 4px
  color: #ffffff

.continue-series
  font-size: 11px
  font-weight: 800
  text-transform: uppercase
  letter-spacing: 0.16em
  color: #d4a83e

.continue-title
  font-size: 18px
  font-weight: 900
  line-height: 1.15
  margin: 0
  color: #ffffff
  display: -webkit-box
  -webkit-line-clamp: 2
  -webkit-box-orient: vertical
  overflow: hidden

.continue-page
  font-size: 11px
  color: rgba(255, 255, 255, 0.7)
  margin-top: 2px

.continue-cta
  margin-top: auto
  display: flex
  gap: 8px
  flex-wrap: wrap

.continue-cta > div
  flex: 1
  min-width: 100px

// ===== Weiterlesen resume card =====
.resume-section
  margin-top: 20px

.resume-card
  position: relative
  display: flex
  gap: 14px
  align-items: stretch
  background-color: $cream-card
  border: 1px solid $border
  border-radius: 12px
  padding: 12px
  cursor: pointer
  box-shadow: 0 8px 22px -10px rgba(58, 42, 18, 0.3)
  transition: transform 180ms ease-out, box-shadow 180ms ease-out

  &:hover
    transform: translateY(-2px)
    box-shadow: 0 14px 28px -10px rgba(212, 168, 62, 0.35)

.resume-thumb
  flex: 0 0 auto
  width: 88px
  aspect-ratio: 3 / 4
  border-radius: 12px
  overflow: hidden
  background: $cream-card-soft
  display: flex
  align-items: center
  justify-content: center

.resume-thumb-img
  height: 100%
  width: auto
  max-width: 100%
  object-fit: contain

.resume-meta
  flex: 1
  min-width: 0
  display: flex
  flex-direction: column
  gap: 4px

.resume-title
  font-size: 15px
  font-weight: 900
  color: $navy
  line-height: 1.15
  display: -webkit-box
  -webkit-line-clamp: 2
  -webkit-box-orient: vertical
  overflow: hidden

.resume-page
  font-size: 11px
  color: $brown

.resume-progress-row
  display: flex
  align-items: center
  gap: 8px
  margin-top: 4px

.resume-progress-track
  flex: 1
  height: 8px
  background-color: rgba(0, 0, 0, 0.08)
  border-radius: 999px
  overflow: hidden

.resume-progress-fill
  height: 100%
  background: linear-gradient(90deg, #c89030 0%, #d4a83e 100%)
  border-radius: inherit
  transition: width 240ms ease-out

.resume-progress-pct
  font-size: 11px
  font-weight: 800
  color: $navy
  font-variant-numeric: tabular-nums

.resume-cta-row
  margin-top: 6px

// ===== Neu in der Bibliothek (swipable row) =====
.new-section
  margin-top: 24px

.new-row
  display: flex
  gap: 12px
  overflow-x: auto
  overflow-y: hidden
  scroll-snap-type: x mandatory
  -webkit-overflow-scrolling: touch
  padding-bottom: 6px
  margin-left: -20px
  margin-right: -20px
  padding-left: 20px
  padding-right: 20px

  &::-webkit-scrollbar
    display: none

.new-tile
  flex: 0 0 28%
  min-width: 96px
  max-width: 130px
  scroll-snap-align: start
  cursor: pointer
  display: flex
  flex-direction: column
  gap: 6px

.new-tile-img-wrap
  position: relative
  width: 100%
  aspect-ratio: 3 / 4
  border-radius: 12px
  overflow: hidden
  background: $cream-card-soft
  display: flex
  align-items: center
  justify-content: center
  border: 1px solid $border
  box-shadow: 0 6px 14px -8px rgba(58, 42, 18, 0.35)
  transition: transform 180ms ease-out

.new-tile:hover .new-tile-img-wrap
  transform: translateY(-3px)

.new-tile-img
  height: 100%
  width: auto
  max-width: 100%
  object-fit: contain

.new-tile-title
  font-size: 11px
  font-weight: 800
  color: $navy
  line-height: 1.25
  display: -webkit-box
  -webkit-line-clamp: 2
  -webkit-box-orient: vertical
  overflow: hidden

// ===== Demnächst row =====
.upcoming-section
  margin-top: 22px

.upcoming-row
  display: grid
  grid-template-columns: repeat(3, 1fr)
  gap: 12px

.upcoming-tile
  cursor: pointer
  display: flex
  flex-direction: column
  gap: 6px

.upcoming-tile-img-wrap
  position: relative
  width: 100%
  aspect-ratio: 3 / 4
  border-radius: 12px
  overflow: hidden
  background: $cream-card-soft
  display: flex
  align-items: center
  justify-content: center
  border: 1px solid $border
  filter: grayscale(0.25)
  opacity: 0.85
  transition: transform 180ms ease-out, opacity 180ms ease-out

.upcoming-tile:hover .upcoming-tile-img-wrap
  transform: translateY(-3px)
  opacity: 1

.upcoming-tile-img
  height: 100%
  width: auto
  max-width: 100%
  object-fit: contain

.upcoming-tile-title
  font-size: 11px
  font-weight: 700
  color: $brown
  line-height: 1.25
  display: -webkit-box
  -webkit-line-clamp: 2
  -webkit-box-orient: vertical
  overflow: hidden

// ===== Mission of the day =====
.mission-section
  margin-top: 26px

.mission-card
  position: relative
  display: flex
  align-items: center
  gap: 14px
  background: linear-gradient(160deg, #fdf8ed 0%, #f3e6c4 100%)
  border: 1.5px solid $border
  border-radius: 12px
  padding: 18px
  box-shadow: 0 12px 28px -14px rgba(58, 42, 18, 0.3)

.mission-text
  flex: 1
  min-width: 0
  display: flex
  flex-direction: column
  gap: 8px

.mission-eyebrow
  display: inline-flex
  align-items: center
  gap: 6px
  font-size: 11px
  font-weight: 900
  letter-spacing: 0.16em
  text-transform: uppercase
  color: $gold

.mission-body
  font-size: 13px
  color: $navy
  line-height: 1.4
  margin: 0

.mission-crest
  flex: 0 0 auto
  filter: drop-shadow(0 6px 12px rgba(58, 42, 18, 0.3))

// ===== Mobile-landscape adaptation =====
.is-landscape
  .main-content
    max-width: 64rem
    display: grid
    grid-template-columns: 1fr 1fr
    column-gap: 22px
    row-gap: 0
    padding: 0 28px

  .continue-section
    grid-column: 1 / -1
    margin-top: 12px

  // The card spans the full grid row but its content stays compact:
  // capped meta column, CTAs forced into a single row at their natural
  // size instead of overflowing the card right edge.
  .continue-card
    padding: 14px 18px
    overflow: hidden

  .continue-row
    align-items: center
    gap: 18px

  .continue-thumb
    width: 110px
    height: 146px

  .continue-meta
    gap: 6px
    max-width: 100%
    min-width: 0

  .continue-cta
    flex-wrap: nowrap
    gap: 10px
    width: 100%
    max-width: 360px

  .continue-cta > :deep(div)
    flex: 1 1 0
    min-width: 0
    transform: none !important
    width: auto

  .continue-cta :deep(.z-button)
    min-width: 0
    width: 100%
    padding-left: 14px
    padding-right: 14px

  .resume-section
    grid-column: 1
    margin-top: 16px

  .new-section
    grid-column: 2
    margin-top: 16px

  .upcoming-section
    grid-column: 1 / -1

  .main-header-inner
    max-width: 64rem
    padding: 0 28px

  .header-actions
    right: 28px

  .greeting-block
    text-align: left
    margin-top: 6px

  .greeting-title
    font-size: 22px

  .new-row
    margin-left: 0
    margin-right: 0
    padding-left: 0
    padding-right: 0

  .new-tile
    flex: 0 0 22%

@media (min-width: 700px)
  .upcoming-row
    grid-template-columns: repeat(4, 1fr)

  .new-tile
    flex: 0 0 18%
</style>
