import type { SummaryProviderClient } from './types'

export const openAIProvider: SummaryProviderClient = {
  id: 'openai',
  async summarize({ prompt, model, apiKey }) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant that creates article summaries.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || 'OpenAI API error')
    }

    const data = await response.json()
    const usage = data.usage ?? {}
    return {
      content: data.choices?.[0]?.message?.content ?? '',
      inputTokens: usage.prompt_tokens ?? 0,
      outputTokens: usage.completion_tokens ?? 0,
      totalTokens: usage.total_tokens ?? 0,
    }
  },
}
