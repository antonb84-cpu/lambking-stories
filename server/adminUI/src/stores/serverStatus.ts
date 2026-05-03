import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ServerState = 'ok' | 'down' | 'recovering'

const HEALTHZ_PATH = '/healthz'
const POLL_INTERVAL_MS = 5000
const RECOVERY_BANNER_MS = 5000

export const useServerStatusStore = defineStore('serverStatus', () => {
  const state = ref<ServerState>('ok')
  const retryQueue: Array<() => Promise<void>> = []
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let recoveryTimer: ReturnType<typeof setTimeout> | null = null

  // Switch into the offline banner state. Cancels any pending recovery
  // hide-timer because we want the red banner to stick — losing state.value
  // back to 'ok' from a stale recovery timer would mask a fresh outage.
  function markDown() {
    if (recoveryTimer) {
      clearTimeout(recoveryTimer)
      recoveryTimer = null
    }
    if (state.value === 'down') return
    state.value = 'down'
    startPolling()
  }

  function startPolling() {
    if (pollTimer) return
    // Fire one check immediately so the user doesn't sit through the first
    // 5s tick when the server may already have come back.
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
      const res = await fetch(HEALTHZ_PATH, { credentials: 'include', cache: 'no-store' })
      if (!res.ok) return
    } catch {
      return /* still down — try again next tick */
    }
    stopPolling()
    await drainRetries()
    markRecovering()
  }

  async function drainRetries() {
    // Each retry is a fire-and-forget closure that resolves the original
    // caller's promise. We swallow throws so a single bad retry doesn't
    // strand the rest of the queue.
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

  function enqueueRetry(fn: () => Promise<void>) {
    retryQueue.push(fn)
  }

  return { state, markDown, enqueueRetry }
})
