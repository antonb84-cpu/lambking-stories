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
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt: string, url: string) => {
    const src = escapeAttr(resolveSrc(url))
    return `<img class="${imgClass}" src="${src}" alt="${escapeAttr(alt)}" />`
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

export function markdownToHtml(src: string | null | undefined, opts: MarkdownToHtmlOptions = {}): string {
  if (!src) return ''
  const lines = cleanMarkdown(src).replace(/\r\n?/g, '\n').split('\n')
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
  return blocks.join('')
}
