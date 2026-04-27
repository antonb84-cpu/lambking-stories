<template lang="pug">
  div(
    v-if="visible"
    class="swipe-hint-hand"
    aria-hidden="true"
  )
    //- The "press dot" that follows the finger tip — drops onto the page on
    //- touchdown, fades out mid-swipe.
    div(class="press-dot" :class="{ 'is-active': active }")
    //- Hand itself: simple, high-contrast SVG silhouette. Animates along the
    //- X axis to mimic a press-and-swipe gesture.
    svg(
      class="hand-svg"
      :class="{ 'is-active': active }"
      viewBox="0 0 64 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    )
      g(stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round" stroke-linecap="round")
        //- palm
        path(
          d="M14 48c0-6 2-10 6-12V20c0-4 3-7 7-7s7 3 7 7v22"
          fill="#ffd9ad"
        )
        //- index finger (pressing down)
        path(
          d="M27 13c0-5 4-9 9-9s9 4 9 9v28c3 1 5 4 5 8v14c0 9-7 16-16 16H27c-9 0-16-7-16-16V44c0-4 3-7 7-7h9"
          fill="#ffd9ad"
        )
        //- knuckle shading strokes
        path(d="M20 54h12" stroke-opacity="0.45")
        path(d="M20 64h16" stroke-opacity="0.35")
</template>

<script lang="ts">
export function hasSeenSwipeHint(bookId: string): boolean {
  try {
    return localStorage.getItem(`kanaan.swipeHintSeen.${bookId}`) === '1'
  } catch {
    return false
  }
}

export function markSwipeHintSeen(bookId: string): void {
  try {
    localStorage.setItem(`kanaan.swipeHintSeen.${bookId}`, '1')
  } catch {
    // ignore
  }
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  bookId: string
  /** Gate externally — parent may force-hide on user swipe. */
  enabled: boolean
  /** How many swipe reps before hiding (caller controls total run count). */
  repeats?: number
}>()

const emit = defineEmits<{
  (e: 'finished'): void
}>()

const visible = ref(true)
const active = ref(false)
let runTimer: ReturnType<typeof setTimeout> | null = null
let finishedEmitted = false

const REPEATS = props.repeats ?? 2
// One full press + swipe + reset cycle. Keep it calm — young readers get
// motion-sick from fast gestures.
const CYCLE_MS = 2200

function finish() {
  if (finishedEmitted) return
  finishedEmitted = true
  visible.value = false
  active.value = false
  if (runTimer) clearTimeout(runTimer)
  runTimer = null
  markSwipeHintSeen(props.bookId)
  emit('finished')
}

function startCycle(remaining: number) {
  if (!props.enabled) return
  if (remaining <= 0) {
    finish()
    return
  }
  active.value = false
  runTimer = setTimeout(() => {
    active.value = true
    runTimer = setTimeout(() => {
      startCycle(remaining - 1)
    }, CYCLE_MS)
  }, 250)
}

watch(
  () => props.enabled,
  (on) => {
    if (on) {
      visible.value = true
      finishedEmitted = false
      startCycle(REPEATS)
    } else {
      if (runTimer) clearTimeout(runTimer)
      runTimer = null
      visible.value = false
      active.value = false
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (runTimer) clearTimeout(runTimer)
})
</script>

<style scoped lang="sass">
.swipe-hint-hand
  position: absolute
  inset: 0
  pointer-events: none
  z-index: 12
  overflow: hidden

.hand-svg
  position: absolute
  bottom: 22%
  right: 18%
  width: 72px
  height: 99px
  // scaleX(-1) mirrors the hand so the index finger points the right way for
  // a right→left swipe (page 1 → page 2).
  transform: translate(0, 0) rotate(12deg) scaleX(-1)
  transition: transform 1800ms cubic-bezier(0.45, 0.05, 0.4, 1), opacity 220ms ease
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.25))
  opacity: 0

.hand-svg.is-active
  // Press + drag left across roughly half of a mobile page.
  transform: translate(-52vw, -6px) rotate(4deg) scaleX(-1)
  opacity: 1

.press-dot
  position: absolute
  bottom: calc(22% + 6px)
  right: calc(18% + 8px)
  width: 18px
  height: 18px
  border-radius: 999px
  background: radial-gradient(circle, rgba(80, 140, 255, 0.65) 0%, rgba(80, 140, 255, 0) 70%)
  transform: translate(0, 0) scale(0.4)
  opacity: 0
  transition: transform 1800ms cubic-bezier(0.45, 0.05, 0.4, 1), opacity 260ms ease

.press-dot.is-active
  transform: translate(-52vw, -6px) scale(1)
  opacity: 1

@media (max-width: 420px)
  .hand-svg
    bottom: 20%
    right: 14%
  .press-dot
    bottom: calc(20% + 6px)
    right: calc(14% + 8px)
</style>
