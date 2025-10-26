<template>
  <div class="ai-dashboard">
    <!-- Dashboard Header -->
    <DashboardHeader 
      @toggle-theme="toggleTheme"
      @go-to-manager="goToManager"
    />

    <!-- Main Content -->
    <div class="main-content">
      <!-- Stats Grid -->
      <StatsGrid 
        :total-summaries="stats.totalSummaries"
        :summaries-this-month="stats.summariesThisMonth"
        :total-podcasts="stats.totalPodcasts"
        :podcasts-this-month="stats.podcastsThisMonth"
        :enhanced-articles="stats.enhancedArticles"
        :total-articles="stats.totalArticles"
        :total-api-calls="stats.totalApiCalls"
        :api-calls-this-month="stats.apiCallsThisMonth"
      />

      <!-- Service Usage -->
      <ServiceUsage 
        :service-usage="serviceUsage"
        :settings="settings"
      />

      <!-- Audit Logs -->
      <AuditLogs 
        :logs="paginatedLogs"
        :loading="loading"
        v-model:search-query="searchQuery"
        v-model:filter-provider="filterProvider"
        v-model:filter-action="filterAction"
        v-model:current-page="currentPage"
        :total-pages="totalPages"
        :get-article-title="getArticleTitle"
        @open-article="openArticle"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { AIProvider } from '@/types'
import DashboardHeader from './components/DashboardHeader.vue'
import StatsGrid from './components/StatsGrid.vue'
import ServiceUsage from './components/ServiceUsage.vue'
import AuditLogs from './components/AuditLogs.vue'
import { storage } from '@/utils/storage'

interface AuditLog {
  id: string
  timestamp: string
  action: string
  provider?: string
  articleId?: string
  success: boolean
  details?: {
    tokenCount?: number
    duration?: number
    characters?: number
  }
  error?: string
}

interface Summary {
  id: string
  articleId: string
  generatedDate: string
}

interface AudioFile {
  id: string
  summaryId: string
  generatedDate: string
}

interface Article {
  id: string
  title: string
  actualUrl: string
}

interface Settings {
  openaiModel?: string
  geminiModel?: string
}

// Use the global theme composable
const { toggleTheme } = useTheme()

// State
const loading = ref(true)
const searchQuery = ref('')
const filterProvider = ref('')
const filterAction = ref('')
const currentPage = ref(1)
const itemsPerPage = 20

const auditLogs = ref<AuditLog[]>([])
const summaries = ref<Summary[]>([])
const audioFiles = ref<AudioFile[]>([])
const articles = ref<Article[]>([])
const settings = ref<Settings | null>(null)

// Stats
const stats = computed(() => {
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const summariesThisMonth = summaries.value.filter(
    s => new Date(s.generatedDate) >= thisMonth
  ).length

  const podcastsThisMonth = audioFiles.value.filter(
    a => new Date(a.generatedDate) >= thisMonth
  ).length

  // Enhanced articles are those that have summaries or podcasts
  // AudioFile has summaryId, so we need to join through summaries to get articleIds
  const summaryArticleIds = summaries.value.map(s => s.articleId)
  const audioSummaryIds = new Set(audioFiles.value.map(a => a.summaryId))
  const audioArticleIds = summaries.value
    .filter(s => audioSummaryIds.has(s.id))
    .map(s => s.articleId)
  
  const enhancedArticles = new Set([
    ...summaryArticleIds,
    ...audioArticleIds,
  ]).size

  const apiCallsThisMonth = auditLogs.value.filter(
    log => new Date(log.timestamp) >= thisMonth && log.success
  ).length

  return {
    totalSummaries: summaries.value.length,
    totalPodcasts: audioFiles.value.length,
    enhancedArticles,
    totalArticles: articles.value.length,
    totalApiCalls: auditLogs.value.filter(log => log.success).length,
    summariesThisMonth,
    podcastsThisMonth,
    apiCallsThisMonth,
  }
})

// Service Usage
const serviceUsage = computed(() => {
  const usage = {
    openai: { calls: 0, tokens: 0 },
    gemini: { calls: 0, tokens: 0 },
    elevenlabs: { calls: 0, characters: 0, duration: 0 },
  }

  for (const log of auditLogs.value) {
    if (!log.success) continue

    if (log.provider === AIProvider.OPENAI) {
      usage.openai.calls++
      usage.openai.tokens += log.details?.tokenCount || 0
    } else if (log.provider === AIProvider.GEMINI) {
      usage.gemini.calls++
      usage.gemini.tokens += log.details?.tokenCount || 0
    } else if (log.provider === AIProvider.ELEVENLABS) {
      usage.elevenlabs.calls++
      usage.elevenlabs.characters += log.details?.characters || 0
      usage.elevenlabs.duration += log.details?.duration || 0
    }
  }

  return usage
})

// Filtered logs
const filteredLogs = computed(() => {
  let filtered = auditLogs.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(log =>
      log.action.toLowerCase().includes(query) ||
      log.provider?.toLowerCase().includes(query) ||
      (log.articleId && getArticleTitle(log.articleId).toLowerCase().includes(query))
    )
  }

  if (filterProvider.value) {
    filtered = filtered.filter(log => log.provider === filterProvider.value)
  }

  if (filterAction.value) {
    filtered = filtered.filter(log => log.action === filterAction.value)
  }

  return filtered.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
})

// Paginated logs
const totalPages = computed(() => Math.ceil(filteredLogs.value.length / itemsPerPage))
const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredLogs.value.slice(start, start + itemsPerPage)
})

// Methods
const goToManager = async () => {
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (currentTab?.id) {
    await chrome.tabs.update(currentTab.id, { url: chrome.runtime.getURL('src/manager/index.html') })
  }
}

const openArticle = async (articleId: string) => {
  const article = articles.value.find(a => a.id === articleId)
  if (article) {
    await chrome.tabs.create({ url: article.actualUrl })
  }
}

const getArticleTitle = (articleId: string): string => {
  const article = articles.value.find(a => a.id === articleId)
  return article?.title || 'Unknown Article'
}

// Load data
onMounted(async () => {
  loading.value = true
  
  try {
    // Initialize IndexedDB
    await storage.init()
    
    // Load all data from IndexedDB
    auditLogs.value = await storage.getAuditLogs()
    summaries.value = await storage.getAllSummaries()
    audioFiles.value = await storage.getAllAudioFiles()
    articles.value = await storage.getAllArticles()
    
    // Load settings from chrome storage
    const result = await chrome.storage.sync.get(['settings'])
    settings.value = result.settings || null
    
    console.log('Dashboard data loaded:', {
      auditLogs: auditLogs.value.length,
      summaries: summaries.value.length,
      audioFiles: audioFiles.value.length,
      articles: articles.value.length,
      settings: settings.value
    })
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.ai-dashboard {
  min-height: 100vh;
  background: var(--bg-secondary);
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
}

@media (max-width: 768px) {
  .main-content {
    padding: 20px;
  }
}
</style>
