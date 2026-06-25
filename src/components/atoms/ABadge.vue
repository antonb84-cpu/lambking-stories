<script setup lang="ts">
interface Props {
  label?: string
  variant?: 'new' | 'hot' | 'sale' | 'info'
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'static'
  size?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  label: 'NEU',
  variant: 'new',
  position: 'top-left',
  size: 'md'
})
</script>

<template lang="pug">
  span(
    :class="[\
      'a-badge',\
      `a-badge-${variant}`,\
      `a-badge-${size}`,\
      position !== 'static' ? `a-badge-${position} absolute` : 'inline-block'\
    ]"
    class="a-badge select-none pointer-events-none"
  )
    slot {{ label }}
</template>

<style scoped lang="sass">
.a-badge
  font-family: 'Nunito', "Nunito", "Roboto Condensed", "Helvetica Neue Condensed", system-ui, sans-serif
  font-weight: 700
  font-stretch: condensed
  letter-spacing: 0.08em
  line-height: 1
  color: #0a0a0a
  border-radius: 8px
  text-transform: uppercase
  transform: rotate(-2deg)
  z-index: 5
  white-space: nowrap

// sizes
.a-badge-sm
  font-size: 10px
  padding: 4px 7px
  border-radius: 6px

.a-badge-md
  font-size: 12px
  padding: 5px 9px

.a-badge-lg
  font-size: 14px
  padding: 6px 11px
  border-radius: 10px

// variants
.a-badge-new
  background: linear-gradient(180deg, #ffe14a 0%, #ffcf00 100%)
  box-shadow: 0 3px 0 -1px #b38600, 0 6px 14px -4px rgba(179, 134, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.6)
  border: 1px solid #b38600

.a-badge-hot
  background: linear-gradient(180deg, #ff6a3d 0%, #e83e0c 100%)
  color: #ffffff
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.35)
  box-shadow: 0 3px 0 -1px #8a1f00, 0 6px 14px -4px rgba(138, 31, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.35)
  border: 1px solid #8a1f00

.a-badge-sale
  background: linear-gradient(180deg, #ff4d8b 0%, #d61a5e 100%)
  color: #ffffff
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.3)
  box-shadow: 0 3px 0 -1px #7a0a33, 0 6px 14px -4px rgba(122, 10, 51, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.35)
  border: 1px solid #7a0a33

.a-badge-info
  background: linear-gradient(180deg, #8a3ffc 0%, #6929c4 100%)
  color: #ffffff
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.3)
  box-shadow: 0 3px 0 -1px #3d1676, 0 6px 14px -4px rgba(61, 22, 118, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.35)
  border: 1px solid #3d1676

// positions — overlay on a relatively-positioned parent
.a-badge-top-left
  top: 8px
  left: 8px

.a-badge-top-right
  top: 8px
  right: 8px
  transform: rotate(2deg)

.a-badge-bottom-left
  bottom: 8px
  left: 8px

.a-badge-bottom-right
  bottom: 8px
  right: 8px
  transform: rotate(2deg)
</style>
