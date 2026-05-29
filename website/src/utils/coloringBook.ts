// "Coloring books" (Ausmalbücher) carry this category. They are excluded from
// the public website entirely. Detection mirrors the app/adminUI helper.
export const COLORING_CATEGORY = 'Ausmahlbücher'

// Normalize to NFC so a decomposed "ü" (u + U+0308) matches the pre-composed
// form (U+00FC) — see the app-side helper for the full rationale.
const COLORING_CATEGORY_ALIASES = new Set(
  ['Ausmahlbücher', 'Ausmalbücher'].map((s) => s.normalize('NFC').toLowerCase())
)

export function isColoringCategory(category?: string | null): boolean {
  if (!category) return false
  return COLORING_CATEGORY_ALIASES.has(category.normalize('NFC').trim().toLowerCase())
}
