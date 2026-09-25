import type { SummaryProviderClient } from './types'
import { modelUnavailable } from './errors'

interface ResponseItem {
  type: string
  content?: { type: string; text?: string }[]
}

const MAX_OUTPUT_TOKENS = 16000

export const openAIProvider: SummaryProviderClient = {
  id: 'openai',
  async summarize({ prompt, model, apiKey }) {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        instructions: 'You are a helpful assistant that creates article summaries.',
        input: prompt,
        max_output_tokens: MAX_OUTPUT_TOKENS,
        // Responses are retained for 30 days unless opted out; article text stays private.
        store: false,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      if (response.status === 404 || error.error?.code === 'model_not_found') {
        throw modelUnavailable('OpenAI', model, 'Summaries')
      }
      throw new Error(error.error?.message || 'OpenAI API error')
    }

    const data = await response.json()
    if (data.status === 'incomplete') {
      throw new Error(`OpenAI stopped before finishing (${data.incomplete_details?.reason ?? 'unknown reason'}).`)
    }
    const content = ((data.output ?? []) as ResponseItem[])
      .filter((item) => item.type === 'message')
      .flatMap((item) => item.content ?? [])
      .filter((part) => part.type === 'output_text')
      .map((part) => part.text ?? '')
      .join('')
    const usage = data.usage ?? {}
    return {
      content,
      inputTokens: usage.input_tokens ?? 0,
      outputTokens: usage.output_tokens ?? 0,
      totalTokens: usage.total_tokens ?? 0,
    }
  },
}
