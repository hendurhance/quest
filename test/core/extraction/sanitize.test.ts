import { describe, it, expect } from 'vitest'
import {
  sanitizeHtml,
  textToHtml,
  htmlToText,
  wordCount,
  makeExcerpt,
  escapeHtml,
} from '@/core/extraction/sanitize'

describe('sanitizeHtml', () => {
  it('removes script tags and event handlers', () => {
    const clean = sanitizeHtml('<p onclick="evil()">hi</p><script>alert(1)</script>')
    expect(clean).toContain('hi')
    expect(clean).not.toContain('<script')
    expect(clean).not.toContain('onclick')
  })

  it('keeps allowed formatting tags', () => {
    const clean = sanitizeHtml('<h2>Title</h2><strong>bold</strong><blockquote>q</blockquote>')
    expect(clean).toContain('<h2>')
    expect(clean).toContain('<strong>')
    expect(clean).toContain('<blockquote>')
  })

  it('drops disallowed tags but keeps their text', () => {
    const clean = sanitizeHtml('<iframe src="x"></iframe><p>safe</p>')
    expect(clean).not.toContain('<iframe')
    expect(clean).toContain('safe')
  })
})

describe('textToHtml', () => {
  it('wraps paragraphs and escapes embedded html', () => {
    const html = textToHtml('First para\n\nSecond <b>para</b>')
    expect(html).toContain('<p>First para</p>')
    expect(html).toContain('&lt;b&gt;')
    expect(html).not.toContain('<b>')
  })

  it('returns empty string for blank input', () => {
    expect(textToHtml('   ')).toBe('')
  })
})

describe('text helpers', () => {
  it('counts words', () => {
    expect(wordCount('one two three')).toBe(3)
    expect(wordCount('   ')).toBe(0)
  })

  it('truncates excerpts with an ellipsis', () => {
    const excerpt = makeExcerpt('word '.repeat(100), 20)
    expect(excerpt.length).toBeLessThanOrEqual(21)
    expect(excerpt.endsWith('…')).toBe(true)
  })

  it('strips tags to text', () => {
    expect(htmlToText('<p>hello <b>world</b></p>')).toBe('hello world')
  })

  it('escapes html entities', () => {
    expect(escapeHtml('<a> & </a>')).toBe('&lt;a&gt; &amp; &lt;/a&gt;')
  })
})
