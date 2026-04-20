import { defineStore } from 'pinia'
import { ref } from 'vue'
import { categoriesApi } from '@/api/categories'
import type { CategoryDTO } from '@/types'

export const useCategoryStore = defineStore('categories', () => {
  const items = ref<CategoryDTO[]>([])

  const load = async () => {
    items.value = await categoriesApi.list()
  }

  const add = async (name: string) => {
    const created = await categoriesApi.create(name)
    items.value.push(created)
    return created
  }

  const remove = async (name: string) => {
    await categoriesApi.remove(name)
    items.value = items.value.filter((c) => c.name !== name)
  }

  return { items, load, add, remove }
})
