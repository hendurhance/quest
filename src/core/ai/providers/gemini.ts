import type { SummaryProviderClient } from './types'

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

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || 'Gemini API error')
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const meta = data.usageMetadata ?? {}
    const inputTokens = meta.promptTokenCount ?? Math.ceil(prompt.length / 4)
    const outputTokens = meta.candidatesTokenCount ?? Math.ceil(content.length / 4)
    const totalTokens = meta.totalTokenCount ?? inputTokens + outputTokens

    return { content, inputTokens, outputTokens, totalTokens }
  },
}
