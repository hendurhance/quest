import { v4 as uuid } from 'uuid'
import type { Category, Tag } from '../types'
import { STORES } from '../schema'
import { promisify, txStore } from '../connection'

export class CategoryRepo {
  constructor(private db: IDBDatabase) {}

  async getAll(): Promise<Category[]> {
    return promisify(txStore(this.db, STORES.categories).getAll() as IDBRequest<Category[]>)
  }

  async save(name: string, color: string): Promise<Category> {
    const category: Category = { id: uuid(), name, color }
    await promisify(txStore(this.db, STORES.categories, 'readwrite').put(category))
    return category
  }

  async put(category: Category): Promise<Category> {
    await promisify(txStore(this.db, STORES.categories, 'readwrite').put(category))
    return category
  }

  async delete(id: string): Promise<void> {
    await promisify(txStore(this.db, STORES.categories, 'readwrite').delete(id))
  }
}

export class TagRepo {
  constructor(private db: IDBDatabase) {}

  async getAll(): Promise<Tag[]> {
    return promisify(txStore(this.db, STORES.tags).getAll() as IDBRequest<Tag[]>)
  }

  async get(name: string): Promise<Tag | null> {
    const result = await promisify(txStore(this.db, STORES.tags).get(name) as IDBRequest<Tag | undefined>)
    return result ?? null
  }

  /** Increment (or decrement) a tag's usage; removes it when it hits zero. */
  async bump(name: string, delta = 1): Promise<Tag> {
    const current = await this.get(name)
    const tag: Tag = current ?? { name, usageCount: 0 }
    tag.usageCount = Math.max(0, tag.usageCount + delta)
    const store = txStore(this.db, STORES.tags, 'readwrite')
    if (tag.usageCount === 0) await promisify(store.delete(name))
    else await promisify(store.put(tag))
    return tag
  }

  async set(tag: Tag): Promise<void> {
    await promisify(txStore(this.db, STORES.tags, 'readwrite').put(tag))
  }
}
