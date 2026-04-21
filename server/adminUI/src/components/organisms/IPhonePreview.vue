<template>
  <div
    class="iphone"
    :class="{ 'show-hint': showHint }"
    @mouseenter="onHoverStart"
    @mouseleave="onHoverEnd"
  >
    <div class="notch" />
    <div
      ref="screen"
      class="screen"
      :class="{ swiping: dragStartX !== null }"
      @mousedown="startSwipe"
      @mousemove="duringSwipe"
      @mouseup="endSwipe"
      @mouseleave="endSwipe"
      @touchstart="startSwipe"
      @touchmove="duringSwipe"
      @touchend="endSwipe"
    >
      <div
        v-if="currentDisplay?.kind === 'cover'"
        class="cover-page"
        :class="{ 'swipe-hint': showHint }"
        :style="{ transform: `translateX(${offset}px)` }"
      >
        <img
          :src="currentDisplay.image"
          class="cover-full"
          alt=""
          draggable="false"
          @dragstart.prevent
        />
      </div>
      <div
        v-else
        class="page"
        :class="{ 'swipe-hint': showHint }"
        :style="{ transform: `translateX(${offset}px)` }"
      >
        <h3 class="page-title">{{ currentDisplay?.page.title ?? 'Keine Seiten' }}</h3>
        <div class="page-body" v-html="renderedText" />
      </div>

      <!-- hover hint chevrons -->
      <div v-if="showHint" class="hint-overlay" aria-hidden="true">
        <div class="hint-chevron left">‹</div>
        <div class="hint-chevron right">›</div>
        <div class="hint-caption">wischen</div>
      </div>

      <div class="pager">
        <button
          v-for="(entry, i) in displayPages"
          :key="entry.kind === 'cover' ? 'cover' : `p-${entry.page.page}`"
          :class="{ active: i === currentPageIndex, 'is-cover': entry.kind === 'cover' }"
          @click="currentPageIndex = i"
          aria-label="Seite"
        />
      </div>

      <div v-if="displayPages.length > 0" class="page-counter" aria-live="polite">
        {{ currentPageIndex + 1 }} / {{ displayPages.length }}
      </div>
    </div>
    <div class="home-indicator" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import type { BookPage } from '@/types'

const props = defineProps<{ pages: BookPage[]; coverImage?: string }>()
const currentPageIndex = ref(0)
const offset = ref(0)
const dragStartX = ref<number | null>(null)
const showHint = ref(false)

let hintTimer: ReturnType<typeof setTimeout> | null = null

type DisplayEntry =
  | { kind: 'cover'; image: string }
  | { kind: 'page'; page: BookPage }

const displayPages = computed<DisplayEntry[]>(() => {
  const list: DisplayEntry[] = []
  if (props.coverImage) list.push({ kind: 'cover', image: props.coverImage })
  for (const p of props.pages) list.push({ kind: 'page', page: p })
  return list
})

const currentDisplay = computed(() => displayPages.value[currentPageIndex.value])

/**
 * Turn the page's stored markdown into safe display HTML:
 *   ![alt](url)  → <img class="page-img" src="url" alt="alt"/>
 *   blank line   → paragraph break
 *   \n           → <br/>
 * Only the image and line-break syntaxes are interpreted; anything else is
 * escaped, since the authoring surface is trusted but we don't want stray
 * HTML in stored markdown to break the iPhone preview layout.
 */
const renderedText = computed(() => {
  const current = currentDisplay.value
  if (!current || current.kind !== 'page') return ''
  const raw = current.page.text ?? ''
  const IMG_RE = /!\[([^\]]*)\]\(([^)\s]+)\)/g

  const parts: string[] = []
  let last = 0
  for (const m of raw.matchAll(IMG_RE)) {
    const idx = m.index ?? 0
    if (idx > last) parts.push(escapeText(raw.slice(last, idx)))
    const alt = escapeAttr(m[1] ?? '')
    const src = escapeAttr(m[2] ?? '')
    parts.push(`<img class="page-img" src="${src}" alt="${alt}" />`)
    last = idx + m[0].length
  }
  if (last < raw.length) parts.push(escapeText(raw.slice(last)))
  return parts.join('')
})

function escapeText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br/>')
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

const getX = (e: MouseEvent | TouchEvent): number => {
  if ('touches' in e) return e.touches[0]?.clientX ?? 0
  return (e as MouseEvent).clientX
}

const startSwipe = (e: MouseEvent | TouchEvent) => {
  dragStartX.value = getX(e)
}
const duringSwipe = (e: MouseEvent | TouchEvent) => {
  if (dragStartX.value === null) return
  offset.value = getX(e) - dragStartX.value
}
const endSwipe = () => {
  if (dragStartX.value === null) return
  const delta = offset.value
  const threshold = 60
  if (delta < -threshold && currentPageIndex.value < displayPages.value.length - 1) currentPageIndex.value += 1
  else if (delta > threshold && currentPageIndex.value > 0) currentPageIndex.value -= 1
  offset.value = 0
  dragStartX.value = null
}

function onHoverStart() {
  if (hintTimer) clearTimeout(hintTimer)
  hintTimer = setTimeout(() => {
    showHint.value = true
  }, 2000)
}

function onHoverEnd() {
  if (hintTimer) {
    clearTimeout(hintTimer)
    hintTimer = null
  }
  showHint.value = false
}

onBeforeUnmount(() => {
  if (hintTimer) clearTimeout(hintTimer)
})
</script>

<style scoped>
.iphone {
  width: 320px;
  height: 680px;
  border-radius: 44px;
  padding: 10px;
  background: linear-gradient(160deg, #1f2933 0%, #3b4a5a 100%);
  box-shadow: 0 40px 80px -28px rgba(30, 60, 100, 0.55),
  0 16px 40px -20px rgba(30, 60, 100, 0.35),
  inset 0 0 0 2px rgba(255, 255, 255, 0.12);
  position: relative;
  transition: transform 220ms ease, box-shadow 220ms ease;
}

.iphone.show-hint {
  transform: translateY(-2px);
  box-shadow: 0 46px 90px -26px rgba(30, 60, 100, 0.65),
  0 20px 46px -18px rgba(30, 60, 100, 0.4),
  inset 0 0 0 2px rgba(255, 255, 255, 0.15);
}

.notch {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 110px;
  height: 26px;
  background: #0f1419;
  border-radius: 14px;
  z-index: 5;
}

.screen {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 34px;
  background: linear-gradient(180deg, #fffaf3 0%, #fce8c8 100%);
  overflow: hidden;
  user-select: none;
  padding: 56px 20px 36px;
  cursor: grab;
}

.screen.swiping {
  cursor: grabbing;
}

.cover-page {
  position: absolute;
  inset: 0;
  transition: transform 120ms ease-out;
  background: #000;
}

.cover-page.swipe-hint {
  animation: swipe-hint 1.6s ease-in-out infinite;
}

.cover-full {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

.page {
  position: relative;
  height: calc(100% - 40px);
  transition: transform 120ms ease-out;
  overflow-y: auto;
}

.page.swipe-hint {
  animation: swipe-hint 1.6s ease-in-out infinite;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #2a2a2a;
}

.page-body {
  font-size: 13px;
  line-height: 1.05;
  color: #333;
}

.page-body :deep(img),
.page-body :deep(.page-img) {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 14px;
  margin: 10px 0;
  background: #f1f1f1;
}

.pager {
  position: absolute;
  bottom: 14px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 6px;
  z-index: 4;
}

.pager button {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.2);
  border: none;
  cursor: pointer;
  padding: 0;
}

.pager button.active {
  background: #2980b9;
  width: 14px;
}

.page-counter {
  position: absolute;
  bottom: 12px;
  right: 16px;
  z-index: 4;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #fff;
  background: rgba(30, 50, 70, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: 0 4px 10px -4px rgba(20, 40, 60, 0.35);
  pointer-events: none;
  font-variant-numeric: tabular-nums;
}

.home-indicator {
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 90px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.3);
}

.hint-overlay {
  position: absolute;
  inset: 56px 0 36px;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
  z-index: 3;
}

.hint-chevron {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: #fff;
  background: rgba(52, 152, 219, 0.75);
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 6px 16px -6px rgba(52, 152, 219, 0.6);
  animation: chevron-pulse 1.2s ease-in-out infinite;
}

.hint-chevron.right {
  animation-delay: 0.6s;
}

.hint-caption {
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #fff;
  background: rgba(52, 152, 219, 0.85);
  padding: 4px 10px;
  border-radius: 999px;
}

@keyframes swipe-hint {
  0% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-22px);
  }
  45% {
    transform: translateX(14px);
  }
  70% {
    transform: translateX(-8px);
  }
  100% {
    transform: translateX(0);
  }
}

@keyframes chevron-pulse {
  0%, 100% {
    opacity: 0.5;
    transform: translateX(0) scale(0.96);
  }
  50% {
    opacity: 1;
    transform: translateX(4px) scale(1.04);
  }
}

.hint-chevron.left {
  animation-name: chevron-pulse-left;
}

@keyframes chevron-pulse-left {
  0%, 100% {
    opacity: 0.5;
    transform: translateX(0) scale(0.96);
  }
  50% {
    opacity: 1;
    transform: translateX(-4px) scale(1.04);
  }
}
</style>
