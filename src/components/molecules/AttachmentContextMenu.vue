<script setup lang="ts">
/**
 * Floating context menu that pops up next to an attachment tile. The
 * positioning logic clamps the menu inside the viewport — a pure CSS
 * `position: fixed; top/left` would happily render off-screen on tiles
 * pinned to the right edge or near the bottom of the page.
 *
 * Renders nothing when `anchor` is null, so the parent can simply toggle
 * a single ref to show/hide.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface Anchor {
  // Bounding rect of the trigger element in viewport coords.
  rect: DOMRect
}

const props = defineProps<{
  anchor: Anchor | null
  showColoringOption: boolean
}>()

const emit = defineEmits<{
  close: []
  saveToPhone: []
  useInColoring: []
}>()

const menuRef = ref<HTMLElement | null>(null)
const pos = ref<{ top: number; left: number }>({ top: 0, left: 0 })
const MENU_MARGIN = 8

function reposition() {
  const anchor = props.anchor
  const el = menuRef.value
  if (!anchor || !el) return
  // Measure once per open — the menu's width is content-driven so we wait a
  // microtask to let it lay out before clamping.
  const menuRect = el.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  // Prefer below the trigger; fall back to above when it would overflow.
  let top = anchor.rect.bottom + MENU_MARGIN
  if (top + menuRect.height > vh - MENU_MARGIN) {
    top = anchor.rect.top - menuRect.height - MENU_MARGIN
  }
  top = Math.max(MENU_MARGIN, Math.min(vh - menuRect.height - MENU_MARGIN, top))

  // Centred on the trigger horizontally, then clamped inside the viewport
  // so a tile near the right edge doesn't push the menu out of view.
  let left = anchor.rect.left + anchor.rect.width / 2 - menuRect.width / 2
  left = Math.max(MENU_MARGIN, Math.min(vw - menuRect.width - MENU_MARGIN, left))

  pos.value = { top, left }
}

watch(
  () => props.anchor,
  async (a) => {
    if (!a) return
    // Wait for the next paint so menuRef has a rendered size before we
    // attempt to clamp it. requestAnimationFrame is cheaper than nextTick
    // here because we only need post-layout, not post-render.
    requestAnimationFrame(reposition)
  }
)

function onWindowEvent() {
  if (props.anchor) reposition()
}

function onDocumentClick(e: Event) {
  if (!props.anchor) return
  const el = menuRef.value
  if (!el) return
  if (el.contains(e.target as Node)) return
  emit('close')
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.anchor) emit('close')
}

onMounted(() => {
  window.addEventListener('resize', onWindowEvent)
  window.addEventListener('scroll', onWindowEvent, true)
  document.addEventListener('mousedown', onDocumentClick)
  document.addEventListener('touchstart', onDocumentClick, { passive: true })
  document.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowEvent)
  window.removeEventListener('scroll', onWindowEvent, true)
  document.removeEventListener('mousedown', onDocumentClick)
  document.removeEventListener('touchstart', onDocumentClick)
  document.removeEventListener('keydown', onKeyDown)
})

const styleObj = computed(() => ({
  top: `${pos.value.top}px`,
  left: `${pos.value.left}px`
}))
</script>

<template lang="pug">
  Teleport(to="body")
    div(
      v-if="anchor"
      ref="menuRef"
      class="att-menu"
      role="menu"
      :style="styleObj"
    )
      button(
        type="button"
        role="menuitem"
        class="att-menu-item"
        @click="$emit('saveToPhone')"
      )
        span(class="att-menu-icon" aria-hidden="true") ⬇
        span {{ $t('app.bookDetail.attachmentSaveToPhone') }}

      button(
        v-if="showColoringOption"
        type="button"
        role="menuitem"
        class="att-menu-item"
        @click="$emit('useInColoring')"
      )
        span(class="att-menu-icon" aria-hidden="true") 🖌
        span {{ $t('app.bookDetail.attachmentUseInColoring') }}

      button(
        type="button"
        role="menuitem"
        class="att-menu-item is-close"
        @click="$emit('close')"
      )
        span(class="att-menu-icon" aria-hidden="true") ✕
        span {{ $t('app.bookDetail.attachmentClose') }}
</template>

<style scoped lang="sass">
.att-menu
  position: fixed
  z-index: 100
  min-width: 220px
  max-width: calc(100vw - 16px)
  padding: 6px
  border-radius: 14px
  background: rgba(255, 255, 255, 0.98)
  border: 1px solid rgba(126, 58, 242, 0.18)
  box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.16), 0 24px 56px -22px rgba(30, 30, 60, 0.45)
  display: flex
  flex-direction: column
  gap: 2px
  animation: att-menu-in 140ms ease-out

.att-menu-item
  display: flex
  align-items: center
  gap: 10px
  padding: 10px 12px
  border-radius: 10px
  border: none
  background: transparent
  cursor: pointer
  text-align: left
  font-size: 14px
  font-weight: 600
  color: #1a1a1a
  -webkit-tap-highlight-color: transparent
  transition: background 120ms ease, color 120ms ease

  &:hover
    background: rgba(126, 58, 242, 0.08)

  &:active
    background: rgba(126, 58, 242, 0.16)

  &.is-close
    color: #6b5a3e

.att-menu-icon
  width: 22px
  height: 22px
  display: inline-flex
  align-items: center
  justify-content: center
  font-size: 14px
  line-height: 1
  flex-shrink: 0

@keyframes att-menu-in
  0%
    opacity: 0
    transform: translateY(-4px) scale(0.97)
  100%
    opacity: 1
    transform: translateY(0) scale(1)
</style>
