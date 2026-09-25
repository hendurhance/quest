import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useLibraryStore } from '@/stores/library'
import type { Article } from '@/core/db'

function article(i: number): Article {
  return {
    id: `a${i}`,
    url: { actual: `https://example.com/${i}`, clean: `https://example.com/${i}`, domain: 'example.com' },
    title: i % 2 ? `Odd ${i}` : `Even ${i}`,
    excerpt: '',
    content: { html: '', text: '', format: 'text', wordCount: 0 },
    readingTimeMin: 1,
    status: 'unread',
    isPinned: false,
    readingProgress: 0,
    tags: [],
    createdAt: new Date(2026, 0, i + 1).toISOString(),
    updatedAt: new Date(2026, 0, i + 1).toISOString(),
    summaryIds: [],
  }
}

describe('library pagination', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('returns to page 1 when the search changes', async () => {
    const library = useLibraryStore()
    library.articles = Array.from({ length: 60 }, (_, i) => article(i))
    library.goToPage(3)
    expect(library.page).toBe(3)

    library.search = 'odd'
    await nextTick()
    expect(library.page).toBe(1)
    expect(library.paged.length).toBe(24)
  })

  it('returns to page 1 when the sort changes', async () => {
    const library = useLibraryStore()
    library.articles = Array.from({ length: 60 }, (_, i) => article(i))
    library.goToPage(2)

    library.sort = 'title-asc'
    await nextTick()
    expect(library.page).toBe(1)
  })

  it('steps back when deletions remove the current page', async () => {
    const library = useLibraryStore()
    library.articles = Array.from({ length: 60 }, (_, i) => article(i))
    library.goToPage(3)

    library.articles = library.articles.slice(0, 30)
    await nextTick()
    expect(library.page).toBe(2)
    expect(library.paged.length).toBe(6)
  })
})

describe('library selection', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('adds a page to the selection without dropping picks from other pages', () => {
    const library = useLibraryStore()
    library.toggleSelect('a1')
    library.selectMany(['a30', 'a31'])
    expect([...library.selection].sort()).toEqual(['a1', 'a30', 'a31'])
  })

  it('removes only the given ids', () => {
    const library = useLibraryStore()
    library.selectMany(['a1', 'a30', 'a31'])
    library.deselectMany(['a30', 'a31'])
    expect([...library.selection]).toEqual(['a1'])
  })
})
