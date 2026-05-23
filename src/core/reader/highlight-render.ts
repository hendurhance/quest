import type { Highlight } from '@/core/db'

export interface Segment {
  text: string
  highlightId: string | null
}

export function applyHighlights(blockIndex: number, text: string, highlights: Highlight[]): Segment[] {
  const ranges = highlights
    .filter((h) => h.anchor.blockIndex === blockIndex)
    .map((h) => ({ start: Math.max(0, h.anchor.start), end: Math.min(text.length, h.anchor.end), id: h.id }))
    .filter((r) => r.end > r.start)
    .sort((a, b) => a.start - b.start)

  if (!ranges.length) return [{ text, highlightId: null }]

  const segments: Segment[] = []
  let cursor = 0
  for (const range of ranges) {
    if (range.start < cursor) continue // skip overlapping highlights
    if (range.start > cursor) segments.push({ text: text.slice(cursor, range.start), highlightId: null })
    segments.push({ text: text.slice(range.start, range.end), highlightId: range.id })
    cursor = range.end
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), highlightId: null })

  return segments
}
