import { describe, it, expect } from 'vitest'
import { detectChapters, isChapterLine } from '@/composables/useChapterDetector'

describe('detectChapters', () => {
  it('splits markdown headings into pages', () => {
    const md = `# Erstes Kapitel\nErster Absatz.\n\n# Zweites Kapitel\nZweiter Absatz.`
    const pages = detectChapters(md)
    expect(pages).toHaveLength(2)
    expect(pages[0]!.title).toBe('Erstes Kapitel')
    expect(pages[0]!.page).toBe(1)
    expect(pages[1]!.title).toBe('Zweites Kapitel')
    expect(pages[1]!.page).toBe(2)
  })

  it('splits on "Kapitel N" lines', () => {
    const md = `Kapitel 1: Der Anfang\nEs war einmal.\n\nKapitel 2: Die Reise\nDanach reisten sie.`
    const pages = detectChapters(md)
    expect(pages).toHaveLength(2)
    expect(pages[0]!.title).toBe('Der Anfang')
    expect(pages[1]!.title).toBe('Die Reise')
  })

  it('returns one page when no chapter headings exist', () => {
    const pages = detectChapters('einfach etwas Text ohne Kapitel')
    expect(pages).toHaveLength(1)
  })

  it('detects chapter lines', () => {
    expect(isChapterLine('# Intro')).toBe(true)
    expect(isChapterLine('Kapitel 3: Das Ende')).toBe(true)
    expect(isChapterLine('Chapter 1 - Start')).toBe(true)
    expect(isChapterLine('just a line')).toBe(false)
  })
})
