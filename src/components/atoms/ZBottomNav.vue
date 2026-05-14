<script setup lang="ts">
import { ref } from 'vue'
import ZIconography from '@/components/atoms/ZIconography.vue'

type IconName = 'home' | 'series' | 'headphones' | 'brush' | 'profile' | 'grid' | 'pencil' | 'library'

interface NavItem {
  id: string | number
  label: string
  icon: IconName
}

interface Props {
  items: NavItem[]
  modelValue: string | number
}

defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'select'])

const pressedId = ref<string | number | null>(null)

function onDown(item: NavItem) {
  pressedId.value = item.id
}

function onUp() {
  pressedId.value = null
}

function selectItem(item: NavItem) {
  emit('update:modelValue', item.id)
  emit('select', item)
}
</script>

<template lang="pug">
  nav(class="z-bottom-nav fixed bottom-0 left-0 right-0 z-50 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] px-2")
    div(class="mx-auto max-w-2xl flex items-stretch justify-around gap-0")
      button(
        v-for="item in items"
        :key="item.id"
        type="button"
        :aria-label="item.label"
        :aria-current="modelValue === item.id ? 'page' : undefined"
        :class="[\
          'z-nav-btn group relative flex flex-1 flex-col items-center justify-center gap-1 cursor-pointer select-none touch-manipulation py-1.5 px-1',\
          modelValue === item.id ? 'is-active' : 'is-inactive',\
          pressedId === item.id ? 'is-pressed' : ''\
        ]"
        @click="selectItem(item)"
        @pointerdown="onDown(item)"
        @pointerup="onUp"
        @pointerleave="onUp"
        @pointercancel="onUp"
      )
        //- active dot indicator above the icon
        span(
          v-if="modelValue === item.id"
          class="z-nav-dot pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full"
        )

        //- icon wrapper
        span(class="z-nav-icon relative inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7")
          ZIconography(:name="item.icon" :size="'100%'")

        //- label
        span(
          :class="[\
            'z-nav-label text-[10px] md:text-[11px] font-semibold tracking-wide transition-colors duration-200',\
            modelValue === item.id ? 'is-active-label' : ''\
          ]"
        ) {{ item.label }}
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent
  background: transparent
  border: none

// Dark navy bar like the LambKing bottom nav
.z-bottom-nav
  background: linear-gradient(180deg, #21406a 0%, #142a47 100%)
  border-top: 1px solid #0a1a30
  box-shadow: 0 -4px 20px -8px rgba(10, 26, 48, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)

.z-nav-btn
  color: rgba(255, 255, 255, 0.55)
  transition: color 220ms ease-out, transform 180ms ease-out

  &.is-inactive:hover
    color: rgba(255, 255, 255, 0.85)

  &.is-inactive:hover .z-nav-icon
    transform: translateY(-2px)

  &.is-active
    color: #d4a83e

  &.is-active .z-nav-icon
    animation: z-nav-pop 380ms cubic-bezier(0.34, 1.56, 0.64, 1)

  &.is-pressed .z-nav-icon
    transform: scale(0.88)

.z-nav-icon
  transition: transform 200ms ease-out, color 200ms ease-out
  will-change: transform
  filter: drop-shadow(0 0 0 rgba(212, 168, 62, 0))
  color: inherit

.z-nav-icon :deep(.z-icon-outline)
  color: currentColor

.is-active .z-nav-icon
  filter: drop-shadow(0 2px 6px rgba(212, 168, 62, 0.55))

.z-nav-label
  color: rgba(255, 255, 255, 0.55)

.is-active-label
  color: #d4a83e

.z-nav-dot
  background: linear-gradient(90deg, #f3d167 0%, #d4a83e 100%)
  box-shadow: 0 0 10px rgba(212, 168, 62, 0.7)
  animation: z-nav-dot-in 300ms ease-out

@keyframes z-nav-pop
  0%
    transform: scale(0.85) translateY(2px)
  55%
    transform: scale(1.18) translateY(-3px)
  100%
    transform: scale(1) translateY(0)

@keyframes z-nav-dot-in
  0%
    transform: translate(-50%, -6px) scaleX(0.2)
    opacity: 0
  100%
    transform: translate(-50%, 0) scaleX(1)
    opacity: 1
</style>
