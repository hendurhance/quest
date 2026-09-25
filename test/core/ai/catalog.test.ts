import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  openAITextModels,
  geminiModels,
  elevenLabsTtsModels,
  elevenLabsVoices,
  listSummaryModels,
  listTtsModels,
  listVoices,
} from '@/core/ai/catalog'
import { estimateCost } from '@/core/ai/pricing'

afterEach(() => vi.unstubAllGlobals())

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

describe('openAITextModels', () => {
  const raw = [
    { id: 'gpt-4.1', created: 100 },
    { id: 'gpt-6-luna', created: 300 },
    { id: 'gpt-6-astra', created: 290 },
    { id: 'gpt-4o-2024-08-06', created: 150 },
    { id: 'gpt-3.5-turbo-0125', created: 50 },
    { id: 'text-embedding-3-small', created: 200 },
    { id: 'gpt-4o-mini-tts', created: 210 },
    { id: 'gpt-realtime', created: 220 },
    { id: 'gpt-image-1', created: 230 },
    { id: 'whisper-1', created: 10 },
    { id: 'o4-mini', created: 250 },
    { id: 'gpt-4o-search-preview', created: 240 },
    { id: 'gpt-3.5-turbo-instruct', created: 40 },
  ]

  it('keeps only text-generation models and drops dated snapshots', () => {
    const ids = openAITextModels(raw).map((m) => m.id)
    expect(ids).toEqual(['gpt-6-luna', 'gpt-6-astra', 'o4-mini', 'gpt-4.1'])
  })
})

describe('geminiModels', () => {
  const raw = [
    { name: 'models/gemini-3.5-flash', displayName: 'Gemini 3.5 Flash', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/gemini-3.8-flash', displayName: 'Gemini 3.8 Flash', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/gemini-3.1-pro-preview', displayName: 'Gemini 3.1 Pro Preview', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/gemini-3.8-flash-tts', displayName: 'Gemini 3.8 Flash TTS', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/gemini-3.1-flash-image', displayName: 'Image', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/gemini-embedding-001', displayName: 'Embedding', supportedGenerationMethods: ['embedContent'] },
    { name: 'models/gemini-3.8-live', displayName: 'Live', supportedGenerationMethods: ['bidiGenerateContent'] },
    { name: 'models/gemma-3-27b-it', displayName: 'Gemma', supportedGenerationMethods: ['generateContent'] },
  ]

  it('lists text models, stable first, newest version first', () => {
    const models = geminiModels(raw, 'text')
    expect(models.map((m) => m.id)).toEqual(['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-pro-preview'])
    expect(models[0].name).toBe('Gemini 3.8 Flash')
  })

  it('compares versions numerically, so 3.10 sorts above 3.8', () => {
    const ids = geminiModels(
      [
        { name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-3.10-flash', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-4-flash', supportedGenerationMethods: ['generateContent'] },
      ],
      'text',
    ).map((m) => m.id)
    expect(ids).toEqual(['gemini-4-flash', 'gemini-3.10-flash', 'gemini-3.8-flash'])
  })

  it('lists only speech models for tts', () => {
    expect(geminiModels(raw, 'tts').map((m) => m.id)).toEqual(['gemini-3.8-flash-tts'])
  })
})

describe('elevenLabs', () => {
  it('keeps only text-to-speech models', () => {
    const models = elevenLabsTtsModels([
      { model_id: 'eleven_v4', name: 'Eleven v4', can_do_text_to_speech: true },
      { model_id: 'eleven_sts', name: 'Speech to speech', can_do_text_to_speech: false },
    ])
    expect(models).toEqual([{ id: 'eleven_v4', name: 'Eleven v4', detail: undefined }])
  })

  it('maps voices with a readable detail line', () => {
    const voices = elevenLabsVoices([
      { voice_id: 'abc', name: 'Nova', category: 'premade', labels: { gender: 'female', accent: 'british' } },
    ])
    expect(voices).toEqual([{ id: 'abc', name: 'Nova', detail: 'female · british · premade' }])
  })
})

describe('list functions', () => {
  it('report every id the provider returned, so hidden snapshots are not flagged as retired', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(json({ data: [{ id: 'gpt-4.1', created: 2 }, { id: 'gpt-4.1-2025-04-14', created: 1 }] })),
    )
    const catalog = await listSummaryModels('openai', 'sk')
    expect(catalog.items.map((m) => m.id)).toEqual(['gpt-4.1'])
    expect(catalog.available).toContain('gpt-4.1-2025-04-14')
  })

  it('fetches the Gemini model list once when text and speech lists load together', async () => {
    const fetchMock = vi.fn().mockImplementation(async () =>
      json({ models: [{ name: 'models/gemini-3.8-flash-tts', supportedGenerationMethods: ['generateContent'] }] }),
    )
    vi.stubGlobal('fetch', fetchMock)
    await Promise.all([listSummaryModels('gemini', 'AIza'), listTtsModels('gemini', 'AIza')])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('follows ElevenLabs voice pages to the end', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ voices: [{ voice_id: 'a', name: 'A' }], has_more: true, next_page_token: 'p2' }))
      .mockResolvedValueOnce(json({ voices: [{ voice_id: 'b', name: 'B' }], has_more: false, next_page_token: null }))
    vi.stubGlobal('fetch', fetchMock)

    const catalog = await listVoices('elevenlabs', 'xi')
    expect(catalog.items.map((v) => v.id)).toEqual(['a', 'b'])
    expect(String(fetchMock.mock.calls[1][0])).toContain('next_page_token=p2')
  })
})

describe('estimateCost', () => {
  it('prices known models, including dated snapshots', () => {
    expect(estimateCost('gpt-4.1', 1_000_000, 1_000_000)).toBeCloseTo(10)
    expect(estimateCost('gpt-4.1-2025-04-14', 1_000_000, 0)).toBeCloseTo(2)
  })

  it('returns null for models without a known price', () => {
    expect(estimateCost('gpt-9-nova', 1000, 1000)).toBeNull()
  })
})
