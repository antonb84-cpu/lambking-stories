<template>
  <div v-if="toasts.length" class="fixed top-4 right-4 w-full max-w-sm z-50 space-y-2">
    <TransitionGroup name="fade">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="glass card !p-0 relative"
        :class="{
          'ring-1 ring-rose-400/50': t.kind === 'error',
          'ring-1 ring-emerald-400/50': t.kind === 'success',
        }"
      >
        <div class="flex justify-between">
          <div class="px-4 py-3 grow">
            <h4 v-if="t.title" class="font-semibold text-sm">{{ t.title }}</h4>
            <p v-if="t.message" class="text-sm text-stone-700">{{ t.message }}</p>
          </div>
          <button
            class="px-3 py-2 border-l border-white/50 hover:bg-white/30 rounded-r-[16px]"
            @click="remove(t.id)"
          >
            ×
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '@/stores/toast'
import { storeToRefs } from 'pinia'

const store = useToastStore()
const { toasts } = storeToRefs(store)
const remove = (id: string) => store.remove(id)
</script>

<style scoped>
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 180ms ease-out,
  transform 180ms ease-out;
}
</style>
