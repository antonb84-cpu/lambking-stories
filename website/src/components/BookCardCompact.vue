<template lang="pug">
  .book-card-compact
    .compact-image-wrap
      span.compact-flag(:class="{ soon: !isPurchasable }") {{ isPurchasable ? 'Verfügbar' : 'Nur App' }}
      .compact-image
        img(v-if="coverUrl", :src="coverUrl", :alt="title", loading="lazy")
        BookCover(
          v-else,
          :series="seriesLabel",
          :number="bandNumber",
          :title="title",
          :author="book.author",
          :series-class="seriesClass"
        )

    .compact-content
      .compact-series(:class="seriesTagClass") {{ seriesLine }}
      h3.compact-title {{ title }}
      .compact-bottom
        .compact-price(v-if="isPurchasable") {{ priceLabel }}
        a.compact-buy(
          v-if="isPurchasable"
          :href="buyUrl"
          target="_blank"
          rel="noopener"
        )
          | buy
          svg(viewBox="0 0 11 11", fill="none", stroke="currentColor", stroke-width="2")
            path(d="M2 5.5 H9 M6.5 3 L9 5.5 L6.5 8", stroke-linecap="round")
        span.compact-app(v-else)
          svg(viewBox="0 0 14 14", fill="none", stroke="currentColor", stroke-width="1.8", stroke-linecap="round", stroke-linejoin="round")
            rect(x="3", y="1.5", width="8", height="11", rx="1.5")
            circle(cx="7", cy="10", r="0.6", fill="currentColor", stroke="none")
          | Nur in der App
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BookDTO } from '@/types/book'
import { pickLocalizedImage } from '@/types/book'
import { buyUrlOf } from '@/utils/bookSort'
import BookCover from './BookCover.vue'

const props = defineProps<{ book: BookDTO }>()

const title = computed(() => props.book.localizations?.de?.title ?? props.book.bookId)
const coverUrl = computed(() => pickLocalizedImage(props.book.coverImage, 'de'))
const buyUrl = computed(() => buyUrlOf(props.book))

const isPurchasable = computed(
  () => Boolean((props.book.websitePrice ?? '').trim()) && Boolean(buyUrl.value)
)

const priceLabel = computed(() => {
  const raw = (props.book.websitePrice ?? '').trim()
  if (!raw) return ''
  return /[€$£]/.test(raw) ? raw : `${raw} €`
})

const bandNumber = computed(() => {
  const parts = props.book.bookId.split('-')
  return parts[1] ? parts[1].padStart(2, '0') : ''
})

const seriesSlug = computed(() => props.book.bookSeriesId || '')

const seriesLabel = computed(() => {
  if (!seriesSlug.value) return ''
  return seriesSlug.value
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
})

const seriesLine = computed(() => {
  const series = seriesLabel.value
  const band = bandNumber.value ? `Band ${parseInt(bandNumber.value, 10)}` : ''
  return [series, band].filter(Boolean).join(' · ')
})

const seriesClass = computed(() => {
  const slug = seriesSlug.value
  if (slug.includes('frucht')) return 'c-fruchtagenten'
  if (slug.includes('petrus')) return 'c-petrus'
  if (slug.includes('geschicht')) return 'c-geschichte'
  if (slug.includes('obstsalat')) return 'c-obstsalat'
  return 'c-fruchtagenten'
})

const seriesTagClass = computed(() => {
  const slug = seriesSlug.value
  if (slug.includes('petrus')) return 's-petrus'
  if (slug.includes('geschicht')) return 's-geschichte'
  if (slug.includes('obstsalat')) return 's-obstsalat'
  return ''
})
</script>

<style scoped lang="scss">
.book-card-compact {
  background: var(--cream);
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--line-strong);
    box-shadow: 0 8px 22px rgba(26, 31, 58, 0.06);
  }
}

.compact-image-wrap {
  aspect-ratio: 5 / 4;
  background: var(--cream-dark);
  padding: 18px 14px 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
        ellipse at center bottom,
        rgba(0, 0, 0, 0.08),
        transparent 70%
    );
    pointer-events: none;
  }
}

.compact-image {
  width: 60%;
  aspect-ratio: 3 / 4;
  border-radius: 3px;
  box-shadow: 0 2px 6px rgba(26, 31, 58, 0.15),
  0 10px 26px rgba(26, 31, 58, 0.12);
  position: relative;
  z-index: 1;
  transform: rotate(-2deg);
  overflow: hidden;
  background: var(--cream);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.compact-flag {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--sage);
  color: #fff;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
  z-index: 2;

  &.soon {
    background: var(--gold);
    color: var(--navy-deep);
  }
}

.compact-content {
  padding: 14px 14px 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.compact-series {
  font-size: 10px;
  font-weight: 600;
  color: var(--coral);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 4px;

  &.s-petrus {
    color: var(--s-petrus);
  }

  &.s-geschichte {
    color: var(--s-geschichte);
  }

  &.s-obstsalat {
    color: var(--s-obstsalat);
  }
}

.compact-title {
  font-family: 'Fraunces', serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.01em;
  margin: 0 0 12px;
  flex: 1;
}

.compact-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 10px;
  margin-top: auto;
  border-top: 1px solid var(--line);
}

.compact-price {
  font-family: 'Fraunces', serif;
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
  line-height: 1;
}

.compact-buy {
  background: var(--ink);
  color: var(--cream);
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  transition: background 0.15s;

  &:hover {
    background: var(--navy-deep);
  }

  svg {
    width: 9px;
    height: 9px;
  }
}

.compact-app {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: #7a5f1f;
  background: var(--gold-soft);
  margin-left: auto;

  svg {
    width: 11px;
    height: 11px;
  }
}
</style>
