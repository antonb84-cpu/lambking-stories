<template lang="pug">
  .book-card
    .book-image-wrap
      span.book-status-flag(:class="{ soon: !isPurchasable }") {{ isPurchasable ? 'Verfügbar' : 'Nur App' }}
      .book-image
        img(v-if="book.coverImage", :src="book.coverImage", :alt="title", loading="lazy")
        BookCover(
          v-else,
          :series="seriesLabel",
          :number="bandNumber",
          :title="title",
          :author="book.author",
          :series-class="seriesClass"
        )

    .book-content
      .book-series-tag(:class="seriesTagClass") {{ seriesLine }}
      h3.book-title {{ title }}
      .book-meta
        span.book-meta-item(v-for="tag in tags", :key="tag") {{ tag }}
      p.book-desc {{ description }}

      a.book-also(v-if="isPurchasable", href="#app")
        svg(viewBox="0 0 11 11")
          rect(x="2", y="1", width="7", height="9", rx="1")
          circle(cx="5.5", cy="8", r="0.5", fill="currentColor")
        | Auch in der App verfügbar

      .book-bottom(v-if="isPurchasable")
        .book-price
          | {{ priceLabel }}
          small inkl. MwSt. &amp; Versand
        a.book-buy(:href="buyUrl", target="_blank", rel="noopener")
          | buy
          svg(viewBox="0 0 11 11", fill="none", stroke="currentColor", stroke-width="2")
            path(d="M2 5.5 H9 M6.5 3 L9 5.5 L6.5 8", stroke-linecap="round")
      a.book-app-only(v-else, href="#app")
        svg(viewBox="0 0 14 14", fill="none", stroke="currentColor", stroke-width="1.8", stroke-linecap="round", stroke-linejoin="round")
          rect(x="3", y="1.5", width="8", height="11", rx="1.5")
          circle(cx="7", cy="10", r="0.6", fill="currentColor", stroke="none")
        | Nur in der App verfügbar
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BookDTO } from '@/types/book'
import BookCover from './BookCover.vue'

const props = defineProps<{ book: BookDTO }>()

const title = computed(() => props.book.localizations?.de?.title ?? props.book.bookId)
const description = computed(() => props.book.localizations?.de?.shortDescription ?? '')

const buyUrl = computed(() => {
  const link = props.book.etsyLink
  return link?.de?.trim() || link?.en?.trim() || ''
})

// "Purchasable" requires BOTH a price and a sales link. Either missing
// flips the card into the app-only fallback state.
const isPurchasable = computed(
  () => Boolean((props.book.websitePrice ?? '').trim()) && Boolean(buyUrl.value)
)

const tags = computed<string[]>(() => {
  const websiteTags = Array.isArray(props.book.websiteTags) ? props.book.websiteTags : []
  return [...websiteTags, 'Hardcover']
})

const priceLabel = computed(() => {
  const raw = (props.book.websitePrice ?? '').trim()
  if (!raw) return ''
  return /[€$£]/.test(raw) ? raw : `${raw} €`
})

// bookId follows pattern <prefix>-<volume>-<shortname> (validated server-side).
// If the format ever drifts, fall back to whatever string remains.
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

// Map known series slugs to the bespoke gradient cover variant. Unknown
// series fall through to the default coral tag color and gradient.
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
.book-card {
  background: var(--cream);
  border: 1px solid var(--line);
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-3px);
    border-color: var(--line-strong);
    box-shadow: 0 12px 32px rgba(26, 31, 58, 0.06);
  }

}

.book-image-wrap {
  aspect-ratio: 5 / 4;
  background: var(--cream-dark);
  padding: 32px 24px 0;
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

.book-image {
  width: 55%;
  aspect-ratio: 3 / 4;
  border-radius: 4px;
  box-shadow: 0 3px 8px rgba(26, 31, 58, 0.15),
  0 15px 40px rgba(26, 31, 58, 0.12);
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

.book-status-flag {
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--sage);
  color: #fff;
  padding: 5px 11px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  z-index: 2;

  &.soon {
    background: var(--gold);
    color: var(--navy-deep);
  }
}

.book-content {
  padding: 24px 24px 28px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.book-series-tag {
  font-size: 11px;
  font-weight: 600;
  color: var(--coral);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 6px;

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

.book-title {
  font-family: 'Fraunces', serif;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.015em;
  line-height: 1.15;
  margin-bottom: 10px;
}

.book-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  font-size: 12px;
  color: var(--ink-soft);
  margin-bottom: 14px;
}

.book-meta-item {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--cream-dark);
  border: 1px solid var(--line);
}

.book-desc {
  font-size: 14.5px;
  line-height: 1.55;
  color: var(--ink-soft);
  margin-bottom: 20px;
  flex: 1;
}

.book-also {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--gold-soft);
  color: #7a5f1f;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  margin-top: 10px;
  align-self: flex-start;

  svg {
    width: 11px;
    height: 11px;
    stroke: currentColor;
    fill: none;
    stroke-width: 2;
  }
}

.book-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-top: 18px;
  margin-top: 18px;
  border-top: 1px solid var(--line);
}

.book-price {
  font-family: 'Fraunces', serif;
  font-size: 22px;
  font-weight: 500;
  color: var(--ink);
  line-height: 1;

  small {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    color: var(--ink-soft);
    font-weight: 500;
    display: block;
    margin-top: 3px;
  }
}

.book-buy {
  background: var(--ink);
  color: var(--cream);
  padding: 11px 18px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 0.15s;

  &:hover {
    background: var(--navy-deep);
  }

  svg {
    width: 11px;
    height: 11px;
  }
}

.book-app-only {
  margin-top: 18px;
  padding: 14px 18px;
  border-top: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #7a5f1f;
  background: var(--gold-soft);
  border-radius: 0 0 20px 20px;
  margin-left: -24px;
  margin-right: -24px;
  margin-bottom: -28px;
  transition: background 0.15s;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    background: #ecdcb8;
  }
}
</style>
