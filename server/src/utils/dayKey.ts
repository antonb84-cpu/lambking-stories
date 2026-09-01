/**
 * Calendar-day helpers for the usage dashboard.
 *
 * Activity is bucketed by *local* calendar day (see `USAGE_TIMEZONE`), not
 * by UTC day: the admin reading the chart thinks in Berlin days, and a
 * bucket boundary at 02:00 local time would split an evening reading
 * session across two bars. The bucket label is a plain `YYYY-MM-DD` string
 * so it can be compared, sorted and range-matched lexicographically in
 * Mongo without any date math server-side.
 */

/** `YYYY-MM-DD` in the given IANA timezone. `en-CA` formats exactly that way. */
export function dayKey(date: Date = new Date(), timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date)
  } catch {
    // Unknown timezone id → fall back to UTC rather than throwing on every
    // tracked request.
    return date.toISOString().slice(0, 10)
  }
}

/**
 * Shift a `YYYY-MM-DD` label by whole days. The labels are timezone-agnostic
 * strings, so the arithmetic runs in UTC where every day is exactly 24h —
 * a DST-shifted local day would otherwise land on the wrong date twice a year.
 */
export function addDays(day: string, delta: number): string {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number]
  const ms = Date.UTC(y, m - 1, d) + delta * 86_400_000
  return new Date(ms).toISOString().slice(0, 10)
}

/** Inclusive list of day labels from `from` to `to`. */
export function dayRange(from: string, to: string): string[] {
  const days: string[] = []
  // Guard against a reversed / malformed range producing an endless loop.
  for (let day = from, i = 0; day <= to && i < 4000; day = addDays(day, 1), i++) {
    days.push(day)
  }
  return days
}
