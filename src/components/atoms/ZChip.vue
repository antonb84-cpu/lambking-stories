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
      'z-chip',\
      `z-chip-${variant}`,\
      `z-chip-${size}`,\
      {\
        'z-chip-clickable': clickable,\
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
    span(v-if="icon || $slots.icon" class="z-chip-icon inline-flex items-center justify-center shrink-0")
      slot(name="icon")
    slot {{ label }}
</template>

<style scoped lang="sass">
.z-chip
  border-radius: 999px
  font-family: 'Nunito', system-ui, -apple-system, "Segoe UI", Roboto, sans-serif
  letter-spacing: 0.01em
  line-height: 1
  border: 1px solid transparent
  transition: transform 140ms ease-out, background-color 140ms ease-out, box-shadow 140ms ease-out, color 140ms ease-out
  -webkit-tap-highlight-color: transparent

// sizes
.z-chip-sm
  font-size: 10px
  padding: 4px 9px
  gap: 4px

.z-chip-md
  font-size: 12px
  padding: 6px 12px

.z-chip-lg
  font-size: 14px
  padding: 8px 16px

.z-chip-icon
  width: 1em
  height: 1em

// default — warm cream tint, navy text
.z-chip-default
  background-color: #fbf1d6
  color: #1a2f4a
  border-color: #e6d09a

// soft — slightly deeper sand
.z-chip-soft
  background-color: #f0e0b5
  color: #5a3f12
  border-color: #d9bf80

// outline — transparent with navy border
.z-chip-outline
  background-color: transparent
  color: #1a2f4a
  border-color: #1a2f4a

// solid — deep navy bg, white text (matches "Alle" active tab)
.z-chip-solid
  background: linear-gradient(180deg, #21406a 0%, #142a47 100%)
  color: #ffffff
  border-color: #0e2440
  box-shadow: 0 3px 8px -2px rgba(10, 26, 48, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.22)

// semantic
.z-chip-success
  background-color: #e3efd5
  color: #4a6325
  border-color: #c5d8a3

.z-chip-warning
  background-color: #fae6c4
  color: #8e5a18
  border-color: #ecc97f

.z-chip-info
  background-color: #d8e1ec
  color: #1a2f4a
  border-color: #adbcd0

// interactive
.z-chip-clickable
  cursor: pointer

  &:hover
    transform: translateY(-1px)
    box-shadow: 0 4px 10px -4px rgba(58, 42, 18, 0.3)

  &:active, &.is-pressed
    transform: translateY(1px) scale(0.96)
    box-shadow: 0 1px 2px rgba(58, 42, 18, 0.18)

  &.is-selected
    background: linear-gradient(180deg, #21406a 0%, #142a47 100%)
    color: #ffffff
    border-color: #0e2440
    box-shadow: 0 4px 12px -4px rgba(10, 26, 48, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.22)

  &:focus-visible
    outline: 2px solid #d4a83e
    outline-offset: 2px
</style>
