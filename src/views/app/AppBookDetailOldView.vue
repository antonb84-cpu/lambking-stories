<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AHeader from '@/components/atoms/AHeader.vue'
import APlayButton from '@/components/atoms/APlayButton.vue'
import APlayer from '@/components/atoms/APlayer.vue'
import AChip from '@/components/atoms/AChip.vue'
import ABreadcrumbs from '@/components/atoms/ABreadcrumbs.vue'
import ABottomNav from '@/components/atoms/ABottomNav.vue'
import APager from '@/components/atoms/APager.vue'
import useModels from '@/use/useModels'

const { t, locale } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()
const { getBook, getSeriesOfBook, isInWatchList, toggleWatchList, setLastRead } = useModels()

const bookId = computed(() => String(route.params.bookId))
const book = computed(() => getBook(bookId.value))
const series = computed(() => (book.value ? getSeriesOfBook(book.value.id) : undefined))
const inWatchList = computed(() => (book.value ? isInWatchList(book.value.id) : false))

const audioEl = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

const audioSrc = computed(() => {
  if (!book.value) return ''
  const lang = locale.value as 'en' | 'de'
  return book.value.audio[lang] || book.value.audio.en
})

const progressRatio = computed(() => (duration.value > 0 ? currentTime.value / duration.value : 0))

function ensureAudio() {
  if (!audioEl.value) return
  audioEl.value.addEventListener('timeupdate', onTimeUpdate)
  audioEl.value.addEventListener('loadedmetadata', onLoadedMeta)
  audioEl.value.addEventListener('ended', onEnded)
}

function onTimeUpdate() {
  if (audioEl.value) currentTime.value = audioEl.value.currentTime
}

function onLoadedMeta() {
  if (audioEl.value) duration.value = audioEl.value.duration || 0
}

function onEnded() {
  isPlaying.value = false
  currentTime.value = 0
}

function togglePlay() {
  if (!audioEl.value) {
    isPlaying.value = !isPlaying.value
    return
  }
  if (isPlaying.value) {
    audioEl.value.pause()
    isPlaying.value = false
  } else {
    audioEl.value.play().then(() => {
      isPlaying.value = true
    }).catch(() => {
      isPlaying.value = !isPlaying.value
    })
  }
}

function seekRatio(ratio: number) {
  if (!audioEl.value) return
  const d = duration.value || 180
  audioEl.value.currentTime = ratio * d
  currentTime.value = audioEl.value.currentTime
}

onMounted(() => {
  if (book.value) setLastRead(book.value.id)
  ensureAudio()
})
onUnmounted(() => {
  if (audioEl.value) {
    audioEl.value.pause()
    audioEl.value.removeEventListener('timeupdate', onTimeUpdate)
    audioEl.value.removeEventListener('loadedmetadata', onLoadedMeta)
    audioEl.value.removeEventListener('ended', onEnded)
  }
})
watch(audioSrc, () => {
  isPlaying.value = false
  currentTime.value = 0
  duration.value = 0
})

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

function onToggleWatchList() {
  if (book.value) toggleWatchList(book.value.id)
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString()
  } catch {
    return iso
  }
}

const selectedPage = ref(1)
const totalPages = computed(() => book.value?.content?.length || 0)
const currentPage = computed(() => {
  const pages = book.value?.content
  if (!pages || !pages.length) return { title: '', text: '' }
  const p = pages[Math.min(pages.length, Math.max(1, selectedPage.value)) - 1]
  if (!p) return { title: '', text: '' }
  return { title: t(p.title) || '', text: t(p.text) || '' }
})
watch(bookId, () => {
  selectedPage.value = 1
})
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full")
    AHeader(
      :greeting="series?.name || t('app.bookDetail.story')"
      :title="book ? t(book.title) : t('app.bookDetail.notFound')"
      :show-action="false"
    )

    template(v-if="book")
      section(class="section-wrap mt-6")
        div(class="detail-card flex flex-col gap-4 p-4 md:p-5")
          div(class="relative w-full aspect-[16/10] rounded-[20px] overflow-hidden")
            div(
              class="absolute inset-0"
              :style="{ background: book.cover || 'linear-gradient(135deg,#9560f4,#7e3af2)' }"
            )
            img(
              v-if="book.coverImage || book.previewImage"
              :src="book.coverImage || book.previewImage"
              :alt="t(book.title)"
              class="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            )

          div(class="flex items-center gap-2 flex-wrap")
            AChip(:label="book.author")
            AChip(:label="formatDate(book.releaseDate)")
            AChip(v-if="series" variant="soft" :label="series.name")

          h1(class="text-xl md:text-2xl font-black book-title") {{ t(book.title) }}
          p(class="text-sm md:text-base book-desc") {{ book.description }}

          div(class="flex items-center gap-4 mt-2")
            APlayButton(size="lg" :is-playing="isPlaying" :progress="progressRatio" @click="togglePlay")
            div(class="flex-1 min-w-0")
              APlayer(:progress="progressRatio" @seek="seekRatio")

          button(
            type="button"
            @click="onToggleWatchList"
            :class="['watch-btn self-start mt-1', inWatchList ? 'is-saved' : '']"
          )
            svg(viewBox="0 0 24 24" :fill="inWatchList ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4")
              path(d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z")
            span {{ inWatchList ? t('app.bookDetail.saved') : t('app.bookDetail.save') }}

      section(v-if="totalPages" class="section-wrap mt-6")
        ABreadcrumbs(:label="t('app.bookDetail.pages')")
        div(class="page-card p-5 mt-2")
          h3(class="page-title") {{ currentPage.title }}
          p(class="page-text mt-2") {{ currentPage.text }}
          div(class="mt-5 pt-4 border-top")
            APager(v-model="selectedPage" :total="totalPages" :skip="5")

      audio(
        ref="audioEl"
        :src="audioSrc"
        preload="metadata"
        class="hidden"
      )

    div(v-else class="section-wrap mt-10 text-center") {{ t('app.bookDetail.notFound') }}

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

.detail-card
  background-color: var(--color-bg-card)
  border: 1px solid var(--color-border-subtle)
  border-radius: 24px
  box-shadow: 0 1px 2px rgba(126, 58, 242, 0.05), 0 10px 28px -12px rgba(126, 58, 242, 0.22)

.book-title
  color: var(--color-text-primary)

.book-desc
  color: var(--color-text-secondary)
  line-height: 1.55

.watch-btn
  display: inline-flex
  align-items: center
  gap: 6px
  font-size: 12px
  font-weight: 800
  text-transform: uppercase
  letter-spacing: 0.1em
  color: var(--color-text-link)
  background-color: var(--color-bg-active-pill)
  border: 1px solid rgba(126, 58, 242, 0.2)
  padding: 8px 14px
  border-radius: 999px
  cursor: pointer
  transition: transform 160ms ease-out

  &:hover
    transform: translateY(-1px)

  &:active
    transform: translateY(1px) scale(0.97)

  &.is-saved
    background: linear-gradient(180deg, #9560f4, #7e3af2)
    color: #ffffff
    border-color: rgba(61, 22, 118, 0.4)

.page-card
  background-color: var(--color-bg-card)
  border: 1px solid var(--color-border-subtle)
  border-radius: 20px
  box-shadow: 0 1px 2px rgba(126, 58, 242, 0.04), 0 8px 22px -14px rgba(126, 58, 242, 0.2)

.page-index
  font-size: 10px
  font-weight: 800
  letter-spacing: 0.14em
  text-transform: uppercase
  color: var(--color-text-secondary)

.page-title
  font-size: 15px
  font-weight: 800
  color: var(--color-text-primary)

.page-text
  font-size: 14px
  color: var(--color-text-primary)
  line-height: 1.55
  white-space: pre-line
  min-height: 6rem

.border-top
  border-top: 1px solid var(--color-border-subtle)
</style>

