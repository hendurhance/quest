import { AIProvider } from '@/types'
import type { SummaryProviderId, TTSProviderId } from '@/core/db'
import { loadSettings } from '@/core/settings'
import { getApiKey } from '@/core/keys'

export interface SummaryConfig {
  provider: SummaryProviderId
  model: string
  apiKey: string
}

export interface TtsConfig {
  provider: TTSProviderId
  model: string
  voiceId: string
  apiKey: string
}

function keyError(provider: SummaryProviderId | TTSProviderId): Error {
  const name = provider === 'openai' ? 'OpenAI' : provider === 'elevenlabs' ? 'ElevenLabs' : 'Gemini'
  return new Error(`${name} API key not configured. Add it in Settings → AI.`)
}

function summaryProviderEnum(id: SummaryProviderId): AIProvider {
  return id === 'openai' ? AIProvider.OPENAI : AIProvider.GEMINI
}

function ttsProviderEnum(id: TTSProviderId): AIProvider {
  return id === 'elevenlabs' ? AIProvider.ELEVENLABS : AIProvider.GEMINI
}

export async function resolveSummaryConfig(override?: SummaryProviderId): Promise<SummaryConfig> {
  const settings = await loadSettings()
  const provider: SummaryProviderId =
    override ?? (settings.summaryProvider === AIProvider.OPENAI ? 'openai' : 'gemini')
  const model = provider === 'openai' ? settings.openaiModel : settings.geminiModel
  const apiKey = await getApiKey(summaryProviderEnum(provider))
  if (!apiKey) throw keyError(provider)
  return { provider, model, apiKey }
}

export async function resolveTtsConfig(): Promise<TtsConfig> {
  const settings = await loadSettings()
  const provider: TTSProviderId = settings.ttsProvider === AIProvider.ELEVENLABS ? 'elevenlabs' : 'gemini'
  const model = provider === 'elevenlabs' ? settings.elevenlabsModel : settings.geminiTtsModel ?? ''
  const voiceId = provider === 'elevenlabs' ? settings.elevenlabsVoiceId : settings.geminiTtsVoice
  const apiKey = await getApiKey(ttsProviderEnum(provider))
  if (!apiKey) throw keyError(provider)
  return { provider, model, voiceId, apiKey }
}
