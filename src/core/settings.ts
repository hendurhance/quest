import type { Settings } from '@/types'
import { AIProvider } from '@/types'
import { OPENAI_MODELS, GEMINI_MODELS, GEMINI_TTS_MODELS, ELEVENLABS_MODELS } from '@/core/ai/models'
import { ELEVENLABS_VOICES, GEMINI_VOICES } from '@/core/ai/voices'

export function defaultSettings(): Settings {
  return {
    theme: 'light',
    autoArchive: false,
    archiveDays: 30,
    reminderEnabled: false,
    reminderTime: '09:00',
    defaultCategory: 'Uncategorized',
    autoSummary: false,
    autoPodcast: false,
    autoGroup: false,
    summaryProvider: AIProvider.GEMINI,
    openaiModel: OPENAI_MODELS[5].id,
    geminiModel: GEMINI_MODELS[1].id,
    ttsProvider: AIProvider.GEMINI,
    elevenlabsModel: ELEVENLABS_MODELS[2].id,
    elevenlabsVoiceId: ELEVENLABS_VOICES[0].id,
    geminiTtsModel: GEMINI_TTS_MODELS[0].id,
    geminiTtsVoice: GEMINI_VOICES[0].id,
  }
}

export async function loadSettings(): Promise<Settings> {
  const result = await chrome.storage.sync.get(['settings'])
  return { ...defaultSettings(), ...((result.settings as Partial<Settings>) ?? {}) }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set({ settings })
}
