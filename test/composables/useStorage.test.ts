import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStorage } from '@/composables/useStorage'
import { storage } from '@/utils/storage'

// Mock the storage module
vi.mock('@/utils/storage', () => ({
  storage: {
    init: vi.fn(),
    getAllArticles: vi.fn(),
    getAllCategories: vi.fn(),
    getAllTags: vi.fn(),
    saveArticle: vi.fn(),
    updateArticle: vi.fn(),
    deleteArticle: vi.fn(),
    saveCategory: vi.fn(),
    getSummariesForArticle: vi.fn(),
    getAudioFileBySummaryId: vi.fn(),
  },
}))

describe('useStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize storage', async () => {
    vi.mocked(storage.init).mockResolvedValue(undefined)
    
    const { init, isLoading, error } = useStorage()
    
    expect(isLoading.value).toBe(false)
    
    await init()
    
    expect(storage.init).toHaveBeenCalled()
    expect(error.value).toBeNull()
  })

  it('should handle initialization errors', async () => {
    vi.mocked(storage.init).mockRejectedValue(new Error('Init failed'))
    
    const { init, error } = useStorage()
    
    await init()
    
    expect(error.value).toBe('Init failed')
  })

  it('should load articles', async () => {
    const mockArticles = [
      {
        id: '1',
        title: 'Test Article',
        cleanUrl: 'https://example.com',
        actualUrl: 'https://example.com',
        domain: 'example.com',
        content: 'Content',
        organization: { category: 'Tech', tags: [], isPinned: false, isArchived: false, isRead: false },
        metadata: { wordCount: 100, readingTime: '1 min' },
        timestamps: { dateAdded: new Date().toISOString(), lastAccessed: new Date().toISOString() },
        workflow: { reminderScheduled: false, protectedFromCleanup: false },
        summaryIds: [],
      },
    ]
    
    vi.mocked(storage.init).mockResolvedValue(undefined)
    vi.mocked(storage.getAllArticles).mockResolvedValue(mockArticles as any)
    
    const { loadArticles, articles } = useStorage()
    
    await loadArticles()
    
    expect(storage.getAllArticles).toHaveBeenCalled()
    expect(articles.value).toHaveLength(1)
    expect(articles.value[0].title).toBe('Test Article')
  })

  it('should save article', async () => {
    const mockArticle = {
      id: '1',
      title: 'New Article',
      cleanUrl: 'https://example.com',
      actualUrl: 'https://example.com',
    }
    
    vi.mocked(storage.init).mockResolvedValue(undefined)
    vi.mocked(storage.saveArticle).mockResolvedValue(mockArticle as any)
    vi.mocked(storage.getAllArticles).mockResolvedValue([mockArticle] as any)
    
    const { saveArticle } = useStorage()
    
    const result = await saveArticle({ title: 'New Article' })
    
    expect(storage.saveArticle).toHaveBeenCalled()
    expect(result.title).toBe('New Article')
  })

  it('should update article', async () => {
    const mockArticle = {
      id: '1',
      title: 'Updated Article',
    }
    
    vi.mocked(storage.init).mockResolvedValue(undefined)
    vi.mocked(storage.updateArticle).mockResolvedValue(mockArticle as any)
    vi.mocked(storage.getAllArticles).mockResolvedValue([mockArticle] as any)
    
    const { updateArticle } = useStorage()
    
    const result = await updateArticle('1', { title: 'Updated Article' })
    
    expect(storage.updateArticle).toHaveBeenCalledWith('1', { title: 'Updated Article' })
    expect(result.title).toBe('Updated Article')
  })

  it('should delete article', async () => {
    vi.mocked(storage.init).mockResolvedValue(undefined)
    vi.mocked(storage.deleteArticle).mockResolvedValue(undefined)
    vi.mocked(storage.getAllArticles).mockResolvedValue([])
    
    const { deleteArticle } = useStorage()
    
    await deleteArticle('1')
    
    expect(storage.deleteArticle).toHaveBeenCalledWith('1')
  })

  it('should load categories', async () => {
    const mockCategories = [
      { id: '1', name: 'Tech', color: '#ff0000' },
    ]
    
    vi.mocked(storage.init).mockResolvedValue(undefined)
    vi.mocked(storage.getAllCategories).mockResolvedValue(mockCategories as any)
    
    const { loadCategories, categories } = useStorage()
    
    await loadCategories()
    
    expect(storage.getAllCategories).toHaveBeenCalled()
    expect(categories.value).toHaveLength(1)
  })

  it('should load tags', async () => {
    const mockTags = [
      { name: 'javascript', usageCount: 5 },
    ]
    
    vi.mocked(storage.init).mockResolvedValue(undefined)
    vi.mocked(storage.getAllTags).mockResolvedValue(mockTags)
    
    const { loadTags, tags } = useStorage()
    
    await loadTags()
    
    expect(storage.getAllTags).toHaveBeenCalled()
    expect(tags.value).toHaveLength(1)
  })
})
