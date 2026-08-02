<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

interface Props {
  images: string[]
  intervalMs?: number
  aspectRatio?: string
}

const props = withDefaults(defineProps<Props>(), {
  intervalMs: 6000,
  aspectRatio: '9 / 5'
})

const currentIndex = ref(0)
const containerEl = ref<HTMLElement | null>(null)
const containerWidth = ref(1)

// Pointer-drag state. Track activeId so a second finger doesn't hijack
// the gesture mid-swipe — the slider only listens to its capturing pointer.
const activeId = ref<number | null>(null)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragDeltaX = ref(0)
const dragStartTime = ref(0)
const isHorizontalDrag = ref(false)
const isDragging = computed(() => activeId.value !== null && isHorizontalDrag.value)

let autoTimer: number | null = null

function startAuto() {
  stopAuto()
  if (props.images.length <= 1) return
  autoTimer = window.setInterval(() => {
    // Don't fight the user: skip the tick while a finger is on the slider.
    if (activeId.value === null) next()
  }, props.intervalMs)
}

function stopAuto() {
  if (autoTimer != null) {
    clearInterval(autoTimer)
    autoTimer = null
  }
}

function goTo(idx: number) {
  const n = props.images.length
  if (n === 0) return
  currentIndex.value = ((idx % n) + n) % n
  // Reset the auto-advance clock so a manual jump gets a full interval
  // before the next auto-tick — feels less twitchy than continuing the
  // old cadence.
  startAuto()
}

function next() {
  goTo(currentIndex.value + 1)
}

function prev() {
  goTo(currentIndex.value - 1)
}

function measure() {
  if (containerEl.value) containerWidth.value = containerEl.value.clientWidth || 1
}

function onPointerDown(e: PointerEvent) {
  if (props.images.length <= 1) return
  // Ignore right-click / middle-click; only react to primary pointer.
  if (e.button !== 0 && e.pointerType === 'mouse') return
  activeId.value = e.pointerId
  dragStartX.value = e.clientX
  dragStartY.value = e.clientY
  dragDeltaX.value = 0
  dragStartTime.value = performance.now()
  isHorizontalDrag.value = false
  measure()
}

function onPointerMove(e: PointerEvent) {
  if (activeId.value !== e.pointerId) return
  const dx = e.clientX - dragStartX.value
  const dy = e.clientY - dragStartY.value
  // First-move classification: if the user is mostly scrolling the page
  // vertically, release the gesture so they can scroll through the
  // slider without it stealing the touch.
  if (!isHorizontalDrag.value) {
    const adx = Math.abs(dx)
    const ady = Math.abs(dy)
    if (adx < 6 && ady < 6) return
    if (ady > adx) {
      activeId.value = null
      return
    }
    isHorizontalDrag.value = true
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  dragDeltaX.value = dx
}

function endDrag(e: PointerEvent) {
  if (activeId.value !== e.pointerId) return
  const dx = dragDeltaX.value
  const dt = performance.now() - dragStartTime.value
  const v = dx / Math.max(dt, 1)
  const threshold = containerWidth.value * 0.18
  const wasHorizontal = isHorizontalDrag.value
  activeId.value = null
  dragDeltaX.value = 0
  isHorizontalDrag.value = false
  try {
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
  } catch { /* not captured */
  }

  if (!wasHorizontal) return
  // Distance OR flick velocity advances; otherwise the spring CSS
  // transition snaps the track back to the current slide.
  if (Math.abs(dx) > threshold || Math.abs(v) > 0.45) {
    if (dx < 0) next()
    else prev()
  }
}

const trackTransform = computed(() => {
  const w = containerWidth.value || 1
  const dragPct = isDragging.value ? (dragDeltaX.value / w) * 100 : 0
  return `translate3d(calc(${-currentIndex.value * 100}% + ${dragPct}%), 0, 0)`
})

function onResize() {
  measure()
}

onMounted(() => {
  measure()
  window.addEventListener('resize', onResize)
  startAuto()
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  stopAuto()
})
</script>

<template lang="pug">
  div(
    ref="containerEl"
    class="welcome-slider"
    :style="{ aspectRatio: aspectRatio }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="endDrag"
    @pointercancel="endDrag"
  )
    div(
      class="welcome-slider-track"
      :class="{ 'is-dragging': isDragging }"
      :style="{ transform: trackTransform }"
    )
      div(
        v-for="(src, i) in images"
        :key="i"
        class="welcome-slide"
      )
        img(
          :src="src"
          :alt="`Welcome ${i + 1}`"
          class="welcome-slide-img"
          draggable="false"
          decoding="async"
          :loading="i === 0 ? 'eager' : 'lazy'"
        )
        //- Per-slide overlay slot — use #overlay-0, #overlay-1, etc. to
        //- mount content (badges, donate buttons, …) on a specific slide.
        div(class="welcome-slide-overlay relative")
          slot(:name="`overlay-${i}`")

    div(
      v-if="images.length > 1"
      class="welcome-slider-dots -mb-2"
      aria-label="Slide navigation"
    )
      button(
        v-for="(_, i) in images"
        :key="i"
        type="button"
        class=""
        :class="['welcome-slider-dot', { 'is-active': currentIndex === i }]"
        :aria-label="`Show slide ${i + 1}`"
        :aria-current="currentIndex === i ? 'true' : undefined"
        @click="goTo(i)"
      )
</template>

<style scoped lang="sass">
.welcome-slider
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 18px
  background: rgba(0, 0, 0, 0.04)
  // Allow vertical page scroll while the slider captures horizontal swipes.
  touch-action: pan-y
  -webkit-user-select: none
  user-select: none
  box-shadow: 0 10px 24px -14px rgba(58, 42, 18, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.35)

.welcome-slider-track
  display: flex
  height: 100%
  width: 100%
  will-change: transform
  transition: transform 420ms cubic-bezier(0.22, 1.2, 0.36, 1)

  &.is-dragging
    transition: none

.welcome-slide
  position: relative
  flex: 0 0 100%
  width: 100%
  height: 100%
  // Makes the slide a query container so overlay copy can be sized in
  // `cqw` — text laid over the artwork has to scale with the banner, not
  // with the viewport, or it drifts off the illustration's clear areas at
  // the desktop width cap.
  container-type: inline-size

.welcome-slide-img
  width: 100%
  height: 100%
  object-fit: fill
  background: #1a2f4a
  display: block
  pointer-events: none

.welcome-slide-overlay
  position: absolute
  inset: 0
  // Children that need to be tappable (donate buttons) re-enable
  // pointer-events themselves; the overlay layer itself stays
  // transparent so swipes on empty space still drive the slider.
  pointer-events: none
  display: flex
  flex-direction: column
  justify-content: flex-end
  // Leave room at the bottom so per-slide content doesn't collide with
  // the navigation dots.
  padding: 4px 4px 4px

.welcome-slide-overlay > :deep(*)
  pointer-events: auto

// Opt-out for overlay content that covers a large part of the slide (the
// headline block). Without it the copy swallows the swipe that drives the
// slider. Same specificity as the rule above, declared after it, so the
// opt-out wins regardless of which component's styles are injected first.
.welcome-slide-overlay > :deep([data-swipe-through])
  pointer-events: none

.welcome-slider-dots
  position: absolute
  bottom: 12px
  left: 50%
  transform: translateX(-50%)
  display: flex
  gap: 8px
  z-index: 2
  // The dots row itself is a stripe of buttons; keep its hit area tight
  // but raise the rendered dots above any image overlay text.
  padding: 4px 6px
  border-radius: 999px
  background: rgba(20, 42, 71, 0.28)
  backdrop-filter: blur(6px)
  -webkit-backdrop-filter: blur(6px)

.welcome-slider-dot
  width: 8px
  height: 8px
  border-radius: 999px
  border: none
  background: rgba(255, 255, 255, 0.55)
  cursor: pointer
  padding: 0
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35)
  transition: background-color 220ms ease-out, transform 220ms ease-out, width 220ms ease-out
  -webkit-tap-highlight-color: transparent

  &:hover
    background: rgba(255, 255, 255, 0.85)

  &.is-active
    background: #ffffff
    width: 20px
</style>
