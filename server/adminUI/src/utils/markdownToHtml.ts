/**
 * Tiny Markdown→HTML renderer used by the iPhone preview to mirror what the
 * end-user reader will display. Handles the subset our editors emit:
 *
 *   - `# / ## / ###` headings
 *   - `**bold**`, `*italic*` / `_italic_`
 *   - `- item` / `* item` bullet lists, `1. item` ordered lists
 *   - `![alt](url)` inline images
 *   - blank line → paragraph break, single newline → `<br/>`
 *
 * Output is HTML-safe: every literal `<`, `>`, `&` from the input is escaped
 * before any markdown substitution runs. Authoring is admin-only (no public
 * input ever reaches this path), so the resulting HTML is safe to feed
 * straight into `v-html`.
 */

export interface MarkdownToHtmlOptions {
  /** Hook to swap a raw image URL for a cached/blob URL before emitting. */
  resolveSrc?: (url: string) => string
  /** Class added to image tags so the surrounding sheet can size them. */
  imgClass?: string
}

/**
 * `tiptap-markdown` serialises hard breaks as `\` at the end of a line,
 * which is the CommonMark hard-break syntax. Some downstream consumers
 * (older renderers, plain `<textarea>` editing) leave the literal backslash
 * in the saved string, where it bleeds back into the editor as visible
 * "\". Stripping the trailing backslash before a newline collapses the
 * hard break to a regular line break, which our renderer already handles.
 */
export function cleanMarkdown(src: string): string {
  if (!src) return ''
  return src.replace(/\\(\r?\n|$)/g, '$1')
}

const escapeHtml = (s: string): string =>
  s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)

const escapeAttr = (s: string): string =>
  s.replace(/[&<"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '"': '&quot;' })[c]!)

function applyInline(text: string, opts: MarkdownToHtmlOptions): string {
  const resolveSrc = opts.resolveSrc ?? ((u: string) => u)
  const imgClass = opts.imgClass ?? 'page-img'

  let out = escapeHtml(text)

  // Images. We escape attrs after resolving so blob:/https: URLs survive.
  // `draggable="false"` keeps the browser from initiating a native HTML5
  // drag on the `<img>`, which would otherwise eat horizontal mouse drags
  // inside the iPhone preview's swipe area (and any other consumer of this
  // renderer that wraps images in a draggable surface).
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt: string, url: string) => {
    const src = escapeAttr(resolveSrc(url))
    return `<img class="${imgClass}" src="${src}" alt="${escapeAttr(alt)}" draggable="false" />`
  })

  // Bold first so `**foo**` doesn't get partially eaten by the italic pass.
  out = out.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
  // Italic via `_…_` (only when surrounded by non-word chars or boundaries
  // — avoids mangling URLs and snake_case identifiers).
  out = out.replace(/(^|[^\w*])_([^_\n]+?)_(?=$|[^\w*])/g, '$1<em>$2</em>')
  // Italic via `*…*`. Run after bold so we don't catch its delimiters.
  out = out.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>')

  return out
}

// Sentinel prefix used to stash pre-extracted block wrappers
// (`<vcenter>` / `<center>`) before line-by-line parsing. The string is
// long and structured enough that it will never collide with anything an
// admin would type, and applyInline's regex passes don't touch it, so the
// sentinel survives intact through the parse and we can swap it back for
// the real wrapper afterwards.
const ADM_TAG_TOKEN_PREFIX = 'ADMTAG'

interface PendingBlock {
  index: number
  tag: 'rt-vcenter' | 'rt-center'
  inner: string
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function markdownToHtml(src: string | null | undefined, opts: MarkdownToHtmlOptions = {}): string {
  if (!src) return ''

  // Pre-extract block-level admin wrappers BEFORE the line parser runs.
  // The previous post-process injected `<div class="rt-vcenter">` as a
  // string inside whatever paragraph happened to contain the `<vcenter>`
  // tag, which produced malformed HTML when the wrapper spanned multiple
  // blocks (e.g. several headings stacked between `<vcenter>` and
  // `</vcenter>`). By pulling the wrapper text out of the source first,
  // recursively rendering the inner content, and stitching a real
  // `<div>` back in at the end, the wrapper becomes a true top-level
  // block — its inner h1/p/lists nest cleanly inside.
  //
  // Order matters: extract `<vcenter>` first so a nested
  // `<vcenter><center>…</center></vcenter>` lands in the recursive call
  // (which then pulls the inner `<center>`). Doing it the other way
  // would leave the outer `<vcenter>` chopped in half.
  const pending: PendingBlock[] = []
  const stash = (input: string, regex: RegExp, tag: 'rt-vcenter' | 'rt-center'): string =>
    input.replace(regex, (_full: string, _leading: string, inner: string) => {
      const idx = pending.length
      pending.push({ index: idx, tag, inner: String(inner ?? '').trim() })
      // Surround the sentinel with blank lines so it always parses as its
      // own `<p>SENTINEL</p>` paragraph, no matter what neighboured the
      // original tag.
      return `\n\n${ADM_TAG_TOKEN_PREFIX}${idx}\n\n`
    })

  // Line-aligned matchers ONLY — the `<tag>` must sit at start of its line
  // (after optional whitespace, preceded by a newline or start of string)
  // and `</tag>` must end its line. This keeps inline uses like
  // `# <center>title</center>` (a heading with the tag glued to the
  // heading text) on the inline-span passthrough path further down, so
  // those legacy single-line wrappers still center correctly via the
  // `<span class="rt-center">` route. Block uses (`<tag>` on its own
  // line, or multi-line content between tags) get wrapped in a real div
  // via the recursive render below.
  //
  // The interior whitespace pattern is `[ \t]*\n*` rather than `[ \t]*\n?`
  // so blank lines around the inner content (which is what the editor
  // emits when the user separates blocks visually with empty paragraphs)
  // are absorbed instead of breaking the match. Without this, content
  // like `<center>\n\n# Heading\n\n</center>` failed to match — the `\n?`
  // could only swallow one of the two newlines before `</center>`, the
  // regex bailed, and the unmatched `<center>` fell back to the inline
  // span path which can't span multiple blocks.
  const VCENTER_BLOCK_RE = /(^|\n)[ \t]*<vcenter\b[^>]*>[ \t]*\n*([\s\S]*?)\n*[ \t]*<\/vcenter\s*>[ \t]*(?=\n|$)/gi
  const CENTER_BLOCK_RE = /(^|\n)[ \t]*<center\b[^>]*>[ \t]*\n*([\s\S]*?)\n*[ \t]*<\/center\s*>[ \t]*(?=\n|$)/gi

  let source = stash(src, VCENTER_BLOCK_RE, 'rt-vcenter')
  source = stash(source, CENTER_BLOCK_RE, 'rt-center')

  const lines = cleanMarkdown(source).replace(/\r\n?/g, '\n').split('\n')
  const blocks: string[] = []

  let para: string[] = []
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null

  const flushPara = () => {
    if (!para.length) return
    blocks.push(`<p>${para.map((l) => applyInline(l, opts)).join('<br/>')}</p>`)
    para = []
  }
  const flushList = () => {
    if (!list) return
    const items = list.items.map((t) => `<li>${applyInline(t, opts)}</li>`).join('')
    blocks.push(`<${list.type}>${items}</${list.type}>`)
    list = null
  }

  for (const raw of lines) {
    const trimmed = raw.trim()
    if (!trimmed) {
      flushPara()
      flushList()
      continue
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      flushPara()
      flushList()
      const level = heading[1]!.length
      blocks.push(`<h${level}>${applyInline(heading[2]!, opts)}</h${level}>`)
      continue
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/)
    if (bullet) {
      flushPara()
      if (!list || list.type !== 'ul') {
        flushList()
        list = { type: 'ul', items: [] }
      }
      list.items.push(bullet[1]!)
      continue
    }

    const ordered = trimmed.match(/^\d+\.\s+(.+)$/)
    if (ordered) {
      flushPara()
      if (!list || list.type !== 'ol') {
        flushList()
        list = { type: 'ol', items: [] }
      }
      list.items.push(ordered[1]!)
      continue
    }

    flushList()
    para.push(raw)
  }

  flushPara()
  flushList()

  let result = passthroughAdminTags(blocks.join(''))

  // Swap each sentinel paragraph back into a real wrapper div containing
  // the recursively-rendered inner content. The `<p>SENTINEL</p>` shape
  // comes from the line parser running on `\n\nSENTINEL\n\n` above.
  for (const p of pending) {
    const innerHtml = markdownToHtml(p.inner, opts).trim()
    const token = escapeRegex(`${ADM_TAG_TOKEN_PREFIX}${p.index}`)
    result = result.replace(
      new RegExp(`<p>\\s*${token}\\s*</p>`, 'g'),
      `<div class="${p.tag}">${innerHtml}</div>`
    )
  }

  return result
}

// `applyInline` ran every literal `<` and `>` through `escapeHtml`, so admin
// markup like `<center>…</center>` and `<fs size="N">…</fs>` now lives in
// the rendered HTML in escaped form. Convert each back into the real markup
// so the IPhonePreview and BookReader render them identically.
//
// Two source shapes are accepted for every tag:
//   - literal `<…>` in page.text → after escapeHtml: `&lt;…&gt;` (single).
//   - already-escaped `&lt;…&gt;` in page.text (legacy data from before
//     `Markdown.configure({ html: false })` was applied) → after escapeHtml:
//     `&amp;lt;…&amp;gt;` (double-escaped).
function passthroughAdminTags(html: string): string {
  let out = html
    .replace(/(?:&amp;lt;center&amp;gt;|&lt;center&gt;)/gi, '<span class="rt-center">')
    .replace(/(?:&amp;lt;\/center&amp;gt;|&lt;\/center&gt;)/gi, '</span>')

  // Font-size span. `size` is sanitised to an integer 1–999 — anything else
  // is left as the literal escaped text so the author notices the typo.
  const FS_OPEN = /(?:&amp;lt;|&lt;)fs\s+size\s*=\s*(?:&amp;quot;|&quot;|"|')?\s*(\d{1,3})\s*(?:&amp;quot;|&quot;|"|')?\s*(?:&amp;gt;|&gt;)/gi
  const FS_CLOSE = /(?:&amp;lt;|&lt;)\/fs\s*(?:&amp;gt;|&gt;)/gi
  out = out.replace(FS_OPEN, (_m, size: string) => {
    const n = Math.max(1, Math.min(999, parseInt(size, 10) || 0))
    return n ? `<span class="rt-fs" style="font-size:${n}px">` : _m
  })
  out = out.replace(FS_CLOSE, '</span>')

  // Vertical-center wrapper. Must be a block (not a span) so its flex layout
  // can claim the page-body's height; we break out of any wrapping `<p>`
  // and clean up the empty paragraphs that produces.
  out = out
    .replace(/(?:&amp;lt;vcenter&amp;gt;|&lt;vcenter&gt;)/gi, '</p><div class="rt-vcenter"><p>')
    .replace(/(?:&amp;lt;\/vcenter&amp;gt;|&lt;\/vcenter&gt;)/gi, '</p></div><p>')
    .replace(/<p>\s*<\/p>/g, '')

  return out
}

// True when the source text contains a vertical-center wrapper. Consumers
// use this to flip the page body to a flex column so `.rt-vcenter` can
// claim the full available height with `flex: 1 1 auto`. Matches both
// literal `<vcenter>` and the legacy `&lt;vcenter&gt;` form so books
// saved before the post-processor was added still flip correctly.
export function hasVerticalCenter(src: string | null | undefined): boolean {
  if (!src) return false
  return /<vcenter\b|<\/vcenter\s*>|&lt;vcenter\b|&lt;\/vcenter\s*&gt;/i.test(src)
}

// Render a single line of admin-authored text (e.g. a page title) as safe
// HTML with the same `<center>` and `<fs size="N">` passthrough as the
// block renderer. `<vcenter>` intentionally has no inline form.
export function renderInline(text: string | null | undefined): string {
  if (!text) return ''
  let out = escapeHtml(text)
    .replace(/(?:&amp;lt;center&amp;gt;|&lt;center&gt;)/gi, '<span class="rt-center">')
    .replace(/(?:&amp;lt;\/center&amp;gt;|&lt;\/center&gt;)/gi, '</span>')
  const FS_OPEN = /(?:&amp;lt;|&lt;)fs\s+size\s*=\s*(?:&amp;quot;|&quot;|"|')?\s*(\d{1,3})\s*(?:&amp;quot;|&quot;|"|')?\s*(?:&amp;gt;|&gt;)/gi
  const FS_CLOSE = /(?:&amp;lt;|&lt;)\/fs\s*(?:&amp;gt;|&gt;)/gi
  out = out.replace(FS_OPEN, (_m, size: string) => {
    const n = Math.max(1, Math.min(999, parseInt(size, 10) || 0))
    return n ? `<span class="rt-fs" style="font-size:${n}px">` : _m
  })
  out = out.replace(FS_CLOSE, '</span>')
  return out
}
