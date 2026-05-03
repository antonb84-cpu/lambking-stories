<template>
  <div class="taxonomy-section">
    <div class="tax-head">
      <h3 class="tax-title">Buchreihen</h3>
      <span
        class="count-badge has-tooltip"
        :data-tooltip="`Anzahl angelegter Buchreihen — derzeit ${store.items.length}`"
        tabindex="0"
      >{{ store.items.length }}</span>
    </div>
    <div class="flex items-stretch gap-1">
      <input
        v-model="name"
        class="glass flex-1 basis-[33%] mr-2"
        placeholder='Reihenname (z. B. „Fruit Agents")'
        @keydown.enter.prevent="add"
      />
      <input
        v-model="prefix"
        class="glass basis-[33%] w-16 text-center"
        placeholder="fa"
        maxlength="2"
      />
      <XButton class="basis-[33%]" label="Hinzufügen" :disabled="busy || !name.trim()" @click="add" />
    </div>

    <div v-if="store.items.length" class="mt-4 flex flex-wrap gap-2">
      <span
        v-for="s in store.items"
        :key="s.seriesId"
        class="tax-chip"
      >
        <span class="chip-prefix">{{ s.prefix }}</span>
        <span class="chip-name">{{ s.name }}</span>
        <span
          class="chip-count has-tooltip"
          :data-tooltip="`${countFor(s.seriesId)} Buch/Bücher in dieser Reihe`"
          tabindex="0"
        >{{ countFor(s.seriesId) }}</span>
        <button
          class="chip-remove has-tooltip"
          data-tooltip="ALT + Rechtsklick zum PERMANENTEN Löschen (ich hoffe du weißt was du tust!!!)"
          @click.prevent
          @contextmenu.prevent="onRemoveContext($event, s.seriesId)"
          aria-label="Löschen mit ALT + Rechtsklick"
        >×</button>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import XButton from '@/components/atoms/XButton.vue'
import { useSeriesStore } from '@/stores/series'
import { useToastStore } from '@/stores/toast'
import { ApiClientError } from '@/api/client'
import type { BookDTO } from '@/types'

const props = defineProps<{ books?: BookDTO[] }>()

const store = useSeriesStore()
const toast = useToastStore()

const name = ref('')
const prefix = ref('')
const busy = ref(false)

// Pre-bucket the book list by seriesId once per books-array change so the
// per-chip count lookup stays O(1) even with hundreds of books.
const countBySeries = computed<Record<string, number>>(() => {
  const out: Record<string, number> = {}
  for (const b of props.books ?? []) {
    const id = b.bookSeriesId
    if (!id) continue
    out[id] = (out[id] ?? 0) + 1
  }
  return out
})

function countFor(seriesId: string): number {
  return countBySeries.value[seriesId] ?? 0
}

const add = async () => {
  if (!name.value.trim()) return
  busy.value = true
  try {
    const created = await store.add(name.value.trim(), prefix.value || undefined)
    toast.success(`Reihe „${created.name}" angelegt (Prefix: ${created.prefix})`)
    name.value = ''
    prefix.value = ''
  } catch (err) {
    if (err instanceof ApiClientError && err.details?.length) {
      toast.error(err.details.map((d) => `${d.field}: ${d.message}`).join(' — '), 'Konflikt')
    } else {
      toast.error((err as Error).message)
    }
  } finally {
    busy.value = false
  }
}

const remove = async (id: string) => {
  try {
    await store.remove(id)
    toast.success(`Reihe gelöscht`)
  } catch (err) {
    toast.error((err as Error).message)
  }
}

const onRemoveContext = (e: MouseEvent, id: string) => {
  if (e.altKey) remove(id)
}
</script>
