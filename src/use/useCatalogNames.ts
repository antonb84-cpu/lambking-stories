/**
 * Localized display names for catalogue metadata.
 *
 * The API stores a single German string for series (`ApiSeries.name`),
 * categories (`ApiCategory.name`, which doubles as the category's id and its
 * route param) and book badges (`ApiBook.badges`) — there is no per-locale
 * field on any of them. The English names therefore live in i18n under
 * `app.catalog.*` as an overlay keyed by the stable identifier: `seriesId`
 * for a series, a slug of the German string for a category or badge.
 *
 * Anything without a key — a series, category or badge added in the AdminUI
 * after this file was written — falls through to the raw API string, so new
 * catalogue entries keep rendering (in German) instead of showing a bare
 * key. Adding a translation is then a one-line change in `i18n/app.ts`.
 */
import { useI18n } from 'vue-i18n'
import useApiSeries from '@/use/useApiSeries'
import type { ApiBook } from '@/types/apiBook'

/** Matches the open-ended age badge ("ab 7 Jahren", "ab 10 Jahren", …). */
const AGE_BADGE_RE = /^ab\s+(\d+)\s+jahren$/i

/**
 * German string → i18n key segment. Umlauts are expanded rather than
 * dropped so "Ausmalbücher" can't collide with an "Ausmalbucher" typo, and
 * every remaining non-alphanumeric run collapses to a single hyphen.
 */
export function catalogKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function useCatalogNames() {
  const { t } = useI18n({ useScope: 'global' })
  const apiSeries = useApiSeries()

  // `missingWarn` is off globally and vue-i18n answers a miss by echoing the
  // key back — that echo is what tells us to keep the server's German name.
  function translated(key: string, fallback: string): string {
    const out = t(key)
    return !out || out === key ? fallback : out
  }

  /**
   * Display name for a series id. `fallback` should be the API's German
   * name, used whenever no override exists for that id.
   */
  function seriesName(seriesId: string, fallback = ''): string {
    if (!seriesId) return fallback
    return translated(`app.catalog.series.${seriesId}`, fallback)
  }

  /**
   * Display name for a book's series, resolved through the live series list.
   * Callers must have kicked off `useApiSeries().loadAll()` — touching
   * `state.all` here keeps their computed subscribed to its arrival.
   */
  function seriesNameOfBook(book: ApiBook | null | undefined, fallback = ''): string {
    const seriesId = book?.bookSeriesId ?? ''
    if (!seriesId) return fallback
    void apiSeries.state.all
    return seriesName(seriesId, apiSeries.getById(seriesId)?.name || fallback)
  }

  /** Display name for a category — the German name doubles as its id. */
  function categoryName(name: string): string {
    if (!name) return ''
    return translated(`app.catalog.category.${catalogKey(name)}`, name)
  }

  /**
   * Display label for one of a book's badges. Age badges are matched as a
   * pattern rather than enumerated — the editor can add "ab 8 Jahren" any
   * day, and an untranslated age reads plainly wrong in English. Everything
   * else (topic chips, reading durations) goes through the key table; a
   * duration that falls through ("12min") is already language-neutral.
   */
  function badgeLabel(badge: string): string {
    const raw = badge.trim()
    if (!raw) return ''
    const age = AGE_BADGE_RE.exec(raw)
    if (age) return t('app.catalog.badgeAge', { n: age[1] })
    return translated(`app.catalog.badge.${catalogKey(raw)}`, raw)
  }

  return { seriesName, seriesNameOfBook, categoryName, badgeLabel }
}
