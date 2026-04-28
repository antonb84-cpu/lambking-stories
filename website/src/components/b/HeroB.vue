<template lang="pug">
  section.hero-b#top
    .hero-b-inner
      .hero-b-text
        .hero-b-eyebrow
          span.dot
          | Christliche Kinderbücher · 9–11 Jahre
        h1.hero-b-title
          | Geschichten, die Kinder
          em &nbsp;freiwillig
          | &nbsp;lesen wollen.
        p.hero-b-lead
          | Biblisch fundierte Abenteuer als gedrucktes Hardcover — werbefrei, klimaneutral gedruckt, in 5–8 Tagen bei dir zu Hause.
        .hero-b-ctas
          a.hero-b-buy(v-if="isPurchasable", :href="buyUrl", target="_blank", rel="noopener")
            | Jetzt bestellen — {{ priceLabel }}
            svg(viewBox="0 0 14 14", fill="none", stroke="currentColor", stroke-width="2", stroke-linecap="round")
              path(d="M3 7 H11 M8 4 L11 7 L8 10")
          a.hero-b-app-only(v-else, href="#app")
            svg(viewBox="0 0 14 14", fill="none", stroke="currentColor", stroke-width="1.8", stroke-linecap="round", stroke-linejoin="round")
              rect(x="3", y="1.5", width="8", height="11", rx="1.5")
              circle(cx="7", cy="10", r="0.6", fill="currentColor", stroke="none")
            | Nur in der App verfügbar
          a.hero-b-secondary(href="#warum") Warum SenfkornGeschichten?
        .hero-b-microproof
          span ★★★★★
          span Hardcover · Print-on-Demand · klimaneutral

      .hero-b-visual
        .hero-b-cover
          img(v-if="coverImage", :src="coverImage", :alt="title", loading="eager")
          .hero-b-placeholder(v-else) {{ title }}
        .hero-b-tape Neu erschienen
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BookDTO } from '@/types/book'

const props = defineProps<{
  book: BookDTO | null
  buyUrl: string
}>()

const title = computed(() => props.book?.localizations?.de?.title ?? 'Mission Friede')
const coverImage = computed(() => props.book?.coverImage ?? '')

const priceRaw = computed(() => (props.book?.websitePrice ?? '').trim())

const isPurchasable = computed(() => Boolean(priceRaw.value) && Boolean(props.buyUrl))

const priceLabel = computed(() => {
  if (!priceRaw.value) return ''
  return /[€$£]/.test(priceRaw.value) ? priceRaw.value : `${priceRaw.value} €`
})
</script>

<style scoped lang="scss">
.hero-b {
  position: relative;
  padding: 56px 20px 80px;
  overflow: hidden;
  background: radial-gradient(ellipse at 80% 0%, var(--gold-soft) 0%, transparent 55%),
  radial-gradient(ellipse at 0% 100%, var(--coral-soft) 0%, transparent 55%);
}

.hero-b-inner {
  max-width: 960px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 56px;
  align-items: center;
}

.hero-b-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  color: var(--coral-dark);
  margin-bottom: 18px;

  .dot {
    width: 6px;
    height: 6px;
    background: var(--coral);
    border-radius: 50%;
  }
}

.hero-b-title {
  font-family: 'Fraunces', serif;
  font-size: 56px;
  line-height: 1.02;
  font-weight: 500;
  letter-spacing: -0.03em;
  margin-bottom: 18px;

  em {
    font-style: italic;
    color: var(--coral);
  }
}

.hero-b-lead {
  font-size: 18px;
  line-height: 1.55;
  color: var(--ink-soft);
  margin-bottom: 28px;
  max-width: 480px;
}

.hero-b-ctas {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 22px;
}

.hero-b-buy {
  background: var(--coral);
  color: #fff;
  padding: 16px 26px;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: background 0.15s, transform 0.15s;
  box-shadow: 0 6px 18px rgba(232, 115, 90, 0.32);

  &:hover {
    background: var(--coral-dark);
    transform: translateY(-1px);
  }

  svg {
    width: 14px;
    height: 14px;
  }
}

.hero-b-app-only {
  background: var(--gold-soft);
  color: #7a5f1f;
  padding: 14px 22px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: background 0.15s, transform 0.15s;

  &:hover {
    background: #ecdcb8;
    transform: translateY(-1px);
  }

  svg {
    width: 16px;
    height: 16px;
  }
}

.hero-b-secondary {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-soft);
  text-decoration: underline;
  text-underline-offset: 4px;

  &:hover {
    color: var(--ink);
  }
}

.hero-b-microproof {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 12.5px;
  color: var(--ink-soft);

  > span:first-child {
    color: var(--gold);
    letter-spacing: 0.04em;
  }
}

.hero-b-visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-b-cover {
  width: 280px;
  aspect-ratio: 3 / 4;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(26, 31, 58, 0.18),
  0 24px 60px rgba(26, 31, 58, 0.22);
  background: var(--cream);
  transform: rotate(-3deg);
  transition: transform 0.3s;

  &:hover {
    transform: rotate(-3deg) translateY(-4px);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.hero-b-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Fraunces', serif;
  font-size: 22px;
  color: var(--ink-soft);
  padding: 24px;
  text-align: center;
}

.hero-b-tape {
  position: absolute;
  top: 14px;
  right: 14px;
  background: var(--gold);
  color: var(--navy-deep);
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transform: rotate(6deg);
  box-shadow: 0 4px 10px rgba(212, 162, 76, 0.35);
}

@media (max-width: 760px) {
  .hero-b {
    padding: 40px 18px 56px;
  }
  .hero-b-inner {
    grid-template-columns: 1fr;
    gap: 36px;
    text-align: left;
  }
  .hero-b-title {
    font-size: 38px;
  }
  .hero-b-lead {
    font-size: 16px;
  }
  .hero-b-cover {
    width: 220px;
    margin: 0 auto;
  }
  .hero-b-buy {
    width: 100%;
    justify-content: center;
  }
}
</style>
