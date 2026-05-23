import { v4 as uuid } from 'uuid'
import type { AudioFile, NewAudioFile } from '../types'
import { STORES } from '../schema'
import { promisify, txStore } from '../connection'

export class AudioRepo {
  constructor(private db: IDBDatabase) {}

  async getBySummaryId(summaryId: string): Promise<AudioFile | null> {
    const index = txStore(this.db, STORES.audioFiles).index('summaryId')
    const result = await promisify(index.get(summaryId) as IDBRequest<AudioFile | undefined>)
    return result ?? null
  }

  /** Store audio as an ArrayBuffer with an explicit mime type (no magic-byte guessing). */
  async save(input: NewAudioFile): Promise<AudioFile> {
    if (!input.data || input.data.byteLength === 0) {
      throw new Error('Refusing to store empty audio data')
    }
    const file: AudioFile = {
      id: input.id ?? uuid(),
      summaryId: input.summaryId,
      data: input.data,
      mimeType: input.mimeType || 'audio/mpeg',
      duration: input.duration ?? 0,
      provider: input.provider,
      voiceId: input.voiceId,
      characterCount: input.characterCount ?? 0,
      estimatedCost: input.estimatedCost ?? 0,
      createdAt: input.createdAt ?? new Date().toISOString(),
    }
    await promisify(txStore(this.db, STORES.audioFiles, 'readwrite').put(file))
    return file
  }

  async deleteForSummary(summaryId: string): Promise<void> {
    const file = await this.getBySummaryId(summaryId)
    if (file) await promisify(txStore(this.db, STORES.audioFiles, 'readwrite').delete(file.id))
  }

  toBlob(file: AudioFile): Blob {
    return new Blob([file.data], { type: file.mimeType })
  }
}
