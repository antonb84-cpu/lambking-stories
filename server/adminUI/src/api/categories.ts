import { apiClient } from './client'
import type { CategoryDTO } from '@/types'

export const categoriesApi = {
  list: () => apiClient.get<{ categories: CategoryDTO[] }>('/api/categories').then((r) => r.categories),
  create: (name: string) =>
    apiClient.post<{ category: CategoryDTO }>('/api/categories', { name }).then((r) => r.category),
  remove: (name: string) => apiClient.del<void>(`/api/categories/${encodeURIComponent(name)}`)
}
