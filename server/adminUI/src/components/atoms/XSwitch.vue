<template>
  <label class="glass switch inline-flex items-center cursor-pointer px-3 py-2 gap-3">
    <input type="checkbox" v-model="model" class="sr-only peer" @change="() => emit('change', model)" />
    <div
      class="relative w-9 h-5 bg-stone-300 rounded-full peer
             peer-checked:bg-amber-400
             after:content-[''] after:absolute after:top-[2px] after:start-[2px]
             after:bg-white after:border-stone-300 after:border after:rounded-full
             after:h-4 after:w-4 after:transition-all
             peer-checked:after:translate-x-full"
    />
    <span v-if="title" class="text-sm font-medium">{{ title }}</span>
  </label>
</template>

<script setup lang="ts">
defineProps<{ title?: string }>()
const model = defineModel<boolean>()
const emit = defineEmits<{ change: [boolean | undefined] }>()
</script>
