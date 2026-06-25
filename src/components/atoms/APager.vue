<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: number
  total: number
  skip?: number
  showJumps?: boolean
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  skip: 5,
  showJumps: true,
  ariaLabel: 'Pagination'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const isFirst = computed(() => props.modelValue <= 1)
const isLast = computed(() => props.modelValue >= props.total)

function go(page: number) {
  if (!props.total) return
  const next = Math.min(props.total, Math.max(1, page))
  if (next === props.modelValue) return
  emit('update:modelValue', next)
}

const goFirst = () => go(1)
const goLast = () => go(props.total)
const goPrev = () => go(props.modelValue - 1)
const goNext = () => go(props.modelValue + 1)
const skipBack = () => go(props.modelValue - props.skip)
const skipForward = () => go(props.modelValue + props.skip)
</script>

<template lang="pug">
  nav(
    class="a-pager flex items-center justify-center gap-1.5 md:gap-2"
    :aria-label="ariaLabel"
  )
    button(
      v-if="showJumps"
      type="button"
      @click="goFirst"
      :disabled="isFirst"
      aria-label="First page"
      class="a-pager-btn"
    )
      svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 md:w-5 md:h-5")
        path(d="M19 19 12 12l7-7")
        path(d="M11 19 4 12l7-7")

    button(
      v-if="showJumps"
      type="button"
      @click="skipBack"
      :disabled="isFirst"
      :aria-label="`Skip back ${skip} pages`"
      class="a-pager-btn a-pager-skip relative"
    )
      svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 md:w-5 md:h-5")
        path(d="m15 19-7-7 7-7")
      span(class="a-pager-skip-num") {{ skip }}

    button(
      type="button"
      @click="goPrev"
      :disabled="isFirst"
      aria-label="Previous page"
      class="a-pager-btn a-pager-btn--accent"
    )
      svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 md:w-6 md:h-6")
        path(d="m15 18-6-6 6-6")

    div(class="a-pager-indicator select-none tabular-nums")
      span(class="a-pager-current") {{ modelValue }}
      span(class="a-pager-sep") /
      span(class="a-pager-total") {{ total }}

    button(
      type="button"
      @click="goNext"
      :disabled="isLast"
      aria-label="Next page"
      class="a-pager-btn a-pager-btn--accent"
    )
      svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 md:w-6 md:h-6")
        path(d="m9 18 6-6-6-6")

    button(
      v-if="showJumps"
      type="button"
      @click="skipForward"
      :disabled="isLast"
      :aria-label="`Skip forward ${skip} pages`"
      class="a-pager-btn a-pager-skip relative"
    )
      svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 md:w-5 md:h-5")
        path(d="m9 5 7 7-7 7")
      span(class="a-pager-skip-num") {{ skip }}

    button(
      v-if="showJumps"
      type="button"
      @click="goLast"
      :disabled="isLast"
      aria-label="Last page"
      class="a-pager-btn"
    )
      svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 md:w-5 md:h-5")
        path(d="m5 5 7 7-7 7")
        path(d="m13 5 7 7-7 7")
</template>

<style scoped lang="sass">
.a-pager
  -webkit-tap-highlight-color: transparent

.a-pager-btn
  display: inline-flex
  align-items: center
  justify-content: center
  width: 36px
  height: 36px
  border-radius: 999px
  background-color: var(--color-bg-card)
  color: var(--color-text-primary)
  border: 1.5px solid var(--color-border-subtle)
  cursor: pointer
  transition: transform 160ms ease-out, background-color 160ms ease-out, box-shadow 160ms ease-out, color 160ms ease-out

  &:hover:not(:disabled)
    background-color: var(--color-bg-active-pill)
    color: var(--color-text-link)
    border-color: rgba(126, 58, 242, 0.3)
    transform: translateY(-2px)
    box-shadow: 0 6px 14px -6px rgba(126, 58, 242, 0.45)

  &:active:not(:disabled)
    transform: translateY(1px) scale(0.94)

  &:disabled
    opacity: 0.35
    cursor: not-allowed

  @media (min-width: 768px)
    width: 40px
    height: 40px

.a-pager-btn--accent
  color: #ffffff
  border-color: transparent
  background: linear-gradient(180deg, #9560f4 0%, #7e3af2 100%)
  box-shadow: 0 5px 0 -1px #3d1676, 0 10px 20px -6px rgba(126, 58, 242, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 -2px 0 rgba(0, 0, 0, 0.18)

  &:hover:not(:disabled)
    background: linear-gradient(180deg, #a775ff 0%, #8a4cff 100%)
    color: #ffffff

  &:active:not(:disabled)
    transform: translateY(3px) scale(0.97)
    box-shadow: 0 2px 0 -1px #3d1676, 0 4px 10px -4px rgba(126, 58, 242, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)

.a-pager-skip-num
  position: absolute
  bottom: 2px
  left: 50%
  transform: translateX(-50%)
  font-size: 8px
  font-weight: 700
  line-height: 1

  @media (min-width: 768px)
    font-size: 9px

.a-pager-indicator
  display: inline-flex
  align-items: baseline
  gap: 4px
  padding: 6px 14px
  border-radius: 999px
  background-color: var(--color-bg-active-pill)
  border: 1px solid rgba(126, 58, 242, 0.15)
  font-weight: 700
  color: var(--color-text-link)

.a-pager-current
  font-size: 14px

.a-pager-sep
  opacity: 0.5
  font-weight: 700

.a-pager-total
  font-size: 12px
  opacity: 0.75
</style>
