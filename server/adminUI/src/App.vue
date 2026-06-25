<template>
  <div class="min-h-screen app-bg text-stone-800">
    <template v-if="authState === 'loading'">
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-sm text-stone-500">Authentifizierung …</div>
      </div>
    </template>

    <template v-else-if="authState === 'denied'">
      <div class="min-h-screen flex items-center justify-center px-6">
        <div class="glass card-lg max-w-md text-center space-y-4">
          <div class="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center"
               style="background: linear-gradient(140deg, #d6eaf8 0%, #5dade2 100%);">
            <span class="text-2xl">🔒</span>
          </div>
          <h1 class="text-lg font-bold tracking-tight text-stone-900">Zugriff verweigert</h1>
          <p class="text-sm text-stone-600 leading-relaxed">
            You are not allowed to enter, contact the administrator.
          </p>
          <button class="glass primary" @click="retry">Erneut anmelden</button>
        </div>
      </div>
    </template>

    <template v-else>
      <div
        v-if="draft.restoredDraftPending"
        class="server-banner is-warn"
        role="alert"
        aria-live="assertive"
      >
        <div class="server-banner-inner">
          <strong>
            Achtung: Wir haben deine letzten, ungespeicherten Änderungen aus dem lokalen Speicher
            wiederhergestellt. Sie wurden noch NICHT zum Server geschickt — bitte speichern, bevor
            du die Seite verlässt, sonst gehen sie verloren.
          </strong>
          <button
            type="button"
            class="server-banner-action"
            @click="draft.dismissRestoredDraftBanner"
          >Okay
          </button>
        </div>
      </div>
      <div
        v-if="serverStatus.state === 'down'"
        class="server-banner is-down"
        role="alert"
        aria-live="assertive"
      >
        <div class="server-banner-inner">
          <strong>Die Webseite kann den Server nicht erreichen. Der Server ist vermutlich in Wartung.</strong>
          <span class="server-banner-warning">
            WICHTIG: Speichern ist gerade nicht möglich, weil der Server nicht reagiert. Du könntest Daten verlieren, wenn du nicht wartest.
          </span>
        </div>
      </div>
      <div
        v-else-if="serverStatus.state === 'recovering'"
        class="server-banner is-up"
        role="status"
        aria-live="polite"
      >
        <div class="server-banner-inner">
          <strong>Server is up again, continue</strong>
        </div>
      </div>

      <header class="app-header">
        <div class="app-header-inner">
          <span class="app-header-logo">
            <img src="/images/logo/logo_256x256.webp" alt="logo">
          </span>
          <div class="app-header-text">
            <h1 class="app-header-title">LambKing</h1>
            <p class="app-header-subtitle">Admin · Buchverwaltung &amp; Lokalisierung</p>
          </div>
        </div>
      </header>

      <main class="px-4 py-4 max-w-[1800px] mx-auto">
        <DashboardView />
      </main>

      <XToaster />
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DashboardView from '@/views/DashboardView.vue'
import XToaster from '@/components/atoms/XToaster.vue'
import { useServerStatusStore } from '@/stores/serverStatus'
import { useBookDraftStore } from '@/stores/bookDraft'

type AuthState = 'loading' | 'authorized' | 'denied'
const authState = ref<AuthState>('loading')
const serverStatus = useServerStatusStore()
const draft = useBookDraftStore()

async function checkAuth() {
  authState.value = 'loading'
  try {
    const res = await fetch('/api/admin/session', { credentials: 'include' })
    authState.value = res.ok ? 'authorized' : 'denied'
  } catch {
    authState.value = 'denied'
  }
}

function retry() {
  window.location.reload()
}

onMounted(checkAuth)
</script>

<style scoped>
.app-bg {
  background: radial-gradient(1200px 600px at 10% -10%, #d6eaf8 0%, transparent 60%),
  radial-gradient(1000px 500px at 100% 10%, #cde5f5 0%, transparent 60%),
  radial-gradient(900px 500px at 50% 110%, #e4f1fb 0%, transparent 55%),
  linear-gradient(135deg, #eaf3fb 0%, #d8e8f5 100%);
}

.server-banner {
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  padding: 10px 18px;
  text-align: center;
  font-size: 13px;
  letter-spacing: 0.01em;
  box-shadow: 0 6px 18px -10px rgba(0, 0, 0, 0.45);
}

.server-banner.is-down {
  background: linear-gradient(135deg, #b91c1c 0%, #dc2626 60%, #ef4444 100%);
  color: #fff7f7;
  border-bottom: 1px solid rgba(255, 255, 255, 0.25);
}

.server-banner.is-up {
  background: linear-gradient(135deg, #15803d 0%, #16a34a 60%, #22c55e 100%);
  color: #f0fdf4;
  border-bottom: 1px solid rgba(255, 255, 255, 0.25);
}

.server-banner.is-warn {
  background: linear-gradient(135deg, #b45309 0%, #d97706 55%, #f59e0b 100%);
  color: #fff8eb;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.server-banner-action {
  align-self: center;
  margin-top: 4px;
  padding: 6px 18px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.04em;
  border: 1px solid rgba(255, 255, 255, 0.45);
  cursor: pointer;
  transition: background 140ms ease, transform 80ms ease;
}

.server-banner-action:hover {
  background: rgba(0, 0, 0, 0.4);
}

.server-banner-action:active {
  transform: scale(0.97);
}

.server-banner-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.server-banner-warning {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: rgba(0, 0, 0, 0.18);
  padding: 4px 10px;
  border-radius: 8px;
}

.app-header {
  padding: 18px 24px;
  background: linear-gradient(135deg, rgba(36, 113, 163, 0.96) 0%, rgba(52, 152, 219, 0.92) 60%, rgba(93, 173, 226, 0.9) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 10px 28px -18px rgba(20, 60, 100, 0.45),
  0 1px 0 rgba(255, 255, 255, 0.25) inset;
}

.app-header-inner {
  max-width: 1800px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
}

.app-header-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 18px;
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.95) 0%, rgba(214, 234, 248, 0.85) 100%);
  box-shadow: 0 10px 22px -8px rgba(20, 60, 100, 0.35),
  0 0 0 1px rgba(255, 255, 255, 0.45) inset;
  flex-shrink: 0;
}

.app-header-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.app-header-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: #ffffff;
  line-height: 1.1;
  text-shadow: 0 1px 0 rgba(20, 60, 100, 0.25);
}

.app-header-subtitle {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.82);
  text-transform: uppercase;
}
</style>
