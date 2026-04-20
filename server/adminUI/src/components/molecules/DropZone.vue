<template>
  <div
    role="button"
    tabindex="0"
    class="drop-zone group min-h-[220px]"
    :class="{
      'is-over': dd.isOver.value,
      'is-busy': dd.isUploading.value,
      'is-success': statusState === 'ok',
      'is-error': statusState === 'err',
    }"
    @click="pick"
    @keydown.enter.prevent="pick"
    @keydown.space.prevent="pick"
    @dragover="dd.onDragOver"
    @dragleave="dd.onDragLeave"
    @drop="dd.onDrop"
  >
    <div class="drop-body">
      <div class="icon-tile" :class="{ 'has-preview': previewUrl, 'is-audio-preview': isAudioPreview }">
        <template v-if="isAudioPreview">
          <button
            type="button"
            class="audio-play-btn"
            :aria-label="isPlaying ? 'Pause preview' : 'Play preview (first 20s)'"
            @click.stop="toggleAudio"
          >
            <Pause v-if="isPlaying" class="w-5 h-5 audio-play-icon is-pause" />
            <Play v-else class="w-6 h-6 audio-play-icon is-play" />
          </button>
          <audio
            ref="audioEl"
            :src="previewUrl"
            preload="none"
            @timeupdate="onTimeUpdate"
            @ended="onAudioEnded"
            @pause="onAudioPause"
          />
        </template>
        <img v-else-if="previewUrl" :src="previewUrl" class="preview-thumb" alt="" />
        <component v-else :is="icon" class="w-6 h-6" />
      </div>
      <div class="drop-label">{{ label }}</div>
      <div v-if="hint" class="drop-hint">{{ hint }}</div>
      <div v-if="subhint" class="drop-subhint">{{ subhint }}</div>
      <div v-if="filenameHint" class="drop-filename-hint">{{ filenameHint }}</div>
      <UploadStatus :status="mergedStatus" />
    </div>
    <input
      ref="input"
      type="file"
      class="dz-file-input"
      :accept="accept"
      @change="dd.onPick"
      @click.stop
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useDragDrop } from '@/composables/useDragDrop'
import UploadStatus from './UploadStatus.vue'
import { FileAudio2, ImageIcon, FileText, Play, Pause } from 'lucide-vue-next'

const PREVIEW_SECONDS = 20

const props = defineProps<{
  label: string
  accept: string
  hint?: string
  subhint?: string
  filenameHint?: string
  kind: 'audio' | 'image' | 'pdf'
  status?: { ok: boolean; filename?: string; message?: string } | null
  previewUrl?: string
  autoResetMs?: number
  onFile: (file: File) => Promise<void> | void
}>()

const input = ref<HTMLInputElement | null>(null)
const dd = useDragDrop(props.onFile)
const pick = () => input.value?.click()

const icon = computed(() => {
  if (props.kind === 'audio') return FileAudio2
  if (props.kind === 'image') return ImageIcon
  return FileText
})

const isAudioPreview = computed(() => props.kind === 'audio' && !!props.previewUrl)

const audioEl = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)

function toggleAudio() {
  const el = audioEl.value
  if (!el) return
  if (el.paused) {
    if (el.currentTime >= PREVIEW_SECONDS) el.currentTime = 0
    void el.play().then(() => {
      isPlaying.value = true
    }).catch(() => {
      isPlaying.value = false
    })
  } else {
    el.pause()
  }
}

function onTimeUpdate() {
  const el = audioEl.value
  if (!el) return
  if (el.currentTime >= PREVIEW_SECONDS) {
    el.pause()
    el.currentTime = 0
  }
}

function onAudioEnded() {
  isPlaying.value = false
}

function onAudioPause() {
  isPlaying.value = false
}

watch(() => props.previewUrl, () => {
  const el = audioEl.value
  if (el && !el.paused) el.pause()
  isPlaying.value = false
})

const mergedStatus = computed(() => {
  if (props.status) return props.status
  if (dd.error.value) return { ok: false, message: dd.error.value }
  if (dd.filename.value) return { ok: true, filename: dd.filename.value }
  return null
})

const statusState = computed<'ok' | 'err' | null>(() => {
  if (!mergedStatus.value) return null
  return mergedStatus.value.ok ? 'ok' : 'err'
})

let resetTimer: ReturnType<typeof setTimeout> | null = null
watch(statusState, (state) => {
  if (resetTimer) {
    clearTimeout(resetTimer)
    resetTimer = null
  }
  if (state === 'ok' && props.autoResetMs && props.autoResetMs > 0) {
    resetTimer = setTimeout(() => {
      dd.reset()
      resetTimer = null
    }, props.autoResetMs)
  }
})
onBeforeUnmount(() => {
  if (resetTimer) clearTimeout(resetTimer)
})

defineExpose({ reset: dd.reset })
</script>

<style scoped>
.drop-zone {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 220px;
  border-radius: 18px;
  cursor: pointer;
  user-select: none;
  background: rgba(255, 255, 255, 0.82);
  border: 1.5px dashed rgba(190, 140, 80, 0.45);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset,
  0 8px 24px -16px rgba(120, 90, 50, 0.18);
  transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease,
  transform 160ms ease;
  overflow: hidden;
}

.drop-zone:hover {
  border-color: rgba(255, 165, 100, 0.85);
  background: rgba(255, 250, 242, 0.95);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.95) inset,
  0 16px 34px -18px rgba(120, 90, 50, 0.3);
}

.drop-zone:focus-visible {
  outline: none;
  border-color: rgba(255, 140, 60, 1);
  box-shadow: 0 0 0 3px rgba(255, 165, 100, 0.35);
}

.drop-zone.is-over {
  border-style: solid;
  border-color: rgba(255, 150, 70, 1);
  background: rgba(255, 240, 220, 0.95);
  box-shadow: 0 0 0 3px rgba(255, 165, 100, 0.35),
  0 20px 44px -16px rgba(180, 110, 50, 0.4);
}

.drop-zone.is-busy {
  animation: pulse 1.4s ease-in-out infinite;
}

.drop-zone.is-success {
  border-color: rgba(56, 161, 105, 0.55);
  background: rgba(236, 253, 245, 0.85);
}

.drop-zone.is-error {
  border-color: rgba(225, 90, 90, 0.6);
  background: rgba(255, 240, 240, 0.85);
}

.drop-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  padding: 22px 20px 18px;
}

.icon-tile {
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  color: #b7661d;
  background: linear-gradient(140deg, #fff3e3 0%, #ffe0bd 100%);
  border: 1px solid rgba(220, 170, 110, 0.6);
  box-shadow: 0 6px 14px -6px rgba(180, 110, 50, 0.4);
  transition: box-shadow 180ms ease;
  margin-bottom: 4px;
  pointer-events: none;
}

.drop-zone:hover .icon-tile,
.drop-zone.is-over .icon-tile {
  box-shadow: 0 10px 20px -8px rgba(180, 110, 50, 0.55);
}

.icon-tile.has-preview {
  padding: 0;
  overflow: hidden;
  background: #f4f4f4;
}

.icon-tile.is-audio-preview {
  pointer-events: auto;
  background: linear-gradient(140deg, #fff3e3 0%, #ffe0bd 100%);
}

.audio-play-btn {
  width: 100%;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #b7661d;
  cursor: pointer;
  border-radius: inherit;
  transition: background 160ms ease, transform 120ms ease;
}

.audio-play-btn:hover {
  background: rgba(255, 165, 100, 0.18);
}

.audio-play-btn:active {
  transform: scale(0.96);
}

.audio-play-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 165, 100, 0.45);
}

.audio-play-icon.is-play {
  color: #16a34a;
  fill: #16a34a;
  stroke: #15803d;
  filter: drop-shadow(0 1px 2px rgba(21, 128, 61, 0.35));
}

.audio-play-icon.is-pause {
  color: #b7661d;
}

.preview-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.drop-zone.is-success .icon-tile {
  color: #2f855a;
  background: linear-gradient(140deg, #e6fff1 0%, #c6f0d6 100%);
  border-color: rgba(56, 161, 105, 0.5);
}

.drop-zone.is-error .icon-tile {
  color: #b83535;
  background: linear-gradient(140deg, #ffe9e9 0%, #ffc7c7 100%);
  border-color: rgba(225, 90, 90, 0.55);
}

.drop-label {
  font-size: 14px;
  font-weight: 600;
  color: #2a1f10;
  letter-spacing: -0.005em;
}

.drop-hint {
  font-size: 11.5px;
  color: #8a6a3c;
  max-width: 220px;
  line-height: 1.4;
}

.drop-subhint {
  font-size: 10.5px;
  color: #a59173;
  font-style: italic;
  letter-spacing: 0.01em;
}

.drop-filename-hint {
  font-size: 11.5px;
  font-weight: 600;
  color: #1d4ed8;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.25);
  padding: 3px 10px;
  border-radius: 999px;
  margin-top: 2px;
  letter-spacing: 0.01em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Native file input — visually hidden but accessible. If ever rendered
 * visibly (browser quirk), text stays centered so "Datei auswählen /
 * Keine ausgewählt" never floats off-center. */
.dz-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
  opacity: 0;
  pointer-events: none;
  text-align: center;
}

</style>
