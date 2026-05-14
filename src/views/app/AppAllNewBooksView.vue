<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ZBottomNav from '@/components/atoms/ZBottomNav.vue'
import ZBackButton from '@/components/atoms/ZBackButton.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'
import ZBadge from '@/components/atoms/ZBadge.vue'
import useApiBooks from '@/use/useApiBooks'
import useAppNav from '@/use/useAppNav'
import { isMobileLandscape } from '@/use/useUser'
import type { ApiBook, Locale } from '@/types/apiBook'
import { pickLocalizedImage } from '@/types/apiBook'
import { onImgFallback, withPlaceholder } from '@/utils/placeholder'
import { prependBaseUrl } from '@/utils/function'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const apiBooks = useApiBooks()
const { navItems, activeNav, onNav } = useAppNav(t)

onMounted(() => {
  void apiBooks.loadAllBooks()
})

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))
const THREE_MONTHS_MS = 1000 * 60 * 60 * 24 * 90

function localizedTitle(book: ApiBook): string {
  return book.localizations?.[lang.value]?.title || book.localizations?.de?.title || ''
}

const allBooks = computed<ApiBook[]>(() => (apiBooks.state.all ?? []) as ApiBook[])

const newBooks = computed<ApiBook[]>(() => {
  const now = Date.now()
  return allBooks.value
    .filter((b) => now - new Date(b.releaseDate).getTime() < THREE_MONTHS_MS)
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
})

function openBook(bookId: string) {
  router.push({ name: 'app-book', params: { bookId } })
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'app-main' })
}
</script>

<template lang="pug">
  div(:class="['new-books-page', isMobileLandscape ? 'is-landscape' : '', 'min-h-screen w-full pb-32']")
    header(class="page-header")
      ZBackButton(variant="flat" class="page-back" @click="goBack")
      div(class="title-cluster")
        img(
          :src="prependBaseUrl('images/icons/crown_256x256.webp')"
          alt=""
          class="page-crown"
          decoding="async"
          aria-hidden="true"
        )
        h1(class="page-title") {{ t('app.newBooks.title') }}

    div(class="page-content")
      span(class="page-breadcrumb") {{ t('app.newBooks.breadcrumb') }}

      div(v-if="newBooks.length" class="tile-grid")
        div(
          v-for="(book, idx) in newBooks"
          :key="book.bookId"
          class="book-tile"
          @click="openBook(book.bookId)"
        )
          div(class="book-tile-text")
            ZBadge(
              variant="hot"
              size="sm"
              position="top-right"
              :label="t('app.bookSeries.new').toUpperCase()"
            )
            //span(class="book-tile-band") {{ t('app.bookSeries.bandLabel', { n: idx + 1 }) }}
            h3(class="book-tile-name") {{ localizedTitle(book) }}

          div(class="book-tile-image")
            img(
              :src="withPlaceholder(pickLocalizedImage(book.previewImage, lang))"
              :alt="localizedTitle(book)"
              class="book-tile-img"
              loading="lazy"
              @error="onImgFallback"
            )

      div(
        v-else
        class="empty-card"
      ) {{ t('app.newBooks.empty') }}

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

.new-books-page
  background: radial-gradient(ellipse at top, #faf2dc 0%, #f3e6c4 60%, #e8d29a 100%)
  color: $navy

.page-header
  position: relative
  padding: max(env(safe-area-inset-top), 0.75rem) 20px 8px
  max-width: 28rem
  margin: 0 auto

// Back button floats over the centred title block so the crown +
// title stack stays optically centred regardless of side widgets.
.page-back
  position: absolute
  top: calc(max(env(safe-area-inset-top), 0.75rem))
  left: 12px

.title-cluster
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 2px

.page-crown
  width: 28px
  height: auto
  object-fit: contain
  filter: drop-shadow(0 2px 4px rgba(58, 42, 18, 0.3))

.page-title
  font-size: 24px
  font-weight: 900
  color: $navy
  letter-spacing: -0.01em
  margin: 0
  line-height: 1.1

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

.tile-grid
  display: flex
  flex-direction: column
  gap: 12px

.book-tile
  position: relative
  display: grid
  grid-template-columns: 1fr 0.85fr
  background: linear-gradient(180deg, #fdf8ed 0%, #f5e8c2 100%)
  border: 1.5px solid $border
  border-radius: 12px
  overflow: hidden
  cursor: pointer
  min-height: 130px
  box-shadow: 0 10px 26px -14px rgba(58, 42, 18, 0.3)
  transition: transform 200ms ease-out, box-shadow 200ms ease-out

  &:hover
    transform: translateY(-3px)
    box-shadow: 0 16px 32px -12px rgba(212, 168, 62, 0.4)

  &:active
    transform: scale(0.995)

.book-tile-text
  padding: 16px 14px 14px
  display: flex
  flex-direction: column
  gap: 6px
  min-width: 0

.book-tile-band
  font-size: 11px
  font-weight: 900
  letter-spacing: 0.12em
  text-transform: uppercase
  color: $gold

.book-tile-name
  font-size: 17px
  font-weight: 900
  color: $navy
  margin: 0
  line-height: 1.15
  display: -webkit-box
  -webkit-line-clamp: 2
  -webkit-box-orient: vertical
  overflow: hidden

.book-tile-image
  position: relative
  overflow: hidden
  background: linear-gradient(160deg, #f3e6c4 0%, #e8d29a 100%)
  display: flex
  align-items: stretch
  justify-content: center

.book-tile-img
  height: 100%
  width: auto
  max-width: 100%
  object-fit: contain
  display: block

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
  .page-content
    max-width: 64rem

  .tile-grid
    display: grid
    grid-template-columns: 1fr 1fr
    gap: 14px
</style>
