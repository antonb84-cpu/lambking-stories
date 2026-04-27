<script setup lang="ts">
/**
 * High-fidelity, full-screen reader for a single book. Behaves like the
 * AdminUI iPhone previewer (cover → content pages), without any device
 * chrome. Pages flip on swipe (touch + mouse drag); a press-and-swipe-right
 * SVG hand demos the gesture on first open per book; dwell timing feeds
 * `useReadingProgress` so completion progresses honestly. After the last
 * content page we render a celebration page with confetti and surface the
 * next volume in the same series via ABookCard.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import confetti from 'canvas-confetti'
import ABookCard from '@/components/atoms/ABookCard.vue'
import AchievementBadge from '@/components/atoms/AchievementBadge.vue'
import SwipeHintHand, { hasSeenSwipeHint } from '@/components/molecules/SwipeHintHand.vue'
import useApiBooks from '@/use/useApiBooks'
import useBookCache from '@/use/useBookCache'
import useReadingProgress from '@/use/useReadingProgress'
import type { ApiBook, ApiLocalizedPage, Locale } from '@/types/apiBook'
import { markdownToHtml } from '@/utils/markdownToHtml'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n({ useScope: 'global' })

const bookId = computed(() => String(route.params.bookId))
const apiBooks = useApiBooks()
const cache = useBookCache()
const progress = useReadingProgress()

const book = ref<ApiBook | null>(null)
const loading = ref(true)
const loadError = ref<string | null>(null)

async function fetchBook() {
  loading.value = true
  loadError.value = null
  try {
    const b = await apiBooks.loadBook(bookId.value)
    book.value = b
    if (!b) loadError.value = 'not-found'
  } catch (err) {
    loadError.value = (err as Error).message
  } finally {
    loading.value = false
  }
}

onMounted(fetchBook)
watch(bookId, () => {
  if (isAnimating.value) {
    if (pendingFallbackTimer) clearTimeout(pendingFallbackTimer)
    pendingFallbackTimer = null
    isAnimating.value = false
    pendingShift.value = 0
    dragOffset.value = 0
  }
  currentIndex.value = 0
  fetchBook()
})

// ----- Locale-aware content -----

const lang = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'))

const localization = computed(() => {
  const b = book.value
  if (!b) return null
  return b.localizations?.[lang.value] ?? b.localizations?.de ?? null
})

const pages = computed<ApiLocalizedPage[]>(() => localization.value?.content ?? [])

const coverImage = computed<string>(() => {
  const b = book.value
  if (!b) return ''
  // Prefer the per-locale content cover (an in-book splash) when present;
  // fall back to the marketing cover so there's always a first page.
  const localized = b.contentCoverImage?.[lang.value] ?? b.contentCoverImage?.de
  return localized || b.coverImage || b.previewImage || ''
})

type DisplayEntry =
  | { kind: 'cover'; image: string }
  | { kind: 'page'; page: ApiLocalizedPage; pageNumber: number }
  | { kind: 'celebration' }

const displayEntries = computed<DisplayEntry[]>(() => {
  const list: DisplayEntry[] = []
  if (coverImage.value) list.push({ kind: 'cover', image: coverImage.value })
  pages.value.forEach((p, i) => list.push({ kind: 'page', page: p, pageNumber: i + 1 }))
  list.push({ kind: 'celebration' })
  return list
})

// `totalPages` for progress excludes the synthetic celebration page — the
// last real content page is the one that "completes" the book.
const totalPagesForProgress = computed(() => {
  const realPages = displayEntries.value.filter((e) => e.kind !== 'celebration').length
  return Math.max(1, realPages)
})

// ----- Image URL caching -----
// Replace any bare https URL with a blob: URL backed by IndexedDB so a page
// that's been cached once renders instantly and works offline.

const blobUrlByOriginal = ref<Record<string, string>>({})
const trackedBlobUrls: string[] = []

async function ensureBlob(url?: string | null) {
  if (!url) return
  if (blobUrlByOriginal.value[url]) return
  if (!/^https?:\/\//i.test(url)) {
    blobUrlByOriginal.value[url] = url
    return
  }
  const out = await cache.getBlobUrl(url, bookId.value)
  blobUrlByOriginal.value[url] = out
  if (out.startsWith('blob:')) trackedBlobUrls.push(out)
}

watch(
  [coverImage, pages],
  async () => {
    await ensureBlob(coverImage.value)
    const IMG_RE = /!\[[^\]]*\]\(([^)\s]+)\)|<img[^>]+src=["']([^"']+)["']/gi
    for (const p of pages.value) {
      const text = p.text ?? ''
      for (const m of text.matchAll(IMG_RE)) {
        const u = m[1] ?? m[2]
        if (u) await ensureBlob(u)
      }
    }
  },
  { immediate: true }
)

function resolved(url: string): string {
  return blobUrlByOriginal.value[url] ?? url
}

// ----- Render markdown to safe HTML (matches IPhonePreview) -----
// Authoring is admin-only and the renderer escapes every literal `<`, `>`,
// `&` before substituting markdown, so the result is safe for `v-html`.
// Image URLs are routed through `resolved()` so cached https sources flip
// to blob: URLs and the page renders instantly offline.

function renderPageHtml(text: string): string {
  return markdownToHtml(text ?? '', { resolveSrc: resolved, imgClass: 'page-img' })
}

// ----- Page navigation + swipe -----
// The "deck" model: the current entry plus, while dragging or animating, the
// adjacent entry in the direction of motion are both rendered. Each slot sits
// at a static x = ±stageWidth offset; a wrapping `.deck` element translates
// horizontally to reveal the neighbour. Mouse/touch drags update the deck
// translation directly (no transition); on release we toggle the animating
// class and let CSS interpolate to either the committed neighbour position or
// back to zero, then atomically swap currentIndex + reset the deck once the
// transitionend fires.

const currentIndex = ref(0)
const dragOffset = ref(0)
const dragStartX = ref<number | null>(null)
const isDragging = ref(false)
const isAnimating = ref(false)
const pendingShift = ref<-1 | 0 | 1>(0)
const SWIPE_THRESHOLD = 60
const EDGE_DAMPENING = 3
const ANIMATION_FALLBACK_MS = 600

const stageRef = ref<HTMLElement | null>(null)
const stageWidth = ref(0)

function measureStage() {
  if (stageRef.value) stageWidth.value = stageRef.value.clientWidth
}

let pendingFallbackTimer: ReturnType<typeof setTimeout> | null = null

interface RenderedSlot {
  entry: DisplayEntry
  index: number
  x: number
}

const renderedSlots = computed<RenderedSlot[]>(() => {
  const slots: RenderedSlot[] = []
  const cur = displayEntries.value[currentIndex.value]
  if (cur) slots.push({ entry: cur, index: currentIndex.value, x: 0 })

  let adjacentDir: -1 | 0 | 1 = 0
  if (isAnimating.value) adjacentDir = pendingShift.value
  else if (dragOffset.value < 0) adjacentDir = 1
  else if (dragOffset.value > 0) adjacentDir = -1

  if (adjacentDir !== 0 && stageWidth.value > 0) {
    const idx = currentIndex.value + adjacentDir
    const entry = displayEntries.value[idx]
    if (entry) slots.push({ entry, index: idx, x: adjacentDir * stageWidth.value })
  }
  return slots
})

function getX(e: MouseEvent | TouchEvent): number {
  if ('touches' in e) return e.touches[0]?.clientX ?? 0
  return (e as MouseEvent).clientX
}

function startSwipe(e: MouseEvent | TouchEvent) {
  if (isAnimating.value) finalizeAnimation()
  measureStage()
  dragStartX.value = getX(e)
  isDragging.value = true
}

function duringSwipe(e: MouseEvent | TouchEvent) {
  if (dragStartX.value === null) return
  let raw = getX(e) - dragStartX.value
  const lastIdx = displayEntries.value.length - 1
  // No neighbour in this direction → rubber-band the drag so the user feels
  // the edge instead of dragging the void in.
  if (raw < 0 && currentIndex.value >= lastIdx) raw = raw / EDGE_DAMPENING
  if (raw > 0 && currentIndex.value <= 0) raw = raw / EDGE_DAMPENING
  dragOffset.value = raw
}

function endSwipe() {
  if (dragStartX.value === null) return
  const delta = dragOffset.value
  isDragging.value = false
  dragStartX.value = null

  const lastIdx = displayEntries.value.length - 1
  let shift: -1 | 0 | 1 = 0
  if (delta < -SWIPE_THRESHOLD && currentIndex.value < lastIdx) shift = 1
  else if (delta > SWIPE_THRESHOLD && currentIndex.value > 0) shift = -1

  animateToShift(shift)
  onUserGesture()
}

function animateToShift(shift: -1 | 0 | 1) {
  // No-op when there's nothing to commit and nothing to spring back from —
  // avoids spinning a 600ms fallback timer for every plain pager-dot click.
  if (shift === 0 && dragOffset.value === 0) return
  pendingShift.value = shift
  isAnimating.value = true
  // Target: deck translates so the neighbouring slot lands at viewport x=0.
  // Slot at x = +stageWidth (next) → deck at -stageWidth.
  dragOffset.value = -shift * stageWidth.value
  schedulePendingFallback()
}

function schedulePendingFallback() {
  if (pendingFallbackTimer) clearTimeout(pendingFallbackTimer)
  // Some browsers swallow transitionend if the tab is hidden mid-animation;
  // a short fallback guarantees we still finalize.
  pendingFallbackTimer = setTimeout(finalizeAnimation, ANIMATION_FALLBACK_MS)
}

function onDeckTransitionEnd(e: TransitionEvent) {
  if (e.propertyName !== 'transform') return
  finalizeAnimation()
}

function finalizeAnimation() {
  if (!isAnimating.value) return
  if (pendingFallbackTimer) {
    clearTimeout(pendingFallbackTimer)
    pendingFallbackTimer = null
  }
  isAnimating.value = false
  if (pendingShift.value !== 0) {
    currentIndex.value += pendingShift.value
    pendingShift.value = 0
  }
  // Reset without animation — Vue batches this with the class change so the
  // deck snaps to 0 in the same render flush as the now-current slot landing
  // at x=0, no visible jump.
  dragOffset.value = 0
}

function commitSlide(direction: -1 | 1) {
  if (isAnimating.value) finalizeAnimation()
  if (direction === 1 && currentIndex.value >= displayEntries.value.length - 1) return
  if (direction === -1 && currentIndex.value <= 0) return
  measureStage()
  animateToShift(direction)
}

function goPrev() {
  commitSlide(-1)
  onUserGesture()
}

function goNext() {
  commitSlide(1)
  onUserGesture()
}

function gotoIndex(i: number) {
  if (i < 0 || i >= displayEntries.value.length) return
  if (i === currentIndex.value) return
  if (isAnimating.value) finalizeAnimation()
  // Single-step jumps animate; further leaps from the dot pager teleport.
  if (Math.abs(i - currentIndex.value) === 1) {
    measureStage()
    animateToShift((i - currentIndex.value) as -1 | 1)
  } else {
    currentIndex.value = i
  }
  onUserGesture()
}

// ----- Swipe hint -----
// Show only on first open per book, hide if the user swipes within 3s.

const HINT_GRACE_MS = 3000
const hintEnabled = ref(false)
let hintGraceTimer: ReturnType<typeof setTimeout> | null = null

function maybeStartHint() {
  if (!book.value) return
  if (hasSeenSwipeHint(bookId.value)) {
    hintEnabled.value = false
    return
  }
  hintEnabled.value = true
  if (hintGraceTimer) clearTimeout(hintGraceTimer)
}

function onUserGesture() {
  if (!hintEnabled.value) return
  // Any genuine swipe before the hint completes its run cancels it.
  hintEnabled.value = false
}

watch(book, (b) => {
  if (b) maybeStartHint()
})

// ----- Reading-progress dwell timer -----
// Only "page" entries count toward progress. Cover and celebration are
// transient. The required dwell is shorter for first/last page so the user
// can sweep through cover-like pages without gaming the signal.

let dwellTimer: ReturnType<typeof setTimeout> | null = null
let dwellEntryIndex = -1

function clearDwell() {
  if (dwellTimer) clearTimeout(dwellTimer)
  dwellTimer = null
  dwellEntryIndex = -1
}

function scheduleDwellForCurrent() {
  clearDwell()
  if (!book.value) return
  const entry = displayEntries.value[currentIndex.value]
  if (!entry || entry.kind !== 'page') return
  const total = totalPagesForProgress.value
  const ms = progress.dwellMsForPage(entry.pageNumber, total)
  dwellEntryIndex = currentIndex.value
  dwellTimer = setTimeout(() => {
    if (dwellEntryIndex !== currentIndex.value) return
    if (document.visibilityState !== 'visible') return
    progress.markPageRead(bookId.value, entry.pageNumber, total)
    progress.setLastPage(bookId.value, entry.pageNumber, total)
  }, ms)
}

watch(currentIndex, () => {
  scheduleDwellForCurrent()
  if (book.value) progress.setLastPage(bookId.value, Math.max(1, currentIndex.value), totalPagesForProgress.value)
})
watch(book, (b) => {
  if (b) scheduleDwellForCurrent()
})

function onVisibilityChange() {
  if (document.visibilityState === 'visible') scheduleDwellForCurrent()
  else clearDwell()
}

onMounted(() => document.addEventListener('visibilitychange', onVisibilityChange))
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  clearDwell()
  if (hintGraceTimer) clearTimeout(hintGraceTimer)
  for (const u of trackedBlobUrls) cache.releaseBlobUrl(u)
})

// ----- Celebration page -----

const isOnCelebration = computed(() => displayEntries.value[currentIndex.value]?.kind === 'celebration')
const celebrationFiredFor = ref<string | null>(null)

function fireConfetti() {
  // Two short bursts from each side — keeps it festive without overwhelming
  // young readers or burning the GPU on slower devices.
  const colors = ['#ffd645', '#ff8b3a', '#ff4d8d', '#7e3af2', '#22c55e', '#38bdf8']
  confetti({
    particleCount: 60,
    spread: 70,
    startVelocity: 38,
    origin: { x: 0.15, y: 0.4 },
    colors
  })
  confetti({
    particleCount: 60,
    spread: 70,
    startVelocity: 38,
    origin: { x: 0.85, y: 0.4 },
    colors
  })
}

watch(isOnCelebration, (yes) => {
  if (!yes || !book.value) return
  // Mark the book complete (force totals to current pages so a partial-read
  // user who skips to the end doesn't 100% it just by swiping).
  const total = totalPagesForProgress.value
  for (let p = 1; p <= total - 1; p++) {
    progress.markPageRead(bookId.value, p, total - 1)
  }
  if (celebrationFiredFor.value !== bookId.value) {
    celebrationFiredFor.value = bookId.value
    nextTick(() => fireConfetti())
  }
})

// ----- Achievement badge -----

const achievementBadge = computed<string>(() => {
  const b = book.value
  if (!b?.achievementBadge) return ''
  return b.achievementBadge[lang.value] || b.achievementBadge.de || b.achievementBadge.en || ''
})

watch(achievementBadge, async (u) => {
  if (u) await ensureBlob(u)
})

// ----- Next volume in series -----

const nextBook = computed(() => (book.value ? apiBooks.nextBookInSeries(book.value) : null))
const nextBookCoverUrl = computed(() => {
  const b = nextBook.value
  if (!b) return ''
  return b.coverImage || b.previewImage || ''
})

watch(nextBookCoverUrl, async (u) => {
  if (u) await ensureBlob(u)
})

function openNextBook() {
  const b = nextBook.value
  if (!b) return
  router.replace({ name: 'app-reader', params: { bookId: b.bookId } })
}

// ----- Auto-fit text to viewport -----
// The reader fills the screen and never scrolls inside a page — we instead
// pick the largest font-size at which the title + body fit within the
// available content area (between the back button and the bottom controls).
// Works by binary-searching the font-size on the .page-inner element until
// `scrollHeight <= clientHeight` (and width fits too). Inline-style mutation
// skips Vue reactivity so each search iteration is one synchronous reflow.

const pageInnerEls = new Map<number, HTMLElement>()
const FIT_MIN_PX = 12
const FIT_MAX_PX = 64

function bindPageInner(idx: number, el: unknown) {
  if (el instanceof HTMLElement) {
    pageInnerEls.set(idx, el)
    scheduleFit()
  } else {
    pageInnerEls.delete(idx)
  }
}

function fitOne(inner: HTMLElement) {
  inner.style.fontSize = `${FIT_MAX_PX}px`
  if (
    inner.scrollHeight <= inner.clientHeight &&
    inner.scrollWidth <= inner.clientWidth
  ) {
    return
  }
  let lo = FIT_MIN_PX
  let hi = FIT_MAX_PX
  for (let i = 0; i < 10; i++) {
    const mid = (lo + hi) / 2
    inner.style.fontSize = `${mid}px`
    if (
      inner.scrollHeight <= inner.clientHeight &&
      inner.scrollWidth <= inner.clientWidth
    ) {
      lo = mid
    } else {
      hi = mid
    }
  }
  inner.style.fontSize = `${lo}px`
}

function fitText() {
  // Each rendered slot has its own page-inner; fit them all so the neighbour
  // is sized correctly the moment it slides into view. At most 2 elements.
  for (const inner of pageInnerEls.values()) fitOne(inner)
}

function scheduleFit() {
  // Two RAFs: one for Vue's render flush, one for the browser to settle
  // layout (image natural size, font swap, etc.) before we measure.
  requestAnimationFrame(() => requestAnimationFrame(fitText))
}

watch(currentIndex, scheduleFit)
watch(book, scheduleFit)
watch(blobUrlByOriginal, scheduleFit, { deep: true })
watch(pages, scheduleFit, { deep: true })

function onWindowResize() {
  measureStage()
  scheduleFit()
}

onMounted(() => {
  window.addEventListener('resize', onWindowResize)
  measureStage()
  scheduleFit()
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize)
  if (pendingFallbackTimer) clearTimeout(pendingFallbackTimer)
})

// ----- Counter / dots -----

const currentEntry = computed(() => displayEntries.value[currentIndex.value] ?? null)
const realPageCount = computed(() => displayEntries.value.filter((e) => e.kind === 'page').length)
const counterText = computed(() => {
  const entry = currentEntry.value
  if (!entry) return ''
  if (entry.kind === 'page') return `${entry.pageNumber} / ${realPageCount.value}`
  if (entry.kind === 'cover') return t('app.reader.cover')
  return t('app.reader.finished')
})

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'app-book', params: { bookId: bookId.value } })
}
</script>

<template lang="pug">
  div(class="reader-root")
    button(
      type="button"
      class="back-btn"
      :aria-label="t('app.reader.back') || 'Zurück'"
      @click="goBack"
    )
      svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5")
        path(d="m15 18-6-6 6-6")

    div(
      ref="stageRef"
      class="stage"
      :class="{ swiping: isDragging }"
      @mousedown="startSwipe"
      @mousemove="duringSwipe"
      @mouseup="endSwipe"
      @mouseleave="endSwipe"
      @touchstart.passive="startSwipe"
      @touchmove.passive="duringSwipe"
      @touchend="endSwipe"
    )
      template(v-if="loading")
        div(class="loading-state")
          div(class="spinner" aria-hidden="true")
          span {{ t('app.reader.loading') || 'Lade …' }}

      template(v-else-if="loadError || !book")
        div(class="loading-state")
          span {{ t('app.reader.notFound') || 'Geschichte nicht gefunden.' }}

      template(v-else)
        //- The deck moves all rendered slots together. Per-slot `x` keeps
        //- adjacent pages parked just off-stage so they slide in cleanly when
        //- the deck translates; the `animating` class enables CSS interp on
        //- the deck transform after the user releases.
        div(
          class="deck"
          :class="{ animating: isAnimating }"
          :style="{ transform: `translate3d(${dragOffset}px, 0, 0)` }"
          @transitionend="onDeckTransitionEnd"
        )
          div(
            v-for="slot in renderedSlots"
            :key="`slot-${slot.index}-${slot.entry.kind}`"
            class="slot"
            :style="{ transform: `translate3d(${slot.x}px, 0, 0)` }"
          )
            //- Cover
            div(
              v-if="slot.entry.kind === 'cover'"
              class="page-frame cover-frame"
            )
              img(
                :src="resolved(slot.entry.image)"
                :alt="t(localization?.title || '')"
                class="cover-img"
                draggable="false"
                @dragstart.prevent
              )

            //- Content page
            div(
              v-else-if="slot.entry.kind === 'page'"
              class="page-frame content-frame"
            )
              div(
                :ref="(el) => bindPageInner(slot.index, el)"
                class="page-inner"
              )
                h1(
                  v-if="slot.entry.page.title && slot.entry.page.title.trim()"
                  class="page-title"
                ) {{ slot.entry.page.title }}
                div(
                  class="page-body"
                  v-html="renderPageHtml(slot.entry.page.text)"
                )

            //- Celebration
            div(
              v-else-if="slot.entry.kind === 'celebration'"
              class="page-frame celebration-frame"
            )
              div(class="celebration-inner")
                AchievementBadge(
                  v-if="achievementBadge"
                  :src="resolved(achievementBadge)"
                )
                div(v-else class="celebration-burst" aria-hidden="true") 🎉
                h3(class="celebration-title") {{ t('app.reader.congratsTitle') }}

                div(
                  v-if="nextBook"
                  class="next-volume"
                )
                  div(class="next-label") {{ t('app.reader.nextStoryWaiting') }}
                  ABookCard(
                    :title="nextBook.localizations?.[lang]?.title || nextBook.localizations?.de?.title || ''"
                    :subtitle="nextBook.author"
                    :image="resolved(nextBookCoverUrl)"
                    :cover-gradient="nextBook.cover"
                    badge="NEU"
                    @click="openNextBook"
                  )

      //- Swipe hint (only when book loaded; SwipeHintHand handles its own
      //- visible/active flow based on `enabled`).
      SwipeHintHand(
        v-if="book"
        :book-id="bookId"
        :enabled="hintEnabled"
      )

      //- Page dots — clickable for fast jumping.
      div(
        v-if="book && displayEntries.length > 1"
        class="pager"
        aria-label="Seiten"
      )
        button(
          v-for="(entry, i) in displayEntries"
          :key="`dot-${i}-${entry.kind}`"
          type="button"
          class="pager-dot"
          :class="{ active: i === currentIndex, 'is-cover': entry.kind === 'cover', 'is-end': entry.kind === 'celebration' }"
          :aria-label="`Seite ${i + 1}`"
          @click="gotoIndex(i)"
        )

      //- Bottom-right counter.
      div(
        v-if="book"
        class="page-counter"
        aria-live="polite"
      ) {{ counterText }}
</template>

<style scoped lang="sass">
.reader-root
  position: fixed
  inset: 0
  background: linear-gradient(180deg, #fffaf3 0%, #fce8c8 100%)
  color: #1a1a1a
  overflow: hidden
  user-select: none
  z-index: 50
  padding-top: env(safe-area-inset-top)

.back-btn
  position: absolute
  top: calc(env(safe-area-inset-top, 0px) + 14px)
  left: 14px
  z-index: 30
  width: 44px
  height: 44px
  display: inline-flex
  align-items: center
  justify-content: center
  border-radius: 999px
  background: rgba(255, 255, 255, 0.7)
  backdrop-filter: blur(10px)
  -webkit-backdrop-filter: blur(10px)
  color: #1a1a1a
  border: 1.5px solid rgba(255, 255, 255, 0.85)
  box-shadow: 0 6px 16px -8px rgba(0, 0, 0, 0.35)
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  transition: transform 150ms ease-out, background-color 150ms ease-out

  &:hover
    background-color: rgba(255, 255, 255, 0.85)
    transform: translateY(-1px)

  &:active
    transform: scale(0.96)

.stage
  position: absolute
  inset: 0
  overflow: hidden
  cursor: grab
  touch-action: pan-y

  &.swiping
    cursor: grabbing


.deck
  position: absolute
  inset: 0
  will-change: transform

  &.animating
    transition: transform 280ms cubic-bezier(0.22, 0.61, 0.36, 1)

.slot
  position: absolute
  inset: 0
  will-change: transform

.page-frame
  position: absolute
  inset: 0
  display: flex
  flex-direction: column

.cover-frame
  background: #000

.cover-img
  width: 100%
  height: 100%
  object-fit: cover
  display: block
  pointer-events: none
  -webkit-user-drag: none

.content-frame
  background: #fffdf7
  // Top reserves the back-button (44px) + 14px top offset + 14px gap.
  // Bottom reserves pager dots + page-counter + their bottom offset + gap.
  padding-top: calc(env(safe-area-inset-top, 0px) + 72px)
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 60px)
  padding-left: 22px
  padding-right: 22px
  display: flex
  align-items: stretch
  justify-content: center

.page-inner
  width: 100%
  max-width: 720px
  height: 100%
  // The font-fitter writes an inline font-size onto this element. Title +
  // body size in `em` so they cascade. No scrolling — we shrink type until
  // it fits the available area.
  overflow: hidden
  display: flex
  flex-direction: column
  gap: 0.5em
  font-size: 22px
  line-height: 1.5

.page-title
  font-size: 1.4em
  font-weight: 900
  line-height: 1.18
  color: #1a1a1a
  margin: 0

.page-body
  font-size: 1em
  line-height: 1.5
  color: #1f1f1f
  font-weight: 600
  letter-spacing: 0.005em
  flex: 1 1 auto
  min-height: 0

.page-body :deep(p)
  margin: 0 0 0.55em

.page-body :deep(p:last-child)
  margin-bottom: 0


.page-body :deep(strong)
  font-weight: 800
  color: #111

.page-body :deep(em)
  font-style: italic

.page-body :deep(h1),
.page-body :deep(h2),
.page-body :deep(h3)
  font-weight: 900
  color: #1a1a1a
  line-height: 1.2
  margin: 0.4em 0 0.2em

.page-body :deep(h1)
  font-size: 1.4em

.page-body :deep(h2)
  font-size: 1.2em

.page-body :deep(h3)
  font-size: 1.05em

.page-body :deep(ul),
.page-body :deep(ol)
  margin: 0.4em 0 0.55em
  padding-left: 1.5em

.page-body :deep(ul)
  list-style: disc

.page-body :deep(ol)
  list-style: decimal

.page-body :deep(li)
  margin: 0.2em 0

.page-body :deep(img),
.page-body :deep(.page-img)
  display: block
  width: 100%
  max-width: 100%
  // Cap inline-image height so a 1:1 image on a tall narrow viewport leaves
  // room for the surrounding text. The fitter still measures overflow and
  // shrinks the type as needed.
  max-height: 45%
  object-fit: cover
  border-radius: 18px
  margin: 0.5em auto
  background: #f1ece2

.celebration-frame
  background: radial-gradient(circle at 50% 30%, #fff5d8 0%, #fce8c8 60%, #f7d49a 100%)
  display: flex
  align-items: center
  justify-content: center
  // p-5 on mobile, p-6 on tablets+ — only the vertical axis was oversized
  // (90px / 100px). Side gutters stay at 22px so the badge + next-volume
  // card keep their breathing room.
  padding: 1.25rem 22px

@media (min-width: 768px)
  .celebration-frame
    padding: 1.5rem 22px

.celebration-inner
  width: 100%
  max-width: 520px
  text-align: center
  display: flex
  flex-direction: column
  align-items: center
  gap: 18px

.celebration-burst
  font-size: 72px
  line-height: 1
  filter: drop-shadow(0 8px 14px rgba(255, 150, 60, 0.35))


// Achievement badge presentation lives in `AchievementBadge.vue` — keeping
// only the celebration-page emoji-fallback styles here.

.celebration-title
  font-size: 32px
  font-weight: 900
  color: #1a1a1a

.celebration-sub
  font-size: 17px
  color: #4a3b1c
  font-weight: 600

.next-volume
  margin-top: 22px
  width: 100%
  display: flex
  flex-direction: column
  align-items: center
  gap: 14px

.next-label
  font-size: 16px
  font-weight: 800
  color: #5a3b14

.pager
  position: absolute
  bottom: calc(env(safe-area-inset-bottom, 0px) + 18px)
  left: 0
  right: 0
  display: flex
  justify-content: center
  gap: 7px
  z-index: 14
  pointer-events: auto
  padding: 0 60px

.pager-dot
  width: 8px
  height: 8px
  border-radius: 999px
  background: rgba(0, 0, 0, 0.25)
  border: none
  padding: 0
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  transition: width 160ms ease-out, background-color 160ms ease-out

  &.is-cover
    background: rgba(0, 0, 0, 0.35)

  &.is-end
    background: rgba(255, 145, 60, 0.55)

  &.active
    background: #2563eb
    width: 18px

.page-counter
  position: absolute
  bottom: calc(env(safe-area-inset-bottom, 0px) + 14px)
  right: 14px
  z-index: 14
  padding: 4px 11px
  border-radius: 999px
  font-size: 12px
  font-weight: 700
  letter-spacing: 0.04em
  color: #fff
  background: rgba(30, 50, 70, 0.6)
  backdrop-filter: blur(6px)
  -webkit-backdrop-filter: blur(6px)
  pointer-events: none
  font-variant-numeric: tabular-nums

.loading-state
  position: absolute
  inset: 0
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 14px
  font-size: 15px
  font-weight: 700
  color: #5a3b14

.spinner
  width: 40px
  height: 40px
  border-radius: 999px
  border: 4px solid rgba(126, 58, 242, 0.18)
  border-top-color: #7e3af2
  animation: spin 900ms linear infinite

@keyframes spin
  to
    transform: rotate(360deg)
</style>
