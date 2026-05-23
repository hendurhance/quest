import { openDatabase } from './connection'
import { runMigrations } from './migrate'
import { ArticleRepo } from './repos/articles'
import { SummaryRepo } from './repos/summaries'
import { AudioRepo } from './repos/audio'
import { HighlightRepo } from './repos/highlights'
import { CategoryRepo, TagRepo } from './repos/taxonomy'
import { ReminderRepo, AuditRepo } from './repos/activity'
import type { Article, NewArticle, Summary, NewSummary, AudioFile, NewAudioFile } from './types'

export class QuestDB {
  private db: IDBDatabase | null = null

  articles!: ArticleRepo
  summaries!: SummaryRepo
  audio!: AudioRepo
  highlights!: HighlightRepo
  categories!: CategoryRepo
  tags!: TagRepo
  reminders!: ReminderRepo
  audit!: AuditRepo

  async init(): Promise<void> {
    if (this.db) return
    const db = await openDatabase()
    this.articles = new ArticleRepo(db)
    this.summaries = new SummaryRepo(db)
    this.audio = new AudioRepo(db)
    this.highlights = new HighlightRepo(db)
    this.categories = new CategoryRepo(db)
    this.tags = new TagRepo(db)
    this.reminders = new ReminderRepo(db)
    this.audit = new AuditRepo(db)
    await runMigrations(db)
    this.db = db
  }

  close(): void {
    this.db?.close()
    this.db = null
  }


  /** Create an article (deduped by clean URL) and bump its tag counts. */
  async createArticle(input: NewArticle): Promise<Article> {
    const clean = input.url.clean || input.url.actual
    const existing = await this.articles.getByCleanUrl(clean)
    if (existing) return existing
    const article = await this.articles.save(input)
    for (const tag of article.tags) await this.tags.bump(tag, 1)
    return article
  }

  /** Replace an article's tags, keeping usage counts in sync. */
  async setArticleTags(id: string, tags: string[]): Promise<Article> {
    const article = await this.articles.get(id)
    if (!article) throw new Error(`Article ${id} not found`)
    for (const tag of article.tags) {
      if (!tags.includes(tag)) await this.tags.bump(tag, -1)
    }
    for (const tag of tags) {
      if (!article.tags.includes(tag)) await this.tags.bump(tag, 1)
    }
    return this.articles.update(id, { tags })
  }

  /** Delete an article and everything that hangs off it. */
  async deleteArticle(id: string): Promise<void> {
    const article = await this.articles.get(id)
    if (!article) return
    for (const summary of await this.summaries.getForArticle(id)) {
      await this.audio.deleteForSummary(summary.id)
      await this.summaries.delete(summary.id)
    }
    for (const highlight of await this.highlights.listForArticle(id)) {
      await this.highlights.delete(highlight.id)
    }
    for (const tag of article.tags) await this.tags.bump(tag, -1)
    await this.articles.delete(id)
  }

  /**
   * Persist a summary and link it onto its article. Idempotent per (article,
   * kind): regenerating overwrites the existing summary of that kind rather
   * than accumulating duplicates.
   */
  async addSummary(input: NewSummary): Promise<Summary> {
    const existing = (await this.summaries.getForArticle(input.articleId)).find((s) => s.kind === input.kind)
    const summary = await this.summaries.save({ ...input, id: input.id ?? existing?.id })
    const article = await this.articles.get(input.articleId)
    if (article && !article.summaryIds.includes(summary.id)) {
      await this.articles.update(article.id, { summaryIds: [...article.summaryIds, summary.id] })
    }
    return summary
  }

  /**
   * Persist audio for a summary and point the article's audioId at it.
   * Idempotent per summary: any prior audio for that summary is replaced.
   */
  async addAudio(input: NewAudioFile, articleId: string): Promise<AudioFile> {
    await this.audio.deleteForSummary(input.summaryId)
    const file = await this.audio.save(input)
    await this.articles.update(articleId, { audioId: input.summaryId })
    return file
  }
}

export const db = new QuestDB()

export * from './types'
