import { describe, it, expect } from 'vitest'
import { hasVerticalCenter, markdownToHtml, renderInline } from '@/utils/markdownToHtml'

describe('markdownToHtml — admin-authored tags', () => {
  describe('horizontal center', () => {
    it('rewrites a single-line <center> into a block wrapper around the inner paragraph', () => {
      const out = markdownToHtml('<center>Hello</center>')
      // The inner is recursively rendered, so the bare text becomes a <p>;
      // the <div class="rt-center"> wraps it as a real block, no orphan
      // span across paragraphs.
      expect(out).toContain('<div class="rt-center">')
      expect(out).toContain('<p>Hello</p>')
      expect(out).toMatch(/<div class="rt-center"><p>Hello<\/p><\/div>/)
    })

    it('handles legacy double-escaped &lt;center&gt; via the inline-span passthrough', () => {
      // Legacy data that came through `Markdown.configure({ html: true })`
      // shows up doubly-escaped — those still get the inline-span handling
      // because pre-extraction's regex only matches literal `<center>`.
      const out = markdownToHtml('&lt;center&gt;Hi&lt;/center&gt;')
      expect(out).toContain('<span class="rt-center">Hi</span>')
    })

    it('keeps inline-within-heading <center> on the inline-span path (no orphan # rendering)', () => {
      // Regression: when `<center>` is glued to a heading line like
      // `# <center>title</center>`, the block pre-extract used to rip the
      // `<center>` out and leave a bare `# ` paragraph behind, which
      // rendered as a literal `#` in the iPhone preview. The line-aligned
      // matcher now skips this case so the heading stays intact and the
      // span wrapper centers the heading text inline.
      const out = markdownToHtml('# <center>DIE FRUCHT-AGENTEN</center>')
      expect(out).toMatch(/<h1><span class="rt-center">DIE FRUCHT-AGENTEN<\/span><\/h1>/)
      // No orphan `#` left over from the heading.
      expect(out).not.toMatch(/<p>#<\/p>/)
      // No block-level rt-center wrapper either.
      expect(out).not.toContain('<div class="rt-center">')
    })

    it('centers MULTIPLE block elements wrapped in one <center> (the user-reported bug)', () => {
      // The failing case from the BookReader: <center> wraps three lines.
      // Old renderer turned this into `<p><span>line1</p><p>line2</p><p>line3</span></p>`
      // — the browser auto-closes the span at the first </p> so only line1
      // got centered. New renderer wraps all three blocks in a single
      // rt-center div so every line inherits text-align: center.
      const md = '<center>\n# DIE FRUCHT-AGENTEN\n\n# Band 1: Mission Friede\n\n# Das Geheimnis im Bauwagen\n</center>'
      const out = markdownToHtml(md)
      expect(out).toMatch(
        /<div class="rt-center"><h1>DIE FRUCHT-AGENTEN<\/h1><h1>Band 1: Mission Friede<\/h1><h1>Das Geheimnis im Bauwagen<\/h1><\/div>/
      )
    })
  })

  describe('vertical center', () => {
    it('rewrites <vcenter> as a top-level block div whose inner is recursively rendered', () => {
      const out = markdownToHtml('<vcenter>centered</vcenter>')
      expect(out).toContain('<div class="rt-vcenter">')
      expect(out).toContain('</div>')
      // The block wraps the inner content directly — no orphan paragraphs
      // before/after the wrapper.
      expect(out).toMatch(/^<div class="rt-vcenter"><p>centered<\/p><\/div>$/)
    })

    it('preserves multiple paragraphs inside the vcenter block', () => {
      const md = '<vcenter>\n\nA\n\nB\n\n</vcenter>'
      const out = markdownToHtml(md)
      expect(out).toContain('<div class="rt-vcenter">')
      expect(out).toMatch(/<p>A<\/p>/)
      expect(out).toMatch(/<p>B<\/p>/)
    })

    it('preserves headings inside the vcenter block', () => {
      const md = '<vcenter>\n# Title\n\nbody\n</vcenter>'
      const out = markdownToHtml(md)
      expect(out).toMatch(/<div class="rt-vcenter"><h1>Title<\/h1><p>body<\/p><\/div>/)
    })

    it('nests <vcenter><center> ... </center></vcenter> as nested wrappers', () => {
      const md = '<vcenter><center>\n# Heading\n\nLine two\n</center></vcenter>'
      const out = markdownToHtml(md)
      expect(out).toMatch(
        /<div class="rt-vcenter"><div class="rt-center"><h1>Heading<\/h1><p>Line two<\/p><\/div><\/div>/
      )
    })

    it('matches block tags even when blank lines surround the inner content (TipTap editor output)', () => {
      // The editor serialises each block on its own paragraph, separated
      // by blank lines. Earlier the regex's `\n?` allowed at most one
      // newline next to the tag, so this shape only matched the OUTER
      // `<vcenter>` (which had a single \n before its `</vcenter>`) and
      // not the inner `<center>` (two newlines before its `</center>`),
      // leaving the centered headings un-centered.
      const md = [
        '<vcenter>',
        '',
        '<center>',
        '',
        '# DIE FRUCHT-AGENTEN',
        '',
        '# Band 1: Mission Friede',
        '',
        '# Das Geheimnis im Bauwagen',
        '',
        '</center>',
        '',
        '</vcenter>'
      ].join('\n')
      const out = markdownToHtml(md)
      expect(out).toMatch(
        /<div class="rt-vcenter"><div class="rt-center"><h1>DIE FRUCHT-AGENTEN<\/h1><h1>Band 1: Mission Friede<\/h1><h1>Das Geheimnis im Bauwagen<\/h1><\/div><\/div>/
      )
    })

    it('hasVerticalCenter detects literal and legacy escaped forms', () => {
      expect(hasVerticalCenter('<vcenter>x</vcenter>')).toBe(true)
      expect(hasVerticalCenter('&lt;vcenter&gt;x&lt;/vcenter&gt;')).toBe(true)
      expect(hasVerticalCenter('Just plain text')).toBe(false)
    })
  })

  describe('font size', () => {
    it('rewrites <fs size="N"> to a styled span', () => {
      const out = markdownToHtml('Hello <fs size="20">big</fs> world')
      expect(out).toContain('<span class="rt-fs" style="font-size:20px">big</span>')
    })

    it('accepts single quotes around the size attribute', () => {
      const out = markdownToHtml('<fs size=\'14\'>x</fs>')
      expect(out).toContain('<span class="rt-fs" style="font-size:14px">x</span>')
    })

    it('clamps the size to 1..999 and drops invalid values intact', () => {
      // 1000 is dropped — escaped text remains untouched so the author
      // notices the typo on screen.
      const out = markdownToHtml('<fs size="1000">x</fs>')
      expect(out).not.toContain('font-size:1000')
      expect(out).toContain('size="1000"')
    })

    it('renderInline handles font-size in titles too', () => {
      const out = renderInline('Hello <fs size="32">big</fs>')
      expect(out).toContain('<span class="rt-fs" style="font-size:32px">big</span>')
    })

    it('does not allow CSS injection via the size attribute', () => {
      // Quote-escape attempt: the regex anchors on \d{1,3} and the size
      // string boundary, so anything non-numeric simply doesn't match.
      // The injected payload remains visible in escaped form (so the author
      // notices the typo), but is never converted into a real `style=` attr.
      const out = markdownToHtml('<fs size="14;color:red">x</fs>')
      expect(out).not.toContain('style="font-size')
      expect(out).not.toContain('class="rt-fs"')
    })
  })

  describe('combined', () => {
    it('mixes vertical center + font size + horizontal center cleanly', () => {
      const md = '<vcenter><center><fs size="24">Hi</fs></center></vcenter>'
      const out = markdownToHtml(md)
      expect(out).toContain('<div class="rt-vcenter">')
      expect(out).toContain('<div class="rt-center">')
      expect(out).toContain('<span class="rt-fs" style="font-size:24px">Hi</span>')
    })
  })
})
