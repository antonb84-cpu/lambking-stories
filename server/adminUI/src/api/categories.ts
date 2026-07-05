import { apiClient } from './client'
import type { CategoryDTO } from '@/types'

export const categoriesApi = {
  list: () => apiClient.get<{ categories: CategoryDTO[] }>('/api/categories').then((r) => r.categories),
  create: (name: string) =>
    apiClient.post<{ category: CategoryDTO }>('/api/categories', { name }).then((r) => r.category),
  remove: (name: string) => apiClient.del<void>(`/api/categories/${encodeURIComponent(name)}`),
  // Atomic upload + persist of the category icon. The client posts
  // multipart with field name "file"; the server saves the file and
  // writes the URL onto the category doc in one round trip.
  uploadIcon: (name: string, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiClient
      .post<{ category: CategoryDTO }>(`/api/categories/${encodeURIComponent(name)}/icon`, fd)
      .then((r) => r.category)
  }
}
