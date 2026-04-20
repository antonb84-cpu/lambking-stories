<template>
  <button
    class="glass select-none"
    :disabled="disabled"
    @click="emits('click', $event)"
  >
    <slot>
      <span>{{ label }}</span>
    </slot>
  </button>
</template>

<script setup lang="ts">
defineProps({
  label: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})
const emits = defineEmits(['click'])
</script>
