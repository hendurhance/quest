<template>
  <div class="capture">
    <header class="masthead">
      <div class="wordmark">
        <QIcon name="bookmark" :size="18" class="wordmark__mark" />
        <span class="wordmark__name">Quest</span>
      </div>
      <div class="masthead__actions">
        <button class="icon-btn" :title="theme === 'dark' ? 'Light mode' : 'Ink mode'" @click="toggleTheme">
          <QIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="16" />
        </button>
        <button class="icon-btn" title="Open library" @click="openLibrary">
          <QIcon name="book-open" :size="16" />
        </button>
      </div>
    </header>

    <section class="page-card">
      <div class="page-card__top">
        <img v-if="page.favicon" class="page-card__favicon" :src="page.favicon" alt="" />
        <div class="page-card__head">
          <h1 class="page-card__title">{{ page.title }}</h1>
          <p class="page-card__meta">
            <span>{{ page.domain || '—' }}</span>
            <span class="dot">·</span>
            <span>{{ page.readingTime }}</span>
          </p>
        </div>
      </div>
    </section>

    <section class="form" v-if="!isSaved">
      <div class="field">
        <span class="field__label">Tags</span>
        <div class="tags-input" :class="{ 'is-focused': tagFocused }">
          <QTag v-for="t in tags" :key="t" removable @remove="removeTag(t)">{{ t }}</QTag>
          <input
            v-model="tagInput"
            class="tags-input__field"
            :placeholder="tags.length ? '' : 'Add tags, comma-separated'"
            @keydown="onTagKey"
            @focus="tagFocused = true"
            @blur="tagFocused = false"
          />
        </div>
        <div v-if="suggestions.length" class="suggestions">
          <button v-for="s in suggestions" :key="s" class="suggestion" type="button" @mousedown.prevent="addTag(s)">
            + {{ s }}
          </button>
        </div>
      </div>

      <label class="field">
        <span class="field__label">Shelf</span>
        <div class="select">
          <select v-model="categoryId">
            <option value="">Uncategorized</option>
            <option v-for="c in library.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
      </label>

      <div class="toggles">
        <div class="toggle">
          <span class="toggle__text">AI summary on save</span>
          <QSwitch v-model="generateSummary" />
        </div>
        <div class="toggle">
          <span class="toggle__text">Generate podcast</span>
          <QSwitch v-model="generatePodcast" />
        </div>
        <div class="toggle">
          <span class="toggle__text">Close tab after saving</span>
          <QSwitch v-model="closeTabAfterSave" />
        </div>
      </div>

      <QButton variant="primary" size="lg" block :loading="isSaving" @click="save">
        {{ isSaving ? 'Saving…' : 'Save to Quest' }}
      </QButton>
    </section>

    <section v-else class="saved">
      <QIcon name="check" :size="28" class="saved__mark" />
      <p class="saved__text">Saved to your library.</p>
      <QButton variant="secondary" size="md" @click="openLibrary">Open library</QButton>
    </section>

    <QRule />

    <footer class="footer">
      <p class="footer__stats">
        <strong>{{ library.stats.total }}</strong> saved
        <span class="dot">·</span>
        <strong>{{ library.stats.unread }}</strong> unread
      </p>
      <ul v-if="recent.length" class="recent">
        <li v-for="a in recent" :key="a.id" class="recent__item" @click="openArticle(a.url.actual)">
          <span class="recent__title">{{ a.title }}</span>
          <span class="recent__when">{{ formatRelativeTime(a.createdAt) }}</span>
        </li>
      </ul>
    </footer>

    <QToastHost />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLibraryStore } from '@/stores/library'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { useTheme } from '@/composables/useTheme'
import { sendMessage } from '@/core/messaging/bus'
import { normalizeUrl, formatRelativeTime } from '@/core/format'
import { AIProvider, SummaryType } from '@/types'
import type { NewArticle } from '@/core/db'
import { QButton, QTag, QRule, QToastHost, QIcon, QSwitch } from '@/design/primitives'

const library = useLibraryStore()
const settings = useSettingsStore()
const ui = useUiStore()
const { theme, toggleTheme } = useTheme()

const page = ref({ title: 'Loading…', url: '', domain: '', favicon: '', readingTime: 'Estimating…', wordCount: 0 })
const tags = ref<string[]>([])
const tagInput = ref('')
const tagFocused = ref(false)
const categoryId = ref('')
const generateSummary = ref(false)
const generatePodcast = ref(false)
const closeTabAfterSave = ref(true)
const isSaving = ref(false)
const isSaved = ref(false)
let activeTabId: number | undefined

const recent = computed(() =>
  library.articles
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3),
)

const suggestions = computed(() => {
  const q = tagInput.value.trim().toLowerCase()
  return library.popularTags
    .map((t) => t.name)
    .filter((name) => !tags.value.includes(name) && (!q || name.toLowerCase().includes(q)))
    .slice(0, 5)
})

function safeDomain(url?: string): string {
  try {
    return new URL(url ?? '').hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function onTagKey(e: KeyboardEvent): void {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addTag(tagInput.value)
  } else if (e.key === 'Backspace' && !tagInput.value && tags.value.length) {
    tags.value = tags.value.slice(0, -1)
  }
}

function addTag(value: string): void {
  const tag = value.trim().replace(/,$/, '').toLowerCase()
  if (tag && !tags.value.includes(tag)) tags.value = [...tags.value, tag]
  tagInput.value = ''
}

function removeTag(tag: string): void {
  tags.value = tags.value.filter((t) => t !== tag)
}

function checkSaved(): void {
  if (!page.value.url) return
  const clean = normalizeUrl(page.value.url)
  isSaved.value = library.articles.some((a) => a.url.clean === clean)
}

function estimateReadingTime(tabId: number): void {
  const timeout = setTimeout(() => {
    page.value.readingTime = '~ 5 min read'
  }, 2000)
  chrome.tabs.sendMessage(tabId, { action: 'getWordCount' }, (response) => {
    clearTimeout(timeout)
    if (chrome.runtime.lastError || !response?.wordCount) {
      page.value.readingTime = '~ 5 min read'
      return
    }
    page.value.wordCount = response.wordCount
    page.value.readingTime = `~ ${Math.max(1, Math.ceil(response.wordCount / 200))} min read`
  })
}

async function extractContent(tabId: number): Promise<string> {
  let csText = ''
  // 1) Ask the content script (best extraction — JSON-LD, semantic HTML, …).
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: 'extractContent' })
    const c = response?.content
    csText = (c && typeof c === 'object' ? c.content : typeof c === 'string' ? c : '') || ''
  } catch {
    // content script not present on this tab — fall through to injection
  }
  if (csText.trim().length >= 200) return csText

  // 2) Inject a one-off extractor and keep whichever yields more text. Works
  //    even when the content script never loaded, and rescues pages where the
  //    content script only found a short snippet.
  try {
    const [injected] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const root = document.querySelector('article') || document.querySelector('main') || document.body
        if (!root) return ''
        const blocks = Array.from(root.querySelectorAll('p, h1, h2, h3, h4, li, blockquote, pre'))
          .map((node) => (node.textContent || '').trim())
          .filter((t) => t.length > 0)
        return blocks.length ? blocks.join('\n\n') : (root as HTMLElement).innerText || ''
      },
    })
    const injText = (injected?.result as string) || ''
    return injText.length > csText.length ? injText : csText
  } catch {
    return csText
  }
}

async function save(): Promise<void> {
  if (isSaving.value || isSaved.value || !page.value.url) return
  isSaving.value = true
  try {
    const text = activeTabId ? await extractContent(activeTabId) : ''
    const input: NewArticle = {
      url: { actual: page.value.url, clean: normalizeUrl(page.value.url) },
      title: page.value.title,
      favicon: page.value.favicon || undefined,
      content: { text, format: 'text', wordCount: page.value.wordCount },
      categoryId: categoryId.value || undefined,
      tags: tags.value,
    }

    const article = await library.addArticle(input)
    isSaved.value = true

    if (generateSummary.value) {
      sendMessage({
        action: 'generateSummary',
        articleId: article.id,
        type: SummaryType.CONCISE,
        provider: settings.settings?.summaryProvider ?? AIProvider.GEMINI,
      }).catch(() => {})
    }
    if (generatePodcast.value) {
      sendMessage({ action: 'generatePodcast', articleId: article.id }).catch(() => {})
    }
    if (settings.settings?.autoGroup) {
      sendMessage({ action: 'groupArticle', articleId: article.id }).catch(() => {})
    }
    sendMessage({ action: 'articleSaved', article }).catch(() => {})

    ui.success('Saved to your library')

    if (closeTabAfterSave.value && activeTabId !== undefined) {
      setTimeout(() => activeTabId !== undefined && chrome.tabs.remove(activeTabId), 350)
    }
  } catch (err) {
    ui.error(err instanceof Error ? err.message : 'Failed to save')
  } finally {
    isSaving.value = false
  }
}

function openArticle(url: string): void {
  chrome.tabs.create({ url })
}

function openLibrary(): void {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/manager/index.html') })
}

onMounted(async () => {
  await settings.load()
  await library.load()
  generateSummary.value = settings.settings?.autoSummary ?? false
  generatePodcast.value = settings.settings?.autoPodcast ?? false

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab) {
    activeTabId = tab.id
    page.value = {
      title: tab.title || 'Untitled',
      url: tab.url || '',
      domain: safeDomain(tab.url),
      favicon: tab.favIconUrl || '',
      readingTime: 'Estimating…',
      wordCount: 0,
    }
    checkSaved()
    if (tab.id !== undefined) estimateReadingTime(tab.id)
  }
})
</script>

<style scoped>
.capture {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
}

.masthead {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.wordmark {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}
.wordmark__mark {
  color: var(--accent);
}
.wordmark__name {
  font-family: var(--font-display);
  font-weight: var(--weight-semibold);
  font-size: 1.5rem;
  letter-spacing: var(--tracking-tight);
}
.masthead__actions {
  display: flex;
  gap: 0.25rem;
}
.icon-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--rule);
  background: var(--paper-raised);
  border-radius: var(--radius);
  cursor: pointer;
  color: var(--ink-muted);
  transition: border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
}
.icon-btn:hover {
  border-color: var(--rule-strong);
  color: var(--accent);
}

.page-card {
  border: 1px solid var(--rule);
  border-radius: var(--radius-lg);
  background: var(--paper-raised);
  padding: var(--space-4);
}
.page-card__top {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
}
.page-card__favicon {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-sm);
  flex: none;
  margin-top: 2px;
}
.page-card__title {
  font-family: var(--font-display);
  font-weight: var(--weight-semibold);
  font-size: 1.15rem;
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.page-card__meta {
  margin-top: 0.35rem;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-muted);
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.field__label {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-muted);
}

.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  background: var(--paper-raised);
  padding: 0.5rem;
  transition: border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
}
.tags-input.is-focused {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-tint);
}
.tags-input__field {
  flex: 1;
  min-width: 90px;
  border: 0;
  outline: none;
  background: transparent;
  font-family: var(--font-serif);
  font-size: var(--text-base);
  color: var(--ink);
}
.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}
.suggestion {
  border: 1px dashed var(--rule-strong);
  background: none;
  border-radius: var(--radius-full);
  padding: 0.15rem 0.5rem;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-muted);
  cursor: pointer;
}
.suggestion:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.select {
  position: relative;
}
.select select {
  width: 100%;
  appearance: none;
  font-family: var(--font-serif);
  font-size: var(--text-base);
  color: var(--ink);
  background: var(--paper-raised);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  padding: 0.55rem 2rem 0.55rem 0.7rem;
  cursor: pointer;
}
.select::after {
  content: '▾';
  position: absolute;
  right: 0.7rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-faint);
  pointer-events: none;
}

.toggles {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.toggle__text {
  font-size: var(--text-base);
  color: var(--ink);
}

.saved {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: var(--space-4) 0;
  text-align: center;
}
.saved__mark {
  color: var(--accent);
}
.saved__text {
  font-family: var(--font-display);
  font-size: 1.05rem;
  color: var(--ink);
}

.footer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.footer__stats {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}
.footer__stats strong {
  color: var(--ink);
}
.recent {
  list-style: none;
  display: flex;
  flex-direction: column;
}
.recent__item {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: baseline;
  padding: 0.4rem 0;
  border-top: 1px solid var(--rule);
  cursor: pointer;
}
.recent__item:hover .recent__title {
  color: var(--accent);
}
.recent__title {
  font-size: var(--text-sm);
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recent__when {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-faint);
  flex: none;
}
.dot {
  color: var(--ink-faint);
}
</style>

<style>
body {
  width: 380px;
  min-height: 460px;
}
</style>
