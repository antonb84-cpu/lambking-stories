<template>
  <input
    :type="type"
    :value="model"
    class="glass w-full"
    :placeholder="placeholder"
    @click="emit('click', $event)"
    @input="onInput"
    @focus="isSelectAll && selectAll($event.target as HTMLInputElement)"
    @keydown.enter="emit('enter', $event)"
  />
</template>

<script setup lang="ts">
defineProps({
  type: { type: String, default: 'text' },
  isSelectAll: { type: Boolean, default: false },
  placeholder: { type: String, default: '' }
})

const model = defineModel<string | number>()
const onInput = (event: Event) => {
  model.value = (event.target as HTMLInputElement).value
}
const emit = defineEmits(['click', 'enter'])
const selectAll = (node: HTMLInputElement) => node.select()
</script>
