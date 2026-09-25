import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AIProvider } from '@/types'
import type { Settings } from '@/types'
import { defaultSettings } from '@/core/settings'
import { SettingsError } from '@/core/ai/providers/errors'

const state = vi.hoisted(() => ({
  settings: {} as Partial<Settings>,
  keys: {} as Record<string, string>,
}))

vi.mock('@/core/settings', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/core/settings')>()),
  loadSettings: async () => ({ ...defaultSettings(), ...state.settings }),
}))
vi.mock('@/core/keys', () => ({
  getApiKey: async (provider: string) => state.keys[provider] ?? null,
}))

const { resolveSummaryConfig, resolveTtsConfig, aiReadiness } = await import('@/core/ai/config')

beforeEach(() => {
  state.settings = {}
  state.keys = {}
})

describe('resolveSummaryConfig', () => {
  it('asks for a key first', async () => {
    const error = await resolveSummaryConfig().catch((e) => e)
    expect(error).toBeInstanceOf(SettingsError)
    expect(error.message).toBe('Gemini API key not configured. Add it in Settings → Summaries.')
  })

  it('asks for a model when none is chosen (the new-install default)', async () => {
    state.keys[AIProvider.GEMINI] = 'AIza'
    const error = await resolveSummaryConfig().catch((e) => e)
    expect(error).toBeInstanceOf(SettingsError)
    expect(error.message).toBe('No Gemini model chosen. Pick one in Settings → Summaries.')
  })

  it('resolves the chosen provider, model and key', async () => {
    state.settings = { summaryProvider: AIProvider.OPENAI, openaiModel: 'gpt-6-luna' }
    state.keys[AIProvider.OPENAI] = 'sk'
    await expect(resolveSummaryConfig()).resolves.toEqual({ provider: 'openai', model: 'gpt-6-luna', apiKey: 'sk' })
  })
})

describe('resolveTtsConfig', () => {
  it('needs a voice model and a voice', async () => {
    state.settings = { ttsProvider: AIProvider.ELEVENLABS, elevenlabsModel: 'eleven_v4' }
    state.keys[AIProvider.ELEVENLABS] = 'xi'
    await expect(resolveTtsConfig()).rejects.toThrow('No ElevenLabs voice chosen. Pick one in Settings → Podcasts.')
  })
})

describe('aiReadiness', () => {
  it('reports a podcast as not ready without a summary, even when speech is configured', async () => {
    state.settings = { geminiTtsModel: 'gemini-3.8-flash-tts' }
    state.keys[AIProvider.GEMINI] = 'AIza'
    await expect(aiReadiness()).resolves.toEqual({ summary: false, podcast: false })
  })

  it('reports both ready when summary and speech are configured', async () => {
    state.settings = { geminiModel: 'gemini-3.8-flash', geminiTtsModel: 'gemini-3.8-flash-tts' }
    state.keys[AIProvider.GEMINI] = 'AIza'
    await expect(aiReadiness()).resolves.toEqual({ summary: true, podcast: true })
  })
})
