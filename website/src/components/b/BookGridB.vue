<template lang="pug">
  section.grid-b#alle(v-if="books.length")
    .grid-b-inner
      .grid-b-head
        h2 Weitere Bücher
        p Aus den bestehenden Reihen — alle in der Senfkorn-Welt vernetzt.

      .grid-b-list
        a.grid-b-card(
          v-for="book in books",
          :key="book.bookId",
          :href="purchasable(book) ? buyUrlOf(book) : '#app'",
          :target="purchasable(book) ? '_blank' : undefined",
          :rel="purchasable(book) ? 'noopener' : undefined"
        )
          .cover
            img(v-if="book.coverImage", :src="book.coverImage", :alt="titleOf(book)", loading="lazy")
          .meta
            .title {{ titleOf(book) }}
            .price {{ purchasable(book) ? priceOf(book) : 'Nur in der App' }}
          .badge(v-if="!purchasable(book)") Nur App
</template>

<script setup lang="ts">
import type { BookDTO } from '@/types/book'

const props = defineProps<{
  books: BookDTO[]
  buyUrlOf: (b: BookDTO) => string
}>()

const titleOf = (b: BookDTO) => b.localizations?.de?.title ?? b.bookId
const priceOf = (b: BookDTO) => {
  const raw = (b.websitePrice ?? '').trim()
  if (!raw) return ''
  return /[€$£]/.test(raw) ? raw : `${raw} €`
}
const purchasable = (b: BookDTO) =>
  Boolean((b.websitePrice ?? '').trim()) && Boolean(props.buyUrlOf(b))
</script>

<style scoped lang="scss">
.grid-b {
  padding: 72px 20px;
  background: var(--paper);
  border-top: 1px solid var(--line);
}

.grid-b-inner {
  max-width: 960px;
  margin: 0 auto;
}

.grid-b-head {
  text-align: center;
  margin-bottom: 36px;

  h2 {
    font-family: 'Fraunces', serif;
    font-size: 28px;
    font-weight: 500;
    letter-spacing: -0.02em;
    margin-bottom: 6px;
  }

  p {
    color: var(--ink-soft);
    font-size: 15px;
  }
}

.grid-b-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.grid-b-card {
  display: flex;
  flex-direction: column;
  background: var(--cream);
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--line-strong);
    box-shadow: 0 8px 24px rgba(26, 31, 58, 0.06);
  }

}

.cover {
  aspect-ratio: 3 / 4;
  background: var(--cream-dark);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.meta {
  padding: 12px 14px 16px;

  .title {
    font-family: 'Fraunces', serif;
    font-size: 14.5px;
    font-weight: 500;
    line-height: 1.2;
    margin-bottom: 4px;
    color: var(--ink);
  }

  .price {
    font-size: 12px;
    color: var(--ink-soft);
    font-weight: 500;
  }
}

.badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: var(--gold);
  color: var(--navy-deep);
  font-size: 10px;
  font-weight: 700;
  padding: 4px 9px;
  border-radius: 999px;
  letter-spacing: 0.04em;
}

@media (max-width: 760px) {
  .grid-b-list {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
