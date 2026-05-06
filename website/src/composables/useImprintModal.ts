import { ref } from 'vue'

const isOpen = ref(false)

export function useImprintModal() {
  return {
    isOpen,
    open: () => {
      isOpen.value = true
    },
    close: () => {
      isOpen.value = false
    }
  }
}
