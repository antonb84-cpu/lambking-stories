/**
 * Anonymous install id used for the admin usage dashboard (/admin/usage).
 *
 * A random UUID generated on first launch and kept in localStorage — no
 * account, no device fingerprint, nothing personal. It rides along on every
 * API request as `X-User-Uuid`, and the backend turns it into one row per
 * (user, day) so the dashboard can chart daily active users. Clearing app
 * storage (or reinstalling) yields a new id, i.e. the count is "unique
 * installs that were active", not "unique humans".
 *
 * TAURI BUILDS ONLY (Android / iOS). The web builds and the Electron desktop
 * build never mint an id and never send the header, so the dashboard counts
 * mobile app installs rather than a mix of those and drive-by web visits.
 *
 * The gate is a RUNTIME check, not a `VITE_APP_*` build flag, because the
 * flags live in `.env.tauri` — which is untracked and is NOT loaded by the
 * iOS CI workflow (it runs `tauri ios build` directly, without the
 * `dotenv -e .env.tauri` wrapper the local scripts use). A build-time flag
 * would therefore silently stop counting every TestFlight build.
 */
import { isTauri } from '@tauri-apps/api/core'
import { GAME_USER_UUID } from '@/utils/constants'

// `isTauri()` reads the `window.isTauri` marker the v2 WebView injects;
// `__TAURI_INTERNALS__` is the same signal on older 2.x runtimes, kept as a
// fallback so an APK built against an earlier Tauri still reports.
function inTauriApp(): boolean {
  try {
    return isTauri() || (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window)
  } catch {
    return false
  }
}

function randomUuid(): string {
  // Available in every WebView we ship to (Electron, Tauri Android/iOS,
  // modern browsers) but only over a secure context — hence the fallbacks.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const bytes = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  // RFC 4122 version (4) and variant (10xx) bits — the server only accepts
  // header values that match the canonical UUID shape.
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Cached for the session so we don't touch localStorage on every request.
let cached: string | null = null
// Resolved on first use rather than at module load: the WebView injects its
// marker before app code runs, but a lazy read can't lose that race.
let tracked: boolean | null = null

/**
 * The stored id, minting and persisting one on first call.
 *
 * Returns an empty string outside the Tauri app (not tracked) and when
 * storage is unavailable (private mode, storage disabled) — callers then
 * simply omit the header rather than sending a per-request id that would
 * inflate the unique-user count.
 */
export function getUserUuid(): string {
  if (tracked === null) tracked = inTauriApp()
  if (!tracked) return ''
  if (cached) return cached
  try {
    const stored = localStorage.getItem(GAME_USER_UUID)
    if (stored && UUID_PATTERN.test(stored)) {
      cached = stored
      return cached
    }
    const fresh = randomUuid()
    localStorage.setItem(GAME_USER_UUID, fresh)
    cached = fresh
    return cached
  } catch {
    return ''
  }
}

export default function useUserUuid() {
  return { getUserUuid }
}
