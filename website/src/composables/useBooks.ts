import { onMounted, ref } from 'vue'
import type { BookDTO } from '@/types/book'
import { fetchBooks } from '@/api/booksApi'

export function useBooks() {
  const books = ref<BookDTO[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      books.value = await fetchBooks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }

  onMounted(load)

  return { books, loading, error, reload: load }
}
