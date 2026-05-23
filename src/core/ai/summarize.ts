import { db } from '@/core/db'
import type { Summary, SummaryKind, SummaryProviderId } from '@/core/db'
import { AIProvider, SummaryType } from '@/types'
import type { SummaryProvider } from '@/types'
import { calculateCost } from '@/core/ai/models'
import { generateSmartPrompt } from './prompts'
import { resolveSummaryConfig } from './config'
import { getSummaryProvider } from './providers'
import { logAudit, errorMessage } from './audit'

const KIND_TO_TYPE: Record<SummaryKind, SummaryType> = {
  concise: SummaryType.CONCISE,
  extended: SummaryType.EXTENDED,
}

const ID_TO_ENUM: Record<SummaryProviderId, SummaryProvider> = {
  openai: AIProvider.OPENAI,
  gemini: AIProvider.GEMINI,
}

export interface SummarizeOptions {
  kind?: SummaryKind
  provider?: SummaryProviderId
}

export async function summarizeArticle(articleId: string, options: SummarizeOptions = {}): Promise<Summary> {
  const kind = options.kind ?? 'concise'
  await db.init()

  const article = await db.articles.get(articleId)
  if (!article) throw new Error('Article not found')

  const text = article.content.text ?? ''
  if (text.trim().length < 50) {
    throw new Error(
      `Article content is too short (${text.trim().length} characters). ` +
        'Re-save it from the original page to capture the body.',
    )
  }

  let config
  try {
    config = await resolveSummaryConfig(options.provider)
  } catch (error) {
    await logAudit('generate_summary', { articleId, success: false, error: errorMessage(error) })
    throw error
  }

  try {
    const provider = getSummaryProvider(config.provider)
    const result = await provider.summarize({
      prompt: generateSmartPrompt(KIND_TO_TYPE[kind], text),
      model: config.model,
      apiKey: config.apiKey,
    })

    const estimatedCost = calculateCost(ID_TO_ENUM[config.provider], config.model, result.inputTokens, result.outputTokens)

    const summary = await db.addSummary({
      articleId,
      kind,
      content: result.content,
      provider: config.provider,
      model: config.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      totalTokens: result.totalTokens,
      estimatedCost,
    })

    await logAudit('generate_summary', {
      articleId,
      provider: config.provider,
      model: config.model,
      success: true,
      details: {
        kind,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        totalTokens: result.totalTokens,
        estimatedCost,
      },
    })

    return summary
  } catch (error) {
    await logAudit('generate_summary', {
      articleId,
      provider: config.provider,
      model: config.model,
      success: false,
      error: errorMessage(error),
    })
    throw error
  }
}
