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
        BookCard(v-for="book in books", :key="book.bookId", :book="book")
</template>

<script setup lang="ts">
import { useBooks } from '@/composables/useBooks'
import BookCard from './BookCard.vue'

const { books, loading, error } = useBooks()
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
