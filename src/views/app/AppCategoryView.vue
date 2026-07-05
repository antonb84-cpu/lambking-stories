<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ZBackButton from '@/components/atoms/ZBackButton.vue'
import BookGridSection from '@/components/organisms/BookGridSection.vue'
import useApiBooks from '@/use/useApiBooks'
import useApiCategories from '@/use/useApiCategories'
import { isMobileLandscape } from '@/use/useUser'
import type { ApiBook } from '@/types/apiBook'
import { prependBaseUrl } from '@/utils/function'

const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()
const apiBooks = useApiBooks()
const apiCategories = useApiCategories()

onMounted(() => {
  void apiBooks.loadAllBooks()
  // Pull the category records so the header can show the uploaded icon
  // next to the category name.
  void apiCategories.loadAll()
})

const categoryName = computed(() => String(route.params.category))

const categoryIcon = computed<string>(() => {
  void apiCategories.state.all
  return apiCategories.getByName(categoryName.value)?.icon || ''
})

// Newest first — categories cut across series, so release order is the
// most useful default (mirrors the "Neu in der Bibliothek" row).
const books = computed<ApiBook[]>(() => {
  const list = (apiBooks.state.all ?? []) as ApiBook[]
  return list
    .filter((b) => b.category === categoryName.value)
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
})

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'app-main' })
}
</script>

<template lang="pug">
  div(:class="['category-page', isMobileLandscape ? 'is-landscape' : '', 'min-h-screen w-full pb-[calc(8rem+env(safe-area-inset-bottom,0px))]']")
    //- ===== Header — back · crown · category name =====
    //- Same crown header as the Serien page: no cover hero here, the
    //- category name under the crown is the page title.
    header(class="category-header")
      ZBackButton(variant="flat" class="category-back" @click="goBack")
      div(class="title-cluster")
        img(
          :src="prependBaseUrl('images/icons/crown_256x256.webp')"
          alt=""
          class="category-crown"
          decoding="async"
          aria-hidden="true"
        )
        div(class="category-title-row")
          img(
            v-if="categoryIcon"
            :src="categoryIcon"
            alt=""
            class="category-title-icon"
            decoding="async"
            aria-hidden="true"
          )
          h1(class="category-title") {{ categoryName }}

    div(class="content")
      //- Shared book list (layout toggle + cards) — same component as
      //- the series detail page.
      BookGridSection(
        :books="books"
        :title="t('app.categories.books')"
        :empty-text="t('app.categories.empty')"
      )
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

.category-page
  background: radial-gradient(ellipse at top, #faf2dc 0%, #f3e6c4 60%, #e8d29a 100%)
  color: $navy

.category-header
  position: relative
  padding: max(env(safe-area-inset-top), 0.75rem) 20px 8px
  max-width: 28rem
  margin: 0 auto

// Back button floats over the centred title block so the crown +
// category name stack stays optically centred regardless of side widgets.
.category-back
  position: absolute
  top: calc(max(env(safe-area-inset-top), 0.75rem))
  left: 12px

.title-cluster
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 2px

.category-crown
  width: 28px
  height: auto
  object-fit: contain
  filter: drop-shadow(0 2px 4px rgba(58, 42, 18, 0.3))

.category-title-row
  display: flex
  align-items: center
  justify-content: center
  gap: 8px

.category-title-icon
  width: 26px
  height: 26px
  object-fit: contain
  filter: drop-shadow(0 2px 4px rgba(58, 42, 18, 0.25))

.category-title
  font-size: 24px
  font-weight: 700
  color: $navy
  letter-spacing: -0.01em
  margin: 0
  line-height: 1.1

.content
  max-width: 28rem
  margin: 0 auto
  padding: 10px 20px 0
  display: flex
  flex-direction: column
  gap: 14px

// ===== Mobile landscape =====
.is-landscape
  .category-header, .content
    max-width: 64rem
</style>
