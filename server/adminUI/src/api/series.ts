import { apiClient } from './client'
import type { SeriesDTO } from '@/types'

export const seriesApi = {
  list: () => apiClient.get<{ series: SeriesDTO[] }>('/api/book-series').then((r) => r.series),
  create: (name: string, prefix?: string) =>
    apiClient.post<{ series: SeriesDTO }>('/api/book-series', { name, prefix }).then((r) => r.series),
  remove: (id: string) => apiClient.del<void>(`/api/book-series/${encodeURIComponent(id)}`)
}
