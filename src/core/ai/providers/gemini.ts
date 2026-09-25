import type { SummaryProviderClient } from './types'
import { modelUnavailable } from './errors'

export const geminiProvider: SummaryProviderClient = {
  id: 'gemini',
  async summarize({ prompt, model, apiKey }) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    )

    if (response.status === 404) throw modelUnavailable('Gemini', model, 'Summaries')
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || 'Gemini API error')
    }

    const data = await response.json()
    const parts: { text?: string; thought?: boolean }[] = data.candidates?.[0]?.content?.parts ?? []
    const content = parts
      .filter((p) => !p.thought)
      .map((p) => p.text ?? '')
      .join('')
    const meta = data.usageMetadata ?? {}
    const inputTokens = meta.promptTokenCount ?? Math.ceil(prompt.length / 4)
    const outputTokens = (meta.candidatesTokenCount ?? Math.ceil(content.length / 4)) + (meta.thoughtsTokenCount ?? 0)
    const totalTokens = meta.totalTokenCount ?? inputTokens + outputTokens

    return { content, inputTokens, outputTokens, totalTokens }
  },
}
