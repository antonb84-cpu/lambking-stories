<template>
  <div class="locale-switch" :class="{ 'is-en': modelValue === 'en' }">
    <span class="locale-indicator" aria-hidden="true" />
    <button
      type="button"
      class="locale-option"
      :class="{ active: modelValue === 'de' }"
      @click="switchTo('de')"
    >
      <span class="flag">🇩🇪</span>
      <span class="label">Deutsch</span>
    </button>
    <button
      type="button"
      class="locale-option"
      :class="{ active: modelValue === 'en' }"
      @click="switchTo('en')"
    >
      <span class="flag">🇬🇧</span>
      <span class="label">English</span>
    </button>
    <span v-if="busy" class="busy-dot" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: 'de' | 'en'; busy?: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [locale: 'de' | 'en']
  translate: [from: 'de' | 'en', to: 'de' | 'en']
}>()

function switchTo(l: 'de' | 'en') {
  const from = props.modelValue
  if (l === from) return
  emit('update:modelValue', l)
  emit('translate', from, l)
}
</script>

<style scoped>
.locale-switch {
  position: relative;
  display: inline-grid;
  grid-template-columns: 1fr 1fr;
  align-items: stretch;
  padding: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(52, 152, 219, 0.35);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9),
  0 6px 16px -10px rgba(52, 152, 219, 0.35);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  min-width: 260px;
}

.locale-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc(50% - 4px);
  border-radius: 999px;
  background: linear-gradient(140deg, #5dade2 0%, #2980b9 100%);
  box-shadow: 0 6px 14px -6px rgba(41, 128, 185, 0.6),
  inset 0 1px 0 rgba(255, 255, 255, 0.35);
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
  z-index: 0;
}

.locale-switch.is-en .locale-indicator {
  transform: translateX(100%);
}

.locale-option {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: #5d6d7e;
  border-radius: 999px;
  cursor: pointer;
  transition: color 180ms ease, transform 180ms ease;
  user-select: none;
}

.locale-option:hover:not(.active):not(:disabled) {
  color: #2980b9;
}

.locale-option:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.locale-option.active {
  color: #fff;
  text-shadow: 0 1px 2px rgba(25, 80, 130, 0.25);
}

.locale-option .flag {
  font-size: 15px;
  line-height: 1;
}

.locale-option .label {
  letter-spacing: 0.01em;
}

.busy-dot {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #f39c12;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.9);
  animation: busy-pulse 1s ease-in-out infinite;
}

@keyframes busy-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.25);
    opacity: 0.7;
  }
}
</style>
