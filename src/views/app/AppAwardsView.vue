<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AHeader from '@/components/atoms/AHeader.vue'
import ABreadcrumbs from '@/components/atoms/ABreadcrumbs.vue'
import ABottomNav from '@/components/atoms/ABottomNav.vue'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const route = useRoute()

const navItems = computed(() => [
  { id: 'home', label: t('app.nav.home'), icon: 'home' as const },
  { id: 'series', label: t('app.nav.series'), icon: 'series' as const },
  { id: 'brush', label: t('app.nav.color'), icon: 'brush' as const },
  { id: 'profile', label: t('app.nav.profile'), icon: 'profile' as const }
])
const activeNav = computed<string | number>(() => {
  const name = String(route.name || '')
  if (name === 'app-main') return 'home'
  if (name === 'app-all-books' || name === 'app-book' || name === 'app-book-series') return 'series'
  if (name === 'app-awards' || name === 'app-coloring') return 'brush'
  if (name === 'app-profile') return 'profile'
  return 'home'
})

function onNav(id: string | number) {
  if (id === 'home') router.push({ name: 'app-main' })
  if (id === 'series') router.push({ name: 'app-all-books' })
  if (id === 'profile') router.push({ name: 'app-profile' })
  if (id === 'brush') router.push({ name: 'app-coloring' })
}

const placeholders = [
  { id: 'first-listen', icon: '🎧', title: 'First Listen', desc: 'Finish your first audio story.' },
  { id: 'first-read', icon: '📖', title: 'First Reader', desc: 'Read a whole story by yourself.' },
  { id: 'fruit-fan', icon: '🍎', title: 'Fruit Fan', desc: 'Collect every Fruit Agents book.' },
  { id: 'collector', icon: '⭐', title: 'Collector', desc: 'Save 5 stories to your watch list.' }
]
</script>

<template lang="pug">
  div(class="app-page min-h-screen w-full")
    AHeader(
      :greeting="t('app.awards.keepGoing')"
      :title="t('app.awards.title')"
      :show-action="false"
    )

    section(class="section-wrap mt-6")
      ABreadcrumbs(:label="t('app.awards.achievements')")
      div(class="mt-3 grid grid-cols-2 gap-3 md:gap-4")
        div(
          v-for="award in placeholders"
          :key="award.id"
          class="award-tile relative p-4 text-center"
        )
          div(class="award-medal mx-auto w-14 h-14 rounded-full flex items-center justify-center text-2xl") {{ award.icon }}
          h3(class="mt-2 text-sm md:text-base font-black award-title") {{ award.title }}
          p(class="mt-1 text-[11px] md:text-xs award-desc") {{ award.desc }}

    div(class="h-32")
    ABottomNav(:items="navItems" :model-value="activeNav" @update:model-value="onNav")
</template>

<style scoped lang="sass">
.app-page
  background-color: var(--color-bg-main)
  color: var(--color-text-primary)

.section-wrap
  max-width: 42rem
  margin-left: auto
  margin-right: auto
  padding-left: 20px
  padding-right: 20px

.award-tile
  background-color: var(--color-bg-card)
  border: 1px solid var(--color-border-subtle)
  border-radius: 20px
  box-shadow: 0 1px 2px rgba(126, 58, 242, 0.05), 0 10px 28px -12px rgba(126, 58, 242, 0.2)

.award-medal
  background: linear-gradient(135deg, #FFD147 0%, #f5a623 100%)
  box-shadow: 0 0 20px -2px rgba(255, 209, 71, 0.65)

.award-title
  color: var(--color-text-primary)

.award-desc
  color: var(--color-text-secondary)
</style>

