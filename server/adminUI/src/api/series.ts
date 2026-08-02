import { apiClient } from './client'
import type { SeriesDTO } from '@/types'

export const seriesApi = {
  list: () => apiClient.get<{ series: SeriesDTO[] }>('/api/book-series').then((r) => r.series),
  create: (name: string, prefix?: string) =>
    apiClient.post<{ series: SeriesDTO }>('/api/book-series', { name, prefix }).then((r) => r.series),
  remove: (id: string) => apiClient.del<void>(`/api/book-series/${encodeURIComponent(id)}`),
  // Moves a series to `sortOrder` (1-based) and returns the whole
  // re-numbered list — every other position shifts, so the server answers
  // with the new truth instead of a single record.
  setOrder: (id: string, sortOrder: number) =>
    apiClient
      .put<{ series: SeriesDTO[] }>(`/api/book-series/${encodeURIComponent(id)}/order`, { sortOrder })
      .then((r) => r.series),
  // Atomic upload + persist of the series banner image. The client posts
  // multipart with field name "file"; the server saves the file and
  // writes the URL onto the series doc in one round trip.
  uploadCover: (seriesId: string, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiClient
      .post<{ series: SeriesDTO }>(`/api/book-series/${encodeURIComponent(seriesId)}/cover`, fd)
      .then((r) => r.series)
  }
}
