<script setup lang="ts">
import { ref } from 'vue'

import SButton from '@/components/atoms/SButton.vue'
import SCard from '@/components/atoms/SCard.vue'
import SCategoryChips from '@/components/atoms/SCategoryChips.vue'
import SAudioPlayer from '@/components/atoms/SAudioPlayer.vue'
import SSelect from '@/components/atoms/SSelect.vue'
import SBottomNav from '@/components/atoms/SBottomNav.vue'
import STabs from '@/components/atoms/STabs.vue'

const sChip = ref('creativity')
const sChipTab = ref('all')
const sPlaying = ref(false)
const sTime = ref(72)
const sDuration = ref(222)
const sSelectValue = ref('aria')
const sNav = ref('home')
const sTabValue = ref('a')

const sChips = [
  { id: 'creativity', label: 'Creativity', icon: '🎨' },
  { id: 'vocab', label: 'Vocabulary', icon: '📚' },
  { id: 'logic', label: 'Logic', icon: '🧩' }
]

const sChipTabs = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'top', label: 'Top' }
]

const sSelectOptions = [
  { value: 'aria', label: 'Aria', subLabel: 'Warm · English', icon: '🎙️' },
  { value: 'kai', label: 'Kai', subLabel: 'Calm · English', icon: '🌊' },
  { value: 'nova', label: 'Nova', subLabel: 'Bright · English', icon: '✨' }
]

const sNavItems = [
  { id: 'home', label: 'Home', icon: 'home' as const },
  { id: 'browse', label: 'Browse', icon: 'browse' as const },
  { id: 'library', label: 'Library', icon: 'library' as const },
  { id: 'profile', label: 'Profile', icon: 'profile' as const }
]

const sTabOptions = [
  { value: 'a', label: 'Stories' },
  { value: 'b', label: 'Lessons' },
  { value: 'c', label: 'Awards' }
]

const sComponentNames = [
  'SButton', 'SCard', 'SCategoryChips', 'SAudioPlayer', 'SSelect', 'SBottomNav', 'STabs'
]
</script>

<template lang="pug">
  div(class="ds-s-page min-h-screen w-full px-4 py-8 md:px-8 md:py-12 pb-32")
    //- Header
    header(class="max-w-6xl mx-auto mb-8")
      h1(class="text-2xl md:text-4xl font-black tracking-tight text-white") Design System · S
      p(class="mt-1 text-sm md:text-base text-white/85") Brand-themed atomic component catalogue

    //- Index
    section(class="max-w-6xl mx-auto mb-4")
      h2(class="text-lg md:text-xl font-black text-white mb-2") S- Components
      div(class="flex flex-wrap gap-2")
        span(
          v-for="name in sComponentNames"
          :key="name"
          class="inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-xs md:text-sm font-mono text-[#2C3E50] shadow"
        ) {{ name }}

    section(class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4")
      //- SButton
      div(class="ds-s-card")
        div(class="ds-s-card-title") SButton
        div(class="flex flex-wrap items-center gap-3")
          SButton(type="primary") Primary
          SButton(type="secondary") Secondary
          SButton(type="icon")
            span(class="text-lg") ★

      //- SCard
      div(class="ds-s-card")
        div(class="ds-s-card-title") SCard
        div(class="flex justify-center")
          SCard(title="Sunny Meadows" subtext="3 min")
            template(#image)
              div(class="absolute inset-0 bg-gradient-to-br from-[#F1C40F] via-[#E67E22] to-[#3498DB]")

      //- SCategoryChips - chips
      div(class="ds-s-card")
        div(class="ds-s-card-title") SCategoryChips · chips
        SCategoryChips(v-model="sChip" :items="sChips")

      //- SCategoryChips - tabs
      div(class="ds-s-card ds-s-card--dark")
        div(class="ds-s-card-title-light") SCategoryChips · tabs
        SCategoryChips(v-model="sChipTab" variant="tabs" :items="sChipTabs")

      //- SAudioPlayer
      div(class="ds-s-card md:col-span-2")
        div(class="ds-s-card-title") SAudioPlayer
        SAudioPlayer(
          :is-playing="sPlaying"
          :current-time="sTime"
          :duration="sDuration"
          @toggle="sPlaying = !sPlaying"
          @rewind="sTime = Math.max(0, sTime - 15)"
          @forward="sTime = Math.min(sDuration, sTime + 15)"
          @seek="sTime = $event"
        )

      //- SSelect
      div(class="ds-s-card ds-s-card--dark md:col-span-2")
        div(class="ds-s-card-title-light") SSelect
        SSelect(
          v-model="sSelectValue"
          label="Voice"
          accent="orange"
          :options="sSelectOptions"
        )

      //- STabs
      div(class="ds-s-card ds-s-card--dark")
        div(class="ds-s-card-title-light") STabs
        STabs(v-model="sTabValue" :options="sTabOptions")

      //- SBottomNav placeholder note
      div(class="ds-s-card")
        div(class="ds-s-card-title") SBottomNav
        p(class="text-xs text-[#7F8C8D]") Rendered fixed at the bottom of the page ↓

    //- Live SBottomNav preview
    SBottomNav(v-model="sNav" :items="sNavItems" accent="orange")
</template>

<style scoped lang="sass">
.ds-s-page
  background: radial-gradient(1200px 600px at 50% -10%, rgba(241, 196, 15, 0.35), transparent 60%), linear-gradient(180deg, #3498DB 0%, #1F6FA8 100%)

.ds-s-card
  position: relative
  border-radius: 20px
  padding: 16px 18px
  background-color: #FFFFFF
  border: 1px solid #ECF0F1
  box-shadow: 0 12px 32px -16px rgba(44, 62, 80, 0.45)

.ds-s-card--dark
  background-color: rgba(31, 111, 168, 0.65)
  border-color: rgba(255, 255, 255, 0.18)
  backdrop-filter: blur(8px)

.ds-s-card-title
  font-size: 11px
  font-weight: 700
  letter-spacing: 0.08em
  text-transform: uppercase
  color: #7F8C8D
  margin-bottom: 12px

.ds-s-card-title-light
  font-size: 11px
  font-weight: 700
  letter-spacing: 0.08em
  text-transform: uppercase
  color: rgba(255, 255, 255, 0.85)
  margin-bottom: 12px
</style>
