import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { QuestDB } from '@/core/db'

function deleteDb(name: string): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(name)
    request.onsuccess = () => resolve()
    request.onerror = () => resolve()
    request.onblocked = () => resolve()
  })
}

describe('v2 repos', () => {
  let db: QuestDB

  beforeEach(async () => {
    await deleteDb('quest')
    await deleteDb('Quest')
    db = new QuestDB()
    await db.init()
  })

  afterEach(() => {
    db.close()
  })

  it('saves an article with derived url, status and reading time', async () => {
    const article = await db.articles.save({
      url: { actual: 'https://www.example.com/post' },
      title: 'Hello',
      content: { text: 'one two three four five' },
    })
    expect(article.url.domain).toBe('example.com')
    expect(article.status).toBe('unread')
    expect(article.content.wordCount).toBe(5)
    expect(article.readingTimeMin).toBeGreaterThanOrEqual(1)

    const fetched = await db.articles.get(article.id)
    expect(fetched?.title).toBe('Hello')
  })

  it('dedupes articles by clean url', async () => {
    const first = await db.articles.save({ url: { actual: 'https://x.com/a', clean: 'https://x.com/a' }, title: 'A' })
    const second = await db.articles.save({ url: { actual: 'https://x.com/a', clean: 'https://x.com/a' }, title: 'A2' })
    expect(second.id).toBe(first.id)
    expect((await db.articles.getAll()).length).toBe(1)
  })

  it('updates status and persists the change', async () => {
    const article = await db.articles.save({ url: { actual: 'https://x.com/b' }, title: 'B' })
    const updated = await db.articles.update(article.id, { status: 'read', readingProgress: 1 })
    expect(updated.status).toBe('read')
    expect((await db.articles.get(article.id))?.readingProgress).toBe(1)
  })

  it('persists summary token + cost fields (regression for the v1 drop)', async () => {
    const saved = await db.summaries.save({
      articleId: 'art1',
      kind: 'concise',
      content: '…',
      provider: 'openai',
      model: 'gpt-4.1',
      inputTokens: 120,
      outputTokens: 340,
      totalTokens: 460,
      estimatedCost: 0.0123,
    })
    const read = await db.summaries.get(saved.id)
    expect(read?.inputTokens).toBe(120)
    expect(read?.outputTokens).toBe(340)
    expect(read?.totalTokens).toBe(460)
    expect(read?.estimatedCost).toBeCloseTo(0.0123)
  })

  it('stores audio with an explicit mime type and rebuilds a blob', async () => {
    const data = new Uint8Array([1, 2, 3, 4]).buffer
    await db.audio.save({ summaryId: 'sum1', data, mimeType: 'audio/wav', provider: 'gemini', voiceId: 'Achernar' })
    const read = await db.audio.getBySummaryId('sum1')
    expect(read?.mimeType).toBe('audio/wav')
    expect(read?.data.byteLength).toBe(4)
    const blob = db.audio.toBlob(read!)
    expect(blob.type).toBe('audio/wav')
    expect(blob.size).toBe(4)
  })

  it('adds and lists highlights', async () => {
    await db.highlights.add({ articleId: 'art1', text: 'quote', anchor: { blockIndex: 2, start: 0, end: 5 } })
    const list = await db.highlights.listForArticle('art1')
    expect(list.length).toBe(1)
    expect(list[0].color).toBeTruthy()
  })

  it('bumps and removes tags at zero usage', async () => {
    await db.tags.bump('vue', 2)
    expect((await db.tags.get('vue'))?.usageCount).toBe(2)
    await db.tags.bump('vue', -2)
    expect(await db.tags.get('vue')).toBeNull()
  })
})
