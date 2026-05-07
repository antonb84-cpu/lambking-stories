import { Mark, mergeAttributes } from '@tiptap/core'
import type { Editor } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: number) => ReturnType
      unsetFontSize: () => ReturnType
    }
  }
}

/**
 * `FontSize` — a per-selection font-size mark.
 *
 * The mark renders as `<span class="rt-fs" style="font-size:Npx">…</span>` so
 * the BookReader and IPhonePreview can apply the override directly. The
 * `tiptap-markdown` serializer (registered via `addStorage`) writes the
 * mark as a literal `<fs size="N">…</fs>` tag in markdown. That tag
 * survives the round-trip because the editors run with
 * `Markdown.configure({ html: false })` — markdown-it leaves unknown HTML
 * as plain text.
 *
 * The reverse direction (literal `<fs>` text in markdown back to a real
 * fontSize mark in the editor) is handled by `applyFsMarksFromText` below.
 * Call it once after every `setContent(markdown)` so the editor visually
 * re-applies the styling to text the admin previously sized.
 *
 * `size` is sanitised to an integer in `[1, 999]`; out-of-range values are
 * dropped and the underlying text is left intact.
 */
export const FontSize = Mark.create({
  name: 'fontSize',

  addOptions() {
    return { HTMLAttributes: {} }
  },

  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const fs = el.style?.fontSize
          if (!fs) return null
          const m = fs.match(/^(\d+(?:\.\d+)?)px$/i)
          if (!m) return null
          const n = Math.round(Number(m[1]))
          return Number.isFinite(n) && n > 0 && n <= 999 ? n : null
        },
        renderHTML: (attrs: { size?: number | null }) => {
          if (attrs.size == null) return {}
          return { style: `font-size:${attrs.size}px` }
        }
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[style*="font-size"]',
        getAttrs: (el: HTMLElement | string) => {
          if (typeof el === 'string') return false
          const fs = el.style?.fontSize
          if (!fs) return false
          return /^\d+(?:\.\d+)?px$/i.test(fs) ? null : false
        }
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ class: 'rt-fs' }, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setFontSize:
        (size: number) =>
          ({ commands }) => {
            const n = Math.round(size)
            if (!Number.isFinite(n) || n < 1 || n > 999) return false
            return commands.setMark(this.name, { size: n })
          },
      unsetFontSize:
        () =>
          ({ commands }) =>
            commands.unsetMark(this.name)
    }
  },

  // tiptap-markdown looks for `extensionStorage.<name>.markdown.serialize`
  // when serialising marks. The `open`/`close` form follows
  // prosemirror-markdown's MarkSpec contract.
  addStorage() {
    return {
      markdown: {
        serialize: {
          open: (_state: unknown, mark: { attrs: { size?: number | null } }) => {
            const n = Number(mark.attrs.size)
            if (!Number.isFinite(n) || n < 1 || n > 999) return ''
            return `<fs size="${n}">`
          },
          close: () => '</fs>',
          mixable: true,
          expelEnclosingWhitespace: true
        },
        parse: {}
      }
    }
  }
})

/**
 * Walk the editor doc once and convert any `<fs size="N">…</fs>` text
 * sequences inside a single text-node into properly marked text. tiptap-
 * markdown leaves the literal tags as plain text on `setContent` (because
 * we run with `html: false` so markdown-it doesn't parse raw HTML), so
 * without this step the user would see `<fs size="14">Hello</fs>` instead
 * of the styled "Hello".
 *
 * The walk operates on the current state and dispatches a transaction that
 * deletes every `<fs>`/`</fs>` literal and re-applies the fontSize mark to
 * the text that sat between them. We process matches from end to start so
 * earlier positions remain valid as we splice.
 */
export function applyFsMarksFromText(editor: Editor): void {
  if (!editor || editor.isDestroyed) return
  const fontSizeType = editor.schema.marks.fontSize
  if (!fontSizeType) return

  type Hit = { from: number; to: number; size: number; inner: string }
  const hits: Hit[] = []
  // Accept double or single quotes around the size attribute — the
  // serializer always emits double quotes, but markdown the user hand-edits
  // (or pastes from elsewhere) may use either.
  const FS_RE = /<fs\s+size\s*=\s*["'](\d{1,3})["']\s*>([\s\S]*?)<\/fs>/gi

  editor.state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return
    const text = node.text
    let m: RegExpExecArray | null
    FS_RE.lastIndex = 0
    while ((m = FS_RE.exec(text)) !== null) {
      const n = parseInt(m[1] ?? '', 10)
      if (!Number.isFinite(n) || n < 1 || n > 999) continue
      const innerText = m[2] ?? ''
      if (!innerText) continue
      hits.push({
        from: pos + m.index,
        to: pos + m.index + m[0].length,
        size: n,
        inner: innerText
      })
    }
  })

  if (!hits.length) return

  const tr = editor.state.tr
  // Process in reverse so positions before the splice stay valid.
  for (let i = hits.length - 1; i >= 0; i--) {
    const hit = hits[i]!
    const mark = fontSizeType.create({ size: hit.size })
    const replacement = editor.schema.text(hit.inner, [mark])
    tr.replaceWith(hit.from, hit.to, replacement)
  }
  if (tr.docChanged) editor.view.dispatch(tr)
}
