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

  // Buffer for content that appears BEFORE the first explicit `##` chapter
  // break. Previously this was greedily turned into its own auto-titled
  // "Seite 1" page, which made the user's first real chapter become page 2
  // and was impossible to delete from the editor (you can't edit titles
  // generated outside the editor's source). Now: if a real chapter break
  // appears later, the preamble becomes the lead-in text of that first
  // chapter — exactly matching the admin's intent of "show this stuff
  // above page 1's title". If no chapter break ever appears we still
  // emit a single fallback page so the book has at least one entry.
  let preamble = ''

  for (const line of lines) {
    const match = CHAPTER_LINE.exec(line)
    if (match) {
      if (current) pages.push(finalize(current))
      page += 1
      const title = (match[1] ?? match[2] ?? '').trim()
      // First explicit chapter: fold any buffered preamble into its body
      // so it renders above the chapter's content on the same page.
      const initialText = page === 1 && preamble ? preamble : ''
      current = { page, title, text: initialText }
    } else if (current) {
      current.text += (current.text ? '\n' : '') + line
    } else {
      preamble += (preamble ? '\n' : '') + line
    }
  }
  if (current) pages.push(finalize(current))

  if (!pages.length) {
    // Document has zero chapter breaks — fall back to one page containing
    // whatever the admin wrote (the buffered preamble, which equals the
    // raw input minus newline normalisation).
    return [{ page: 1, title: fallbackTitle, text: stripFences((preamble || raw).trim()) }]
  }
  return pages
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
