/**
 * Voice Configuration for TTS Services
 * Last Updated: 22nd October 2025
 * 
 * ElevenLabs voices from: https://api.elevenlabs.io/v2/voices
 * Google (Gemini) voices from: https://cloud.google.com/text-to-speech/docs/gemini-tts#voice_options
 */

import { AIProvider } from '@/types/ai-providers'
import type { TTSProvider } from '@/types/ai-providers'

export interface VoiceOption {
  id: string
  name: string
  gender: 'male' | 'female'
  description?: string
  accent?: string
  age?: string
  useCase?: string
}

/**
 * ElevenLabs Voice Options
 * Selected 8 high-quality voices with diverse characteristics
 */
export const ELEVENLABS_VOICES: VoiceOption[] = [
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    gender: 'female',
    description: 'Matter-of-fact, personable woman. Great for conversational use cases.',
    accent: 'american',
    age: 'young',
    useCase: 'conversational'
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    gender: 'female',
    description: 'Young adult woman with a confident and warm, mature quality and a reassuring, professional tone.',
    accent: 'american',
    age: 'young',
    useCase: 'entertainment_tv'
  },
  {
    id: '9BWtsMINqrJLrRacOk9x',
    name: 'Aria',
    gender: 'female',
    description: 'A middle-aged female with an African-American accent. Calm with a hint of rasp.',
    accent: 'american',
    age: 'middle_aged',
    useCase: 'informative_educational'
  },
  {
    id: 'AZnzlk1XvdvUeBnXmlld',
    name: 'Domi',
    gender: 'female',
    description: 'Strong and confident voice',
    accent: 'american',
    age: 'young',
    useCase: 'narration'
  },
  {
    id: '29vD33N1CtxCmqQRPOHJ',
    name: 'Drew',
    gender: 'male',
    description: 'Well-rounded male voice',
    accent: 'american',
    age: 'middle_aged',
    useCase: 'news'
  },
  {
    id: '5Q0t7uMcjvnagumLfvZi',
    name: 'Paul',
    gender: 'male',
    description: 'Authoritative male voice',
    accent: 'american',
    age: 'middle_aged',
    useCase: 'news'
  },
  {
    id: 'CwhRBWXzGAHq8TQ4Fs17',
    name: 'Roger',
    gender: 'male',
    description: 'Easy going and perfect for casual conversations.',
    accent: 'american',
    age: 'middle_aged',
    useCase: 'conversational'
  },
  {
    id: 'CYw3kZ02Hs0563khs1Fj',
    name: 'Dave',
    gender: 'male',
    description: 'Conversational British voice',
    accent: 'british',
    age: 'young',
    useCase: 'characters'
  }
]

/**
 * Google (Gemini) TTS Voice Options
 * All available voices from Gemini TTS service
 */
export const GEMINI_VOICES: VoiceOption[] = [
  { id: 'Achernar', name: 'Achernar', gender: 'female' },
  { id: 'Achird', name: 'Achird', gender: 'male' },
  { id: 'Algenib', name: 'Algenib', gender: 'male' },
  { id: 'Algieba', name: 'Algieba', gender: 'male' },
  { id: 'Alnilam', name: 'Alnilam', gender: 'male' },
  { id: 'Aoede', name: 'Aoede', gender: 'female' },
  { id: 'Autonoe', name: 'Autonoe', gender: 'female' },
  { id: 'Callirrhoe', name: 'Callirrhoe', gender: 'female' },
  { id: 'Charon', name: 'Charon', gender: 'male' },
  { id: 'Despina', name: 'Despina', gender: 'female' },
  { id: 'Enceladus', name: 'Enceladus', gender: 'male' },
  { id: 'Erinome', name: 'Erinome', gender: 'female' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'male' },
  { id: 'Gacrux', name: 'Gacrux', gender: 'female' },
  { id: 'Iapetus', name: 'Iapetus', gender: 'male' },
  { id: 'Kore', name: 'Kore', gender: 'female' },
  { id: 'Laomedeia', name: 'Laomedeia', gender: 'female' },
  { id: 'Leda', name: 'Leda', gender: 'female' },
  { id: 'Orus', name: 'Orus', gender: 'male' },
  { id: 'Pulcherrima', name: 'Pulcherrima', gender: 'female' },
  { id: 'Puck', name: 'Puck', gender: 'male' },
  { id: 'Rasalgethi', name: 'Rasalgethi', gender: 'male' },
  { id: 'Sadachbia', name: 'Sadachbia', gender: 'male' },
  { id: 'Sadaltager', name: 'Sadaltager', gender: 'male' },
  { id: 'Schedar', name: 'Schedar', gender: 'male' },
  { id: 'Sulafat', name: 'Sulafat', gender: 'female' },
  { id: 'Umbriel', name: 'Umbriel', gender: 'male' },
  { id: 'Vindemiatrix', name: 'Vindemiatrix', gender: 'female' },
  { id: 'Zephyr', name: 'Zephyr', gender: 'female' },
  { id: 'Zubenelgenubi', name: 'Zubenelgenubi', gender: 'male' }
]

/**
 * Get voice options for a specific provider
 */
export function getVoiceOptions(provider: TTSProvider): VoiceOption[] {
  return provider === AIProvider.ELEVENLABS ? ELEVENLABS_VOICES : GEMINI_VOICES
}

/**
 * Get a voice by ID
 */
export function getVoiceById(provider: TTSProvider, voiceId: string): VoiceOption | undefined {
  const voices = getVoiceOptions(provider)
  return voices.find(voice => voice.id === voiceId)
}

/**
 * Get formatted voice label for display
 */
export function getVoiceLabel(voice: VoiceOption): string {
  const genderIcon = voice.gender === 'female' ? '♀' : '♂'
  const parts = [voice.name, genderIcon]
  
  if (voice.description) {
    parts.push(`- ${voice.description}`)
  } else if (voice.accent) {
    parts.push(`(${voice.accent})`)
  }
  
  return parts.join(' ')
}
