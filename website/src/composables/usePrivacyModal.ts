import { ref } from 'vue'

const isOpen = ref(false)

export function usePrivacyModal() {
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
