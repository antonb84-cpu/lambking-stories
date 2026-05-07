<template>
  <div class="fs-picker">
    <select
      class="fs-select"
      :value="selectValue"
      :title="tooltip"
      @change="onSelectChange"
    >
      <option value="">Größe…</option>
      <option v-for="s in PRESETS" :key="s" :value="String(s)">{{ s }}px</option>
      <option value="custom">Andere…</option>
      <option value="clear">Standard (zurücksetzen)</option>
    </select>
    <input
      v-if="customMode"
      ref="customInput"
      type="number"
      min="1"
      max="999"
      step="1"
      class="fs-custom"
      placeholder="px"
      :value="customDraft"
      @input="onCustomInput"
      @keydown.enter.prevent="commitCustom"
      @blur="commitCustom"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

const PRESETS = [10, 12, 14, 16, 18, 20, 24, 28, 32, 40] as const

const props = defineProps<{
  /** Current font-size of the editor selection, or null when none / mixed. */
  modelValue: number | null
}>()
const emit = defineEmits<{
  /** Apply the given size to the current selection. */
  'apply': [size: number]
  /** Remove the font-size mark from the current selection. */
  'clear': []
}>()

const tooltip =
  'Schriftgröße der markierten Textstelle setzen — wirkt sich auf iPhone-Previewer ' +
  'und BookReader aus. Wähle eine Voreinstellung oder „Andere…" für einen freien Pixelwert.'

const customMode = ref(false)
const customDraft = ref('')
const customInput = ref<HTMLInputElement | null>(null)

const selectValue = computed<string>(() => {
  if (customMode.value) return 'custom'
  if (props.modelValue == null) return ''
  if ((PRESETS as readonly number[]).includes(props.modelValue)) return String(props.modelValue)
  // Selection has a custom size — flip to custom mode automatically so the
  // input shows the live value the next time it opens.
  return 'custom'
})

watch(
  () => props.modelValue,
  (size) => {
    if (size != null && !(PRESETS as readonly number[]).includes(size)) {
      customMode.value = true
      customDraft.value = String(size)
    } else if (size == null) {
      customMode.value = false
      customDraft.value = ''
    }
  }
)

function onSelectChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  if (v === '') return
  if (v === 'clear') {
    customMode.value = false
    customDraft.value = ''
    emit('clear')
    return
  }
  if (v === 'custom') {
    customMode.value = true
    customDraft.value = props.modelValue != null ? String(props.modelValue) : ''
    nextTick(() => customInput.value?.focus())
    return
  }
  const n = parseInt(v, 10)
  if (!Number.isFinite(n)) return
  customMode.value = false
  emit('apply', n)
}

function onCustomInput(e: Event) {
  customDraft.value = (e.target as HTMLInputElement).value
}

function commitCustom() {
  const raw = customDraft.value.trim()
  if (!raw) return
  const n = Math.round(parseFloat(raw))
  if (!Number.isFinite(n) || n < 1 || n > 999) return
  emit('apply', n)
}
</script>

<style scoped>
.fs-picker {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.fs-select {
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #44403c;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(140, 110, 80, 0.35);
  cursor: pointer;
}

.fs-select:hover {
  background: #fff;
  border-color: rgba(140, 110, 80, 0.65);
}

.fs-custom {
  width: 56px;
  padding: 4px 6px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(52, 152, 219, 0.5);
  color: #1c1917;
  -moz-appearance: textfield;
}

.fs-custom::-webkit-outer-spin-button,
.fs-custom::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
