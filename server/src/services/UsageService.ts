import { UserActivity } from '../models/UserActivity.js'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'
import { addDays, dayKey, dayRange } from '../utils/dayKey.js'

export type UsageRange = '7' | '30' | '90' | '365' | 'all'

export interface DailyUsagePoint {
  day: string
  users: number
}

export interface UsageReport {
  range: UsageRange
  timezone: string
  from: string
  to: string
  days: DailyUsagePoint[]
  totals: {
    activeToday: number
    uniqueInRange: number
    uniqueAllTime: number
    averagePerDay: number
    peak: DailyUsagePoint | null
    firstDay: string | null
  }
}

const RANGE_DAYS: Record<Exclude<UsageRange, 'all'>, number> = {
  '7': 7,
  '30': 30,
  '90': 90,
  '365': 365
}

/**
 * Per-process "already recorded today" set. The tracking middleware runs on
 * every API request, but a user only needs ONE row per day — without this we
 * would fire an upsert per book fetch, per image, per app resume. The set is
 * keyed by uuid and dropped wholesale when the calendar day rolls over, so it
 * stays roughly DAU-sized. A restart (or a second instance) just costs one
 * redundant upsert per user, which the unique index absorbs.
 */
let seenDay = ''
const seenUuids = new Set<string>()
// Hard ceiling so a flood of forged uuids can't grow the set without bound.
const SEEN_CAP = 100_000

function markSeen(day: string, userUuid: string): boolean {
  if (day !== seenDay) {
    seenDay = day
    seenUuids.clear()
  }
  if (seenUuids.has(userUuid)) return false
  if (seenUuids.size >= SEEN_CAP) seenUuids.clear()
  seenUuids.add(userUuid)
  return true
}

async function countUnique(from?: string): Promise<number> {
  const match = from ? [{ $match: { day: { $gte: from } } }] : []
  const rows = await UserActivity.aggregate<{ users: number }>([
    ...match,
    { $group: { _id: '$userUuid' } },
    { $count: 'users' }
  ]).exec()
  return rows[0]?.users ?? 0
}

export const UsageService = {
  today(): string {
    return dayKey(new Date(), env.USAGE_TIMEZONE)
  },

  /**
   * Record that `userUuid` was active today. Idempotent per (uuid, day):
   * the first call of the day inserts, every later one is a no-op — first
   * in-process (the `seen` set), then in Mongo (`$setOnInsert` + the unique
   * index) for the multi-instance case.
   */
  async recordActivity(userUuid: string, client = ''): Promise<void> {
    const day = this.today()
    if (!markSeen(day, userUuid)) return
    try {
      await UserActivity.updateOne(
        { day, userUuid },
        { $setOnInsert: { day, userUuid, client } },
        { upsert: true }
      ).exec()
    } catch (err) {
      // A concurrent upsert on the same (day, uuid) loses the unique-index
      // race — the row exists either way, which is all we wanted. Anything
      // else is logged and swallowed: usage tracking must never break a
      // user-facing request.
      const code = (err as { code?: number }).code
      if (code !== 11000) {
        // Drop the memo so the next request retries instead of silently
        // skipping this user for the rest of the day.
        seenUuids.delete(userUuid)
        logger.warn('usage tracking upsert failed', { err: (err as Error).message })
      }
    }
  },

  /** Earliest recorded day, or null when nothing has been tracked yet. */
  async firstDay(): Promise<string | null> {
    const doc = await UserActivity.findOne({}, { day: 1 }).sort({ day: 1 }).lean().exec()
    return doc?.day ?? null
  },

  /**
   * Zero-filled daily-active-user series plus headline totals.
   *
   * Days are grouped by (day, uuid) before counting so a duplicate row —
   * possible if the unique index was never built on an older deployment —
   * can't inflate a day's number.
   */
  async report(range: UsageRange): Promise<UsageReport> {
    const to = this.today()
    const first = await this.firstDay()
    const from =
      range === 'all'
        ? (first && first < to ? first : to)
        : addDays(to, -(RANGE_DAYS[range] - 1))

    const [rows, uniqueInRange, uniqueAllTime] = await Promise.all([
      UserActivity.aggregate<{ _id: string; users: number }>([
        { $match: { day: { $gte: from, $lte: to } } },
        { $group: { _id: { day: '$day', userUuid: '$userUuid' } } },
        { $group: { _id: '$_id.day', users: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]).exec(),
      countUnique(from),
      countUnique()
    ])

    const byDay = new Map(rows.map((r) => [r._id, r.users]))
    const days: DailyUsagePoint[] = dayRange(from, to).map((day) => ({
      day,
      users: byDay.get(day) ?? 0
    }))

    const peak = days.reduce<DailyUsagePoint | null>(
      (best, d) => (d.users > 0 && (!best || d.users > best.users) ? d : best),
      null
    )
    const sum = days.reduce((acc, d) => acc + d.users, 0)

    return {
      range,
      timezone: env.USAGE_TIMEZONE,
      from,
      to,
      days,
      totals: {
        activeToday: byDay.get(to) ?? 0,
        uniqueInRange,
        uniqueAllTime,
        averagePerDay: days.length ? Math.round((sum / days.length) * 10) / 10 : 0,
        peak,
        firstDay: first
      }
    }
  },

  /**
   * Build the (day, userUuid) unique index explicitly.
   *
   * `connectDatabase` disables mongoose autoIndex in production, so without
   * this the collection would run index-less in the only environment where
   * the write volume matters.
   */
  async ensureIndexes(): Promise<void> {
    try {
      await UserActivity.createIndexes()
    } catch (err) {
      logger.warn('failed to create UserActivity indexes', { err: (err as Error).message })
    }
  },

  /** Test seam — drops the in-process dedupe memo. */
  resetMemo(): void {
    seenDay = ''
    seenUuids.clear()
  }
}
