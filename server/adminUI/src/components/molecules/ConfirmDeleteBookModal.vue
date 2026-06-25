<template>
  <div
    class="cd-overlay"
    role="dialog"
    aria-modal="true"
    @click.self="$emit('cancel')"
  >
    <div class="cd-dialog">
      <h2 class="cd-title">PERMANENT LÖSCHEN</h2>
      <p class="cd-body">Willst du dieses Buch wirklich PERMANENT LÖSCHEN? Diese Aktion is nicht umkehrbar.</p>
      <p v-if="bookLabel" class="cd-target">{{ bookLabel }}</p>
      <div class="cd-actions">
        <button type="button" class="cd-cancel" @click="$emit('cancel')">Abbrechen</button>
        <button type="button" class="cd-confirm" @click="$emit('confirm')">Ja, PERMANENT LÖSCHEN</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ bookLabel?: string }>()
defineEmits<{ cancel: []; confirm: [] }>()
</script>

<style scoped>
.cd-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(20, 30, 60, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  animation: cd-fade-in 0.16s ease-out;
}

.cd-dialog {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 18px;
  padding: 22px 22px 18px;
  box-shadow: 0 20px 60px -16px rgba(20, 30, 60, 0.45),
  0 6px 20px -6px rgba(20, 30, 60, 0.25);
  animation: cd-pop-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.cd-title {
  margin: 0 0 8px;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #b02828;
  text-transform: uppercase;
}

.cd-body {
  margin: 0 0 8px;
  font-size: 0.95rem;
  line-height: 1.45;
  color: #1c1917;
}

.cd-target {
  margin: 0 0 18px;
  font-size: 0.85rem;
  color: #44403c;
  font-family: 'Nunito', ui-monospace, SFMono-Regular, Menlo, monospace;
  background: rgba(0, 0, 0, 0.04);
  padding: 6px 10px;
  border-radius: 8px;
  word-break: break-word;
}

.cd-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.cd-cancel,
.cd-confirm {
  font: inherit;
  font-weight: 700;
  font-size: 0.88rem;
  border: none;
  cursor: pointer;
  padding: 10px 18px;
  border-radius: 999px;
  transition: transform 0.1s, box-shadow 0.13s, opacity 0.13s;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.cd-cancel {
  background: linear-gradient(135deg, #2eaa55, #1f8b41);
  color: #ffffff;
  box-shadow: 0 4px 12px -4px rgba(31, 139, 65, 0.5);
}

.cd-cancel:hover {
  box-shadow: 0 8px 18px -6px rgba(31, 139, 65, 0.6);
}

.cd-confirm {
  background: linear-gradient(135deg, #d83a3a, #b02828);
  color: #ffffff;
  box-shadow: 0 4px 12px -4px rgba(176, 40, 40, 0.55);
}

.cd-confirm:hover {
  box-shadow: 0 8px 18px -6px rgba(176, 40, 40, 0.65);
}

.cd-cancel:active,
.cd-confirm:active {
  transform: scale(0.96);
}

@keyframes cd-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes cd-pop-in {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
