<template>
  <div class="flex items-stretch gap-2">
    <XDatalist v-model="proxy" :items="items" placeholder="Buchreihe wählen" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import XDatalist from '@/components/atoms/XDatalist.vue'
import type { SeriesDTO } from '@/types'

const props = defineProps<{ modelValue: string; series: SeriesDTO[] }>()
const emit = defineEmits<{ 'update:modelValue': [id: string] }>()

const proxy = computed({
  get: () => props.modelValue,
  set: (v: string | undefined) => emit('update:modelValue', v ?? '')
})

const items = computed(() =>
  props.series.map((s) => ({ value: s.seriesId, label: `${s.name} (${s.prefix})` }))
)
</script>
