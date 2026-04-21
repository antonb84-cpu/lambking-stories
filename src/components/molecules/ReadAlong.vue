<script setup lang="ts">
/**
 * Karaoke "follow along" caption that highlights the active word in sync with
 * an audio source. Lifted out of AppBookDetailView so it can be reused after
 * the MVP. Two timing modes:
 *  (1) alignment JSON next to the audio file → exact word timings.
 *  (2) no alignment → fallback uniform timing scoped to the first non-empty
 *      page so sentences don't fly by.
 *
 * Props are intentionally narrow — this component owns its alignment fetch and
 * layout measurement; the parent only needs to pass currentTime + duration.
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { snapshotAt } from '@/utils/karaoke'
import type { ApiLocalizedPage } from '@/types/apiBook'

const props = defineProps<{
  audioSrc: string
  pages: ApiLocalizedPage[]
  currentTime: number
  duration: number
}>()

const { t } = useI18n({ useScope: 'global' })

interface AlignedWord {
  text: string
  start: number
  end: number
}

interface AlignedSentence {
  text: string
  start: number
  end: number
  words: AlignedWord[]
}

interface Alignment {
  duration: number
  sentences: AlignedSentence[]
}

const alignment = ref<Alignment | null>(null)

async function loadAlignment(src: string) {
  alignment.value = null
  if (!src) return
  const url = src.replace(/\.(ogg|mp3|m4a|wav)(\?.*)?$/i, '.align.json$2')
  if (url === src) return
  try {
    const res = await fetch(url)
    if (!res.ok) return
    const json = await res.json()
    if (json && Array.isArray(json.sentences) && json.sentences.length) {
      alignment.value = { duration: json.duration || 0, sentences: json.sentences }
    }
  } catch {
    /* no alignment available — fallback path handles it */
  }
}

watch(() => props.audioSrc, (src) => loadAlignment(src), { immediate: true })

interface FallbackSentence {
  words: string[]
  startWord: number
}

function plainPageText(raw: string): string {
  return (raw || '').replace(/!\[[^\]]*\]\([^)\s]+\)/g, '').trim()
}

const fallbackSentences = computed<FallbackSentence[]>(() => {
  const list: FallbackSentence[] = []
  let globalWord = 0
  for (const p of props.pages) {
    const raw = plainPageText(p.text || '')
    if (!raw) continue
    const sentenceStrings = raw.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []
    for (const s of sentenceStrings) {
      const trimmed = s.trim()
      if (!trimmed) continue
      const words = trimmed.split(/\s+/)
      list.push({ words, startWord: globalWord })
      globalWord += words.length
    }
    if (list.length) break
  }
  return list
})

const karaoke = computed(() => {
  const t0 = props.currentTime
  if (alignment.value) {
    return snapshotAt(alignment.value, t0)
  }
  const fb = fallbackSentences.value
  if (!fb.length || !props.duration) {
    return { sentenceIndex: 0, activeWord: 0, currentWords: [], nextWords: [], showNext: false }
  }
  const totalWords = fb.reduce((n, s) => n + s.words.length, 0) || 1
  const ratio = Math.min(1, t0 / props.duration)
  const globalWord = Math.floor(ratio * totalWords)
  let sentenceIndex = fb.length - 1
  for (let i = 0; i < fb.length; i++) {
    const s = fb[i]
    if (s && globalWord < s.startWord + s.words.length) {
      sentenceIndex = i
      break
    }
  }
  const sent = fb[sentenceIndex]
  const perWord = props.duration / totalWords
  const sentStart = sent ? sent.startWord * perWord : 0
  const local = Math.max(0, t0 - sentStart)
  const activeWord = sent
    ? Math.max(0, Math.min(sent.words.length - 1, Math.floor(local / perWord)))
    : 0
  const next = fb[sentenceIndex + 1]
  const denom = Math.max(1, (sent?.words.length || 1) - 1)
  const showNext = !!(sent && next) && activeWord / denom >= 0.6
  return {
    sentenceIndex,
    activeWord,
    currentWords: sent?.words || [],
    nextWords: next?.words || [],
    showNext
  }
})

const currentSentenceIndex = computed(() => karaoke.value.sentenceIndex)
const currentSentence = computed(() =>
  karaoke.value.currentWords.length ? { words: karaoke.value.currentWords } : null
)
const nextSentence = computed(() =>
  karaoke.value.nextWords.length ? { words: karaoke.value.nextWords } : null
)
const showNextSentence = computed(() => karaoke.value.showNext)

const currentWordTimings = computed<Array<{ start: number; end: number }>>(() => {
  const si = currentSentenceIndex.value
  if (alignment.value) {
    const s = alignment.value.sentences[si]
    return s ? s.words.map(w => ({ start: w.start, end: w.end })) : []
  }
  const fb = fallbackSentences.value
  if (!fb.length || !props.duration) return []
  const totalWords = fb.reduce((n, s) => n + s.words.length, 0) || 1
  const perWord = props.duration / totalWords
  const sent = fb[si]
  if (!sent) return []
  return sent.words.map((_, i) => ({
    start: (sent.startWord + i) * perWord,
    end: (sent.startWord + i + 1) * perWord
  }))
})

const subtitlesRef = ref<HTMLDivElement | null>(null)
const wordSpans = ref<(HTMLElement | null)[]>([])

function setWordRef(i: number, el: any) {
  wordSpans.value[i] = (el as HTMLElement) || null
}

const layoutTick = ref(0)
watch(currentSentenceIndex, () => {
  wordSpans.value = []
  layoutTick.value++
})
watch(() => currentSentence.value?.words.length, () => {
  layoutTick.value++
})

interface BoxStyle {
  left: number
  top: number
  width: number
  height: number
  visible: boolean
}

const karaokeBox = computed<BoxStyle>(() => {
  void layoutTick.value
  const t0 = props.currentTime
  const times = currentWordTimings.value
  const spans = wordSpans.value
  const container = subtitlesRef.value
  if (!times.length || !spans.length || !container) {
    return { left: 0, top: 0, width: 0, height: 0, visible: false }
  }
  const first = times[0]
  if (!first) return { left: 0, top: 0, width: 0, height: 0, visible: false }
  let i = 0
  for (; i < times.length - 1; i++) {
    const nextT = times[i + 1]
    if (nextT && t0 < nextT.start) break
  }
  const curT = times[i]
  const cur = spans[i]
  if (!cur || !curT) return { left: 0, top: 0, width: 0, height: 0, visible: false }
  const cr = container.getBoundingClientRect()
  const a = cur.getBoundingClientRect()
  const base = {
    left: a.left - cr.left,
    top: a.top - cr.top,
    width: a.width,
    height: a.height
  }
  const nxt = spans[i + 1]
  const nxtT = times[i + 1]
  if (!nxt || !nxtT || i >= times.length - 1) {
    return { ...base, visible: t0 >= first.start - 0.05 }
  }
  const span = Math.max(0.05, nxtT.start - curT.start)
  const frac = Math.min(1, Math.max(0, (t0 - curT.start) / span))
  const eased = frac < 0.5 ? 2 * frac * frac : 1 - Math.pow(-2 * frac + 2, 2) / 2
  const b = nxt.getBoundingClientRect()
  const tgt = {
    left: b.left - cr.left,
    top: b.top - cr.top,
    width: b.width,
    height: b.height
  }
  return {
    left: base.left + (tgt.left - base.left) * eased,
    top: base.top + (tgt.top - base.top) * eased,
    width: base.width + (tgt.width - base.width) * eased,
    height: base.height,
    visible: t0 >= first.start - 0.05
  }
})

const karaokeBoxStyle = computed(() => {
  const b = karaokeBox.value
  return {
    transform: `translate3d(${b.left}px, ${b.top}px, 0)`,
    width: `${b.width}px`,
    height: `${b.height}px`,
    opacity: b.visible ? '1' : '0'
  }
})

function onWindowResize() {
  layoutTick.value++
}

onMounted(() => window.addEventListener('resize', onWindowResize))
onUnmounted(() => window.removeEventListener('resize', onWindowResize))
watch(currentSentence, () => {
  nextTick(() => {
    layoutTick.value++
  })
})
</script>

<template lang="pug">
  div(
    ref="subtitlesRef"
    class="subtitles relative p-5"
  )
    div(
      class="karaoke-box"
      :style="karaokeBoxStyle"
      aria-hidden="true"
    )
    p(v-if="currentSentence" class="subtitle-current relative")
      span(
        v-for="(w, i) in currentSentence.words"
        :key="i"
        :ref="el => setWordRef(i, el)"
        class="sub-word"
      ) {{ w + ' ' }}
    p(v-else class="subtitle-current subtitle-placeholder") {{ t('app.bookDetail.noText') }}
    p(v-if="showNextSentence && nextSentence" class="subtitle-next relative mt-3")
      span(v-for="(w, i) in nextSentence.words" :key="i") {{ w + ' ' }}
</template>

<style scoped lang="sass">
.subtitles
  background-color: var(--color-bg-card)
  border: 1px solid var(--color-border-subtle)
  border-radius: 24px
  box-shadow: 0 1px 2px rgba(126, 58, 242, 0.04), 0 10px 28px -14px rgba(126, 58, 242, 0.25)
  min-height: 8rem
  overflow-wrap: break-word
  word-break: normal
  hyphens: auto

  p
    overflow-wrap: break-word
    word-break: normal
    hyphens: auto

  span
    display: inline

.subtitle-current
  font-size: 17px
  font-weight: 800
  line-height: 1.55
  color: var(--color-text-secondary)

@media (max-width: 400px)
  .subtitles
    padding: 16px !important
    border-radius: 20px
  .subtitle-current
    font-size: 15px
  .subtitle-next
    font-size: 13px !important

.subtitle-placeholder
  color: var(--color-text-secondary)
  font-weight: 600
  font-style: italic

.subtitle-next
  font-size: 14px
  font-weight: 600
  line-height: 1.5
  color: rgba(138, 116, 170, 0.7)

.subtitle-current .sub-word
  position: relative
  z-index: 1
  padding: 2px 2px
  margin: 0 -1px
  color: var(--color-text-primary)

.karaoke-box
  position: absolute
  left: 0
  top: 0
  pointer-events: none
  z-index: 0
  border-radius: 8px
  background: linear-gradient(180deg, rgba(255, 209, 71, 0.55) 0%, rgba(255, 184, 77, 0.55) 100%)
  box-shadow: 0 0 0 1px rgba(255, 209, 71, 0.35), 0 6px 18px -8px rgba(255, 170, 0, 0.35)
  will-change: transform, width, height, opacity
</style>
