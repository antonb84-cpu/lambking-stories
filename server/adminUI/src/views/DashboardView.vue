<template>
  <div class="dashboard-grid">
    <div class="flex flex-col gap-y-0.5 min-w-0">
      <BookBrowser :books="books" :selected="draft.book.bookId" @select="onSelect" />

      <section class="form-panel">
        <header class="panel-header">
          <div>
            <h2 class="panel-title">Taxonomien</h2>
            <p class="panel-subtitle">Buchreihen &amp; Kategorien verwalten.</p>
          </div>
        </header>
        <div class="taxonomy-split">
          <SeriesManager />
          <div class="taxonomy-divider" />
          <CategoryManager />
        </div>
      </section>

      <BookForm @saved="onSaved" />
    </div>

    <aside class="preview-aside hidden xl:block">
      <div class="preview-stack">
        <div class="preview-head">
          <span class="preview-tag">Vorschau</span>
          <span class="preview-count">{{ previewPages.length }} Seiten</span>
        </div>
        <IPhonePreview
          :pages="previewPages"
          :cover-image="previewCoverImage"
          :achievement-badge="previewAchievementBadge"
        />
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BookBrowser from '@/components/organisms/BookBrowser.vue'
import BookForm from '@/components/organisms/BookForm.vue'
import SeriesManager from '@/components/organisms/SeriesManager.vue'
import CategoryManager from '@/components/organisms/CategoryManager.vue'
import IPhonePreview from '@/components/organisms/IPhonePreview.vue'
import { useSeriesStore } from '@/stores/series'
import { useCategoryStore } from '@/stores/categories'
import { useBookDraftStore } from '@/stores/bookDraft'
import { useToastStore } from '@/stores/toast'
import { booksApi } from '@/api/books'
import type { BookDTO } from '@/types'

const series = useSeriesStore()
const categories = useCategoryStore()
const draft = useBookDraftStore()
const toast = useToastStore()
const books = ref<BookDTO[]>([])

const previewPages = computed(() => draft.activeLocalization.content)
const previewCoverImage = computed(
  () => draft.book.contentCoverImage?.[draft.activeLocale] || draft.book.coverImage
)
const previewAchievementBadge = computed(() => {
  const ab = draft.book.achievementBadge
  if (!ab) return ''
  return ab[draft.activeLocale] || ab.de || ab.en || ''
})

onMounted(async () => {
  try {
    await Promise.all([series.load(), categories.load(), refreshBooks()])
  } catch (err) {
    toast.error((err as Error).message, 'Laden fehlgeschlagen')
  }
})

async function refreshBooks() {
  try {
    books.value = await booksApi.list()
  } catch {
    books.value = []
  }
}

async function onSelect(bookId: string) {
  if (!bookId) {
    draft.reset()
    return
  }
  const b = books.value.find((x) => x.bookId === bookId)
  if (b) draft.load(b)
}

async function onSaved(saved: BookDTO) {
  const idx = books.value.findIndex((x) => x.bookId === saved.bookId)
  if (idx >= 0) books.value.splice(idx, 1, saved)
  else books.value = [...books.value, saved]
  refreshBooks()
}
</script>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
}

@media (min-width: 1280px) {
  .dashboard-grid {
    grid-template-columns: minmax(0, 1fr) 360px;
  }
}

.preview-aside {
  position: relative;
}

.preview-stack {
  position: sticky;
  top: 96px; /* clears sticky header (~72px) + breathing room */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  max-height: calc(100vh - 112px);
}

.preview-head {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(52, 152, 219, 0.25);
  box-shadow: 0 6px 16px -8px rgba(41, 128, 185, 0.3);
}

.preview-tag {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #2471a3;
}

.preview-count {
  font-size: 10.5px;
  color: #5d6d7e;
}

.taxonomy-split {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}

@media (min-width: 820px) {
  .taxonomy-split {
    grid-template-columns: 1fr 1px 1fr;
    gap: 22px;
  }
}
</style>
