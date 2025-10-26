import { ref, onMounted } from 'vue'
import { storage } from '@/utils/storage'
import type { Article, Category, Tag, Settings } from '@/types'

export function useStorage() {
  const articles = ref<Article[]>([])
  const categories = ref<Category[]>([])
  const tags = ref<Tag[]>([])
  const settings = ref<Settings | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const init = async () => {
    try {
      isLoading.value = true
      error.value = null
      await storage.init()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize storage'
    } finally {
      isLoading.value = false
    }
  }

  const loadArticles = async () => {
    try {
      isLoading.value = true
      const fetchedArticles = await storage.getAllArticles()
      
      // Enrich articles with summary and podcast metadata
      const enrichedArticles = await Promise.all(
        fetchedArticles.map(async (article) => {
          // Load latest CONCISE summary if exists (prefer concise over extended)
          if (article.summaryIds && article.summaryIds.length > 0) {
            const summaries = await storage.getSummariesForArticle(article.id)
            if (summaries.length > 0) {
              // Prioritize concise summary, fallback to latest
              const conciseSummary = summaries.find(s => s.type === 'concise')
              article.aiSummary = conciseSummary || summaries[summaries.length - 1]
            }
          }
          
          // Load podcast metadata if exists
          if (article.audioId) {
            // Get the audio file
            const audioFile = await storage.getAudioFileBySummaryId(article.audioId)
            if (audioFile) {
              // Get the associated summary
              const summaries = await storage.getSummariesForArticle(article.id)
              const podcastSummary = summaries.find(s => s.id === article.audioId)
              if (podcastSummary) {
                // Enrich the summary with audio metadata
                article.audioPodcast = {
                  ...podcastSummary,
                  audioUrl: URL.createObjectURL(audioFile.audioBlob),
                  audioBlob: audioFile.audioBlob,
                  duration: audioFile.duration,
                  voiceName: audioFile.voiceId
                }
              }
            }
          }
          
          return article
        })
      )
      
      articles.value = enrichedArticles
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load articles'
    } finally {
      isLoading.value = false
    }
  }

  const loadCategories = async () => {
    try {
      categories.value = await storage.getAllCategories()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load categories'
    }
  }

  const loadTags = async () => {
    try {
      tags.value = await storage.getAllTags()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load tags'
    }
  }

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.sync.get(['settings'])
      settings.value = result.settings || null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load settings'
    }
  }

  const saveArticle = async (articleData: Partial<Article>) => {
    try {
      const article = await storage.saveArticle(articleData)
      await loadArticles()
      return article
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save article'
      throw err
    }
  }

  const updateArticle = async (id: string, updates: Partial<Article>) => {
    try {
      const article = await storage.updateArticle(id, updates)
      await loadArticles()
      return article
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update article'
      throw err
    }
  }

  const deleteArticle = async (id: string) => {
    try {
      await storage.deleteArticle(id)
      await loadArticles()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete article'
      throw err
    }
  }

  const saveCategory = async (name: string, color: string) => {
    try {
      const category = await storage.saveCategory(name, color)
      await loadCategories()
      return category
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save category'
      throw err
    }
  }

  onMounted(async () => {
    await init()
  })

  return {
    // State
    articles,
    categories,
    tags,
    settings,
    isLoading,
    error,
    // Methods
    init,
    loadArticles,
    loadCategories,
    loadTags,
    loadSettings,
    saveArticle,
    updateArticle,
    deleteArticle,
    saveCategory,
  }
}
