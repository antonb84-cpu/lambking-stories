<template>
  <div
    class="cd-overlay"
    role="dialog"
    aria-modal="true"
    @click.self="$emit('stay')"
  >
    <div class="cd-dialog">
      <h2 class="cd-title">{{ title }}</h2>
      <p class="cd-body">{{ body }}</p>
      <div class="cd-actions">
        <button
          type="button"
          class="cd-stay"
          @click="$emit('stay')"
        >{{ stayLabel }}
        </button>
        <button
          type="button"
          class="cd-discard"
          @click="$emit('discard')"
        >{{ discardLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    body: string
    stayLabel?: string
    discardLabel?: string
  }>(),
  {
    stayLabel: 'Weiter bearbeiten',
    discardLabel: 'Verwerfen'
  }
)

defineEmits<{ stay: []; discard: [] }>()
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
  max-width: 380px;
  background: #fff;
  border-radius: 18px;
  padding: 22px 22px 18px;
  box-shadow: 0 20px 60px -16px rgba(20, 30, 60, 0.45),
  0 6px 20px -6px rgba(20, 30, 60, 0.25);
  animation: cd-pop-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.cd-title {
  margin: 0 0 8px;
  font-size: 1.1rem;
  font-weight: 900;
  color: #1c1917;
}

.cd-body {
  margin: 0 0 18px;
  font-size: 0.92rem;
  line-height: 1.45;
  color: #44403c;
}

.cd-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.cd-stay,
.cd-discard {
  font: inherit;
  font-weight: 800;
  font-size: 0.88rem;
  border: none;
  cursor: pointer;
  padding: 9px 16px;
  border-radius: 999px;
  transition: background 0.13s, transform 0.1s;
}

.cd-stay {
  background: rgba(52, 152, 219, 0.12);
  color: #2471a3;
  border: 1.5px solid rgba(52, 152, 219, 0.35);
}

.cd-stay:hover {
  background: rgba(52, 152, 219, 0.2);
}

.cd-discard {
  background: linear-gradient(135deg, #b04060, #d05080);
  color: #fff;
  box-shadow: 0 4px 12px -4px rgba(176, 64, 96, 0.45);
}

.cd-stay:active,
.cd-discard:active {
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
