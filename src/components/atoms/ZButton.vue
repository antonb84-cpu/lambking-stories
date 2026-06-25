<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  label?: string
  type?: 'primary' | 'secondary'
  icon?: 'volume' | 'book' | 'download' | 'none'
  isDisabled?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

withDefaults(defineProps<Props>(), {
  label: 'NO LABEL DEFINED!',
  type: 'primary',
  icon: 'none',
  size: 'md'
})

defineEmits(['click'])

const pressed = ref(false)
const onDown = () => (pressed.value = true)
const onUp = () => (pressed.value = false)
</script>

<template lang="pug">
  div(
    :class="{\
      'scale-75' : size === 'sm',\
      'scale-90' : size === 'md',\
      'scale-110' : size === 'lg',\
      'scale-125' : size === 'xl',\
      'opacity-50 grayscale pointer-events-none': isDisabled,\
      'w-full': true\
    }"
  )
    button(
      type="button"
      :class="[type === 'primary' ? 'z-btn-primary' : 'z-btn-secondary', { 'is-pressed': pressed }]"
      class="z-button group relative w-full inline-flex items-center justify-center gap-2 cursor-pointer \
             select-none touch-manipulation px-7 md:px-9 py-3.5 md:py-4 min-w-[140px]\
             md:min-w-[180px] transition-[transform,box-shadow,background-color] duration-100 \
             ease-out hover:scale-[102%]"
      :style="{ borderRadius: '14px' }"
      @click="$emit('click')"
      @pointerdown="onDown"
      @pointerup="onUp"
      @pointerleave="onUp"
      @pointercancel="onUp"
    )
      //- VOLUME / HEADPHONES ICON
      span(
        v-if="icon === 'volume'"
        class="relative flex items-center justify-center w-6 h-6 md:w-7 md:h-7 shrink-0"
      )
        svg(viewBox="0 0 32 32" fill="none" class="w-full h-full drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]")
          path(d="M6 12h5l7-5v18l-7-5H6z" fill="#ffffff" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round")
          path(d="M22 11c2.2 1.4 2.2 8.6 0 10" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none")
          path(d="M25 8c3.8 2.4 3.8 13.6 0 16" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none")

      //- BOOK ICON
      span(
        v-else-if="icon === 'book'"
        class="relative flex items-center justify-center w-5 h-5 md:w-6 md:h-6 shrink-0"
      )
        svg(viewBox="0 0 32 32" fill="none" class="w-full h-full drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]")
          path(d="M6 5h14a4 4 0 0 1 4 4v18H10a4 4 0 0 1-4-4V5z" fill="#ffffff" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round")
          path(d="M10 10h10M10 14h10M10 18h7" stroke="#1a2f4a" stroke-width="1.5" stroke-linecap="round")

      //- DOWNLOAD ICON
      span(
        v-else-if="icon === 'download'"
        class="relative flex items-center justify-center w-5 h-5 md:w-6 md:h-6 shrink-0"
      )
        svg(viewBox="0 0 32 32" fill="none" class="w-full h-full drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]")
          path(d="M16 4v16m0 0l-6-6m6 6l6-6" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round")
          path(d="M5 22v3a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3v-3" stroke="#ffffff" stroke-width="3" stroke-linecap="round")

      span(class="button-label relative block text-base md:text-lg tracking-wide")
        slot {{ label }}
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent
  font-family: 'Nunito', system-ui, -apple-system, "Segoe UI", Roboto, sans-serif

// PRIMARY: deep navy "Lesen" button — solid, bold, dark
.z-btn-primary
  color: #ffffff
  font-weight: 700
  letter-spacing: 0.02em
  background: linear-gradient(180deg, #21406a 0%, #142a47 100%)
  box-shadow: 0 5px 0 -1px #0a1a30, 0 10px 22px -8px rgba(10, 26, 48, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.18), inset 0 -2px 0 rgba(0, 0, 0, 0.25)
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.35)

  &:hover
    background: linear-gradient(180deg, #2b4d7a 0%, #1c3559 100%)

  &:active, &.is-pressed
    transform: translateY(4px) scale(0.98)
    box-shadow: 0 1px 0 -1px #0a1a30, 0 3px 8px -4px rgba(10, 26, 48, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(0, 0, 0, 0.25)

// SECONDARY: crimson/wine-red "Anhören" button
.z-btn-secondary
  color: #ffffff
  font-weight: 700
  letter-spacing: 0.02em
  background: linear-gradient(180deg, #b94535 0%, #8e2f23 100%)
  box-shadow: 0 5px 0 -1px #5b1a12, 0 10px 22px -8px rgba(91, 26, 18, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.22), inset 0 -2px 0 rgba(0, 0, 0, 0.22)
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.3)

  &:hover
    background: linear-gradient(180deg, #cc5142 0%, #a2382a 100%)

  &:active, &.is-pressed
    transform: translateY(4px) scale(0.98)
    box-shadow: 0 1px 0 -1px #5b1a12, 0 3px 8px -4px rgba(91, 26, 18, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.18), inset 0 -1px 0 rgba(0, 0, 0, 0.22)
</style>
