import { v4 as uuid } from 'uuid'
import type { Summary, NewSummary } from '../types'
import { STORES } from '../schema'
import { promisify, txStore } from '../connection'

export class SummaryRepo {
  constructor(private db: IDBDatabase) {}

  async getAll(): Promise<Summary[]> {
    return promisify(txStore(this.db, STORES.summaries).getAll() as IDBRequest<Summary[]>)
  }

  async get(id: string): Promise<Summary | null> {
    const result = await promisify(txStore(this.db, STORES.summaries).get(id) as IDBRequest<Summary | undefined>)
    return result ?? null
  }

  async getForArticle(articleId: string): Promise<Summary[]> {
    const index = txStore(this.db, STORES.summaries).index('articleId')
    return promisify(index.getAll(articleId) as IDBRequest<Summary[]>)
  }

  /** Persist a summary with full token/cost accounting (the v1 path dropped these). */
  async save(input: NewSummary): Promise<Summary> {
    const summary: Summary = {
      id: input.id ?? uuid(),
      articleId: input.articleId,
      kind: input.kind,
      content: input.content,
      provider: input.provider,
      model: input.model,
      createdAt: input.createdAt ?? new Date().toISOString(),
      inputTokens: input.inputTokens ?? 0,
      outputTokens: input.outputTokens ?? 0,
      totalTokens: input.totalTokens ?? 0,
      estimatedCost: input.estimatedCost ?? 0,
    }
    await promisify(txStore(this.db, STORES.summaries, 'readwrite').put(summary))
    return summary
  }

  async delete(id: string): Promise<void> {
    await promisify(txStore(this.db, STORES.summaries, 'readwrite').delete(id))
  }
}
