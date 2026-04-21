<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AButton from '@/components/atoms/AButton.vue'
import AChip from '@/components/atoms/AChip.vue'
import ABreadcrumbs from '@/components/atoms/ABreadcrumbs.vue'
import ABottomNav from '@/components/atoms/ABottomNav.vue'
import AAudioPlayer from '@/components/atoms/AAudioPlayer.vue'
import AIconography from '@/components/atoms/AIconography.vue'
import useModels from '@/use/useModels'
import useApiBooks from '@/use/useApiBooks'
import useReadingProgress from '@/use/useReadingProgress'
import type { ApiBook, Locale } from '@/types/apiBook'

const { t, locale } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()
const {
  getSeriesOfBook, isInWatchList, toggleWatchList, setLastRead,
  getPlaybackState, setPlaybackState
} = useModels()
const apiBooks = useApiBooks()
const { getPct, isCompleted } = useReadingProgress()

const bookId = computed(() => String(route.params.bookId))
const book = ref<ApiBook | null>(null)

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))
const localization = computed(() => {
  const b = book.value
  if (!b) return null
  return b.localizations?.[lang.value] ?? b.localizations?.de ?? null
})
const localizedTitle = computed(() => localization.value?.title || '')
const localizedDescription = computed(() => localization.value?.description || '')

const series = computed(() => (book.value ? getSeriesOfBook(book.value.bookId) : undefined))
const inWatchList = computed(() => (book.value ? isInWatchList(book.value.bookId) : false))

async function fetchBook() {
  book.value = await apiBooks.loadBook(bookId.value)
  if (book.value) {
    setLastRead(book.value.bookId)
    const saved = getPlaybackState(book.value.bookId)
    if (saved && typeof saved.time === 'number' && saved.time > 0) {
      pendingResumeTime = saved.time
    }
  }
}

type ViewMode = 'detail' | 'listen'
const mode = ref<ViewMode>('detail')

const audioEl = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const audioLoading = ref(false)
let rafId = 0

const audioSrc = computed(() => {
  const b = book.value
  if (!b || !b.audio) return ''
  return b.audio[lang.value] || b.audio.de || b.audio.en || ''
})

function onAudioLoadStart() {
  audioLoading.value = true
}

function onAudioWaiting() {
  audioLoading.value = true
}

function onAudioCanPlay() {
  audioLoading.value = false
}

function onAudioPlaying() {
  audioLoading.value = false
}

function onAudioStalled() {
  audioLoading.value = true
}

function ensureAudio() {
  if (!audioEl.value) return
  audioEl.value.addEventListener('timeupdate', onTimeUpdate)
  audioEl.value.addEventListener('loadedmetadata', onLoadedMeta)
  audioEl.value.addEventListener('ended', onEnded)
  audioEl.value.addEventListener('loadstart', onAudioLoadStart)
  audioEl.value.addEventListener('waiting', onAudioWaiting)
  audioEl.value.addEventListener('canplay', onAudioCanPlay)
  audioEl.value.addEventListener('playing', onAudioPlaying)
  audioEl.value.addEventListener('stalled', onAudioStalled)
}

function onTimeUpdate() {
  if (audioEl.value) currentTime.value = audioEl.value.currentTime
}

function tickRaf() {
  if (!isPlaying.value || !audioEl.value) {
    rafId = 0
    return
  }
  currentTime.value = audioEl.value.currentTime
  rafId = requestAnimationFrame(tickRaf)
}

function startRaf() {
  if (rafId) return
  rafId = requestAnimationFrame(tickRaf)
}

function stopRaf() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
}

function onLoadedMeta() {
  if (!audioEl.value) return
  duration.value = audioEl.value.duration || 0
  if (pendingResumeTime > 0) {
    const t0 = Math.min(Math.max(0, pendingResumeTime), Math.max(0, duration.value - 0.5))
    audioEl.value.currentTime = t0
    currentTime.value = t0
    pendingResumeTime = 0
  }
}

let pendingResumeTime = 0

function onEnded() {
  isPlaying.value = false
  currentTime.value = 0
  stopRaf()
}

function togglePlay() {
  if (!audioEl.value) {
    isPlaying.value = !isPlaying.value
    return
  }
  if (isPlaying.value) {
    audioEl.value.pause()
    isPlaying.value = false
    stopRaf()
  } else {
    audioEl.value.play().then(() => {
      isPlaying.value = true
      startRaf()
    }).catch(() => {
      isPlaying.value = !isPlaying.value
    })
  }
}

function rewind(seconds = 15) {
  if (!audioEl.value) return
  audioEl.value.currentTime = Math.max(0, audioEl.value.currentTime - seconds)
}

function forward(seconds = 15) {
  if (!audioEl.value) return
  audioEl.value.currentTime = Math.min(duration.value || 0, audioEl.value.currentTime + seconds)
}

function seek(seconds: number) {
  if (!audioEl.value) return
  audioEl.value.currentTime = seconds
  currentTime.value = seconds
}

function savePlayback() {
  if (!book.value) return
  setPlaybackState(book.value.bookId, {
    time: currentTime.value || 0,
    audioSrc: audioSrc.value
  })
}

onMounted(() => {
  ensureAudio()
  void fetchBook()
})
onUnmounted(() => {
  savePlayback()
  stopRaf()
  if (audioEl.value) {
    audioEl.value.pause()
    audioEl.value.removeEventListener('timeupdate', onTimeUpdate)
    audioEl.value.removeEventListener('loadedmetadata', onLoadedMeta)
    audioEl.value.removeEventListener('ended', onEnded)
    audioEl.value.removeEventListener('loadstart', onAudioLoadStart)
    audioEl.value.removeEventListener('waiting', onAudioWaiting)
    audioEl.value.removeEventListener('canplay', onAudioCanPlay)
    audioEl.value.removeEventListener('playing', onAudioPlaying)
    audioEl.value.removeEventListener('stalled', onAudioStalled)
  }
})
watch(bookId, () => {
  void fetchBook()
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

function goBack() {
  if (mode.value !== 'detail') {
    if (audioEl.value && isPlaying.value) {
      audioEl.value.pause()
      isPlaying.value = false
      stopRaf()
    }
    savePlayback()
    mode.value = 'detail'
    return
  }
  savePlayback()
  if (window.history.length > 1) router.back()
  else router.push({ name: 'app-all-books' })
}

function onToggleWatchList() {
  if (book.value) toggleWatchList(book.value.bookId)
}

function onListen() {
  mode.value = 'listen'
  setTimeout(() => {
    if (audioEl.value && !isPlaying.value) {
      audioEl.value.play().then(() => {
        isPlaying.value = true
        startRaf()
      }).catch(() => {
      })
    }
  }, 50)
}

function onRead() {
  if (!book.value) return
  router.push({ name: 'app-reader', params: { bookId: book.value.bookId } })
}

const totalPages = computed(() => localization.value?.content?.length || 0)
const readingPct = computed(() => {
  if (!book.value) return 0
  return getPct(book.value.bookId, totalPages.value)
})
const readingPctLabel = computed(() => `${Math.round(readingPct.value * 100)}%`)
const readingDone = computed(() => (book.value ? isCompleted(book.value.bookId) : false))

function onDownload() {
  const src = audioSrc.value
  if (!src) return
  const a = document.createElement('a')
  a.href = src
  a.download = `${localizedTitle.value || 'audio'}.mp3`
  a.click()
}

watch(currentTime, (v, prev) => {
  if (mode.value !== 'listen' || !isPlaying.value) return
  if (Math.floor(v / 3) !== Math.floor(prev / 3)) savePlayback()
})
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full relative pb-32 pt-[max(env(safe-area-inset-top),0rem)]")
    template(v-if="book")
      //- ===== Section 1: Hero image + back arrow =====
      div.header
      div(class="hero relative w-full")
        div(class="hero-img relative w-full aspect-[16/9]")
          div(
            class="absolute inset-0"
            :style="{ background: book.cover || 'linear-gradient(135deg,#9560f4,#7e3af2)' }"
          )
          img(
            v-if="book.coverImage || book.previewImage"
            :src="book.coverImage || book.previewImage"
            :alt="localizedTitle"
            class="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          )
          span(class="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/25")

        button(
          type="button"
          @click="goBack"
          :aria-label="t('app.bookDetail.back') || 'Back'"
          class="back-btn absolute top-4 left-4 inline-flex items-center justify-center w-11 h-11 rounded-full"
        )
          svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5")
            path(d="m15 18-6-6 6-6")

      //- ===== Detail mode =====
      template(v-if="mode === 'detail'")
        section(class="section-wrap mt-5")
          ABreadcrumbs(:label="series ? series.name : t('app.bookDetail.story')")
          h1(class="book-title mt-1 text-2xl md:text-3xl font-black leading-tight") {{ localizedTitle }}

          div(class="meta-row mt-3 flex items-center gap-2")
            template(v-for="(badge, i) in book.badges" :key="badge + i")
              AChip(:label="t(badge)")
            div(class="flex-1")
            button(
              type="button"
              @click="onToggleWatchList"
              :aria-label="inWatchList ? t('app.bookDetail.saved') : t('app.bookDetail.save')"
              class="heart-btn inline-flex items-center justify-center w-11 h-11 rounded-full"
              :class="{ 'is-active': inWatchList }"
            )
              AIconography(name="heart" :size="28")

        //- ===== Primary CTA =====
        section(class="section-wrap mt-4")
          AButton(type="primary" icon="volume" @click="onListen") {{ t('app.bookDetail.listen') }}

        //- ===== Secondary actions =====
        section(class=" section-wrap mt-3")
          div(class="grid grid-cols-2 gap-3")
            AButton.self-read(type="secondary" icon="book" size="sm" @click="onRead") {{ t('app.bookDetail.readMyself') }}
            AButton.download(type="secondary" icon="download" size="sm" @click="onDownload") {{ t('app.bookDetail.download') }}

          //- Reading progress (only once the user has actually started)
          div(
            v-if="readingPct > 0"
            class="reading-progress mt-4"
            :aria-label="t('app.bookDetail.progress', { pct: readingPctLabel }) || ('Lesefortschritt ' + readingPctLabel)"
          )
            div(class="reading-progress-row")
              span(class="reading-progress-label") {{ readingDone ? (t('app.bookDetail.completed') || 'Geschafft!') : (t('app.bookDetail.progressLabel') || 'Lesefortschritt') }}
              span(class="reading-progress-pct") {{ readingPctLabel }}
            div(class="reading-progress-track")
              div(
                class="reading-progress-fill"
                :class="{ 'is-done': readingDone }"
                :style="{ width: readingPctLabel }"
              )

        //- ===== Description =====
        section(class="section-wrap mt-7 pb-6")
          p(class="book-desc text-sm md:text-base") {{ localizedDescription }}

      //- ===== Listen mode (audio player only — read-along is parked in
      //- ReadAlong.vue for later reuse) =====
      template(v-else-if="mode === 'listen'")
        section(class="section-wrap mt-5")
          ABreadcrumbs(:label="t('app.bookDetail.nowListening')")
          h2(class="book-title mt-1 text-lg md:text-xl font-black") {{ localizedTitle }}

        section(class="section-wrap mt-4")
          div(class="mx-auto max-w-[420px]")
            AAudioPlayer(
              :is-playing="isPlaying"
              :current-time="currentTime"
              :duration="duration"
              :loading="audioLoading"
              @toggle="togglePlay"
              @rewind="rewind"
              @forward="forward"
              @seek="seek"
            )

      audio(
        ref="audioEl"
        :src="audioSrc"
        preload="auto"
        class="hidden"
      )

    div(v-else class="section-wrap mt-10 text-center") {{ t('app.bookDetail.notFound') }}

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


.hero
  background-color: var(--color-bg-main)

.hero-img
  border-bottom-left-radius: 32px
  border-bottom-right-radius: 32px
  box-shadow: 0 14px 40px -18px rgba(61, 22, 118, 0.4)

.back-btn
  background-color: rgba(255, 255, 255, 0.2)
  backdrop-filter: blur(8px)
  color: #ffffff
  border: 1.5px solid rgba(255, 255, 255, 0.75)
  box-shadow: 0 6px 14px -6px rgba(0, 0, 0, 0.35)
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  transition: transform 150ms ease-out, background-color 150ms ease-out

  &:hover
    background-color: rgba(255, 255, 255, 0.32)
    transform: translateY(-1px)

  &:active
    transform: scale(0.98)

.book-title
  color: var(--color-text-primary)


.book-subtitle
  color: var(--color-text-secondary)

.book-desc
  color: var(--color-text-primary)
  line-height: 1.5

.heart-btn
  background-color: var(--color-bg-active-pill)
  color: #d64578
  border: 1px solid rgba(126, 58, 242, 0.2)
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  transition: transform 150ms ease-out

  &:hover
    transform: translateY(-1px) scale(1.03)

  &:active
    transform: scale(0.98)

  &.is-active
    background: linear-gradient(180deg, #ffd6ea 0%, #ffb3d4 100%)
    border-color: #ff7ab3
    box-shadow: 0 0 0 1px rgba(255, 122, 179, 0.3), 0 10px 22px -8px rgba(255, 122, 179, 0.55)

:deep(.self-read) button, :deep(.download) button
  padding: 8px 11px

  .button-label
    font-size: 14px

.header
  background: linear-gradient(180deg, #4a1b91 0%, #3a1272 100%)

.reading-progress
  display: flex
  flex-direction: column
  gap: 6px

.reading-progress-row
  display: flex
  align-items: baseline
  justify-content: space-between
  gap: 12px
  font-size: 12px
  font-weight: 800
  color: var(--color-text-secondary)
  text-transform: uppercase
  letter-spacing: 0.06em

.reading-progress-pct
  color: var(--color-text-primary)
  font-variant-numeric: tabular-nums

.reading-progress-track
  height: 8px
  background: rgba(0, 0, 0, 0.08)
  border-radius: 999px
  overflow: hidden

.reading-progress-fill
  height: 100%
  background: linear-gradient(90deg, #ffd645 0%, #ff8b3a 100%)
  border-radius: inherit
  transition: width 240ms ease-out

  &.is-done
    background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%)
</style>
