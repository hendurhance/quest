import { v4 as uuid } from 'uuid'
import type { Article, NewArticle } from '../types'
import { STORES } from '../schema'
import { promisify, txStore } from '../connection'
import { makeExcerpt, wordCount } from '@/core/extraction/sanitize'

function deriveDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export class ArticleRepo {
  constructor(private db: IDBDatabase) {}

  async getAll(): Promise<Article[]> {
    return promisify(txStore(this.db, STORES.articles).getAll() as IDBRequest<Article[]>)
  }

  async get(id: string): Promise<Article | null> {
    const result = await promisify(txStore(this.db, STORES.articles).get(id) as IDBRequest<Article | undefined>)
    return result ?? null
  }

  async getByCleanUrl(clean: string): Promise<Article | null> {
    const index = txStore(this.db, STORES.articles).index('cleanUrl')
    const result = await promisify(index.get(clean) as IDBRequest<Article | undefined>)
    return result ?? null
  }

  /** Insert a new article. Returns the existing one if the clean URL matches. */
  async save(input: NewArticle): Promise<Article> {
    const clean = input.url.clean || input.url.actual
    const existing = await this.getByCleanUrl(clean)
    if (existing) return existing

    const now = new Date().toISOString()
    const text = input.content?.text ?? ''
    const words = input.content?.wordCount ?? wordCount(text)

    const article: Article = {
      id: uuid(),
      url: {
        actual: input.url.actual,
        clean,
        domain: input.url.domain || deriveDomain(input.url.actual),
      },
      title: input.title || 'Untitled',
      excerpt: input.excerpt ?? makeExcerpt(text),
      coverImage: input.coverImage,
      favicon: input.favicon,
      content: {
        html: input.content?.html ?? '',
        text,
        format: input.content?.format ?? 'text',
        wordCount: words,
      },
      author: input.author,
      publishDate: input.publishDate,
      readingTimeMin: input.readingTimeMin ?? Math.max(1, Math.ceil(words / 200)),
      status: input.status ?? 'unread',
      isPinned: input.isPinned ?? false,
      readingProgress: input.readingProgress ?? 0,
      categoryId: input.categoryId,
      tags: input.tags ? [...input.tags] : [],
      createdAt: now,
      updatedAt: now,
      summaryIds: input.summaryIds ? [...input.summaryIds] : [],
      audioId: input.audioId,
    }

    await promisify(txStore(this.db, STORES.articles, 'readwrite').add(article))
    return article
  }

  async put(article: Article): Promise<Article> {
    await promisify(txStore(this.db, STORES.articles, 'readwrite').put(article))
    return article
  }

  async update(id: string, patch: Partial<Article>): Promise<Article> {
    const current = await this.get(id)
    if (!current) throw new Error(`Article ${id} not found`)
    const updated: Article = {
      ...current,
      ...patch,
      url: { ...current.url, ...patch.url },
      content: { ...current.content, ...patch.content },
      updatedAt: new Date().toISOString(),
    }
    await promisify(txStore(this.db, STORES.articles, 'readwrite').put(updated))
    return updated
  }

  async delete(id: string): Promise<void> {
    await promisify(txStore(this.db, STORES.articles, 'readwrite').delete(id))
  }
}
