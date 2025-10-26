<template>
  <div class="app-container">
    <!-- Header -->
    <ManagerHeader
      v-model:search-query="searchQuery"
      @add-article="showAddArticleModal"
      @export-import="showExportImport"
      @open-ai-dashboard="openAIDashboard"
      @toggle-theme="toggleTheme"
      @open-settings="showSettings"
    />

    <!-- Main Content -->
    <div class="main-content">
      <!-- Sidebar -->
      <ManagerSidebar
        :current-view="currentView"
        :current-category-id="currentCategoryId"
        :stats="stats"
        :categories="categories"
        :get-category-count="getCategoryCount"
        @change-view="changeView"
        @create-category="showCreateCategoryModal"
        @edit-category="handleEditCategory"
        @delete-category="handleDeleteCategory"
      />

      <!-- Article List -->
      <ArticleListContainer>
        <!-- Page Header -->
        <PageHeader
          :title="getViewTitle()"
          :article-count="filteredArticles.length"
        />

        <!-- Toolbar -->
        <Toolbar
          :show-filters="showFilters"
          v-model:current-filter="currentFilter"
          :has-active-filters="hasActiveFilters"
          :active-filter-count="activeFilterCount"
          :top-sources="topSources"
          :popular-tags="popularTags"
          v-model:sort-by="sortBy"
          :select-mode="selectMode"
          :selected-count="selectedArticles.size"
          :show-bulk-actions="showBulkActions"
          @toggle-filters="toggleFilters"
          @apply-filters="applyFilters"
          @clear-filters="clearFilters"
          @toggle-select-mode="toggleSelectMode"
          @exit-select-mode="exitSelectMode"
          @clear-selection="clearSelection"
          @toggle-bulk-menu="toggleBulkMenu"
          @bulk-action="handleBulkAction"
        />

        <!-- Content Area -->
        <ContentArea
          :is-loading="isLoading"
          :article-count="filteredArticles.length"
          :empty-message="getEmptyStateMessage()"
          :show-pagination="filteredArticles.length > itemsPerPage"
          :current-page="currentPage"
          :total-pages="totalPages"
          @go-to-page="goToPage"
        >
          <ArticleCard
            v-for="article in paginatedArticles"
            :key="article.id"
            :article="article"
            :isSelected="selectedArticles.has(article.id)"
            :selectMode="selectMode"
            :hasSummary="article.summaryIds && article.summaryIds.length > 0"
            :hasPodcast="!!article.audioId"
            :summaryLoading="summaryGeneratingArticles.has(article.id)"
            :podcastLoading="podcastGeneratingArticles.has(article.id)"
            @select="toggleSelection(article.id)"
            @open="openArticle(article.id)"
            @action="handleArticleAction"
          >
            <template #summary>
              <div class="ai-feature-content">
                <div class="ai-feature-meta">
                  <span v-if="article.aiSummary" class="provider-badge" :class="article.aiSummary.aiProvider.toLowerCase()">
                    {{ article.aiSummary.aiProvider }}
                  </span>
                  <span v-if="article.aiSummary" class="type-badge">
                    {{ getSummaryTypeDisplayName(article.aiSummary.type) }}
                  </span>
                  <span v-if="article.aiSummary" class="model-badge" title="Model used">
                    {{ article.aiSummary.model || 'N/A' }}
                  </span>
                </div>
                <button 
                  @click.stop="viewSummary(article.id)"
                  class="view-ai-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  View Summary
                </button>
              </div>
            </template>
            <template #podcast>
              <div class="ai-feature-content">
                <div class="ai-feature-meta">
                  <span v-if="article.audioPodcast" class="provider-badge" :class="article.audioPodcast.aiProvider.toLowerCase()">
                    {{ formatProvider(article.audioPodcast.aiProvider) }}
                  </span>
                  <span v-if="article.audioPodcast" class="voice-badge" title="Voice used">
                    {{ article.audioPodcast.voiceName || 'Default' }}
                  </span>
                  <span v-if="article.audioPodcast && article.audioPodcast.duration" class="duration-badge">
                    {{ formatDuration(article.audioPodcast.duration) }}
                  </span>
                </div>
                <button 
                  @click.stop="viewPodcast(article.id)"
                  class="view-ai-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/>
                  </svg>
                  Listen to Podcast
                </button>
              </div>
            </template>
          </ArticleCard>
        </ContentArea>
      </ArticleListContainer>
    </div>

    <!-- Modals -->
    <SettingsModal v-model:show="showSettingsModal" @close="showSettingsModal = false" />
    <ArticleModal 
      v-model:show="showArticleModal" 
      :article="editingArticle"
      @close="showArticleModal = false"
      @saved="handleArticleSaved"
    />
    <ExportImportModal 
      v-model:show="showExportModal"
      @close="showExportModal = false"
      @imported="handleDataImported"
    />
    <CategoryModal 
      :show="showCategoryModal"
      :existing-categories="categories"
      :editing-category="editingCategory"
      @close="showCategoryModal = false"
      @created="handleCategoryCreated"
      @updated="handleCategoryUpdated"
    />
    
    <!-- Confirm Delete Category Modal -->
    <ConfirmModal
      v-model:show="showDeleteCategoryModal"
      title="Delete Category"
      :message="`Are you sure you want to delete '${categoryToDelete?.name}'? This action cannot be undone.`"
      confirm-text="Delete"
      cancel-text="Cancel"
      type="danger"
      @confirm="confirmDeleteCategory"
      @cancel="cancelDeleteCategory"
    />
    
    <!-- Confirm Delete Article Modal -->
    <ConfirmModal
      v-model:show="showDeleteArticleModal"
      title="Delete Article"
      :message="`Are you sure you want to delete this article? This action cannot be undone.`"
      confirm-text="Delete"
      cancel-text="Cancel"
      type="danger"
      @confirm="confirmDeleteArticle"
      @cancel="cancelDeleteArticle"
    />
    
    <!-- Summary View Modal -->
    <SummaryViewModal
      v-if="selectedSummary && selectedArticle"
      :show="showSummaryModal"
      :summary="selectedSummary"
      :article="selectedArticle"
      @close="showSummaryModal = false"
      @copy="handleCopySummary"
      @regenerate="handleRegenerateSummary"
      @inject="handleInjectSummary"
    />
    
    <!-- Podcast View Modal -->
    <PodcastViewModal
      v-if="selectedAudioFile && selectedArticle"
      :show="showPodcastModal"
      :audio-file="selectedAudioFile"
      :article="selectedArticle"
      @close="showPodcastModal = false"
      @regenerate="handleRegeneratePodcast"
      @inject="handleInjectPodcast"
    />

    <!-- Toast Notifications -->
    <ToastNotifications />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStorage } from '@/composables/useStorage'
import { useTheme } from '@/composables/useTheme'
import { useNotification } from '@/composables/useNotification'
import { AIManager } from '@/utils/ai-manager'
import { storage } from '@/utils/storage'
import type { Article } from '@/types'
import { AIProvider, SummaryType, getProviderDisplayName, getSummaryTypeDisplayName } from '@/types'
import ManagerHeader from './components/ManagerHeader.vue'
import ManagerSidebar from './components/ManagerSidebar.vue'
import ArticleListContainer from './components/ArticleListContainer.vue'
import PageHeader from './components/article-list/PageHeader.vue'
import Toolbar from './components/article-list/Toolbar.vue'
import ContentArea from './components/article-list/ContentArea.vue'
import ArticleCard from './components/ArticleCard.vue'
import SettingsModal from './modals/SettingsModal.vue'
import ArticleModal from './modals/ArticleModal.vue'
import ExportImportModal from './modals/ExportImportModal.vue'
import CategoryModal from '@/components/CategoryModal.vue'
import SummaryViewModal from './modals/SummaryViewModal.vue'
import PodcastViewModal from './modals/PodcastViewModal.vue'
import ToastNotifications from '@/components/ToastNotifications.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'

const { articles, categories, tags, init, loadArticles, loadCategories, loadTags, updateArticle, deleteArticle } = useStorage()
const { toggleTheme } = useTheme()
const { success, error: showError } = useNotification()

// AI Manager instance
const aiManager = new AIManager()

// State
const searchQuery = ref('')
const currentView = ref('all')
const currentCategoryId = ref('')
const currentFilter = ref<{ readStatus?: string; tag?: string; source?: string }>({})
const selectedArticles = ref(new Set<string>())
const currentPage = ref(1)
const itemsPerPage = ref(20)
const sortBy = ref('date-desc')
const isLoading = ref(false)
const showBulkActions = ref(false)
const showFilters = ref(false)
const selectMode = ref(false)

// Loading states for AI operations
const summaryGeneratingArticles = ref(new Set<string>())
const podcastGeneratingArticles = ref(new Set<string>())

// Modal states
const showSettingsModal = ref(false)
const showArticleModal = ref(false)
const showExportModal = ref(false)
const showCategoryModal = ref(false)
const showDeleteCategoryModal = ref(false)
const showDeleteArticleModal = ref(false)
const editingArticle = ref<Article | undefined>(undefined)
const editingCategory = ref<any>(null)
const categoryToDelete = ref<{ id: string; name: string } | null>(null)
const articleToDelete = ref<string | null>(null)

// Summary and Podcast modal states
const showSummaryModal = ref(false)
const showPodcastModal = ref(false)
const selectedSummary = ref<any>(null)
const selectedAudioFile = ref<any>(null)
const selectedArticle = ref<Article | null>(null)

// Stats
const stats = computed(() => ({
  total: articles.value.length,
  unread: articles.value.filter(a => !a.organization.isRead && !a.organization.isArchived).length,
  pinned: articles.value.filter(a => a.organization.isPinned).length,
  archived: articles.value.filter(a => a.organization.isArchived).length,
}))

// Filtered articles
const filteredArticles = computed(() => {
  let filtered = articles.value

  // Apply search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(a =>
      a.title.toLowerCase().includes(query) ||
      a.domain.toLowerCase().includes(query) ||
      a.organization.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // Apply view filter (navigation)
  if (currentView.value === 'unread') {
    filtered = filtered.filter(a => !a.organization.isRead && !a.organization.isArchived)
  } else if (currentView.value === 'pinned') {
    filtered = filtered.filter(a => a.organization.isPinned)
  } else if (currentView.value === 'archived') {
    filtered = filtered.filter(a => a.organization.isArchived)
  } else if (currentView.value === 'category') {
    filtered = filtered.filter(a => a.organization.category === currentCategoryId.value && !a.organization.isArchived)
  } else if (currentView.value === 'all') {
    filtered = filtered.filter(a => !a.organization.isArchived)
  }

  // Apply read status filter
  if (currentFilter.value.readStatus === 'unread') {
    filtered = filtered.filter(a => !a.organization.isRead)
  } else if (currentFilter.value.readStatus === 'read') {
    filtered = filtered.filter(a => a.organization.isRead)
  }

  // Apply source filter
  if (currentFilter.value.source) {
    filtered = filtered.filter(a => a.domain === currentFilter.value.source)
  }

  // Apply tag filter
  if (currentFilter.value.tag) {
    filtered = filtered.filter(a => a.organization.tags.includes(currentFilter.value.tag!))
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'date-desc':
        return new Date(b.timestamps.dateAdded).getTime() - new Date(a.timestamps.dateAdded).getTime()
      case 'date-asc':
        return new Date(a.timestamps.dateAdded).getTime() - new Date(b.timestamps.dateAdded).getTime()
      case 'title-asc':
        return a.title.localeCompare(b.title)
      case 'title-desc':
        return b.title.localeCompare(a.title)
      case 'domain-asc':
        return a.domain.localeCompare(b.domain)
      case 'domain-desc':
        return b.domain.localeCompare(a.domain)
      default:
        return new Date(b.timestamps.dateAdded).getTime() - new Date(a.timestamps.dateAdded).getTime()
    }
  })

  return filtered
})

// Paginated articles
const totalPages = computed(() => Math.ceil(filteredArticles.value.length / itemsPerPage.value))
const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredArticles.value.slice(start, end)
})

// Popular tags
const popularTags = computed(() => {
  return tags.value
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 10)
})

// Top sources
const topSources = computed(() => {
  const sourceCounts = new Map<string, number>()
  articles.value.forEach(article => {
    const domain = article.domain
    sourceCounts.set(domain, (sourceCounts.get(domain) || 0) + 1)
  })
  
  return Array.from(sourceCounts.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
})

// Methods
// Navigation methods
const changeView = (view: string, categoryId?: string) => {
  currentView.value = view
  if (view === 'category' && categoryId) {
    currentCategoryId.value = categoryId
  } else {
    currentCategoryId.value = ''
  }
  // Clear filters when changing views
  currentFilter.value = {}
  currentPage.value = 1
  selectedArticles.value.clear()
}

// Filter methods
const applyFilters = () => {
  currentPage.value = 1
}

const clearFilters = () => {
  currentFilter.value = {}
  currentPage.value = 1
}

const hasActiveFilters = computed(() => {
  return !!(currentFilter.value.readStatus || currentFilter.value.source || currentFilter.value.tag)
})

const activeFilterCount = computed(() => {
  let count = 0
  if (currentFilter.value.readStatus) count++
  if (currentFilter.value.source) count++
  if (currentFilter.value.tag) count++
  return count
})

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const toggleSelectMode = () => {
  // Enter select mode - enables checkboxes for manual selection
  selectMode.value = true
  selectedArticles.value = new Set()
}

const exitSelectMode = () => {
  selectMode.value = false
  selectedArticles.value.clear()
}

const clearSelection = () => {
  selectedArticles.value.clear()
  selectMode.value = false
}

const toggleSelection = (articleId: string) => {
  if (selectedArticles.value.has(articleId)) {
    selectedArticles.value.delete(articleId)
  } else {
    selectedArticles.value.add(articleId)
  }
  selectedArticles.value = new Set(selectedArticles.value)
}

const toggleBulkMenu = () => {
  showBulkActions.value = !showBulkActions.value
}

const handleArticleAction = async (data: { articleId: string; action: string }) => {
  const { articleId, action } = data
  const article = articles.value.find(a => a.id === articleId)
  if (!article) {
    return
  }
  
  try {
    switch (action) {
      case 'read':
        await updateArticle(articleId, {
          organization: {
            category: article.organization.category,
            tags: [...article.organization.tags],
            isPinned: article.organization.isPinned,
            isArchived: article.organization.isArchived,
            isRead: true
          },
          timestamps: {
            dateAdded: article.timestamps.dateAdded,
            lastAccessed: article.timestamps.lastAccessed,
            dateRead: new Date().toISOString()
          }
        })

        const updatedArticleRead = articles.value.find(a => a.id === articleId)
        console.log('Article state AFTER read:', updatedArticleRead?.organization.isRead)
        success('Marked as read')
        break
      case 'unread':
        await updateArticle(articleId, {
          organization: {
            category: article.organization.category,
            tags: [...article.organization.tags],
            isPinned: article.organization.isPinned,
            isArchived: article.organization.isArchived,
            isRead: false
          }
        })
        const updatedArticleUnread = articles.value.find(a => a.id === articleId)
        console.log('Article state AFTER unread:', updatedArticleUnread?.organization.isRead)
        success('Marked as unread')
        break
      case 'pin':
        const newPinnedState = !article.organization.isPinned
        await updateArticle(articleId, {
          organization: {
            category: article.organization.category,
            tags: [...article.organization.tags],
            isPinned: newPinnedState,
            isArchived: article.organization.isArchived,
            isRead: article.organization.isRead
          }
        })
        const updatedArticlePin = articles.value.find(a => a.id === articleId)
        console.log('Article state AFTER pin:', updatedArticlePin?.organization.isPinned)
        success(newPinnedState ? 'Pinned' : 'Unpinned')
        break
      case 'archive':
        const newArchivedState = !article.organization.isArchived
        await updateArticle(articleId, {
          organization: {
            category: article.organization.category,
            tags: [...article.organization.tags],
            isPinned: article.organization.isPinned,
            isArchived: newArchivedState,
            isRead: article.organization.isRead
          }
        })
        const updatedArticleArchive = articles.value.find(a => a.id === articleId)
        console.log('Article state AFTER archive:', updatedArticleArchive?.organization.isArchived)
        success(newArchivedState ? 'Archived' : 'Unarchived')
        break
      case 'ai-summary':
        await generateAISummary(articleId)
        break
      case 'podcast':
        await generatePodcast(articleId)
        break
      case 'delete':
        // Set article to delete and show confirmation modal
        articleToDelete.value = articleId
        showDeleteArticleModal.value = true
        break
    }
  } catch (err) {
    console.error('Action failed with error:', err)
    showError('Action failed')
  }
}

const generateAISummary = async (articleId: string, type: SummaryType = SummaryType.CONCISE) => {
  // Mark article as loading
  summaryGeneratingArticles.value.add(articleId)
  summaryGeneratingArticles.value = new Set(summaryGeneratingArticles.value) // Trigger reactivity
  
  try {
    success(`Generating ${type} AI summary...`)
    // Use AI Manager to generate summary with configured provider
    await aiManager.generateSummary(articleId, type)
    success('AI summary generated successfully!')
    // Reload articles to show the new summary
    await loadArticles()
  } catch (err) {
    console.error('Failed to generate summary:', err)
    showError(err instanceof Error ? err.message : 'Failed to generate summary')
  } finally {
    // Remove from loading set
    summaryGeneratingArticles.value.delete(articleId)
    summaryGeneratingArticles.value = new Set(summaryGeneratingArticles.value) // Trigger reactivity
  }
}

const generatePodcast = async (articleId: string) => {
  // Mark article as loading
  podcastGeneratingArticles.value.add(articleId)
  podcastGeneratingArticles.value = new Set(podcastGeneratingArticles.value) // Trigger reactivity
  
  try {
    success('Generating podcast... This may take a moment.')
    
    // Run podcast generation in background to prevent UI blocking
    // Use setTimeout to yield control back to the browser
    setTimeout(async () => {
      try {
        await aiManager.generatePodcast(articleId)
        success('Podcast generated successfully!')
        // Reload articles to show the new podcast
        await loadArticles()
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to generate podcast')
      } finally {
        // Remove loading state
        podcastGeneratingArticles.value.delete(articleId)
        podcastGeneratingArticles.value = new Set(podcastGeneratingArticles.value) // Trigger reactivity
      }
    }, 100) // Small delay to allow UI to update
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Failed to start podcast generation')
    // Remove loading state on error
    podcastGeneratingArticles.value.delete(articleId)
    podcastGeneratingArticles.value = new Set(podcastGeneratingArticles.value) // Trigger reactivity
  }
}

const viewSummary = async (articleId: string) => {
  try {
    const article = articles.value.find(a => a.id === articleId)
    
    if (!article || !article.summaryIds || article.summaryIds.length === 0) {
      showError('No summary found for this article')
      return
    }

    // Get all summaries for this article
    const summaries = await storage.getSummariesForArticle(articleId)
    
    if (summaries.length === 0) {
      showError('No summary found for this article')
      return
    }

    // Prioritize concise summary for display (it's what users expect to see)
    const conciseSummary = summaries.find(s => s.type === SummaryType.CONCISE)
    const summaryToShow = conciseSummary || summaries[summaries.length - 1]

    selectedSummary.value = summaryToShow
    selectedArticle.value = article
    showSummaryModal.value = true
  } catch (err) {
    console.error('Failed to view summary:', err)
    showError('Failed to load summary')
  }
}

const viewPodcast = async (articleId: string) => {
  try {
    const article = articles.value.find(a => a.id === articleId)
    if (!article || !article.audioId) {
      showError('No podcast found for this article')
      return
    }

    // Get the audio file using the article's audioId (which is the summary ID)
    const audioFile = await storage.getAudioFileBySummaryId(article.audioId)
    
    if (!audioFile) {
      showError('Audio file not found')
      return
    }

    selectedArticle.value = article
    selectedAudioFile.value = audioFile
    showPodcastModal.value = true
  } catch (err) {
    console.error('Failed to view podcast:', err)
    showError('Failed to load podcast')
  }
}

// Summary modal handlers
const handleCopySummary = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    success('Summary copied to clipboard!')
  } catch (err) {
    showError('Failed to copy summary')
  }
}

const handleRegenerateSummary = async (articleId: string, type: SummaryType) => {
  showSummaryModal.value = false
  success('Regenerating summary...')
  await generateAISummary(articleId, type)
}

const handleInjectSummary = async (article: Article, summary: any) => {
  try {
    // Get the article URL
    if (!article.actualUrl && !article.cleanUrl) {
      showError('Cannot inject summary: Article URL not found')
      return
    }
    
    const url = article.actualUrl || article.cleanUrl
    
    // Find the tab with this URL
    const tabs = await chrome.tabs.query({ url: url })
    
    let targetTab
    if (tabs.length === 0) {
      // No existing tab found - create a new one
      targetTab = await chrome.tabs.create({ url: url })
      
      // Wait for the tab to load before injecting
      await new Promise<void>((resolve) => {
        const listener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
          if (tabId === targetTab!.id && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener)
            resolve()
          }
        }
        chrome.tabs.onUpdated.addListener(listener)
        
        // Timeout after 10 seconds
        setTimeout(() => {
          chrome.tabs.onUpdated.removeListener(listener)
          resolve()
        }, 10000)
      })
    } else {
      // Tab exists - focus it
      targetTab = tabs[0]
      await chrome.tabs.update(targetTab.id!, { active: true })
      
      // Also focus the window
      if (targetTab.windowId) {
        await chrome.windows.update(targetTab.windowId, { focused: true })
      }
    }
    
    // Inject the summary into the page
    await chrome.tabs.sendMessage(targetTab.id!, {
      action: 'injectSummary',
      summary: summary.content,
      metadata: {
        provider: summary.aiProvider,
        type: summary.type,
        date: summary.generatedDate
      }
    })
    
    success('Summary injected into page!')
    showSummaryModal.value = false
  } catch (err) {
    console.error('Failed to inject summary:', err)
    showError('Failed to inject summary into page.')
  }
}

// Podcast modal handlers
const handleRegeneratePodcast = async (articleId: string) => {
  showPodcastModal.value = false
  success('Regenerating podcast...')
  await generatePodcast(articleId)
}

const handleInjectPodcast = async (article: Article, audioFile: any, audioUrl: string) => {
  if (!audioUrl) {
    showError('Cannot inject: Audio URL is missing')
    return
  }
  
  try {
    // Get the article URL
    if (!article.actualUrl && !article.cleanUrl) {
      showError('Cannot inject podcast: Article URL not found')
      return
    }
    
    const url = article.actualUrl || article.cleanUrl
    
    // Convert blob URL to data URL for cross-context compatibility
    let dataUrl = audioUrl
    if (audioUrl.startsWith('blob:')) {
      try {
        const response = await fetch(audioUrl)
        const blob = await response.blob()
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      } catch (err) {
        console.error('Failed to convert blob to data URL:', err)
        showError('Failed to prepare audio for injection')
        return
      }
    }
    
    // Find the tab with this URL
    const tabs = await chrome.tabs.query({ url: url })
    
    let targetTab
    if (tabs.length === 0) {
      // No existing tab found - create a new one
      targetTab = await chrome.tabs.create({ url: url })
      
      // Wait for the tab to load before injecting
      await new Promise<void>((resolve) => {
        const listener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
          if (tabId === targetTab!.id && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener)
            resolve()
          }
        }
        chrome.tabs.onUpdated.addListener(listener)
        
        // Timeout after 10 seconds
        setTimeout(() => {
          chrome.tabs.onUpdated.removeListener(listener)
          resolve()
        }, 10000)
      })
    } else {
      // Tab exists - focus it
      targetTab = tabs[0]
      await chrome.tabs.update(targetTab.id!, { active: true })
      
      // Also focus the window
      if (targetTab.windowId) {
        await chrome.windows.update(targetTab.windowId, { focused: true })
      }
    }
    
    // Inject the podcast into the page
    await chrome.tabs.sendMessage(targetTab.id!, {
      action: 'injectPodcast',
      podcastData: {
        audioUrl: dataUrl,
        provider: audioFile.provider,
        duration: audioFile.duration,
        date: audioFile.generatedDate,
        voiceName: audioFile.voiceId
      }
    })
    
    success('Podcast injected into page!')
    
    // Close the modal after successful injection
    showPodcastModal.value = false
  } catch (err) {
    console.error('Failed to inject podcast:', err)
    showError('Failed to inject podcast into page.')
  }
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatProvider = (provider: string): string => {
  try {
    const aiProvider = provider as AIProvider
    return getProviderDisplayName(aiProvider)
  } catch {
    return provider.charAt(0).toUpperCase() + provider.slice(1)
  }
}

const handleBulkAction = async (action: string) => {
  const count = selectedArticles.value.size
  showBulkActions.value = false

  try {
    for (const articleId of selectedArticles.value) {
      await handleArticleAction({ articleId, action })
    }
    selectedArticles.value.clear()
    success(`${action} applied to ${count} articles`)
  } catch (err) {
    showError('Bulk action failed')
  }
}

const openArticle = async (articleId: string) => {
  const article = articles.value.find(a => a.id === articleId)
  if (article) {
    // Open the article in a new tab
    await chrome.tabs.create({ url: article.actualUrl })
    
    // Update article to mark as read with proper object construction
    await updateArticle(articleId, {
      organization: {
        category: article.organization.category,
        tags: [...article.organization.tags],
        isPinned: article.organization.isPinned,
        isArchived: article.organization.isArchived,
        isRead: true  // Mark as read
      },
      timestamps: {
        dateAdded: article.timestamps.dateAdded,
        lastAccessed: new Date().toISOString(),
        dateRead: new Date().toISOString()
      }
    })
    
    // Immediately update local state for instant UI feedback
    const localArticle = articles.value.find(a => a.id === articleId)
    if (localArticle) {
      localArticle.organization.isRead = true
      localArticle.timestamps.lastAccessed = new Date().toISOString()
      localArticle.timestamps.dateRead = new Date().toISOString()
    }
  }
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const getCategoryCount = (categoryId: string) => {
  return articles.value.filter(a => a.organization.category === categoryId && !a.organization.isArchived).length
}

const getViewTitle = () => {
  if (currentView.value === 'all') return 'All Articles'
  if (currentView.value === 'unread') return 'Reading List'
  if (currentView.value === 'pinned') return 'Favorites'
  if (currentView.value === 'archived') return 'Archive'
  if (currentView.value === 'category') {
    const cat = categories.value.find(c => c.id === currentCategoryId.value)
    return cat ? cat.name : 'Category'
  }
  if (currentFilter.value.source) return currentFilter.value.source
  if (currentFilter.value.tag) return `#${currentFilter.value.tag}`
  return 'Articles'
}

const getEmptyStateMessage = () => {
  if (searchQuery.value) return 'No articles match your search'
  if (currentView.value === 'unread') return 'All caught up! No unread articles.'
  if (currentView.value === 'pinned') return 'Pin your favorite articles'
  if (currentView.value === 'archived') return 'No archived articles'
  return 'Start saving articles to build your library'
}

const showAddArticleModal = () => {
  editingArticle.value = undefined
  showArticleModal.value = true
}

const showSettings = () => {
  showSettingsModal.value = true
}

const showExportImport = () => {
  showExportModal.value = true
}

const handleArticleSaved = async () => {
  await loadArticles()
}

const handleDataImported = async () => {
  await loadArticles()
  await loadCategories()
  await loadTags()
}

const openAIDashboard = async () => {
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (currentTab?.id) {
    await chrome.tabs.update(currentTab.id, { url: chrome.runtime.getURL('src/ai-dashboard/index.html') })
  }
}

const showCreateCategoryModal = () => {
  editingCategory.value = null
  showCategoryModal.value = true
}

const handleEditCategory = (category: any) => {
  editingCategory.value = category
  showCategoryModal.value = true
}

const handleDeleteCategory = async (categoryId: string) => {
  try {
    // Check if category has articles
    const articleCount = getCategoryCount(categoryId)
    if (articleCount > 0) {
      showError(`Cannot delete category with ${articleCount} articles. Move or delete articles first.`)
      return
    }
    
    const category = categories.value.find(c => c.id === categoryId)
    if (!category) return
    
    // Set category to delete and show confirmation modal
    categoryToDelete.value = { id: category.id, name: category.name }
    showDeleteCategoryModal.value = true
  } catch (err) {
    showError('Failed to delete category')
    console.error('Error deleting category:', err)
  }
}

const confirmDeleteCategory = async () => {
  if (!categoryToDelete.value) return
  
  try {
    const { id, name } = categoryToDelete.value
    
    // Remove from categories array
    categories.value = categories.value.filter(c => c.id !== id)
    
    // Save to storage
    await chrome.storage.local.set({ categories: categories.value })
    
    success(`Category "${name}" deleted successfully!`)
    
    // If currently viewing this category, switch to all articles
    if (currentView.value === 'category' && currentCategoryId.value === id) {
      changeView('all')
    }
    
    // Close modal and reset state
    showDeleteCategoryModal.value = false
    categoryToDelete.value = null
  } catch (err) {
    showError('Failed to delete category')
    console.error('Error deleting category:', err)
  }
}

const cancelDeleteCategory = () => {
  categoryToDelete.value = null
  showDeleteCategoryModal.value = false
}

const confirmDeleteArticle = async () => {
  if (!articleToDelete.value) return
  
  try {
    await deleteArticle(articleToDelete.value)
    success('Article deleted successfully!')
    
    // Close modal and reset state
    showDeleteArticleModal.value = false
    articleToDelete.value = null
  } catch (err) {
    showError('Failed to delete article')
    console.error('Error deleting article:', err)
  }
}

const cancelDeleteArticle = () => {
  articleToDelete.value = null
  showDeleteArticleModal.value = false
}

const handleCategoryCreated = async (categoryData: { name: string; color: string }) => {
  try {
    // Generate a unique ID for the category
    const newCategory = {
      id: `category_${Date.now()}`,
      name: categoryData.name,
      color: categoryData.color
    }
    
    // Add to categories array
    categories.value.push(newCategory)
    
    // Save to storage
    await chrome.storage.local.set({ categories: categories.value })
    
    success(`Category "${categoryData.name}" created successfully!`)
    
    // Optionally switch to the new category view
    changeView('category', newCategory.id)
  } catch (err) {
    showError('Failed to create category')
    console.error('Error creating category:', err)
  }
}

const handleCategoryUpdated = async (categoryData: { id: string; name: string; color: string }) => {
  try {
    // Find and update category
    const categoryIndex = categories.value.findIndex(c => c.id === categoryData.id)
    if (categoryIndex === -1) return
    
    categories.value[categoryIndex] = {
      ...categories.value[categoryIndex],
      name: categoryData.name,
      color: categoryData.color
    }
    
    // Save to storage
    await chrome.storage.local.set({ categories: categories.value })
    
    success(`Category "${categoryData.name}" updated successfully!`)
  } catch (err) {
    showError('Failed to update category')
    console.error('Error updating category:', err)
  }
}

onMounted(async () => {
  isLoading.value = true
  await init()
  await loadArticles()
  await loadCategories()
  await loadTags()
  isLoading.value = false
})
</script>

<style>
/* Manager page-specific global styles */
body {
  background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary));
  overflow: hidden;
  height: 100vh;
}

.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>

<style scoped>
/* AI Feature Content Styles */
.ai-feature-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-feature-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.type-badge {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.15);
  letter-spacing: 0.02em;
}

.model-badge {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 500;
  background: rgba(107, 114, 128, 0.08);
  color: #6b7280;
  border: 1px solid rgba(107, 114, 128, 0.12);
}

.voice-badge {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 500;
  background: rgba(6, 182, 212, 0.1);
  color: #0891b2;
  border: 1px solid rgba(6, 182, 212, 0.15);
}

.duration-badge {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  background: rgba(11, 60, 73, 0.1);
  color: #0B3C49;
  border: 1px solid rgba(11, 60, 73, 0.15);
}

.provider-badge {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.provider-badge.openai {
  background: rgba(16, 163, 127, 0.1);
  color: #10a37f;
  border: 1px solid rgba(16, 163, 127, 0.15);
}

.provider-badge.gemini {
  background: rgba(66, 133, 244, 0.1);
  color: #4285f4;
  border: 1px solid rgba(66, 133, 244, 0.15);
}

.provider-badge.elevenlabs {
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
  border: 1px solid rgba(124, 58, 237, 0.15);
}

/* View AI Button */
.view-ai-btn {
  padding: 6px 12px;
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  justify-content: center;
}

.view-ai-btn:hover {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
}

.view-ai-btn:active {
  transform: translateY(0);
}

/* Podcast-specific button styling */
.article-card__ai-section--podcast .view-ai-btn {
  background: rgba(6, 182, 212, 0.1);
  color: #06b6d4;
  border-color: rgba(6, 182, 212, 0.2);
}

.article-card__ai-section--podcast .view-ai-btn:hover {
  background: rgba(6, 182, 212, 0.15);
  border-color: rgba(6, 182, 212, 0.3);
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.15);
}
</style>
