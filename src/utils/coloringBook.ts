// "Coloring books" (Ausmalbücher) carry this category. Each of their pages is
// a single image meant to be opened in the coloring app: they render
// full-bleed in the reader, are hidden from the public website, and have no
// audio. Detection is by the book's `category` string set in the AdminUI.
export const COLORING_CATEGORY = 'Ausmahlbücher'

// Accept the user's spelling ("Ausmahlbücher") and the orthographically
// correct one ("Ausmalbücher"), case-insensitively, so a small editing slip
// in the AdminUI category name doesn't silently turn a coloring book back
// into a normal one. Normalize to NFC because the "ü" can be stored either
// pre-composed (U+00FC) or decomposed (u + U+0308) depending on the keyboard
// / OS that typed it — without this the two forms compare unequal.
const COLORING_CATEGORY_ALIASES = new Set(
  ['Ausmahlbücher', 'Ausmalbücher'].map((s) => s.normalize('NFC').toLowerCase())
)

export function isColoringCategory(category?: string | null): boolean {
  if (!category) return false
  return COLORING_CATEGORY_ALIASES.has(category.normalize('NFC').trim().toLowerCase())
}
