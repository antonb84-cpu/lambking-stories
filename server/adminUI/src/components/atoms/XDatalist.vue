<template>
  <div class="relative">
    <input
      :list="listId"
      :value="model"
      class="glass w-full"
      :placeholder="placeholder"
      @input="onInput"
    />
    <datalist :id="listId">
      <option v-for="item in items" :key="item.value" :value="item.value">
        {{ item.label ?? item.value }}
      </option>
    </datalist>
  </div>
</template>

<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'

interface Item {
  value: string
  label?: string
}

defineProps<{ items: Item[]; placeholder?: string }>()
const listId = uuidv4()
const model = defineModel<string>()
const onInput = (e: Event) => {
  model.value = (e.target as HTMLInputElement).value
}
</script>
