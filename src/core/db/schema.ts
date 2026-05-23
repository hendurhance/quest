export const DB_NAME = 'quest'
export const DB_VERSION = 1
export const LEGACY_DB_NAME = 'Quest'
export const SCHEMA_VERSION = 2

export const STORES = {
  meta: '_meta',
  articles: 'articles',
  summaries: 'summaries',
  audioFiles: 'audioFiles',
  highlights: 'highlights',
  categories: 'categories',
  tags: 'tags',
  reminders: 'reminders',
  auditLog: 'auditLog',
} as const

interface IndexDef {
  name: string
  keyPath: string
  options?: IDBIndexParameters
}

interface StoreDef {
  keyPath: string
  indexes?: IndexDef[]
}

const SCHEMA: Record<string, StoreDef> = {
  [STORES.meta]: { keyPath: 'key' },
  [STORES.articles]: {
    keyPath: 'id',
    indexes: [
      { name: 'cleanUrl', keyPath: 'url.clean' },
      { name: 'domain', keyPath: 'url.domain' },
      { name: 'status', keyPath: 'status' },
      { name: 'createdAt', keyPath: 'createdAt' },
      { name: 'categoryId', keyPath: 'categoryId' },
    ],
  },
  [STORES.summaries]: {
    keyPath: 'id',
    indexes: [
      { name: 'articleId', keyPath: 'articleId' },
      { name: 'createdAt', keyPath: 'createdAt' },
    ],
  },
  [STORES.audioFiles]: {
    keyPath: 'id',
    indexes: [{ name: 'summaryId', keyPath: 'summaryId' }],
  },
  [STORES.highlights]: {
    keyPath: 'id',
    indexes: [
      { name: 'articleId', keyPath: 'articleId' },
      { name: 'createdAt', keyPath: 'createdAt' },
    ],
  },
  [STORES.categories]: {
    keyPath: 'id',
    indexes: [{ name: 'name', keyPath: 'name' }],
  },
  [STORES.tags]: {
    keyPath: 'name',
    indexes: [{ name: 'usageCount', keyPath: 'usageCount' }],
  },
  [STORES.reminders]: {
    keyPath: 'articleId',
    indexes: [{ name: 'reminderTime', keyPath: 'reminderTime' }],
  },
  [STORES.auditLog]: {
    keyPath: 'id',
    indexes: [
      { name: 'timestamp', keyPath: 'timestamp' },
      { name: 'action', keyPath: 'action' },
    ],
  },
}

/** Create any missing object stores + indexes. Safe to call on every upgrade. */
export function applyUpgrade(db: IDBDatabase): void {
  for (const [name, def] of Object.entries(SCHEMA)) {
    if (db.objectStoreNames.contains(name)) continue
    const store = db.createObjectStore(name, { keyPath: def.keyPath })
    def.indexes?.forEach((idx) => store.createIndex(idx.name, idx.keyPath, idx.options))
  }
}
