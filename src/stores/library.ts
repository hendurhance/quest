import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/core/db'
import type { Article, ArticleStatus, Category, Tag, NewArticle } from '@/core/db'

export type LibraryView =
  | 'all'
  | 'unread'
  | 'reading'
  | 'favorites'
  | 'archived'
  | 'category'
  | 'tag'
  | 'source'

export type SortKey = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'domain-asc'

function sortArticles(list: Article[], key: SortKey): Article[] {
  const time = (a: Article) => new Date(a.createdAt).getTime()
  return list.sort((a, b) => {
    switch (key) {
      case 'date-asc':
        return time(a) - time(b)
      case 'title-asc':
        return a.title.localeCompare(b.title)
      case 'title-desc':
        return b.title.localeCompare(a.title)
      case 'domain-asc':
        return a.url.domain.localeCompare(b.url.domain)
      case 'date-desc':
      default:
        return time(b) - time(a)
    }
  })
}

export const useLibraryStore = defineStore('library', () => {
  const articles = ref<Article[]>([])
  const categories = ref<Category[]>([])
  const tags = ref<Tag[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const view = ref<LibraryView>('all')
  const activeKey = ref('') // category id / tag name / source domain
  const search = ref('')
  const sort = ref<SortKey>('date-desc')
  const page = ref(1)
  const pageSize = ref(24)
  const selection = ref<Set<string>>(new Set())

  async function load(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      await db.init()
      const [a, c, t] = await Promise.all([
        db.articles.getAll(),
        db.categories.getAll(),
        db.tags.getAll(),
      ])
      articles.value = a
      categories.value = c
      tags.value = t
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load library'
    } finally {
      isLoading.value = false
    }
  }

  const stats = computed(() => ({
    total: articles.value.filter((a) => a.status !== 'archived').length,
    unread: articles.value.filter((a) => a.status === 'unread').length,
    reading: articles.value.filter((a) => a.status === 'reading').length,
    favorites: articles.value.filter((a) => a.isPinned).length,
    archived: articles.value.filter((a) => a.status === 'archived').length,
  }))

  const visible = computed<Article[]>(() => {
    let list = articles.value.slice()

    const q = search.value.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.url.domain.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.tags.some((tag) => tag.toLowerCase().includes(q)),
      )
    }

    switch (view.value) {
      case 'unread':
        list = list.filter((a) => a.status === 'unread')
        break
      case 'reading':
        list = list.filter((a) => a.status === 'reading')
        break
      case 'favorites':
        list = list.filter((a) => a.isPinned && a.status !== 'archived')
        break
      case 'archived':
        list = list.filter((a) => a.status === 'archived')
        break
      case 'category':
        list = list.filter((a) => a.categoryId === activeKey.value && a.status !== 'archived')
        break
      case 'tag':
        list = list.filter((a) => a.tags.includes(activeKey.value) && a.status !== 'archived')
        break
      case 'source':
        list = list.filter((a) => a.url.domain === activeKey.value && a.status !== 'archived')
        break
      case 'all':
      default:
        list = list.filter((a) => a.status !== 'archived')
        break
    }

    return sortArticles(list, sort.value)
  })

  const pageCount = computed(() => Math.max(1, Math.ceil(visible.value.length / pageSize.value)))

  const paged = computed<Article[]>(() => {
    const start = (page.value - 1) * pageSize.value
    return visible.value.slice(start, start + pageSize.value)
  })

  const topSources = computed(() => {
    const counts = new Map<string, number>()
    for (const a of articles.value) {
      if (a.status === 'archived') continue
      counts.set(a.url.domain, (counts.get(a.url.domain) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
  })

  const popularTags = computed(() =>
    tags.value.slice().sort((a, b) => b.usageCount - a.usageCount).slice(0, 16),
  )

  function categoryCount(categoryId: string): number {
    return articles.value.filter((a) => a.categoryId === categoryId && a.status !== 'archived').length
  }

  function setView(next: LibraryView, key = ''): void {
    view.value = next
    activeKey.value = key
    page.value = 1
    selection.value = new Set()
  }

  function goToPage(n: number): void {
    page.value = Math.min(Math.max(1, n), pageCount.value)
  }

  function toggleSelect(id: string): void {
    const next = new Set(selection.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selection.value = next
  }

  function clearSelection(): void {
    selection.value = new Set()
  }

  function replaceLocal(article: Article): void {
    const idx = articles.value.findIndex((a) => a.id === article.id)
    if (idx === -1) articles.value.push(article)
    else articles.value.splice(idx, 1, article)
  }

  async function addArticle(input: NewArticle): Promise<Article> {
    const article = await db.createArticle(input)
    replaceLocal(article)
    tags.value = await db.tags.getAll()
    return article
  }

  async function patchArticle(id: string, updates: Partial<Article>): Promise<void> {
    const updated = await db.articles.update(id, updates)
    replaceLocal(updated)
  }

  async function setStatus(id: string, status: ArticleStatus): Promise<void> {
    const patch: Partial<Article> = { status }
    if (status === 'read') {
      patch.readAt = new Date().toISOString()
      patch.readingProgress = 1
    }
    await patchArticle(id, patch)
  }

  async function togglePin(id: string): Promise<void> {
    const article = articles.value.find((a) => a.id === id)
    if (!article) return
    await patchArticle(id, { isPinned: !article.isPinned })
  }

  async function setTags(id: string, next: string[]): Promise<void> {
    const updated = await db.setArticleTags(id, next)
    replaceLocal(updated)
    tags.value = await db.tags.getAll()
  }

  async function remove(id: string): Promise<void> {
    await db.deleteArticle(id)
    articles.value = articles.value.filter((a) => a.id !== id)
    const next = new Set(selection.value)
    next.delete(id)
    selection.value = next
    tags.value = await db.tags.getAll()
  }

  async function createCategory(name: string, color: string): Promise<Category> {
    const category = await db.categories.save(name, color)
    categories.value.push(category)
    return category
  }

  async function updateCategory(category: Category): Promise<void> {
    await db.categories.put(category)
    const idx = categories.value.findIndex((c) => c.id === category.id)
    if (idx !== -1) categories.value.splice(idx, 1, category)
  }

  async function deleteCategory(id: string): Promise<void> {
    await db.categories.delete(id)
    categories.value = categories.value.filter((c) => c.id !== id)
  }

  return {
    articles,
    categories,
    tags,
    isLoading,
    error,
    view,
    activeKey,
    search,
    sort,
    page,
    pageSize,
    selection,
    stats,
    visible,
    paged,
    pageCount,
    topSources,
    popularTags,
    categoryCount,
    load,
    setView,
    goToPage,
    toggleSelect,
    clearSelection,
    addArticle,
    patchArticle,
    setStatus,
    togglePin,
    setTags,
    remove,
    createCategory,
    updateCategory,
    deleteCategory,
  }
})
