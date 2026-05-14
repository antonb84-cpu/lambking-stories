/**
 * Runtime feature flag that lets the app point at the local backend
 * (`pnpm dev` in /server, default `http://localhost:4000`) instead of
 * the production Render deployment. Selection persists in localStorage
 * so it survives reloads; toggling it triggers a full reload so the
 * book IndexedDB cache is re-hydrated from the new origin.
 *
 * Values (set at build time in `.env`):
 *   - `VITE_API_BASE_URL`         remote (default: Render)
 *   - `VITE_API_BASE_URL_LOCAL`   local dev server (default: :4000)
 */
import { computed, ref } from 'vue'

const LS_KEY = 'kanaan.useLocalBackend'

const REMOTE_BASE = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined)
  ?? 'https://lbs-be.onrender.com'
).replace(/\/+$/, '')

const LOCAL_BASE = (
  (import.meta.env.VITE_API_BASE_URL_LOCAL as string | undefined)
  ?? 'http://localhost:4000'
).replace(/\/+$/, '')

function readFlag(): boolean {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return false
    return JSON.parse(raw) === true
  } catch {
    return false
  }
}

const useLocalBackend = ref<boolean>(readFlag())

function persist() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(useLocalBackend.value))
  } catch { /* quota / disabled */
  }
}

/**
 * Snapshot reader for non-reactive consumers (fetch calls in
 * `booksApi.ts`). Always reads the live ref so a toggle made after the
 * module loaded still routes the next request correctly.
 */
export function getApiBase(): string {
  return useLocalBackend.value ? LOCAL_BASE : REMOTE_BASE
}

export default function useApiConfig() {
  const apiBase = computed(() => (useLocalBackend.value ? LOCAL_BASE : REMOTE_BASE))

  function setUseLocalBackend(v: boolean, opts: { reload?: boolean } = {}) {
    if (useLocalBackend.value === v) return
    useLocalBackend.value = v
    persist()
    if (opts.reload !== false && typeof window !== 'undefined') {
      // Hard reload so the IndexedDB book cache re-fetches against the
      // newly selected backend. Without this, a book cached from the
      // remote server would still render even after switching to local.
      window.location.reload()
    }
  }

  function toggleBackend() {
    setUseLocalBackend(!useLocalBackend.value)
  }

  return {
    useLocalBackend,
    apiBase,
    remoteBase: REMOTE_BASE,
    localBase: LOCAL_BASE,
    setUseLocalBackend,
    toggleBackend
  }
}
