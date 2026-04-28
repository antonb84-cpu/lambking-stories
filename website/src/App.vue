<template lang="pug">
  LayoutSwitcher
  component(:is="layout === 'b' ? LayoutB : LayoutA")
</template>

<script setup lang="ts">
import LayoutSwitcher from '@/components/LayoutSwitcher.vue'
import LayoutA from '@/layouts/LayoutA.vue'
import LayoutB from '@/layouts/LayoutB.vue'
import { useLayout } from '@/composables/useLayout'

const { layout } = useLayout()
</script>
