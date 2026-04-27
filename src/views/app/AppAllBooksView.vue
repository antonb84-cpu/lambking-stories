<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AHeader from '@/components/atoms/AHeader.vue'
import ACard from '@/components/atoms/ACard.vue'
import ABadge from '@/components/atoms/ABadge.vue'
import ABreadcrumbs from '@/components/atoms/ABreadcrumbs.vue'
import ABottomNav from '@/components/atoms/ABottomNav.vue'
import useModels from '@/use/useModels'
import useApiBooks from '@/use/useApiBooks'
import type { ApiBook, Locale } from '@/types/apiBook'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const route = useRoute()
const { getSeriesOfBook } = useModels()
const apiBooks = useApiBooks()

onMounted(() => {
  void apiBooks.loadAllBooks()
})

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))

function localizedTitle(book: ApiBook): string {
  return book.localizations?.[lang.value]?.title || book.localizations?.de?.title || ''
}

function routeToNav(name: string): string {
  if (name === 'app-main') return 'home'
  if (name === 'app-all-books' || name === 'app-book' || name === 'app-book-series') return 'series'
  if (name === 'app-awards' || name === 'app-coloring') return 'brush'
  if (name === 'app-profile') return 'profile'
  return 'home'
}

const navItems = computed(() => [
  { id: 'home', label: t('app.nav.home'), icon: 'home' as const },
  { id: 'series', label: t('app.nav.series'), icon: 'series' as const },
  { id: 'brush', label: t('app.nav.color'), icon: 'brush' as const },
  { id: 'profile', label: t('app.nav.profile'), icon: 'profile' as const }
])
const activeNav = computed<string | number>(() => routeToNav(String(route.name || '')))

function onNav(id: string | number) {
  if (id === 'home') router.push({ name: 'app-main' })
  if (id === 'series') router.push({ name: 'app-all-books' })
  if (id === 'profile') router.push({ name: 'app-profile' })
  if (id === 'brush') router.push({ name: 'app-coloring' })
}

function openBook(bookId: string) {
  router.push({ name: 'app-book', params: { bookId } })
}

const allBooks = computed<ApiBook[]>(() => {
  const list = (apiBooks.state.all ?? []) as ApiBook[]
  return [...list].sort(
    (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  )
})

function isNew(isoDate: string) {
  const released = new Date(isoDate).getTime()
  return Date.now() - released < 1000 * 60 * 60 * 24 * 90
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
      :greeting="t('app.allBooks.hello')"
      :title="t('app.allBooks.title')"
      :action-label="t('app.allBooks.unlock')"
      @action="() => {}"
    )

    section(class="section-wrap mt-6")
      ABreadcrumbs(:label="t('app.allBooks.allStories')")
      div(class="flex items-center justify-between gap-3 mt-2")
        h2(class="releases-title text-xl md:text-2xl font-black") {{ t('app.allBooks.newReleases') }}
        span(class="count-pill") {{ allBooks.length }}

      div(class="mt-3 flex flex-col gap-3")
        ACard(
          v-for="book in allBooks"
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

    section(class="section-wrap mt-8")
      h2(class="releases-title text-xl md:text-2xl font-black mb-3") {{ t('app.allBooks.allStories') }}
      div(class="grid grid-cols-2 gap-3")
        ACard(
          v-for="book in allBooks"
          :key="`grid-${book.bookId}`"
          layout="vertical"
          :title="localizedTitle(book)"
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

.count-pill
  display: inline-block
  font-size: 11px
  font-weight: 800
  letter-spacing: 0.1em
  text-transform: uppercase
  color: var(--color-text-link)
  background-color: var(--color-bg-active-pill)
  padding: 6px 12px
  border-radius: 999px

.a-card a-badge.new-badge:deep(.a-badge-top-left)
  top: 2px !important
  left: 5px
</style>
