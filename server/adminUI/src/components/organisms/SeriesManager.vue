<template>
  <div class="taxonomy-section">
    <div class="tax-head">
      <h3 class="tax-title">Buchreihen</h3>
      <span class="count-badge">{{ store.items.length }}</span>
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
import { ref } from 'vue'
import XButton from '@/components/atoms/XButton.vue'
import { useSeriesStore } from '@/stores/series'
import { useToastStore } from '@/stores/toast'
import { ApiClientError } from '@/api/client'

const store = useSeriesStore()
const toast = useToastStore()

const name = ref('')
const prefix = ref('')
const busy = ref(false)

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
