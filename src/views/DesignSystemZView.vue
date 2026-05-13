<script setup lang="ts">
import { ref } from 'vue'

import ZButton from '@/components/atoms/ZButton.vue'
import ZCard from '@/components/atoms/ZCard.vue'
import ZPlayButton from '@/components/atoms/ZPlayButton.vue'
import ZPlayer from '@/components/atoms/ZPlayer.vue'
import ZChip from '@/components/atoms/ZChip.vue'
import ZBadge from '@/components/atoms/ZBadge.vue'
import ZBottomNav from '@/components/atoms/ZBottomNav.vue'
import ZHeader from '@/components/atoms/ZHeader.vue'
import ZBreadcrumbs from '@/components/atoms/ZBreadcrumbs.vue'
import ZIconography from '@/components/atoms/ZIconography.vue'

const progress = ref(0.42)
const playing = ref(false)
const ringProgress = ref(0.62)
const navValue = ref<string | number>('home')
const selectedChip = ref(false)

const navItems = [
  { id: 'home', label: 'Start', icon: 'home' as const },
  { id: 'grid', label: 'Serien', icon: 'grid' as const },
  { id: 'pencil', label: 'Malen', icon: 'pencil' as const },
  { id: 'profile', label: 'Mein Bereich', icon: 'profile' as const }
]

const breadcrumbItems = [
  { label: 'STARTSEITE' },
  { label: 'SERIEN' },
  { label: 'FRUCHT-AGENTEN' }
]

const badgeVariants = ['new', 'hot', 'sale', 'info']

const zComponents = [
  'ZButton', 'ZCard', 'ZPlayButton', 'ZPlayer', 'ZChip', 'ZBadge',
  'ZBottomNav', 'ZHeader', 'ZBreadcrumbs', 'ZIconography'
]

interface TransitionDef {
  name: string
  label: string
  emoji: string
  desc: string
}

const pageTransitions: TransitionDef[] = [
  { name: 'page-playful', label: 'Playful', emoji: '✨', desc: 'Gentle lift-in with a little tilt — the default' },
  { name: 'page-balloon', label: 'Balloon', emoji: '🎈', desc: 'Drops from above and bounces with squash & stretch' },
  { name: 'page-swoosh', label: 'Swoosh', emoji: '💨', desc: 'Whooshes in from the right with a tilt' },
  { name: 'page-spin', label: 'Spin Pop', emoji: '🪙', desc: 'Coin-flip spin with a pop at the end' },
  { name: 'page-jelly', label: 'Jelly', emoji: '🍮', desc: 'Lands and wiggles like jelly' },
  { name: 'page-flip', label: 'Story Flip', emoji: '📖', desc: '3D page flip — like turning a storybook' },
  { name: 'page-pop', label: 'Confetti Pop', emoji: '🎉', desc: 'Zoom-in celebration with overshoot' }
]
const activeTransition = ref<string>('page-playful')
const previewKey = ref(0)
const previewColors = ['#fbecc4', '#f5d8a0', '#e8c890', '#f0e0b5', '#fadfb8', '#f3d167']
const previewEmojis = ['👑', '🍇', '🌾', '⛵', '📖', '🎨', '🦁', '🕊️']

function playTransition(name: string) {
  activeTransition.value = name
  previewKey.value++
}

interface Dancer {
  id: number
  emoji: string
  left: number
  delay: number
  duration: number
  hue: number
}

const dancers = ref<Dancer[]>([])
let did = 0
const emojis = ['👑', '🍇', '🌾', '⛵', '📖', '🎨', '🦁', '🕊️', '🛡️', '⚔️', '🏰', '🌟']

function triggerDance() {
  const count = 10
  const now: Dancer[] = []
  for (let i = 0; i < count; i++) {
    now.push({
      id: ++did,
      emoji: emojis[Math.floor(Math.random() * emojis.length)] as string,
      left: 5 + Math.random() * 90,
      delay: Math.random() * 180,
      duration: 1400 + Math.random() * 900,
      hue: Math.floor(Math.random() * 360)
    })
  }
  dancers.value.push(...now)
  const ids = new Set(now.map((d) => d.id))
  setTimeout(() => {
    dancers.value = dancers.value.filter((d) => !ids.has(d.id))
  }, 2600)
}
</script>

<template lang="pug">
  div(class="ds-z-page relative min-h-screen w-full pb-32")
    ZHeader(
      greeting="Hallo, Entdecker!"
      title="Design System · Z"
      action-label="Unlock"
      @action="triggerDance"
    )

    div(class="max-w-6xl mx-auto px-4 md:px-8 pt-6")
      p(class="text-sm md:text-base text-[#7a6b55]") Atomic component catalogue — Z-series (LambKing theme)

      section(class="mt-6")
        h2(class="text-base md:text-lg font-black text-[#1a2f4a] mb-2") Z- Components
        div(class="flex flex-wrap gap-2")
          span(
            v-for="name in zComponents"
            :key="name"
            class="inline-flex items-center rounded-full bg-[#fdf8ed] px-3 py-1 text-xs md:text-sm font-mono text-[#1a2f4a] shadow border border-[#e6d6b5]"
          ) {{ name }}

      section(class="mt-6")
        div(class="ds-z-card")
          div(class="ds-z-card-title") Page Transitions
          p(class="text-xs text-[#7a6b55] mb-3") Tap a transition to preview it — built for ages 6-12 ✨
          div(class="flex flex-wrap gap-2 mb-4")
            button(
              v-for="t in pageTransitions"
              :key="t.name"
              type="button"
              @click="playTransition(t.name)"
              :class="['ds-z-trans-btn', activeTransition === t.name ? 'is-active' : '']"
            )
              span(class="text-xl") {{ t.emoji }}
              span(class="font-extrabold text-xs md:text-sm") {{ t.label }}
          p(class="text-[11px] text-[#7a6b55] mb-3")
            | {{ pageTransitions.find(t => t.name === activeTransition)?.desc }}
          div(class="ds-z-trans-stage relative overflow-hidden rounded-3xl")
            transition(:name="activeTransition" mode="out-in")
              div(
                :key="previewKey"
                class="ds-z-trans-panel absolute inset-0 flex flex-col items-center justify-center gap-2"
                :style="{ background: 'linear-gradient(160deg, ' + previewColors[previewKey % previewColors.length] + ' 0%, #fdf8ed 100%)' }"
              )
                span(class="text-6xl md:text-7xl") {{ previewEmojis[previewKey % previewEmojis.length] }}
                span(class="text-sm md:text-base font-black text-[#1a2f4a]") Seite {{ previewKey + 1 }}
                span(class="text-[11px] text-[#7a6b55]") Tap again to replay

      section(class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5")

        div(class="ds-z-card")
          div(class="ds-z-card-title") ZButton
          div(class="flex flex-col gap-3")
            ZButton(type="primary" icon="book" @click="triggerDance") Lesen
            ZButton(type="secondary" icon="volume" @click="triggerDance") Anhören
            ZButton(type="primary" icon="download" @click="triggerDance") Download
            div(class="flex items-center gap-3")
              ZButton(type="primary" size="sm" icon="book" @click="triggerDance") Small
              ZButton(type="primary" size="md" icon="book" @click="triggerDance") Medium
            ZButton(type="primary" icon="volume" is-disabled) Disabled
          p(class="ds-z-hint") Klick für tanzende Kronen 👑

        div(class="ds-z-card")
          div(class="ds-z-card-title") ZCard
          div(class="flex flex-col gap-4")
            ZCard(
              title="Die Frucht-Agenten · Band 1"
              category="NEU"
              :tags="['10 Bücher', 'Alter 6+', 'DE']"
            )
              template(#image)
                div(class="w-full h-full flex items-center justify-center text-4xl") 🍇
            ZCard(
              title="Petrus und der Messias im Boot"
              category="Bibelabenteuer"
              :tags="['12 Bücher', 'Alter 5+']"
            )
              template(#image)
                div(class="w-full h-full flex items-center justify-center text-4xl") ⛵

        div(class="ds-z-card")
          div(class="ds-z-card-title") ZPlayButton
          div(class="flex items-center gap-6 flex-wrap")
            ZPlayButton(size="sm" @click="playing = !playing" :is-playing="playing")
            ZPlayButton(size="md" @click="playing = !playing" :is-playing="playing")
            ZPlayButton(size="lg" @click="playing = !playing" :is-playing="playing")
            ZPlayButton(size="xl" @click="playing = !playing" :is-playing="playing")
            ZPlayButton(size="lg" :progress="ringProgress" @click="playing = !playing" :is-playing="playing")
          div(class="mt-3 flex items-center gap-2")
            span(class="text-xs text-[#7a6b55]") Ring progress
            input(
              type="range"
              min="0"
              max="1"
              step="0.01"
              v-model.number="ringProgress"
              class="flex-1 accent-[#a93d2e]"
            )

        div(class="ds-z-card")
          div(class="ds-z-card-title") ZPlayer
          ZPlayer(:progress="progress" @seek="(v) => progress = v")
          div(class="mt-4")
            ZPlayer(:progress="0.15" label="Kapitel 1 · 15% gelesen")
          div(class="mt-4")
            ZPlayer(:progress="0.88" :seekable="false")

        div(class="ds-z-card")
          div(class="ds-z-card-title") ZChip
          div(class="flex flex-col gap-3")
            div(class="flex flex-wrap gap-2")
              ZChip(label="10 Bücher")
              ZChip(label="Alter 6+")
              ZChip(label="Deutsch")
              ZChip(label="Abenteuer")
            div(class="flex flex-wrap gap-2")
              ZChip(variant="soft" label="Soft")
              ZChip(variant="outline" label="Outline")
              ZChip(variant="solid" label="Alle")
              ZChip(variant="success" label="Neu")
              ZChip(variant="warning" label="Premium")
              ZChip(variant="info" label="Info")
            div(class="flex flex-wrap gap-2")
              ZChip(size="sm" label="Small")
              ZChip(size="md" label="Medium")
              ZChip(size="lg" label="Large")
            div(class="flex flex-wrap gap-2")
              ZChip(
                clickable
                :selected="selectedChip"
                :label="selectedChip ? 'Ausgewählt' : 'Klick mich'"
                @click="selectedChip = !selectedChip"
              )

        div(class="ds-z-card")
          div(class="ds-z-card-title") ZBadge
          div(class="flex flex-wrap gap-5")
            div(
              v-for="v in badgeVariants"
              :key="v"
              class="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-[#f3e6c4] to-[#c89030] flex items-center justify-center text-3xl"
            )
              ZBadge(:variant="v" :label="v === 'new' ? 'NEU' : v.toUpperCase()")
              span 📖

        div(class="ds-z-card md:col-span-2")
          div(class="ds-z-card-title") ZHeader
          div(class="rounded-3xl overflow-hidden border border-[#e6d6b5]")
            ZHeader(
              greeting="Hallo, Leonas"
              title="LambKing Stories"
              action-label="Unlock"
              @action="triggerDance"
            )

        div(class="ds-z-card")
          div(class="ds-z-card-title") ZBreadcrumbs
          div(class="flex flex-col gap-3")
            ZBreadcrumbs(label="WEITERLESEN")
            ZBreadcrumbs(label="NEU ENTDECKEN")
            ZBreadcrumbs(:items="breadcrumbItems")

        div(class="ds-z-card")
          div(class="ds-z-card-title") ZIconography
          div(class="grid grid-cols-4 gap-4 items-center justify-items-center")
            div(class="flex flex-col items-center gap-1")
              ZIconography(name="heart" :size="44" label="Favorit")
              span(class="text-[10px] text-[#7a6b55]") heart
            div(class="flex flex-col items-center gap-1")
              ZIconography(name="speaker" :size="44" label="Ton")
              span(class="text-[10px] text-[#7a6b55]") speaker
            div(class="flex flex-col items-center gap-1")
              ZIconography(name="home" :size="34")
              span(class="text-[10px] text-[#7a6b55]") home
            div(class="flex flex-col items-center gap-1")
              ZIconography(name="search" :size="34")
              span(class="text-[10px] text-[#7a6b55]") search
            div(class="flex flex-col items-center gap-1")
              ZIconography(name="library" :size="34")
              span(class="text-[10px] text-[#7a6b55]") library
            div(class="flex flex-col items-center gap-1")
              ZIconography(name="profile" :size="34")
              span(class="text-[10px] text-[#7a6b55]") profile
            div(class="flex flex-col items-center gap-1")
              ZIconography(name="star" :size="34")
              span(class="text-[10px] text-[#7a6b55]") star
            div(class="flex flex-col items-center gap-1")
              ZIconography(name="bookmark" :size="34")
              span(class="text-[10px] text-[#7a6b55]") bookmark

        div(class="ds-z-card md:col-span-2")
          div(class="ds-z-card-title") ZBottomNav (live at bottom of page)
          p(class="text-xs text-[#7a6b55]") Aktiver Tab — {{ navValue }}

    ZBottomNav(
      :items="navItems"
      v-model="navValue"
      @select="triggerDance"
    )

    div(class="ds-z-dance-layer pointer-events-none fixed inset-0 z-[60] overflow-hidden")
      span(
        v-for="d in dancers"
        :key="d.id"
        class="ds-z-dancer absolute bottom-20 text-4xl md:text-5xl"
        :style="{\
          left: d.left + '%',\
          animationDelay: d.delay + 'ms',\
          animationDuration: d.duration + 'ms',\
          filter: 'hue-rotate(' + d.hue + 'deg) drop-shadow(0 4px 10px rgba(74, 22, 14, 0.4))'\
        }"
      ) {{ d.emoji }}
</template>

<style scoped lang="sass">
.ds-z-page
  background: radial-gradient(ellipse at top, #faf2dc 0%, #f3e6c4 60%, #e8d29a 100%)

.ds-z-card
  background-color: #fdf8ed
  border: 1px solid #e6d6b5
  border-radius: 22px
  padding: 20px
  box-shadow: 0 8px 24px -12px rgba(58, 42, 18, 0.28)

.ds-z-card-title
  font-size: 12px
  font-weight: 800
  text-transform: uppercase
  letter-spacing: 0.14em
  color: #1a2f4a
  margin-bottom: 14px

.ds-z-hint
  margin-top: 10px
  font-size: 11px
  color: #7a6b55


.ds-z-trans-btn
  display: inline-flex
  align-items: center
  gap: 8px
  padding: 8px 14px
  border-radius: 999px
  background-color: #fdf8ed
  border: 2px solid #e6d6b5
  color: #1a2f4a
  cursor: pointer
  transition: transform 160ms ease-out, box-shadow 160ms ease-out, border-color 160ms ease-out
  -webkit-tap-highlight-color: transparent

  &:hover
    transform: translateY(-2px)
    border-color: rgba(212, 168, 62, 0.6)
    box-shadow: 0 10px 22px -12px rgba(212, 168, 62, 0.55)

  &:active
    transform: translateY(1px) scale(0.97)

  &.is-active
    background: linear-gradient(180deg, #21406a 0%, #142a47 100%)
    color: #ffffff
    border-color: #0a1a30
    box-shadow: 0 0 0 1px rgba(10, 26, 48, 0.4), 0 14px 30px -12px rgba(10, 26, 48, 0.6)

.ds-z-trans-stage
  height: 240px
  background-color: #faf2dc
  border: 1.5px dashed #d9bf80
  box-shadow: inset 0 2px 6px rgba(58, 42, 18, 0.1)

.ds-z-trans-panel
  will-change: transform, opacity

.ds-z-dancer
  display: inline-block
  will-change: transform, opacity
  animation-name: ds-z-dance
  animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1)
  animation-fill-mode: forwards

@keyframes ds-z-dance
  0%
    transform: translateY(40px) scale(0.4) rotate(-20deg)
    opacity: 0
  15%
    transform: translateY(-20px) scale(1.2) rotate(10deg)
    opacity: 1
  30%
    transform: translateY(-80px) scale(1) rotate(-15deg)
  45%
    transform: translateY(-140px) scale(1.05) rotate(15deg)
  60%
    transform: translateY(-200px) scale(1) rotate(-10deg)
  80%
    transform: translateY(-260px) scale(0.95) rotate(5deg)
    opacity: 1
  100%
    transform: translateY(-340px) scale(0.6) rotate(0deg)
    opacity: 0
</style>
