<script setup lang="ts">
import { ref } from 'vue'
import { onImgFallback, PLACEHOLDER_IMAGE } from '@/utils/placeholder'

interface Props {
  title?: string
  category?: string
  image?: string
  imageAlt?: string
  tags?: string[]
  isDisabled?: boolean
  layout?: 'horizontal' | 'vertical'
}

withDefaults(defineProps<Props>(), {
  title: '',
  category: '',
  image: '',
  imageAlt: '',
  tags: () => [],
  isDisabled: false,
  layout: 'horizontal'
})

defineEmits(['click'])

const ripples = ref<{ id: number; x: number; y: number; size: number }[]>([])
let rid = 0

const onPointerDown = (e: PointerEvent) => {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height) * 1.2
  const x = e.clientX - rect.left - size / 2
  const y = e.clientY - rect.top - size / 2
  const id = ++rid
  ripples.value.push({ id, x, y, size })
  setTimeout(() => {
    ripples.value = ripples.value.filter((r) => r.id !== id)
  }, 650)
}
</script>

<template lang="pug">
  div(
    @click="$emit('click')"
    @pointerdown="onPointerDown"
    :class="[{ 'opacity-50 grayscale pointer-events-none': isDisabled }, layout === 'vertical' ? 'a-card--vertical flex-col items-stretch' : 'items-stretch']"
    class="a-card group relative flex w-full overflow-hidden cursor-pointer select-none p-0"
  )
    //- Illustration — embedded on the left (horizontal) or on top (vertical)
    div(
      :class="layout === 'vertical' ? 'w-full aspect-[4/3]' : 'self-stretch shrink-0 w-20 sm:w-28 md:w-32'"
      class="a-card-image relative overflow-hidden"
    )
      slot(name="image")
        img(
          :src="image || PLACEHOLDER_IMAGE"
          :alt="imageAlt || title"
          class="absolute inset-0 w-full h-full object-cover"
          @error="onImgFallback"
        )
      span(class="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10")
      slot(name="badge")

    //- RIGHT: text content
    div(class="a-card-content relative flex-1 min-w-0 flex flex-col gap-0.5 sm:gap-1.5 p-2.5 sm:p-4")
      span(
        v-if="category"
        class="a-card-category inline-block self-start max-w-full truncate text-[8px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-[0.08em] sm:tracking-[0.12em] px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full"
      )
        | {{ category }}
      h3(class="a-card-title font-extrabold text-[13px] sm:text-base md:text-lg leading-tight")
        slot(name="title") {{ title }}
      div(
        v-if="tags && tags.length"
        class="flex flex-wrap gap-1 sm:gap-1.5 mt-0.5"
      )
        span(
          v-for="tag in tags"
          :key="tag"
          class="a-card-tag text-[8px] sm:text-[10px] md:text-[11px] font-semibold px-1.5 sm:px-2.5 py-0.5 rounded-full whitespace-nowrap"
        )
          | {{ tag }}
      slot

    //- Hover glow overlay
    span(class="a-card-glow pointer-events-none absolute inset-0")

    //- Ripples
    span(
      v-for="r in ripples"
      :key="r.id"
      class="a-card-ripple pointer-events-none absolute rounded-full"
      :style="{ left: r.x + 'px', top: r.y + 'px', width: r.size + 'px', height: r.size + 'px' }"
    )
</template>

<style scoped lang="sass">
.a-card
  border-radius: 24px
  background-color: #ffffff
  border: 1px solid #f1ecfb
  box-shadow: 0 1px 2px rgba(61, 22, 118, 0.04), 0 8px 24px -10px rgba(61, 22, 118, 0.18)
  transition: transform 220ms ease-out, box-shadow 220ms ease-out
  -webkit-tap-highlight-color: transparent

  &:hover
    transform: translateY(-3px)
    box-shadow: 0 2px 4px rgba(61, 22, 118, 0.06), 0 20px 40px -12px rgba(138, 63, 252, 0.35)

  &:active
    transform: translateY(-1px) scale(0.995)
    box-shadow: 0 1px 3px rgba(61, 22, 118, 0.08), 0 10px 22px -10px rgba(138, 63, 252, 0.3)

.a-card-image
  background: linear-gradient(160deg, #e9dcff 0%, #cdb2ff 60%, #a57cff 100%)
  box-shadow: inset -4px 0 10px rgba(61, 22, 118, 0.15)


.a-card--vertical .a-card-image
  box-shadow: inset 0 -4px 10px rgba(61, 22, 118, 0.15)

.a-card--vertical .a-card-title
  -webkit-line-clamp: 1
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis
  display: block

.a-card-category
  color: #6929c4
  background-color: #efe6ff
  border: 1px solid #dcc9ff

.a-card-title
  color: #2a0f55
  letter-spacing: 0.01em
  display: -webkit-box
  -webkit-line-clamp: 2
  -webkit-box-orient: vertical
  overflow: hidden
  word-break: break-word
  overflow-wrap: anywhere

.a-card-tag
  color: #5b21b6
  background-color: #f6f0ff
  border: 1px solid #e3d4ff

.a-card-glow
  border-radius: 24px
  opacity: 0
  background: radial-gradient(120% 80% at 50% 0%, rgba(138, 63, 252, 0.18) 0%, rgba(138, 63, 252, 0) 60%)
  transition: opacity 220ms ease-out

.a-card:hover .a-card-glow
  opacity: 1

.a-card-ripple
  background: radial-gradient(circle, rgba(138, 63, 252, 0.35) 0%, rgba(138, 63, 252, 0.15) 40%, rgba(138, 63, 252, 0) 70%)
  transform: scale(0)
  animation: a-card-ripple 620ms ease-out forwards

@keyframes a-card-ripple
  0%
    transform: scale(0)
    opacity: 0.8
  100%
    transform: scale(1)
    opacity: 0
</style>
