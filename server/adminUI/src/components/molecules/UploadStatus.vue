<template>
  <div v-if="status" class="upload-status" :class="status.ok ? 'is-ok' : 'is-err'">
    <template v-if="status.ok">
      <CheckCircle2 class="icon w-4 h-4 flex-shrink-0" />
      <span class="label filename">{{ status.filename }}</span>
    </template>
    <template v-else>
      <XCircle class="icon w-4 h-4 flex-shrink-0" />
      <span class="label error">{{ status.message ?? 'Upload fehlgeschlagen' }}</span>
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
/* The badge is the user's only post-upload signal that the file landed —
 * tuned to be unmissable. Bright saturated colors, bold weight, generous
 * padding, and a soft glow ring. */
.upload-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 14px;
  margin-top: 6px;
  border-radius: 10px;
  font-size: 12.5px;
  font-weight: 800;
  max-width: 100%;
  line-height: 1.25;
  letter-spacing: 0.005em;
  word-break: break-word;
}

.upload-status.is-ok {
  background: #ecfdf5;
  color: #047857;
  border: 1.5px solid #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
}

.upload-status.is-ok .icon {
  color: #059669;
}

.upload-status.is-err {
  background: #fef2f2;
  color: #b91c1c;
  border: 1.5px solid #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.18);
}

.upload-status.is-err .icon {
  color: #dc2626;
}

.upload-status .label {
  font-weight: 800;
  white-space: normal;
  /* Cap so a pathological filename can't push the layout, but allow wrap so
   * a long error message reads as full text instead of "…" + invisible. */
  max-width: 320px;
}

.upload-status .filename {
  /* Bright high-contrast green for the success filename. */
  color: #047857;
}

.upload-status .error {
  color: #b91c1c;
}

.upload-hint {
  font-size: 11px;
  color: #8a6a3c;
}
</style>
