import { describe, it, expect, vi, afterEach } from 'vitest'
import { openAIProvider } from '@/core/ai/providers/openai'
import { geminiProvider } from '@/core/ai/providers/gemini'
import { elevenLabsProvider } from '@/core/ai/providers/elevenlabs'
import { SettingsError } from '@/core/ai/providers/errors'

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const request = { prompt: 'Summarise this', model: 'gpt-6-luna', apiKey: 'sk-test' }

afterEach(() => vi.unstubAllGlobals())

describe('openAIProvider', () => {
  it('sends a Responses API request that is not stored and has no model-specific limits', async () => {
    const fetchMock = mockFetch(200, { output: [], usage: {} })
    await openAIProvider.summarize(request)

    const [url, init] = fetchMock.mock.calls[0]
    const body = JSON.parse(init.body)
    expect(url).toBe('https://api.openai.com/v1/responses')
    expect(body).toMatchObject({ model: 'gpt-6-luna', input: 'Summarise this', store: false })
    expect(body).not.toHaveProperty('max_tokens')
    expect(body).not.toHaveProperty('temperature')
    // Reasoning tokens count toward the cap, so it must stay well above a summary's length.
    expect(body.max_output_tokens).toBeGreaterThanOrEqual(8000)
  })

  it('rejects a response cut off by the output cap instead of saving a partial summary', async () => {
    mockFetch(200, {
      status: 'incomplete',
      incomplete_details: { reason: 'max_output_tokens' },
      output: [{ type: 'message', content: [{ type: 'output_text', text: 'Half a sum' }] }],
      usage: {},
    })
    await expect(openAIProvider.summarize(request)).rejects.toThrow('max_output_tokens')
  })

  it('treats a 400 model_not_found as a Settings error too', async () => {
    mockFetch(400, { error: { message: 'The requested model does not exist.', code: 'model_not_found' } })
    await expect(openAIProvider.summarize(request)).rejects.toBeInstanceOf(SettingsError)
  })

  it('joins output_text parts from message items and skips reasoning items', async () => {
    mockFetch(200, {
      output: [
        { type: 'reasoning', id: 'rs_1', summary: [] },
        {
          type: 'message',
          role: 'assistant',
          content: [
            { type: 'output_text', text: 'Hello ', annotations: [] },
            { type: 'output_text', text: 'world', annotations: [] },
          ],
        },
      ],
      usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
    })

    await expect(openAIProvider.summarize(request)).resolves.toEqual({
      content: 'Hello world',
      inputTokens: 10,
      outputTokens: 5,
      totalTokens: 15,
    })
  })

  it('turns a 404 into a Settings error naming the model', async () => {
    mockFetch(404, { error: { message: 'The model `gpt-6-luna` does not exist', code: 'model_not_found' } })
    const error = await openAIProvider.summarize(request).catch((e) => e)
    expect(error).toBeInstanceOf(SettingsError)
    expect(error.message).toContain('gpt-6-luna')
  })

  it('surfaces the provider message for other failures', async () => {
    mockFetch(429, { error: { message: 'Rate limit reached' } })
    const error = await openAIProvider.summarize(request).catch((e) => e)
    expect(error).not.toBeInstanceOf(SettingsError)
    expect(error.message).toBe('Rate limit reached')
  })
})

describe('geminiProvider', () => {
  const gemini = { ...request, model: 'gemini-3.8-flash', apiKey: 'AIza-test' }

  it('joins answer parts, drops thought parts, and bills thinking tokens as output', async () => {
    mockFetch(200, {
      candidates: [{ content: { parts: [{ text: 'weighing it up', thought: true }, { text: 'Answer ' }, { text: 'here' }] } }],
      usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 20, thoughtsTokenCount: 30, totalTokenCount: 150 },
    })

    await expect(geminiProvider.summarize(gemini)).resolves.toEqual({
      content: 'Answer here',
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
    })
  })

  it('turns a 404 into a Settings error', async () => {
    mockFetch(404, { error: { message: 'models/gemini-3.8-flash is not found for API version v1beta' } })
    await expect(geminiProvider.summarize(gemini)).rejects.toBeInstanceOf(SettingsError)
  })
})

describe('elevenLabsProvider', () => {
  const speech = { text: 'Hi', voiceId: 'v1', model: 'eleven_v4', apiKey: 'xi-test' }

  it('reads the message from an object detail', async () => {
    mockFetch(400, { detail: { status: 'voice_not_found', message: 'A voice with that ID was not found.' } })
    await expect(elevenLabsProvider.speak(speech)).rejects.toThrow('A voice with that ID was not found.')
  })

  it('reads a string detail', async () => {
    mockFetch(401, { detail: 'Invalid API key' })
    await expect(elevenLabsProvider.speak(speech)).rejects.toThrow('Invalid API key')
  })

  it('joins validation messages from an array detail', async () => {
    mockFetch(422, { detail: [{ loc: ['body', 'text'], msg: 'field required' }] })
    await expect(elevenLabsProvider.speak(speech)).rejects.toThrow('field required')
  })

  it('falls back to a plain-text body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Service Unavailable', { status: 503 })))
    await expect(elevenLabsProvider.speak(speech)).rejects.toThrow('Service Unavailable')
  })
})
