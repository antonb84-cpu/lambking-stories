<template>
  <teleport to="body">
    <div class="fixed inset-0 z-40 bg-black/40" @click="emit('close')" />
    <div
      class="fixed z-50 p-5 w-full max-w-lg left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 glass card"
      @keydown.esc="emit('close')"
    >
      <div class="flex flex-col text-center">
        <slot name="title">
          <h2 v-if="title" class="text-xl font-semibold py-2">{{ title }}</h2>
        </slot>
        <slot name="description">
          <p v-if="description" class="text-sm text-stone-600 px-4">{{ description }}</p>
        </slot>
        <slot />
      </div>
      <div v-if="$slots.buttons" class="mt-4 flex gap-2 justify-center">
        <slot name="buttons" />
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
defineProps<{ title?: string; description?: string }>()
const emit = defineEmits(['close'])
</script>
