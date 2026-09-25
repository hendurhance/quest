import { describe, it, expect, vi, afterEach } from 'vitest'
import { QuestDB } from '@/core/db'
import { DB_NAME } from '@/core/db/schema'

describe('QuestDB.init', () => {
  afterEach(() => vi.restoreAllMocks())

  it('opens the database once when called concurrently', async () => {
    const open = vi.spyOn(indexedDB, 'open')
    const db = new QuestDB()
    await Promise.all([db.init(), db.init(), db.init()])
    expect(open.mock.calls.filter(([name]) => name === DB_NAME)).toHaveLength(1)
    db.close()
  })
})
