<template lang="pug">
  Teleport(to="body")
    transition(name="all-books-fade")
      div.all-books-overlay(
        v-if="isOpen"
        role="dialog"
        aria-modal="true"
        aria-labelledby="all-books-title"
        @click.self="close"
      )
        div.all-books-modal(role="document")
          header.all-books-head
            h2#all-books-title Alle Bücher
            button.all-books-close(type="button", aria-label="Schließen", @click="close")
              svg(viewBox="0 0 24 24", fill="none", stroke="currentColor", stroke-width="2", stroke-linecap="round", stroke-linejoin="round")
                line(x1="18", y1="6", x2="6", y2="18")
                line(x1="6", y1="6", x2="18", y2="18")
          div.all-books-body
            .all-books-state(v-if="loading") Bücher werden geladen …
            .all-books-state.error(v-else-if="error") Bücher konnten nicht geladen werden: {{ error }}
            .all-books-grid(v-else-if="sortedBooks.length > 0")
              BookCardCompact(
                v-for="book in sortedBooks"
                :key="book.bookId"
                :book="book"
              )
            .all-books-state(v-else) Noch keine Bücher verfügbar.
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useBooks } from '@/composables/useBooks'
import { useAllBooksModal } from '@/composables/useAllBooksModal'
import { sortByReleaseDate } from '@/utils/bookSort'
import BookCardCompact from './BookCardCompact.vue'

const { isOpen, close } = useAllBooksModal()
const { books, loading, error } = useBooks()

const sortedBooks = computed(() => sortByReleaseDate(books.value))

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) close()
}

// Deep-link support: `?all-books=1` (or any value) opens the modal on
// first paint so the URL is shareable.
const QUERY_KEY = 'all-books'

function openFromUrlIfRequested() {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  if (params.has(QUERY_KEY)) isOpen.value = true
}

function clearUrlParam() {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (!url.searchParams.has(QUERY_KEY)) return
  url.searchParams.delete(QUERY_KEY)
  window.history.replaceState(window.history.state, '', url.toString())
}

watch(isOpen, (open) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = open ? 'hidden' : ''
  if (!open) clearUrlParam()
})

function onPopState() {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  isOpen.value = params.has(QUERY_KEY)
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  window.addEventListener('popstate', onPopState)
  openFromUrlIfRequested()
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('popstate', onPopState)
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})
</script>

<style scoped lang="scss">
.all-books-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(20, 16, 12, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  backdrop-filter: blur(2px);
}

.all-books-modal {
  width: min(100%, 1180px);
  max-height: min(90vh, 1000px);
  background: var(--paper, #fff);
  color: var(--ink, #1c1611);
  border-radius: 14px;
  box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.all-books-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 28px;
  border-bottom: 1px solid var(--line, rgba(0, 0, 0, 0.08));
  background: var(--cream, #faf4ea);

  h2 {
    font-family: 'Nunito', serif;
    font-size: 22px;
    font-weight: 500;
    letter-spacing: -0.01em;
    margin: 0;
  }
}

.all-books-close {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: var(--ink-soft, rgba(0, 0, 0, 0.6));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    color: var(--ink, #1c1611);
  }
}

.all-books-body {
  padding: 24px 28px 32px;
  overflow-y: auto;
  background: var(--paper);
}

.all-books-state {
  text-align: center;
  color: var(--ink-soft);
  padding: 32px 0;
  font-size: 15px;

  &.error {
    color: var(--coral-dark);
  }
}

.all-books-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1080px) {
  .all-books-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 760px) {
  .all-books-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .all-books-grid {
    grid-template-columns: 1fr;
    max-width: 280px;
    margin: 0 auto;
  }
}

.all-books-fade-enter-active,
.all-books-fade-leave-active {
  transition: opacity 0.2s ease;

  .all-books-modal {
    transition: transform 0.2s ease;
  }
}

.all-books-fade-enter-from,
.all-books-fade-leave-to {
  opacity: 0;

  .all-books-modal {
    transform: translateY(8px);
  }
}

@media (max-width: 540px) {
  .all-books-overlay {
    padding: 0;
  }
  .all-books-modal {
    border-radius: 0;
    max-height: 100vh;
    height: 100vh;
    width: 100%;
  }
  .all-books-head {
    padding: 16px 20px;

    h2 {
      font-size: 19px;
    }
  }
  .all-books-body {
    padding: 20px 20px 28px;
  }
}
</style>
