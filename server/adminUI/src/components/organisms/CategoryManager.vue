<template>
  <div class="taxonomy-section">
    <div class="tax-head">
      <h3 class="tax-title">Kategorien</h3>
      <span class="count-badge">{{ store.items.length }}</span>
    </div>
    <div class="flex items-stretch gap-1">
      <input
        v-model="name"
        class="glass flex-1"
        placeholder="Neue Kategorie"
        @keydown.enter.prevent="add"
      />
      <XButton label="Hinzufügen" :disabled="busy || !name.trim()" @click="add" />
    </div>

    <div v-if="store.items.length" class="mt-4 flex flex-wrap gap-2">
      <span
        v-for="c in store.items"
        :key="c.name"
        class="tax-chip"
      >
        <span class="chip-name">{{ c.name }}</span>
        <button
          class="chip-remove has-tooltip"
          data-tooltip="ALT + Rechtsklick zum PERMANENTEN Löschen (ich hoffe du weißt was du tust!!!)"
          @click.prevent
          @contextmenu.prevent="onRemoveContext($event, c.name)"
          aria-label="Löschen mit ALT + Rechtsklick"
        >×</button>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import XButton from '@/components/atoms/XButton.vue'
import { useCategoryStore } from '@/stores/categories'
import { useToastStore } from '@/stores/toast'

const store = useCategoryStore()
const toast = useToastStore()
const name = ref('')
const busy = ref(false)

const add = async () => {
  const trimmed = name.value.trim()
  if (!trimmed) return
  busy.value = true
  try {
    await store.add(trimmed)
    toast.success(`Kategorie „${trimmed}" angelegt`)
    name.value = ''
  } catch (err) {
    toast.error((err as Error).message)
  } finally {
    busy.value = false
  }
}

const remove = async (n: string) => {
  try {
    await store.remove(n)
    toast.success(`Kategorie „${n}" gelöscht`)
  } catch (err) {
    toast.error((err as Error).message)
  }
}

const onRemoveContext = (e: MouseEvent, n: string) => {
  if (e.altKey) remove(n)
}
</script>
