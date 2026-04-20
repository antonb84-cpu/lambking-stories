<template>
  <div class="flex flex-wrap items-center gap-2">
    <input
      v-model="draft"
      class="glass text-xs w-44"
      placeholder="z.B. 6-8 Jahre, 15min…"
      @keydown.enter.prevent="add"
    />
    <span
      v-for="(b, i) in modelValue"
      :key="b + i"
      class="inline-flex items-center gap-1 text-xs bg-amber-200/70 px-2 py-1 rounded-full"
    >
      {{ b }}
      <button class="text-stone-600 hover:text-rose-500" @click="remove(i)" aria-label="Entfernen">×</button>
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ modelValue: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [badges: string[]] }>()

const draft = ref('')
const add = () => {
  const v = draft.value.trim()
  if (!v) return
  emit('update:modelValue', [...props.modelValue, v])
  draft.value = ''
}
const remove = (i: number) => {
  const next = [...props.modelValue]
  next.splice(i, 1)
  emit('update:modelValue', next)
}
</script>
