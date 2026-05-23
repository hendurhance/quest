import type { ExtractedContent, SummaryType, AIProvider } from '@/types'
import type { Article } from '@/core/db'

export interface Ack {
  success: boolean
  error?: string
}

type Empty = Record<never, never>

/**
 * Action → { req, res }. Add a line here and both `sendMessage` and the
 * router become aware of it, fully typed.
 */
export interface MessageMap {
  ping: { req: Empty; res: { ready: true } }
  getWordCount: { req: Empty; res: { wordCount: number } }
  extractContent: { req: Empty; res: { content: ExtractedContent } }

  articleSaved: { req: { article: Article }; res: Ack }
  generateSummary: {
    req: { articleId: string; type?: SummaryType; provider?: AIProvider }
    res: Ack
  }
  generatePodcast: { req: { articleId: string }; res: Ack }
  groupArticle: { req: { articleId: string }; res: Ack }
  importData: { req: { data: unknown; merge: boolean }; res: Ack }
  testApiKey: {
    req: { provider: string; apiKey: string; model?: string; voiceId?: string }
    res: Ack
  }
  settingsSaved: { req: Empty; res: Ack }
  saveCategory: { req: { data: { name: string; color: string } }; res: Ack }

  /** Page-side: does this URL have saved annotations to re-render? */
  getPageAnnotations: {
    req: { url: string }
    res: {
      articleId: string | null
      highlights: { id: string; text: string; color: string; note?: string }[]
      summary: string | null
    }
  }
}

export type Action = keyof MessageMap

/** A fully-formed request for a given action (action tag + its payload). */
export type Request<K extends Action> = { action: K } & MessageMap[K]['req']

/** The response a given action resolves to. */
export type Response<K extends Action> = MessageMap[K]['res']

/** Union of every possible request — what a listener receives. */
export type AnyRequest = { [K in Action]: Request<K> }[Action]
