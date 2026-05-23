import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { QuestDB } from '@/core/db'

const opened: QuestDB[] = []
function track(db: QuestDB): QuestDB {
  opened.push(db)
  return db
}

function deleteDb(name: string): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(name)
    request.onsuccess = () => resolve()
    request.onerror = () => resolve()
    request.onblocked = () => resolve()
  })
}

/** Build a legacy `Quest` v1 database with one of each record type. */
function seedLegacy(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('Quest', 1)
    request.onupgradeneeded = () => {
      const db = request.result
      const articles = db.createObjectStore('articles', { keyPath: 'id' })
      articles.createIndex('cleanUrl', 'cleanUrl', { unique: false })
      const summaries = db.createObjectStore('summaries', { keyPath: 'id' })
      summaries.createIndex('articleId', 'articleId', { unique: false })
      const audio = db.createObjectStore('audioFiles', { keyPath: 'id' })
      audio.createIndex('summaryId', 'summaryId', { unique: false })
      db.createObjectStore('categories', { keyPath: 'id' })
      db.createObjectStore('tags', { keyPath: 'name' })
      db.createObjectStore('reminders', { keyPath: 'articleId' })
      db.createObjectStore('auditLog', { keyPath: 'id' })
    }
    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction(
        ['articles', 'summaries', 'audioFiles', 'categories', 'tags'],
        'readwrite',
      )
      tx.objectStore('articles').put({
        id: 'a1',
        cleanUrl: 'https://ex.com/p',
        actualUrl: 'https://ex.com/p',
        title: 'Legacy Post',
        domain: 'ex.com',
        content: 'Hello world.\n\nSecond paragraph.',
        metadata: { wordCount: 4, readingTime: '3 min', author: 'Jane' },
        organization: { category: 'Essays', tags: ['old', 'read-it'], isPinned: true, isArchived: false, isRead: true },
        timestamps: {
          dateAdded: '2025-01-01T00:00:00.000Z',
          lastAccessed: '2025-02-01T00:00:00.000Z',
          dateRead: '2025-01-15T00:00:00.000Z',
        },
        workflow: { reminderScheduled: false, protectedFromCleanup: false },
        summaryIds: ['s1'],
        audioId: 's1',
      })
      tx.objectStore('summaries').put({
        id: 's1',
        articleId: 'a1',
        content: 'sum',
        type: 'extended',
        aiProvider: 'gemini',
        model: 'gemini-2.5-flash',
        generatedDate: '2025-01-10T00:00:00.000Z',
        tokenCount: 500,
      })
      tx.objectStore('audioFiles').put({
        id: 'au1',
        summaryId: 's1',
        audioBlob: new Uint8Array([1, 2, 3]).buffer,
        duration: 42,
        provider: 'gemini',
        voiceId: 'Achernar',
      })
      tx.objectStore('categories').put({ id: 'c1', name: 'Essays', color: '#abc' })
      tx.objectStore('tags').put({ name: 'old', usageCount: 3 })
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
      tx.onerror = () => reject(tx.error)
    }
    request.onerror = () => reject(request.error)
  })
}

describe('v1 → v2 migration', () => {
  beforeEach(async () => {
    await deleteDb('quest')
    await deleteDb('Quest')
  })

  afterEach(() => {
    while (opened.length) opened.pop()!.close()
  })

  it('imports and transforms legacy data', async () => {
    await seedLegacy()
    const db = track(new QuestDB())
    await db.init()

    const articles = await db.articles.getAll()
    expect(articles.length).toBe(1)
    const a = articles[0]
    expect(a.id).toBe('a1')
    expect(a.url.clean).toBe('https://ex.com/p')
    expect(a.url.domain).toBe('ex.com')
    expect(a.status).toBe('read')
    expect(a.isPinned).toBe(true)
    expect(a.readingProgress).toBe(1)
    expect(a.author).toBe('Jane')
    expect(a.readingTimeMin).toBe(3)
    expect(a.content.format).toBe('text')
    expect(a.content.html).toContain('<p>Hello world.</p>')
    expect(a.tags).toEqual(['old', 'read-it'])
    expect(a.categoryId).toBe('Essays')
    expect(a.readAt).toBe('2025-01-15T00:00:00.000Z')

    const summaries = await db.summaries.getForArticle('a1')
    expect(summaries.length).toBe(1)
    expect(summaries[0].kind).toBe('extended')
    expect(summaries[0].provider).toBe('gemini')
    expect(summaries[0].totalTokens).toBe(500) // falls back from tokenCount

    const audio = await db.audio.getBySummaryId('s1')
    expect(audio?.mimeType).toBe('audio/mpeg')
    expect(audio?.data.byteLength).toBe(3)
    expect(audio?.duration).toBe(42)

    const categories = await db.categories.getAll()
    expect(categories.some((c) => c.name === 'Essays')).toBe(true)
    expect((await db.tags.get('old'))?.usageCount).toBe(3)
  })

  it('is idempotent — no duplicates on a second init', async () => {
    await seedLegacy()
    const first = new QuestDB()
    await first.init()
    first.close()

    const second = new QuestDB()
    await second.init()
    expect((await second.articles.getAll()).length).toBe(1)
  })
})
