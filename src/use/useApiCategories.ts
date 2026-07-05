/**
 * Tiny reactive cache for the public category list. Mirrors the shape of
 * `useApiSeries` so views can stay consistent. Carries the
 * editor-uploaded `icon` for each category; the home page's category
 * list section is the primary consumer.
 */
import { reactive, readonly } from 'vue'
import { categoriesApi } from '@/api/categoriesApi'
import type { ApiCategory } from '@/types/apiBook'

const state = reactive<{
  byName: Record<string, ApiCategory>
  all: ApiCategory[] | null
  loading: boolean
  error: string | null
}>({
  byName: {},
  all: null,
  loading: false,
  error: null
})

let inflight: Promise<ApiCategory[]> | null = null

async function loadAll(): Promise<ApiCategory[]> {
  if (inflight) return inflight
  if (state.all && state.all.length) return state.all
  state.loading = true
  inflight = (async () => {
    try {
      const list = await categoriesApi.list()
      state.all = list
      for (const c of list) state.byName[c.name] = c
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

export default function useApiCategories() {
  return {
    state: readonly(state),
    loadAll,
    getByName: (name: string): ApiCategory | null => state.byName[name] ?? null
  }
}
