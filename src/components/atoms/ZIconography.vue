<script setup lang="ts">
type IconName =
  | 'heart'        // 3D crimson heart
  | 'speaker'      // 3D navy/gold speaker
  | 'home'         // outline nav
  | 'search'       // outline nav
  | 'library'      // outline nav
  | 'profile'      // outline nav
  | 'star'         // outline nav
  | 'bookmark'     // outline nav

interface Props {
  name: IconName
  size?: number | string
  label?: string
}

withDefaults(defineProps<Props>(), {
  size: 32,
  label: ''
})
</script>

<template lang="pug">
  span(
    class="z-icon inline-flex items-center justify-center align-middle"
    :style="{ width: typeof size === 'number' ? size + 'px' : size, height: typeof size === 'number' ? size + 'px' : size }"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  )
    //- 3D crimson heart
    svg(
      v-if="name === 'heart'"
      viewBox="0 0 48 48"
      class="w-full h-full z-icon-heart"
    )
      defs
        radialGradient(id="zHeartBody" cx="38%" cy="32%" r="75%")
          stop(offset="0%" stop-color="#ffd9d2")
          stop(offset="45%" stop-color="#d96354")
          stop(offset="80%" stop-color="#a93d2e")
          stop(offset="100%" stop-color="#6a1d12")
        linearGradient(id="zHeartRim" x1="0" y1="0" x2="0" y2="1")
          stop(offset="0%" stop-color="#ffffff" stop-opacity="0.9")
          stop(offset="100%" stop-color="#6a1d12" stop-opacity="0.7")
        filter(id="zHeartShadow" x="-20%" y="-20%" width="140%" height="140%")
          feDropShadow(dx="0" dy="2" stdDeviation="2" flood-color="#4a160e" flood-opacity="0.4")
      path(
        d="M24 42 C8 30 4 22 8 15 C11 9 19 9 24 16 C29 9 37 9 40 15 C44 22 40 30 24 42 Z"
        fill="url(#zHeartBody)"
        stroke="url(#zHeartRim)"
        stroke-width="1.5"
        filter="url(#zHeartShadow)"
      )
      ellipse(cx="17" cy="18" rx="5" ry="3" fill="#ffffff" fill-opacity="0.55")
      ellipse(cx="30" cy="20" rx="1.8" ry="1.2" fill="#ffffff" fill-opacity="0.45")

    //- 3D navy speaker with gold glow
    svg(
      v-else-if="name === 'speaker'"
      viewBox="0 0 48 48"
      class="w-full h-full z-icon-speaker"
    )
      defs
        linearGradient(id="zSpkBody" x1="0" y1="0" x2="0" y2="1")
          stop(offset="0%" stop-color="#4a6688")
          stop(offset="55%" stop-color="#21406a")
          stop(offset="100%" stop-color="#0e2440")
        radialGradient(id="zSpkGlow" cx="50%" cy="50%" r="50%")
          stop(offset="0%" stop-color="#d4a83e" stop-opacity="0.55")
          stop(offset="100%" stop-color="#d4a83e" stop-opacity="0")
        filter(id="zSpkShadow" x="-30%" y="-30%" width="160%" height="160%")
          feDropShadow(dx="0" dy="2" stdDeviation="2.5" flood-color="#0a1a30" flood-opacity="0.5")
      circle(cx="24" cy="24" r="22" fill="url(#zSpkGlow)")
      path(
        d="M10 18h7l10-7v26L17 30h-7a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z"
        fill="url(#zSpkBody)"
        stroke="#06182d"
        stroke-width="1.5"
        stroke-linejoin="round"
        filter="url(#zSpkShadow)"
      )
      path(d="M32 17c3.2 2.4 3.2 11.6 0 14" stroke="#d4a83e" stroke-width="2.2" stroke-linecap="round" fill="none")
      path(d="M36 13c5 4 5 18 0 22" stroke="#d4a83e" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.85")
      path(d="M13 19h3l8-5" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" opacity="0.55")

    //- Outline nav: home
    svg(
      v-else-if="name === 'home'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      path(d="M3 11 12 3l9 8")
      path(d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10")

    //- Outline nav: search
    svg(
      v-else-if="name === 'search'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      circle(cx="11" cy="11" r="7")
      path(d="m20 20-3.5-3.5")

    //- Outline nav: library
    svg(
      v-else-if="name === 'library'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      rect(x="3" y="4" width="4" height="16" rx="1")
      rect(x="9" y="4" width="4" height="16" rx="1")
      path(d="m16 6 2.4-.8a1 1 0 0 1 1.27.63L21 10")

    //- Outline nav: profile
    svg(
      v-else-if="name === 'profile'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      circle(cx="12" cy="8" r="4")
      path(d="M4 21a8 8 0 0 1 16 0")

    //- Outline nav: star
    svg(
      v-else-if="name === 'star'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      path(d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9L12 3z")

    //- Outline nav: bookmark
    svg(
      v-else
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full z-icon-outline"
    )
      path(d="M6 3h12v18l-6-4-6 4V3z")
</template>

<style scoped lang="sass">
.z-icon
  line-height: 0

.z-icon-heart
  animation: z-heart-pulse 3.6s ease-in-out infinite

.z-icon-speaker
  animation: z-speaker-wobble 4s ease-in-out infinite
  transform-origin: 24px 24px

// outline icons inherit currentColor — default to navy when standalone
.z-icon-outline
  color: #1a2f4a

@keyframes z-heart-pulse
  0%, 100%
    transform: scale(1)
  50%
    transform: scale(1.04)

@keyframes z-speaker-wobble
  0%, 100%
    transform: rotate(0deg)
  25%
    transform: rotate(-2deg)
  75%
    transform: rotate(2deg)
</style>
