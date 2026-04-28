<template lang="pug">
  .sticky-buy(v-if="visible && buyUrl")
    .sticky-info
      .sticky-title {{ title }}
      .sticky-price {{ priceLabel }}
    a.sticky-cta(:href="buyUrl", target="_blank", rel="noopener") buy
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { BookDTO } from '@/types/book'

const props = defineProps<{
  book: BookDTO | null
  buyUrl: string
}>()

const title = computed(() => props.book?.localizations?.de?.title ?? '')
const priceLabel = computed(() => {
  const raw = (props.book?.websitePrice ?? '').trim()
  if (!raw) return ''
  return /[€$£]/.test(raw) ? raw : `${raw} €`
})

// Show the bar only after the user has scrolled past the hero — otherwise
// it doubles up with the hero CTA and feels spammy.
const visible = ref(false)
const onScroll = () => {
  visible.value = window.scrollY > 480
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped lang="scss">
.sticky-buy {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 80;
  display: none;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--ink);
  color: var(--cream);
  border-radius: 16px;
  box-shadow: 0 12px 28px rgba(26, 31, 58, 0.28);
}

.sticky-info {
  min-width: 0;
}

.sticky-title {
  font-family: 'Fraunces', serif;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sticky-price {
  font-size: 12px;
  color: rgba(250, 244, 234, 0.7);
}

.sticky-cta {
  background: var(--coral);
  color: #fff;
  padding: 10px 20px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  flex-shrink: 0;

  &:hover {
    background: var(--coral-dark);
  }
}

@media (max-width: 760px) {
  .sticky-buy {
    display: flex;
  }
}
</style>
