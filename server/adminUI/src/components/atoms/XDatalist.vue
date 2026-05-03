<template>
  <div class="datalist-wrap relative">
    <input
      ref="input"
      :list="listId"
      :value="model"
      class="glass w-full datalist-input"
      :class="{ 'has-clear': !!model }"
      :placeholder="placeholder"
      @input="onInput"
    />
    <button
      v-if="model"
      type="button"
      class="datalist-clear"
      title="Eingabe löschen"
      aria-label="Eingabe löschen"
      @click.stop="clear"
      @mousedown.prevent
    >×
    </button>
    <datalist :id="listId">
      <option v-for="item in items" :key="item.value" :value="item.value">
        {{ item.label ?? item.value }}
      </option>
    </datalist>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'

interface Item {
  value: string
  label?: string
}

defineProps<{ items: Item[]; placeholder?: string }>()
const listId = uuidv4()
const model = defineModel<string>()
const input = ref<HTMLInputElement | null>(null)

const onInput = (e: Event) => {
  model.value = (e.target as HTMLInputElement).value
}

// Wipe the bound value and refocus the input so the native datalist
// re-opens with the unfiltered list — the user can immediately keep
// typing or pick another option without an extra click.
function clear() {
  model.value = ''
  input.value?.focus()
}
</script>

<style scoped>
.datalist-wrap {
  display: block;
  width: 100%;
}

/* Reserve space on the right for the clear button + the browser's native
 * dropdown arrow. The arrow is drawn by the browser at a position we can't
 * style, so we just push the text and the clear button far enough left
 * that they don't overlap it. 44px covers the widest UA arrow widget. */
.datalist-input.has-clear {
  padding-right: 44px;
}

.datalist-clear {
  position: absolute;
  /* 22px clears the native dropdown arrow on Chromium/Firefox/Safari. */
  right: 22px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.06);
  color: #5d6d7e;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}

.datalist-clear:hover {
  background: rgba(231, 76, 60, 0.92);
  color: #fff;
}

.datalist-clear:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.5);
}
</style>
