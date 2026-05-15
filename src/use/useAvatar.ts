/**
 * Tiny shared store for the user's profile picture. Slot 0 is the
 * default avatar (`avatar-1.webp`); slots 1–9 are the remaining
 * illustrated choices; the trailing `avatar-empty.webp` slot lets the
 * user opt out of a portrait. Selecting one persists its index in
 * localStorage and exposes a reactive `avatarSrc` everywhere the
 * profile picture is rendered (ProfileView header, AppMainView header).
 */
import { computed, ref } from 'vue'
import { prependBaseUrl } from '@/utils/function'

const LS_AVATAR = 'kanaan.avatarIndex'

// Canonical fallback. Slot 0 is the default avatar (`avatar-1.webp`);
// any broken `<img>` re-points here via `onAvatarFallback`.
export const DEFAULT_AVATAR_IMAGE = prependBaseUrl('images/avatars/avatar-1.webp')

// Avatar picker slot paths. Slot 0 is the default; the trailing slot is
// the explicit "no avatar" option. Routed through `prependBaseUrl` so
// production GH-Pages builds resolve under the deploy subpath.
const AVATAR_SOURCES: string[] = [
  DEFAULT_AVATAR_IMAGE,
  prependBaseUrl('images/avatars/avatar-2.webp'),
  prependBaseUrl('images/avatars/avatar-3.webp'),
  prependBaseUrl('images/avatars/avatar-4.webp'),
  prependBaseUrl('images/avatars/avatar-5.webp'),
  prependBaseUrl('images/avatars/avatar-6.webp'),
  prependBaseUrl('images/avatars/avatar-7.webp'),
  prependBaseUrl('images/avatars/avatar-8.webp'),
  prependBaseUrl('images/avatars/avatar-9.webp'),
  prependBaseUrl('images/avatars/avatar-10.webp'),
  prependBaseUrl('images/avatars/avatar-empty.webp')
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
