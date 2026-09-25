import type { Settings } from '@/types'
import { AIProvider } from '@/types'
import { GEMINI_VOICES } from '@/core/ai/voices'

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
    closeTabAfterSave: true,
    summaryProvider: AIProvider.GEMINI,
    openaiModel: '',
    geminiModel: '',
    ttsProvider: AIProvider.GEMINI,
    elevenlabsModel: '',
    elevenlabsVoiceId: '',
    geminiTtsModel: '',
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
