/**
 * Public categories fetcher. Mirrors `seriesApi`'s pattern so we share
 * the runtime base-URL feature flag (`useApiConfig`) and the
 * `X-Client-Key` attribution header.
 */
import type { ApiCategory, ApiCategoryListResponse } from '@/types/apiBook'
import { getApiBase } from '@/use/useApiConfig'

const CLIENT_KEY: string = (import.meta.env.VITE_CLIENT_KEY ?? '').trim()

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const apiBase = getApiBase()
  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      ...(CLIENT_KEY ? { 'X-Client-Key': CLIENT_KEY } : {}),
      ...(init?.headers ?? {})
    }
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
