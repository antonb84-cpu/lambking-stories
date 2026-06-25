<script setup lang="ts">
import { ref } from 'vue'

import AButton from '@/components/atoms/AButton.vue'
import ACard from '@/components/atoms/ACard.vue'
import APlayButton from '@/components/atoms/APlayButton.vue'
import APlayer from '@/components/atoms/APlayer.vue'
import AChip from '@/components/atoms/AChip.vue'
import ABadge from '@/components/atoms/ABadge.vue'
import BBottomNav from '@/components/atoms/BBottomNav.vue'
import AHeader from '@/components/atoms/AHeader.vue'
import ABreadcrumbs from '@/components/atoms/ABreadcrumbs.vue'
import AIconography from '@/components/atoms/AIconography.vue'

const progress = ref(0.42)
const playing = ref(false)
const ringProgress = ref(0.62)
const navValue = ref<string | number>('home')
const selectedChip = ref(false)

const navItems = [
  { id: 'home', label: 'Home', icon: 'home' as const },
  { id: 'grid', label: 'Kategorien', icon: 'grid' as const },
  { id: 'pencil', label: 'Erstellen', icon: 'pencil' as const },
  { id: 'profile', label: 'Profil', icon: 'profile' as const }
]

const breadcrumbItems = [
  { label: 'STARTSEITE' },
  { label: 'GESCHICHTEN' },
  { label: 'ABENTEUER' }
]

const badgeVariants = ['new', 'hot', 'sale', 'info']

const aComponents = [
  'AButton', 'ACard', 'APlayButton', 'APlayer', 'AChip', 'ABadge',
  'BBottomNav', 'AHeader', 'ABreadcrumbs', 'AIconography'
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
const previewColors = ['#ffd6f0', '#ffe6b3', '#d4f5ff', '#d6ffd6', '#ffd6d6', '#e6d6ff']
const previewEmojis = ['🐻', '🦊', '🐼', '🦄', '🐰', '🐸', '🐵', '🦁']

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
const emojis = ['🕺', '💃', '🦄', '🐻', '🐰', '🐼', '🦊', '🐵', '🐸', '🦁', '🐷', '🐶']

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
  div(class="ds-a-page relative min-h-screen w-full pb-32")
    AHeader(
      greeting="Hello, Designer"
      title="Design System · A"
      action-label="Unlock"
      @action="triggerDance"
    )

    div(class="max-w-6xl mx-auto px-4 md:px-8 pt-6")
      p(class="text-sm md:text-base text-[#6929c4]/80") Atomic component catalogue — A-series

      section(class="mt-6")
        h2(class="text-base md:text-lg font-black text-[#2a0f55] mb-2") A- Components
        div(class="flex flex-wrap gap-2")
          span(
            v-for="name in aComponents"
            :key="name"
            class="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs md:text-sm font-mono text-[#6929c4] shadow border border-[#e6d6ff]"
          ) {{ name }}

      section(class="mt-6")
        div(class="ds-a-card")
          div(class="ds-a-card-title") Page Transitions
          p(class="text-xs text-[#6929c4]/70 mb-3") Tap a transition to preview it — built for ages 6-12 ✨
          div(class="flex flex-wrap gap-2 mb-4")
            button(
              v-for="t in pageTransitions"
              :key="t.name"
              type="button"
              @click="playTransition(t.name)"
              :class="['ds-a-trans-btn', activeTransition === t.name ? 'is-active' : '']"
            )
              span(class="text-xl") {{ t.emoji }}
              span(class="font-extrabold text-xs md:text-sm") {{ t.label }}
          p(class="text-[11px] text-[#6929c4]/80 mb-3")
            | {{ pageTransitions.find(t => t.name === activeTransition)?.desc }}
          div(class="ds-a-trans-stage relative overflow-hidden rounded-3xl")
            transition(:name="activeTransition" mode="out-in")
              div(
                :key="previewKey"
                class="ds-a-trans-panel absolute inset-0 flex flex-col items-center justify-center gap-2"
                :style="{ background: 'linear-gradient(160deg, ' + previewColors[previewKey % previewColors.length] + ' 0%, #ffffff 100%)' }"
              )
                span(class="text-6xl md:text-7xl") {{ previewEmojis[previewKey % previewEmojis.length] }}
                span(class="text-sm md:text-base font-black text-[#2a0f55]") Seite {{ previewKey + 1 }}
                span(class="text-[11px] text-[#6929c4]/70") Tap again to replay

      section(class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5")

        div(class="ds-a-card")
          div(class="ds-a-card-title") AButton
          div(class="flex flex-col gap-3")
            AButton(type="primary" icon="volume" @click="triggerDance") Jetzt hören
            AButton(type="secondary" icon="book" @click="triggerDance") Buch öffnen
            AButton(type="secondary" icon="download" @click="triggerDance") Download
            div(class="flex items-center gap-3")
              AButton(type="primary" size="sm" icon="volume" @click="triggerDance") Small
              AButton(type="primary" size="md" icon="volume" @click="triggerDance") Medium
            AButton(type="primary" icon="volume" is-disabled) Disabled
          p(class="ds-a-hint") Klick für tanzende Figuren ✨

        div(class="ds-a-card")
          div(class="ds-a-card-title") ACard
          div(class="flex flex-col gap-4")
            ACard(
              title="Die mutige kleine Maus"
              category="Märchen"
              :tags="['15 min', 'Alter 4+', 'DE']"
            )
              template(#image)
                div(class="w-full h-full flex items-center justify-center text-4xl") 🐭
            ACard(
              title="Sterne über dem Wald"
              category="Gute Nacht"
              :tags="['8 min', 'Alter 3+']"
            )
              template(#image)
                div(class="w-full h-full flex items-center justify-center text-4xl") 🌙

        div(class="ds-a-card")
          div(class="ds-a-card-title") APlayButton
          div(class="flex items-center gap-6 flex-wrap")
            APlayButton(size="sm" @click="playing = !playing" :is-playing="playing")
            APlayButton(size="md" @click="playing = !playing" :is-playing="playing")
            APlayButton(size="lg" @click="playing = !playing" :is-playing="playing")
            APlayButton(size="xl" @click="playing = !playing" :is-playing="playing")
            APlayButton(size="lg" :progress="ringProgress" @click="playing = !playing" :is-playing="playing")
          div(class="mt-3 flex items-center gap-2")
            span(class="text-xs text-[#6929c4]/70") Ring progress
            input(
              type="range"
              min="0"
              max="1"
              step="0.01"
              v-model.number="ringProgress"
              class="flex-1 accent-[#6929c4]"
            )

        div(class="ds-a-card")
          div(class="ds-a-card-title") APlayer
          APlayer(:progress="progress" @seek="(v) => progress = v")
          div(class="mt-4")
            APlayer(:progress="0.15" label="Kapitel 1 · 15% gelesen")
          div(class="mt-4")
            APlayer(:progress="0.88" :seekable="false")

        div(class="ds-a-card")
          div(class="ds-a-card-title") AChip
          div(class="flex flex-col gap-3")
            div(class="flex flex-wrap gap-2")
              AChip(label="15 min")
              AChip(label="Alter 6+")
              AChip(label="Deutsch")
              AChip(label="Abenteuer")
            div(class="flex flex-wrap gap-2")
              AChip(variant="soft" label="Soft")
              AChip(variant="outline" label="Outline")
              AChip(variant="solid" label="Solid")
              AChip(variant="success" label="Neu")
              AChip(variant="warning" label="Premium")
              AChip(variant="info" label="Info")
            div(class="flex flex-wrap gap-2")
              AChip(size="sm" label="Small")
              AChip(size="md" label="Medium")
              AChip(size="lg" label="Large")
            div(class="flex flex-wrap gap-2")
              AChip(
                clickable
                :selected="selectedChip"
                :label="selectedChip ? 'Ausgewählt' : 'Klick mich'"
                @click="selectedChip = !selectedChip"
              )

        div(class="ds-a-card")
          div(class="ds-a-card-title") ABadge
          div(class="flex flex-wrap gap-5")
            div(
              v-for="v in badgeVariants"
              :key="v"
              class="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-[#e9dcff] to-[#b58cff] flex items-center justify-center text-3xl"
            )
              ABadge(:variant="v" :label="v === 'new' ? 'NEU' : v.toUpperCase()")
              span 📖

        div(class="ds-a-card md:col-span-2")
          div(class="ds-a-card-title") AHeader
          div(class="rounded-3xl overflow-hidden border border-[#e6d6ff]")
            AHeader(
              greeting="Hallo, Lina"
              title="Startseite"
              action-label="Unlock"
              @action="triggerDance"
            )

        div(class="ds-a-card")
          div(class="ds-a-card-title") ABreadcrumbs
          div(class="flex flex-col gap-3")
            ABreadcrumbs(label="WEITERLESEN")
            ABreadcrumbs(label="NEU ENTDECKEN")
            ABreadcrumbs(:items="breadcrumbItems")

        div(class="ds-a-card")
          div(class="ds-a-card-title") AIconography
          div(class="grid grid-cols-4 gap-4 items-center justify-items-center")
            div(class="flex flex-col items-center gap-1")
              AIconography(name="heart" :size="44" label="Favorit")
              span(class="text-[10px] text-[#6929c4]/70") heart
            div(class="flex flex-col items-center gap-1")
              AIconography(name="speaker" :size="44" label="Ton")
              span(class="text-[10px] text-[#6929c4]/70") speaker
            div(class="flex flex-col items-center gap-1")
              AIconography(name="home" :size="34")
              span(class="text-[10px] text-[#6929c4]/70") home
            div(class="flex flex-col items-center gap-1")
              AIconography(name="search" :size="34")
              span(class="text-[10px] text-[#6929c4]/70") search
            div(class="flex flex-col items-center gap-1")
              AIconography(name="library" :size="34")
              span(class="text-[10px] text-[#6929c4]/70") library
            div(class="flex flex-col items-center gap-1")
              AIconography(name="profile" :size="34")
              span(class="text-[10px] text-[#6929c4]/70") profile
            div(class="flex flex-col items-center gap-1")
              AIconography(name="star" :size="34")
              span(class="text-[10px] text-[#6929c4]/70") star
            div(class="flex flex-col items-center gap-1")
              AIconography(name="bookmark" :size="34")
              span(class="text-[10px] text-[#6929c4]/70") bookmark

        div(class="ds-a-card md:col-span-2")
          div(class="ds-a-card-title") BBottomNav (live at bottom of page)
          p(class="text-xs text-[#6929c4]/70") Aktiver Tab — {{ navValue }}

    BBottomNav(
      :items="navItems"
      v-model="navValue"
      @select="triggerDance"
    )

    div(class="ds-a-dance-layer pointer-events-none fixed inset-0 z-[60] overflow-hidden")
      span(
        v-for="d in dancers"
        :key="d.id"
        class="ds-a-dancer absolute bottom-20 text-4xl md:text-5xl"
        :style="{\
          left: d.left + '%',\
          animationDelay: d.delay + 'ms',\
          animationDuration: d.duration + 'ms',\
          filter: 'hue-rotate(' + d.hue + 'deg) drop-shadow(0 4px 10px rgba(61,22,118,0.4))'\
        }"
      ) {{ d.emoji }}
</template>

<style scoped lang="sass">
.ds-a-page
  background: radial-gradient(ellipse at top, #f6f0ff 0%, #e9dcff 60%, #d7c0ff 100%)

.ds-a-card
  background-color: #ffffff
  border: 1px solid #ece0ff
  border-radius: 24px
  padding: 20px
  box-shadow: 0 8px 24px -12px rgba(61, 22, 118, 0.25)

.ds-a-card-title
  font-size: 12px
  font-weight: 700
  text-transform: uppercase
  letter-spacing: 0.14em
  color: #6929c4
  margin-bottom: 14px

.ds-a-hint
  margin-top: 10px
  font-size: 11px
  color: #8b6fbf


.ds-a-trans-btn
  display: inline-flex
  align-items: center
  gap: 8px
  padding: 8px 14px
  border-radius: 999px
  background-color: #ffffff
  border: 2px solid #ece0ff
  color: #2a0f55
  cursor: pointer
  transition: transform 160ms ease-out, box-shadow 160ms ease-out, border-color 160ms ease-out
  -webkit-tap-highlight-color: transparent

  &:hover
    transform: translateY(-2px)
    border-color: rgba(126, 58, 242, 0.45)
    box-shadow: 0 10px 22px -12px rgba(126, 58, 242, 0.45)

  &:active
    transform: translateY(1px) scale(0.97)

  &.is-active
    background: linear-gradient(180deg, #9560f4 0%, #7e3af2 100%)
    color: #ffffff
    border-color: #6929c4
    box-shadow: 0 0 0 1px rgba(126, 58, 242, 0.35), 0 14px 30px -12px rgba(126, 58, 242, 0.55)

.ds-a-trans-stage
  height: 240px
  background-color: #f6f0ff
  border: 1.5px dashed #d6c4ff
  box-shadow: inset 0 2px 6px rgba(61, 22, 118, 0.08)

.ds-a-trans-panel
  will-change: transform, opacity

.ds-a-dancer
  display: inline-block
  will-change: transform, opacity
  animation-name: ds-a-dance
  animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1)
  animation-fill-mode: forwards

@keyframes ds-a-dance
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
