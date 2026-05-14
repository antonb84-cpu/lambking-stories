/**
 * Tiny reactive cache for the public series list. Mirrors the shape of
 * `useApiBooks` so views can stay consistent.
 *
 * The legacy `useModels.getSeries` still exists for back-compat
 * consumers (it reads from the hardcoded `BOOK_SERIES` constant);
 * `useApiSeries.getById` returns the *server* truth and is the one
 * surface that carries the editor-uploaded `coverImage`.
 */
import { reactive, readonly } from 'vue'
import { seriesApi } from '@/api/seriesApi'
import type { ApiSeries } from '@/types/apiBook'

const state = reactive<{
  byId: Record<string, ApiSeries>
  all: ApiSeries[] | null
  loading: boolean
  error: string | null
}>({
  byId: {},
  all: null,
  loading: false,
  error: null
})

let inflight: Promise<ApiSeries[]> | null = null

async function loadAll(): Promise<ApiSeries[]> {
  if (inflight) return inflight
  if (state.all && state.all.length) return state.all
  state.loading = true
  inflight = (async () => {
    try {
      const list = await seriesApi.list()
      state.all = list
      for (const s of list) state.byId[s.seriesId] = s
      return list
    } catch (err) {
      state.error = (err as Error).message
      return state.all ?? []
    } finally {
      state.loading = false
      inflight = null
    }
  })()
  return inflight
}

export default function useApiSeries() {
  return {
    state: readonly(state),
    loadAll,
    getById: (id: string): ApiSeries | null => state.byId[id] ?? null
  }
}
