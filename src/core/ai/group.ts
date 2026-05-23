import { db } from '@/core/db'
import { resolveSummaryConfig } from './config'
import { getSummaryProvider } from './providers'
import { logAudit, errorMessage } from './audit'

const PALETTE = ['#15604f', '#3c6478', '#7c5a9e', '#b9802a', '#4f7a3a', '#a0512f', '#2f6f6a', '#8a5a2b']

function pickColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

export interface Grouping {
  category: string
  tags: string[]
}

function parseGrouping(text: string): Grouping | null {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    const obj = JSON.parse(match[0]) as { category?: unknown; tags?: unknown }
    const category = typeof obj.category === 'string' ? obj.category.trim() : ''
    const tags = Array.isArray(obj.tags)
      ? obj.tags
          .filter((t): t is string => typeof t === 'string')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 6)
      : []
    if (!category && !tags.length) return null
    return { category, tags }
  } catch {
    return null
  }
}

export async function categorizeArticle(articleId: string, existingCategories: string[]): Promise<Grouping> {
  await db.init()
  const article = await db.articles.get(articleId)
  if (!article) throw new Error('Article not found')

  const config = await resolveSummaryConfig()
  const snippet = (article.content.text || article.excerpt || '').slice(0, 1500)
  const prompt = `You are organising a personal reading library. For this article assign:
1. one category — strongly prefer an existing category if it fits, otherwise propose a short new one (1–2 words)
2. between 2 and 5 lowercase topic tags

Existing categories: ${existingCategories.join(', ') || '(none yet)'}

Respond with ONLY minified JSON and nothing else: {"category":"…","tags":["…","…"]}

Title: ${article.title}
Excerpt: ${snippet}`

  const result = await getSummaryProvider(config.provider).summarize({ prompt, model: config.model, apiKey: config.apiKey })
  const parsed = parseGrouping(result.content)
  if (!parsed) throw new Error('Could not parse a grouping from the AI response')
  return parsed
}

export async function groupArticle(articleId: string): Promise<void> {
  await db.init()
  const categories = await db.categories.getAll()

  let grouping: Grouping
  try {
    grouping = await categorizeArticle(
      articleId,
      categories.map((c) => c.name),
    )
  } catch (error) {
    await logAudit('group_article', { articleId, success: false, error: errorMessage(error) })
    throw error
  }

  let category = categories.find((c) => c.name.toLowerCase() === grouping.category.toLowerCase())
  if (!category && grouping.category) {
    category = await db.categories.save(grouping.category, pickColor(grouping.category))
  }
  if (grouping.tags.length) await db.setArticleTags(articleId, grouping.tags)
  if (category) await db.articles.update(articleId, { categoryId: category.id })

  await logAudit('group_article', {
    articleId,
    success: true,
    details: { category: grouping.category, tags: grouping.tags },
  })
}
