import { AIProvider, getProviderDisplayName } from '@/types'
import type { SummaryProviderId, TTSProviderId } from '@/core/db'
import { loadSettings } from '@/core/settings'
import { getApiKey } from '@/core/keys'
import { SettingsError } from './providers/errors'

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

function summaryProviderEnum(id: SummaryProviderId): AIProvider {
  return id === 'openai' ? AIProvider.OPENAI : AIProvider.GEMINI
}

function ttsProviderEnum(id: TTSProviderId): AIProvider {
  return id === 'elevenlabs' ? AIProvider.ELEVENLABS : AIProvider.GEMINI
}

function providerName(provider: SummaryProviderId | TTSProviderId): string {
  return getProviderDisplayName(provider === 'openai' ? AIProvider.OPENAI : ttsProviderEnum(provider))
}

function keyError(provider: SummaryProviderId | TTSProviderId, section: string): SettingsError {
  return new SettingsError(`${providerName(provider)} API key not configured. Add it in Settings → ${section}.`)
}

function choiceError(provider: SummaryProviderId | TTSProviderId, what: string, section: string): SettingsError {
  return new SettingsError(`No ${providerName(provider)} ${what} chosen. Pick one in Settings → ${section}.`)
}


export async function resolveSummaryConfig(override?: SummaryProviderId): Promise<SummaryConfig> {
  const settings = await loadSettings()
  const provider: SummaryProviderId =
    override ?? (settings.summaryProvider === AIProvider.OPENAI ? 'openai' : 'gemini')
  const model = provider === 'openai' ? settings.openaiModel : settings.geminiModel
  const apiKey = await getApiKey(summaryProviderEnum(provider))
  if (!apiKey) throw keyError(provider, 'Summaries')
  if (!model) throw choiceError(provider, 'model', 'Summaries')
  return { provider, model, apiKey }
}

export async function resolveTtsConfig(): Promise<TtsConfig> {
  const settings = await loadSettings()
  const provider: TTSProviderId = settings.ttsProvider === AIProvider.ELEVENLABS ? 'elevenlabs' : 'gemini'
  const model = provider === 'elevenlabs' ? settings.elevenlabsModel : settings.geminiTtsModel ?? ''
  const voiceId = provider === 'elevenlabs' ? settings.elevenlabsVoiceId : settings.geminiTtsVoice
  const apiKey = await getApiKey(ttsProviderEnum(provider))
  if (!apiKey) throw keyError(provider, 'Podcasts')
  if (!model) throw choiceError(provider, 'voice model', 'Podcasts')
  if (!voiceId) throw choiceError(provider, 'voice', 'Podcasts')
  return { provider, model, voiceId, apiKey }
}

export async function aiReadiness(): Promise<{ summary: boolean; podcast: boolean }> {
  const ok = (p: Promise<unknown>) => p.then(() => true, () => false)
  const [summary, tts] = await Promise.all([ok(resolveSummaryConfig()), ok(resolveTtsConfig())])
  return { summary, podcast: summary && tts }
}
