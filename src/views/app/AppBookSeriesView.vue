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
const route = useRoute()
const router = useRouter()
const { getSeries } = useModels()
const apiBooks = useApiBooks()

onMounted(() => {
  void apiBooks.loadAllBooks()
})

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))
const seriesId = computed(() => String(route.params.seriesId))
const series = computed(() => getSeries(seriesId.value))
const books = computed<ApiBook[]>(() => {
  // Recompute when state.all changes; booksOfSeries reads from state.all.
  void apiBooks.state.all
  return apiBooks.booksOfSeries(seriesId.value)
})

function localizedTitle(book: ApiBook): string {
  return book.localizations?.[lang.value]?.title || book.localizations?.de?.title || ''
}

const navItems = computed(() => [
  { id: 'home', label: t('app.nav.home'), icon: 'home' as const },
  { id: 'series', label: t('app.nav.series'), icon: 'series' as const },
  { id: 'brush', label: t('app.nav.color'), icon: 'brush' as const },
  { id: 'profile', label: t('app.nav.profile'), icon: 'profile' as const }
])
const activeNav = computed<string | number>(() => {
  const name = String(route.name || '')
  if (name === 'app-main') return 'home'
  if (name === 'app-all-books' || name === 'app-book' || name === 'app-book-series') return 'series'
  if (name === 'app-awards') return 'brush'
  if (name === 'app-profile') return 'profile'
  return 'home'
})

function onNav(id: string | number) {
  if (id === 'home') router.push({ name: 'app-main' })
  if (id === 'series') router.push({ name: 'app-all-books' })
  if (id === 'profile') router.push({ name: 'app-profile' })
  if (id === 'brush') router.push({ name: 'app-awards' })
}

function openBook(bookId: string) {
  router.push({ name: 'app-book', params: { bookId } })
}

function isNew(iso: string) {
  return Date.now() - new Date(iso).getTime() < 1000 * 60 * 60 * 24 * 90
}
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full")
    AHeader(
      :greeting="t('app.bookSeries.title')"
      :title="series?.name || '—'"
      :show-action="false"
    )

    section(v-if="series" class="section-wrap mt-6")
      ABreadcrumbs(:label="t('app.bookSeries.overview')")
      p(class="series-desc mt-2") {{ series.description }}

    section(class="section-wrap mt-6")
      div(class="flex flex-col gap-3")
        ACard(
          v-for="(book, idx) in books"
          :key="book.bookId"
          :title="localizedTitle(book)"
          :category="`#${idx + 1}`"
          :tags="['5 min', 'Alter 4-8']"
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
              ABadge(
                v-if="isNew(book.releaseDate)"
                variant="new"
                position="top-left"
                label="NEU"
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

.series-desc
  color: var(--color-text-secondary)
  line-height: 1.55
</style>
