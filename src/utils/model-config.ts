/**
 * Model Configuration for AI Providers
 * Last Updated: 24th October 2025
 * 
 * OpenAI models from: https://platform.openai.com/docs/models
 * OpenAI pricing from: https://openai.com/api/pricing/
 * Gemini models from: https://ai.google.dev/gemini-api/docs/models
 * Gemini pricing from: https://ai.google.dev/gemini-api/docs/pricing
 * Gemini TTS pricing from: https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash-preview-tts
 * ElevenLabs models from: https://elevenlabs.io/docs/models#text-to-speech
 */

import { AIProvider } from '@/types/ai-providers'
import type { SummaryProvider } from '@/types/ai-providers'

export interface ModelOption {
    id: string
    name: string
    description: string
    intelligence?: 'highest' | 'high' | 'average'
    reasoning?: 'highest' | 'high' | 'average'
    speed: 'very fast' | 'fast' | 'medium' | 'slow'
    inputPrice: number // Price per 1M tokens
    outputPrice: number // Price per 1M tokens
    recommended?: boolean
}

export interface TTSModelOption {
    id: string
    name: string
    description: string
    features: string[]
    speed: 'ultra-low' | 'low' | 'medium' | 'fast'
    latency?: string
    characterLimit: number
    languageCount: number
    pricePerCharacter?: number // Price per 1M characters
    recommended?: boolean
}

/**
 * OpenAI Model Options
 * GPT-5 series (reasoning models) and GPT-4.1 series (intelligence models)
 */
export const OPENAI_MODELS: ModelOption[] = [
    // GPT-5 Series - Reasoning Models
    {
        id: 'gpt-5-nano',
        name: 'GPT-5 Nano',
        description: 'Fastest, most cost-efficient version of GPT-5',
        reasoning: 'average',
        speed: 'very fast',
        inputPrice: 0.05,
        outputPrice: 0.4,
        recommended: true   
    },
    {
        id: 'gpt-5-mini',
        name: 'GPT-5 Mini',
        description: 'A faster, cost-efficient version of GPT-5 for well-defined tasks',
        reasoning: 'high',
        speed: 'fast',
        inputPrice: 0.25,
        outputPrice: 2.0,
    },
    {
        id: 'gpt-5',
        name: 'GPT-5',
        description: 'Best model for coding and agentic tasks across industries',
        reasoning: 'highest',
        speed: 'medium',
        inputPrice: 1.25,
        outputPrice: 10.0,
    },

    // GPT-4.1 Series - Intelligence Models
    {
        id: 'gpt-4.1-nano',
        name: 'GPT-4.1 Nano',
        description: 'Fastest, most cost-efficient version of GPT-4.1',
        intelligence: 'average',
        speed: 'very fast',
        inputPrice: 0.1,
        outputPrice: 0.4,
    },
    {
        id: 'gpt-4.1-mini',
        name: 'GPT-4.1 Mini',
        description: 'Smaller, faster version of GPT-4.1',
        intelligence: 'high',
        speed: 'fast',
        inputPrice: 0.4,
        outputPrice: 1.6,
    },
    {
        id: 'gpt-4.1',
        name: 'GPT-4.1',
        description: 'Smartest non-reasoning model',
        intelligence: 'highest',
        speed: 'medium',
        inputPrice: 2.0,
        outputPrice: 8.0,
    },
]

/**
 * Gemini Model Options
 * Gemini 2.5 series with different performance tiers
 */
export const GEMINI_MODELS: ModelOption[] = [
    {
        id: 'gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash-Lite',
        description: 'Fastest flash model optimized for cost-efficiency and high throughput',
        intelligence: 'average',
        speed: 'very fast',
        inputPrice: 0.10,
        outputPrice: 0.40,
    },
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Best model in terms of price-performance, offering well-rounded capabilities',
        intelligence: 'high',
        speed: 'fast',
        inputPrice: 0.30,
        outputPrice: 2.50,
        recommended: true
    },
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'State-of-the-art thinking model, capable of reasoning over complex problems',
        intelligence: 'highest',
        speed: 'medium',
        inputPrice: 1.25,
        outputPrice: 10.00,
    },
]

/**
 * Get model options for a specific provider
 */
export function getModelOptions(provider: SummaryProvider): ModelOption[] {
    return provider === AIProvider.OPENAI ? OPENAI_MODELS : GEMINI_MODELS
}

/**
 * Get a model by ID
 */
export function getModelById(provider: SummaryProvider, modelId: string): ModelOption | undefined {
    const models = getModelOptions(provider)
    return models.find(model => model.id === modelId)
}

/**
 * Calculate estimated cost for a given token usage
 */
export function calculateCost(
    provider: SummaryProvider,
    modelId: string,
    inputTokens: number,
    outputTokens: number
): number {
    const model = getModelById(provider, modelId)
    if (!model) return 0

    const inputCost = (inputTokens / 1000000) * model.inputPrice
    const outputCost = (outputTokens / 1000000) * model.outputPrice

    return inputCost + outputCost
}

/**
 * Get formatted model label for display
 */
export function getModelLabel(model: ModelOption): string {
    const parts = [model.name]

    if (model.recommended) {
        parts.push('⭐')
    }

    parts.push(`(${model.description})`)

    return parts.join(' ')
}

/**
 * Get formatted pricing info
 */
export function getPricingInfo(model: ModelOption): string {
    return `$${model.inputPrice} / $${model.outputPrice} per 1M tokens`
}

/**
 * Gemini TTS Model Options
 * Text-to-Speech models from Gemini
 */
export const GEMINI_TTS_MODELS: TTSModelOption[] = [
    {
        id: 'gemini-2.5-flash-preview-tts',
        name: 'Gemini 2.5 Flash TTS',
        description: 'Fast, cost-effective text-to-speech with Gemini Flash',
        features: ['Fast generation', 'Cost-effective', 'Good quality'],
        speed: 'fast',
        characterLimit: 5000,
        languageCount: 70,
        pricePerCharacter: 10.0, // $10 per 1M characters
        recommended: true
    },
    {
        id: 'gemini-2.5-pro-preview-tts',
        name: 'Gemini 2.5 Pro TTS',
        description: 'Premium text-to-speech with highest quality',
        features: ['Highest quality', 'Natural intonation', 'Emotional range'],
        speed: 'medium',
        characterLimit: 5000,
        languageCount: 70,
        pricePerCharacter: 80.0, // $80 per 1M characters
    },
]

/**
 * ElevenLabs TTS Model Options
 * Text-to-Speech models from ElevenLabs
 */
export const ELEVENLABS_MODELS: TTSModelOption[] = [
    {
        id: 'eleven_flash_v2_5',
        name: 'Eleven Flash v2.5',
        description: 'Ultra-low latency, fast and affordable speech synthesis',
        features: ['Ultra-low latency (~75ms)', 'Fastest model', '50% lower price'],
        speed: 'ultra-low',
        latency: '~75ms',
        characterLimit: 40000,
        languageCount: 32,
    },
    {
        id: 'eleven_turbo_v2_5',
        name: 'Eleven Turbo v2.5',
        description: 'High quality, low-latency with good balance of quality and speed',
        features: ['High quality', 'Low latency (~250-300ms)', '50% lower price'],
        speed: 'low',
        latency: '~250-300ms',
        characterLimit: 40000,
        languageCount: 32,
    },
    {
        id: 'eleven_multilingual_v2',
        name: 'Eleven Multilingual v2',
        description: 'Lifelike, consistent quality speech synthesis',
        features: ['Natural-sounding output', 'Most stable on long-form', '29 languages'],
        speed: 'medium',
        characterLimit: 10000,
        languageCount: 29,
        recommended: true
    },
    {
        id: 'eleven_v3',
        name: 'Eleven v3',
        description: 'Most emotionally rich, expressive speech synthesis (Alpha)',
        features: ['Dramatic delivery', 'Multi-speaker dialogue', '70+ languages'],
        speed: 'medium',
        characterLimit: 3000,
        languageCount: 70,
    },
]

/**
 * Get TTS model options for a specific provider
 */
export function getTTSModelOptions(provider: AIProvider.GEMINI | AIProvider.ELEVENLABS): TTSModelOption[] {
    return provider === AIProvider.GEMINI ? GEMINI_TTS_MODELS : ELEVENLABS_MODELS
}

/**
 * Get a TTS model by ID
 */
export function getTTSModelById(provider: AIProvider.GEMINI | AIProvider.ELEVENLABS, modelId: string): TTSModelOption | undefined {
    const models = getTTSModelOptions(provider)
    return models.find(model => model.id === modelId)
}

/**
 * Get formatted TTS model label for display
 */
export function getTTSModelLabel(model: TTSModelOption): string {
    const parts = [model.name]

    if (model.recommended) {
        parts.push('⭐')
    }

    if (model.latency) {
        parts.push(`(${model.latency})`)
    }

    return parts.join(' ')
}
