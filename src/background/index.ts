import { db } from '@/core/db'
import type { NewArticle, SummaryKind, SummaryProviderId } from '@/core/db'
import { summarizeArticle, generatePodcast, groupArticle, testApiKey } from '@/core/ai'
import { defaultSettings } from '@/core/settings'
import { AIProvider, SummaryType, toAIProvider } from '@/types'
import { normalizeUrl } from '@/core/format'
import { textToHtml } from '@/core/extraction/sanitize'
import { createMessageRouter } from '@/core/messaging/bus'

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await db.init()
    await chrome.storage.sync.set({ settings: defaultSettings() })
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon128.png',
      title: 'Welcome to Quest!',
      message: 'Click the extension icon to save your first article.',
    })
  } else if (details.reason === 'update') {
    await db.init() // runs the legacy → v2 import if needed
  }

  if (chrome.contextMenus && (details.reason === 'install' || details.reason === 'update')) {
    createContextMenus()
  }
})

async function handleGenerateSummary(articleId: string, kind: SummaryKind, provider?: SummaryProviderId) {
  try {
    await summarizeArticle(articleId, { kind, provider })
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon48.png',
      title: 'AI Summary Generated',
      message: 'Summary has been generated successfully',
    })
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

async function handleGeneratePodcast(articleId: string) {
  try {
    await generatePodcast(articleId)
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon48.png',
      title: 'Podcast Generated',
      message: 'Your podcast is ready!',
    })
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

function toNewArticle(raw: any): NewArticle {
  if (raw?.url && raw?.content) {
    return raw as NewArticle
  }
  // legacy v1 export shape
  const text = typeof raw?.content === 'string' ? raw.content : ''
  return {
    url: { actual: raw?.actualUrl ?? '', clean: raw?.cleanUrl },
    title: raw?.title,
    favicon: raw?.favicon,
    content: { text, html: textToHtml(text), format: 'text' },
    categoryId: raw?.organization?.category,
    tags: raw?.organization?.tags,
  }
}

async function handleImportData(data: unknown, merge: boolean) {
  await db.init()
  const payload = (data ?? {}) as { articles?: any[]; categories?: any[]; tags?: any[]; settings?: unknown }

  if (Array.isArray(payload.articles)) {
    for (const raw of payload.articles) {
      try {
        const input = toNewArticle(raw)
        if (merge && (input.url.clean || input.url.actual)) {
          const existing = await db.articles.getByCleanUrl(input.url.clean || input.url.actual)
          if (existing) continue
        }
        await db.createArticle(input)
      } catch (err) {
        console.error('Error importing article:', err)
      }
    }
  }

  if (Array.isArray(payload.categories)) {
    for (const c of payload.categories) {
      try {
        await db.categories.save(c.name, c.color)
      } catch (err) {
        console.error('Error importing category:', err)
      }
    }
  }

  if (Array.isArray(payload.tags)) {
    for (const t of payload.tags) {
      try {
        await db.tags.bump(t.name, t.usageCount || 1)
      } catch (err) {
        console.error('Error importing tag:', err)
      }
    }
  }

  if (payload.settings && !merge) {
    await chrome.storage.sync.set({ settings: payload.settings })
  }

  await updateBadge()
}

createMessageRouter({
  articleSaved: (req) => {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon48.png',
      title: 'Article Saved',
      message: `Saved: ${req.article.title}`,
      contextMessage: req.article.url.domain,
      buttons: [{ title: 'Open Library' }, { title: 'Dismiss' }],
    })
    updateBadge()
    return { success: true }
  },

  generateSummary: async (req) => {
    const kind: SummaryKind = req.type === SummaryType.EXTENDED ? 'extended' : 'concise'
    const provider: SummaryProviderId | undefined =
      req.provider === AIProvider.OPENAI ? 'openai' : req.provider === AIProvider.GEMINI ? 'gemini' : undefined
    await handleGenerateSummary(req.articleId, kind, provider)
    return { success: true }
  },

  generatePodcast: async (req) => {
    await handleGeneratePodcast(req.articleId)
    return { success: true }
  },

  groupArticle: async (req) => {
    await groupArticle(req.articleId)
    return { success: true }
  },

  importData: async (req) => {
    await handleImportData(req.data, req.merge)
    return { success: true }
  },

  testApiKey: async (req) => {
    const ok = await testApiKey(toAIProvider(req.provider), req.apiKey)
    return { success: ok, error: ok ? undefined : 'API key test failed' }
  },

  settingsSaved: async () => {
    await checkAndArchiveArticles()
    return { success: true }
  },

  getPageAnnotations: async (req) => {
    await db.init()
    const clean = normalizeUrl(req.url)
    let article = await db.articles.getByCleanUrl(clean)
    if (!article) {
      // Fallback: an article may have been saved under a slightly different URL
      // form (params, trailing slash) or migrated from v1. Match on normalised
      // clean/actual URL across the library.
      const all = await db.articles.getAll()
      article =
        all.find((a) => a.url.clean === clean || normalizeUrl(a.url.actual) === clean) ?? null
    }
    if (!article) return { articleId: null, highlights: [], summary: null }
    const highlights = (await db.highlights.listForArticle(article.id)).map((h) => ({
      id: h.id,
      text: h.text,
      color: h.color,
      note: h.note,
    }))
    const summaries = await db.summaries.getForArticle(article.id)
    const concise = summaries.find((s) => s.kind === 'concise') ?? summaries[0] ?? null
    return { articleId: article.id, highlights, summary: concise?.content ?? null }
  },
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('reminder_')) {
    const articleId = alarm.name.replace('reminder_', '')
    try {
      await db.init()
      const article = await db.articles.get(articleId)
      if (article) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: '/icons/icon48.png',
          title: 'Reading Reminder',
          message: `Time to read: ${article.title}`,
          buttons: [{ title: 'Open Article' }, { title: 'Snooze 1 hour' }],
        })
      }
    } catch (error) {
      console.error('Error handling reminder:', error)
    }
  }

  if (alarm.name === 'auto-archive-check') {
    await checkAndArchiveArticles()
  }
})

chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.notifications.clear(notificationId)
})

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    const url = chrome.runtime.getURL('src/manager/index.html')
    await chrome.tabs.create({ url })
  } else if (notificationId.startsWith('reminder_')) {
    const articleId = notificationId.replace('reminder_', '')
    const snoozeTime = new Date()
    snoozeTime.setHours(snoozeTime.getHours() + 1)
    chrome.alarms.create(`reminder_${articleId}`, { when: snoozeTime.getTime() })
  }
  chrome.notifications.clear(notificationId)
})

async function updateBadge() {
  try {
    await db.init()
    const articles = await db.articles.getAll()
    const unread = articles.filter((a) => a.status === 'unread').length
    if (unread > 0) {
      chrome.action.setBadgeText({ text: unread.toString() })
      chrome.action.setBadgeBackgroundColor({ color: '#031F1C' })
    } else {
      chrome.action.setBadgeText({ text: '' })
    }
  } catch (error) {
    console.error('Error updating badge:', error)
  }
}

function createContextMenus() {
  if (chrome.contextMenus && chrome.contextMenus.removeAll) {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({ id: 'save-link', title: 'Save Link to Quest', contexts: ['link'] })
      chrome.contextMenus.create({ id: 'save-page', title: 'Save Page to Quest', contexts: ['page'] })
      chrome.contextMenus.create({ id: 'save-selection', title: 'Save Selection to Quest', contexts: ['selection'] })
    })
  }
}

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
    if (url && tab) await saveArticleFromContext(url, title, tab)
  })
}

async function saveArticleFromContext(url: string, title: string, tab: chrome.tabs.Tab) {
  try {
    await db.init()
    const domain = new URL(url).hostname.replace('www.', '')

    let text = ''
    try {
      if (tab.id) {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractContent' })
        if (response?.content) {
          text = typeof response.content === 'object' ? response.content.content ?? '' : String(response.content)
        }
      }
    } catch {
      // content not extractable (e.g. restricted page) — save without body
    }

    const input: NewArticle = {
      url: { actual: url, clean: normalizeUrl(url) },
      title: title || 'Untitled',
      favicon: tab.favIconUrl,
      content: { text, html: textToHtml(text), format: 'text' },
      categoryId: getCategoryFromDomain(domain),
    }
    const saved = await db.createArticle(input)

    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon48.png',
      title: 'Quest',
      message: `Saved: ${saved.title}`,
    })
    updateBadge()
  } catch (error) {
    console.error('Error saving article:', error)
  }
}

function getCategoryFromDomain(domain: string): string {
  const d = domain.toLowerCase()
  if (d.includes('medium') || d.includes('blog') || d.includes('dev.to')) return 'Articles'
  if (d.includes('github') || d.includes('stackoverflow')) return 'Development'
  if (d.includes('youtube') || d.includes('vimeo')) return 'Videos'
  if (d.includes('news') || d.includes('bbc') || d.includes('cnn')) return 'News'
  if (d.includes('wikipedia') || d.includes('edu')) return 'Research'
  return 'Uncategorized'
}

chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      await db.init()
      const article = await db.articles.getByCleanUrl(normalizeUrl(tab.url))
      if (article && article.status !== 'read' && article.status !== 'archived') {
        await db.articles.update(article.id, {
          status: 'read',
          readAt: new Date().toISOString(),
          readingProgress: 1,
        })
        updateBadge()
      }
    } catch (error) {
      console.error('Error updating article status:', error)
    }
  }
})

chrome.runtime.onStartup.addListener(() => {
  updateBadge()
  if (chrome.contextMenus) createContextMenus()
  setupAutoArchiveAlarm()
})

updateBadge()
setupAutoArchiveAlarm()

async function checkAndArchiveArticles() {
  try {
    const result = await chrome.storage.sync.get(['settings'])
    const settings = result.settings
    if (!settings || !settings.autoArchive) return

    const archiveDays = settings.archiveDays || 30
    await db.init()
    const articles = await db.articles.getAll()
    const now = Date.now()
    let archived = 0

    for (const article of articles) {
      if (article.status === 'read' && !article.isPinned && article.readAt) {
        const days = Math.floor((now - new Date(article.readAt).getTime()) / (1000 * 60 * 60 * 24))
        if (days >= archiveDays) {
          await db.articles.update(article.id, { status: 'archived' })
          archived++
        }
      }
    }

    if (archived > 0) {
      await updateBadge()
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icons/icon48.png',
        title: 'Quest',
        message: `Auto-archived ${archived} read article${archived > 1 ? 's' : ''}`,
      })
    }
  } catch (error) {
    console.error('Error in auto-archive:', error)
  }
}

function setupAutoArchiveAlarm() {
  chrome.alarms.get('auto-archive-check', (alarm) => {
    if (!alarm) {
      chrome.alarms.create('auto-archive-check', { periodInMinutes: 24 * 60, when: Date.now() + 1000 * 60 })
    }
  })
}
