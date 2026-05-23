import { ref, onMounted } from 'vue'

type Theme = 'light' | 'dark'

const LS_KEY = 'quest-theme'

/**
 * Apply the last-known theme synchronously (from localStorage) before the app
 * mounts, so dark-mode users don't get a flash of light paper. chrome.storage
 * is async and would paint light first; localStorage is the instant mirror.
 */
export function applyStoredTheme(): void {
  let stored: string | null = null
  try {
    stored = localStorage.getItem(LS_KEY)
  } catch {
    // localStorage unavailable — fall through to light
  }
  document.documentElement.setAttribute('data-theme', stored === 'dark' ? 'dark' : 'light')
}

// Module-level so every useTheme() consumer (header toggle, settings, …) shares
// one reactive source of truth.
const theme = ref<Theme>('light')

export function useTheme() {
  function apply(value: Theme): void {
    theme.value = value
    document.documentElement.setAttribute('data-theme', value)
    try {
      localStorage.setItem(LS_KEY, value)
    } catch {
      // ignore
    }
  }

  async function persist(value: Theme): Promise<void> {
    apply(value)
    if (typeof chrome === 'undefined' || !chrome.storage) return
    try {
      const { settings } = await chrome.storage.sync.get(['settings'])
      await chrome.storage.sync.set({ settings: { ...(settings ?? {}), theme: value } })
    } catch (error) {
      console.error('Failed to save theme:', error)
    }
  }

  function setTheme(value: Theme): Promise<void> {
    return persist(value)
  }

  function toggleTheme(): Promise<void> {
    return persist(theme.value === 'light' ? 'dark' : 'light')
  }

  async function loadTheme(): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage) return
    try {
      const { settings } = await chrome.storage.sync.get(['settings'])
      apply(settings?.theme === 'dark' ? 'dark' : 'light')
    } catch {
      apply('light')
    }
  }

  onMounted(loadTheme)

  return { theme, setTheme, toggleTheme, loadTheme }
}
