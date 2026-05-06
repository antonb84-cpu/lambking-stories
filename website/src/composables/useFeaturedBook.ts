import { computed } from 'vue'
import type { BookDTO } from '@/types/book'
import { useBooks } from './useBooks'

function buyUrlOf(book: BookDTO): string {
  const link = book.etsyLink
  return link?.de?.trim() || link?.en?.trim() || ''
}

// Pick the most recently created book. Books without `createdAt`
// (legacy rows) fall to the end of the sort, so they're only chosen
// if no timestamped book is present.
function latestByCreatedAt(list: BookDTO[]): BookDTO | null {
  if (list.length === 0) return null
  return [...list].sort((a, b) => {
    const aTs = a.createdAt ? Date.parse(a.createdAt) : 0
    const bTs = b.createdAt ? Date.parse(b.createdAt) : 0
    return bTs - aTs
  })[0]
}

export function useFeaturedBook() {
  const { books, loading, error } = useBooks()

  const available = computed(() => books.value.filter((b) => buyUrlOf(b)))
  // Featured = newest book (by createdAt) that has a buy link, falling
  // back to the newest book overall if none have a link yet.
  const featured = computed<BookDTO | null>(
    () => latestByCreatedAt(available.value) ?? latestByCreatedAt(books.value)
  )
  const others = computed(() =>
    featured.value
      ? books.value.filter((b) => b.bookId !== featured.value!.bookId)
      : []
  )

  return { books, loading, error, featured, others, buyUrlOf }
}
