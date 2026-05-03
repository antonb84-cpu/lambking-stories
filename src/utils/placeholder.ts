export const PLACEHOLDER_IMAGE = '/images/placeholder.webp'

// Returns the first non-empty candidate or the placeholder. Used wherever
// a book preview/cover URL may be missing (legacy data, optimistic UI,
// or while the API response hasn't returned yet).
export function withPlaceholder(...candidates: Array<string | undefined | null>): string {
  for (const c of candidates) if (c) return c
  return PLACEHOLDER_IMAGE
}

// `@error` handler — falls back to the placeholder if the network/decoder
// fails on the real image. Idempotent: if already pointing at the
// placeholder, do nothing so we don't loop.
export function onImgFallback(event: Event): void {
  const el = event.target as HTMLImageElement | null
  if (!el) return
  if (el.src.endsWith(PLACEHOLDER_IMAGE)) return
  el.src = PLACEHOLDER_IMAGE
}
