<script setup lang="ts">
/**
 * Reusable achievement-badge presenter.
 *
 * Wraps the badge image in a perspective stage with three layered effects:
 *   1. A soft warm bloom behind the artwork (`::before` pulse).
 *   2. The image itself running a 3D tilt + alpha-shape drop-shadow that
 *      tracks the rotation in lockstep.
 *   3. A diagonal shine sibling masked by the badge's alpha so the highlight
 *      only paints the opaque pixels of the artwork.
 *
 * Both `AppReaderView` (the in-app celebration page) and the AdminUI's
 * iPhone preview render the same badge, so this component encapsulates the
 * effect for one source of truth on either side.
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Resolved URL of the badge (https://… or blob:…). */
    src: string
    /** Cap the badge size on its longest edge. */
    maxSize?: string
  }>(),
  { maxSize: '360px' }
)

// Build a CSS `url('…')` expression once so the mask + the inline style
// don't re-stringify per render frame.
const stageStyle = computed(() => ({
  '--badge-src': `url('${props.src}')`,
  maxWidth: props.maxSize
}))
</script>

<template lang="pug">
  div(
    v-if="src"
    class="achievement-badge-stage"
    :style="stageStyle"
    aria-hidden="true"
  )
    //- Frame hugs the natural badge size so img + shine share an identical
    //- box and never get scaled to fill anything.
    div(class="achievement-badge-frame")
      img(
        :src="src"
        alt=""
        class="achievement-badge"
        draggable="false"
        @dragstart.prevent
      )
      //- Diagonal highlight clipped to the badge silhouette via the alpha
      //- mask so the shine only rolls across the opaque artwork.
      div(class="achievement-badge-shine")
</template>

<style scoped lang="sass">
.achievement-badge-stage
  position: relative
  width: 100%
  margin: 0 auto
  perspective: 900px
  perspective-origin: 50% 40%
  display: flex
  align-items: center
  justify-content: center
  pointer-events: none
  isolation: isolate

  &::before
    content: ''
    position: absolute
    inset: 6%
    border-radius: 50%
    background: radial-gradient(ellipse at center, rgba(255, 210, 130, 0.65) 0%, rgba(255, 165, 70, 0.22) 40%, transparent 72%)
    filter: blur(22px)
    z-index: -1
    animation: ab-bloom 7s ease-in-out infinite
    pointer-events: none

.achievement-badge-frame
  position: relative
  display: inline-block
  max-width: 100%
  line-height: 0

.achievement-badge
  display: block
  width: auto
  height: auto
  max-width: 100%
  max-height: 70vh
  user-select: none
  -webkit-user-drag: none
  transform-origin: 50% 60%
  transform-style: preserve-3d
  filter: drop-shadow(0 22px 28px rgba(255, 165, 70, 0.55)) drop-shadow(0 8px 12px rgba(40, 20, 0, 0.28))
  animation: ab-tilt-transform 7s ease-in-out infinite, ab-shadow 7s ease-in-out infinite
  will-change: transform, filter

.achievement-badge-shine
  position: absolute
  inset: 0
  pointer-events: none
  background: linear-gradient(105deg, transparent 30%, rgba(255, 240, 200, 0.55) 46%, rgba(255, 255, 255, 0.95) 50%, rgba(255, 240, 200, 0.55) 54%, transparent 70%)
  background-size: 240% 240%
  background-position: -120% 50%
  background-repeat: no-repeat
  mask-image: var(--badge-src)
  -webkit-mask-image: var(--badge-src)
  mask-mode: alpha
  -webkit-mask-mode: alpha
  mask-repeat: no-repeat
  -webkit-mask-repeat: no-repeat
  mask-size: 100% 100%
  -webkit-mask-size: 100% 100%
  mask-position: center
  -webkit-mask-position: center
  mix-blend-mode: screen
  opacity: 0
  transform-origin: 50% 60%
  transform-style: preserve-3d
  animation: ab-tilt-transform 7s ease-in-out infinite, ab-shine 5.5s ease-in-out infinite
  will-change: transform, background-position, opacity

@keyframes ab-tilt-transform
  0%
    transform: rotateX(6deg) rotateY(-14deg) rotateZ(-2deg)
  25%
    transform: rotateX(-4deg) rotateY(0deg) rotateZ(0deg) translateZ(10px)
  50%
    transform: rotateX(6deg) rotateY(14deg) rotateZ(2deg)
  75%
    transform: rotateX(-4deg) rotateY(0deg) rotateZ(0deg) translateZ(4px)
  100%
    transform: rotateX(6deg) rotateY(-14deg) rotateZ(-2deg)

@keyframes ab-shadow
  0%
    filter: drop-shadow(-14px 18px 26px rgba(255, 165, 70, 0.55)) drop-shadow(-5px 9px 12px rgba(40, 20, 0, 0.3))
  25%
    filter: drop-shadow(0 28px 30px rgba(255, 180, 90, 0.55)) drop-shadow(0 14px 16px rgba(40, 20, 0, 0.26))
  50%
    filter: drop-shadow(14px 18px 26px rgba(255, 165, 70, 0.55)) drop-shadow(5px 9px 12px rgba(40, 20, 0, 0.3))
  75%
    filter: drop-shadow(0 14px 22px rgba(255, 165, 70, 0.45)) drop-shadow(0 6px 10px rgba(40, 20, 0, 0.24))
  100%
    filter: drop-shadow(-14px 18px 26px rgba(255, 165, 70, 0.55)) drop-shadow(-5px 9px 12px rgba(40, 20, 0, 0.3))

@keyframes ab-shine
  0%
    background-position: -120% 50%
    opacity: 0
  8%
    opacity: 0.85
  55%
    background-position: 220% 50%
    opacity: 0.85
  62%
    opacity: 0
  100%
    background-position: 220% 50%
    opacity: 0

@keyframes ab-bloom
  0%, 100%
    transform: scale(0.94)
    opacity: 0.75
  50%
    transform: scale(1.06)
    opacity: 1

@media (prefers-reduced-motion: reduce)
  .achievement-badge
    animation: none
    transform: none
    filter: drop-shadow(0 18px 24px rgba(255, 165, 70, 0.5)) drop-shadow(0 6px 10px rgba(40, 20, 0, 0.25))

  .achievement-badge-shine
    animation: none
    opacity: 0

  .achievement-badge-stage::before
    animation: none
</style>
