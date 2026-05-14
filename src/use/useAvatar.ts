/**
 * Tiny shared store for the user's profile picture. Until the full set
 * of avatar artworks ships, slot 0 falls back to the shared default
 * (`/images/icons/avatar.webp`) and the remaining slots resolve to that
 * same default via `onAvatarFallback` whenever their dedicated asset is
 * missing on disk. Selecting one persists its index in localStorage and
 * exposes a reactive `avatarSrc` everywhere the profile picture is
 * rendered (ProfileView header, AppMainView header).
 */
import { computed, ref } from 'vue'

const LS_AVATAR = 'kanaan.avatarIndex'

// Canonical fallback image. Lives in /public so Vite serves it
// verbatim; used both as a real avatar option (slot 0) and as the
// `@error` recovery target for the rest of the picker.
export const DEFAULT_AVATAR_IMAGE = '/images/icons/avatar.webp'

// Avatar picker slot paths. Slot 0 is the shipped default; the rest
// reference per-illustration assets that may or may not exist yet. Any
// 404 routes through `onAvatarFallback` and re-points at the default
// so the picker never renders a broken image.
const AVATAR_SOURCES: string[] = [
  DEFAULT_AVATAR_IMAGE,
  '/images/avatars/avatar-1.webp',
  '/images/avatars/avatar-2.webp',
  '/images/avatars/avatar-3.webp',
  '/images/avatars/avatar-4.webp',
  '/images/avatars/avatar-5.webp'
]

function readIndex(): number {
  try {
    const raw = localStorage.getItem(LS_AVATAR)
    if (!raw) return 0
    const n = JSON.parse(raw)
    return Number.isFinite(n) && n >= 0 && n < AVATAR_SOURCES.length ? n : 0
  } catch {
    return 0
  }
}

const avatarIndex = ref<number>(readIndex())

// `@error` handler for avatar img tags. Idempotent: if we're already on
// the default avatar, do nothing so we never loop.
export function onAvatarFallback(event: Event): void {
  const el = event.target as HTMLImageElement | null
  if (!el) return
  if (el.src.endsWith(DEFAULT_AVATAR_IMAGE)) return
  el.src = DEFAULT_AVATAR_IMAGE
}

export default function useAvatar() {
  const avatarSrc = computed(() => AVATAR_SOURCES[avatarIndex.value] || DEFAULT_AVATAR_IMAGE)

  const avatarOptions = computed(() =>
    AVATAR_SOURCES.map((src, i) => ({ index: i, src }))
  )

  function setAvatarIndex(i: number) {
    if (i < 0 || i >= AVATAR_SOURCES.length) return
    avatarIndex.value = i
    try {
      localStorage.setItem(LS_AVATAR, JSON.stringify(i))
    } catch { /* quota / disabled */
    }
  }

  return {
    avatarIndex,
    avatarSrc,
    avatarOptions,
    setAvatarIndex
  }
}
