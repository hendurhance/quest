import { v4 as uuid } from 'uuid'
import type { Highlight, NewHighlight } from '../types'
import { STORES } from '../schema'
import { promisify, txStore } from '../connection'

const DEFAULT_COLOR = 'var(--highlight)'

export class HighlightRepo {
  constructor(private db: IDBDatabase) {}

  async listForArticle(articleId: string): Promise<Highlight[]> {
    const index = txStore(this.db, STORES.highlights).index('articleId')
    const list = await promisify(index.getAll(articleId) as IDBRequest<Highlight[]>)
    return list.sort((a, b) => a.anchor.blockIndex - b.anchor.blockIndex || a.anchor.start - b.anchor.start)
  }

  async add(input: NewHighlight): Promise<Highlight> {
    const highlight: Highlight = {
      id: uuid(),
      articleId: input.articleId,
      text: input.text,
      anchor: input.anchor,
      note: input.note,
      color: input.color ?? DEFAULT_COLOR,
      createdAt: new Date().toISOString(),
    }
    await promisify(txStore(this.db, STORES.highlights, 'readwrite').put(highlight))
    return highlight
  }

  async update(id: string, patch: Partial<Pick<Highlight, 'note' | 'color'>>): Promise<Highlight> {
    const store = txStore(this.db, STORES.highlights, 'readwrite')
    const current = await promisify(store.get(id) as IDBRequest<Highlight | undefined>)
    if (!current) throw new Error(`Highlight ${id} not found`)
    const updated: Highlight = { ...current, ...patch }
    await promisify(txStore(this.db, STORES.highlights, 'readwrite').put(updated))
    return updated
  }

  async delete(id: string): Promise<void> {
    await promisify(txStore(this.db, STORES.highlights, 'readwrite').delete(id))
  }
}
