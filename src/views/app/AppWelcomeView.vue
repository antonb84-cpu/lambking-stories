<script setup lang="ts">
/**
 * Welcome / title screen — the app's front door.
 *
 * Everything the user reads (logo, "Willkommen!", the subtitle) is baked
 * into the artwork, so this view is just the picture plus a single CTA that
 * hands over to the home page. Four assets cover the matrix: {de,en} ×
 * {portrait,landscape}. Language comes from the i18n locale; the
 * orientation swap is native `<picture media>` so a rotation re-picks the
 * source without a resize listener.
 *
 * The artwork is `contain`-fitted — never cropped by a screen edge — which
 * means its rendered box rarely matches the viewport. The CTA therefore
 * lives inside `.welcome-stage`, a shrink-to-fit wrapper that ends up
 * exactly the size of the `<img>`, so the button's percentage offsets track
 * the illustration itself instead of the screen. That keeps it planted on
 * the flower meadow (portrait) / below the text block (landscape) at every
 * aspect ratio, letterbox bars included.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { prependBaseUrl } from '@/utils/function'

const { t, locale } = useI18n({ useScope: 'global' })
const router = useRouter()

// Portrait assets are spelled "wilkommen", landscape ones "willkommen" —
// that's how they ship in `public/images/bg/`, so keep both spellings.
const art = computed(() => {
  const lang = locale.value === 'en' ? 'en' : 'de'
  return {
    portrait: prependBaseUrl(`images/bg/wilkommen_portrait_${lang}.webp`),
    landscape: prependBaseUrl(`images/bg/willkommen_landscape_${lang}.webp`)
  }
})

function onStart() {
  router.push({ name: 'app-main' })
}
</script>

<template lang="pug">
  div(class="welcome-page")
    div(class="welcome-stage")
      picture
        source(:srcset="art.landscape" media="(orientation: landscape)")
        img(
          :src="art.portrait"
          :alt="t('app.welcome.artAlt')"
          class="welcome-art"
          fetchpriority="high"
          decoding="async"
        )
      button(
        type="button"
        class="welcome-cta"
        @click="onStart"
      ) {{ t('app.welcome.cta') }}
</template>

<style scoped lang="sass">
$navy: #21406a
$navy-dark: #142a47
$gold: #d4a83e

// Fixed + grid-centred: the screen never scrolls and the artwork sits dead
// centre. The beige matches #app-root so the letterbox strip (whenever the
// screen's ratio differs from the artwork's) blends into the app shell.
.welcome-page
  position: fixed
  inset: 0
  display: grid
  place-items: center
  overflow: hidden
  background-color: var(--color-bg-main)

// No explicit size: the box shrinks to the <img>'s rendered dimensions, so
// the absolutely-positioned CTA inside resolves its percentages against the
// artwork's real box. `line-height: 0` kills the inline descender gap that
// would otherwise offset it by a couple of pixels.
.welcome-stage
  position: relative
  line-height: 0

  picture
    background-size: fill

.welcome-art
//display: block
//width: auto
//height: auto
//background-size: fill
//max-width: 100vw
//max-height: 100vh
//max-height: 100dvh

// Navy plaque with a gold rim, mirroring the app's primary buttons. Sizes
// are percentages of the artwork box so the CTA keeps its proportions on
// every screen; the font falls back to vmin, which tracks whichever axis
// the `contain` fit is bounded by.
.welcome-cta
  position: absolute
  left: 50%
  bottom: 20%
  transform: translateX(-50%)
  width: 78%
  padding: 0.72em 1em
  border: 2px solid rgba(212, 168, 62, 0.85)
  border-radius: 1.2em
  background: linear-gradient(180deg, $navy 0%, $navy-dark 100%)
  color: #ffffff
  font-family: inherit
  font-weight: 800
  font-size: clamp(1rem, 4.4vmin, 1.75rem)
  line-height: 1.2
  letter-spacing: 0.01em
  text-align: center
  cursor: pointer
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent
  box-shadow: 0 10px 24px -10px rgba(10, 26, 48, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.18)
  transition: transform 140ms ease-out, box-shadow 140ms ease-out

  &:hover
    box-shadow: 0 14px 28px -10px rgba(10, 26, 48, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.24)

  &:active
    transform: translateX(-50%) scale(0.96)

  &:focus-visible
    outline: 3px solid rgba(212, 168, 62, 0.9)
    outline-offset: 3px

// Landscape artwork puts the copy in the left third — park the CTA under it
// so it never covers the illustration on the right.
@media (orientation: landscape)
  .welcome-cta
    left: 26%
    bottom: 16%
    width: 30%
</style>
