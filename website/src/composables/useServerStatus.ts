import { ref } from 'vue'
import { runtime } from '@/config/runtime'

export type ServerState = 'ok' | 'down' | 'recovering'

const POLL_INTERVAL_MS = 5000
const RECOVERY_BANNER_MS = 5000

// Module-level singleton state — every component that calls
// `useServerStatus()` shares the same banner + retry queue. The website
// doesn't use Pinia, so this is the lightest equivalent.
const state = ref<ServerState>('ok')
const retryQueue: Array<() => Promise<void>> = []
let pollTimer: ReturnType<typeof setInterval> | null = null
let recoveryTimer: ReturnType<typeof setTimeout> | null = null

function healthzUrl(): string {
  const base = (runtime.apiBaseUrl ?? '').replace(/\/+$/, '')
  return `${base}/healthz`
}

function startPolling() {
  if (pollTimer) return
  void checkHealth()
  pollTimer = setInterval(checkHealth, POLL_INTERVAL_MS)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

async function checkHealth() {
  try {
    const res = await fetch(healthzUrl(), { cache: 'no-store' })
    if (!res.ok) return
  } catch {
    return /* still down — try again next tick */
  }
  stopPolling()
  await drainRetries()
  markRecovering()
}

async function drainRetries() {
  while (retryQueue.length) {
    const fn = retryQueue.shift()
    if (!fn) break
    try {
      await fn()
    } catch {
      /* propagated to the caller's promise inside fn */
    }
  }
}

function markRecovering() {
  state.value = 'recovering'
  recoveryTimer = setTimeout(() => {
    state.value = 'ok'
    recoveryTimer = null
  }, RECOVERY_BANNER_MS)
}

export function markServerDown() {
  if (recoveryTimer) {
    clearTimeout(recoveryTimer)
    recoveryTimer = null
  }
  if (state.value === 'down') return
  state.value = 'down'
  startPolling()
}

export function enqueueServerRetry(fn: () => Promise<void>) {
  retryQueue.push(fn)
}

export function useServerStatus() {
  return { state, markServerDown, enqueueServerRetry }
}
