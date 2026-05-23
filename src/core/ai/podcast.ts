import { db } from '@/core/db'
import type { AudioFile, Summary, TTSProviderId } from '@/core/db'
import { resolveTtsConfig } from './config'
import { getTtsProvider } from './providers'
import { summarizeArticle } from './summarize'
import { logAudit, errorMessage } from './audit'

/** USD per 1k characters, per provider (rough plan-level estimates). */
const COST_PER_1K: Record<TTSProviderId, number> = {
  gemini: 0.06,
  elevenlabs: 0.3,
}

export async function generatePodcast(articleId: string, summaryId?: string): Promise<AudioFile> {
  await db.init()

  let config
  try {
    config = await resolveTtsConfig()
  } catch (error) {
    await logAudit('generate_podcast', { articleId, success: false, error: errorMessage(error) })
    throw error
  }

  try {
    const summaries = await db.summaries.getForArticle(articleId)
    let summary: Summary | null = summaryId
      ? summaries.find((s) => s.id === summaryId) ?? null
      : summaries.find((s) => s.kind === 'extended') ?? null
    if (!summary) summary = await summarizeArticle(articleId, { kind: 'extended' })

    const characterCount = summary.content.length
    const provider = getTtsProvider(config.provider)
    const speech = await provider.speak({
      text: summary.content,
      voiceId: config.voiceId,
      model: config.model,
      apiKey: config.apiKey,
    })

    const estimatedCost = (characterCount / 1000) * COST_PER_1K[config.provider]

    const audioFile = await db.addAudio(
      {
        summaryId: summary.id,
        data: speech.data,
        mimeType: speech.mimeType,
        duration: speech.durationSec,
        provider: config.provider,
        voiceId: config.voiceId,
        characterCount,
        estimatedCost,
      },
      articleId,
    )

    await logAudit('generate_podcast', {
      articleId,
      provider: config.provider,
      model: config.voiceId,
      success: true,
      details: { summaryId: summary.id, duration: speech.durationSec, characterCount, estimatedCost },
    })

    return audioFile
  } catch (error) {
    await logAudit('generate_podcast', {
      articleId,
      provider: config.provider,
      success: false,
      error: errorMessage(error),
    })
    throw error
  }
}
