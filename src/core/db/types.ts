export type ArticleStatus = 'unread' | 'reading' | 'read' | 'archived'
export type ContentFormat = 'html' | 'text'
export type SummaryKind = 'concise' | 'extended'
export type SummaryProviderId = 'openai' | 'gemini'
export type TTSProviderId = 'gemini' | 'elevenlabs'

export interface ArticleUrl {
  actual: string
  clean: string
  domain: string
}

export interface ArticleContent {
  html: string
  text: string
  format: ContentFormat
  wordCount: number
}

export interface Article {
  id: string
  url: ArticleUrl
  title: string
  excerpt: string
  coverImage?: string
  favicon?: string
  content: ArticleContent
  author?: string
  publishDate?: string
  readingTimeMin: number
  status: ArticleStatus
  isPinned: boolean
  readingProgress: number // 0..1
  categoryId?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  lastOpenedAt?: string
  readAt?: string
  summaryIds: string[]
  audioId?: string
}

/** Input accepted by ArticleRepo.save — most fields are derived/defaulted. */
export interface NewArticle {
  url: { actual: string; clean?: string; domain?: string }
  title?: string
  excerpt?: string
  coverImage?: string
  favicon?: string
  content?: Partial<ArticleContent>
  author?: string
  publishDate?: string
  readingTimeMin?: number
  status?: ArticleStatus
  isPinned?: boolean
  readingProgress?: number
  categoryId?: string
  tags?: string[]
  summaryIds?: string[]
  audioId?: string
}

export interface Summary {
  id: string
  articleId: string
  kind: SummaryKind
  content: string
  provider: SummaryProviderId
  model: string
  createdAt: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCost: number
}

export interface NewSummary {
  id?: string
  articleId: string
  kind: SummaryKind
  content: string
  provider: SummaryProviderId
  model: string
  createdAt?: string
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  estimatedCost?: number
}

export interface AudioFile {
  id: string
  summaryId: string
  data: ArrayBuffer
  mimeType: string
  duration: number
  provider: TTSProviderId
  voiceId: string
  characterCount: number
  estimatedCost: number
  createdAt: string
}

export interface NewAudioFile {
  id?: string
  summaryId: string
  data: ArrayBuffer
  mimeType: string
  duration?: number
  provider: TTSProviderId
  voiceId: string
  characterCount?: number
  estimatedCost?: number
  createdAt?: string
}

export interface HighlightAnchor {
  blockIndex: number
  start: number
  end: number
}

export interface Highlight {
  id: string
  articleId: string
  text: string
  anchor: HighlightAnchor
  note?: string
  color: string
  createdAt: string
}

export interface NewHighlight {
  articleId: string
  text: string
  anchor: HighlightAnchor
  note?: string
  color?: string
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
  details?: Record<string, unknown>
  success: boolean
  error?: string
}

export interface MetaRecord {
  key: string
  schemaVersion: number
  migratedFromLegacy: boolean
}
