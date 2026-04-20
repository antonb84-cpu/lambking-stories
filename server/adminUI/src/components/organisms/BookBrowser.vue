<template>
  <div class="glass card !p-3 flex items-center gap-3">
    <Search class="w-4 h-4 text-stone-500 flex-shrink-0" />
    <div class="flex items-stretch flex-1 gap-1">
      <select class="glass w-full" :value="selected" @change="onChange">
        <option value="">— Neues Buch anlegen —</option>
        <option v-for="b in books" :key="b.bookId" :value="b.bookId">
          {{ b.bookId }} — {{ b.localizations.de?.title ?? b.localizations.en?.title ?? '(ohne Titel)' }}
        </option>
      </select>
      <XButton label="Neu" @click="emit('select', '')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import XButton from '@/components/atoms/XButton.vue'
import { Search } from 'lucide-vue-next'
import type { BookDTO } from '@/types'

defineProps<{ books: BookDTO[]; selected: string }>()
const emit = defineEmits<{ select: [bookId: string] }>()

const onChange = (e: Event) => emit('select', (e.target as HTMLSelectElement).value)
</script>
