<script setup lang="ts">
/**
 * Ko-fi donate button. Default styling matches Ko-fi's brand red so it
 * reads as a donate CTA at a glance even when dropped on busy imagery;
 * a `tone="paypal"` variant ships PayPal blue for the placeholder slot
 * we'll keep using Ko-fi for until the PayPal SDK integration lands.
 *
 * Usage:
 *   <KoFiButton href="https://ko-fi.com/lambking" label="Ko-fi" />
 *   <KoFiButton href="https://ko-fi.com/lambking" tone="paypal" label="PayPal" />
 */
interface Props {
  href: string
  label?: string
  tone?: 'kofi' | 'paypal'
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  label: 'Ko-fi',
  tone: 'kofi',
  compact: false
})
</script>

<template lang="pug">
  a(
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    :class="['kofi-btn', `is-${tone}`, { 'is-compact': compact }]"
    :aria-label="`Donate via ${label}`"
  )
    span(class="kofi-btn-icon" aria-hidden="true")
      //- Mug + steam — recognisable as a coffee-tip icon at 18-20px sizes.
      span(v-if="tone === 'kofi'")
        img.kofi-img(class="mt-[2px]" src="https://storage.ko-fi.com/cdn/cup-border.png", alt="Ko-fi")
      svg(v-else viewBox="0 0 24 24" class="w-full h-full")
        path(
          d="M5 10h11a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3h-1.2"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        )
        path(
          d="M5 10v6a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-6z"
          fill="currentColor"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linejoin="round"
        )
        path(
          d="M8 3c-.6 1-.6 2 0 3M11 3c-.6 1-.6 2 0 3M14 3c-.6 1-.6 2 0 3"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          opacity="0.75"
        )
    span(class="kofi-btn-label") {{ label }}
</template>

<style scoped lang="sass">
.kofi-btn
  display: inline-flex
  align-items: center
  gap: 8px
  padding: 9px 16px
  border-radius: 999px
  font-size: 13px
  font-weight: 800
  letter-spacing: 0.02em
  text-decoration: none
  color: #ffffff
  cursor: pointer
  user-select: none
  -webkit-tap-highlight-color: transparent
  transition: transform 180ms ease-out, box-shadow 180ms ease-out, filter 180ms ease-out
  white-space: nowrap

  &:hover
    transform: translateY(-1px)
    filter: brightness(1.06)

  &:active
    transform: scale(0.96)

// Ko-fi brand red with a subtle highlight + darker rim for depth.
.kofi-btn.is-kofi
  background: linear-gradient(180deg, #ff726f 0%, #e2473f 100%)
  border: 1px solid #b53a32
  box-shadow: 0 6px 14px -6px rgba(178, 58, 50, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.3)

// PayPal placeholder skin — same shape, PayPal navy/blue gradient.
.kofi-btn.is-paypal
  background: linear-gradient(180deg, #2c8bd9 0%, #1a4d8f 100%)
  border: 1px solid #0e3669
  box-shadow: 0 6px 14px -6px rgba(14, 54, 105, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.3)

// Compact variant — shrinks to fit the welcome-slide overlay without
// crowding the dots row beneath it.
.kofi-btn.is-compact
  padding: 7px 12px
  font-size: 12px
  gap: 6px

.kofi-btn-icon
  display: inline-flex
  width: 18px
  height: 18px
  color: #ffffff

.kofi-btn.is-compact .kofi-btn-icon
  width: 16px
  height: 16px

.kofi-btn-label
  line-height: 1
</style>
