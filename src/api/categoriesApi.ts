/**
 * Public categories fetcher. Mirrors `seriesApi`'s pattern so we share
 * the runtime base-URL feature flag (`useApiConfig`) and the shared
 * `apiHeaders` (client key + anonymous usage id).
 */
import type { ApiCategory, ApiCategoryListResponse } from '@/types/apiBook'
import { getApiBase } from '@/use/useApiConfig'
import { buildApiHeaders } from '@/api/apiHeaders'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const apiBase = getApiBase()
  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: buildApiHeaders(init?.headers)
  })
  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText} on ${path}`)
  }
  return (await res.json()) as T
}

export const categoriesApi = {
  async list(): Promise<ApiCategory[]> {
    const data = await request<ApiCategoryListResponse>('/api/categories')
    return data.categories ?? []
  }
}
