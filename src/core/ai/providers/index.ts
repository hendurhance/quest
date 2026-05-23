import type { SummaryProviderId, TTSProviderId } from '@/core/db'
import type { SummaryProviderClient, TTSProviderClient } from './types'
import { openAIProvider } from './openai'
import { geminiProvider } from './gemini'
import { elevenLabsProvider } from './elevenlabs'
import { geminiTtsProvider } from './gemini-tts'

const summaryProviders: Record<SummaryProviderId, SummaryProviderClient> = {
  openai: openAIProvider,
  gemini: geminiProvider,
}

const ttsProviders: Record<TTSProviderId, TTSProviderClient> = {
  gemini: geminiTtsProvider,
  elevenlabs: elevenLabsProvider,
}

export function getSummaryProvider(id: SummaryProviderId): SummaryProviderClient {
  return summaryProviders[id]
}

export function getTtsProvider(id: TTSProviderId): TTSProviderClient {
  return ttsProviders[id]
}

export type { SummaryProviderClient, TTSProviderClient } from './types'
