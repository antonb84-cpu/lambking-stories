<template lang="pug">
  .layout-switcher(role="group", aria-label="Layout-Variante wählen")
    button.opt(
      :class="{ active: layout === 'a' }",
      type="button",
      aria-label="Layout A — klassisch",
      @click="setLayout('a')"
    ) A
    button.opt(
      :class="{ active: layout === 'b' }",
      type="button",
      aria-label="Layout B — Funnel",
      @click="setLayout('b')"
    ) B
</template>

<script setup lang="ts">
import { useLayout } from '@/composables/useLayout'

const { layout, setLayout } = useLayout()
</script>

<style scoped lang="scss">
.layout-switcher {
  position: fixed;
  top: 14px;
  right: 14px;
  z-index: 200;
  display: inline-flex;
  background: rgba(26, 31, 58, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  padding: 4px;
  gap: 2px;
  box-shadow: 0 4px 14px rgba(26, 31, 58, 0.18);
}

.opt {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: rgba(250, 244, 234, 0.55);
  font-family: 'Fraunces', serif;
  font-size: 14px;
  font-weight: 600;
  font-style: italic;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--cream);
  }

  &.active {
    background: var(--gold);
    color: var(--navy-deep);
  }
}

@media (max-width: 540px) {
  .layout-switcher {
    top: auto;
    bottom: 14px;
    right: 14px;
  }
}
</style>
