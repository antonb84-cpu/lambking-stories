<template lang="pug">
  div(
    v-if="serverStatus.state.value === 'down'"
    class="server-banner is-down"
    role="alert"
    aria-live="assertive"
  )
    div(class="server-banner-inner")
      strong Die Webseite kann den Server nicht erreichen. Der Server ist vermutlich in Wartung.
  div(
    v-else-if="serverStatus.state.value === 'recovering'"
    class="server-banner is-up"
    role="status"
    aria-live="polite"
  )
    div(class="server-banner-inner")
      strong Server is up again, continue
  LayoutSwitcher
  component(:is="layout === 'b' ? LayoutB : LayoutA")
</template>

<script setup lang="ts">
import LayoutSwitcher from '@/components/LayoutSwitcher.vue'
import LayoutA from '@/layouts/LayoutA.vue'
import LayoutB from '@/layouts/LayoutB.vue'
import { useLayout } from '@/composables/useLayout'
import { useServerStatus } from '@/composables/useServerStatus'

const { layout } = useLayout()
const serverStatus = useServerStatus()
</script>

<style scoped lang="scss">
.server-banner {
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  padding: 10px 18px;
  text-align: center;
  font-size: 13px;
  letter-spacing: 0.01em;
  box-shadow: 0 6px 18px -10px rgba(0, 0, 0, 0.45);
}

.server-banner.is-down {
  background: linear-gradient(135deg, #b91c1c 0%, #dc2626 60%, #ef4444 100%);
  color: #fff7f7;
  border-bottom: 1px solid rgba(255, 255, 255, 0.25);
}

.server-banner.is-up {
  background: linear-gradient(135deg, #15803d 0%, #16a34a 60%, #22c55e 100%);
  color: #f0fdf4;
  border-bottom: 1px solid rgba(255, 255, 255, 0.25);
}

.server-banner-inner {
  max-width: 1100px;
  margin: 0 auto;
}
</style>
