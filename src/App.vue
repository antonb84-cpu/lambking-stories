<script setup lang="ts">
import { RouterView } from 'vue-router'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { orientation } from '@/use/useUser'
import { mobileCheck } from '@/utils/function'
import { useMusic } from '@/use/useSound'
import { useExtensionGuard } from '@/use/useExtensionGuard'
import { windowWidth, windowHeight } from '@/use/useUser'
import useUser from '@/use/useUser'
import useCheats from '@/use/useCheats'
import useAssets from '@/use/useAssets'
import { GAME_USER_LANGUAGE } from '@/utils/constants.ts'

const { initMusic, pauseMusic, continueMusic } = useMusic()
const { userLanguage } = useUser()
const { locale } = useI18n({ useScope: 'global' })

// Keep i18n locale + localStorage in sync with the user's stored language.
// IDB seeds `userLanguage` after boot, so `immediate: true` updates the
// already-mounted i18n to whatever was last persisted.
watch(userLanguage, (v) => {
  if (!v) return
  if (locale.value !== v) locale.value = v as any
  try {
    localStorage.setItem(GAME_USER_LANGUAGE, v)
  } catch { /* quota / disabled */
  }
}, { immediate: true })
useExtensionGuard()
useCheats()
const { resourceCache } = useAssets()


initMusic('adventure_main-menu.mp3')

const portraitQuery = window.matchMedia('(orientation: portrait)')
const onTouchStart = (event: any) => {
  if (event.touches.length > 1) {
    event.preventDefault() // Block multitouch (pinch)
  }
}

const onGestureStart = (event: any) => {
  event.preventDefault() // Block specific Safari zoom gestures
}
const onOrientationChange = (event: any) => {
  if (event.matches) {
    orientation.value = 'portrait'
  } else {
    orientation.value = 'landscape'
  }
}

const onContextMenu = (event: any) => {
  event.preventDefault() // Block right-click context menu
}

const handleVisibilityChange = async () => {
  try {
    if (document.hidden) {
      pauseMusic()
      // console.log('App moved to background - Pausing Music')
    } else {
      continueMusic()
      // console.log('App back in focus - Resuming Music')
    }
  } catch (error) {
    // console.log('error: ', error)
  }
}

const updateGlobalDimensions = () => {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
  orientation.value = mobileCheck() && windowWidth.value > windowHeight.value ? 'landscape' : 'portrait'
}

const dimensionsInterval = ref<any | null>(null)
// Ensure listeners are active
const delayedUpdateGlobalDimensions = () => setTimeout(updateGlobalDimensions, 300)
onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateGlobalDimensions)

    dimensionsInterval.value = setInterval(() => {
      windowWidth.value = window.innerWidth
      windowHeight.value = window.innerHeight
    }, 400)
    window.addEventListener('orientationchange', delayedUpdateGlobalDimensions)
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }
})
onUnmounted(() => {
  window.removeEventListener('resize', updateGlobalDimensions)
  window.removeEventListener('orientationchange', delayedUpdateGlobalDimensions)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  clearInterval(dimensionsInterval.value)
})

onMounted(() => {
  document.addEventListener('contextmenu', onContextMenu)
  document.addEventListener('touchstart', onTouchStart, { passive: false })
  document.addEventListener('gesturestart', onGestureStart)
  portraitQuery.addEventListener('change', onOrientationChange)
})
onUnmounted(() => {
  document.removeEventListener('contextmenu', onContextMenu)
  document.removeEventListener('touchstart', onTouchStart, { passive: false })
  document.removeEventListener('gesturestart', onGestureStart)
  portraitQuery.removeEventListener('change', onOrientationChange)
})

function isCrazyGamesUrl() {
  const hostname = window.location.hostname
  const parts = hostname.split('.')
  const idx = parts.indexOf('crazygames')
  return idx !== -1 && idx >= parts.length - 3
}

</script>

<template lang="pug">
  div(id="app-root").min-h-screen.w-screen.app-container.root-protection.game-ui-immune
    RouterView(v-slot="{ Component, route }")
      transition(name="page-playful" mode="out-in" appear)
        component(:is="Component" :key="route.fullPath")
</template>

<style lang="sass">
*
  font-family: 'Nunito', sans-serif
  user-select: none
  // Standard
  -webkit-user-select: none
  // Safari
  -moz-user-select: none
  // Firefox
  -ms-user-select: none
  // IE10+

  // Optional: prevent the "tap highlight" color on mobile
  -webkit-tap-highlight-color: transparent

img
  pointer-events: none

// ----- Playful page transitions for a children's audiobook app -----
.page-playful-enter-active
  animation: page-playful-in 720ms cubic-bezier(0.34, 1.56, 0.64, 1) both

.page-playful-leave-active
  animation: page-playful-out 420ms ease-in both

@keyframes page-playful-in
  0%
    opacity: 0
    transform: translateY(36px) scale(0.94) rotate(-1.2deg)
    filter: blur(4px)
  45%
    opacity: 1
    transform: translateY(-10px) scale(1.015) rotate(0.6deg)
    filter: blur(0)
  70%
    transform: translateY(3px) scale(0.998) rotate(-0.3deg)
  100%
    opacity: 1
    transform: translateY(0) scale(1) rotate(0)
    filter: blur(0)

@keyframes page-playful-out
  0%
    opacity: 1
    transform: translateY(0) scale(1)
  100%
    opacity: 0
    transform: translateY(-16px) scale(0.97)
    filter: blur(3px)

// ----- Extra playful transitions (showcased on /design-system-a) -----
// 1. Balloon bounce — drops in from above with a squash-and-stretch bounce
.page-balloon-enter-active
  animation: page-balloon-in 820ms cubic-bezier(0.34, 1.56, 0.64, 1) both
  transform-origin: top center

.page-balloon-leave-active
  animation: page-balloon-out 380ms ease-in both
  transform-origin: top center

@keyframes page-balloon-in
  0%
    opacity: 0
    transform: translateY(-120%) scaleY(1.25) scaleX(0.78)
  50%
    opacity: 1
    transform: translateY(6%) scaleY(0.82) scaleX(1.18)
  70%
    transform: translateY(-3%) scaleY(1.08) scaleX(0.95)
  85%
    transform: translateY(1%) scaleY(0.96) scaleX(1.03)
  100%
    opacity: 1
    transform: translateY(0) scaleY(1) scaleX(1)

@keyframes page-balloon-out
  0%
    opacity: 1
    transform: translateY(0) scale(1)
  100%
    opacity: 0
    transform: translateY(120%) scale(0.85)

// 2. Swoosh slide — whooshes in from the right with a slight tilt
.page-swoosh-enter-active
  animation: page-swoosh-in 620ms cubic-bezier(0.22, 1.2, 0.36, 1) both

.page-swoosh-leave-active
  animation: page-swoosh-out 380ms cubic-bezier(0.5, 0, 0.75, 0) both

@keyframes page-swoosh-in
  0%
    opacity: 0
    transform: translateX(110%) rotate(6deg) skewX(-6deg)
  60%
    opacity: 1
    transform: translateX(-3%) rotate(-1deg) skewX(1deg)
  100%
    opacity: 1
    transform: translateX(0) rotate(0) skewX(0)

@keyframes page-swoosh-out
  0%
    opacity: 1
    transform: translateX(0) rotate(0)
  100%
    opacity: 0
    transform: translateX(-50%) rotate(-4deg) skewX(4deg)

// 3. Spin pop — rotates in like a coin flip with a pop
.page-spin-enter-active
  animation: page-spin-in 760ms cubic-bezier(0.34, 1.56, 0.64, 1) both

.page-spin-leave-active
  animation: page-spin-out 360ms ease-in both

@keyframes page-spin-in
  0%
    opacity: 0
    transform: scale(0.2) rotate(-220deg)
    filter: blur(6px)
  60%
    opacity: 1
    transform: scale(1.08) rotate(8deg)
    filter: blur(0)
  80%
    transform: scale(0.98) rotate(-3deg)
  100%
    opacity: 1
    transform: scale(1) rotate(0)

@keyframes page-spin-out
  0%
    opacity: 1
    transform: scale(1) rotate(0)
  100%
    opacity: 0
    transform: scale(0.3) rotate(180deg)

// 4. Jelly wobble — lands and wiggles like jelly
.page-jelly-enter-active
  animation: page-jelly-in 900ms cubic-bezier(0.34, 1.56, 0.64, 1) both
  transform-origin: center bottom

.page-jelly-leave-active
  animation: page-jelly-out 360ms ease-in both

@keyframes page-jelly-in
  0%
    opacity: 0
    transform: translateY(40%) scaleY(0.55) scaleX(1.4)
  40%
    opacity: 1
    transform: translateY(-4%) scaleY(1.15) scaleX(0.9)
  60%
    transform: translateY(0) scaleY(0.92) scaleX(1.06)
  75%
    transform: scaleY(1.04) scaleX(0.97)
  90%
    transform: scaleY(0.98) scaleX(1.02)
  100%
    opacity: 1
    transform: translateY(0) scaleY(1) scaleX(1)

@keyframes page-jelly-out
  0%
    opacity: 1
    transform: scale(1)
  100%
    opacity: 0
    transform: scale(0.88) translateY(10%)

// 5. Page flip — storybook 3D flip from the left edge
.page-flip-enter-active
  animation: page-flip-in 820ms cubic-bezier(0.22, 1.2, 0.36, 1) both
  transform-origin: left center
  backface-visibility: hidden

.page-flip-leave-active
  animation: page-flip-out 380ms ease-in both
  transform-origin: right center
  backface-visibility: hidden

@keyframes page-flip-in
  0%
    opacity: 0
    transform: perspective(1200px) rotateY(-95deg) translateX(-10%)
  60%
    opacity: 1
    transform: perspective(1200px) rotateY(10deg) translateX(0)
  80%
    transform: perspective(1200px) rotateY(-4deg)
  100%
    opacity: 1
    transform: perspective(1200px) rotateY(0) translateX(0)

@keyframes page-flip-out
  0%
    opacity: 1
    transform: perspective(1200px) rotateY(0)
  100%
    opacity: 0
    transform: perspective(1200px) rotateY(90deg)

// 6. Confetti pop — zoom in fast with a cheerful overshoot
.page-pop-enter-active
  animation: page-pop-in 680ms cubic-bezier(0.34, 1.8, 0.64, 1) both

.page-pop-leave-active
  animation: page-pop-out 300ms ease-in both

@keyframes page-pop-in
  0%
    opacity: 0
    transform: scale(0.3) rotate(-8deg)
  55%
    opacity: 1
    transform: scale(1.12) rotate(3deg)
  75%
    transform: scale(0.96) rotate(-1deg)
  100%
    opacity: 1
    transform: scale(1) rotate(0)

@keyframes page-pop-out
  0%
    opacity: 1
    transform: scale(1)
  100%
    opacity: 0
    transform: scale(1.3)
    filter: blur(4px)
</style>