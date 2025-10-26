// Export AI Provider enums and types
export { AIProvider, SummaryType, toAIProvider, toSummaryType, getProviderDisplayName, getSummaryTypeDisplayName, isSummaryProvider, isTTSProvider } from './ai-providers'
export type { SummaryProvider, TTSProvider } from './ai-providers'

// Import types for local use
import type { SummaryProvider, TTSProvider } from './ai-providers'
import { SummaryType } from './ai-providers'

export interface ArticleMetadata {
  author?: string
  publishDate?: string
  wordCount: number
  readingTime: string
}

export interface ArticleOrganization {
  category: string
  tags: string[]
  isPinned: boolean
  isArchived: boolean
  isRead: boolean
}

export interface ArticleTimestamps {
  dateAdded: string
  lastAccessed?: string
  dateRead?: string
}

export interface ArticleWorkflow {
  reminderScheduled: boolean
  reminderTime?: string
  cleanupEligible?: string
  protectedFromCleanup: boolean
}

export interface Article {
  id: string
  cleanUrl: string
  actualUrl: string
  title: string
  domain: string
  content: string
  favicon?: string
  metadata: ArticleMetadata
  organization: ArticleOrganization
  timestamps: ArticleTimestamps
  workflow: ArticleWorkflow
  summaryIds: string[]
  audioId?: string
  // Runtime metadata (loaded on demand)
  aiSummary?: Summary
  audioPodcast?: Summary
}

export interface Summary {
  id: string
  articleId: string
  content: string
  type: SummaryType
  aiProvider: SummaryProvider
  model: string
  generatedDate: string
  // Audio/podcast metadata
  audioUrl?: string
  audioBlob?: Blob
  duration?: number
  voiceName?: string
  // Token usage stats
  tokenCount?: number
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  // Cost tracking (in USD)
  estimatedCost?: number
}

export interface AudioFile {
  id: string
  summaryId: string
  audioBlob: Blob
  duration: number
  generatedDate: string
  provider: TTSProvider
  voiceId: string
  // Character/token usage stats
  characterCount?: number
  // Cost tracking (in USD)
  estimatedCost?: number
}

export interface Category {
  id: string
  name: string
  color: string
}

export interface Tag {
  name: string
  usageCount: number
}

export interface Reminder {
  articleId: string
  reminderTime: string
  created: string
}

export interface AuditLog {
  id: string
  timestamp: string
  action: string
  provider?: string
  model?: string
  articleId?: string
  details?: {
    type?: string
    tokenCount?: number
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
    characterCount?: number
    duration?: number
    estimatedCost?: number
    [key: string]: any
  }
  success: boolean
  error?: string
}

export interface AIUsageStats {
  // Overall stats
  totalSummariesGenerated: number
  totalPodcastsGenerated: number
  totalCost: number
  
  // Per provider stats
  openai: {
    requestCount: number
    totalTokens: number
    totalCost: number
    modelUsage: Record<string, number> // model -> count
  }
  gemini: {
    requestCount: number
    totalTokens: number
    totalCost: number
    modelUsage: Record<string, number>
  }
  elevenlabs: {
    requestCount: number
    totalCharacters: number
    totalCost: number
  }
  google: {
    requestCount: number
    totalCharacters: number
    totalCost: number
    voiceUsage: Record<string, number> // voice -> count
  }
  
  // Last 30 days
  last30Days: {
    summaries: number
    podcasts: number
    cost: number
  }
}

export interface Settings {
  theme: 'light' | 'dark'
  autoArchive: boolean
  archiveDays: number
  reminderEnabled: boolean
  reminderTime: string
  defaultCategory: string
  autoSummary: boolean
  autoPodcast: boolean
  
  // AI Summary Settings
  summaryProvider: SummaryProvider
  openaiModel: string
  geminiModel: string
  
  // Podcast/TTS Settings
  ttsProvider: TTSProvider
  elevenlabsModel: string
  elevenlabsVoiceId: string
  geminiTtsModel?: string
  geminiTtsVoice: string
}

export interface DatabaseConfig {
  name: string
  version: number
  stores: {
    [key: string]: {
      keyPath: string
      indexes?: string[]
    }
  }
}

export interface ArticleFilters {
  category?: string
  tag?: string
  source?: string
  readStatus?: 'all' | 'read' | 'unread'
  archived?: boolean
  pinned?: boolean
  search?: string
}

export interface BulkAction {
  action: 'mark-read' | 'mark-unread' | 'pin' | 'unpin' | 'archive' | 'delete'
  articleIds: string[]
}

export interface ExportOptions {
  format: 'json' | 'html' | 'markdown'
  includeContent: boolean
  filters?: ArticleFilters
}

export interface Stats {
  totalArticles: number
  unreadArticles: number
  readToday: number
  totalSummaries: number
  totalPodcasts: number
  articlesEnhanced: number
}

export interface ServiceUsage {
  openai: {
    totalCalls: number
    totalTokens: number
    lastUsed?: string
  }
  gemini: {
    totalCalls: number
    totalTokens: number
    lastUsed?: string
  }
  elevenlabs: {
    totalCalls: number
    totalCharacters: number
    lastUsed?: string
  }
}

export interface NotificationOptions {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export interface ModalState {
  isVisible: boolean
  title?: string
  content?: any
  size?: 'small' | 'medium' | 'large'
}

export interface PaginationState {
  currentPage: number
  itemsPerPage: number
  totalItems: number
}

// Content extraction types
export interface ExtractedContent {
  title: string
  content: string
  author?: string
  publishDate?: string
  wordCount: number
}

// AI Manager types
export interface AIConfig {
  openai: {
    apiKey: string
    model: string
  }
  gemini: {
    apiKey: string
    model: string
  }
  elevenlabs: {
    apiKey: string
    voiceId: string
  }
}

export interface GenerateSummaryOptions {
  articleId: string
  type: SummaryType
  provider?: SummaryProvider
}

export interface GeneratePodcastOptions {
  articleId: string
  summaryId?: string
}

// Chrome storage types
export interface ChromeStorageData {
  articles?: Article[]
  settings?: Settings
  categories?: Category[]
  tags?: Tag[]
  [key: string]: any
}

// Event types
export interface ArticleSavedEvent {
  action: 'articleSaved'
  article: Article
}

export interface GetWordCountEvent {
  action: 'getWordCount'
}

export interface ExtractContentEvent {
  action: 'extractContent'
}

// View types
export type ViewMode = 'grid' | 'list'
export type FilterType = 'category' | 'tag' | 'source' | 'readStatus'
