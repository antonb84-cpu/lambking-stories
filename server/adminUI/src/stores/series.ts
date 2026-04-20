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

  return { items, loading, load, add, remove }
})
