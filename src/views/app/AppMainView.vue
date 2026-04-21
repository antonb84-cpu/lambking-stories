<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AHeader from '@/components/atoms/AHeader.vue'
import ACard from '@/components/atoms/ACard.vue'
import ABadge from '@/components/atoms/ABadge.vue'
import APlayer from '@/components/atoms/APlayer.vue'
import APlayButton from '@/components/atoms/APlayButton.vue'
import ABreadcrumbs from '@/components/atoms/ABreadcrumbs.vue'
import ABottomNav from '@/components/atoms/ABottomNav.vue'
import useModels from '@/use/useModels'
import useApiBooks from '@/use/useApiBooks'
import useReadingProgress from '@/use/useReadingProgress'
import type { ApiBook, Locale } from '@/types/apiBook'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const route = useRoute()
const { lastReadId, getSeriesOfBook } = useModels()
const apiBooks = useApiBooks()
const { getPct } = useReadingProgress()

// Warm the API store so the reader and detail views can fetch from cache
// instantly on first navigation. Failures are silently absorbed by the store.
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

function progressPctLabel(book: ApiBook): string {
  return `${Math.round(progressPct(book) * 100)}%`
}

const navItems = computed(() => [
  { id: 'home', label: t('app.nav.home'), icon: 'home' as const },
  { id: 'series', label: t('app.nav.series'), icon: 'series' as const },
  { id: 'brush', label: t('app.nav.color'), icon: 'brush' as const },
  { id: 'profile', label: t('app.nav.profile'), icon: 'profile' as const }
])

const activeNav = computed<string | number>(() => routeToNav(String(route.name || '')))

function routeToNav(name: string): string {
  if (name === 'app-main') return 'home'
  if (name === 'app-all-books' || name === 'app-book' || name === 'app-book-series') return 'series'
  if (name === 'app-awards') return 'brush'
  if (name === 'app-profile') return 'profile'
  return 'home'
}

function onNav(id: string | number) {
  if (id === 'home') router.push({ name: 'app-main' })
  if (id === 'series') router.push({ name: 'app-all-books' })
  if (id === 'profile') router.push({ name: 'app-profile' })
  if (id === 'brush') router.push({ name: 'app-awards' })
}

function openBook(bookId: string) {
  router.push({ name: 'app-book', params: { bookId } })
}

function openAll() {
  router.push({ name: 'app-all-books' })
}

const allBooks = computed<ApiBook[]>(() => (apiBooks.state.all ?? []) as ApiBook[])

const lastReadBook = computed<ApiBook | null>(() =>
  lastReadId.value ? apiBooks.getById(lastReadId.value) : null
)

const lastReadSeries = computed(() => {
  if (!lastReadBook.value) return null
  return getSeriesOfBook(lastReadBook.value.bookId) ?? null
})

const continueProgress = computed(() =>
  lastReadBook.value ? progressPct(lastReadBook.value) : 0
)

const newReleases = computed<ApiBook[]>(() =>
  [...allBooks.value]
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
    .slice(0, 6)
)

function isNew(isoDate: string) {
  const released = new Date(isoDate).getTime()
  const now = Date.now()
  return now - released < 1000 * 60 * 60 * 24 * 90 // within 90 days
}

function tagsForBook(b: ApiBook) {
  const series = getSeriesOfBook(b.bookId)
  const base = ['5 min', 'Alter 4-8']
  if (series) base.push(series.name)
  return base
}
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full")
    AHeader(
      :greeting="t('app.main.hello')"
      :title="t('app.main.home')"
      :action-label="t('app.main.unlock')"
      @action="() => {}"
    )

    //- Continue listening
    section(
      v-if="lastReadBook"
      class="section-wrap mt-6"
    )
      ABreadcrumbs(:label="t('app.main.continueListening')")
      div(class="mt-2 px-2")
        ACard(
          :title="localizedTitle(lastReadBook)"
          :category="lastReadSeries?.name || t('app.main.continueReading')"
          @click="openBook(lastReadBook.bookId)"
        )
          template(#image)
            div(class="relative w-full h-full")
              div(
                class="absolute inset-0"
                :style="{ background: lastReadBook.cover || 'linear-gradient(135deg,#9560f4,#7e3af2)' }"
              )
              img(
                v-if="lastReadBook.previewImage || lastReadBook.coverImage"
                :src="lastReadBook.previewImage || lastReadBook.coverImage"
                :alt="localizedTitle(lastReadBook)"
                class="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              )
          template(#badge)
            ABadge.new-badge(
              v-if="isNew(lastReadBook.releaseDate)"
              variant="new"
              position="top-left"
              label="NEU"
              size="sm"
            )
          div(class="flex items-center gap-2 mt-1.5 w-full")
            div(class="flex-1 min-w-0")
              APlayer(:progress="continueProgress" :seekable="false")
            div(class="shrink-0" @click.stop)
              APlayButton(size="sm" @click="openBook(lastReadBook.bookId)")

    //- New releases
    section(class="section-wrap mt-8")
      div(class="flex items-center justify-between gap-3")
        h2(class="releases-title text-xl md:text-2xl font-black") {{ t('app.main.newReleases') }}
        button(
          type="button"
          class="all-link inline-flex items-center gap-1 text-sm md:text-base font-bold"
          @click="openAll"
        )
          | {{ t('app.main.seeAll') }}
          svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4")
            path(d="m9 6 6 6-6 6")

      div(class="mt-3 flex flex-col gap-3")
        ACard(
          v-for="book in newReleases"
          :key="book.bookId"
          :title="localizedTitle(book)"
          :category="getSeriesOfBook(book.bookId)?.name || book.author"
          :tags="tagsForBook(book)"
          @click="openBook(book.bookId)"
        )
          template(#image)
            div(class="relative w-full h-full")
              div(
                class="absolute inset-0"
                :style="{ background: book.cover || 'linear-gradient(135deg,#9560f4,#7e3af2)' }"
              )
              img(
                v-if="book.previewImage || book.coverImage"
                :src="book.previewImage || book.coverImage"
                :alt="localizedTitle(book)"
                class="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              )
              ABadge.new-badge(
                v-if="isNew(book.releaseDate)"
                variant="new"
                position="top-left"
                label="NEU"
                size="sm"
              )
          div(
            v-if="progressPct(book) > 0"
            class="card-progress mt-2"
            :aria-label="'Fortschritt ' + progressPctLabel(book)"
          )
            div(class="card-progress-track")
              div(
                class="card-progress-fill"
                :style="{ width: progressPctLabel(book) }"
              )

    div(class="h-32")
    ABottomNav(:items="navItems" :model-value="activeNav" @update:model-value="onNav")
</template>

<style scoped lang="sass">
.app-page
  background-color: var(--color-bg-main)
  color: var(--color-text-primary)

.section-wrap
  max-width: 42rem
  margin-left: auto
  margin-right: auto
  padding-left: 20px
  padding-right: 20px

.releases-title
  color: var(--color-text-primary)

.all-link
  color: var(--color-text-link)
  -webkit-tap-highlight-color: transparent

  &:hover
    transform: translateX(2px)
    transition: transform 180ms ease-out

:deep(.new-badge.a-badge-top-left)
  top: 4px !important
  left: 4px

.card-progress
  width: 100%

.card-progress-track
  height: 5px
  background: rgba(0, 0, 0, 0.08)
  border-radius: 999px
  overflow: hidden

.card-progress-fill
  height: 100%
  background: linear-gradient(90deg, #ffd645 0%, #ff8b3a 100%)
  border-radius: inherit
  transition: width 240ms ease-out
</style>
