import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Toast {
  id: string
  title?: string
  message: string
  kind?: 'success' | 'error' | 'info'
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  const push = (t: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID()
    toasts.value.push({ ...t, id })
    setTimeout(() => remove(id), 5000)
  }

  const remove = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  const success = (message: string, title?: string) => push({ message, title, kind: 'success' })
  const error = (message: string, title?: string) => push({ message, title, kind: 'error' })
  const info = (message: string, title?: string) => push({ message, title, kind: 'info' })

  return { toasts, push, remove, success, error, info }
})
