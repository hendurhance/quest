import { describe, it, expect } from 'vitest'
import { applyHighlights, type Segment } from '@/core/reader/highlight-render'
import type { Highlight } from '@/core/db'

function highlight(id: string, blockIndex: number, start: number, end: number): Highlight {
  return { id, articleId: 'a', text: '', anchor: { blockIndex, start, end }, color: 'x', createdAt: '' }
}

const ids = (segs: Segment[]) => segs.map((s) => s.highlightId)
const texts = (segs: Segment[]) => segs.map((s) => s.text)

describe('applyHighlights', () => {
  it('returns one plain segment when nothing matches the block', () => {
    expect(applyHighlights(0, 'hello world', [highlight('h', 1, 0, 5)])).toEqual([
      { text: 'hello world', highlightId: null },
    ])
  })

  it('splits a block around a single highlight', () => {
    const segs = applyHighlights(0, 'hello world', [highlight('h', 0, 6, 11)])
    expect(texts(segs)).toEqual(['hello ', 'world'])
    expect(ids(segs)).toEqual([null, 'h'])
  })

  it('handles a highlight at the very start', () => {
    const segs = applyHighlights(0, 'hello world', [highlight('h', 0, 0, 5)])
    expect(texts(segs)).toEqual(['hello', ' world'])
    expect(ids(segs)).toEqual(['h', null])
  })

  it('stitches multiple non-overlapping highlights in order', () => {
    const segs = applyHighlights(0, 'abcdefghij', [highlight('b', 0, 6, 8), highlight('a', 0, 1, 3)])
    expect(texts(segs)).toEqual(['a', 'bc', 'def', 'gh', 'ij'])
    expect(ids(segs)).toEqual([null, 'a', null, 'b', null])
  })

  it('drops overlapping highlights and clamps out-of-range bounds', () => {
    const segs = applyHighlights(0, 'abcdef', [highlight('a', 0, 1, 4), highlight('b', 0, 2, 5), highlight('c', 0, 4, 99)])
    // 'a' wins [1,4); 'b' overlaps and is skipped; 'c' clamps to [4,6)
    expect(texts(segs)).toEqual(['a', 'bcd', 'ef'])
    expect(ids(segs)).toEqual([null, 'a', 'c'])
  })
})
