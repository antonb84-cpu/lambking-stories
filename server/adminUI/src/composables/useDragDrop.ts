import { ref } from 'vue'

export interface DragDropState {
  isOver: boolean
  isUploading: boolean
  error: string | null
  filename: string | null
}

export function useDragDrop(onFile: (file: File) => Promise<void> | void) {
  const isOver = ref(false)
  const isUploading = ref(false)
  const error = ref<string | null>(null)
  const filename = ref<string | null>(null)

  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    isOver.value = true
  }
  const onDragLeave = (e: DragEvent) => {
    e.preventDefault()
    isOver.value = false
  }
  const onDrop = async (e: DragEvent) => {
    e.preventDefault()
    isOver.value = false
    const file = e.dataTransfer?.files?.[0]
    if (file) await handle(file)
  }
  const onPick = async (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) await handle(file)
    input.value = ''
  }

  async function handle(file: File) {
    filename.value = file.name
    error.value = null
    isUploading.value = true
    try {
      await onFile(file)
    } catch (err) {
      error.value = (err as Error).message || 'Upload fehlgeschlagen'
    } finally {
      isUploading.value = false
    }
  }

  const reset = () => {
    isOver.value = false
    isUploading.value = false
    error.value = null
    filename.value = null
  }

  return { isOver, isUploading, error, filename, onDragOver, onDragLeave, onDrop, onPick, reset }
}
