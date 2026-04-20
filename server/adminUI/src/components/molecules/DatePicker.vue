<template>
  <input type="date" v-model="proxy" class="glass w-full" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const proxy = computed({
  get: () => (props.modelValue ? props.modelValue.slice(0, 10) : ''),
  set: (v: string) => emit('update:modelValue', v)
})
</script>
