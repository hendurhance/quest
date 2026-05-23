import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Settings } from '@/types'
import { defaultSettings, loadSettings, saveSettings } from '@/core/settings'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings | null>(null)
  const loaded = ref(false)

  async function load(): Promise<void> {
    settings.value = await loadSettings()
    loaded.value = true
  }

  async function save(next: Settings): Promise<void> {
    settings.value = next
    await saveSettings(next)
  }

  async function update(patch: Partial<Settings>): Promise<void> {
    await save({ ...(settings.value ?? defaultSettings()), ...patch })
  }

  return { settings, loaded, load, save, update }
})
