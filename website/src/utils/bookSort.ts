import type { BookDTO } from '@/types/book'

export function buyUrlOf(book: BookDTO): string {
  const link = book.etsyLink
  return link?.de?.trim() || link?.en?.trim() || ''
}

export function hasSalesLink(book: BookDTO): boolean {
  return Boolean(buyUrlOf(book))
}

function releaseTs(book: BookDTO): number {
  return book.releaseDate ? Date.parse(book.releaseDate) : 0
}

// Homepage priority: books with a sales link come first (a buyable
// book is more valuable to surface than an "app-only" one), and within
// each group the newest release wins. Items missing a `releaseDate`
// (legacy rows) fall to the bottom of their group with timestamp 0.
export function sortByPriority(books: BookDTO[]): BookDTO[] {
  return [...books].sort((a, b) => {
    const linkDiff = (hasSalesLink(b) ? 1 : 0) - (hasSalesLink(a) ? 1 : 0)
    if (linkDiff !== 0) return linkDiff
    return releaseTs(b) - releaseTs(a)
  })
}

// "All books" modal: just newest release first, no sales-link bias —
// the modal exists precisely to surface everything, including app-only
// titles, in chronological order.
export function sortByReleaseDate(books: BookDTO[]): BookDTO[] {
  return [...books].sort((a, b) => releaseTs(b) - releaseTs(a))
}
