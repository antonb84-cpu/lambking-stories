/**
 * Tiny Markdown→HTML renderer mirrored from the AdminUI so the reader and
 * book-detail screens display admin-authored content identically to the
 * iPhone preview. Subset:
 *
 *   - `# / ## / ###` headings
 *   - `**bold**`, `*italic*` / `_italic_`
 *   - `- item` / `* item` bullet lists, `1. item` ordered lists
 *   - `![alt](url)` inline images
 *   - blank line → paragraph break, single newline → `<br/>`
 *
 * Authoring is admin-only and the input never carries arbitrary HTML, so the
 * output is safe to consume via `v-html`. A `resolveSrc` hook is provided so
 * the reader can swap https URLs for IndexedDB-backed blob URLs.
 */

export interface MarkdownToHtmlOptions {
  /** Swap a raw image URL for a cached/blob URL before emitting. */
  resolveSrc?: (url: string) => string
  /** Class added to image tags so the surrounding sheet can size them. */
  imgClass?: string
}

/**
 * `tiptap-markdown` serialises hard breaks as `\` at the end of a line
 * (CommonMark syntax). Older saves and content pasted from PDF/Word can
 * round-trip through that path and end up with literal backslashes in the
 * stored markdown, which then leak into the reader and previewer. Strip
 * the trailing backslash so the line break collapses to a regular newline
 * the renderer already handles.
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

  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt: string, url: string) => {
    const src = escapeAttr(resolveSrc(url))
    return `<img class="${imgClass}" src="${src}" alt="${escapeAttr(alt)}" />`
  })

  out = out.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^\w*])_([^_\n]+?)_(?=$|[^\w*])/g, '$1<em>$2</em>')
  out = out.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>')

  return out
}

// Sentinel prefix used to stash pre-extracted block wrappers
// (`<vcenter>` / `<center>`) before line-by-line parsing. The ``
// SOH characters never appear in admin-authored content, and applyInline's
// regex passes don't touch them, so the sentinel survives intact through
// the parse and we can swap it back for the real wrapper afterwards.
const ADM_TAG_TOKEN_PREFIX = 'ADMTAG'

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

// `applyInline` ran every literal `<` and `>` through `escapeHtml`, so any
// `<center>…</center>` markup the admin entered via the rich-text editor's
// center button now lives in the rendered HTML as `&lt;center&gt;…&lt;/center&gt;`.
// Convert that escaped form back to a real centered span. Using a span with
// `display:block` (set in the consumer's CSS via `.rt-center`) keeps the
// markup valid inside a `<p>` — a `<div>` would not be — while still
// producing block-level horizontal centering.
//
// Two source shapes are accepted:
//   - literal `<center>…</center>` in page.text → after escapeHtml the
//     output contains `&lt;center&gt;…` (single-escaped). Match this.
//   - already-escaped `&lt;center&gt;…&lt;/center&gt;` in page.text from
//     books saved before `Markdown.configure({ html: false })` was applied
//     (markdown-it with html:true converted the tags to escaped text on
//     parse). After escapeHtml the rendered output contains
//     `&amp;lt;center&amp;gt;…` (double-escaped). Match this too so the
//     legacy data still centers without a one-shot migration.
//
// `<vcenter>` is the page-level vertical-center wrapper. It's a block (not a
// span) and breaks out of any wrapping `<p>` so its CSS can use flexbox to
// center its children vertically inside the page body.
//
// `<fs size="N">…</fs>` is the per-selection font-size mark. We rebuild the
// inline span with an explicit `style="font-size:Npx"` — `N` is sanitised
// to a positive integer (1–999) so the admin's input can never inject
// arbitrary CSS even if the markdown is hand-edited.
function passthroughAdminTags(html: string): string {
  let out = html
    .replace(/(?:&amp;lt;center&amp;gt;|&lt;center&gt;)/gi, '<span class="rt-center">')
    .replace(/(?:&amp;lt;\/center&amp;gt;|&lt;\/center&gt;)/gi, '</span>')

  // Font-size span. Match attribute forms with single or double quotes; only
  // accept an integer 1–999 — any other value is dropped (the literal text
  // stays escaped on screen so the author notices the typo).
  const FS_OPEN = /(?:&amp;lt;|&lt;)fs\s+size\s*=\s*(?:&amp;quot;|&quot;|"|')?\s*(\d{1,3})\s*(?:&amp;quot;|&quot;|"|')?\s*(?:&amp;gt;|&gt;)/gi
  const FS_CLOSE = /(?:&amp;lt;|&lt;)\/fs\s*(?:&amp;gt;|&gt;)/gi
  out = out.replace(FS_OPEN, (_m, size: string) => {
    const n = Math.max(1, Math.min(999, parseInt(size, 10) || 0))
    return n ? `<span class="rt-fs" style="font-size:${n}px">` : _m
  })
  out = out.replace(FS_CLOSE, '</span>')

  // Vertical-center wrapper. Must be a block (so its flex layout can claim
  // the page body's height) and must escape any wrapping `<p>` so the
  // resulting markup is still valid HTML.
  out = out
    .replace(/(?:&amp;lt;vcenter&amp;gt;|&lt;vcenter&gt;)/gi, '</p><div class="rt-vcenter"><p>')
    .replace(/(?:&amp;lt;\/vcenter&amp;gt;|&lt;\/vcenter&gt;)/gi, '</p></div><p>')
    // The split above tends to leave behind empty paragraphs — strip them so
    // they don't add visible margin between the divider and the content.
    .replace(/<p>\s*<\/p>/g, '')

  return out
}

// True when the rendered HTML contains a vertical-center wrapper. Consumers
// use this to flip the page body to a flex column so `.rt-vcenter` can claim
// the full available height with `flex: 1 1 auto`. Matches both literal
// `<vcenter>` and the legacy `&lt;vcenter&gt;` form so books saved before
// the post-processor was added still flip correctly.
export function hasVerticalCenter(src: string | null | undefined): boolean {
  if (!src) return false
  return /<vcenter\b|<\/vcenter\s*>|&lt;vcenter\b|&lt;\/vcenter\s*&gt;/i.test(src)
}

// Render a single line of admin-authored text (e.g. a page title) as safe
// HTML with the same `<center>…</center>` and `<fs size="N">` passthrough
// as the block renderer. Use this for any title/heading the admin can wrap
// in those tags — Vue's `{{ }}` text interpolation HTML-escapes the value,
// so titles rendered that way display the literal `&lt;center&gt;` text
// instead of applying the formatting. Bind this output via `v-html`.
//
// `<vcenter>` intentionally has no inline form — vertical centering is a
// page-level concern, never a single-line title concern.
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
