<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  progress?: number // 0..1
  label?: string    // overrides default "X% gelesen"
  isDisabled?: boolean
  movable?: boolean
  seekable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  progress: 0,
  label: '',
  isDisabled: false,
  movable: true,
  seekable: true
})

const emit = defineEmits<{ (e: 'seek', value: number): void }>()

const pressed = ref(false)
const trackRef = ref<HTMLElement | null>(null)

const clamped = computed(() => Math.min(1, Math.max(0, props.progress)))
const percent = computed(() => Math.round(clamped.value * 100))
const displayLabel = computed(() => props.label || `${percent.value}% gelesen`)

const seekFromEvent = (e: PointerEvent) => {
  if (!props.seekable || !trackRef.value) return
  const rect = trackRef.value.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  emit('seek', ratio)
}

const onDown = (e: PointerEvent) => {
  if (!props.movable) return
  pressed.value = true
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  seekFromEvent(e)
}
const onMove = (e: PointerEvent) => {
  if (!props.movable) return
  if (pressed.value) seekFromEvent(e)
}
const onUp = () => {
  if (!props.movable) return
  pressed.value = false
}

</script>

<template lang="pug">
  div(
    :class="{ 'opacity-50 grayscale pointer-events-none': isDisabled }"
    class="z-player w-full select-none"
  )
    div(
      ref="trackRef"
      :class="{ 'is-pressed': pressed, 'is-seekable': seekable }"
      class="z-player-track relative w-full touch-none"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
    )
      div(
        class="z-player-fill absolute left-0 top-0 h-full"
        :style="{ width: (clamped * 100) + '%' }"
      )
      span(
        class="z-player-knob absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
        :class={
          'not-movable': !movable
        }
        :style="{ left: (clamped * 100) + '%' }"
      )

    p(class="z-player-label mt-2 text-xs md:text-sm font-medium tracking-wide")
      | {{ displayLabel }}
</template>

<style scoped lang="sass">
.z-player-track
  height: 14px
  border-radius: 999px
  background-color: #ede0c0
  box-shadow: inset 0 2px 4px rgba(58, 42, 18, 0.18), inset 0 -1px 0 rgba(255, 255, 255, 0.6)
  transition: transform 150ms ease-out

  &.is-seekable
    cursor: pointer

  &:hover .z-player-knob
    transform: translate(-50%, -50%) scale(1.1)

  &:not(.seekable):hover .z-player-knob
    transform: translate(0, 0) scale(1)

  &.is-pressed
    transform: scaleY(1.08)

  &.is-pressed .z-player-knob
    transform: translate(-50%, -50%) scale(0.88)

  &.is-pressed:not(.seekable) .z-player-knob
    transform: translate(0, 0) scale(1)

.z-player-fill
  border-radius: 999px
  background: linear-gradient(90deg, #c89030 0%, #d4a83e 100%)
  box-shadow: 0 0 0 1px rgba(122, 90, 31, 0.3), 0 2px 6px -1px rgba(212, 168, 62, 0.45)
  transition: width 200ms ease-out

.z-player-knob
  width: 20px
  height: 20px
  border-radius: 999px
  background: radial-gradient(120% 120% at 30% 25%, #ffffff 0%, #fbf1d6 60%, #e0c082 100%)
  border: 2px solid #1a2f4a
  box-shadow: 0 3px 8px -2px rgba(58, 42, 18, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.8)
  transition: transform 150ms ease-out

.z-player-label
  color: #7a6b55

@media (max-width: 400px)
  .z-player-track
    height: 10px
  .z-player-knob
    width: 16px
    height: 16px
    border-width: 1.5px
  .z-player-label
    font-size: 10px
    margin-top: 4px
</style>
