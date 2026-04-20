<template>
  <div v-if="status" class="upload-status" :class="status.ok ? 'is-ok' : 'is-err'">
    <template v-if="status.ok">
      <CheckCircle2 class="w-4 h-4 text-emerald-700 flex-shrink-0" />
      <span class="label text-emerald-800 font-semibold">{{ status.filename }}</span>
    </template>
    <template v-else>
      <XCircle class="w-4 h-4 text-rose-700 flex-shrink-0" />
      <span class="label text-rose-800 font-medium">{{ status.message ?? 'Upload fehlgeschlagen' }}</span>
    </template>
  </div>
  <div v-else-if="hint" class="upload-hint text-stone-500 truncate">{{ hint }}</div>
</template>

<script setup lang="ts">
import { CheckCircle2, XCircle } from 'lucide-vue-next'

defineProps<{
  status: { ok: boolean; filename?: string; message?: string } | null
  hint?: string
}>()
</script>

<style scoped>
.upload-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  margin-top: 4px;
  border-radius: 999px;
  font-size: 11.5px;
  max-width: 100%;
  line-height: 1.2;
}

.upload-status.is-ok {
  background: rgba(16, 122, 87, 0.12);
  border: 1px solid rgba(16, 122, 87, 0.3);
}

.upload-status.is-err {
  background: rgba(185, 50, 50, 0.1);
  border: 1px solid rgba(185, 50, 50, 0.3);
}

.upload-status .label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.upload-hint {
  font-size: 11px;
  color: #8a6a3c;
}
</style>
