/**
 * Book dropdown (`BookBrowser`).
 *
 * Covers the two browse aids layered on top of the plain list:
 *   - a pinned "Zuletzt bearbeitet" group carrying the last opened/edited
 *     books, rendered with the lightblue `.bb-item-recent` row style;
 *   - foldable series groups whose state persists to localStorage, with an
 *     active search overriding the fold so no match can hide.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { BookDTO, SeriesDTO } from '@/types'

// The `localStorage` this worker exposes is a stub without `clear` or
// iteration, so swap in a real in-memory Storage. Both the fold state and
// the recent-books history are read at module-eval time, which is why every
// mount below goes through `vi.resetModules()` + a dynamic import.
const store = new Map<string, string>()
vi.stubGlobal('localStorage', {
  get length() {
    return store.size
  },
  key: (i: number) => [...store.keys()][i] ?? null,
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear()
} satisfies Storage)

function book(bookId: string, bookSeriesId: string, title: string): BookDTO {
  return {
    bookId,
    author: '',
    category: '',
    bookSeriesId,
    releaseDate: '',
    badges: [],
    websiteTags: [],
    websitePrice: '',
    previewImage: {},
    audio: {},
    attachments: [],
    localizations: { de: { title, shortDescription: '', description: '', content: [] } },
    isPublished: true
  }
}

const series: SeriesDTO[] = [
  { seriesId: 's-fa', name: 'Fruit Agents', prefix: 'fa' },
  { seriesId: 's-bb', name: 'Bibel Basics', prefix: 'bb' }
]

const books: BookDTO[] = [
  book('fa-1', 's-fa', 'Erster Fall'),
  book('fa-2', 's-fa', 'Zweiter Fall'),
  book('bb-1', 's-bb', 'Schöpfung'),
  book('solo-1', '', 'Einzelstück')
]

// The recent history is a module-level singleton seeded from localStorage at
// import time, so each test re-imports the component with a fresh store.
async function freshBrowser(opts: { recent?: string[]; expanded?: string[]; selected?: string } = {}) {
  localStorage.clear()
  if (opts.recent) localStorage.setItem('adminui.recentBooks', JSON.stringify(opts.recent))
  if (opts.expanded) {
    localStorage.setItem('adminui.bookBrowser.expandedGroups', JSON.stringify(opts.expanded))
  }
  vi.resetModules()
  const mod = await import('@/components/organisms/BookBrowser.vue')
  const wrapper = mount(mod.default, {
    props: { books, series, selected: opts.selected ?? '' }
  })
  await wrapper.find('input').trigger('focus')
  return wrapper
}

function groupLabels(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('.bb-group-name').map((n) => n.text())
}

describe('BookBrowser', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('folds every series by default and unfolds one on click', async () => {
    const w = await freshBrowser()

    // Headers are listed, rows are not.
    expect(groupLabels(w)).toEqual(['Bibel Basics (bb)', 'Fruit Agents (fa)', 'Ohne Buchreihe'])
    expect(w.findAll('.bb-item')).toHaveLength(0)

    await w.findAll('.bb-group-header')[1]!.trigger('click')

    const ids = w.findAll('.bb-item-id').map((n) => n.text())
    expect(ids).toEqual(['fa-1', 'fa-2'])
    expect(JSON.parse(localStorage.getItem('adminui.bookBrowser.expandedGroups')!)).toContain('s-fa')
  })

  it('restores the persisted fold state and folds again on a second click', async () => {
    const w = await freshBrowser({ expanded: ['s-bb'] })

    expect(w.findAll('.bb-item-id').map((n) => n.text())).toEqual(['bb-1'])

    const bbHeader = w.findAll('.bb-group-header')[0]!
    await bbHeader.trigger('click')

    expect(w.findAll('.bb-item')).toHaveLength(0)
    expect(JSON.parse(localStorage.getItem('adminui.bookBrowser.expandedGroups')!)).not.toContain('s-bb')
  })

  it('pins the last four opened books on top with the lightblue row style', async () => {
    // Five ids, one of them deleted server-side ('gone') — the dropdown shows
    // the four that still resolve, newest first.
    const w = await freshBrowser({ recent: ['solo-1', 'gone', 'bb-1', 'fa-2', 'fa-1'] })

    expect(groupLabels(w)[0]).toBe('Zuletzt bearbeitet')

    const recentRows = w.findAll('.bb-item-recent')
    expect(recentRows.map((r) => r.find('.bb-item-id').text())).toEqual([
      'solo-1',
      'bb-1',
      'fa-2',
      'fa-1'
    ])
    // Only the pinned block is tinted — the catalogue rows below are not.
    expect(w.findAll('.bb-item')).toHaveLength(4)
  })

  it('emits the picked book from a pinned row', async () => {
    const w = await freshBrowser({ recent: ['bb-1'] })

    await w.find('.bb-item-recent').trigger('click')

    expect(w.emitted('select')).toEqual([['bb-1']])
  })

  it('opens every matching group while searching and disables folding', async () => {
    const w = await freshBrowser()

    const input = w.find('input')
    await input.setValue('fall')

    // Both fa books match despite the series being folded in storage.
    expect(w.findAll('.bb-item-id').map((n) => n.text())).toEqual(['fa-1', 'fa-2'])
    expect(groupLabels(w)).toEqual(['Fruit Agents (fa)'])
    expect(w.find('.bb-group-header').attributes('disabled')).toBeDefined()
  })

  it('unfolds the series holding the selected book when the panel opens', async () => {
    const w = await freshBrowser({ selected: 'bb-1' })

    expect(w.findAll('.bb-item-id').map((n) => n.text())).toEqual(['bb-1'])
    expect(JSON.parse(localStorage.getItem('adminui.bookBrowser.expandedGroups')!)).toContain('s-bb')
  })
})
