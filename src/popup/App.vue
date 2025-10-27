<template>
  <div class="container">
    <!-- Header -->
    <Header @toggle-theme="toggleTheme" @open-manager="openManager" />

    <!-- Current Page -->
    <CurrentPage
      :favicon="currentPage.favicon || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiNkZGQiIHJ4PSIzIi8+PHBhdGggZD0iTTEyIDIyYzUuNTIzIDAgMTAtNC40NzcgMTAtMTBTMTcuNTIzIDIgMTIgMlMyIDYuNDc3IDIgMTJzNC40NzcgMTAgMTAgMTB6IiBmaWxsPSIjOTk5Ii8+PHBhdGggZD0iTTEyIDEwYzEuMSAwIDItLjkgMi0ycy0uOS0yLTItMi0yIC45LTIgMiAuOSAyIDIgMnoiIGZpbGw9IiNmZmYiLz48L3N2Zz4='"
      :title="currentPage.title"
      :domain="currentPage.domain"
      :reading-time="currentPage.readingTime"
    />

    <!-- Save Section -->
    <SaveSection
      v-model:tags-input="tagsInput"
      v-model:selected-category="selectedCategory"
      v-model:close-tab-after-save="closeTabAfterSave"
      v-model:generate-summary="generateSummary"
      v-model:create-podcast="createPodcast"
      :is-saving="isSaving"
      :is-already-saved="isAlreadySaved"
      :categories="categories"
      :all-tags="allTags"
      @save="saveCurrentArticle"
      @create-category="showCategoryModal = true"
    />

    <!-- Quick Stats -->
    <QuickStats
      :total-articles="stats.totalSaved"
      :unread-articles="stats.unread"
      :read-today="stats.readToday"
    />

    <!-- Recent Items -->
    <RecentItems
      title="Recent Saves"
      :items="recentArticlesFormatted"
      empty-message="No articles saved yet"
      @item-click="handleItemClick"
    />

    <!-- Quick Actions -->
    <QuickActions @open-manager="openManager" @open-random="openRandomArticle" />
  </div>

  <!-- Category Modal -->
  <CategoryModal
    :is-open="showCategoryModal"
    :existing-categories="categories"
    @close="showCategoryModal = false"
    @create="handleCategoryCreate"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useStorage } from '@/composables/useStorage'
import { useTheme } from '@/composables/useTheme'
import { storage } from '@/utils/storage'
import { formatRelativeTime, normalizeUrl } from '@/utils/formatters'
import { AIProvider, SummaryType } from '@/types'
import CategoryModal from '@/components/CategoryModal.vue'
import Header from './components/Header.vue'
import CurrentPage from './components/CurrentPage.vue'
import SaveSection from './components/SaveSection.vue'
import QuickStats from './components/QuickStats.vue'
import RecentItems from './components/RecentItems.vue'
import QuickActions from './components/QuickActions.vue'
import type { RecentItem } from './components/RecentItems.vue'

const { articles, categories, loadArticles, loadCategories, saveArticle } = useStorage()
const { toggleTheme } = useTheme()

// Current page state
const currentPage = ref({
  title: 'Loading...',
  url: '',
  domain: '',
  favicon: '',
  wordCount: 0,
  readingTime: '',
})

// Form state
const tagsInput = ref('')
const selectedCategory = ref('')
const closeTabAfterSave = ref(true)
const generateSummary = ref(false)
const createPodcast = ref(false)
const isSaving = ref(false)
const isAlreadySaved = ref(false)

// Category modal
const showCategoryModal = ref(false)

// Stats
const stats = ref({
  totalSaved: 0,
  unread: 0,
  readToday: 0,
})

// Recent articles (last 5)
const recentArticles = computed(() => {
  return articles.value
    .sort((a, b) => new Date(b.timestamps.dateAdded).getTime() - new Date(a.timestamps.dateAdded).getTime())
    .slice(0, 5)
})

// Format recent articles for RecentItems component
const recentArticlesFormatted = computed<RecentItem[]>(() => {
  return recentArticles.value.map(article => ({
    id: article.id,
    title: article.title,
    favicon: article.favicon,
    category: getCategoryName(article.organization.category),
    savedDate: formatRelativeTime(article.timestamps.dateAdded)
  }))
})

// All unique tags for tag suggestions
const allTags = computed(() => {
  return Array.from(new Set(articles.value.flatMap(a => a.organization.tags)))
})

// Helper to get category name
const getCategoryName = (categoryId: string): string => {
  const category = categories.value.find(c => c.id === categoryId)
  return category?.name || 'Uncategorized'
}

// Handle item click
const handleItemClick = (item: RecentItem) => {
  openArticle(item.id)
}

onMounted(async () => {
  await initializeDefaultCategories()
  await loadUserSettings()
  await loadCurrentPageInfo()
  await loadCategories()
  await loadArticles()
  await checkIfPageAlreadySaved()
  updateStats()
})

const initializeDefaultCategories = async () => {
  try {
    await storage.init()
    const existingCategories = await storage.getAllCategories()
    
    // If no categories exist, create defaults
    if (existingCategories.length === 0) {
      const defaultCategories = [
        { name: 'Work', color: '#3b82f6' },
        { name: 'Personal', color: '#10b981' },
        { name: 'Research', color: '#8b5cf6' },
        { name: 'General', color: '#6b7280' },
        { name: 'Articles', color: '#1daabf' },
        { name: 'Development', color: '#06b6d4' },
        { name: 'Videos', color: '#ec4899' },
        { name: 'News', color: '#ef4444' },
      ]
      
      for (const cat of defaultCategories) {
        await storage.saveCategory(cat.name, cat.color)
      }
    }
  } catch (error) {
    console.error('Error initializing default categories:', error)
  }
}

const loadUserSettings = async () => {
  try {
    const result = await chrome.storage.sync.get(['settings'])
    if (result.settings) {
      // Update checkboxes based on user's saved settings
      if (result.settings.autoSummary !== undefined) {
        generateSummary.value = result.settings.autoSummary
      }
      if (result.settings.autoPodcast !== undefined) {
        createPodcast.value = result.settings.autoPodcast
      }
    }
  } catch (error) {
    console.error('Error loading user settings:', error)
  }
}

const loadCurrentPageInfo = async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab) {
      currentPage.value = {
        title: tab.title || 'Untitled',
        url: tab.url || '',
        domain: new URL(tab.url || '').hostname.replace('www.', ''),
        favicon: tab.favIconUrl || '',
        wordCount: 0,
        readingTime: 'Estimating...', // Match original popup.html
      }

      // Don't await - let it update async in the background
      estimateReadingTime(tab.id!)
    }
  } catch (error) {
    console.error('Error loading current page:', error)
  }
}

const estimateReadingTime = (tabId: number) => {
  // Set timeout first
  const timeout = setTimeout(() => {
    currentPage.value.readingTime = '~ 5 min read'
  }, 2000)

  // Send message to content script
  chrome.tabs.sendMessage(tabId, { action: 'getWordCount' }, (response) => {
    clearTimeout(timeout)
    
    if (chrome.runtime.lastError || !response || !response.wordCount) {
      currentPage.value.readingTime = '~ 5 min read'
      return
    }

    const wordCount = response.wordCount
    currentPage.value.wordCount = wordCount
    const minutes = Math.ceil(wordCount / 200)
    currentPage.value.readingTime = `~ ${minutes} min read`
  })
}

const checkIfPageAlreadySaved = async () => {
  if (currentPage.value.url) {
    const cleanUrl = normalizeUrl(currentPage.value.url)
    const existingArticle = articles.value.find(a => a.cleanUrl === cleanUrl)
    isAlreadySaved.value = !!existingArticle
  }
}

const saveCurrentArticle = async () => {
  if (isSaving.value || isAlreadySaved.value) return

  try {
    isSaving.value = true

    const tags = tagsInput.value
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)

    // Extract article content from the active tab
    let articleContent = ''
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab && tab.id) {
        try {
          // Content script is already injected via manifest, just send message
          const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractContent' })
          
          // The response.content is an ExtractedContent object
          if (response && response.content) {
            // If it's an object with a content property, extract the content string
            if (typeof response.content === 'object' && response.content.content) {
              articleContent = response.content.content
            } else if (typeof response.content === 'string') {
              articleContent = response.content
            }
          } else {
            console.warn('No content in response:', response)
          }
        } catch (msgError) {
          console.error('Could not extract content via content script:', msgError)
          // Try basic extraction as fallback
          try {
            const [result] = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => {
                const article = document.querySelector('article')
                const main = document.querySelector('main')
                const content = article || main || document.body
                return content?.innerText || ''
              }
            })
            if (result?.result) {
              articleContent = result.result
            }
          } catch (fallbackError) {
            console.warn('Fallback content extraction failed:', fallbackError)
          }
        }
      }
    } catch (contentError) {
      console.warn('Failed to extract article content:', contentError)
      // Continue saving even if content extraction fails
    }

    const articleData = {
      actualUrl: currentPage.value.url,
      cleanUrl: normalizeUrl(currentPage.value.url),
      title: currentPage.value.title,
      favicon: currentPage.value.favicon,
      content: articleContent, // Add extracted content
      metadata: {
        wordCount: currentPage.value.wordCount,
        readingTime: currentPage.value.readingTime,
      },
      organization: {
        category: selectedCategory.value || 'Uncategorized',
        tags,
        isPinned: false,
        isArchived: false,
        isRead: false,
      },
    }

    await saveArticle(articleData)
    isAlreadySaved.value = true
    updateStats()

    // Get the saved article's ID for AI generation
    const savedArticle = await storage.getArticleByCleanUrl(normalizeUrl(currentPage.value.url))
    
    // Trigger AI summary generation if enabled
    if (generateSummary.value && savedArticle) {
      chrome.runtime.sendMessage({
        action: 'generateSummary',
        articleId: savedArticle.id,
        type: SummaryType.CONCISE,
        provider: AIProvider.OPENAI
      }).catch(err => {
        console.warn('Failed to trigger summary generation:', err)
      })
    }

    // Trigger podcast generation if enabled
    if (createPodcast.value && savedArticle) {
      chrome.runtime.sendMessage({
        action: 'generatePodcast',
        articleId: savedArticle.id
      }).catch(err => {
        console.warn('Failed to trigger podcast generation:', err)
      })
    }

    // Send message to background script to show Chrome notification
    chrome.runtime.sendMessage({
      action: 'articleSaved',
      article: articleData
    })

    // Show success notification
    showSuccessMessage()

    // Close tab if option is enabled
    if (closeTabAfterSave.value) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab && tab.id) {
        await chrome.tabs.remove(tab.id)
      }
    }
  } catch (error) {
    console.error('Error saving article:', error)
    showErrorMessage()
  } finally {
    isSaving.value = false
  }
}

const updateStats = () => {
  stats.value.totalSaved = articles.value.length
  stats.value.unread = articles.value.filter(a => !a.organization.isRead && !a.organization.isArchived).length
  
  const today = new Date().toDateString()
  stats.value.readToday = articles.value.filter(a => {
    return a.organization.isRead && 
           a.timestamps.dateRead && 
           new Date(a.timestamps.dateRead).toDateString() === today
  }).length
}

const openArticle = async (articleId: string) => {
  const article = articles.value.find(a => a.id === articleId)
  if (article) {
    await chrome.tabs.create({ url: article.actualUrl })
  }
}

const openRandomArticle = async () => {
  const unreadArticles = articles.value.filter(a => !a.organization.isRead && !a.organization.isArchived)
  if (unreadArticles.length > 0) {
    const randomArticle = unreadArticles[Math.floor(Math.random() * unreadArticles.length)]
    await chrome.tabs.create({ url: randomArticle.actualUrl })
  }
}

const openManager = async () => {
  const managerUrl = chrome.runtime.getURL('src/manager/index.html')
  
  // Check if a manager tab is already open
  const tabs = await chrome.tabs.query({ url: managerUrl })
  
  if (tabs.length > 0) {
    // Manager tab exists - focus it
    const managerTab = tabs[0]
    await chrome.tabs.update(managerTab.id!, { active: true })
    
    // Also focus the window
    if (managerTab.windowId) {
      await chrome.windows.update(managerTab.windowId, { focused: true })
    }
  } else {
    // No manager tab - create a new one
    await chrome.tabs.create({ url: managerUrl })
  }
}

const handleCategoryCreate = async (data: { name: string; color: string }) => {
  try {
    // Save to IndexedDB via background script
    await chrome.runtime.sendMessage({
      action: 'saveCategory',
      data
    })
    
    // Reload categories
    await loadCategories()
    
    // Find the newly created category and select it
    const newCategory = categories.value.find(c => c.name === data.name)
    if (newCategory) {
      selectedCategory.value = newCategory.id
    }

    showCategoryModal.value = false
  } catch (error) {
    console.error('Failed to create category:', error)
  }
}

const showSuccessMessage = () => {
  // Success is already shown via button state ("Already Saved")
}

const showErrorMessage = () => {
  // Error handling - could show inline error in the future
  console.error('Failed to save article')
}
</script>

<style scoped>
.container {
  padding: 20px;
}
</style>

<style>
/* Popup page-specific global styles */
body {
  width: 360px;
  min-height: 480px;
  background: var(--bg-primary);
}

@media (max-width: 400px) {
  body {
    width: 320px;
  }
}
</style>