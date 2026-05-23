import type {
  Article as LegacyArticle,
  Summary as LegacySummary,
  AudioFile as LegacyAudioFile,
  Category as LegacyCategory,
  Tag as LegacyTag,
  Reminder as LegacyReminder,
  AuditLog as LegacyAuditLog,
} from '@/types'
import type { Article, Summary, AudioFile, ArticleStatus, MetaRecord } from './types'
import { LEGACY_DB_NAME, SCHEMA_VERSION, STORES } from './schema'
import { openExisting, promisify, txStore } from './connection'
import { makeExcerpt, textToHtml, wordCount } from '@/core/extraction/sanitize'

export async function runMigrations(db: IDBDatabase): Promise<void> {
  const meta = await getMeta(db)
  if (meta?.migratedFromLegacy) return
  await importFromLegacy(db)
  await setMeta(db, { key: 'state', schemaVersion: SCHEMA_VERSION, migratedFromLegacy: true })
}

async function getMeta(db: IDBDatabase): Promise<MetaRecord | null> {
  const result = await promisify(txStore(db, STORES.meta).get('state') as IDBRequest<MetaRecord | undefined>)
  return result ?? null
}

async function setMeta(db: IDBDatabase, record: MetaRecord): Promise<void> {
  await promisify(txStore(db, STORES.meta, 'readwrite').put(record))
}

async function legacyExists(): Promise<boolean> {
  if (typeof indexedDB.databases !== 'function') return true
  try {
    const dbs = await indexedDB.databases()
    return dbs.some((entry) => entry.name === LEGACY_DB_NAME)
  } catch {
    return true
  }
}

async function importFromLegacy(target: IDBDatabase): Promise<void> {
  if (!(await legacyExists())) return
  const legacy = await openExisting(LEGACY_DB_NAME)
  if (!legacy) return

  try {
    const [articles, summaries, audioFiles, categories, tags, reminders, auditLog] = await Promise.all([
      readAll<LegacyArticle>(legacy, 'articles'),
      readAll<LegacySummary>(legacy, 'summaries'),
      readAll<LegacyAudioFile>(legacy, 'audioFiles'),
      readAll<LegacyCategory>(legacy, 'categories'),
      readAll<LegacyTag>(legacy, 'tags'),
      readAll<LegacyReminder>(legacy, 'reminders'),
      readAll<LegacyAuditLog>(legacy, 'auditLog'),
    ])

    await putAll(target, STORES.articles, articles.map(transformArticle))
    await putAll(target, STORES.summaries, summaries.map(transformSummary))
    await putAll(target, STORES.audioFiles, await Promise.all(audioFiles.map(transformAudio)))
    await putAll(target, STORES.categories, categories)
    await putAll(target, STORES.tags, tags)
    await putAll(target, STORES.reminders, reminders)
    await putAll(target, STORES.auditLog, auditLog)
  } finally {
    legacy.close()
  }
}

async function readAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
  if (!db.objectStoreNames.contains(store)) return []
  return promisify(txStore(db, store).getAll() as IDBRequest<T[]>)
}

// Fresh transaction per row — robust against IDB auto-closing a transaction
// across awaits. This is a one-time import, so the extra overhead is fine.
async function putAll<T>(target: IDBDatabase, store: string, items: T[]): Promise<void> {
  for (const item of items) {
    await promisify(txStore(target, store, 'readwrite').put(item))
  }
}

function parseReadingMinutes(value?: string): number | undefined {
  if (!value) return undefined
  const match = value.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : undefined
}

function transformArticle(a: LegacyArticle): Article {
  const text = typeof a.content === 'string' ? a.content : String(a.content ?? '')
  const words = a.metadata?.wordCount || wordCount(text)
  const status: ArticleStatus = a.organization?.isArchived
    ? 'archived'
    : a.organization?.isRead
      ? 'read'
      : 'unread'

  return {
    id: a.id,
    url: { actual: a.actualUrl, clean: a.cleanUrl || a.actualUrl, domain: a.domain || '' },
    title: a.title || 'Untitled',
    excerpt: makeExcerpt(text),
    favicon: a.favicon,
    content: { html: textToHtml(text), text, format: 'text', wordCount: words },
    author: a.metadata?.author,
    publishDate: a.metadata?.publishDate,
    readingTimeMin: parseReadingMinutes(a.metadata?.readingTime) ?? Math.max(1, Math.ceil(words / 200)),
    status,
    isPinned: a.organization?.isPinned ?? false,
    readingProgress: a.organization?.isRead ? 1 : 0,
    categoryId: a.organization?.category,
    tags: a.organization?.tags ? [...a.organization.tags] : [],
    createdAt: a.timestamps?.dateAdded ?? new Date().toISOString(),
    updatedAt: a.timestamps?.lastAccessed ?? a.timestamps?.dateAdded ?? new Date().toISOString(),
    lastOpenedAt: a.timestamps?.lastAccessed,
    readAt: a.timestamps?.dateRead,
    summaryIds: a.summaryIds ? [...a.summaryIds] : [],
    audioId: a.audioId,
  }
}

function transformSummary(s: LegacySummary): Summary {
  return {
    id: s.id,
    articleId: s.articleId,
    kind: String(s.type) === 'extended' ? 'extended' : 'concise',
    content: s.content,
    provider: String(s.aiProvider) === 'openai' ? 'openai' : 'gemini',
    model: s.model || '',
    createdAt: s.generatedDate || new Date().toISOString(),
    inputTokens: s.inputTokens ?? 0,
    outputTokens: s.outputTokens ?? 0,
    totalTokens: s.totalTokens ?? s.tokenCount ?? 0,
    estimatedCost: s.estimatedCost ?? 0,
  }
}

async function toArrayBuffer(raw: unknown): Promise<ArrayBuffer> {
  if (raw instanceof ArrayBuffer) return raw
  if (typeof Blob !== 'undefined' && raw instanceof Blob) return raw.arrayBuffer()
  if (ArrayBuffer.isView(raw)) {
    const view = raw as ArrayBufferView
    const out = new ArrayBuffer(view.byteLength)
    new Uint8Array(out).set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength))
    return out
  }
  if (raw && typeof raw === 'object' && typeof (raw as { byteLength?: unknown }).byteLength === 'number') {
    return raw as ArrayBuffer
  }
  return new ArrayBuffer(0)
}

async function transformAudio(f: LegacyAudioFile): Promise<AudioFile> {
  const data = await toArrayBuffer(f.audioBlob as unknown)

  return {
    id: f.id,
    summaryId: f.summaryId,
    data,
    mimeType: 'audio/mpeg',
    duration: f.duration ?? 0,
    provider: String(f.provider) === 'elevenlabs' ? 'elevenlabs' : 'gemini',
    voiceId: f.voiceId || '',
    characterCount: f.characterCount ?? 0,
    estimatedCost: f.estimatedCost ?? 0,
    createdAt: f.generatedDate || new Date().toISOString(),
  }
}
