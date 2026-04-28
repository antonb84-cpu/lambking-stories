import { computed } from 'vue'
import type { BookDTO } from '@/types/book'
import { useBooks } from './useBooks'

function buyUrlOf(book: BookDTO): string {
  const link = book.etsyLink
  return link?.de?.trim() || link?.en?.trim() || ''
}

export function useFeaturedBook() {
  const { books, loading, error } = useBooks()

  const available = computed(() => books.value.filter((b) => buyUrlOf(b)))
  const featured = computed<BookDTO | null>(() => available.value[0] ?? books.value[0] ?? null)
  const others = computed(() =>
    featured.value
      ? books.value.filter((b) => b.bookId !== featured.value!.bookId)
      : []
  )

  return { books, loading, error, featured, others, buyUrlOf }
}
