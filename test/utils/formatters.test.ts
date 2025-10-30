import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  formatRelativeTime,
  formatDateTime,
  formatDate,
  formatTime,
  formatShortDate,
  formatFileSize,
  truncateText,
  capitalizeFirst,
  normalizeUrl,
} from '@/utils/formatters'

describe('formatters', () => {
  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00'))
    })

    it('should return "Just now" for times less than 1 minute ago', () => {
      const date = new Date('2024-01-15T11:59:30')
      expect(formatRelativeTime(date)).toBe('Just now')
    })

    it('should format minutes ago correctly', () => {
      const date = new Date('2024-01-15T11:45:00')
      expect(formatRelativeTime(date)).toBe('15m ago')
    })

    it('should format hours ago correctly', () => {
      const date = new Date('2024-01-15T09:00:00')
      expect(formatRelativeTime(date)).toBe('3h ago')
    })

    it('should format days ago correctly', () => {
      const date = new Date('2024-01-12T12:00:00')
      expect(formatRelativeTime(date)).toBe('3d ago')
    })

    it('should format weeks ago correctly', () => {
      const date = new Date('2024-01-01T12:00:00')
      expect(formatRelativeTime(date)).toBe('2w ago')
    })

    it('should format months ago correctly', () => {
      const date = new Date('2023-11-15T12:00:00')
      expect(formatRelativeTime(date)).toBe('2mo ago')
    })

    it('should format years ago correctly', () => {
      const date = new Date('2022-01-15T12:00:00')
      expect(formatRelativeTime(date)).toBe('2y ago')
    })

    it('should handle ISO date strings', () => {
      expect(formatRelativeTime('2024-01-15T11:45:00')).toBe('15m ago')
    })
  })

  describe('formatDateTime', () => {
    it('should format date and time correctly', () => {
      const date = new Date('2024-01-15T14:30:00')
      const result = formatDateTime(date)
      expect(result).toMatch(/Jan 15.*2:30 PM/)
    })

    it('should accept custom options', () => {
      const date = new Date('2024-01-15T14:30:00')
      const result = formatDateTime(date, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      expect(result).toMatch(/January 15, 2024/)
    })

    it('should handle ISO date strings', () => {
      const result = formatDateTime('2024-01-15T14:30:00')
      expect(result).toMatch(/Jan 15/)
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T14:30:00')
      expect(formatDate(date)).toBe('January 15, 2024')
    })

    it('should handle ISO date strings', () => {
      expect(formatDate('2024-01-15T14:30:00')).toBe('January 15, 2024')
    })
  })

  describe('formatTime', () => {
    it('should format seconds to mm:ss', () => {
      expect(formatTime(0)).toBe('0:00')
      expect(formatTime(30)).toBe('0:30')
      expect(formatTime(90)).toBe('1:30')
      expect(formatTime(600)).toBe('10:00')
      expect(formatTime(3665)).toBe('61:05')
    })

    it('should pad seconds with leading zero', () => {
      expect(formatTime(125)).toBe('2:05')
    })
  })

  describe('formatShortDate', () => {
    it('should format date in short format', () => {
      const date = new Date('2024-01-15T14:30:00')
      expect(formatShortDate(date)).toMatch(/1\/15\/24/)
    })

    it('should handle ISO date strings', () => {
      expect(formatShortDate('2024-01-15T14:30:00')).toMatch(/1\/15\/24/)
    })
  })

  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
    })

    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 Bytes')
    })

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(1572864)).toBe('1.5 MB')
    })

    it('should format gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB')
    })

    it('should respect decimal places', () => {
      expect(formatFileSize(1536, 0)).toBe('2 KB')
      expect(formatFileSize(1536, 3)).toBe('1.5 KB')
    })
  })

  describe('truncateText', () => {
    it('should not truncate text shorter than max length', () => {
      expect(truncateText('Hello', 10)).toBe('Hello')
    })

    it('should truncate text longer than max length', () => {
      expect(truncateText('Hello World', 5)).toBe('Hello...')
    })

    it('should handle exact length', () => {
      expect(truncateText('Hello', 5)).toBe('Hello')
    })
  })

  describe('capitalizeFirst', () => {
    it('should capitalize first letter', () => {
      expect(capitalizeFirst('hello')).toBe('Hello')
    })

    it('should handle already capitalized text', () => {
      expect(capitalizeFirst('Hello')).toBe('Hello')
    })

    it('should handle empty string', () => {
      expect(capitalizeFirst('')).toBe('')
    })

    it('should only capitalize first letter', () => {
      expect(capitalizeFirst('hello world')).toBe('Hello world')
    })
  })

  describe('normalizeUrl', () => {
    it('should remove tracking parameters', () => {
      const url = 'https://example.com/article?utm_source=twitter&utm_medium=social'
      expect(normalizeUrl(url)).toBe('https://example.com/article')
    })

    it('should preserve essential parameters', () => {
      const url = 'https://youtube.com/watch?v=dQw4w9WgXcQ&utm_source=twitter'
      expect(normalizeUrl(url)).toBe('https://youtube.com/watch?v=dQw4w9WgXcQ')
    })

    it('should remove www prefix', () => {
      const url = 'https://www.example.com/article'
      expect(normalizeUrl(url)).toBe('https://example.com/article')
    })

    it('should normalize to https', () => {
      const url = 'http://example.com/article'
      expect(normalizeUrl(url)).toBe('https://example.com/article')
    })

    it('should remove trailing slash', () => {
      const url = 'https://example.com/article/'
      expect(normalizeUrl(url)).toBe('https://example.com/article')
    })

    it('should preserve root trailing slash', () => {
      const url = 'https://example.com/'
      expect(normalizeUrl(url)).toBe('https://example.com/')
    })

    it('should preserve fragments', () => {
      const url = 'https://github.com/user/repo#readme'
      expect(normalizeUrl(url)).toBe('https://github.com/user/repo#readme')
    })

    it('should remove Facebook tracking parameters', () => {
      const url = 'https://example.com/article?id=123&fbclid=xyz'
      expect(normalizeUrl(url)).toBe('https://example.com/article?id=123')
    })

    it('should remove Google tracking parameters', () => {
      const url = 'https://example.com/article?gclid=abc&utm_campaign=test'
      expect(normalizeUrl(url)).toBe('https://example.com/article')
    })

    it('should handle malformed URLs gracefully', () => {
      const url = 'not-a-valid-url'
      expect(normalizeUrl(url)).toBe('not-a-valid-url')
    })

    it('should handle empty string', () => {
      expect(normalizeUrl('')).toBe('')
    })

    it('should preserve search queries', () => {
      const url = 'https://google.com/search?q=test&utm_source=chrome'
      expect(normalizeUrl(url)).toBe('https://google.com/search?q=test')
    })

    it('should preserve article and post IDs', () => {
      const url = 'https://blog.com/post?post_id=456&article_id=789&fbclid=xyz'
      expect(normalizeUrl(url)).toBe('https://blog.com/post?post_id=456&article_id=789')
    })
  })
})
