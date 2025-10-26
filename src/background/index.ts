import { storage } from '@/utils/storage'
import { AIManager } from '@/utils/ai-manager'
import type { Article, SummaryProvider } from '@/types'
import { AIProvider, SummaryType, toAIProvider, isSummaryProvider } from '@/types'
import { ELEVENLABS_VOICES } from '@/utils/voice-config'
import { GEMINI_MODELS, OPENAI_MODELS } from '@/utils/model-config'
import { normalizeUrl } from '@/utils/formatters'

const aiManager = new AIManager()

// Initialize storage when extension is installed
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Initialize storage
    await storage.init()

    // Set default settings
    await chrome.storage.sync.set({
      settings: {
        theme: 'light',
        autoArchive: false,
        archiveDays: 30,
        reminderEnabled: false,
        reminderTime: '09:00',
        defaultCategory: 'Uncategorized',
        autoSummary: false,
        autoPodcast: false,
        openaiModel: OPENAI_MODELS[5].id.toString(), // 'gpt-4.1
        geminiModel: GEMINI_MODELS[1].id.toString(), // 'gemini-2.5-flash'
        elevenlabsVoiceId: ELEVENLABS_VOICES[0].id.toString(),
      },
    })

    // Show welcome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon128.png',
      title: 'Welcome to Quest!',
      message: 'Click the extension icon to save your first article.',
    })
  }

  // Create context menus
  if (chrome.contextMenus && (details.reason === 'install' || details.reason === 'update')) {
    createContextMenus()
  }
})

// Handle AI summary generation
async function handleGenerateSummary(articleId: string, type: SummaryType, provider: SummaryProvider) {
  try {
    await aiManager.init()
    const summary = await aiManager.generateSummary(articleId, type, provider)
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon48.png',
      title: 'AI Summary Generated',
      message: 'Summary has been generated successfully',
    })

    return summary
  } catch (error) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon48.png',
      title: 'Summary Generation Failed',
      message: error instanceof Error ? error.message : 'Failed to generate summary',
    })
    throw error
  }
}

// Handle podcast generation
async function handleGeneratePodcast(articleId: string) {
  try {
    await aiManager.init()
    const podcast = await aiManager.generatePodcast(articleId)
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon48.png',
      title: 'Podcast Generated',
      message: 'Your podcast is ready!',
    })

    return podcast
  } catch (error) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon48.png',
      title: 'Podcast Generation Failed',
      message: error instanceof Error ? error.message : 'Failed to generate podcast',
    })
    throw error
  }
}

// Handle data import
async function handleImportData(data: any, merge: boolean) {
  try {
    await storage.init()

    let importedCounts = {
      articles: 0,
      categories: 0,
      tags: 0,
    }

    // Import articles
    if (data.articles && Array.isArray(data.articles)) {
      for (const article of data.articles) {
        try {
          if (merge) {
            // Check if article exists by clean URL
            const existing = await storage.getArticleByCleanUrl(article.cleanUrl)
            if (!existing) {
              await storage.saveArticle(article)
              importedCounts.articles++
            }
          } else {
            await storage.saveArticle(article)
            importedCounts.articles++
          }
        } catch (err) {
          console.error('Error importing article:', article.title, err)
        }
      }
    }

    // Import categories
    if (data.categories && Array.isArray(data.categories)) {
      for (const category of data.categories) {
        try {
          await storage.saveCategory(category.name, category.color)
          importedCounts.categories++
        } catch (err) {
          console.error('Error importing category:', category.name, err)
        }
      }
    }

    // Import tags
    if (data.tags && Array.isArray(data.tags)) {
      for (const tag of data.tags) {
        try {
          await storage.updateTagUsage(tag.name, tag.usageCount || 1)
          importedCounts.tags++
        } catch (err) {
          console.error('Error importing tag:', tag.name, err)
        }
      }
    }

    // Import settings (only if not merging)
    if (data.settings && !merge) {
      await chrome.storage.sync.set({ settings: data.settings })
    }

    await updateBadge()
    return true
  } catch (error) {
    throw error
  }
}

// Handle API key testing
async function handleTestApiKey(provider: string, apiKey: string, _model?: string, _voiceId?: string) {
  try {
    await aiManager.init()
    const aiProvider = toAIProvider(provider)
    const result = await aiManager.testApiKey(aiProvider, apiKey)
    return result
  } catch (error) {
    throw error
  }
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'articleSaved') {
    const article = message.article as Article
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon48.png',
      title: 'Article Saved',
      message: `Saved: ${article.title}`,
      contextMessage: article.domain,
      buttons: [
        { title: 'Open Manager' },
        { title: 'Dismiss' }
      ],
    })

    updateBadge()
  }

  if (message.action === 'getWordCount') {
    // Forward to content script
    if (sender.tab?.id) {
      chrome.tabs.sendMessage(sender.tab.id, message).then(sendResponse)
      return true
    }
  }

  if (message.action === 'generateSummary') {
    const provider = message.provider ? toAIProvider(message.provider) : AIProvider.OPENAI
    if (!isSummaryProvider(provider)) {
      sendResponse({ success: false, error: 'Invalid summary provider' })
      return true
    }
    handleGenerateSummary(message.articleId, message.type || SummaryType.CONCISE, provider)
      .then(() => sendResponse({ success: true }))
      .catch((error: Error) => sendResponse({ success: false, error: error.message }))
    return true
  }

  if (message.action === 'generatePodcast') {
    handleGeneratePodcast(message.articleId)
      .then(() => sendResponse({ success: true }))
      .catch((error: Error) => sendResponse({ success: false, error: error.message }))
    return true
  }

  if (message.action === 'importData') {
    handleImportData(message.data, message.merge)
      .then(() => sendResponse({ success: true }))
      .catch((error: Error) => sendResponse({ success: false, error: error.message }))
    return true
  }

  if (message.action === 'testApiKey') {
    handleTestApiKey(message.provider, message.apiKey, message.model, message.voiceId)
      .then(() => sendResponse({ success: true }))
      .catch((error: Error) => sendResponse({ success: false, error: error.message }))
    return true
  }
  
  if (message.action === 'settingsSaved') {
    // When settings are saved, check if we should run auto-archive
    checkAndArchiveArticles()
      .then(() => sendResponse({ success: true }))
      .catch((error: Error) => sendResponse({ success: false, error: error.message }))
    return true
  }
})

// Handle reminder alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('reminder_')) {
    const articleId = alarm.name.replace('reminder_', '')
    
    try {
      await storage.init()
      const article = await storage.getArticle(articleId)
      
      if (article) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: '/icons/icon48.png',
          title: 'Reading Reminder',
          message: `Time to read: ${article.title}`,
          buttons: [
            { title: 'Open Article' },
            { title: 'Snooze 1 hour' }
          ],
        })
      }
    } catch (error) {
      console.error('Error handling reminder:', error)
    }
  }
  
  // Handle auto-archive alarm
  if (alarm.name === 'auto-archive-check') {
    await checkAndArchiveArticles()
  }
})

// Handle notification clicks
chrome.notifications.onClicked.addListener(async (notificationId) => {
  chrome.notifications.clear(notificationId)
})

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // Open article or manager
    const url = chrome.runtime.getURL('src/manager/index.html')
    await chrome.tabs.create({ url })
  } else {
    // Snooze or dismiss
    if (notificationId.startsWith('reminder_')) {
      // Snooze for 1 hour
      const articleId = notificationId.replace('reminder_', '')
      const snoozeTime = new Date()
      snoozeTime.setHours(snoozeTime.getHours() + 1)
      
      chrome.alarms.create(`reminder_${articleId}`, {
        when: snoozeTime.getTime(),
      })
    }
  }

  chrome.notifications.clear(notificationId)
})

// Update badge with unread count
async function updateBadge() {
  try {
    await storage.init()
    const articles = await storage.getAllArticles()
    const unreadCount = articles.filter(
      article => !article.organization.isRead && !article.organization.isArchived
    ).length

    if (unreadCount > 0) {
      chrome.action.setBadgeText({ text: unreadCount.toString() })
      chrome.action.setBadgeBackgroundColor({ color: '#031F1C' })
    } else {
      chrome.action.setBadgeText({ text: '' })
    }
  } catch (error) {
    console.error('Error updating badge:', error)
  }
}

// Create context menus
function createContextMenus() {
  if (chrome.contextMenus && chrome.contextMenus.removeAll) {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'save-link',
        title: 'Save Link to Quest',
        contexts: ['link'],
      })

      chrome.contextMenus.create({
        id: 'save-page',
        title: 'Save Page to Quest',
        contexts: ['page'],
      })

      chrome.contextMenus.create({
        id: 'save-selection',
        title: 'Save Selection to Quest',
        contexts: ['selection'],
      })
    })
  }
}

// Handle context menu clicks
if (chrome.contextMenus && chrome.contextMenus.onClicked) {
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    let url = ''
    let title = ''

    if (info.menuItemId === 'save-link' && info.linkUrl) {
      url = info.linkUrl
      title = info.selectionText || 'Link'
    } else if (info.menuItemId === 'save-page') {
      url = info.pageUrl || ''
      title = tab?.title || 'Page'
    } else if (info.menuItemId === 'save-selection' && info.selectionText) {
      url = info.pageUrl || ''
      title = info.selectionText.substring(0, 100)
    }

    if (url && tab) {
      await saveArticleFromContext(url, title, tab)
    }
  })
}

async function saveArticleFromContext(url: string, title: string, tab: chrome.tabs.Tab) {
  try {
    await storage.init()

    const domain = new URL(url).hostname.replace('www.', '')
    const category = getCategoryFromDomain(domain)

    // Extract content from the current tab
    let extractedContent = ''
    try {
      if (tab.id) {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractContent' })
        // The response.content is an ExtractedContent object
        if (response && response.content) {
          // If it's an object with a content property, extract the content string
          if (typeof response.content === 'object' && response.content.content) {
            extractedContent = response.content.content
          } else if (typeof response.content === 'string') {
            extractedContent = response.content
          }
        }
      }
    } catch (error) {
      console.log('Could not extract content:', error)
    }

    const articleData = {
      actualUrl: url,
      cleanUrl: normalizeUrl(url),
      title: title || 'Untitled',
      favicon: tab.favIconUrl,
      content: extractedContent,
      organization: {
        category,
        tags: [],
        isPinned: false,
        isArchived: false,
        isRead: false,
      },
    }

    const savedArticle = await storage.saveArticle(articleData)

    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon48.png',
      title: 'Quest',
      message: `Saved: ${savedArticle.title}`,
    })

    updateBadge()
  } catch (error) {
    console.error('Error saving article:', error)
  }
}

function getCategoryFromDomain(domain: string): string {
  const domainLower = domain.toLowerCase()

  if (domainLower.includes('medium') || domainLower.includes('blog') || domainLower.includes('dev.to')) {
    return 'Articles'
  }
  if (domainLower.includes('github') || domainLower.includes('stackoverflow')) {
    return 'Development'
  }
  if (domainLower.includes('youtube') || domainLower.includes('vimeo')) {
    return 'Videos'
  }
  if (domainLower.includes('news') || domainLower.includes('bbc') || domainLower.includes('cnn')) {
    return 'News'
  }
  if (domainLower.includes('wikipedia') || domainLower.includes('edu')) {
    return 'Research'
  }

  return 'Uncategorized'
}

// Handle tab updates to update reading status
chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      await storage.init()
      const cleanUrl = normalizeUrl(tab.url)
      const article = await storage.getArticleByCleanUrl(cleanUrl)

      if (article && !article.organization.isRead) {
        await storage.updateArticle(article.id, {
          organization: {
            ...article.organization,
            isRead: true,
          },
          timestamps: {
            ...article.timestamps,
            dateRead: new Date().toISOString(),
          },
        })
        updateBadge()
      }
    } catch (error) {
      console.error('Error updating article status:', error)
    }
  }
})

// Update badge on startup
chrome.runtime.onStartup.addListener(() => {
  updateBadge()
  if (chrome.contextMenus) {
    createContextMenus()
  }
  setupAutoArchiveAlarm()
})

// Initialize badge on extension load
updateBadge()
setupAutoArchiveAlarm()

// Auto-archive functionality
async function checkAndArchiveArticles() {
  try {
    const result = await chrome.storage.sync.get(['settings'])
    const settings = result.settings
    
    // Check if auto-archive is enabled
    if (!settings || !settings.autoArchive) {
      return
    }
    
    const archiveDays = settings.archiveDays || 30
    await storage.init()
    const articles = await storage.getAllArticles()
    
    const now = new Date()
    let archivedCount = 0
    
    for (const article of articles) {
      // Only archive read articles that aren't already archived or pinned
      if (article.organization.isRead && 
          !article.organization.isArchived && 
          !article.organization.isPinned &&
          article.timestamps.dateRead) {
        
        const dateRead = new Date(article.timestamps.dateRead)
        const daysSinceRead = Math.floor((now.getTime() - dateRead.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysSinceRead >= archiveDays) {
          await storage.updateArticle(article.id, {
            organization: {
              ...article.organization,
              isArchived: true,
            },
          })
          archivedCount++
        }
      }
    }
    
    if (archivedCount > 0) {
      await updateBadge()
      
      // Optional: Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icons/icon48.png',
        title: 'Quest',
        message: `Auto-archived ${archivedCount} read article${archivedCount > 1 ? 's' : ''}`,
      })
    }
  } catch (error) {
    console.error('Error in auto-archive:', error)
  }
}

// Setup auto-archive alarm (runs daily at midnight)
function setupAutoArchiveAlarm() {
  chrome.alarms.get('auto-archive-check', (alarm) => {
    if (!alarm) {
      // Create alarm to run every 24 hours
      chrome.alarms.create('auto-archive-check', {
        periodInMinutes: 24 * 60, // Daily
        when: Date.now() + 1000 * 60, // First run in 1 minute
      })
    }
  })
}
