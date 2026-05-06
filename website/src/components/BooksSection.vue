<template lang="pug">
  section.section.books-section#books
    .wrap
      .section-head.centered
        .section-eyebrow Die Bücher
        h2.section-title
          | Gedruckt, gebunden,&nbsp;
          em für dein Kinderzimmer.
        p.section-lead
          | Hochwertige Hardcover, klimaneutral bei Gelato gedruckt und direkt zu dir geliefert. Jedes Buch auch digital in unserer App verfügbar.

      .books-state(v-if="loading") Bücher werden geladen …
      .books-state.error(v-else-if="error") Bücher konnten nicht geladen werden: {{ error }}

      .books-grid(v-else)
        BookCard(v-for="book in featuredBooks", :key="book.bookId", :book="book")

      .books-show-all(v-if="!loading && !error && hasMore")
        a(href="#", @click.prevent="openAllBooks")
          | Alle {{ totalCount }} Bücher anzeigen
          svg(viewBox="0 0 11 11", fill="none", stroke="currentColor", stroke-width="2")
            path(d="M2 5.5 H9 M6.5 3 L9 5.5 L6.5 8", stroke-linecap="round", stroke-linejoin="round")
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBooks } from '@/composables/useBooks'
import { useAllBooksModal } from '@/composables/useAllBooksModal'
import { sortByPriority } from '@/utils/bookSort'
import BookCard from './BookCard.vue'

const HOMEPAGE_LIMIT = 12

const { books, loading, error } = useBooks()
const { open: openAllBooks } = useAllBooksModal()

const featuredBooks = computed(() => sortByPriority(books.value).slice(0, HOMEPAGE_LIMIT))
const totalCount = computed(() => books.value.length)
const hasMore = computed(() => totalCount.value > HOMEPAGE_LIMIT)
</script>

<style scoped lang="scss">
.books-section {
  background: var(--paper);
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.books-state {
  text-align: center;
  color: var(--ink-soft);
  padding: 32px 0;
  font-size: 15px;

  &.error {
    color: var(--coral-dark);
  }
}

.books-show-all {
  text-align: center;
  margin-top: 32px;

  a {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--ink-soft);
    border-bottom: 1px solid var(--line-strong);
    padding-bottom: 2px;
    transition: color 0.15s, border-color 0.15s;

    svg {
      width: 11px;
      height: 11px;
      transition: transform 0.15s;
    }

    &:hover {
      color: var(--coral);
      border-color: var(--coral);

      svg {
        transform: translateX(3px);
      }
    }
  }
}

@media (max-width: 960px) {
  .books-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .books-grid {
    grid-template-columns: 1fr;
    max-width: 360px;
    margin: 0 auto;
  }
}
</style>
