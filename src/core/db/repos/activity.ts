import { v4 as uuid } from 'uuid'
import type { Reminder, AuditLog } from '../types'
import { STORES } from '../schema'
import { promisify, txStore } from '../connection'

export class ReminderRepo {
  constructor(private db: IDBDatabase) {}

  async get(articleId: string): Promise<Reminder | null> {
    const result = await promisify(txStore(this.db, STORES.reminders).get(articleId) as IDBRequest<Reminder | undefined>)
    return result ?? null
  }

  async save(articleId: string, reminderTime: string): Promise<Reminder> {
    const reminder: Reminder = { articleId, reminderTime, created: new Date().toISOString() }
    await promisify(txStore(this.db, STORES.reminders, 'readwrite').put(reminder))
    return reminder
  }

  async delete(articleId: string): Promise<void> {
    await promisify(txStore(this.db, STORES.reminders, 'readwrite').delete(articleId))
  }
}

export class AuditRepo {
  constructor(private db: IDBDatabase) {}

  async log(entry: Partial<AuditLog>): Promise<AuditLog> {
    const record: AuditLog = {
      id: entry.id ?? uuid(),
      timestamp: entry.timestamp ?? new Date().toISOString(),
      action: entry.action ?? '',
      provider: entry.provider,
      model: entry.model,
      articleId: entry.articleId,
      details: entry.details,
      success: entry.success ?? true,
      error: entry.error,
    }
    await promisify(txStore(this.db, STORES.auditLog, 'readwrite').put(record))
    return record
  }

  /** Most recent first. */
  async list(limit?: number): Promise<AuditLog[]> {
    const index = txStore(this.db, STORES.auditLog).index('timestamp')
    return new Promise((resolve, reject) => {
      const out: AuditLog[] = []
      const request = index.openCursor(null, 'prev')
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor && (limit === undefined || out.length < limit)) {
          out.push(cursor.value as AuditLog)
          cursor.continue()
        } else {
          resolve(out)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async clear(): Promise<void> {
    await promisify(txStore(this.db, STORES.auditLog, 'readwrite').clear())
  }
}
