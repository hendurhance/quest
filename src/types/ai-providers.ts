/**
 * AI Provider Type Definitions
 * Centralized type system for AI providers used across the application
 */

/**
 * AI Provider Enum
 * Use this instead of string literals throughout the app
 */
export enum AIProvider {
  OPENAI = 'openai',
  GEMINI = 'gemini',
  ELEVENLABS = 'elevenlabs'
}

/**
 * Summary Type Enum
 * Use this instead of string literals for summary types
 */
export enum SummaryType {
  CONCISE = 'concise',
  EXTENDED = 'extended'
}

/**
 * Summary Provider Type (subset of AI providers that can generate summaries)
 */
export type SummaryProvider = AIProvider.OPENAI | AIProvider.GEMINI

/**
 * TTS Provider Type (subset of AI providers that can generate audio)
 */
export type TTSProvider = AIProvider.GEMINI | AIProvider.ELEVENLABS

/**
 * Type guard to check if a provider is a valid summary provider
 */
export function isSummaryProvider(provider: AIProvider): provider is SummaryProvider {
  return provider === AIProvider.OPENAI || provider === AIProvider.GEMINI
}

/**
 * Type guard to check if a provider is a valid TTS provider
 */
export function isTTSProvider(provider: AIProvider): provider is TTSProvider {
  return provider === AIProvider.GEMINI || provider === AIProvider.ELEVENLABS
}

/**
 * Convert string to AIProvider enum (with validation)
 */
export function toAIProvider(value: string): AIProvider {
  const normalized = value.toLowerCase()
  
  switch (normalized) {
    case 'openai':
      return AIProvider.OPENAI
    case 'gemini':
      return AIProvider.GEMINI
    case 'elevenlabs':
      return AIProvider.ELEVENLABS
    default:
      throw new Error(`Invalid AI provider: ${value}`)
  }
}

/**
 * Get display name for a provider
 */
export function getProviderDisplayName(provider: AIProvider): string {
  switch (provider) {
    case AIProvider.OPENAI:
      return 'OpenAI'
    case AIProvider.GEMINI:
      return 'Gemini'
    case AIProvider.ELEVENLABS:
      return 'ElevenLabs'
  }
}

/**
 * Convert string to SummaryType enum (with validation)
 */
export function toSummaryType(value: string): SummaryType {
  const normalized = value.toLowerCase()
  
  switch (normalized) {
    case 'concise':
      return SummaryType.CONCISE
    case 'extended':
      return SummaryType.EXTENDED
    default:
      throw new Error(`Invalid summary type: ${value}`)
  }
}

/**
 * Get display name for a summary type
 */
export function getSummaryTypeDisplayName(type: SummaryType): string {
  switch (type) {
    case SummaryType.CONCISE:
      return 'Concise'
    case SummaryType.EXTENDED:
      return 'Extended'
  }
}
