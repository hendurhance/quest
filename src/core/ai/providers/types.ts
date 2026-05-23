import type { SummaryProviderId, TTSProviderId } from '@/core/db'

export interface SummaryRequest {
  prompt: string
  model: string
  apiKey: string
}

export interface SummaryResult {
  content: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface SummaryProviderClient {
  readonly id: SummaryProviderId
  summarize(req: SummaryRequest): Promise<SummaryResult>
}

export interface SpeechRequest {
  text: string
  voiceId: string
  model: string
  apiKey: string
}

export interface SpeechResult {
  data: ArrayBuffer
  mimeType: string
  durationSec: number
}

export interface TTSProviderClient {
  readonly id: TTSProviderId
  speak(req: SpeechRequest): Promise<SpeechResult>
}
