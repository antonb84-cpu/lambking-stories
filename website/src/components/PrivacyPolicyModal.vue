<template lang="pug">
  Teleport(to="body")
    transition(name="privacy-fade")
      div.privacy-overlay(
        v-if="isOpen"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
        @click.self="close"
      )
        div.privacy-modal(role="document")
          header.privacy-head
            h2#privacy-title Datenschutzerklärung
            button.privacy-close(type="button", aria-label="Schließen", @click="close")
              svg(viewBox="0 0 24 24", fill="none", stroke="currentColor", stroke-width="2", stroke-linecap="round", stroke-linejoin="round")
                line(x1="18", y1="6", x2="6", y2="18")
                line(x1="6", y1="6", x2="18", y2="18")
          div.privacy-body(v-html="rendered")
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import privacyText from '@/documentation/privacy-policy-de.md?raw'
import { usePrivacyModal } from '@/composables/usePrivacyModal'
import { useRoute } from 'vue-router'

const { isOpen, close } = usePrivacyModal()

const route = useRoute()

const rendered = computed(() => renderMarkdown(privacyText))

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function autoLink(s: string): string {
  return s.replace(/\bhttps?:\/\/[^\s<)]+/g, (url) => {
    const trimmed = url.replace(/[.,;:]+$/, '')
    const tail = url.slice(trimmed.length)
    return `<a href="${trimmed}" target="_blank" rel="noopener noreferrer">${trimmed}</a>${tail}`
  })
}

// Light-touch renderer: not a full markdown parser. Treats lines starting
// with `<digit>.` as section headings, splits paragraphs on blank lines,
// strips stray backtick-only lines, and auto-links URLs. Good enough for
// the prose-with-numbered-sections shape of privacy-policy-de.md without
// pulling in a markdown dependency.
function renderMarkdown(text: string): string {
  const cleaned = text
    .split('\n')
    .filter((line) => line.trim() !== '`')
    .join('\n')

  const blocks = cleaned.split(/\n\s*\n/)
  const html: string[] = []

  for (const raw of blocks) {
    const block = raw.replace(/^\n+|\n+$/g, '')
    if (!block) continue

    const lines = block.split('\n')
    const first = lines[0].trim()
    const headingMatch = first.match(/^(\d+)\.\s+(.+)$/)

    if (headingMatch) {
      const [, num, rest] = headingMatch
      html.push(`<h3>${num}. ${autoLink(escapeHtml(rest))}</h3>`)
      const tail = lines.slice(1).join('\n').trim()
      if (tail) {
        html.push(`<p>${autoLink(escapeHtml(tail)).replace(/\n/g, '<br>')}</p>`)
      }
    } else {
      html.push(`<p>${autoLink(escapeHtml(block)).replace(/\n/g, '<br>')}</p>`)
    }
  }

  return html.join('\n')
}

// Lock body scroll while modal is open + close on Escape.
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) close()
}

// Deep-link support: `?privacy-policy=de` (or any value) opens the modal
// on first paint, so the URL is shareable. The locale value is currently
// informational — only privacy-policy-de.md exists. When an EN translation
// is added, switch the markdown import based on this value.
const QUERY_KEY = 'privacy-policy'

function openFromUrlIfRequested() {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  console.log('route: ', route)
  console.log('params: ', params, params.has(QUERY_KEY))
  if (params.has(QUERY_KEY)) isOpen.value = true
}

function clearUrlParam() {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (!url.searchParams.has(QUERY_KEY)) return
  url.searchParams.delete(QUERY_KEY)
  // replaceState (not pushState) so we don't add a back-button entry just
  // for closing a modal.
  window.history.replaceState(window.history.state, '', url.toString())
}

watch(isOpen, (open) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = open ? 'hidden' : ''
  if (!open) clearUrlParam()
})

// Browser back/forward should track the modal: navigating away from a URL
// that had ?privacy-policy=… closes the modal, navigating back re-opens.
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
.privacy-overlay {
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

.privacy-modal {
  width: min(100%, 760px);
  max-height: min(86vh, 900px);
  background: var(--paper, #fff);
  color: var(--ink, #1c1611);
  border-radius: 14px;
  box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.privacy-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 28px;
  border-bottom: 1px solid var(--line, rgba(0, 0, 0, 0.08));
  background: var(--cream, #faf4ea);

  h2 {
    font-family: 'PoetsenOne', serif;
    font-size: 22px;
    font-weight: 500;
    letter-spacing: -0.01em;
    margin: 0;
  }
}

.privacy-close {
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

.privacy-body {
  padding: 24px 28px 32px;
  overflow-y: auto;
  font-size: 15px;
  line-height: 1.65;
  color: var(--ink, #1c1611);

  :deep(h3) {
    font-family: 'PoetsenOne', serif;
    font-size: 18px;
    font-weight: 600;
    margin: 28px 0 10px;
    color: var(--ink, #1c1611);

    &:first-child {
      margin-top: 0;
    }
  }

  :deep(p) {
    margin: 0 0 14px;
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

.privacy-fade-enter-active,
.privacy-fade-leave-active {
  transition: opacity 0.2s ease;

  .privacy-modal {
    transition: transform 0.2s ease;
  }
}

.privacy-fade-enter-from,
.privacy-fade-leave-to {
  opacity: 0;

  .privacy-modal {
    transform: translateY(8px);
  }
}

@media (max-width: 540px) {
  .privacy-overlay {
    padding: 0;
  }
  .privacy-modal {
    border-radius: 0;
    max-height: 100vh;
    height: 100vh;
    width: 100%;
  }
  .privacy-head {
    padding: 16px 20px;

    h2 {
      font-size: 19px;
    }
  }
  .privacy-body {
    padding: 20px 20px 28px;
    font-size: 14.5px;
  }
}
</style>
