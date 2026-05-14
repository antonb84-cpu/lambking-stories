import type { ApiBook, ApiBookListResponse, ApiBookResponse } from '@/types/apiBook'
import { getApiBase } from '@/use/useApiConfig'

// Per-build client key. Each distribution channel (Tauri Android, GitHub
// Pages, etc.) ships with its own value injected at build time via the
// matching `.env.<target>` file. The server's `requireClientKey`
// middleware uses it for attribution + as the trigger to flip CORS into
// permissive mode (so the Tauri WebView's `https://tauri.localhost`
// origin doesn't have to be allowlisted). Empty string disables the
// header — the server side then falls back to legacy behaviour, which
// keeps `pnpm dev` against an unconfigured backend working.
const CLIENT_KEY: string = (import.meta.env.VITE_CLIENT_KEY ?? '').trim()

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Resolve the base at request time — the runtime feature flag in
  // `useApiConfig` may have flipped between Render and a local dev
  // server after module load.
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

export const booksApi = {
  get apiBase(): string {
    return getApiBase()
  },

  async list(): Promise<ApiBook[]> {
    const data = await request<ApiBookListResponse>('/api/books')
    return data.books ?? []
  },

  async getById(bookId: string): Promise<ApiBook> {
    const data = await request<ApiBookResponse>(`/api/book/${encodeURIComponent(bookId)}`)
    return data.book
  }
}
