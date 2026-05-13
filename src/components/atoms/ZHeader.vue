<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  greeting?: string
  title?: string
  actionLabel?: string
  showAction?: boolean
}

withDefaults(defineProps<Props>(), {
  greeting: 'Hello',
  title: 'Startseite',
  actionLabel: 'Unlock',
  showAction: true
})

defineEmits(['action'])

const pressed = ref(false)
const onDown = () => (pressed.value = true)
const onUp = () => (pressed.value = false)
</script>

<template lang="pug">
  header(class="z-header relative w-full px-5 md:px-7 pt-[max(env(safe-area-inset-top),1.25rem)] pb-6 md:pb-7")
    //- decorative crown wordmark on top-left (echoes LambKing logo)
    div(class="relative flex items-center justify-between gap-3")
      div(class="min-w-0 flex-1 flex items-start gap-3")
        //- crown icon
        span(class="z-header-crown shrink-0 inline-flex items-center justify-center w-9 h-9 md:w-11 md:h-11")
          svg(viewBox="0 0 32 32" fill="none" class="w-full h-full")
            defs
              linearGradient(id="zhCrown" x1="0" y1="0" x2="0" y2="1")
                stop(offset="0%" stop-color="#f3d167")
                stop(offset="55%" stop-color="#d4a83e")
                stop(offset="100%" stop-color="#8a5a14")
            path(
              d="M4 22l3-12 6 6 3-10 3 10 6-6 3 12z"
              fill="url(#zhCrown)"
              stroke="#5a3a08"
              stroke-width="1.2"
              stroke-linejoin="round"
            )
            rect(x="4" y="22" width="24" height="4" rx="1" fill="#1a2f4a" stroke="#0a1a30" stroke-width="1")
            circle(cx="16" cy="11" r="1.6" fill="#a93d2e")

        div(class="min-w-0 flex-1")
          p(class="z-header-greeting text-xs md:text-sm font-medium tracking-wide")
            slot(name="greeting") {{ greeting }}
          h1(class="z-header-title mt-1 text-2xl md:text-3xl font-extrabold leading-tight truncate")
            slot(name="title") {{ title }}

      button(
        v-if="showAction"
        type="button"
        :class="{ 'is-pressed': pressed }"
        class="z-header-action shrink-0 inline-flex items-center gap-2 rounded-full px-4 md:px-5 py-2 md:py-2.5 cursor-pointer select-none touch-manipulation transition-[transform,box-shadow,background-color] duration-150 ease-out hover:scale-[104%]"
        @click="$emit('action')"
        @pointerdown="onDown"
        @pointerup="onUp"
        @pointerleave="onUp"
        @pointercancel="onUp"
      )
        svg(
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-4 h-4 md:w-[18px] md:h-[18px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]"
        )
          rect(x="4" y="11" width="16" height="10" rx="2.2")
          path(d="M8 11V8a4 4 0 0 1 8 0")
        span(class="text-xs md:text-sm font-extrabold tracking-wide uppercase")
          slot(name="action") {{ actionLabel }}
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent

.z-header
  background: linear-gradient(180deg, #f5ebd2 0%, #ede0c0 100%)
  box-shadow: 0 6px 18px -10px rgba(58, 42, 18, 0.25), inset 0 -1px 0 rgba(212, 168, 62, 0.35)
  color: #1a2f4a

.z-header-crown
  filter: drop-shadow(0 2px 3px rgba(58, 42, 18, 0.35))

.z-header-greeting
  color: #7a6b55
  letter-spacing: 0.02em

.z-header-title
  color: #1a2f4a
  letter-spacing: -0.01em
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6)

.z-header-action
  color: #ffffff
  background: linear-gradient(180deg, #21406a 0%, #142a47 100%)
  border: 1px solid #0a1a30
  box-shadow: 0 5px 0 -1px #0a1a30, 0 10px 20px -6px rgba(10, 26, 48, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -2px 0 rgba(0, 0, 0, 0.22)

  &:hover
    background: linear-gradient(180deg, #2b4d7a 0%, #1c3559 100%)

  &:active, &.is-pressed
    transform: translateY(4px) scale(0.97)
    box-shadow: 0 1px 0 -1px #0a1a30, 0 3px 8px -4px rgba(10, 26, 48, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.14), inset 0 -1px 0 rgba(0, 0, 0, 0.22)
</style>
