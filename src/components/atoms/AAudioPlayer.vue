<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  isPlaying?: boolean
  currentTime?: number
  duration?: number
  skipSeconds?: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  skipSeconds: 15,
  loading: false
})

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'rewind', seconds: number): void
  (e: 'forward', seconds: number): void
  (e: 'seek', value: number): void
}>()

const SMALL_SKIP = 5

const trackRef = ref<HTMLDivElement | null>(null)
const dragging = ref(false)

const progress = computed(() => {
  if (!props.duration) return 0
  return Math.min(100, Math.max(0, (props.currentTime / props.duration) * 100))
})

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function seekFromEvent(event: PointerEvent) {
  const el = trackRef.value
  if (!el || !props.duration) return
  const rect = el.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  emit('seek', ratio * props.duration)
}

function onPointerDown(event: PointerEvent) {
  dragging.value = true
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  seekFromEvent(event)
  event.preventDefault()
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value) return
  seekFromEvent(event)
}

function onPointerUp(event: PointerEvent) {
  if (!dragging.value) return
  dragging.value = false
  try {
    ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
  } catch { /* already released */
  }
}
</script>

<template lang="pug">
  div(class="a-audio-player relative w-full rounded-3xl px-5 py-4 md:px-6 md:py-5 select-none")
    //- Progress bar — fat hit area (20px) with a 6px visual track inside
    div(class="a-audio-progress-wrap")
      div(
        ref="trackRef"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        class="a-audio-hit relative w-full h-5 flex items-center cursor-pointer touch-none select-none"
      )
        div(class="a-audio-track relative w-full h-[6px] rounded-full pointer-events-none")
          div(
            class="a-audio-fill absolute inset-y-0 left-0 rounded-full"
            :style="{ width: `${progress}%` }"
          )
          div(
            class="a-audio-handle absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full"
            :style="{ left: `${progress}%` }"
            :class="{ 'is-dragging': dragging }"
          )

      div(class="mt-2 flex items-center justify-between text-[11px] md:text-xs font-extrabold tabular-nums a-audio-time")
        span {{ formatTime(currentTime) }}
        span {{ formatTime(duration) }}

    //- Controls
    div(class="mt-3 md:mt-4 flex items-center justify-center gap-3 md:gap-4")
      button(
        type="button"
        @click="emit('rewind', SMALL_SKIP)"
        :aria-label="`Rewind ${SMALL_SKIP}s`"
        class="a-audio-side-btn a-audio-side-btn--sm group relative inline-flex items-center justify-center w-8 h-8 rounded-full cursor-pointer"
      )
        svg(viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4")
          path(d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z")
        span(class="a-audio-skip-num absolute bottom-[2px] text-[7px] font-black") {{ SMALL_SKIP }}
      button(
        type="button"
        @click="emit('rewind', skipSeconds)"
        :aria-label="`Rewind ${skipSeconds}s`"
        class="a-audio-side-btn group relative inline-flex items-center justify-center w-11 h-11 rounded-full cursor-pointer"
      )
        svg(viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5")
          path(d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z")
        span(class="a-audio-skip-num absolute bottom-1 text-[8px] font-black") {{ skipSeconds }}


      button(
        type="button"
        @click="emit('toggle')"
        :disabled="loading"
        :aria-label="loading ? 'Loading' : (isPlaying ? 'Pause' : 'Play')"
        :aria-busy="loading || undefined"
        class="a-audio-play group relative inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full cursor-pointer transition-transform duration-150 ease-out hover:scale-[104%] active:scale-[96%]"
        :class="{ 'is-loading': loading }"
      )
        //- 3-dot "merging/splitting" indicator while audio buffers.
        div(v-if="loading" class="a-audio-dots" aria-hidden="true")
          span(class="a-audio-dot a-audio-dot--1")
          span(class="a-audio-dot a-audio-dot--2")
          span(class="a-audio-dot a-audio-dot--3")
        svg(v-else-if="isPlaying" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8")
          rect(x="6" y="5" width="4" height="14" rx="1.2")
          rect(x="14" y="5" width="4" height="14" rx="1.2")
        svg(v-else viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 translate-x-[2px]")
          path(d="M8 5v14l11-7z")

      button(
        type="button"
        @click="emit('forward', skipSeconds)"
        :aria-label="`Forward ${skipSeconds}s`"
        class="a-audio-side-btn group relative inline-flex items-center justify-center w-11 h-11 rounded-full cursor-pointer"
      )
        svg(viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5")
          path(d="M12 5V1l5 5-5 5V7a6 6 0 1 0 6 6h2a8 8 0 1 1-8-8z")
        span(class="a-audio-skip-num absolute bottom-1 text-[8px] font-black") {{ skipSeconds }}

      //5 sec button
      button(
        type="button"
        @click="emit('forward', SMALL_SKIP)"
        :aria-label="`Forward ${SMALL_SKIP}s`"
        class="a-audio-side-btn a-audio-side-btn--sm group relative inline-flex items-center justify-center w-8 h-8 rounded-full cursor-pointer"
      )
        svg(viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4")
          path(d="M12 5V1l5 5-5 5V7a6 6 0 1 0 6 6h2a8 8 0 1 1-8-8z")
        span(class="a-audio-skip-num absolute bottom-[2px] text-[7px] font-black") {{ SMALL_SKIP }}
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent
  background: transparent
  border: none
  padding: 0

.a-audio-player
  background: linear-gradient(160deg, #9560f4 0%, #7e3af2 60%, #6929c4 100%)
  border: 1px solid rgba(255, 255, 255, 0.22)
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08), 0 24px 60px -20px rgba(61, 22, 118, 0.55)
  color: #ffffff

.a-audio-track
  background-color: rgba(255, 255, 255, 0.25)

.a-audio-fill
  background: linear-gradient(90deg, #ffd147 0%, #ffffff 100%)
  box-shadow: 0 0 10px rgba(255, 209, 71, 0.7)

.a-audio-handle
  background-color: #ffffff
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.18), 0 0 16px 2px rgba(255, 209, 71, 0.8)
  transition: transform 120ms ease-out

  &.is-dragging
    transform: translate(-50%, -50%) scale(1.25)

.a-audio-time
  color: rgba(255, 255, 255, 0.85)

.a-audio-side-btn
  color: rgba(255, 255, 255, 0.92)
  background-color: rgba(255, 255, 255, 0.12)
  border: 1px solid rgba(255, 255, 255, 0.2)
  border-radius: 9999px
  aspect-ratio: 1 / 1
  flex-shrink: 0
  transition: transform 150ms ease-out, background-color 150ms ease-out

  &:hover
    background-color: rgba(255, 255, 255, 0.22)
    transform: translateY(-1px)

  &:active
    transform: scale(0.96)

.a-audio-side-btn--sm
  background-color: rgba(255, 255, 255, 0.08)

.a-audio-skip-num
  color: rgba(255, 255, 255, 0.85)

.a-audio-play
  background-color: #ffffff
  color: #6929c4
  border: 3px solid #ffd147
  border-radius: 9999px
  aspect-ratio: 1 / 1
  flex-shrink: 0
  box-shadow: 0 0 0 1px rgba(255, 209, 71, 0.3), 0 0 28px -2px rgba(255, 209, 71, 0.6), 0 12px 32px -8px rgba(61, 22, 118, 0.55)

  &.is-loading
    cursor: progress

// Three dots that slide along a horizontal line, merging into one and
// splitting back out — same vibe as Google Voice / Assistant "thinking".
.a-audio-dots
  position: relative
  width: 44px
  height: 10px
  display: flex
  align-items: center
  justify-content: center

.a-audio-dot
  position: absolute
  top: 50%
  width: 10px
  height: 10px
  border-radius: 999px
  background-color: #6929c4
  transform: translate(-50%, -50%)
  will-change: left, transform, opacity

.a-audio-dot--1
  animation: a-audio-dot-1 1300ms ease-in-out infinite

.a-audio-dot--2
  animation: a-audio-dot-2 1300ms ease-in-out infinite

.a-audio-dot--3
  animation: a-audio-dot-3 1300ms ease-in-out infinite

@keyframes a-audio-dot-1
  0%
    left: 14%
  45%, 55%
    left: 50%
  100%
    left: 14%

@keyframes a-audio-dot-2
  0%, 100%
    left: 50%
    transform: translate(-50%, -50%) scale(1)
  45%, 55%
    transform: translate(-50%, -50%) scale(1.25)

@keyframes a-audio-dot-3
  0%
    left: 86%
  45%, 55%
    left: 50%
  100%
    left: 86%
</style>
