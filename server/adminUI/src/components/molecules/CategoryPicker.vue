<template>
  <XDatalist v-model="proxy" :items="items" placeholder="Kategorie wählen" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import XDatalist from '@/components/atoms/XDatalist.vue'
import type { CategoryDTO } from '@/types'

const props = defineProps<{ modelValue: string; categories: CategoryDTO[] }>()
const emit = defineEmits<{ 'update:modelValue': [name: string] }>()

const proxy = computed({
  get: () => props.modelValue,
  set: (v: string | undefined) => emit('update:modelValue', v ?? '')
})

const items = computed(() => props.categories.map((c) => ({ value: c.name })))
</script>
