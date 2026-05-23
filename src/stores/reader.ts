import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/core/db'
import type { Article, Summary, AudioFile, Highlight, NewHighlight } from '@/core/db'

export const useReaderStore = defineStore('reader', () => {
  const article = ref<Article | null>(null)
  const summaries = ref<Summary[]>([])
  const audioFile = ref<AudioFile | null>(null)
  const audioUrl = ref<string | null>(null)
  const highlights = ref<Highlight[]>([])
  const isLoading = ref(false)
  const progress = ref(0)

  function revokeAudio(): void {
    if (audioUrl.value) {
      URL.revokeObjectURL(audioUrl.value)
      audioUrl.value = null
    }
  }

  async function open(articleId: string): Promise<void> {
    isLoading.value = true
    revokeAudio()
    try {
      await db.init()
      article.value = await db.articles.get(articleId)
      summaries.value = await db.summaries.getForArticle(articleId)
      highlights.value = await db.highlights.listForArticle(articleId)
      audioFile.value = null
      if (article.value?.audioId) {
        const file = await db.audio.getBySummaryId(article.value.audioId)
        if (file) {
          audioFile.value = file
          audioUrl.value = URL.createObjectURL(db.audio.toBlob(file))
        }
      }
      progress.value = article.value?.readingProgress ?? 0
    } finally {
      isLoading.value = false
    }
  }

  function close(): void {
    revokeAudio()
    article.value = null
    summaries.value = []
    audioFile.value = null
    highlights.value = []
    progress.value = 0
  }

  async function setProgress(value: number): Promise<void> {
    progress.value = Math.min(1, Math.max(0, value))
    if (article.value) {
      const status = progress.value >= 0.98 ? 'read' : 'reading'
      await db.articles.update(article.value.id, { readingProgress: progress.value, status })
    }
  }

  async function addHighlight(input: NewHighlight): Promise<void> {
    const created = await db.highlights.add(input)
    highlights.value = [...highlights.value, created]
  }

  async function removeHighlight(id: string): Promise<void> {
    await db.highlights.delete(id)
    highlights.value = highlights.value.filter((h) => h.id !== id)
  }

  async function updateHighlightNote(id: string, note: string): Promise<void> {
    const updated = await db.highlights.update(id, { note })
    highlights.value = highlights.value.map((h) => (h.id === id ? updated : h))
  }

  return {
    article,
    summaries,
    audioFile,
    audioUrl,
    highlights,
    isLoading,
    progress,
    open,
    close,
    setProgress,
    addHighlight,
    removeHighlight,
    updateHighlightNote,
  }
})
