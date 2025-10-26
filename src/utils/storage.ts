// IndexedDB Storage System for Quest (TypeScript)
import type {
  Article,
  Summary,
  AudioFile,
  Category,
  Tag,
  Reminder,
  AuditLog,
  DatabaseConfig,
} from '@/types'
import { AIProvider, SummaryType } from '@/types'
import { v4 as uuidv4 } from 'uuid'

const DATABASE_CONFIG: DatabaseConfig = {
  name: 'Quest',
  version: 1,
  stores: {
    articles: {
      keyPath: 'id',
      indexes: ['cleanUrl', 'domain', 'dateAdded', 'category', 'tags', 'readStatus'],
    },
    summaries: {
      keyPath: 'id',
      indexes: ['articleId', 'generatedDate', 'aiProvider', 'type'],
    },
    audioFiles: {
      keyPath: 'id',
      indexes: ['summaryId', 'generatedDate', 'duration'],
    },
    categories: {
      keyPath: 'id',
      indexes: ['name', 'color'],
    },
    tags: {
      keyPath: 'name',
      indexes: ['usageCount'],
    },
    reminders: {
      keyPath: 'articleId',
      indexes: ['reminderTime', 'created'],
    },
    auditLog: {
      keyPath: 'id',
      indexes: ['timestamp', 'action', 'provider'],
    },
  },
}

export const SUMMARY_PROMPTS: Record<SummaryType, string> = {
  [SummaryType.CONCISE]: `Analyze this article and provide a comprehensive yet concise summary that captures:
1. Main arguments and key points
2. Supporting evidence and data
3. Conclusions and implications
4. Any actionable insights

Keep the summary informative but accessible, around 200-300 words.

Article: [CONTENT]`,

  [SummaryType.EXTENDED]: `Create an extended, podcast-ready summary that sounds genuinely HUMAN with natural speech patterns:

CRITICAL - Add These Human Quirks:
- Occasional "um", "you know", "like", "I mean" (but not overdone - 2-3 times max)
- Self-corrections: "This is about... well, actually, let me put it this way..."
- Thinking out loud: "So I was thinking about this and..."
- Casual interjections: "Right?", "Makes sense?", "Pretty cool, huh?"
- Personal reactions: "I found this fascinating...", "This surprised me...", "Here's what got me..."
- Conversational fillers: "Anyway", "So yeah", "Basically"
- Enthusiasm markers: "This is SO important because...", "Get this..."

Requirements:
- 800-1200 words for optimal TTS conversion
- Warm, conversational tone - like talking to a friend over coffee
- Vary sentence length (mix short punchy ones with longer explanations)
- Use contractions naturally (don't, it's, that's, we're)
- Include brief personal observations and reactions
- Ask rhetorical questions: "But why does this matter?", "Sound familiar?"
- Transitional phrases: "Now here's the interesting part...", "Okay so...", "Let me explain..."
- Occasional informal language: "pretty much", "kind of", "a bunch of"
- Natural pauses and emphasis cues
- Start with a hook: "Alright, so here's something interesting..." or "You know what I just learned?"
- End conversationally: "Pretty fascinating stuff, right?" or "Anyway, that's the gist of it."

Make it sound like a smart friend casually explaining something they're genuinely excited about - NOT a formal narrator or news anchor.

Article: [CONTENT]`,
}

/**
 * Generates an intelligent summary prompt based on article length
 * Adapts the summary style and target length to match the source content
 */
export function generateSmartPrompt(type: SummaryType, contentText: string): string {
  const wordCount = contentText.trim().split(/\s+/).length

  if (type === SummaryType.CONCISE) {
    // Concise summaries are always short, regardless of article length
    return SUMMARY_PROMPTS[SummaryType.CONCISE].replace('[CONTENT]', contentText)
  }

  // Extended/Podcast summaries adapt to article length
  if (type === SummaryType.EXTENDED) {
    // Very short articles (< 500 words) - Don't artificially expand
    if (wordCount < 500) {
      return `Create a natural, conversational summary of this article:

This is a short article (${wordCount} words), so keep your summary proportional - aim for 300-400 words.

Requirements:
- Conversational, podcast-ready tone
- Clear and engaging explanations
- Natural speech patterns with appropriate pauses
- Brief intro and conclusion
- Focus on the key message without over-explaining

Make it sound like you're explaining this to a friend.

Article: [CONTENT]`.replace('[CONTENT]', contentText)
    }

    // Short articles (500-1000 words) - Moderate expansion
    if (wordCount < 1000) {
      return `Create a podcast-ready summary of this article with natural speech patterns:

This is a moderate-length article (${wordCount} words). Create a summary of 400-600 words.

Requirements:
- Conversational tone with natural pauses
- Explain key concepts clearly
- Use transitional phrases like "Now, here's what's interesting..."
- Include relevant context and examples
- Natural speech rhythm
- Clear intro, body, and conclusion

Make it engaging and easy to follow.

Article: [CONTENT]`.replace('[CONTENT]', contentText)
    }

    // Medium articles (1000-2500 words) - Balanced summary
    if (wordCount < 2500) {
      return `Create an extended, podcast-ready summary of this article:

This article is ${wordCount} words. Create a comprehensive summary of 600-900 words.

Requirements:
- Conversational, podcast-ready tone with natural pauses
- Thorough explanations of complex concepts
- Transitional phrases and rhetorical questions
- Include important details, data, and examples
- Storytelling elements where appropriate
- Natural speech rhythm and emphasis cues
- Well-structured intro, body, and conclusion
- Personal observations to maintain engagement

Make it sound like a knowledgeable friend explaining the article thoroughly.

Article: [CONTENT]`.replace('[CONTENT]', contentText)
    }

    // Long articles (2500+ words) - Full expansion
    return `Create a comprehensive, podcast-ready summary of this in-depth article:

This is a substantial article (${wordCount} words). Create a thorough summary of 900-1200 words.

Requirements:
- Rich, conversational tone perfect for TTS conversion
- Deep explanations of complex concepts and terminology
- Transitional phrases like "Now, here's where it gets interesting..."
- Rhetorical questions to engage listeners
- Include key data, statistics, and examples
- Storytelling elements and real-world applications
- Natural speech rhythm with emphasis cues
- Comprehensive intro establishing context
- Detailed body covering all major points
- Strong conclusion tying everything together
- Personal observations like "This reminds me of..." or "What's fascinating here is..."

Make it sound like an expert friend explaining a complex topic over coffee, taking time to ensure understanding.

Article: [CONTENT]`.replace('[CONTENT]', contentText)
  }

  // Fallback to default concise for unknown types
  return SUMMARY_PROMPTS[SummaryType.CONCISE].replace('[CONTENT]', contentText)
}

export class IndexedDBStorage {
  private db: IDBDatabase | null = null
  private readonly dbName: string
  private readonly dbVersion: number

  constructor() {
    this.dbName = DATABASE_CONFIG.name
    this.dbVersion = DATABASE_CONFIG.version
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        Object.entries(DATABASE_CONFIG.stores).forEach(([storeName, config]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: config.keyPath })

            // Create indexes
            if (config.indexes) {
              config.indexes.forEach((indexName) => {
                store.createIndex(indexName, indexName, { unique: false })
              })
            }
          }
        })
      }
    })
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.')
    }
    const transaction = this.db.transaction(storeName, mode)
    return transaction.objectStore(storeName)
  }

  // Article Operations
  async saveArticle(articleData: Partial<Article>): Promise<Article> {
    const now = new Date().toISOString()

    // Check if article already exists
    const existingArticle = articleData.cleanUrl
      ? await this.getArticleByCleanUrl(articleData.cleanUrl)
      : null

    if (existingArticle) {
      return existingArticle
    }

    const article: Article = {
      id: this.generateId(),
      cleanUrl: articleData.cleanUrl || articleData.actualUrl || '',
      actualUrl: articleData.actualUrl || '',
      title: articleData.title || 'Untitled',
      domain: new URL(articleData.actualUrl || '').hostname.replace('www.', ''),
      content: articleData.content || '',
      favicon: articleData.favicon,
      metadata: {
        author: articleData.metadata?.author,
        publishDate: articleData.metadata?.publishDate,
        wordCount: articleData.metadata?.wordCount || 0,
        readingTime: articleData.metadata?.readingTime || '0 min',
      },
      organization: {
        category: articleData.organization?.category || 'Uncategorized',
        tags: Array.isArray(articleData.organization?.tags) ? [...articleData.organization.tags] : [],
        isPinned: articleData.organization?.isPinned || false,
        isArchived: articleData.organization?.isArchived || false,
        isRead: articleData.organization?.isRead || false,
      },
      timestamps: {
        dateAdded: now,
        lastAccessed: now,
        dateRead: undefined,
      },
      workflow: {
        reminderScheduled: false,
        reminderTime: undefined,
        cleanupEligible: undefined,
        protectedFromCleanup: false,
      },
      summaryIds: Array.isArray(articleData.summaryIds) ? [...articleData.summaryIds] : [],
      audioId: articleData.audioId,
    }

    const store = this.getStore('articles', 'readwrite')
    await this.promisifyRequest(store.add(article))

    // Update tag usage
    if (article.organization.tags.length > 0) {
      const transaction = this.db!.transaction(['tags'], 'readwrite')
      for (const tag of article.organization.tags) {
        await this.updateTagUsageInTransaction(transaction, tag, 1)
      }
    }

    return article
  }

  async getArticleByCleanUrl(cleanUrl: string): Promise<Article | null> {
    const store = this.getStore('articles')
    const index = store.index('cleanUrl')
    const request = index.get(cleanUrl)
    const result = await this.promisifyRequest<Article>(request)
    return result || null
  }

  async getAllArticles(): Promise<Article[]> {
    const store = this.getStore('articles')
    const request = store.getAll()
    return this.promisifyRequest<Article[]>(request)
  }

  async getArticle(id: string): Promise<Article | null> {
    const store = this.getStore('articles')
    const request = store.get(id)
    const result = await this.promisifyRequest<Article>(request)
    return result || null
  }

  async updateArticle(id: string, updates: Partial<Article>): Promise<Article> {
    const article = await this.getArticle(id)
    if (!article) {
      throw new Error(`Article with id ${id} not found`)
    }

    // Handle tag changes
    const oldTags = article.organization.tags || []
    const newTags = updates.organization?.tags || oldTags

    const updatedArticle: Article = {
      ...article,
      ...updates,
      organization: {
        ...article.organization,
        ...updates.organization,
      },
      metadata: {
        ...article.metadata,
        ...updates.metadata,
      },
      timestamps: {
        ...article.timestamps,
        ...updates.timestamps,
        lastAccessed: new Date().toISOString(),
      },
      workflow: {
        ...article.workflow,
        ...updates.workflow,
      },
    }

    const store = this.getStore('articles', 'readwrite')
    await this.promisifyRequest(store.put(updatedArticle))

    // Update tag counts if tags changed
    if (JSON.stringify(oldTags) !== JSON.stringify(newTags)) {
      const transaction = this.db!.transaction(['tags'], 'readwrite')
      
      // Decrement old tags
      for (const tag of oldTags) {
        if (!newTags.includes(tag)) {
          await this.updateTagUsageInTransaction(transaction, tag, -1)
        }
      }

      // Increment new tags
      for (const tag of newTags) {
        if (!oldTags.includes(tag)) {
          await this.updateTagUsageInTransaction(transaction, tag, 1)
        }
      }
    }

    return updatedArticle
  }

  async deleteArticle(id: string): Promise<void> {
    const article = await this.getArticle(id)
    if (!article) {
      throw new Error(`Article with id ${id} not found`)
    }

    // Delete associated summaries and audio
    const summaries = await this.getSummariesForArticle(id)
    for (const summary of summaries) {
      const store = this.getStore('summaries', 'readwrite')
      await this.promisifyRequest(store.delete(summary.id))

      // Delete associated audio
      if (summary.id) {
        const audioStore = this.getStore('audioFiles', 'readwrite')
        const audioIndex = audioStore.index('summaryId')
        const audioRequest = audioIndex.getAll(summary.id)
        const audioFiles = await this.promisifyRequest<AudioFile[]>(audioRequest)
        
        for (const audioFile of audioFiles) {
          await this.promisifyRequest(audioStore.delete(audioFile.id))
        }
      }
    }

    // Update tag usage
    if (article.organization.tags.length > 0) {
      const transaction = this.db!.transaction(['tags'], 'readwrite')
      for (const tag of article.organization.tags) {
        await this.updateTagUsageInTransaction(transaction, tag, -1)
      }
    }

    // Delete the article
    const store = this.getStore('articles', 'readwrite')
    await this.promisifyRequest(store.delete(id))
  }

  // Summary Operations
  async saveSummary(summaryData: Partial<Summary>): Promise<Summary> {
    const summary: Summary = {
      id: summaryData.id || this.generateId(),
      articleId: summaryData.articleId || '',
      content: summaryData.content || '',
      type: summaryData.type || SummaryType.CONCISE,
      aiProvider: summaryData.aiProvider || AIProvider.OPENAI,
      model: summaryData.model || '',
      generatedDate: summaryData.generatedDate || new Date().toISOString(),
      tokenCount: summaryData.tokenCount,
    }

    const store = this.getStore('summaries', 'readwrite')
    await this.promisifyRequest(store.put(summary))

    // Update article's summaryIds
    const article = await this.getArticle(summary.articleId)
    if (article && !article.summaryIds.includes(summary.id)) {
      article.summaryIds.push(summary.id)
      await this.updateArticle(article.id, { summaryIds: article.summaryIds })
    }

    return summary
  }

  async getSummariesForArticle(articleId: string): Promise<Summary[]> {
    const store = this.getStore('summaries')
    const index = store.index('articleId')
    const request = index.getAll(articleId)
    return this.promisifyRequest<Summary[]>(request)
  }

  async getAllSummaries(): Promise<Summary[]> {
    const store = this.getStore('summaries')
    const request = store.getAll()
    return this.promisifyRequest<Summary[]>(request)
  }

  // Audio File Operations
  async saveAudioFile(audioData: Partial<AudioFile>): Promise<AudioFile> {
    // Validate the blob before saving
    if (!audioData.audioBlob || !(audioData.audioBlob instanceof Blob)) {
      throw new Error('Invalid audio blob')
    }
    
    if (audioData.audioBlob.size === 0) {
      throw new Error('Audio blob is empty')
    }
    
    // Convert Blob to ArrayBuffer for reliable IndexedDB storage
    const arrayBuffer = await audioData.audioBlob.arrayBuffer()
    
    const audioFile: AudioFile = {
      id: audioData.id || this.generateId(),
      summaryId: audioData.summaryId || '',
      audioBlob: arrayBuffer as any, // Store as ArrayBuffer
      duration: audioData.duration || 0,
      generatedDate: audioData.generatedDate || new Date().toISOString(),
      provider: audioData.provider || AIProvider.ELEVENLABS,
      voiceId: audioData.voiceId || '',
    }

    const store = this.getStore('audioFiles', 'readwrite')
    await this.promisifyRequest(store.put(audioFile))

    return audioFile
  }

  async getAudioFileBySummaryId(summaryId: string): Promise<AudioFile | null> {
    const store = this.getStore('audioFiles')
    const index = store.index('summaryId')
    const request = index.get(summaryId)
    const result = await this.promisifyRequest<AudioFile>(request)
    
    if (result && result.audioBlob) {
      // Always reconstruct Blob from stored ArrayBuffer
      if (result.audioBlob instanceof ArrayBuffer) {
        // Detect format from magic bytes
        const view = new DataView(result.audioBlob, 0, Math.min(12, result.audioBlob.byteLength))
        let mimeType = 'audio/mpeg' // default
        
        // Check for WAV format (RIFF header)
        if (view.byteLength >= 12) {
          const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))
          const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11))
          if (riff === 'RIFF' && wave === 'WAVE') {
            mimeType = 'audio/wav'
          }
        }
        
        result.audioBlob = new Blob([result.audioBlob], { type: mimeType })
      } else if (!(result.audioBlob instanceof Blob)) {
        return null
      }
      
      // Validate blob size
      if (result.audioBlob.size === 0) {
        return null
      }
    } else if (result && !result.audioBlob) {
      return null
    }
    
    return result || null
  }

  async getAllAudioFiles(): Promise<AudioFile[]> {
    const store = this.getStore('audioFiles')
    const request = store.getAll()
    const audioFiles = await this.promisifyRequest<AudioFile[]>(request)
    
    // Convert all ArrayBuffers back to Blobs
    return audioFiles.map(file => {
      if (file.audioBlob instanceof ArrayBuffer) {
        file.audioBlob = new Blob([file.audioBlob], { type: 'audio/mpeg' })
      }
      return file
    })
  }

  // Category Operations
  async saveCategory(name: string, color: string): Promise<Category> {
    const category: Category = {
      id: this.generateId(),
      name,
      color,
    }

    const store = this.getStore('categories', 'readwrite')
    await this.promisifyRequest(store.put(category))

    return category
  }

  async getAllCategories(): Promise<Category[]> {
    const store = this.getStore('categories')
    const request = store.getAll()
    return this.promisifyRequest<Category[]>(request)
  }

  // Tag Operations
  async updateTagUsage(tagName: string, increment: number = 1): Promise<Tag> {
    const store = this.getStore('tags', 'readwrite')
    const request = store.get(tagName)
    let tag = await this.promisifyRequest<Tag>(request)

    if (!tag) {
      tag = { name: tagName, usageCount: 0 }
    }

    tag.usageCount = Math.max(0, tag.usageCount + increment)

    if (tag.usageCount === 0) {
      await this.promisifyRequest(store.delete(tagName))
    } else {
      await this.promisifyRequest(store.put(tag))
    }

    return tag
  }

  private async updateTagUsageInTransaction(
    transaction: IDBTransaction,
    tagName: string,
    increment: number
  ): Promise<void> {
    const store = transaction.objectStore('tags')
    const request = store.get(tagName)
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        let tag = request.result as Tag | undefined

        if (!tag) {
          tag = { name: tagName, usageCount: 0 }
        }

        tag.usageCount = Math.max(0, tag.usageCount + increment)

        if (tag.usageCount === 0) {
          store.delete(tagName)
        } else {
          store.put(tag)
        }

        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getAllTags(): Promise<Tag[]> {
    const store = this.getStore('tags')
    const request = store.getAll()
    return this.promisifyRequest<Tag[]>(request)
  }

  // Reminder Operations
  async saveReminder(articleId: string, reminderTime: string): Promise<Reminder> {
    const reminder: Reminder = {
      articleId,
      reminderTime,
      created: new Date().toISOString(),
    }

    const store = this.getStore('reminders', 'readwrite')
    await this.promisifyRequest(store.put(reminder))

    return reminder
  }

  async getReminder(articleId: string): Promise<Reminder | null> {
    const store = this.getStore('reminders')
    const request = store.get(articleId)
    const result = await this.promisifyRequest<Reminder>(request)
    return result || null
  }

  async deleteReminder(articleId: string): Promise<void> {
    const store = this.getStore('reminders', 'readwrite')
    await this.promisifyRequest(store.delete(articleId))
  }

  // Audit Log Operations
  async logAudit(logData: Partial<AuditLog>): Promise<AuditLog> {
    const log: AuditLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      action: logData.action || '',
      provider: logData.provider,
      articleId: logData.articleId,
      details: logData.details,
      success: logData.success ?? true,
      error: logData.error,
    }

    const store = this.getStore('auditLog', 'readwrite')
    await this.promisifyRequest(store.put(log))

    return log
  }

  async getAuditLogs(limit?: number): Promise<AuditLog[]> {
    const store = this.getStore('auditLog')
    const index = store.index('timestamp')
    const request = index.openCursor(null, 'prev')

    return new Promise((resolve, reject) => {
      const logs: AuditLog[] = []
      let count = 0

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor && (!limit || count < limit)) {
          logs.push(cursor.value)
          count++
          cursor.continue()
        } else {
          resolve(logs)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  async clearAuditLogs(): Promise<void> {
    const store = this.getStore('auditLog', 'readwrite')
    await this.promisifyRequest(store.clear())
  }

  // Utility Methods
  private generateId(): string {
    return uuidv4()
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}

// Export singleton instance
export const storage = new IndexedDBStorage()
