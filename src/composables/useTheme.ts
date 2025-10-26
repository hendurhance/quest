import { ref, watch, onMounted } from 'vue'

export function useTheme() {
  const theme = ref<'light' | 'dark'>('light')
  const isLoading = ref(false)

  const loadTheme = async () => {
    try {
      // Check if chrome.storage is available
      if (typeof chrome === 'undefined' || !chrome.storage) {
        applyTheme('light')
        return
      }
      
      const result = await chrome.storage.sync.get(['settings'])
      const savedTheme = result.settings?.theme || 'light'
      theme.value = savedTheme
      applyTheme(savedTheme)
    } catch (error) {
      applyTheme('light')
    }
  }

  const toggleTheme = async () => {
    const newTheme = theme.value === 'light' ? 'dark' : 'light'
    theme.value = newTheme
    
    try {
      // Check if chrome.storage is available
      if (typeof chrome === 'undefined' || !chrome.storage) {
        applyTheme(newTheme)
        return
      }
      
      const result = await chrome.storage.sync.get(['settings'])
      const settings = result.settings || {}
      settings.theme = newTheme
      await chrome.storage.sync.set({ settings })
      applyTheme(newTheme)
    } catch (error) {
      console.error('Failed to save theme:', error)
      // Still apply the theme visually even if saving fails
      applyTheme(newTheme)
    }
  }

  const applyTheme = (themeName: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', themeName)
  }

  // Watch for theme changes
  watch(theme, (newTheme) => {
    applyTheme(newTheme)
  })

  onMounted(async () => {
    await loadTheme()
  })

  return {
    theme,
    isLoading,
    toggleTheme,
    loadTheme,
  }
}
