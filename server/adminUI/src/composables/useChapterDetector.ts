import type { BookPage } from '@/types'

// Matches either a level-2+ markdown heading ("##" with an optional title)
// or a "Kapitel N" / "Chapter N" lead-in. h1 ("# ...") is treated as an
// in-page header title, not a page break — that's what the editor's H1
// toolbar button produces, and what splitting an h2 demotes to.
const CHAPTER_LINE = /^\s*(?:#{2,}(?:\s+(.*))?|(?:Kapitel|Chapter)\s+\d+[:.\s-]*(.*))\s*$/i

export function detectChapters(raw: string, fallbackTitle = 'Seite 1'): BookPage[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  const pages: BookPage[] = []
  let current: BookPage | null = null
  let page = 0

  for (const line of lines) {
    const match = CHAPTER_LINE.exec(line)
    if (match) {
      if (current) pages.push(finalize(current))
      page += 1
      const title = (match[1] ?? match[2] ?? '').trim()
      current = { page, title, text: '' }
    } else if (current) {
      current.text += (current.text ? '\n' : '') + line
    } else {
      page = 1
      current = { page, title: fallbackTitle, text: line }
    }
  }
  if (current) pages.push(finalize(current))
  return pages.length ? pages : [{ page: 1, title: fallbackTitle, text: stripFences(raw.trim()) }]
}

/**
 * Strip a wrapping ```...``` code fence (with optional language tag). When
 * tiptap-markdown serializes indented/code content, whole-page text can end
 * up wrapped in a fence that shouldn't appear in the reader output.
 */
function stripFences(text: string): string {
  return text
    .replace(/^```[a-zA-Z0-9_-]*\s*\n?/, '')
    .replace(/\n?```\s*$/, '')
    .trim()
}

function finalize(p: BookPage): BookPage {
  return { ...p, text: stripFences(p.text.trim()) }
}

export function isChapterLine(line: string): boolean {
  return CHAPTER_LINE.test(line)
}
