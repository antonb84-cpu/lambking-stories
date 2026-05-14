<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ZBottomNav from '@/components/atoms/ZBottomNav.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'
import ZPlayButton from '@/components/atoms/ZPlayButton.vue'
import useApiBooks from '@/use/useApiBooks'
import useModels from '@/use/useModels'
import useAppNav from '@/use/useAppNav'
import { isMobileLandscape } from '@/use/useUser'
import type { ApiBook, Locale } from '@/types/apiBook'
import { pickLocalizedImage } from '@/types/apiBook'
import { onImgFallback, withPlaceholder } from '@/utils/placeholder'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const apiBooks = useApiBooks()
const { getSeriesOfBook } = useModels()
const { navItems, activeNav, onNav } = useAppNav(t)

onMounted(() => {
  void apiBooks.loadAllBooks()
})

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))

function localizedTitle(book: ApiBook): string {
  return book.localizations?.[lang.value]?.title || book.localizations?.de?.title || ''
}

function hasAudio(book: ApiBook): boolean {
  const a = book.audio
  if (!a) return false
  return Boolean(a[lang.value] || a.de || a.en)
}

const audioBooks = computed<ApiBook[]>(() =>
  ((apiBooks.state.all ?? []) as ApiBook[])
    .filter(hasAudio)
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
)

function openBook(bookId: string) {
  router.push({ name: 'app-book', params: { bookId } })
}
</script>

<template lang="pug">
  div(:class="['hoeren-page', isMobileLandscape ? 'is-landscape' : '', 'min-h-screen w-full pb-32']")
    header(class="page-header")
      div(class="title-cluster")
        h1(class="page-title")
          ZIconography(name="headphones" :size="26")
          span {{ t('app.hoeren.title') }}

    div(class="page-content")
      span(class="page-breadcrumb") {{ t('app.hoeren.breadcrumb') }}

      div(v-if="audioBooks.length" class="audio-list")
        div(
          v-for="book in audioBooks"
          :key="book.bookId"
          class="audio-row"
          @click="openBook(book.bookId)"
        )
          div(class="audio-thumb")
            img(
              :src="withPlaceholder(pickLocalizedImage(book.previewImage, lang))"
              :alt="localizedTitle(book)"
              class="audio-thumb-img"
              loading="lazy"
              @error="onImgFallback"
            )
          div(class="audio-meta")
            span(class="audio-series") {{ getSeriesOfBook(book.bookId)?.name }}
            h3(class="audio-title") {{ localizedTitle(book) }}
          div(class="audio-play" @click.stop="openBook(book.bookId)")
            ZPlayButton(size="sm")

      div(
        v-else
        class="empty-card"
      ) {{ t('app.hoeren.empty') }}

    ZBottomNav(:items="navItems" :model-value="activeNav" @update:model-value="onNav")
</template>

<style scoped lang="sass">
$cream-bg: #f3e6c4
$cream-card: #fdf8ed
$navy: #1a2f4a
$brown: #7a6b55
$gold: #d4a83e
$border: #e6d6b5

.hoeren-page
  background: radial-gradient(ellipse at top, #faf2dc 0%, #f3e6c4 60%, #e8d29a 100%)
  color: $navy

.page-header
  padding: max(env(safe-area-inset-top), 0.75rem) 20px 8px
  max-width: 28rem
  margin: 0 auto

.title-cluster
  display: flex
  align-items: center
  justify-content: center

.page-title
  display: inline-flex
  align-items: center
  gap: 8px
  font-size: 22px
  font-weight: 900
  color: $navy
  margin: 0

.page-content
  max-width: 28rem
  margin: 0 auto
  padding: 4px 20px 0
  display: flex
  flex-direction: column
  gap: 14px

.page-breadcrumb
  font-size: 11px
  font-weight: 800
  letter-spacing: 0.18em
  color: $brown
  text-transform: uppercase

.audio-list
  display: flex
  flex-direction: column
  gap: 10px

.audio-row
  display: flex
  align-items: center
  gap: 12px
  background: $cream-card
  border: 1px solid $border
  border-radius: 18px
  padding: 10px 14px 10px 10px
  cursor: pointer
  box-shadow: 0 6px 16px -10px rgba(58, 42, 18, 0.3)
  transition: transform 180ms ease-out, box-shadow 180ms ease-out

  &:hover
    transform: translateY(-2px)
    box-shadow: 0 12px 22px -10px rgba(212, 168, 62, 0.35)

.audio-thumb
  flex: 0 0 auto
  width: 64px
  aspect-ratio: 3 / 4
  border-radius: 10px
  overflow: hidden
  background: linear-gradient(160deg, #f3e6c4 0%, #e8d29a 100%)
  display: flex
  align-items: center
  justify-content: center

.audio-thumb-img
  height: 100%
  width: auto
  max-width: 100%
  object-fit: contain

.audio-meta
  flex: 1
  min-width: 0
  display: flex
  flex-direction: column
  gap: 2px

.audio-series
  font-size: 11px
  font-weight: 800
  color: $brown
  text-transform: uppercase
  letter-spacing: 0.06em

.audio-title
  font-size: 15px
  font-weight: 900
  color: $navy
  margin: 0
  line-height: 1.2

.audio-play
  flex: 0 0 auto

.empty-card
  text-align: center
  background: $cream-card
  border: 1px dashed $border
  border-radius: 18px
  padding: 28px 18px
  color: $brown
  font-size: 14px

.is-landscape
  .page-content
    max-width: 64rem

  .audio-list
    display: grid
    grid-template-columns: 1fr 1fr
    gap: 12px
</style>
