import { defineStore } from 'pinia'
import { ref } from 'vue'
import { seriesApi } from '@/api/series'
import type { SeriesDTO } from '@/types'

export const useSeriesStore = defineStore('series', () => {
  const items = ref<SeriesDTO[]>([])
  const loading = ref(false)

  const load = async () => {
    loading.value = true
    try {
      items.value = await seriesApi.list()
    } finally {
      loading.value = false
    }
  }

  const add = async (name: string, prefix?: string) => {
    const created = await seriesApi.create(name, prefix)
    items.value.push(created)
    return created
  }

  const remove = async (id: string) => {
    await seriesApi.remove(id)
    items.value = items.value.filter((s) => s.seriesId !== id)
  }

  // Reordering renumbers every series, so the server's response replaces
  // the list wholesale — patching a single entry would leave the rest of
  // the chips showing stale positions.
  const setOrder = async (id: string, sortOrder: number) => {
    items.value = await seriesApi.setOrder(id, sortOrder)
    return items.value
  }

  // Atomic cover upload — calls the dedicated server endpoint that
  // saves the file and writes the URL back onto the series in one shot,
  // then patches the local cache so the SeriesManager preview updates
  // immediately.
  const uploadCover = async (seriesId: string, file: File) => {
    const updated = await seriesApi.uploadCover(seriesId, file)
    const idx = items.value.findIndex((s) => s.seriesId === seriesId)
    if (idx >= 0) items.value[idx] = updated
    return updated
  }

  return { items, loading, load, add, remove, setOrder, uploadCover }
})
