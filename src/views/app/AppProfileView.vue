<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AHeader from '@/components/atoms/AHeader.vue'
import ACard from '@/components/atoms/ACard.vue'
import AChip from '@/components/atoms/AChip.vue'
import ASelect from '@/components/atoms/ASelect.vue'
import ABreadcrumbs from '@/components/atoms/ABreadcrumbs.vue'
import ABottomNav from '@/components/atoms/ABottomNav.vue'
import useModels from '@/use/useModels'
import useApiBooks from '@/use/useApiBooks'
import useUser from '@/use/useUser'
import type { ApiBook, Locale } from '@/types/apiBook'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()
const route = useRoute()
const { watchListIds, removeFromWatchList } = useModels()
const apiBooks = useApiBooks()
const { userLanguage, setSettingValue } = useUser()

onMounted(() => {
  void apiBooks.loadAllBooks()
})

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))
const watchListBooks = computed<ApiBook[]>(() =>
  watchListIds.value
    .map((id) => apiBooks.getById(id))
    .filter((b): b is ApiBook => b !== null)
)

function localizedTitle(book: ApiBook): string {
  return book.localizations?.[lang.value]?.title || book.localizations?.de?.title || ''
}

if (locale.value !== userLanguage.value) locale.value = userLanguage.value
watch(userLanguage, (v) => {
  locale.value = v
})

function toggleLanguage() {
  setSettingValue('language', userLanguage.value === 'en' ? 'de' : 'en')
}

const languageOptions = computed(() => [
  { value: 'de', label: t('app.profile.german'), subLabel: 'Deutsch', icon: '🇩🇪' },
  { value: 'en', label: t('app.profile.english'), subLabel: 'English', icon: '🇬🇧' }
])

function onSelectLanguage(value: string | number | (string | number)[]) {
  if (typeof value === 'string') setSettingValue('language', value as 'en' | 'de')
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
  if (name === 'app-awards' || name === 'app-coloring') return 'brush'
  if (name === 'app-profile') return 'profile'
  return 'home'
})

function onNav(id: string | number) {
  if (id === 'home') router.push({ name: 'app-main' })
  if (id === 'series') router.push({ name: 'app-all-books' })
  if (id === 'profile') router.push({ name: 'app-profile' })
  if (id === 'brush') router.push({ name: 'app-coloring' })
}

function openBook(bookId: string) {
  router.push({ name: 'app-book', params: { bookId } })
}
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full")
    AHeader(
      :greeting="t('app.profile.hello')"
      :title="t('app.profile.littleReader')"
      :action-label="userLanguage === 'de' ? 'EN' : 'DE'"
      @action="toggleLanguage"
    )

    section(class="section-wrap mt-6")
      ABreadcrumbs(:label="t('app.profile.settings')")
      div(class="mt-2")
        ASelect(
          :label="t('app.profile.language')"
          :model-value="userLanguage"
          :options="languageOptions"
          @update:model-value="onSelectLanguage"
        )

    section(class="section-wrap mt-6")
      div(class="flex items-center justify-between gap-3")
        ABreadcrumbs(:label="t('app.profile.watchList')")
        AChip(size="sm" variant="soft" :label="String(watchListBooks.length)")

      div(
        v-if="watchListBooks.length === 0"
        class="empty-card mt-2 p-5 text-center"
      ) {{ t('app.profile.emptyWatchList') }}

      div(v-else class="mt-2 flex flex-col gap-3")
        div(
          v-for="book in watchListBooks"
          :key="book.bookId"
          class="relative"
        )
          ACard(
            :title="localizedTitle(book)"
            :category="book.category || book.author"
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
          button(
            type="button"
            @click.stop="removeFromWatchList(book.bookId)"
            :aria-label="t('app.profile.remove')"
            class="remove-btn"
          )
            svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4")
              path(d="M18 6 6 18M6 6l12 12")

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

.settings-card, .empty-card
  background-color: var(--color-bg-card)
  border: 1px solid var(--color-border-subtle)
  border-radius: 20px
  box-shadow: 0 1px 2px rgba(126, 58, 242, 0.05), 0 10px 28px -12px rgba(126, 58, 242, 0.2)
  color: var(--color-text-primary)

.empty-card
  color: var(--color-text-secondary)
  font-size: 14px

.settings-label
  font-size: 10px
  font-weight: 800
  text-transform: uppercase
  letter-spacing: 0.14em
  color: var(--color-text-secondary)

.settings-value
  font-size: 16px
  font-weight: 800
  color: var(--color-text-primary)

.remove-btn
  position: absolute
  top: 10px
  right: 10px
  width: 30px
  height: 30px
  border-radius: 999px
  background-color: var(--color-bg-active-pill)
  color: var(--color-text-link)
  display: inline-flex
  align-items: center
  justify-content: center
  border: 1px solid rgba(126, 58, 242, 0.2)
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  transition: transform 160ms ease-out

  &:hover
    transform: scale(1.08)

  &:active
    transform: scale(0.92)
</style>

