<template lang="pug">
  Teleport(to="body")
    transition(name="imprint-fade")
      div.imprint-overlay(
        v-if="isOpen"
        role="dialog"
        aria-modal="true"
        aria-labelledby="imprint-title"
        @click.self="close"
      )
        div.imprint-modal(role="document")
          header.imprint-head
            h2#imprint-title Impressum
            button.imprint-close(type="button", aria-label="Schließen", @click="close")
              svg(viewBox="0 0 24 24", fill="none", stroke="currentColor", stroke-width="2", stroke-linecap="round", stroke-linejoin="round")
                line(x1="18", y1="6", x2="6", y2="18")
                line(x1="6", y1="6", x2="18", y2="18")
          div.imprint-body(v-html="rendered")
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import imprintText from '@/documentation/imprint.md?raw'
import { useImprintModal } from '@/composables/useImprintModal'

const { isOpen, close } = useImprintModal()

const rendered = computed(() => renderMarkdown(imprintText))

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function autoLink(s: string): string {
  // Auto-link http(s) URLs and bare e-mail addresses (the imprint
  // contains `hello@lambking.de` as plain text — make it clickable).
  return s
    .replace(/\bhttps?:\/\/[^\s<)]+/g, (url) => {
      const trimmed = url.replace(/[.,;:]+$/, '')
      const tail = url.slice(trimmed.length)
      return `<a href="${trimmed}" target="_blank" rel="noopener noreferrer">${trimmed}</a>${tail}`
    })
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, (email) => `<a href="mailto:${email}">${email}</a>`)
}

// Light-touch renderer: splits paragraphs on blank lines, auto-links
// URLs and email addresses, escapes HTML. Single-newlines inside a
// paragraph become `<br>` so the address block keeps its line breaks.
function renderMarkdown(text: string): string {
  const blocks = text.split(/\n\s*\n/)
  const html: string[] = []
  for (const raw of blocks) {
    const block = raw.replace(/^\n+|\n+$/g, '')
    if (!block) continue
    html.push(`<p>${autoLink(escapeHtml(block)).replace(/\n/g, '<br>')}</p>`)
  }
  return html.join('\n')
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) close()
}

// Deep-link support: `?imprint=de` (or any value) opens the modal on first
// paint so the URL is shareable. The locale value is informational right
// now — only imprint.md exists; future translations can branch on it.
const QUERY_KEY = 'imprint'

function openFromUrlIfRequested() {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  if (params.has(QUERY_KEY)) isOpen.value = true
}

function clearUrlParam() {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (!url.searchParams.has(QUERY_KEY)) return
  url.searchParams.delete(QUERY_KEY)
  window.history.replaceState(window.history.state, '', url.toString())
}

watch(isOpen, (open) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = open ? 'hidden' : ''
  if (!open) clearUrlParam()
})

function onPopState() {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  isOpen.value = params.has(QUERY_KEY)
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  window.addEventListener('popstate', onPopState)
  openFromUrlIfRequested()
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('popstate', onPopState)
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})
</script>

<style scoped lang="scss">
.imprint-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(20, 16, 12, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  backdrop-filter: blur(2px);
}

.imprint-modal {
  width: min(100%, 560px);
  max-height: min(86vh, 900px);
  background: var(--paper, #fff);
  color: var(--ink, #1c1611);
  border-radius: 14px;
  box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.imprint-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 28px;
  border-bottom: 1px solid var(--line, rgba(0, 0, 0, 0.08));
  background: var(--cream, #faf4ea);

  h2 {
    font-family: 'Fraunces', serif;
    font-size: 22px;
    font-weight: 500;
    letter-spacing: -0.01em;
    margin: 0;
  }
}

.imprint-close {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: var(--ink-soft, rgba(0, 0, 0, 0.6));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    color: var(--ink, #1c1611);
  }
}

.imprint-body {
  padding: 24px 28px 32px;
  overflow-y: auto;
  font-size: 15px;
  line-height: 1.65;
  color: var(--ink, #1c1611);

  :deep(p) {
    margin: 0 0 14px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(a) {
    color: var(--coral, #c2542d);
    text-decoration: underline;
    word-break: break-word;

    &:hover {
      text-decoration: none;
    }
  }
}

.imprint-fade-enter-active,
.imprint-fade-leave-active {
  transition: opacity 0.2s ease;

  .imprint-modal {
    transition: transform 0.2s ease;
  }
}

.imprint-fade-enter-from,
.imprint-fade-leave-to {
  opacity: 0;

  .imprint-modal {
    transform: translateY(8px);
  }
}

@media (max-width: 540px) {
  .imprint-overlay {
    padding: 0;
  }
  .imprint-modal {
    border-radius: 0;
    max-height: 100vh;
    height: 100vh;
    width: 100%;
  }
  .imprint-head {
    padding: 16px 20px;

    h2 {
      font-size: 19px;
    }
  }
  .imprint-body {
    padding: 20px 20px 28px;
    font-size: 14.5px;
  }
}
</style>
