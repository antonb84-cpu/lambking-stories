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
      :class="[type === 'primary' ? 'a-btn-primary' : 'a-btn-secondary', { 'is-pressed': pressed }]"
      class="a-button group relative w-full inline-flex items-center justify-center gap-1 cursor-pointer \
             select-none touch-manipulation px-7 md:px-9 py-4 md:py-5 min-w-[140px]\
             md:min-w-[180px] transition-[transform,box-shadow,background-color] duration-100 \
             ease-out hover:scale-[102%]"
      :style="{ borderRadius: '32px' }"
      @click="$emit('click')"
      @pointerdown="onDown"
      @pointerup="onUp"
      @pointerleave="onUp"
      @pointercancel="onUp"
    )
      //- 3D VOLUME ICON (primary default)
      span(
        v-if="icon === 'volume'"
        class="relative flex items-center justify-center w-7 h-7 md:w-8 md:h-8 shrink-0"
      )
        svg(viewBox="0 0 32 32" fill="none" class="w-full h-full drop-shadow-[0_2px_2px_rgba(0,0,0,0.35)]")
          defs
            linearGradient(id="volGrad" x1="0" y1="0" x2="0" y2="1")
              stop(offset="0%" stop-color="#ffffff")
              stop(offset="60%" stop-color="#f3e9ff")
              stop(offset="100%" stop-color="#c9a8ff")
          path(d="M6 12h5l7-5v18l-7-5H6z" fill="url(#volGrad)" stroke="#3a1566" stroke-width="1.5" stroke-linejoin="round")
          path(d="M22 11c2.2 1.4 2.2 8.6 0 10" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none")
          path(d="M25 8c3.8 2.4 3.8 13.6 0 16" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none")

      //- 3D BOOK ICON
      span(
        v-else-if="icon === 'book'"
        class="relative flex items-center justify-center w-6 h-6 md:w-7 md:h-7 shrink-0"
      )
        svg(viewBox="0 0 32 32" fill="none" class="w-full h-full drop-shadow-[0_2px_2px_rgba(74,39,138,0.35)]")
          defs
            linearGradient(id="bookGrad" x1="0" y1="0" x2="0" y2="1")
              stop(offset="0%" stop-color="#b388ff")
              stop(offset="100%" stop-color="#6a3ecc")
          path(d="M6 5h14a4 4 0 0 1 4 4v18H10a4 4 0 0 1-4-4V5z" fill="url(#bookGrad)" stroke="#3a1566" stroke-width="1.5" stroke-linejoin="round")
          path(d="M10 10h10M10 14h10M10 18h7" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round")

      //- 3D DOWNLOAD ICON
      span(
        v-else-if="icon === 'download'"
        class="relative flex items-center justify-center w-6 h-6 md:w-7 md:h-7 shrink-0"
      )
        svg(viewBox="0 0 32 32" fill="none" class="w-full h-full drop-shadow-[0_2px_2px_rgba(74,39,138,0.35)]")
          defs
            linearGradient(id="dlGrad" x1="0" y1="0" x2="0" y2="1")
              stop(offset="0%" stop-color="#b388ff")
              stop(offset="100%" stop-color="#6a3ecc")
          path(d="M16 4v16m0 0l-6-6m6 6l6-6" stroke="url(#dlGrad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round")
          path(d="M5 22v3a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3v-3" stroke="url(#dlGrad)" stroke-width="3" stroke-linecap="round")

      span(class="button-label relative block text-base md:text-lg tracking-wide")
        slot {{ label }}
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent
  font-family: 'PoetsenOne', system-ui, -apple-system, "Segoe UI", Roboto, sans-serif

// PRIMARY: vibrant grape purple pill, bold white text
.a-btn-primary
  color: #ffffff
  font-weight: 800
  letter-spacing: 0.02em
  background: linear-gradient(180deg, #8a3ffc 0%, #6929c4 100%)
  box-shadow: 0 8px 0 -2px #3d1676, 0 12px 24px -6px rgba(61, 22, 118, 0.55), inset 0 2px 0 rgba(255, 255, 255, 0.35), inset 0 -3px 0 rgba(0, 0, 0, 0.18)
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.25)

  &:hover
    background: linear-gradient(180deg, #9a55ff 0%, #7733d6 100%)

  &:active, &.is-pressed
    transform: translateY(5px) scale(0.98)
    box-shadow: 0 3px 0 -2px #3d1676, 0 4px 10px -4px rgba(61, 22, 118, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.25), inset 0 -1px 0 rgba(0, 0, 0, 0.2)

// SECONDARY: semi-transparent lavender pill, purple text
.a-btn-secondary
  color: #5b21b6
  font-weight: 700
  letter-spacing: 0.02em
  background: rgba(213, 193, 255, 0.55)
  backdrop-filter: blur(6px)
  -webkit-backdrop-filter: blur(6px)
  border: 1.5px solid rgba(138, 63, 252, 0.35)
  box-shadow: 0 6px 0 -2px rgba(138, 63, 252, 0.25), 0 8px 20px -6px rgba(61, 22, 118, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.6)

  &:hover
    background: rgba(213, 193, 255, 0.75)

  &:active, &.is-pressed
    transform: translateY(4px) scale(0.98)
    box-shadow: 0 2px 0 -2px rgba(138, 63, 252, 0.3), 0 3px 8px -4px rgba(61, 22, 118, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5)
</style>
