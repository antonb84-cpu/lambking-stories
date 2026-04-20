<template>
  <!-- This element intentionally creates layout shift as attachments are added,
       signaling successful upload to the admin (per spec). -->
  <div v-if="items.length" class="flex flex-col gap-0.5 mt-3">
    <div
      v-for="(url, i) in items"
      :key="url"
      class="attachment-card"
    >
      <FileText class="w-4 h-4 text-rose-500 flex-shrink-0" />
      <a :href="url" class="attachment-name" target="_blank">
        {{ friendlyName(url) }}
      </a>
      <button
        class="attachment-remove"
        @click="emit('remove', i)"
        aria-label="Entfernen"
      >
        <Trash2 class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileText, Trash2 } from 'lucide-vue-next'

defineProps<{ items: string[] }>()
const emit = defineEmits<{ remove: [index: number] }>()

const friendlyName = (url: string) => {
  const parts = url.split('/')
  return parts[parts.length - 1]
}
</script>

<style scoped>
.attachment-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 40px 10px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(190, 140, 80, 0.25);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset,
  0 6px 16px -12px rgba(120, 90, 50, 0.2);
  transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
}

.attachment-card:hover {
  background: rgba(255, 250, 242, 0.95);
  transform: translateY(-1px);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.95) inset,
  0 10px 22px -12px rgba(120, 90, 50, 0.3);
}

.attachment-name {
  font-size: 12px;
  color: #3a2a14;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.attachment-name:hover {
  text-decoration: underline;
}

.attachment-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(120, 80, 50, 0.55);
  cursor: pointer;
  transition: background 140ms ease, color 140ms ease;
}

.attachment-remove:hover {
  background: rgba(225, 90, 90, 0.12);
  color: #b83535;
}
</style>
