<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  isPlaying?: boolean
  isDisabled?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  progress?: number // 0..1, when provided renders progress ring
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  isPlaying: false,
  isDisabled: false,
  size: 'md',
  progress: -1,
  label: 'Play'
})

defineEmits(['click'])

const pressed = ref(false)
const onDown = () => (pressed.value = true)
const onUp = () => (pressed.value = false)

const dims = computed(() => {
  switch (props.size) {
    case 'sm':
      return { box: 48, stroke: 3 }
    case 'lg':
      return { box: 88, stroke: 5 }
    case 'xl':
      return { box: 112, stroke: 6 }
    default:
      return { box: 64, stroke: 4 }
  }
})

const hasRing = computed(() => props.progress >= 0)
const radius = computed(() => (dims.value.box - dims.value.stroke) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => {
  const p = Math.min(1, Math.max(0, props.progress))
  return circumference.value * (1 - p)
})
</script>

<template lang="pug">
  div(
    :class="{ 'opacity-50 grayscale pointer-events-none': isDisabled }"
    class="relative inline-block"
    :style="{ width: dims.box + 'px', height: dims.box + 'px' }"
  )
    //- Progress ring (only when progress provided)
    svg(
      v-if="hasRing"
      class="absolute inset-0 -rotate-90 pointer-events-none"
      :width="dims.box"
      :height="dims.box"
    )
      circle(
        :cx="dims.box / 2"
        :cy="dims.box / 2"
        :r="radius"
        fill="none"
        stroke="#e6d6b5"
        :stroke-width="dims.stroke"
      )
      circle(
        :cx="dims.box / 2"
        :cy="dims.box / 2"
        :r="radius"
        fill="none"
        stroke="#d4a83e"
        :stroke-width="dims.stroke"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        class="transition-[stroke-dashoffset] duration-300 ease-out"
      )

    button(
      type="button"
      :aria-label="label"
      :aria-pressed="isPlaying"
      :class="{ 'is-pressed': pressed, 'is-playing': isPlaying }"
      class="z-play-btn absolute rounded-full inline-flex items-center justify-center cursor-pointer select-none touch-manipulation transition-[transform,box-shadow,background-color] duration-150 ease-out hover:scale-[104%]"
      :style="hasRing ? { top: (dims.stroke + 2) + 'px', left: (dims.stroke + 2) + 'px', right: (dims.stroke + 2) + 'px', bottom: (dims.stroke + 2) + 'px' } : { inset: '0' }"
      @click="$emit('click')"
      @pointerdown="onDown"
      @pointerup="onUp"
      @pointerleave="onUp"
      @pointercancel="onUp"
    )
      //- Play triangle
      svg(
        v-if="!isPlaying"
        viewBox="0 0 24 24"
        class="w-1/2 h-1/2 translate-x-[6%] drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]"
        fill="#ffffff"
      )
        path(d="M7 4.5c0-.9.97-1.45 1.74-.99l11 6.5c.76.45.76 1.54 0 1.99l-11 6.5C7.97 18.95 7 18.4 7 17.5v-13z")
      //- Pause bars
      svg(
        v-else
        viewBox="0 0 24 24"
        class="w-1/2 h-1/2 drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]"
        fill="#ffffff"
      )
        rect(x="6" y="4.5" width="4" height="15" rx="1.2")
        rect(x="14" y="4.5" width="4" height="15" rx="1.2")
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent

.z-play-btn
  background: radial-gradient(120% 120% at 30% 25%, #cc5142 0%, #a93d2e 45%, #7a2a1f 100%)
  box-shadow: 0 6px 0 -1px #4a160e, 0 14px 26px -6px rgba(74, 22, 14, 0.55), inset 0 3px 0 rgba(255, 255, 255, 0.32), inset 0 -4px 0 rgba(0, 0, 0, 0.24)

  &:hover
    background: radial-gradient(120% 120% at 30% 25%, #d96354 0%, #bd4435 45%, #8a3022 100%)

  &:active, &.is-pressed
    transform: translateY(4px) scale(0.94)
    box-shadow: 0 2px 0 -1px #4a160e, 0 4px 10px -4px rgba(74, 22, 14, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.22), inset 0 -2px 0 rgba(0, 0, 0, 0.24)

  animation: none

  &:not(.is-pressed):not(:active)
    animation: z-play-squish-release 260ms ease-out

@keyframes z-play-squish-release
  0%
    transform: translateY(3px) scale(0.95)
  55%
    transform: translateY(-2px) scale(1.04, 0.97)
  100%
    transform: translateY(0) scale(1)
</style>
