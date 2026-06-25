<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  label?: string
  variant?: 'default' | 'solid' | 'outline' | 'soft' | 'success' | 'warning' | 'info'
  size?: 'sm' | 'md' | 'lg'
  icon?: boolean
  clickable?: boolean
  selected?: boolean
  isDisabled?: boolean
}

withDefaults(defineProps<Props>(), {
  label: '',
  variant: 'default',
  size: 'md',
  icon: false,
  clickable: false,
  selected: false,
  isDisabled: false
})

defineEmits(['click'])

const pressed = ref(false)
const onDown = () => (pressed.value = true)
const onUp = () => (pressed.value = false)
</script>

<template lang="pug">
  span(
    :class="[\
      'a-chip',\
      `a-chip-${variant}`,\
      `a-chip-${size}`,\
      {\
        'a-chip-clickable': clickable,\
        'is-selected': selected,\
        'is-pressed': pressed,\
        'opacity-50 grayscale pointer-events-none': isDisabled\
      }\
    ]"
    class="inline-flex items-center gap-1.5 font-semibold whitespace-nowrap select-none"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    @click="clickable && $emit('click')"
    @pointerdown="clickable && onDown()"
    @pointerup="onUp"
    @pointerleave="onUp"
    @pointercancel="onUp"
  )
    span(v-if="icon || $slots.icon" class="a-chip-icon inline-flex items-center justify-center shrink-0")
      slot(name="icon")
    slot {{ label }}
</template>

<style scoped lang="sass">
.a-chip
  border-radius: 999px
  font-family: 'Nunito', system-ui, -apple-system, "Segoe UI", Roboto, sans-serif
  letter-spacing: 0.01em
  line-height: 1
  border: 1px solid transparent
  transition: transform 140ms ease-out, background-color 140ms ease-out, box-shadow 140ms ease-out, color 140ms ease-out
  -webkit-tap-highlight-color: transparent

// sizes
.a-chip-sm
  font-size: 10px
  padding: 4px 9px
  gap: 4px

.a-chip-md
  font-size: 12px
  padding: 6px 12px

.a-chip-lg
  font-size: 14px
  padding: 8px 16px

.a-chip-icon
  width: 1em
  height: 1em

// default — very light purple-tinted bg, medium purple text
.a-chip-default
  background-color: #f4ecff
  color: #7b43e6
  border-color: #e6d6ff

// soft — slightly deeper lavender
.a-chip-soft
  background-color: #e9dcff
  color: #6929c4
  border-color: #d7c0ff

// outline — transparent with purple border
.a-chip-outline
  background-color: transparent
  color: #6929c4
  border-color: #b58cff

// solid — grape purple bg, white text
.a-chip-solid
  background: linear-gradient(180deg, #8a3ffc 0%, #6929c4 100%)
  color: #ffffff
  border-color: rgba(61, 22, 118, 0.4)
  box-shadow: 0 3px 8px -2px rgba(61, 22, 118, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.35)

// semantic
.a-chip-success
  background-color: #e4f9ec
  color: #1f7a43
  border-color: #c0ecd0

.a-chip-warning
  background-color: #fff3db
  color: #a15c00
  border-color: #ffd98a

.a-chip-info
  background-color: #e0f0ff
  color: #1f5fa6
  border-color: #bcdcff

// interactive
.a-chip-clickable
  cursor: pointer

  &:hover
    transform: translateY(-1px)
    box-shadow: 0 4px 10px -4px rgba(61, 22, 118, 0.3)

  &:active, &.is-pressed
    transform: translateY(1px) scale(0.96)
    box-shadow: 0 1px 2px rgba(61, 22, 118, 0.2)

  &.is-selected
    background: linear-gradient(180deg, #8a3ffc 0%, #6929c4 100%)
    color: #ffffff
    border-color: rgba(61, 22, 118, 0.5)
    box-shadow: 0 4px 12px -4px rgba(138, 63, 252, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.35)

  &:focus-visible
    outline: 2px solid #8a3ffc
    outline-offset: 2px
</style>
