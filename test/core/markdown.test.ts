import { describe, it, expect } from 'vitest'
import { markdownToHtml } from '@/core/markdown'

describe('markdownToHtml', () => {
  it('renders bold and italic', () => {
    expect(markdownToHtml('a **bold** and *italic* word')).toBe(
      '<p>a <strong>bold</strong> and <em>italic</em> word</p>',
    )
  })

  it('renders inline code', () => {
    expect(markdownToHtml('use `npm i`')).toBe('<p>use <code>npm i</code></p>')
  })

  it('renders bullet and ordered lists', () => {
    expect(markdownToHtml('- one\n- two')).toBe('<ul>\n<li>one</li>\n<li>two</li>\n</ul>')
    expect(markdownToHtml('1. one\n2. two')).toBe('<ol>\n<li>one</li>\n<li>two</li>\n</ol>')
  })

  it('offsets headings so # is not an oversized h1', () => {
    expect(markdownToHtml('# Title')).toBe('<h2>Title</h2>')
  })

  it('escapes raw html and blocks non-http links', () => {
    expect(markdownToHtml('<script>')).toBe('<p>&lt;script&gt;</p>')
    expect(markdownToHtml('[x](javascript:alert(1))')).toContain('href="#"')
    expect(markdownToHtml('[docs](https://example.com)')).toContain('href="https://example.com"')
  })

  it('splits paragraphs on blank lines', () => {
    expect(markdownToHtml('one\n\ntwo')).toBe('<p>one</p>\n<p>two</p>')
  })
})
