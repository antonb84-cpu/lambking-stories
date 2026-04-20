<template>
  <select v-model="model" class="glass w-full">
    <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
    <option v-for="item in items" :key="item.value" :value="item.value">
      {{ item.label ?? item.value }}
    </option>
  </select>
</template>

<script setup lang="ts">
interface Item {
  value: string
  label?: string
}

defineProps<{ items: Item[]; placeholder?: string }>()
const model = defineModel<string>()
</script>
