import { describe, it, expect } from 'vitest'
import { formatRelativeTime, formatTime, normalizeUrl } from '@/core/format'

describe('formatRelativeTime', () => {
  it('describes recent and past times', () => {
    expect(formatRelativeTime(new Date())).toBe('Just now')
    expect(formatRelativeTime(new Date(Date.now() - 5 * 60000))).toBe('5m ago')
    expect(formatRelativeTime(new Date(Date.now() - 3 * 3600000))).toBe('3h ago')
    expect(formatRelativeTime(new Date(Date.now() - 2 * 86400000))).toBe('2d ago')
  })
})

describe('formatTime', () => {
  it('formats seconds as m:ss', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(65)).toBe('1:05')
    expect(formatTime(600)).toBe('10:00')
  })
})

describe('normalizeUrl', () => {
  it('keeps essential params and drops tracking', () => {
    expect(normalizeUrl('https://www.youtube.com/watch?v=abc&utm_source=x')).toBe('https://youtube.com/watch?v=abc')
    expect(normalizeUrl('https://example.com/a?id=1&fbclid=zzz&gclid=q')).toBe('https://example.com/a?id=1')
  })

  it('forces https, drops www and trailing slash', () => {
    expect(normalizeUrl('http://www.example.com/path/')).toBe('https://example.com/path')
  })

  it('drops the fragment so client-side hash changes still match', () => {
    expect(normalizeUrl('https://refactoring.guru/design-patterns/what-is-pattern#examples')).toBe(
      'https://refactoring.guru/design-patterns/what-is-pattern',
    )
  })

  it('returns empty for empty input and the original for unparseable input', () => {
    expect(normalizeUrl('')).toBe('')
    expect(normalizeUrl('not a url')).toBe('not a url')
  })
})
